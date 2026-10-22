// Idle anchoring — the canonical step of the hero pack pipeline.
//
// Measured on the source idle (Nguyệt Diệp, 1920x1080, 96 frames): the animation is NOT uniform.
// Frames 57-82 hold the feet still (Y span 2px, X span 3.7px of 1080), while frames 24-47 shift the
// stance 284px sideways. The pack samples the whole clip evenly, so the hero-detail loop mixes both
// and the character bobs + slides (owner report 2026-10-22).
//
// So the detail screen (one hero, no battle context) plays the STABLE window of the idle and
// compensates the remaining per-frame foot offset; the battle keeps the full clip untouched.
//
//   import { footPointsFor, stableWindow, anchorHero } from './hero-idle-anchor.mjs';
//   node scripts/hero-idle-anchor.mjs            # backfill every hero
//   node scripts/hero-idle-anchor.mjs tinh-mac   # one hero
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import sharp from 'sharp';

export const ALPHA = 24;
export const FOOT_BAND = 10;
const ROOT = 'assets/characters';

/** Foot line (Y) and foot centroid (X) of every cell in an atlas. */
export async function frameFootPoints(file, cols, cellW, cellH, frames) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width;
  const MIN_ROW_PX = Math.max(4, Math.round(cellW * 0.02));
  const points = [];
  for (let i = 0; i < frames; i++) {
    const cx = (i % cols) * cellW;
    const cy = Math.floor(i / cols) * cellH;
    let foot = -1;
    for (let y = cellH - 1; y >= 0 && foot < 0; y--) {
      let n = 0;
      for (let x = 0; x < cellW; x++) {
        if (data[((cy + y) * W + (cx + x)) * 4 + 3] > ALPHA) n++;
        if (n >= MIN_ROW_PX) { foot = y; break; }
      }
    }
    if (foot < 0) { points.push(null); continue; }
    let sumX = 0, sumW = 0;
    for (let y = Math.max(0, foot - FOOT_BAND); y <= foot; y++) {
      for (let x = 0; x < cellW; x++) {
        const a = data[((cy + y) * W + (cx + x)) * 4 + 3];
        if (a > ALPHA) { sumX += x * a; sumW += a; }
      }
    }
    points.push({ x: sumW ? sumX / sumW : cellW / 2, y: foot });
  }
  return points;
}

/** Longest contiguous run of frames whose feet stay put — the loop the detail screen should play. */
export function stableWindow(points, { maxY = 3, maxX = 6, minLen = 8 } = {}) {
  const valid = points.map((p, i) => (p ? i : -1)).filter((i) => i >= 0);
  let best = null;
  for (let a = 0; a < valid.length; a++) {
    for (let b = a + minLen - 1; b < valid.length; b++) {
      const seg = valid.slice(a, b + 1);
      const ys = seg.map((i) => points[i].y);
      const xs = seg.map((i) => points[i].x);
      if (Math.max(...ys) - Math.min(...ys) > maxY) break;
      if (Math.max(...xs) - Math.min(...xs) > maxX) break;
      if (!best || seg.length > best.count) best = { start: valid[a], count: seg.length };
    }
  }
  return best || { start: 0, count: points.length };
}

/** dy per frame that puts the foot line of every frame on the lowest line. */
export function offsetsFrom(points) {
  const valid = points.filter(Boolean);
  if (!valid.length) return points.map(() => 0);
  const base = Math.max(...valid.map((p) => p.y));
  return points.map((p) => (p ? base - p.y : 0));
}

export async function footPointsFor({ file, cols, cellW, cellH, frames }) {
  return frameFootPoints(file, cols, cellW, cellH, frames);
}

export async function anchorHero(slug, root = ROOT) {
  const dir = join(root, slug);
  const metaPath = join(dir, 'runtime-meta.json');
  if (!existsSync(metaPath)) return null;
  const meta = JSON.parse(readFileSync(metaPath, 'utf8'));
  const det = meta.detail;
  if (!det?.file) return null;

  const pts = await frameFootPoints(join(dir, det.file), det.cols, det.cellW, det.cellH, det.frames);
  det.footOffsets = offsetsFrom(pts);
  det.idleWindow = stableWindow(pts);

  const idle = meta.clips?.idle;
  if (idle?.pages?.[0]) {
    const page = idle.pages[0];
    const bp = await frameFootPoints(join(dir, page.file), page.cols, idle.cellW, idle.cellH, idle.frames);
    idle.footOffsets = offsetsFrom(bp);
    idle.idleWindow = stableWindow(bp, { maxY: 2, maxX: 3, minLen: 8 });
  }

  writeFileSync(metaPath, JSON.stringify(meta, null, 2) + '\n');

  const w = det.idleWindow;
  const seg = pts.slice(w.start, w.start + w.count).filter(Boolean);
  const afterY = seg.map((p, i) => p.y + det.footOffsets[w.start + i]);
  return {
    slug,
    frames: det.frames,
    window: `${w.start}+${w.count}/${det.frames}`,
    inY: Math.max(...seg.map((p) => p.y)) - Math.min(...seg.map((p) => p.y)),
    inX: +(Math.max(...seg.map((p) => p.x)) - Math.min(...seg.map((p) => p.x))).toFixed(1),
    afterY: Math.max(...afterY) - Math.min(...afterY),
  };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const only = process.argv.slice(2);
  const slugs = only.length ? only : readdirSync(ROOT);
  let n = 0;
  for (const slug of slugs) {
    const r = await anchorHero(slug);
    if (!r) continue;
    n++;
    console.log(`${r.slug.padEnd(20)} window ${r.window.padEnd(10)} feet in-window X${r.inX}px Y${r.inY}px -> after dy Y${r.afterY}px`);
  }
  console.log(`\n${n} hero(es) anchored.`);
}
