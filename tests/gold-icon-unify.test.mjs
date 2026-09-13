import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => readFileSync(join(root, rel), 'utf8');
const sha = rel => createHash('sha256').update(readFileSync(join(root, rel))).digest('hex');
const GOLD = 'assets/items/materials/gold.png';

test('L122-T1: BBR / túi / Chợ cùng materials/gold.png', () => {
  const bag = read('src/ui/bag-hall-runtime.js');
  const bbr = read('src/ui/bach-bao-ruong-runtime.js');
  const shop = read('src/ui/shop-runtime.js');
  assert.match(bag, /gold:\s*'assets\/items\/materials\/gold\.png'/);
  assert.match(bbr, /gold:\s*'assets\/items\/materials\/gold\.png'/);
  assert.match(shop, /it\.type === 'gold'\) return 'assets\/items\/materials\/gold\.png'/);
  assert.doesNotMatch(bbr, /gold:\s*'assets\/ui\/festival\/bbr\/gold\.png'/);
});

test('L122-T2: Thành chính chip vàng dùng materials/gold.png', () => {
  const hub = read('scripts/hub-responsive-visibility-v1.mjs');
  assert.match(hub, /res-icon-gold\{background-image:url\('assets\/items\/materials\/gold\.png'\)/);
  assert.doesNotMatch(hub, /res-icon-gold\{background-image:url\('assets\/ui\/menu-v3233\/icons\/resource-gold-imagen\.png'\)/);
});

test('L122-T3: file vàng Chinh chiến + Bách Bảo cùng bytes túi', () => {
  const canon = sha(GOLD);
  assert.equal(existsSync(join(root, GOLD)), true);
  assert.equal(sha('assets/ui/festival/bbr/gold.png'), canon);
  assert.equal(sha('assets/ui/menu-v3233/icons/resource-gold-imagen.png'), canon);
});

test('L122-T4: chip Chợ img vàng; không document click', () => {
  const shop = read('src/ui/shop-runtime.js');
  const css = read('src/ui/shop-screen.css');
  assert.match(shop, /data-shop-gold><img class="hv-cur-ico" src="assets\/items\/materials\/gold\.png"/);
  assert.match(css, /\.hv-cur-ico\{/);
  assert.doesNotMatch(shop, /document\.addEventListener\(['"](?:click|pointerdown)/);
});
