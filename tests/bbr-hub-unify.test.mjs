import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => readFileSync(join(root, rel), 'utf8');

test('L124-T1: Hoạt lực túi và vành cùng materials/hoat-luc.png', () => {
  const bag = read('src/ui/bag-hall-runtime.js');
  const bbr = read('src/ui/bach-bao-ruong-runtime.js');
  assert.match(bag, /hoat:\s*'assets\/items\/materials\/hoat-luc\.png'/);
  assert.match(bbr, /hoat:\s*'assets\/items\/materials\/hoat-luc\.png'/);
  assert.doesNotMatch(bbr, /hoat:\s*'assets\/ui\/festival\/bbr\/hoat\.png'/);
});

test('L124-T2: ô sự kiện ghi Bách Bảo Rương', () => {
  const fest = read('src/ui/festival-3d-runtime.js');
  assert.match(fest, /id:\s*'wheel',\s*name:\s*'Bách Bảo Rương'/);
  assert.doesNotMatch(fest, /id:\s*'wheel',\s*name:\s*'Bách Bảo'/);
});

test('L124-T3: tâm vành hoa văn chìm; cược đóng băng', () => {
  const css = read('src/ui/bach-bao-ruong.css');
  const ui = read('src/ui/bach-bao-ruong-runtime.js');
  assert.match(ui, /hv-bbr-hub-mark/);
  assert.match(css, /\.hv-bbr-hub-mark/);
  assert.match(css, /content:"寶"/);
  const chest = css.match(/\.hv-bbr-hub-chest\{[^}]*width:(\d+)px/);
  assert.ok(chest && Number(chest[1]) >= 64, 'rương tâm ≥64px');
  assert.match(ui, /const BETS = \[2, 10, 50\]/);
  assert.match(ui, /gold: \[0, 180, 480, 1200, 3600, 10000, 36000\]/);
});

test('L124-T4: không document click', () => {
  const bbr = read('src/ui/bach-bao-ruong-runtime.js');
  const fest = read('src/ui/festival-3d-runtime.js');
  assert.doesNotMatch(bbr, /document\.addEventListener\(['"](?:click|pointerdown)/);
  assert.doesNotMatch(fest, /document\.addEventListener\(['"](?:click|pointerdown)/);
});
