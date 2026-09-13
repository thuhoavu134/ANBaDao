import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => readFileSync(join(root, rel), 'utf8');

test('L138-T1: sheen 0→100% liên tục, fade hai đầu, không hold 78%', () => {
  const css = read('src/ui/bach-bao-ruong.css');
  const sheen = (css.split('@keyframes bbrSheen')[1] || '').split('@media')[0];
  const hold = (css.split('@media')[0].match(/\.hv-bbr-ring\.is-hold \.hv-bbr-cell\.is-hot:after\{[^}]+\}/) || [''])[0];
  assert.doesNotMatch(sheen, /78%/);
  assert.match(sheen, /0%\{[^}]*translate3d\(/);
  assert.match(sheen, /100%\{[^}]*translate3d\(/);
  assert.match(sheen, /0%\{[^}]*opacity:\s*0/);
  assert.match(sheen, /100%\{[^}]*opacity:\s*0/);
  assert.match(hold, /animation:\s*bbrSheen 1\.5s linear infinite/);
  assert.match(hold, /rotate\(45deg\)/);
});

test('L138-T2: lúc quay không vệt', () => {
  const css = read('src/ui/bach-bao-ruong.css');
  assert.doesNotMatch(css, /@keyframes bbrSweep/);
  assert.match(css, /\.hv-bbr-cell\.is-hot:after\{[^}]*content:\s*none/);
});

test('L138-T3: không pulse cả ô; BETS đóng băng; không document click', () => {
  const ui = read('src/ui/bach-bao-ruong-runtime.js');
  const css = read('src/ui/bach-bao-ruong.css');
  assert.doesNotMatch(css, /@keyframes bbrHold/);
  assert.doesNotMatch(css, /\.hv-bbr-cell\.is-hot\{[^}]*animation:/);
  assert.match(ui, /const BETS = \[2, 10, 50\]/);
  assert.doesNotMatch(ui, /document\.addEventListener\(['"](?:click|pointerdown)/);
});
