import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => readFileSync(join(root, rel), 'utf8');

test('L131-T1: spotlight khoá đúng lastIdx, không tô mọi ô cùng loại', () => {
  const ui = read('src/ui/bach-bao-ruong-runtime.js');
  assert.match(ui, /asInt\(b\.lastIdx, -1\) === i/);
  assert.match(ui, /is-hot is-win/);
  assert.match(ui, /hv-bbr-ring\$\{pend \? ' is-hold' : ''\}/);
  assert.doesNotMatch(ui, /pend && pend\.t === c\.t && pend\.n === c\.n/);
});

test('L131-T2: Thưởng/Đổi sò tắt lastIdx; quay tiếp đi từ đó', () => {
  const ui = read('src/ui/bach-bao-ruong-runtime.js');
  assert.match(ui, /function doTake[\s\S]*?b\.lastIdx = 0/);
  assert.match(ui, /function doConvert[\s\S]*?b\.lastIdx = 0/);
  assert.match(ui, /function doScore[\s\S]*?b\.lastIdx = 0/);
  assert.match(ui, /const start = continuing \? Math\.max\(0, asInt\(b0\.lastIdx, 0\)\) : 0/);
  assert.match(ui, /if \(r && r\.bust\) st\(\)\.lastIdx = 0;\s*else st\(\)\.lastIdx = dest;/);
  assert.doesNotMatch(ui, /classList\.remove\(['"]is-hot/);
});

test('L131-T3: CSS is-hold; reduced-motion; BETS đóng băng; không document click', () => {
  const ui = read('src/ui/bach-bao-ruong-runtime.js');
  const css = read('src/ui/bach-bao-ruong.css');
  assert.match(css, /\.hv-bbr-ring\.is-hold/);
  assert.doesNotMatch(css, /@keyframes bbrHold/);
  assert.doesNotMatch(css, /animation:\s*bbrHold/);
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.match(ui, /const BETS = \[2, 10, 50\]/);
  assert.doesNotMatch(ui, /document\.addEventListener\(['"](?:click|pointerdown)/);
});
