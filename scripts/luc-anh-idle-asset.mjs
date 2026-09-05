import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import { LUC_ANH_IDLE_1080 as IDLE } from '../src/domain/character/luc-anh-idle.mjs';

const digest = bytes => createHash('sha256').update(bytes).digest('hex');

// Source-control transport has a per-request limit. Parts are only build inputs;
// the browser receives the original complete WebP, with no runtime stitching.
export async function writeAtlasParts(bytes, output, root = process.cwd()) {
  const parts = [];
  const partSize = 11 * 1024 * 1024;
  for (let offset = 0; offset < bytes.length; offset += partSize) {
    const part = bytes.subarray(offset, offset + partSize);
    const path = `asset-sources/luc-anh/${basename(output)}.part${String(parts.length + 1).padStart(2, '0')}`;
    await mkdir(dirname(join(root, path)), { recursive: true });
    await writeFile(join(root, path), part);
    parts.push({ path, bytes: part.length, sha256: digest(part) });
  }
  return parts;
}

export async function assembleLucAnhIdle(root = process.cwd()) {
  const output = join(root, IDLE.src);
  const report = JSON.parse(await readFile(`${output}.json`, 'utf8'));
  if (!Array.isArray(report.parts) || !report.parts.length) throw new Error('Missing authored RGBA atlas parts');
  const buffers = [];
  for (const part of report.parts) {
    const bytes = await readFile(join(root, part.path));
    if (bytes.length !== part.bytes || digest(bytes) !== part.sha256) {
      throw new Error(`Corrupt Lục Ảnh RGBA atlas part: ${part.path}`);
    }
    buffers.push(bytes);
  }
  const atlas = Buffer.concat(buffers);
  if (atlas.length !== report.outputBytes || digest(atlas) !== report.outputSha256) {
    throw new Error('Assembled Lục Ảnh RGBA atlas does not match the verified output');
  }
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, atlas);
  return { path: IDLE.src, bytes: atlas.length, sha256: report.outputSha256 };
}
