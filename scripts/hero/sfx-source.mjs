// STEP: fill every hero SFX role the clip audio could not supply, in this order:
//   1. the owner's own clip audio  (already cut by scripts/hero/extract_sfx.py — kept as-is)
//   2. the Kiếm Thế SKILLPACK      (code pinned in the brief, else auto-picked by element -> sect -> role)
//   3. the local Pixabay library   (assets/audio/sfx/_pixabay, downloaded by the agent through the browser,
//                                   listed in its index.json with tags — the pipeline has no browser itself)
//   4. a todo row                  (C:/lt/packs/<slug>/sfx-todo.json) so nothing is silently dropped.
//
//   node scripts/hero/sfx-source.mjs --bundle <bundle.json> --slug <slug> --key <hero_key> [--brief <json>]
//                                     [--root <repo>] [--skillpack <json>] [--zip <zip>] [--pixabay <dir>]
//
// Writes assets/audio/sfx/<slug>/<role>.wav (mono 44.1 kHz s16), merges assets/vfx/<slug>/provenance.json["sfx"],
// rewrites C:/lt/packs/<slug>/sfx-rows.json for scaffold.mjs, and fails when basic/ultimate still have no cue.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROLES, planRole, todoRows, coverage, sectFor } from './sfx-lib.mjs';

// JSON files on this machine often carry a UTF-8 BOM; strip it before parsing.
const readJson = f => JSON.parse(readFileSync(f, 'utf8').replace(/^\uFEFF/, ''));
const args = {};
for (let i = 2; i < process.argv.length; i += 2) args[process.argv[i].replace(/^--/, '')] = process.argv[i + 1];
const root = resolve(args.root || join(dirname(fileURLToPath(import.meta.url)), '..', '..'));
const slug = args.slug, key = args.key;
if (!slug || !key) { console.error('usage: --bundle <json> --slug <slug> --key <hero_key> [--brief <json>]'); process.exit(2); }

const bundlePath = resolve(args.bundle);
const packDir = dirname(bundlePath);
// The catalogue lives with the agent (same place scripts/search-skillpack.py looks), not in the game repo.
const skillpackCandidates = [process.env.KIEMTHE_SKILLPACK, args.skillpack,
  join(root, 'knowledge', 'kiemthe-skillpack', 'data', 'skillpack.json'),
  'C:/Users/Admin/aicoworker/openclaw/workspace-main/knowledge/kiemthe-skillpack/data/skillpack.json'].filter(Boolean).map(x => resolve(x));
const skillpackPath = skillpackCandidates.find(existsSync);
const zipPath = resolve(args.zip || process.env.KIEMTHE_SKILLPACK_ZIP || 'C:/Users/Admin/Downloads/FULL_KIEMTHECHUAN/KIEMTHE-VFX-SFX-FULL-20261017.zip');
const pixabayDir = resolve(args.pixabay || join(root, 'assets', 'audio', 'sfx', '_pixabay'));
const brief = args.brief && existsSync(resolve(args.brief)) ? readJson(resolve(args.brief)) : null;
const skillpack = skillpackPath ? readJson(skillpackPath) : { sfx: [] };
if (!skillpackPath) console.log('WARN không thấy skillpack.json (đặt KIEMTHE_SKILLPACK=<đường dẫn>) — chỉ còn clip + Pixabay');
const pixabayIndex = existsSync(join(pixabayDir, 'index.json')) ? readJson(join(pixabayDir, 'index.json')) : { items: [] };

const outDir = join(root, 'assets', 'audio', 'sfx', slug);
mkdirSync(outDir, { recursive: true });
const prefix = key.replace(/_/g, '-');
const rowsPath = join(packDir, 'sfx-rows.json');
const previous = existsSync(rowsPath) ? readJson(rowsPath) : { cues: {}, skipped: [] };
// A row from an earlier run whose file is gone (e.g. produced in a worktree) must not count as covered.
const stale = Object.entries(previous.cues || {}).filter(([, r]) => !existsSync(join(root, 'assets', 'audio', 'sfx', r.file || ''))).map(([c]) => c);
const cues = Object.fromEntries(Object.entries(previous.cues || {}).filter(([c]) => !stale.includes(c)));
if (stale.length) console.log(`bỏ ${stale.length} cue cũ vì file không còn: ${stale.join(', ')}`);
const skipped = [...(previous.skipped || [])];

const probe = file => {
  const j = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-print_format', 'json', '-show_format', '-show_streams', file], { encoding: 'utf8' }));
  const a = (j.streams || []).find(s => s.codec_type === 'audio') || {};
  return { durationMs: Math.round(Number(j.format?.duration || 0) * 1000), sampleRate: Number(a.sample_rate) || 0, channels: Number(a.channels) || 0 };
};
const toWav = (src, dst) => execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', src, '-vn', '-ac', '1', '-ar', '44100', '-c:a', 'pcm_s16le', dst]);
const sha = f => createHash('sha256').update(readFileSync(f)).digest('hex');

