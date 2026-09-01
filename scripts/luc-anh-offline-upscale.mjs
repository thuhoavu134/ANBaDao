import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const assetDir = join(root, 'assets', 'characters', 'luc-anh');
const outDir = join(root, '.generated', 'luc-anh-2x');

const atlases = [
  'idle-atlas.webp','run-atlas.webp','hit-atlas.webp','fall-atlas.webp',
  'basic-atlas.webp','skill1-atlas.webp','ultimate-atlas.webp',
  'basic_projectile-atlas.webp','basic_impact-atlas.webp','skill1_vfx-atlas.webp','ultimate_vfx-atlas.webp'
];

mkdirSync(outDir, { recursive: true });

function upscaleOne(name) {
  const src = join(assetDir, name);
  const dest = join(outDir, name);
  if (!existsSync(src)) throw new Error(`Missing Lục Ảnh atlas: ${name}`);

  // Build-time/offline only. Never allocate giant atlas canvases in Safari runtime.
  const candidates = [
    ['/opt/imagemagick/bin/magick', [src, '-filter', 'Lanczos', '-resize', '200%', '-unsharp', '0x0.8+0.7+0.03', '-define', 'webp:lossless=true', '-quality', '100', dest]],
    ['magick', [src, '-filter', 'Lanczos', '-resize', '200%', '-unsharp', '0x0.8+0.7+0.03', '-define', 'webp:lossless=true', '-quality', '100', dest]],
  ];

  for (const [cmd,args] of candidates) {
    const r = spawnSync(cmd, args, { stdio: 'inherit' });
    if (!r.error && r.status === 0) return;
  }
  throw new Error('ImageMagick is required for Lục Ảnh offline upscale. Install ImageMagick or generate the 2x atlases locally before build.');
}

for (const name of atlases) upscaleOne(name);

const metaPath = join(assetDir, 'runtime-meta.json');
if (existsSync(metaPath)) {
  const meta = JSON.parse(readFileSync(metaPath, 'utf8'));
  for (const m of Object.values(meta)) {
    if (typeof m.cellW === 'number') m.cellW *= 2;
    if (typeof m.cellH === 'number') m.cellH *= 2;
  }
  writeFileSync(join(outDir, 'runtime-meta.json'), JSON.stringify(meta, null, 2));
}

console.log(`Lục Ảnh offline 2x atlases generated at ${outDir}`);
