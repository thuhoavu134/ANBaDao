import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const sharp = require('/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');

const root = path.resolve(import.meta.dirname, '..');
const upload = path.resolve(root, '..', 'upload');
const scale = Math.max(1, Number(process.env.HV_ASSET_SCALE || 1));
const variant = process.env.HV_ASSET_VARIANT || '';
const outDir = path.join(root, `assets/characters/dinh-loi${variant}`);
const qaDir = path.join(root, `artifacts/dinh-loi-qa-v3251${variant}`);
const workDir = await fs.mkdtemp(path.join(os.tmpdir(), 'dinh-loi-alpha-'));

const assets = [
  ['idle-atlas.png', 'idle đình lôi.gif'],
  ['run-atlas.png', 'Run đình lôi.gif'],
  ['hit-atlas.png', 'HIT đình lôi.gif'],
  ['fall-atlas.png', 'FALL đình lôi.gif'],
  ['basic-cast-atlas.png', 'Basic.gif'],
  ['basic-projectile-atlas.png', 'basic vfx project Đình Lôi.gif'],
  ['basic-impact-atlas.png', 'Basic vfx impact Đình Lôi.gif'],
  ['skill1-cast-atlas.png', 'skill 1 đình lôi.gif'],
  ['skill1-wave-atlas.png', 'vfx skill 1 đình lôi.gif'],
  ['skill1-impact-atlas.png', 'vfx impact skill 1 Đình Lôi.gif'],
  ['skill1-shield-atlas.png', 'Khiên bảo vệ đồng đội skill 1 Đình Lôi.gif'],
  ['ultimate-cast-atlas.png', 'ultimate đình lôi.gif'],
  ['ultimate-vfx-atlas.png', 'vfx ultimate đình lôi.gif'],
  ['ultimate-impact-atlas.png', 'impact vfx ultimate đình lôi.gif'],
];

const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
const smoothstep = (a, b, x) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

async function cleanFrame(input, output, aggressive = false) {
  const image = sharp(input).ensureAlpha();
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  const result = Buffer.alloc(data.length);

  const bgSamples = [[], [], []];
  const border = 14;
  for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) {
    if (x >= border && x < info.width - border && y >= border && y < info.height - border) continue;
    const p = (y * info.width + x) * 4;
    const r = data[p], g = data[p + 1], b = data[p + 2];
    if (g - Math.max(r, b) < 45) continue;
    bgSamples[0].push(r); bgSamples[1].push(g); bgSamples[2].push(b);
  }
  const median = values => {
    values.sort((a, b) => a - b);
    return values.length ? values[Math.floor(values.length / 2)] : 0;
  };
  const bg = bgSamples.map(median);

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2], sourceA = data[i + 3] / 255;
    const dominance = g - Math.max(r, b);
    // GIF dithering can darken the key far below its nominal neon value.
    // The tighter transition removes those dark green key remnants too.
    const greenGate = (aggressive ? smoothstep(1, 52, dominance) : smoothstep(5, 92, dominance))
      * (aggressive ? smoothstep(28, 105, g) : smoothstep(38, 132, g));
    const matteA = 1 - greenGate;
    const alpha = clamp(sourceA * matteA);

    // Despill only around keyed/semi-transparent edges. Opaque artwork is preserved.
    let cleanR = r, cleanBaseG = g, cleanB = b;
    if (aggressive && alpha > 0.035 && alpha < 0.995) {
      // Reverse the original chroma composite C = aF + (1-a)Bg.
      // This removes cyan/green contamination instead of merely hiding it.
      const unmix = 0.52;
      const recoveredR = clamp((r - (1 - alpha) * bg[0]) / alpha, 0, 255);
      const recoveredG = clamp((g - (1 - alpha) * bg[1]) / alpha, 0, 255);
      const recoveredB = clamp((b - (1 - alpha) * bg[2]) / alpha, 0, 255);
      cleanR = r * (1 - unmix) + recoveredR * unmix;
      cleanBaseG = g * (1 - unmix) + recoveredG * unmix;
      cleanB = b * (1 - unmix) + recoveredB * unmix;
    }
    const cleanDominance = cleanBaseG - Math.max(cleanR, cleanB);
    const edge = smoothstep(0.02, 0.92, alpha) * (1 - smoothstep(0.82, 0.995, alpha));
    const spill = aggressive
      ? smoothstep(0, 34, cleanDominance) * smoothstep(0.01, 0.98, alpha)
      : smoothstep(8, 90, dominance) * edge;
    const neutralGreen = Math.max(cleanR, cleanB) + 3;
    const cleanG = Math.round(cleanBaseG * (1 - spill) + Math.min(cleanBaseG, neutralGreen) * spill);

    result[i] = Math.round(cleanR);
    result[i + 1] = cleanG;
    result[i + 2] = Math.round(cleanB);
    result[i + 3] = Math.round(alpha * 255);
  }

  // A tiny alpha-only feather removes compression stair-steps without blurring RGB detail.
  const rgb = await sharp(result, { raw: info }).removeAlpha().png().toBuffer();
  const alpha = await sharp(result, { raw: info }).extractChannel(3).blur(0.45).png().toBuffer();
  await sharp(rgb).joinChannel(alpha).png({ compressionLevel: 9, adaptiveFiltering: true }).toFile(output);
}

