import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => readFileSync(join(root, rel), 'utf8');

test('L134-T1: lúc quay không vệt loáng', () => {
  const css = read('src/ui/bach-bao-ruong.css');
  assert.doesNotMatch(css, /@keyframes bbrSweep/);
  assert.doesNotMatch(css, /animation:\s*bbrSweep/);
  assert.match(css, /\.hv-bbr-cell\.is-hot:after\{[^}]*(?:content:\s*none|animation:\s*none)/);
});

test('L134-T2: ô trúng hold mới sheen chéo góc', () => {
  const css = read('src/ui/bach-bao-ruong.css');
  assert.match(css, /@keyframes bbrSheen/);
  assert.match(css, /\.hv-bbr-ring\.is-hold \.hv-bbr-cell\.is-hot:after\{[^}]*content:\s*""/);
  assert.match(css, /\.hv-bbr-ring\.is-hold \.hv-bbr-cell\.is-hot:after\{[^}]*animation:\s*bbrSheen/);
  assert.match(css, /\.hv-bbr-ring\.is-hold \.hv-bbr-cell\.is-hot:after\{[^}]*infinite/);
  assert.match(css, /\.hv-bbr-ring\.is-hold \.hv-bbr-cell\.is-hot:after\{[^}]*rotate\(45deg\)/);
});

test('L134-T3: không pulse cả ô; BETS đóng băng; không document click', () => {
  const ui = read('src/ui/bach-bao-ruong-runtime.js');
  const css = read('src/ui/bach-bao-ruong.css');
  assert.doesNotMatch(css, /@keyframes bbrHold/);
  assert.doesNotMatch(css, /animation:\s*bbrHold/);
  assert.doesNotMatch(css, /\.hv-bbr-cell\.is-hot\{[^}]*animation:/);
  assert.match(css, /prefers-reduced-motion:reduce[\s\S]*?bbrSheen[\s\S]*?animation:\s*none/);
  assert.match(ui, /const BETS = \[2, 10, 50\]/);
  assert.doesNotMatch(ui, /document\.addEventListener\(['"](?:click|pointerdown)/);
});
