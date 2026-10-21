// Idle anchoring — the canonical step of the hero pack pipeline.
//
// The packager crops every state with ONE shared cell ("uniform framing"), but the source idle
// animation lifts/shifts the feet by 10-14px between frames, so the character bobs in the
// hero-detail screen (owner report 2026-10-22). We measure the alpha foot line of every frame
// once and store a per-frame offset; the renderer adds it back so the feet stay planted.
//
//   import { footOffsetsFor, anchorHero } from './hero-idle-anchor.mjs';
//   node scripts/hero-idle-anchor.mjs            # backfill every hero
//   node scripts/hero-idle-anchor.mjs tinh-mac   # one hero
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

export const ALPHA = 24;
const ROOT = 'assets/characters';

/** Alpha foot line (last opaque row) of every cell in an atlas. */
export async function frameFootLines(file, cols, cellW, cellH, frames) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width;
  const lines = [];
  for (let i = 0; i < frames; i++) {
    const cx = (i % cols) * cellW;
    const cy = Math.floor(i / cols) * cellH;
    let foot = -1;
    for (let y = cellH - 1; y >= 0 && foot < 0; y--) {
      for (let x = 0; x < cellW; x++) {
        if (data[((cy + y) * W + (cx + x)) * 4 + 3] > ALPHA) { foot = y; break; }
      }
    }
    lines.push(foot);
  }
  return lines;
}

/** Offset per frame so every frame's foot sits on the lowest (baseline) foot line. */
export function offsetsFrom(lines) {
  const valid = lines.filter((v) => v >= 0);
  if (!valid.length) return lines.map(() => 0);
  const base = Math.max(...valid);
  return lines.map((v) => (v < 0 ? 0 : base - v));
}

export async function footOffsetsFor({ file, cols, cellW, cellH, frames }) {
  return offsetsFrom(await frameFootLines(file, cols, cellW, cellH, frames));
}

/** Backfill one hero's runtime-meta.json (detail atlas + budget-scaled idle page). */
export async function anchorHero(slug, root = ROOT) {
  const dir = join(root, slug);
  const metaPath = join(dir, 'runtime-meta.json');
  if (!existsSync(metaPath)) return null;
  const meta = JSON.parse(readFileSync(metaPath, 'utf8'));
  const det = meta.detail;
  if (!det?.file) return null;

  const detLines = await frameFootLines(join(dir, det.file), det.cols, det.cellW, det.cellH, det.frames);
  det.footOffsets = offsetsFrom(detLines);

  const idle = meta.clips?.idle;
  if (idle?.pages?.[0]) {
    const page = idle.pages[0];
    const lines = await frameFootLines(join(dir, page.file), page.cols, idle.cellW, idle.cellH, idle.frames);
    idle.footOffsets = offsetsFrom(lines);
  }

  writeFileSync(metaPath, JSON.stringify(meta, null, 2) + '\n');
  const valid = detLines.filter((v) => v >= 0);
  return { slug, span: Math.max(...valid) - Math.min(...valid), maxOff: Math.max(...det.footOffsets), frames: det.frames };
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`) {
  const only = process.argv.slice(2);
  const slugs = only.length ? only : readdirSync(ROOT);
  let n = 0;
  for (const slug of slugs) {
    const r = await anchorHero(slug);
    if (!r) continue;
    n++;
    console.log(`${r.slug.padEnd(20)} frames=${r.frames} foot-span=${String(r.span).padStart(2)}px  max offset=${r.maxOff}px`);
  }
  console.log(`\n${n} hero(es) anchored.`);
}
