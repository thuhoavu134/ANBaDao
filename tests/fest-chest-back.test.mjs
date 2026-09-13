import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => readFileSync(join(root, rel), 'utf8');

test('L127-T1: mở rương chơi video xong mới hiện loot', () => {
  const ui = read('src/ui/festival-3d-runtime.js');
  assert.match(ui, /chest-open\.mp4/);
  assert.match(ui, /supreme-open\.mp4/);
  assert.match(ui, /vid\.onended/);
  assert.match(ui, /loot\.hidden = true/);
  assert.match(ui, /const showLoot = \(\) => \{ loot\.hidden = false/);
  for (const f of ['chest-open.mp4', 'supreme-open.mp4']) {
    const p = join(root, 'assets/ui/festival/fx', f);
    assert.equal(existsSync(p), true, f);
    assert.ok(statSync(p).size > 80000, f);
  }
});

test('L127-T2: nút ‹ đóng ô rồi về Thành Chính', () => {
  const ui = read('src/ui/festival-3d-runtime.js');
  assert.match(ui, /data-fest-back/);
  assert.match(ui, /stopImmediatePropagation/);
  assert.match(ui, /querySelectorAll\('#hvFestivalRoot'\)/);
  assert.match(ui, /el !== root\) el\.remove\(\)/);
  assert.match(ui, /classList\.contains\('is-tile-open'\)/);
  assert.doesNotMatch(ui, /if \(!root\.classList\.contains\('is-tile-open'\)\) return;/);
});

test('L127-T3: không document click; BETS đóng băng', () => {
  const ui = read('src/ui/festival-3d-runtime.js');
  const bbr = read('src/ui/bach-bao-ruong-runtime.js');
  assert.doesNotMatch(ui, /document\.addEventListener\(['"](?:click|pointerdown|pointerup)/);
  assert.match(bbr, /const BETS = \[2, 10, 50\]/);
});
