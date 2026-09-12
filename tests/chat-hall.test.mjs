import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => readFileSync(join(root, rel), 'utf8');

test('L32-T1: live commands stay frozen', () => {
  const html = read('index.html');
  assert.match(html, /P\.gold\+=120/);
  assert.match(html, /Hoàn thành Giao Lưu Phố: \+🪙120/);
});

test('L32-T2: #hvChatRoot is a body overlay with overflow auto', () => {
  const css = read('src/ui/chat-hall.css');
  assert.match(css, /#hvChatRoot\{[^}]*position:fixed;[^}]*inset:0;[^}]*overflow:auto/);
  assert.match(css, /#hvChatRoot\.is-open\{display:flex/);
  assert.match(css, /#hvChatRoot\[hidden\]\{display:none!important/);
  assert.doesNotMatch(css, /#hvChatRoot\{[^}]*overflow:hidden/);
  assert.match(css, /assets\/ui\/chat\/chat-hall\.jpg/);
});

test('L32-T3: hall mounts on body and wraps showScreen without a second document listener', () => {
  const ui = read('src/ui/chat-hall-runtime.js');
  assert.match(ui, /document\.body\.append\(root\)/);
  assert.match(ui, /const baseShowScreen = showScreen/);
  assert.match(ui, /root\.classList\.toggle\(['"]is-open['"]/);
  assert.match(ui, /getElementById\(['"]chatBody['"]\)/);
  assert.doesNotMatch(ui, /document\.addEventListener\(['"](?:click|pointerdown|pointerup)/);
});

test('L32-T4: stub lane loads runtime and build-static keeps the reserved import', () => {
  const build = read('scripts/build-static.mjs');
  const inject = read('scripts/chat-hall-v1.mjs');
  const stub = read('scripts/lanes/tkt-0042-chat.mjs');
  assert.match(build, /lanes\/tkt-0042-chat\.mjs/);
  assert.match(stub, /await import\(['"]\.\.\/chat-hall-v1.mjs['"]\)/);
  assert.match(inject, /src\/ui\/chat-hall-runtime\.js/);
  assert.match(inject, /src\/ui\/chat-hall\.css/);
});

test('L32-T5: hall art is a dedicated 3D file, not a menu-v3233 reuse', () => {
  const hall = join(root, 'assets/ui/chat/chat-hall.jpg');
  assert.equal(existsSync(hall), true);
  const stat = readFileSync(hall);
  assert.ok(stat.length > 50000, 'hall jpg must be a real painted background');
  const css = read('src/ui/chat-hall.css');
  assert.doesNotMatch(css, /menu-v3233/);
});