/** Pull one file out of the SKILLPACK zip (bsdtar reads zip; no zip parser needed). */
function extractFromZip(entry, dst) {
  const tmp = mkdtempSync(join(tmpdir(), 'sfxpack-'));
  try {
    execFileSync('tar', ['-x', '-f', zipPath, '-C', tmp, `SKILLPACK/${entry}`]);
    const got = join(tmp, 'SKILLPACK', entry);
    if (!existsSync(got)) throw new Error(`zip entry missing: SKILLPACK/${entry}`);
    toWav(got, dst);
  } finally { rmSync(tmp, { recursive: true, force: true }); }
}

const plans = {};
for (const { role } of ROLES) {
  const dst = join(outDir, `${role}.wav`);
  const cue = `${prefix}-${role}`;
  const have = existsSync(dst) && cues[cue] ? dst : null;
  const plan = planRole(role, { have, brief, sects: skillpack.phai || {}, skillpack, pixabayIndex, used: new Set(Object.values(plans).filter(p => p.code).map(p => p.code)) });
  plans[role] = plan;
  if (plan.action === 'keep') { console.log(`${cue.padEnd(26)} giữ tiếng clip`); continue; }
  if (plan.action === 'kiemthe') {
    const entry = (skillpack.sfx || []).find(e => e.ma === plan.code);
    if (!entry?.file) { plans[role] = { action: 'todo', keywords: [role], why: `mã ${plan.code} không có trong kho` }; continue; }
    extractFromZip(entry.file, dst);
    const info = probe(dst);
    cues[cue] = { file: `${slug}/${role}.wav`, source: `SKILLPACK/${entry.file}`, sha256: sha(dst), ...info,
      provenance: `Kiếm Thế SKILLPACK ${plan.code} (${plan.why}); owner review pending` };
    console.log(`${cue.padEnd(26)} ${plan.code}  ← kho Kiếm Thế`);
    continue;
  }
  if (plan.action === 'pixabay') {
    const src = join(pixabayDir, plan.file);
    if (!existsSync(src)) { plans[role] = { action: 'todo', keywords: [role], why: `thiếu file thư viện ${plan.file}` }; continue; }
    toWav(src, dst);
    const info = probe(dst);
    cues[cue] = { file: `${slug}/${role}.wav`, source: `pixabay:${plan.file}`, sha256: sha(dst), ...info,
      provenance: `Pixabay (${plan.why}); owner review pending` };
    console.log(`${cue.padEnd(26)} ${plan.file}  ← thư viện Pixabay`);
    continue;
  }
  console.log(`${cue.padEnd(26)} THIẾU — cần tải: ${plan.keywords.join(', ')}`);
}

const todo = todoRows(plans);
const skippedOut = [...new Set([...skipped.filter(s => !todo.some(t => s.startsWith(t.role + ':'))), ...todo.map(t => `${t.role}: ${t.why} — tải Pixabay: ${t.search.join(', ')}`)])];

writeFileSync(rowsPath, JSON.stringify({ cues, skipped: skippedOut, todo }, null, 2) + '\n', 'utf8');

const provPath = join(root, 'assets', 'vfx', slug, 'provenance.json');
mkdirSync(dirname(provPath), { recursive: true });
const prov = existsSync(provPath) ? readJson(provPath) : { source: {}, clips: {} };
prov.source = { ...(prov.source || {}), sfx: 'clip audio (extract_sfx.py) + Kiếm Thế SKILLPACK + Pixabay library (sfx-source.mjs)' };
prov.sfx = cues;
writeFileSync(provPath, JSON.stringify(prov, null, 2) + '\n', 'utf8');

const cov = coverage(cues);
console.log(`sfx-source: ${Object.keys(cues).length} cue (${Object.values(plans).filter(p => p.action === 'keep').length} từ clip, ${Object.values(plans).filter(p => p.action === 'kiemthe').length} kho, ${Object.values(plans).filter(p => p.action === 'pixabay').length} pixabay, ${todo.length} thiếu)`);
if (!cov.ok) {
  console.log(`SFX SOURCE FAIL: thiếu cue cho ${cov.basic ? '' : 'đòn thường '}${cov.ultimate ? '' : 'tuyệt kỹ'}`.trim());
  console.log('  Tải file vào assets/audio/sfx/_pixabay/ rồi ghi tags vào index.json (hoặc ghim mã trong brief), chạy lại bước này.');
  process.exit(1);
}
console.log('SFX SOURCE PASS');
