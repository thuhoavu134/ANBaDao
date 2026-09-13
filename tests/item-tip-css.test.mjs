import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => readFileSync(join(root, rel), 'utf8');

test('L120-T1: tip card không dùng id hvShopInfo — tránh CSS Bách Bảo đệm rỗng', () => {
  const ui = read('src/ui/shop-runtime.js');
  const bbr = read('src/ui/bach-bao-ruong.css');
  assert.doesNotMatch(ui, /id="hvShopInfo"/);
  assert.doesNotMatch(bbr, /#hvShopInfo\{[^}]*padding/);
});

test('L120-T2: thẻ popup ôm nội dung, không kéo 100dvh', () => {
  const css = read('src/ui/shop-screen.css');
  const bag = read('src/ui/bag-hall.css');
  const safari = read('src/ui/overlay-safari.css');
  assert.match(css, /#hvItemTip \.hv-tip-card\{[^}]*flex:\s*0 0 auto/);
  assert.match(css, /#hvItemTip \.hv-tip-card\{[^}]*height:\s*auto/);
  assert.match(css, /#hvItemTip \.hv-tip-card\{[^}]*max-height:\s*min\(/);
  assert.match(css, /#hvItemTip \.hv-tip-card\{[^}]*padding:\s*0/);
  assert.match(css, /#hvItemTip\{[^}]*align-items:\s*center/);
  assert.match(bag, /#hvItemTip \.hv-tip-card\{[^}]*height:\s*auto/);
  assert.match(safari, /#hvItemTip \.hv-tip-card\{[^}]*max-height:\s*min\(/);
  assert.match(safari, /#hvItemTip:not\(\[hidden\]\)/);
});

test('L120-T3: một thẻ — icon / sao / số lượng / Cách nhận / nút đóng', () => {
  const ui = read('src/ui/shop-runtime.js');
  const css = read('src/ui/shop-screen.css');
  assert.match(ui, /data-tip-close/);
  assert.match(ui, /hv-tip-how-title/);
  assert.match(ui, /Cách nhận/);
  assert.match(ui, /hv-tip-stars/);
  assert.match(ui, /info\.ic \|\| '◆'/);
  assert.doesNotMatch(ui, /tipView === 'how'/);
  assert.match(css, /#hvItemTip \.hv-tip-x\{/);
  assert.match(css, /#hvItemTip \.hv-tip-how-title\{/);
  assert.doesNotMatch(ui, /document\.addEventListener\(['"](?:click|pointerdown)/);
});

test('L120-T4: Sách Tinh Thông có icon + nguồn Bách Bảo / Chinh chiến', () => {
  const bag = read('src/ui/bag-hall-runtime.js');
  assert.match(bag, /Sách Tinh Thông/);
  assert.match(bag, /tinh-thong\.png/);
  assert.match(bag, /how:\s*\['fest',\s*'camp'\]/);
  assert.doesNotMatch(bag, /document\.addEventListener\(['"](?:click|pointerdown)/);
});
