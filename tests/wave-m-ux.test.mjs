import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => readFileSync(join(root, rel), 'utf8');

test('L92: chat sheet trên hub, ẩn gợi ý và Giao Lưu', () => {
  const css = read('src/ui/chat-hall.css');
  const ui = read('src/ui/chat-hall-runtime.js');
  assert.match(css, /body\.chat-hall-active #hubScreen/);
  assert.match(css, /hvChatSheet/);
  assert.match(css, /\.chatQuick\{display:none/);
  assert.match(css, /#socialClaim/);
  assert.match(ui, /renderChat/);
});

test('L93: săn FAB ‹ cố định, không document click', () => {
  const ui = read('src/ui/hunt-3d-runtime.js');
  const css = read('src/ui/hunt-3d.css');
  assert.match(ui, /hvHuntBackFab/);
  assert.match(css, /#hvHuntBackFab/);
  assert.match(ui, /syncOpen\('hub'\)/);
  assert.doesNotMatch(ui, /document\.addEventListener\(['"](?:click|pointerdown|pointerup)/);
});

test('L94: túi lưới ô + tab', () => {
  const ui = read('src/ui/bag-hall-runtime.js');
  const css = read('src/ui/bag-hall.css');
  assert.match(ui, /hv-bag-grid/);
  // Owner 2026-11-01: concept 4 cột (thay cho lưới 5 cột cũ).
  assert.match(css, /grid-template-columns:repeat\(4/);
  assert.match(css, /body\.bag-hall-active #hubScreen/);
});

test('L95: rèn đập búa + màu phẩm chất, asset pending', () => {
  const ui = read('src/ui/forge-hall-runtime.js');
  const css = read('src/ui/forge-hall.css');
  assert.match(ui, /hvForgeStrike/);
  assert.match(ui, /data-forge-asset="pending"/);
  assert.match(css, /hvHammer/);
  assert.match(css, /\.hv-drop\.t-ssr/);
});

test('L96: Giao Lưu Phố trong giao việc', () => {
  const ui = read('src/ui/jobs-hall-runtime.js');
  assert.match(ui, /data-jobs-street/);
  assert.match(ui, /socialClaimDaily/);
});
