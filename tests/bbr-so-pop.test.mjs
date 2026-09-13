import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => readFileSync(join(root, rel), 'utf8');

test('L132-T1: đổi sò pop nhỏ tự tắt, không nút Nhận', () => {
  const ui = read('src/ui/bach-bao-ruong-runtime.js');
  assert.match(ui, /function showConvertLoot/);
  assert.match(ui, /ART\.so/);
  assert.match(ui, /setTimeout\([\s\S]{0,80}is-open/);
  assert.doesNotMatch(ui, /data-so-fx-done/);
  assert.doesNotMatch(ui, />Nhận</);
  assert.doesNotMatch(ui, /hv-chest-fx-frame/);
});

test('L132-T2: icon sò ≤56px, overlay không chặn tay', () => {
  const css = read('src/ui/bach-bao-ruong.css');
  assert.match(css, /#hvSoFx\{[^}]*pointer-events:\s*none/);
  assert.match(css, /#hvSoFx[^{]*img\{[^}]*width:\s*4[0-9]px/);
  assert.doesNotMatch(css, /#hvSoFx[^{]*img\{[^}]*width:\s*(?:[6-9]\d|\d{3,})px/);
  assert.doesNotMatch(css, /#hvSoFx \[data-so-fx-done\]/);
});

test('L132-T3: spotlight steady, không bập bùng; BETS đóng băng', () => {
  const ui = read('src/ui/bach-bao-ruong-runtime.js');
  const css = read('src/ui/bach-bao-ruong.css');
  assert.match(css, /\.hv-bbr-ring\.is-hold/);
  assert.doesNotMatch(css, /@keyframes bbrHold/);
  assert.doesNotMatch(css, /animation:\s*bbrHold/);
  assert.match(ui, /const BETS = \[2, 10, 50\]/);
  assert.doesNotMatch(ui, /document\.addEventListener\(['"](?:click|pointerdown)/);
});
