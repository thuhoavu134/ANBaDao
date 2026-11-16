import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => readFileSync(join(root, rel), 'utf8');

test('L97: Bang Hội city 3 cột + dock + 7 chức năng, bỏ Gia Tộc cũ', () => {
  const css = read('src/ui/guild-hall.css');
  const ui = read('src/ui/guild-hall-runtime.js');
  assert.match(css, /grid-template-columns:repeat\(3/);
  assert.match(css, /\.hv-guild-dock/);
  assert.match(ui, /data-gtile/);
  assert.match(ui, /Nhật ký/);
  assert.doesNotMatch(ui, /assets\/ui\/guild\/tiles\/gia-toc\.jpg|data-gtile="family"/);
  assert.doesNotMatch(ui, /document\.addEventListener\(['"](?:click|pointerdown|pointerup)/);
  for (const f of ['vo-duong','kho-bao','ho-tran','chien-dich','bang-chien','cong-vu','bang-thuong']) {
    const p = join(root, 'assets/ui/guild/tiles', f + '.jpg');
    assert.equal(existsSync(p), true, f);
    assert.ok(statSync(p).size > 40000, f + ' too small');
  }
});
