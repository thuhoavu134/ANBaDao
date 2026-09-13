import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spinStep, convertBbr, takeBbr } from '../src/domain/festival/bach-bao-ruong.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => readFileSync(join(root, rel), 'utf8');

test('L128-T1: trúng rương không đổi sò', () => {
  const chest = convertBbr({ so: 0, bachBao: { pending: { t: 'chest', stars: 1 }, bet: 2 } }, { day: 1 });
  assert.equal(chest.ok, false);
  assert.equal(chest.code, 'CHEST_NO_CONVERT');
  const sup = convertBbr({ so: 0, bachBao: { pending: { t: 'supreme', stars: 1 }, bet: 2 } }, { day: 1 });
  assert.equal(sup.ok, false);
  assert.equal(sup.code, 'CHEST_NO_CONVERT');
  const gold = convertBbr({ so: 0, bachBao: { pending: { t: 'gold', stars: 1 }, bet: 2 } }, { day: 1 });
  assert.equal(gold.ok, true);
  const take = takeBbr({ so: 0, bachBao: { pending: { t: 'chest', stars: 1 }, bet: 2 } }, { day: 1 });
  assert.equal(take.ok, true);
  assert.ok(take.bachBao.chests >= 1);
  const ui = read('src/ui/bach-bao-ruong-runtime.js');
  assert.match(ui, /CHEST_NO_CONVERT|không đổi sò|ko đổi sò/i);
});

test('L128-T2: điểm tự cộng theo sò tiêu, bỏ nút Nhận điểm', () => {
  const s = spinStep({ so: 100, bachBao: { pts: 0, spent: 0, bet: 2 } }, { bet: 2, rng: () => 0, day: 1 });
  assert.equal(s.ok, true);
  assert.equal(s.bachBao.pts, 2);
  const big = spinStep({ so: 100, bachBao: { pts: 10, spent: 0, bet: 50 } }, { bet: 50, rng: () => 0, day: 1 });
  assert.equal(big.bachBao.pts, 60);
  const ui = read('src/ui/bach-bao-ruong-runtime.js');
  assert.doesNotMatch(ui, /Nhận điểm/);
  assert.doesNotMatch(ui, /data-bbr-pts/);
  assert.match(ui, /Điểm tích luỹ/);
  assert.match(ui, /100 sò/);
});

test('L128-T3: Quay to, Thưởng + Đổi sò; shop điểm ở Chợ', () => {
  const ui = read('src/ui/bach-bao-ruong-runtime.js');
  const shop = read('src/ui/shop-3d-runtime.js');
  const p = join(root, 'assets/ui/festival/bbr/shop-girl.jpg');
  assert.equal(existsSync(p), true);
  assert.ok(statSync(p).size > 8000);
  assert.match(shop, /shop-girl\.jpg/);
  assert.match(ui, /data-bbr-take/);
  assert.match(ui, /data-bbr-convert/);
  assert.match(ui, /hv-bbr-go/);
  assert.doesNotMatch(ui, /hv-bbr-shop-ic/);
  assert.doesNotMatch(ui, /document\.addEventListener\(['"](?:click|pointerdown)/);
});
