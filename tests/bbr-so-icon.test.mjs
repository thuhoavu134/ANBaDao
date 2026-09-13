import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => readFileSync(join(root, rel), 'utf8');

test('L130-T1: SO_IC là sò cowrie, không ốc so-icon.jpg', () => {
  const ui = read('src/ui/bach-bao-ruong-runtime.js');
  const css = read('src/ui/bach-bao-ruong.css');
  assert.match(ui, /hv-so-ic[^;]*bbr\/so\.png/);
  assert.doesNotMatch(ui, /so-icon\.jpg/);
  assert.match(css, /img\.hv-so-ic\{[^}]*object-fit:\s*contain/);
  assert.doesNotMatch(css, /img\.hv-so-ic\{[^}]*border-radius:\s*50%/);
  const p = join(root, 'assets/ui/festival/bbr/so.png');
  assert.equal(existsSync(p), true);
  assert.ok(statSync(p).size > 8000);
});

test('L130-T2: Đổi sò hiện khung so.png, không 🐚', () => {
  const ui = read('src/ui/bach-bao-ruong-runtime.js');
  assert.match(ui, /hvSoFx/);
  assert.match(ui, /showConvertLoot/);
  assert.match(ui, /ART\.so/);
  assert.doesNotMatch(ui, /toast\?\.\('🐚/);
});

test('L130-T3: không document click; BETS đóng băng', () => {
  const ui = read('src/ui/bach-bao-ruong-runtime.js');
  assert.doesNotMatch(ui, /document\.addEventListener\(['"](?:click|pointerdown)/);
  assert.match(ui, /const BETS = \[2, 10, 50\]/);
  assert.match(ui, /const SO_STAR = \[0, 1, 3, 10, 28, 80, 220\]/);
});
