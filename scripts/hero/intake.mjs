// STEP 1 of the hero pipeline: take the owner's video bundle, prove it is complete and current, and write the
// inputs every later step reads. Never hand-write a pack manifest again.
//
//   node scripts/hero/intake.mjs --slug <slug> [--files a.mp4 b.mp4 ...] [--from <dir>] [--window-min 120]
//                                [--out C:/lt/packs] [--lock atk] [--allow-reuse] [--no-vfx]
//
// Labels come from the file names the owner uses (Telegram keeps them before "---<uuid>"):
//   states (required): idle, run, fall/falldie/die -> fall-die, hit, atk, ulti/ultimate -> ultimate
//   VFX (required unless --no-vfx): vfxatk / vfx_sfx_atk -> vfx-basic, vfxulti / vfx_sfx_ulti -> vfx-ultimate
//   optional: vfxnoitai / vfx_passive / vfx_special -> vfx-passive
// Without --files the newest clip per label in --from (default: the agent inbound folder) is used, and every
// required clip must be within --window-min minutes of the newest one (stale sources = known failure).
//
// Writes <out>/<slug>/bundle.json (probed sources) and <out>/<slug>/manifest.json (packager input, UTF-8 no BOM).
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { join, basename, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export const STATES = ['idle', 'run', 'fall-die', 'hit', 'atk', 'ultimate'];
export const VFX = ['vfx-basic', 'vfx-ultimate'];
// Order matters: VFX labels first (a "vfx_sfx_atk" file must not be read as "atk").
const RULES = [
  ['vfx-ultimate', /^vfx[_-]?(?:sfx[_-]?)?ult/i],
  ['vfx-basic', /^vfx[_-]?(?:sfx[_-]?)?atk/i],
  ['vfx-passive', /^vfx[_-]?(?:sfx[_-]?)?(?:noitai|noi[_-]?tai|passive|special)/i],
  ['idle', /^idle/i],
  ['run', /^run/i],
  ['fall-die', /^(?:fall|die)/i],
  ['hit', /^hit/i],
  ['atk', /^atk/i],
  ['ultimate', /^ult/i],
];

export function labelOf(fileName) {
  const stem = basename(fileName).replace(/---[0-9a-f-]{8,}.*$/i, '').replace(/\.[a-z0-9]+$/i, '');
  for (const [label, re] of RULES) if (re.test(stem)) return label;
  return null;
}

/** Pick one clip per label; throws with an owner-readable reason when the set is unusable. */
export function chooseBundle(candidates, { windowMin = 120, requireVfx = true } = {}) {
  const by = {};
  for (const c of candidates) {
    const label = labelOf(c.name);
    if (!label) continue;
    (by[label] ||= []).push({ ...c, label });
  }
  const pick = {};
  for (const [label, list] of Object.entries(by)) pick[label] = list.sort((a, b) => b.mtimeMs - a.mtimeMs)[0];
  const required = [...STATES, ...(requireVfx ? VFX : [])];
  const missing = required.filter(l => !pick[l]);
  if (missing.length) {
    const got = Object.keys(pick).join(', ') || '(none)';
    throw new Error(`Bộ video chưa đủ, thiếu: ${missing.join(', ')}. Đã nhận: ${got}. Chờ đủ rồi chạy lại (không pack bộ thiếu).`);
  }
  const newest = Math.max(...required.map(l => pick[l].mtimeMs));
  // An optional clip (vfx-passive) from an older set is dropped: it must not block or pollute the bundle.
  const dropped = [];
  for (const label of Object.keys(pick)) {
    if (required.includes(label)) continue;
    if (newest - pick[label].mtimeMs > windowMin * 60000) { dropped.push(`${label}=${pick[label].name}`); delete pick[label]; }
  }
  const stale = required.map(l => pick[l]).filter(c => newest - c.mtimeMs > windowMin * 60000);
  if (stale.length) {
    throw new Error(`Nguồn cũ lẫn vào bộ: ${stale.map(c => `${c.label}=${c.name} (${Math.round((newest - c.mtimeMs) / 60000)} phút trước bản mới nhất)`).join('; ')}. ` +
      'Gửi lại clip đó hoặc chỉ định --files cho đúng bộ.');
  }
  Object.defineProperty(pick, 'dropped', { value: dropped, enumerable: false });
  return pick;
}

function ffprobe(file) {
  const out = execFileSync('ffprobe', ['-v', 'error', '-print_format', 'json', '-show_streams', '-show_format', file], { encoding: 'utf8' });
  const j = JSON.parse(out);
  const v = j.streams.find(s => s.codec_type === 'video');
  if (!v) throw new Error(`${basename(file)}: không có luồng video`);
  const [num, den] = String(v.avg_frame_rate || v.r_frame_rate || '0/1').split('/').map(Number);
  return {
    width: v.width, height: v.height, fps: den ? +(num / den).toFixed(3) : 0,
    frames: Number(v.nb_frames) || null, durationMs: Math.round(Number(j.format.duration) * 1000),
    audio: j.streams.some(s => s.codec_type === 'audio'),
  };
}

async function greenScreenRatio(file) {
  const { default: sharp } = await import('sharp');
  const dir = mkdtempSync(join(tmpdir(), 'intake-'));
  try {
    const png = join(dir, 'f0.png');
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', file, '-vframes', '1', '-vf', 'scale=192:108', png]);
    const { data, info } = await sharp(png).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    let green = 0, total = 0;
    for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) {
      if (y > 6 && y < info.height - 7 && x > 6 && x < info.width - 7) continue; // border band only
      const k = (y * info.width + x) * 3, r = data[k], g = data[k + 1], b = data[k + 2];
      total++; if (g > 90 && g > r + 40 && g > b + 40) green++;
    }
    return green / total;
  } finally { rmSync(dir, { recursive: true, force: true }); }
}

