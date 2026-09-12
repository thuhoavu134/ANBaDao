import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  BBR_BETS, BBR_CRAFT, spinBbr, craftShells, buyBbrShop, rollStars, payAt
} from '../src/domain/festival/bach-bao-ruong.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const slots = [
  { t: 'gold', v: 180, l: 'Vàng' },
  { t: 'so', v: 2, l: 'Vỏ sò' },
  { t: 'chest', l: 'Rương' }
];

test('L109: cược 2/10/50, sao nhân, chế sò Tinh/Hoạt, shop điểm', () => {
  assert.deepEqual([...BBR_BETS], [2, 10, 50]);
  const src = { so: 50, gold: 0, tinh: 40, hoat: 40, bachBao: {} };
  const spin = spinBbr(src, { bet: 50, rng: () => 0, slots, day: 1 });
  assert.equal(spin.ok, true);
  assert.equal(spin.stake, 50);
  assert.equal(src.so, 50);
  assert.equal(spin.so, 0);
  assert.ok(spin.stars >= 1 && spin.stars <= 6);
  assert.equal(payAt('gold', 3, 50), 1200 * 25);
  const low = spinBbr({ so: 1 }, { bet: 2, rng: () => 0, slots });
  assert.equal(low.code, 'INSUFFICIENT_SO');
  const craft = craftShells({ tinh: 25, hoat: 25, so: 0, bachBao: {} }, { day: 3 });
  assert.equal(craft.ok, true);
  assert.equal(craft.so, BBR_CRAFT.so);
  assert.equal(craft.tinh, 0);
  const cap = craftShells({ tinh: 80, hoat: 80, so: 0, bachBao: { crafted: 2, craftDay: 3 } }, { day: 3 });
  assert.equal(cap.code, 'CRAFT_CAP');
  const shop = buyBbrShop({ bachBao: { pts: 100 }, gems: 0, shards: {} }, 'ss8');
  assert.equal(shop.ok, true);
  assert.equal(shop.bachBao.pts, 0);
  assert.equal(rollStars(() => 0.99, false), 6);
  const ui = readFileSync(join(root, 'src/ui/bach-bao-ruong-runtime.js'), 'utf8');
  assert.match(ui, /data-bbr-bet/);
  assert.match(ui, /spinBachBaoCore/);
  assert.doesNotMatch(ui, /document\.addEventListener\(['"](?:click|pointerdown)/);
  const build = readFileSync(join(root, 'scripts/build-static.mjs'), 'utf8');
  assert.ok(build.indexOf('tkt-0109-bbr') > build.indexOf('tkt-0108-lore'));
});
