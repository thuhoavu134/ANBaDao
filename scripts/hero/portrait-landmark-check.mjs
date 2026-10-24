// STEP 9b (integrate-hero): the roster card is framed by a face landmark (docs/ROSTER-PORTRAIT-STANDARD.md).
// The portrait step writes portrait-<hash>.webp but cannot know where the face is, and from Bé An on nine heroes
// shipped without one and showed their whole body tiny on the Tướng screen (owner 2026-10-24). This gate stops the
// pipeline until a reviewed landmark exists, and writes a 1%-grid sheet of the head so measuring takes a minute.
// usage: node scripts/hero/portrait-landmark-check.mjs <slug>
import { existsSync, readFileSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import sharp from 'sharp';
import { rosterPortraitLandmark } from '../../src/domain/hero/roster-portrait.mjs';

const root = resolve(new URL('../..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const slug = process.argv[2];
if (!slug) { console.error('usage: portrait-landmark-check.mjs <slug>'); process.exit(2); }
const heroPath = join(root, 'assets', 'characters', slug, 'hero.json');
if (!existsSync(heroPath)) { console.error(`LANDMARK FAIL: ${heroPath} missing`); process.exit(1); }
const hero = JSON.parse(readFileSync(heroPath, 'utf8'));
const portrait = hero.art?.portrait;
if (!portrait) { console.error('LANDMARK FAIL: hero.json has no art.portrait'); process.exit(1); }
const point = rosterPortraitLandmark(portrait);
if (point) { console.log(`LANDMARK PASS ${portrait} -> [${point.join(',')}]`); process.exit(0); }

// No landmark: render the head region with a 1% grid of the FULL image so the reviewer reads x/y/width directly.
const file = join(root, portrait);
const img = sharp(file);
const { width: W, height: H } = await img.metadata();
const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
let x0 = W, y0 = H, x1 = -1, y1 = -1;
for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) {
  if (data[(y * info.width + x) * 4 + 3] > 60) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
}
const top = Math.max(0, y0), bottom = Math.min(H, y0 + Math.round((y1 - y0) * 0.55));
const scale = 3, cw = (x1 - x0 + 1) * scale, ch = (bottom - top) * scale;
let lines = '';
for (let p = 0; p <= 100; p += 2) {
  const X = ((W * p / 100) - x0) * scale, Y = ((H * p / 100) - top) * scale, major = p % 10 === 0;
  if (X >= 0 && X <= cw) lines += `<line x1="${X}" y1="0" x2="${X}" y2="${ch}" stroke="${major ? '#ff3c3c' : '#ffa0a0'}" stroke-opacity="${major ? 1 : .45}" stroke-width="${major ? 2 : 1}"/>` + (major ? `<text x="${X + 3}" y="14" fill="#ffff00" font-size="14">x${p}</text>` : '');
  if (Y >= 0 && Y <= ch) lines += `<line x1="0" y1="${Y}" x2="${cw}" y2="${Y}" stroke="${major ? '#3ca0ff' : '#a0c8ff'}" stroke-opacity="${major ? 1 : .45}" stroke-width="${major ? 2 : 1}"/>` + (major ? `<text x="3" y="${Y + 15}" fill="#00ffff" font-size="14">y${p}</text>` : '');
}
const outDir = join(root, 'docs', 'qa', 'integrate'); mkdirSync(outDir, { recursive: true });
const out = join(outDir, `${slug}-portrait-grid.png`);
const head = await sharp(file).extract({ left: x0, top, width: x1 - x0 + 1, height: bottom - top }).resize(cw, ch).png().toBuffer();
await sharp({ create: { width: cw, height: ch, channels: 4, background: '#282828' } })
  .composite([{ input: head }, { input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${cw}" height="${ch}">${lines}</svg>`) }])
  .png().toFile(out);
const key = portrait.replace(/portrait-[0-9a-f]+\.webp$/, 'portrait-*.webp');
console.error(`LANDMARK FAIL: no reviewed face landmark for ${portrait}.
  Open ${out} (1% grid of the full image), read the eye centre (x,y %) and cheek-to-cheek width (%),
  then add to ROSTER_PORTRAIT_LANDMARKS in src/domain/hero/roster-portrait.mjs:
    '${key}':[eyeX,eyeY,faceWidth],
  Masked/blindfolded authored heroes: use the centre of the band, never paint eyes. Re-run integrate-hero afterwards.`);
process.exit(1);
