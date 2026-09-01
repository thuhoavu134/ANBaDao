import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const assetDir = join(root, 'assets', 'characters', 'luc-anh');
const outDir = join(root, '.generated', 'luc-anh-2x');

const atlases = [
  'idle-atlas.webp','run-atlas.webp','hit-atlas.webp','fall-atlas.webp',
  'basic-atlas.webp','skill1-atlas.webp','ultimate-atlas.webp',
  'basic_projectile-atlas.webp','basic_impact-atlas.webp','skill1_vfx-atlas.webp','ultimate_vfx-atlas.webp'
];

mkdirSync(outDir, { recursive: true });

async function upscaleOne(name) {
  const src = join(assetDir, name);
  const dest = join(outDir, name);
  if (!existsSync(src)) throw new Error(`Missing Lục Ảnh atlas: ${name}`);

  const info = await sharp(src).metadata();
  if (!info.width || !info.height) throw new Error(`Invalid Lục Ảnh atlas dimensions: ${name}`);

  // Offline/build-time only. Every source frame is preserved; only atlas resolution changes.
  await sharp(src, { animated: false, limitInputPixels: false })
    .resize(info.width * 2, info.height * 2, {
      kernel: sharp.kernel.lanczos3,
      fit: 'fill'
    })
    .sharpen({ sigma: 0.8, m1: 0.7, m2: 1.0, x1: 2.0, y2: 10.0, y3: 20.0 })
    .webp({ lossless: true, quality: 100, effort: 4, alphaQuality: 100 })
    .toFile(dest);

  console.log(`Lục Ảnh 2x: ${name} ${info.width}x${info.height} -> ${info.width * 2}x${info.height * 2}`);
}

// Sequential processing deliberately caps peak memory usage on Vercel builders.
for (const name of atlases) await upscaleOne(name);

const metaPath = join(assetDir, 'runtime-meta.json');
if (existsSync(metaPath)) {
  const meta = JSON.parse(readFileSync(metaPath, 'utf8'));
  for (const m of Object.values(meta)) {
    if (typeof m.cellW === 'number') m.cellW *= 2;
    if (typeof m.cellH === 'number') m.cellH *= 2;
  }
  writeFileSync(join(outDir, 'runtime-meta.json'), JSON.stringify(meta, null, 2));
}

console.log(`Lục Ảnh offline 2x atlases generated safely at ${outDir}`);