const sha256 = file => createHash('sha256').update(readFileSync(file)).digest('hex');

function previouslyPacked(roots) {
  const seen = new Map();
  const scan = base => {
    if (!existsSync(base) || !statSync(base).isDirectory()) return;
    for (const p of readdirSync(base)) {
      const pm = join(base, p, 'PACK-MANIFEST.json');
      if (!existsSync(pm)) continue;
      try { for (const s of JSON.parse(readFileSync(pm, 'utf8')).states || []) if (s.sourceSha256) seen.set(s.sourceSha256, p); } catch { /* unreadable manifest */ }
    }
  };
  for (const r of roots) {
    if (!existsSync(r)) continue;
    scan(join(r, 'out'));
    for (const d of readdirSync(r)) scan(join(r, d, 'out'));
  }
  return seen;
}

async function main() {
  const argv = process.argv.slice(2);
  const val = k => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : null; };
  const slug = val('--slug');
  if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) { console.error('usage: --slug <kebab-slug> [--files ...] [--from dir]'); process.exit(2); }
  const fi = argv.indexOf('--files');
  const files = fi >= 0 ? argv.slice(fi + 1).filter(a => !a.startsWith('--')) : null;
  const from = val('--from') || join(process.env.USERPROFILE || '', 'aicoworker', 'openclaw', 'media', 'inbound');
  const outRoot = resolve(val('--out') || 'C:/lt/packs');
  const windowMin = Number(val('--window-min') || 120);
  const requireVfx = !argv.includes('--no-vfx');
  const allowReuse = argv.includes('--allow-reuse');
  const lock = (val('--lock') || 'atk').split(',').filter(Boolean);

  const paths = files ? files.map(f => resolve(f)) : readdirSync(from).filter(n => /\.(mp4|mov|webm)$/i.test(n)).map(n => join(from, n));
  const candidates = paths.map(p => ({ path: p, name: basename(p), mtimeMs: statSync(p).mtimeMs }));
  if (files) for (const c of candidates) if (!labelOf(c.name)) throw new Error(`Không nhận ra nhãn của ${c.name} (đặt tên theo idle/run/fall/hit/atk/ulti/vfxatk/vfxulti)`);
  const pick = chooseBundle(candidates, { windowMin: files ? Infinity : windowMin, requireVfx });

  const warnings = pick.dropped.map(d => `bỏ clip tuỳ chọn cũ ${d} (không cùng bộ)`), errors = [];
  const reuse = previouslyPacked(['C:/lt/packs', 'C:/lt/pack7', 'C:/lt/pack-tinh-mac', 'C:/lt/pack-van-phong'].map(p => resolve(p)));
  const sources = {};
  for (const [label, c] of Object.entries(pick)) {
    const info = ffprobe(c.path);
    const digest = sha256(c.path);
    const green = await greenScreenRatio(c.path);
    sources[label] = { path: c.path, name: c.name, sha256: digest, ...info, greenBorder: +green.toFixed(3) };
    if (info.width !== 1920 || info.height !== 1080) errors.push(`${label}: ${info.width}x${info.height}, cần 1920x1080`);
    if (Math.abs(info.fps - 24) > 0.05) warnings.push(`${label}: ${info.fps} fps (chuẩn 24 fps)`);
    if (green < 0.8) errors.push(`${label}: viền khung đầu chỉ ${(green * 100).toFixed(0)}% là phông xanh (cần nền xanh để key)`);
    if (STATES.includes(label) && info.durationMs < 1000) errors.push(`${label}: chỉ ${info.durationMs}ms`);
    if (reuse.has(digest)) (allowReuse ? warnings : errors).push(`${label}: file này đã dùng cho pack ${reuse.get(digest)} (nguồn cũ?)${allowReuse ? '' : ', thêm --allow-reuse nếu cố ý pack lại'}`);
  }
  if (!sources['vfx-basic'] || !sources['vfx-ultimate']) warnings.push('không có clip VFX: tướng sẽ không có projectile/area VFX cho tới khi bổ sung');

  const dir = join(outRoot, slug);
  mkdirSync(dir, { recursive: true });
  const bundle = { schema: 'luc-than-hero-bundle/v1', slug, createdAt: new Date().toISOString(), sources, warnings, errors };
  writeFileSync(join(dir, 'bundle.json'), JSON.stringify(bundle, null, 2) + '\n', 'utf8');
  for (const w of warnings) console.log('WARN ' + w);
  if (errors.length) {
    for (const e of errors) console.log('ERROR ' + e);
    console.log(`INTAKE FAIL: ${join(dir, 'bundle.json')}`);
    process.exit(1);
  }
  const manifest = {
    states: Object.fromEntries(STATES.map(s => [s, sources[s].path])),
    packName: `${slug}-6state`,
    outputRoot: join(dir, 'out'),
    blenderExecutable: process.env.BLENDER_PATH || 'C:\\Program Files\\Blender Foundation\\Blender 5.1\\blender.exe',
    fixedAnchorStates: lock,
  };
  writeFileSync(join(dir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n', 'utf8'); // Node writes no BOM
  for (const [l, s] of Object.entries(sources)) console.log(`  ${l.padEnd(12)} ${s.name}  ${s.width}x${s.height} ${s.fps}fps ${s.durationMs}ms audio=${s.audio}`);
  console.log(`INTAKE PASS: ${join(dir, 'manifest.json')}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(e => { console.error('INTAKE FAIL: ' + e.message); process.exit(1); });
}
