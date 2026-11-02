import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => readFileSync(join(root, rel), 'utf8');

test('L86: Mộng Lộ hoisted root có ‹ Thành Chính', () => {
  const ui = read('src/ui/expedition-3d-runtime.js');
  const css = read('src/ui/expedition-3d.css');
  assert.match(ui, /data-expedition-back/);
  assert.match(ui, /navTo\('hub'\)/);
  assert.match(css, /#hvExpeditionRoot \.hv-exp-back/);
  assert.doesNotMatch(ui, /document\.addEventListener\(['"](?:click|pointerdown|pointerup)/);
});

test('L87: Săn Boss ‹ + pause BGM trước trận', () => {
  const hall = read('src/ui/hunt-3d-runtime.js');
  const run = read('src/ui/hunt-runtime.js');
  assert.match(hall, /data-hunt-back/);
  assert.match(hall, /hushParentBgm|bgmPlayer/);
  assert.match(run, /bgmPlayer\.pause/);
  assert.doesNotMatch(run, /auto-win|forceWin/);
});

test('L88: skip không cần EMBEDDED; chip trận là ‹', () => {
  const skip = read('scripts/battle-skip-v1.mjs');
  const hub = read('src/ui/hub-back-runtime.js');
  const css = read('src/ui/hub-back.css');
  assert.match(skip, /TKT-0088 skip works/);
  assert.match(hub, /chip\.textContent = '‹'/);
  assert.match(hub, /hallOwnBack/);
  assert.match(css, /border-radius:50%/);
  assert.match(read('scripts/build-static.mjs'), /tkt-0088-skip/);
});

test('L89: chat là panel trên dock', () => {
  const css = read('src/ui/chat-hall.css');
  const ui = read('src/ui/chat-hall-runtime.js');
  assert.match(css, /hv-chat-panel/);
  assert.match(css, /calc\(72px \+ env\(safe-area-inset-bottom\)\)/);
  assert.match(ui, /hv-chat-panel/);
  assert.match(css, /assets\/ui\/chat\/chat-hall\.jpg/);
  assert.ok(existsSync(join(root, 'assets/ui/chat/chat-hall.jpg')));
});

test('L90: túi là khung ô thu/mở', () => {
  const css = read('src/ui/bag-hall.css');
  const ui = read('src/ui/bag-hall-runtime.js');
  // Owner 2026-11-01: túi là khung gỗ sơn mài 4 cột theo concept đã duyệt (không còn 5 cột).
  assert.match(css, /hv-bag-frame/);
  assert.match(css, /grid-template-columns:repeat\(4/);
  assert.match(ui, /hv-bag-frame/);
  assert.match(css, /assets\/ui\/bag\/bag-hall\.jpg/);
});

test('L91: rèn 2 cột, nền mới', () => {
  const css = read('src/ui/forge-hall.css');
  assert.match(css, /forge-slotbar\{display:grid;grid-template-columns:repeat\(2/);
  assert.match(css, /assets\/ui\/forge\/forge-hall\.jpg/);
});
