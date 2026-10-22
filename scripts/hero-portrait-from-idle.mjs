// RULE (owner, 2026-10-20): a hero's portrait = FIRST FRAME OF ITS IDLE.
// Cuts frame 0 from the full-resolution idle (meta.detail atlas when present, otherwise idle page 0),
// trims transparent margins (+4% padding), writes assets/characters/<slug>/portrait-<sha8>.webp and points
// hero.json `art.portrait` at it. Re-run after any idle change. hero-doctor rejects other portraits.
// Usage: node scripts/hero-portrait-from-idle.mjs <slug> [<slug> ...]   (no args = every authored hero)
import sharp from 'sharp';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, readdirSync, existsSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const dir = join(root, 'assets/characters');
const slugs = process.argv.slice(2).length ? process.argv.slice(2)
  : readdirSync(dir).filter(s => existsSync(join(dir, s, 'hero.json')));

export async function idleFrameZero(slugDir) {
  const meta = JSON.parse(readFileSync(join(slugDir, 'runtime-meta.json'), 'utf8'));
  const idle = meta.clips.idle, src = meta.detail || { file: idle.pages[0].file, cellW: idle.cellW, cellH: idle.cellH };
  const cell = await sharp(join(slugDir, src.file)).extract({ left: 0, top: 0, width: src.cellW, height: src.cellH }).png().toBuffer();
  const trimmed = await sharp(cell).trim({ threshold: 1 }).png().toBuffer({ resolveWithObject: true });
  const pad = Math.round(Math.max(trimmed.info.width, trimmed.info.height) * 0.04);
  return sharp(trimmed.data).extend({ top: pad, bottom: pad, left: pad, right: pad, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ lossless: true }).toBuffer();
}

for (const slug of slugs) {
  const slugDir = join(dir, slug), heroPath = join(slugDir, 'hero.json');
  const hero = JSON.parse(readFileSync(heroPath, 'utf8'));
  const buf = await idleFrameZero(slugDir);
  const name = `portrait-${createHash('sha256').update(buf).digest('hex').slice(0, 8)}.webp`;
  for (const old of readdirSync(slugDir)) if (/^portrait-[0-9a-f]{8}\.webp$/.test(old) && old !== name) unlinkSync(join(slugDir, old));
  writeFileSync(join(slugDir, name), buf);
  hero.art = { ...hero.art, portrait: `assets/characters/${slug}/${name}` };
  delete hero.art.landmark; // landmark belonged to the old avatar crop
  writeFileSync(heroPath, JSON.stringify(hero, null, 2) + '\n');
  // The S+ profile module carries its own art.portrait (roster / detail surfaces read it). Scaffold generates a
  // placeholder there before the portrait exists, so keep the two in step or the roster shows a missing image.
  const modPath = join(root, 'src', 'domain', 'hero', `${slug}.mjs`);
  if (existsSync(modPath)) {
    const src = readFileSync(modPath, 'utf8');
    const next = src.replace(/portrait-[0-9a-f]{8}\.webp/g, name);
    if (next !== src) writeFileSync(modPath, next);
  }
  console.log(slug, '->', hero.art.portrait, buf.length, 'bytes');
}
