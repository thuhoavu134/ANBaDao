// QA gate: does the packed idle move like the source video, or did packing ADD shake?
//
// Root cause found 2026-10-22: the uniform packager used a per-frame body anchor for idle, so heroes with a
// swinging sword/tassel/hem in the bottom band slid sideways (Nguyệt Diệp right edge x5.9 vs the video,
// Tịnh Mặc body centre x2.6) while the owner's video was smooth. This script compares, on the SAME loop frames,
// the frame-to-frame motion of the silhouette (left edge, right edge, body centre) in the source video (green
// screen, scaled to the pack scale) and in the packed idle atlas.
//
//   node scripts/qa-idle-source-parity.mjs <packDir> [videoPath] [--max 1.5]
//   -> prints a table + PASS/FAIL; exit 1 when any metric moves more than <max> x the video (+2px slack).
import { readFileSync, mkdtempSync, readdirSync, rmSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import sharp from 'sharp';

const args = process.argv.slice(2);
const packDir = args[0];
if (!packDir) { console.error('usage: <packDir> [videoPath] [--max 1.5]'); process.exit(2); }
const maxIdx = args.indexOf('--max');
const MAX = maxIdx >= 0 ? Number(args[maxIdx + 1]) : 1.5;
const SLACK_PX = 2;
const meta = JSON.parse(readFileSync(join(packDir, 'idle', 'metadata.json'), 'utf8'));
let video = args[1] && !args[1].startsWith('--') ? args[1] : null;
if (!video) {
  const pm = JSON.parse(readFileSync(join(packDir, 'PACK-MANIFEST.json'), 'utf8'));
  const name = (pm.states || []).find(s => s.state === 'idle')?.source || meta.sourceName;
  const candidates = [join(process.env.USERPROFILE || '', 'aicoworker', 'openclaw', 'media', 'inbound', name), join(packDir, '..', name)];
  video = candidates.find(existsSync);
  if (!video) { console.error(`source video ${name} not found; pass it as the 2nd argument`); process.exit(2); }
}

const scale = meta.crop.uniformScale;
const [cellW, cellH] = meta.crop.cell;
const page = meta.atlasPages[0];
const cols = page.columns;

async function boxAtlas() {
  const { data, info } = await sharp(join(packDir, 'idle', page.file)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return meta.frames.map((_, i) => {
    const ox = (i % cols) * cellW, oy = Math.floor(i / cols) * cellH;
    let l = Infinity, r = -1;
    for (let y = 0; y < cellH; y++) for (let x = 0; x < cellW; x++) {
      if (data[((oy + y) * info.width + ox + x) * 4 + 3] > 24) { if (x < l) l = x; if (x > r) r = x; }
    }
    return [l, r, (l + r) / 2];
  });
}

async function boxVideo() {
  const dir = mkdtempSync(join(tmpdir(), 'idle-parity-'));
  try {
    execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', video, join(dir, '%04d.png')]);
    const files = readdirSync(dir).filter(f => f.endsWith('.png')).sort();
    const out = [];
    for (const f of meta.frames) {
      const file = join(dir, files[f.sourceFrameIndex]);
      const { data, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
      let l = Infinity, r = -1;
      for (let y = 0; y < info.height; y += 2) for (let x = 0; x < info.width; x++) {
        const k = (y * info.width + x) * 3, R = data[k], G = data[k + 1], B = data[k + 2];
        const green = G > 90 && G > R + 40 && G > B + 40;
        if (!green) { if (x < l) l = x; if (x > r) r = x; }
      }
      out.push([l * scale, r * scale, (l + r) / 2 * scale]);
    }
    return out;
  } finally { rmSync(dir, { recursive: true, force: true }); }
}

const motion = (rows, k) => {
  let total = 0, peak = 0;
  for (let i = 1; i < rows.length; i++) { const d = Math.abs(rows[i][k] - rows[i - 1][k]); total += d; peak = Math.max(peak, d); }
  return { total, peak };
};

const A = await boxAtlas();
const S = await boxVideo();
let pass = true;
console.log(`idle parity: ${basename(packDir)}  vs  ${basename(video)}  (${meta.frames.length} loop frames, scale ${scale})`);
for (const [k, name] of [[0, 'left edge'], [1, 'right edge'], [2, 'body centre']]) {
  const s = motion(S, k), a = motion(A, k);
  const limit = s.total * MAX + SLACK_PX * (A.length - 1) * 0.15;
  const ok = a.total <= limit;
  if (!ok) pass = false;
  console.log(`  ${name.padEnd(12)} video ${s.total.toFixed(1).padStart(6)}px (max ${s.peak.toFixed(1)})  atlas ${a.total.toFixed(1).padStart(6)}px (max ${a.peak.toFixed(1)})  x${(a.total / Math.max(s.total, 0.01)).toFixed(1)}  ${ok ? 'ok' : 'SHAKE'}`);
}
console.log(pass ? 'IDLE PARITY PASS' : `IDLE PARITY FAIL — packing adds motion the video does not have (limit x${MAX}). Re-pack with idle anchor locked.`);
process.exit(pass ? 0 : 1);
