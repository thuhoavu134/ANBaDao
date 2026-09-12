import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => readFileSync(join(root, rel), 'utf8');

test('L79-T1: capture AbortError, sweep __mgErrs, remove abort-only banner', () => {
  const ui = read('src/ui/abort-noise-runtime.js');
  assert.match(ui, /unhandledrejection/);
  assert.match(ui, /preventDefault/);
  assert.match(ui, /stopImmediatePropagation/);
  assert.match(ui, /true\)/);
  assert.match(ui, /AbortError/);
  assert.match(ui, /NotAllowedError/);
  assert.match(ui, /operation was aborted/);
  assert.match(ui, /__mgErrs/);
  assert.match(ui, /__mgDiag/);
  assert.match(ui, /b\.remove\(\)|box\.remove\(\)/);
});

test('L79-T2: login video play catch, no autoplay', () => {
  const ui = read('src/ui/login-gate-runtime.js');
  assert.match(ui, /video\.play\(\)[\s\S]{0,80}\.catch\(/);
  assert.doesNotMatch(ui, /autoplay/);
  assert.match(ui, /video\.pause\(\)/);
});

test('L79-T3: inject filter in head; index.html source frozen', () => {
  const inject = read('scripts/login-gate-v1.mjs');
  assert.match(inject, /abort-noise-runtime\.js/);
  assert.match(inject, /hv-abort-noise-js/);
  assert.match(inject, /<\/head>/);
  assert.doesNotMatch(read('index.html'), /hv-abort-noise|abort-noise-runtime/);
  assert.doesNotMatch(read('battle.html'), /hv-abort-noise|abort-noise-runtime/);
  assert.doesNotMatch(read('src/ui/campaign-scene.js'), /abort-noise/);
});

test('L79-T4: no second document click listener', () => {
  const noise = read('src/ui/abort-noise-runtime.js');
  const ui = read('src/ui/login-gate-runtime.js');
  assert.doesNotMatch(noise, /document\.addEventListener\(['"]click['"]/);
  assert.doesNotMatch(ui, /document\.addEventListener\(['"]click['"]/);
});
