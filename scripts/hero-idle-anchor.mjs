// Anchor the idle loop: measure the alpha foot line of every frame in the hero-detail
// atlas and store a per-frame vertical offset so the feet stay planted.
//
//   node scripts/hero-idle-anchor.mjs            # all heroes with a detail atlas
//   node scripts/hero-idle-anchor.mjs tinh-mac   # one hero
//
// Writes runtime-meta.json -> detail.footOffsets (device px of the FULL-res detail cell)
// and idle.footOffsets (device px of the budget-scaled battle cell).
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const ALPHA = 24;
const ROOT = 'assets/characters';

async function frameFootLines(file, cols, cellW, cellH, frames) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width;
  const lines = [];
  for (let i = 0; i < frames; i++) {
    const cx = (i % cols) * cellW;
    const cy = Math.floor(i / cols) * cellH;
    let foot = -1;
    for (let y = cellH - 1; y >= 0; y--) {
      let found = false;
      for (let x = 0; x < cellW; x++) {
        const a = data[((cy + y) * W + (cx + x)) * 4 + 3];
        if (a > ALPHA) { found = true; break; }
      }
      if (found) { foot = y; break; }
    }
    lines.push(foot);
  }
  return { lines, W, H: info.height };
}

function offsets(lines) {
  const valid = lines.filter((v) => v >= 0);
  if (!valid.length) return lines.map(() => 0);
  const base = Math.max(...valid);
  return lines.map((v) => (v < 0 ? 0 : base - v));
}

async function anchorHero(slug) {
  const dir = join(ROOT, slug);
  const metaPath = join(dir, 'runtime-meta.json');
  if (!existsSync(metaPath)) return null;
  const meta = JSON.parse(readFileSync(metaPath, 'utf8'));
  const det = meta.detail;
  if (!det?.file) return null;

  const detailFile = join(dir, det.file);
  const det_ = await frameFootLines(detailFile, det.cols, det.cellW, det.cellH, det.frames);
  det.footOffsets = offsets(det_.lines);

  const idle = meta.clips?.idle;
  if (idle?.pages?.[0]) {
    const page = idle.pages[0];
    const battleFile = join(dir, page.file);
    const b = await frameFootLines(battleFile, page.cols, idle.cellW, idle.cellH, idle.frames);
    idle.footOffsets = offsets(b.lines);
  }

  writeFileSync(metaPath, JSON.stringify(meta, null, 2) + '\n');
  const span = Math.max(...det_.lines) - Math.min(...det_.lines.filter((v) => v >= 0));
  const maxOff = Math.max(...det.footOffsets);
  return { slug, span, maxOff, frames: det.frames };
}

const only = process.argv.slice(2);
const slugs = only.length ? only : readdirSync(ROOT);
const rows = [];
for (const slug of slugs) {
  const r = await anchorHero(slug);
  if (r) rows.push(r);
}
for (const r of rows) {
  console.log(`${r.slug.padEnd(20)} frames=${r.frames} foot-span=${String(r.span).padStart(2)}px  max offset=${r.maxOff}px`);
}
console.log(`\n${rows.length} hero(es) anchored.`);
