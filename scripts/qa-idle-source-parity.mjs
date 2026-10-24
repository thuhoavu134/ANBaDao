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

// Horizontal span of the LARGEST connected blob of a mask (grid cells of GRID px). Burnt-in overlays (the "#00FF00"
// caption at the left edge, the Gemini icon at the right) are detached blobs: counting every non-green pixel made the
// video side measure the caption instead of the hero (left edge "video 0.0px"), so the gate failed on a clean pack.
// Both sides must be quantised at the SAME scale: the atlas is already at pack scale, the video is not.
function largestSpan(isInk, width, height, GRID = 1) {
  const tw = Math.ceil(width / GRID), th = Math.ceil(height / GRID);
  const ink = new Uint8Array(tw * th);
  for (let y = 0; y < th; y++) for (let x = 0; x < tw; x++) ink[y * tw + x] = isInk(x * GRID, y * GRID) ? 1 : 0;
  const seen = new Uint8Array(tw * th);
  let best = null;
  const parts = [];
  for (let s = 0; s < tw * th; s++) {
    if (!ink[s] || seen[s]) continue;
    const q = [s]; seen[s] = 1; let area = 0, l = Infinity, r = -1;
    while (q.length) {
      const j = q.pop(); area++; const x = j % tw, y = (j - x) / tw;
      if (x < l) l = x; if (x > r) r = x;
      for (let yy = y - 1; yy <= y + 1; yy++) for (let xx = x - 1; xx <= x + 1; xx++) {
        if (yy < 0 || yy >= th || xx < 0 || xx >= tw) continue;
        const k = yy * tw + xx; if (ink[k] && !seen[k]) { seen[k] = 1; q.push(k); }
      }
    }
    parts.push({ area, l, r });
    if (!best || area > best.area) best = { area, l, r };
  }
  if (!best) return [0, 0, 0];
  // The hero can be split into several blobs (body + a big glowing bow). Taking only the largest made the measurement
  // hop between them from frame to frame (Lăng Nguyệt: atlas "moved x19" while the pack was actually still). Union
  // every blob that is at least 15% of the largest; tiny strays stay ignored.
  const keep = parts.filter(p => p.area >= best.area * 0.15);
  let l = Infinity, r = -1;
  for (const p of keep) { if (p.l < l) l = p.l; if (p.r > r) r = p.r; }
  const L = l * GRID, R = r * GRID + GRID - 1;
  return [L, R, (L + R) / 2];
}

async function boxAtlas() {
  const { data, info } = await sharp(join(packDir, 'idle', page.file)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return meta.frames.map((_, i) => {
    const ox = (i % cols) * cellW, oy = Math.floor(i / cols) * cellH;
    // Solid body only: semi-transparent smoke / petals over a green screen still read as green on the video side,
    // so counting them on the atlas side compared two different things (idle_7: left edge x3.0 from smoke alone).
    return largestSpan((x, y) => data[((oy + y) * info.width + ox + x) * 4 + 3] > 60, cellW, cellH, 1);
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
      const [l, r] = largestSpan((x, y) => {
        const k = (y * info.width + x) * 3, R = data[k], G = data[k + 1], B = data[k + 2];
        const dark = R < 14 && G < 14 && B < 14;            // capture padding is not the hero either
        return !(G > 90 && G > R + 40 && G > B + 40) && !dark;
      }, info.width, info.height, Math.max(1, Math.round(1 / scale)));
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
