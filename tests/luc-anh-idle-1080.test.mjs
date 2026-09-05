import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { LUC_ANH_IDLE_1080 as IDLE, LUC_ANH_IDLE_1080_ATLAS as ATLAS } from '../src/domain/character/luc-anh-idle.mjs';
import { normalizeRgbaFrame } from '../scripts/pack-luc-anh-idle-rgba.mjs';
import { assembleLucAnhIdle } from '../scripts/luc-anh-idle-asset.mjs';

const sampleSize = { width: 3, height: 1, crop: { left: 0, top: 0, width: 3, height: 1 }, cellW: 3, cellH: 1 };

test('reject flattened RGB sources instead of silently keying black into alpha', async () => {
  const rgb = await sharp(Buffer.from([0, 0, 0, 30, 31, 35, 255, 255, 255]),
    { raw: { width: 3, height: 1, channels: 3 } }).png().toBuffer();
  await assert.rejects(normalizeRgbaFrame(rgb, sampleSize), /Expected authored RGBA/);
});

test('preserve opaque black clothing, transparent holes, and partial edge alpha', async () => {
  const pixels = Buffer.from([0, 0, 0, 255, 0, 0, 0, 0, 76, 85, 89, 57]);
  const png = await sharp(pixels, { raw: { width: 3, height: 1, channels: 4 } }).png().toBuffer();
  const normalized = await normalizeRgbaFrame(png, sampleSize);
  assert.deepEqual(normalized, pixels);
  const encoded = await sharp(normalized, { raw: { width: 3, height: 1, channels: 4 } })
    .webp({ lossless: true }).toBuffer();
  assert.deepEqual(await sharp(encoded).raw().toBuffer(), pixels);
});

test('fixed crop retains identical pixel coordinates as frame contents change', async () => {
  const size = { width: 6, height: 6, crop: { left: 1, top: 1, width: 4, height: 4 }, cellW: 4, cellH: 4 };
  for (const extraPixel of [0, 35]) {
    const pixels = Buffer.alloc(6 * 6 * 4);
    pixels.set([20, 30, 40, 255], (4 * 6 + 3) * 4);
    pixels.set([255, 0, 0, 255], extraPixel * 4);
    const png = await sharp(pixels, { raw: { width: 6, height: 6, channels: 4 } }).png().toBuffer();
    const normalized = await normalizeRgbaFrame(png, size);
    assert.deepEqual([...normalized.subarray((3 * 4 + 2) * 4, (3 * 4 + 2) * 4 + 4)], [20, 30, 40, 255]);
  }
});

test('shipped atlas matches the RGBA source provenance and all 96 frame cells', async () => {
  await assembleLucAnhIdle();
  const asset = await readFile(new URL(`../${IDLE.src}`, import.meta.url));
  const report = JSON.parse(await readFile(new URL(`../${IDLE.src}.json`, import.meta.url), 'utf8'));
  const metadata = await sharp(asset).metadata();
  assert.equal(metadata.hasAlpha, true);
  assert.deepEqual({ width: metadata.width, height: metadata.height }, ATLAS);
  assert.equal(report.outputSha256, createHash('sha256').update(asset).digest('hex'));
  assert.deepEqual(report.source, IDLE.source);
  assert.equal(report.frameHashes.length, 96);
  assert.equal(report.losslessVisibleRgbaVerified, true);
  assert.equal(IDLE.cols * IDLE.rows, 96);
  assert.equal(IDLE.cellW, IDLE.cellH);
});
