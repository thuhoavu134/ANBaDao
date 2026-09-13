import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => readFileSync(join(root, rel), 'utf8');

test('L133-T1: hold sheen chéo góc TL→BR, lặp', () => {
  const css = read('src/ui/bach-bao-ruong.css');
  assert.match(css, /@keyframes bbrSheen/);
  assert.match(css, /\.hv-bbr-ring\.is-hold \.hv-bbr-cell\.is-hot:after\{[^}]*animation:\s*bbrSheen/);
  assert.match(css, /\.hv-bbr-ring\.is-hold \.hv-bbr-cell\.is-hot:after\{[^}]*infinite/);
  assert.match(css, /\.hv-bbr-ring\.is-hold \.hv-bbr-cell\.is-hot:after\{[^}]*rotate\(45deg\)/);
});

test('L133-T2: sheen không freeze, không pulse cả ô', () => {
  const css = read('src/ui/bach-bao-ruong.css');
  const base = css.split('@media')[0];
  assert.doesNotMatch(base, /\.hv-bbr-ring\.is-hold \.hv-bbr-cell\.is-hot:after\{[^}]*animation:\s*none/);
  assert.doesNotMatch(css, /@keyframes bbrHold/);
  assert.doesNotMatch(css, /animation:\s*bbrHold/);
  assert.doesNotMatch(css, /\.hv-bbr-cell\.is-hot\{[^}]*animation:/);
});

test('L133-T3: reduced-motion tắt sheen; BETS đóng băng; không document click', () => {
  const ui = read('src/ui/bach-bao-ruong-runtime.js');
  const css = read('src/ui/bach-bao-ruong.css');
  assert.match(css, /prefers-reduced-motion:reduce[\s\S]*?bbrSheen[\s\S]*?animation:\s*none|prefers-reduced-motion:reduce\{[^}]*is-hot:after\{[^}]*animation:\s*none/);
  assert.match(ui, /const BETS = \[2, 10, 50\]/);
  assert.doesNotMatch(ui, /document\.addEventListener\(['"](?:click|pointerdown)/);
});
