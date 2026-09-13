import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  BBR_BETS, BBR_CRAFT, BBR_UNLOCK, BBR_BOARD, BBR_SO_CONVERT, BBR_WEIGHT, BBR_BUCKET, BBR_PITY_SO,
  spinBbr, spinStep, takeBbr,
  convertBbr, scoreBbr, craftShells, buyBbrShop, rollStars, payAt, pickBoardIdx
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
  const bust = spinStep(
    { so: 20, bachBao: { pending: { t: 'hoat', stars: 2 }, bet: 2 } },
    { bet: 2, rng: () => 0, board: [{ t: 'gold', n: 1 }, { t: 'hoat', n: 1 }], day: 1 }
  );
  assert.equal(bust.bust, true);
  assert.equal(bust.bachBao.pending, null);
  assert.equal(bust.so, 18);
  assert.ok(BBR_WEIGHT.gold[1] > BBR_WEIGHT.gold[3]);
  assert.equal(BBR_BUCKET.common, 50);
  assert.equal(BBR_BUCKET.shard, 30);
  assert.equal(BBR_BUCKET.chest, 15);
  assert.equal(BBR_BUCKET.supreme, 5);
  assert.equal(BBR_PITY_SO, 200);
  const pity = spinStep(
    { so: 400, bachBao: { spent: 198, pityAt: 0, bet: 2, pool: 12000, poolMark: 2 } },
    { bet: 2, rng: () => 0, day: 1 }
  );
  assert.equal(pity.cell.t, 'supreme');
  assert.equal(pity.pity, true);
  assert.ok(pity.bonusSup === 1 || pity.bonusSup === 2);
  assert.equal(pickBoardIdx(() => 0, [{ t: 'gold', n: 1 }]), 0);
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
  assert.equal(BBR_BOARD.filter(c => c.t === 'so').length, 0);
  assert.ok(BBR_BOARD.filter(c => c.t === 'supreme').every(c => c.n === 1));
  assert.equal(BBR_BOARD.filter(c => c.t === 'supreme').length, 2);
  assert.ok(BBR_BOARD.filter(c => c.t === 'chest').every(c => c.n === 1));
  for (const t of ['gold', 'gems', 'tinh', 'hoat', 'sh_ss', 'sh_ssr']) {
    assert.deepEqual([...new Set(BBR_BOARD.filter(c => c.t === t).map(c => c.n))].sort(), [1, 2, 3]);
  }
  const conv = convertBbr({ so: 0, bachBao: { pending: { t: 'gold', stars: 3 }, bet: 2 } }, { day: 1 });
  assert.equal(conv.ok, true);
  assert.equal(conv.so, 10);
  assert.equal(convertBbr({ so: 0, bachBao: { pending: { t: 'hoat', stars: 1 }, bet: 2 } }, { day: 1 }).so, 1);
  assert.equal(convertBbr({ so: 0, bachBao: { pending: { t: 'gold', stars: 2 }, bet: 2 } }, { day: 1 }).so, 3);
  assert.equal(convertBbr({ so: 0, bachBao: { pending: { t: 'gold', stars: 3 }, bet: 10 } }, { day: 1 }).so, 50);
  assert.doesNotMatch(ui, /hv-bbr-tabs/);
  assert.match(ui, /hv-bbr-side[\s\S]*data-bbr-step/);
  assert.match(ui, /hv-bbr-hub-chest/);
  assert.equal(BBR_BOARD[3].t, 'supreme');
  assert.match(ui, /lastIdx/);
  assert.match(ui, /is-run/);
  assert.match(ui, /Đang quay/);
  assert.match(ui, /data-bbr-pane/);
  assert.match(ui, /data-bbr-pts/);
  assert.match(ui, /scoreBbr|doScore/);
  const scored = scoreBbr({ so: 0, bachBao: { pending: { t: 'gold', stars: 3 }, bet: 2 } }, { day: 1 });
  assert.equal(scored.ok, true);
  assert.ok(scored.pts >= 1);
  const css = readFileSync(join(root, 'src/ui/bach-bao-ruong.css'), 'utf8');
  assert.match(css, /#hvBbrDesk \.hv-bbr-go/);
  assert.match(css, /hv-bbr-stack\.n1 img:nth-child\(1\)\{left:0;top:0;width:100%/);
  assert.match(css, /object-fit:contain/);
  assert.match(ui, /gold\.png/);
  assert.match(ui, /supreme\.png/);
  assert.doesNotMatch(ui, /<small>\$\{c\.n\}<\/small>/);
  assert.match(ui, /data-bbr-convert/);
  assert.match(ui, /hvCraftSo/);
  assert.doesNotMatch(ui, /data-bbr-craft/);
  assert.match(ui, /openSupreme/);
  assert.match(ui, /supPity/);
  assert.match(ui, /grantExtremeEquipment/);
  assert.match(ui, /spinBachBaoCore/);
  assert.doesNotMatch(ui, /document\.addEventListener\(['"](?:click|pointerdown)/);
  const build = readFileSync(join(root, 'scripts/build-static.mjs'), 'utf8');
  assert.ok(build.indexOf('tkt-0109-bbr') > build.indexOf('tkt-0108-lore'));
});
