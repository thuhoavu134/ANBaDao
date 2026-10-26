// Owner 2026-10-26: cây Đột phá 4 mốc.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BREAKTHROUGH_STEPS, BREAKTHROUGH_MAX, breakthroughLevel, breakthroughBonus,
  nextBreakthroughStep, canBreakthrough, prepareBreakthrough
} from '../src/domain/hero/breakthrough.mjs';

const player = (dp = 0, owned = true) => ({ heroes: { a: { owned, dp } }, gold: 99999 });

test('đúng 4 mốc, mốc sau đòi cao hơn mốc trước', () => {
  assert.equal(BREAKTHROUGH_MAX, 4);
  assert.deepEqual(BREAKTHROUGH_STEPS.map(s => s.id), [1, 2, 3, 4]);
  for (let i = 1; i < BREAKTHROUGH_STEPS.length; i++) {
    const prev = BREAKTHROUGH_STEPS[i - 1], cur = BREAKTHROUGH_STEPS[i];
    assert.ok(cur.level > prev.level, 'cấp phải tăng');
    assert.ok(cur.stars >= prev.stars, 'sao không được giảm');
    assert.ok(cur.gold > prev.gold && cur.tinh > prev.tinh, 'giá phải tăng');
  }
});

test('mốc 1 mở ở cấp 10, mốc cuối ở cấp 30 / 6 sao', () => {
  assert.equal(BREAKTHROUGH_STEPS[0].level, 10);
  assert.deepEqual([BREAKTHROUGH_STEPS[3].level, BREAKTHROUGH_STEPS[3].stars], [30, 6]);
});

test('cộng dồn % theo số mốc đã mở', () => {
  assert.deepEqual(breakthroughBonus(player(0), 'a'), { hp: 0, atk: 0, def: 0, spd: 0, crit: 0 });
  const one = breakthroughBonus(player(1), 'a');
  assert.equal(+one.hp.toFixed(4), 0.08);
  assert.equal(+one.atk.toFixed(4), 0.05);
  const four = breakthroughBonus(player(4), 'a');
  assert.equal(+four.hp.toFixed(4), 0.33, '0.08+0.10+0.15');
  assert.equal(+four.atk.toFixed(4), 0.25, '0.05+0.08+0.12');
  assert.equal(+four.def.toFixed(4), 0.18);
  assert.equal(+four.spd.toFixed(4), 0.14);
  assert.equal(four.crit, 3);
});

test('chặn đúng lý do: cấp, sao, vàng, tinh, chưa sở hữu, đã max', () => {
  assert.equal(canBreakthrough(player(0), 'a', { level: 9, stars: 9, gold: 1e6, tinh: 999 }).code, 'LEVEL');
  assert.equal(canBreakthrough(player(0), 'a', { level: 30, stars: 0, gold: 1e6, tinh: 999 }).code, 'STARS');
  assert.equal(canBreakthrough(player(0), 'a', { level: 30, stars: 9, gold: 0, tinh: 999 }).code, 'GOLD');
  assert.equal(canBreakthrough(player(0), 'a', { level: 30, stars: 9, gold: 1e6, tinh: 0 }).code, 'TINH');
  assert.equal(canBreakthrough(player(0, false), 'a', { level: 30, stars: 9, gold: 1e6, tinh: 999 }).code, 'NOT_OWNED');
  assert.equal(canBreakthrough(player(4), 'a', { level: 30, stars: 9, gold: 1e6, tinh: 999 }).code, 'MAX');
});

test('mở được mốc 1 khi đủ điều kiện, trả đúng chi phí', () => {
  const ok = canBreakthrough(player(0), 'a', { level: 10, stars: 1, gold: 500, tinh: 5 });
  assert.equal(ok.ok, true);
  assert.equal(ok.step.id, 1);
  const prepared = prepareBreakthrough(player(0), 'a', { level: 10, stars: 1, gold: 500, tinh: 5 });
  assert.deepEqual(prepared.cost, { gold: 500, tinh: 5 });
  assert.equal(prepared.levelAfter, 1);
  assert.match(prepared.message, /Khai Mạch/);
  assert.equal(prepareBreakthrough(player(0), 'a', { level: 1, stars: 1, gold: 0, tinh: 0 }).ok, false);
});

test('mốc kế tiếp đúng thứ tự', () => {
  assert.equal(nextBreakthroughStep(player(0), 'a').id, 1);
  assert.equal(nextBreakthroughStep(player(2), 'a').id, 3);
  assert.equal(nextBreakthroughStep(player(4), 'a'), null);
  assert.equal(breakthroughLevel(player(99), 'a'), 4, 'kẹp trần');
  assert.equal(breakthroughLevel(player(-5), 'a'), 0, 'kẹp sàn');
});
