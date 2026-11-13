import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => readFileSync(join(root, rel), 'utf8');

test('L129-T1: Hắc Thị 2 ô, bỏ shop icon trên BBR', () => {
  const shop = read('src/ui/shop-3d-runtime.js');
  const css = read('src/ui/shop-3d.css');
  const bbr = read('src/ui/bach-bao-ruong-runtime.js');
  // Owner 2026-11-03: đổi tên chợ theo chủ đề giang hồ.
  assert.match(shop, /Hắc Thị/);
  assert.match(shop, /Tụ Bảo Các/);
  assert.match(shop, /hvShopCity/);
  assert.match(shop, /data-scity/);
  assert.match(css, /#hvShopCity/);
  assert.doesNotMatch(bbr, /hv-bbr-shop-ic/);
  assert.doesNotMatch(bbr, /shop-girl\.jpg/);
  const tile = join(root, 'assets/ui/shop/tiles/cho-dem.jpg');
  assert.equal(existsSync(tile), true);
  assert.ok(statSync(tile).size > 8000);
});

test('L129-T2: sprite chroma 60fps, loot sau khi bung sáng', async () => {
  const ui = read('src/ui/festival-3d-runtime.js');
  const css = read('src/ui/festival-3d.css');
  assert.match(ui, /chest-sheet\.webp/);
  assert.match(ui, /supreme-sheet\.webp/);
  assert.match(ui, /requestAnimationFrame/);
  assert.match(ui, /const FX_FPS = 60/);
  assert.match(ui, /cols: 12/);
  assert.match(ui, /n: 145/);
  assert.match(ui, /cell: 180/);
  assert.match(ui, /loot\.hidden = true/);
  assert.match(ui, /stage\.hidden = true|stage\.classList\.add\('is-done'\)/);
  assert.match(css, /hv-chest-fx-burst/);
  assert.match(css, /hvGoldBurst/);
  for (const f of ['chest-sheet.webp', 'supreme-sheet.webp']) {
    const p = join(root, 'assets/ui/festival/fx', f);
    assert.equal(existsSync(p), true, f);
    assert.ok(statSync(p).size > 80000, f);
    const { data } = await sharp(p).ensureAlpha().extract({ left: 0, top: 0, width: 2, height: 2 }).raw().toBuffer({ resolveWithObject: true });
    assert.equal(data[3], 0, f + ' corner alpha');
  }
});

test('L129-T3: không document click; BETS đóng băng', () => {
  const shop = read('src/ui/shop-3d-runtime.js');
  const fx = read('src/ui/festival-3d-runtime.js');
  const bbr = read('src/ui/bach-bao-ruong-runtime.js');
  assert.doesNotMatch(shop, /document\.addEventListener\(['"](?:click|pointerdown)/);
  assert.doesNotMatch(fx, /document\.addEventListener\(['"](?:click|pointerdown)/);
  assert.match(bbr, /const BETS = \[2, 10, 50\]/);
});
