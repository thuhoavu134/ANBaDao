import sharp from 'sharp';
import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { LUC_ANH_IDLE_1080 as IDLE, LUC_ANH_IDLE_1080_ATLAS as ATLAS } from '../src/domain/character/luc-anh-idle.mjs';
import { writeAtlasParts } from './luc-anh-idle-asset.mjs';

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const geometry = { width: IDLE.source.width, height: IDLE.source.height,
  crop: IDLE.source.crop, cellW: IDLE.cellW, cellH: IDLE.cellH };

export async function normalizeRgbaFrame(input, size = geometry) {
  const metadata = await sharp(input).metadata();
  if (!metadata.hasAlpha || metadata.channels !== 4) {
    throw new Error('Expected authored RGBA input; RGB/chroma-key fallback is forbidden');
  }
  if (metadata.width !== size.width || metadata.height !== size.height) {
    throw new Error(`Unexpected source dimensions: ${metadata.width}x${metadata.height}`);
  }
  // One crop for the entire animation, never a per-frame bounding-box fit.
  // Sharp resizes RGBA with alpha-aware interpolation. Do not key dark pixels,
  // threshold alpha, recolor edges, or flatten against a matte.
  return sharp(input).extract(size.crop)
    .resize(size.cellW, size.cellH, { kernel: 'lanczos3', fit: 'fill' })
    .raw().toBuffer();
}

export async function packLucAnhIdle(inputDirectory, output = IDLE.src) {
  const expected = Array.from({ length: IDLE.frames }, (_, i) => `${String(i + 1).padStart(4, '0')}.png`);
  const actual = (await readdir(inputDirectory)).filter(name => /\.png$/i.test(name)).sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error('Expected exactly 0001.png through 0096.png, with no missing or extra frames');
  }
  const rgba = Buffer.alloc(ATLAS.width * ATLAS.height * 4);
  const frameHashes = [];
  for (const [index, name] of expected.entries()) {
    const source = await readFile(join(inputDirectory, name));
    const pixels = await normalizeRgbaFrame(source);
    const x = (index % IDLE.cols) * IDLE.cellW;
    const y = Math.floor(index / IDLE.cols) * IDLE.cellH;
    for (let row = 0; row < IDLE.cellH; row++) {
      pixels.copy(rgba, ((y + row) * ATLAS.width + x) * 4,
        row * IDLE.cellW * 4, (row + 1) * IDLE.cellW * 4);
    }
    frameHashes.push({ file: name, sourceSha256: sha256(source) });
  }
  const encoded = await sharp(rgba, { raw: { ...ATLAS, channels: 4 } })
    .webp({ lossless: true, effort: 6 }).toBuffer();
  const decoded = await sharp(encoded).raw().toBuffer();
  if (decoded.length !== rgba.length) throw new Error('Atlas decoded dimensions changed');
  // Fully transparent RGB is unspecified by WebP. Alpha and every visible
  // channel must survive encoding exactly, including opaque black clothing.
  for (let i = 0; i < rgba.length; i += 4) {
    if (rgba[i + 3] !== decoded[i + 3] || (rgba[i + 3] &&
      (rgba[i] !== decoded[i] || rgba[i + 1] !== decoded[i + 1] || rgba[i + 2] !== decoded[i + 2]))) {
      throw new Error(`Lossless round-trip mismatch at pixel ${i / 4}`);
    }
  }
  await mkdir(dirname(resolve(output)), { recursive: true });
  await writeFile(output, encoded);
  const report = { source: IDLE.source, frames: IDLE.frames, cols: IDLE.cols, rows: IDLE.rows,
    cellW: IDLE.cellW, cellH: IDLE.cellH, atlas: ATLAS, encoding: IDLE.encoding,
    outputBytes: encoded.length, outputSha256: sha256(encoded),
    parts: await writeAtlasParts(encoded, output),
    losslessVisibleRgbaVerified: true, frameHashes };
  await writeFile(`${output}.json`, `${JSON.stringify(report, null, 2)}\n`);
  return report;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  if (!process.argv[2]) throw new Error('Usage: node scripts/pack-luc-anh-idle-rgba.mjs <extracted-IDLE-directory> [output.webp]');
  const result = await packLucAnhIdle(process.argv[2], process.argv[3]);
  console.log(JSON.stringify({ ...result, frameHashes: `${result.frameHashes.length} source hashes recorded` }, null, 2));
}
