import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  BBR_BETS, BBR_CRAFT, BBR_UNLOCK, BBR_BOARD, spinBbr, spinStep, takeBbr,
  craftShells, buyBbrShop, rollStars, payAt
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
  const two = BBR_BOARD.filter(c => c.t === 'gold' && c.n === 2);
  const three = BBR_BOARD.filter(c => c.t === 'gold' && c.n === 3);
  assert.ok(two.length && three.length);
  const board = [{ t: 'gold', n: 2 }, { t: 'gold', n: 3 }];
  const p0 = { so: 20, gold: 0, bachBao: { bet: 2 } };
  const s1 = spinStep(p0, { bet: 2, rng: () => 0, board, day: 1 });
  assert.equal(s1.stars, 2);
  const s2 = spinStep({ ...p0, so: s1.so, bachBao: s1.bachBao }, { bet: 2, rng: () => 0.9, board, day: 1 });
  assert.equal(s2.stars, 5);
  assert.equal(s2.same, true);
  const take = takeBbr({ gold: 0, so: s2.so, bachBao: s2.bachBao }, { day: 1 });
  assert.equal(take.ok, true);
  assert.equal(take.stars, 5);
  assert.equal(take.gold, payAt('gold', 5, 2));
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
  assert.equal(BBR_UNLOCK.ssr, 50);
  assert.equal(BBR_UNLOCK.b, 10);
  assert.match(ui, /so-icon\.jpg/);
  assert.match(ui, /S\+/);
  assert.equal(BBR_BOARD.length, 22);
  assert.equal(BBR_BOARD[3].t, 'supreme');
  assert.equal(BBR_BOARD[14].t, 'supreme');
  assert.match(ui, /spinDelay/);
  assert.match(ui, /hv-bbr-ring/);
  assert.match(ui, /hv-bbr-stack/);
  assert.match(ui, /data-bbr-take/);
  assert.match(ui, /openSupreme/);
  assert.match(ui, /supPity/);
  assert.match(ui, /grantExtremeEquipment/);
  assert.match(ui, /spinBachBaoCore/);
  assert.doesNotMatch(ui, /document\.addEventListener\(['"](?:click|pointerdown)/);
  const build = readFileSync(join(root, 'scripts/build-static.mjs'), 'utf8');
  assert.ok(build.indexOf('tkt-0109-bbr') > build.indexOf('tkt-0108-lore'));
});