async function makeAtlas(name, source) {
  const slug = name.replace('-atlas.png', '');
  const frameDir = path.join(workDir, slug);
  await fs.mkdir(frameDir, { recursive: true });
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', path.join(upload, source), '-vsync', '0', path.join(frameDir, 'raw-%03d.png')]);
  const rawFrames = (await fs.readdir(frameDir)).filter(f => f.startsWith('raw-')).sort();
  if (rawFrames.length !== 64) throw new Error(`${source}: expected 64 frames, got ${rawFrames.length}`);

  const cleaned = [];
  const aggressive = /(?:idle|run|hit|fall|cast)-atlas/.test(name);
  for (let i = 0; i < rawFrames.length; i++) {
    const clean = path.join(frameDir, `clean-${String(i).padStart(3, '0')}.png`);
    await cleanFrame(path.join(frameDir, rawFrames[i]), clean, aggressive);
    cleaned.push(clean);
  }

  const first = await sharp(cleaned[0]).metadata();
  const tileW = (first.width === 270 ? 135 : 240) * scale;
  const tileH = (first.height === 480 ? 240 : 135) * scale;
  const composites = [];
  for (let i = 0; i < 64; i++) {
    const tile = await sharp(cleaned[i]).resize(tileW, tileH, { fit: 'fill', kernel: sharp.kernel.lanczos3 }).png().toBuffer();
    composites.push({ input: tile, left: (i % 8) * tileW, top: Math.floor(i / 8) * tileH });
  }
  await sharp({ create: { width: tileW * 8, height: tileH * 8, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite(composites).png({ compressionLevel: 9, adaptiveFiltering: true }).toFile(path.join(outDir, name));

  return { name, cleaned, tileW, tileH };
}

async function compositeQa(asset, frameIndex, background, output) {
  const frame = await sharp(asset.cleaned[frameIndex]).resize({ width: 360 }).png().toBuffer();
  const meta = await sharp(frame).metadata();
  let bg;
  if (background === 'checker') {
    const svg = `<svg width="${meta.width}" height="${meta.height}" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="p" width="32" height="32" patternUnits="userSpaceOnUse"><rect width="32" height="32" fill="#ddd"/><rect width="16" height="16" fill="#888"/><rect x="16" y="16" width="16" height="16" fill="#888"/></pattern></defs><rect width="100%" height="100%" fill="url(#p)"/></svg>`;
    bg = Buffer.from(svg);
  } else {
    bg = { create: { width: meta.width, height: meta.height, channels: 3, background } };
  }
  await sharp(bg).composite([{ input: frame }]).jpeg({ quality: 94 }).toFile(output);
}

await fs.mkdir(outDir, { recursive: true });
await fs.mkdir(qaDir, { recursive: true });
const built = [];
for (const [name, source] of assets) {
  process.stdout.write(`Cleaning ${source}\n`);
  built.push(await makeAtlas(name, source));
}

const qaFrames = [20, 36, 48];
const qaBackgrounds = [
  ['black', { r: 5, g: 7, b: 9 }],
  ['white', { r: 245, g: 243, b: 237 }],
  ['checker', 'checker'],
  ['battle', { r: 67, g: 45, b: 38 }],
];
const qaTiles = [];
for (const asset of built) {
  for (let q = 0; q < qaBackgrounds.length; q++) {
    const [label, bg] = qaBackgrounds[q];
    const file = path.join(qaDir, `${asset.name.replace('.png', '')}-${label}.jpg`);
    await compositeQa(asset, qaFrames[q % qaFrames.length], bg, file);
    const tile = await sharp(file).resize(240, 160, { fit: 'contain', background: '#27231f' }).jpeg().toBuffer();
    qaTiles.push({ input: tile, left: q * 240, top: built.indexOf(asset) * 160 });
  }
}
await sharp({ create: { width: 960, height: built.length * 160, channels: 3, background: '#27231f' } })
  .composite(qaTiles).jpeg({ quality: 92 }).toFile(path.join(qaDir, 'all-assets-four-backgrounds.jpg'));

await fs.writeFile(path.join(qaDir, 'alpha-rebuild-report.json'), JSON.stringify({
  method: 'per-pixel adaptive green-dominance matte + source-alpha multiplication + edge-only despill + alpha-only feather',
  scale,
  variant,
  assets: built.map(({ name, tileW, tileH }) => ({ name, frames: 64, atlas: `${tileW * 8}x${tileH * 8}`, tile: `${tileW}x${tileH}` })),
  qaBackgrounds: qaBackgrounds.map(([name]) => name),
}, null, 2));

await fs.rm(workDir, { recursive: true, force: true });
console.log(`Done: ${built.length} atlases`);
