import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  ACCOUNT_LUCKS,
  LUCK_MAX_LEVEL,
  LUCK_PCT_PER_LEVEL,
  LUCK_ALL_PCT_PER_LEVEL,
  LUCK_MASTER_PCT_PER_LEVEL,
  accountLuckBonus,
  accountLuckMasterLevel,
  emptyAccountLuck,
  prepareLuckEnhance,
  prepareLuckChoose,
  luckEnhanceCost
} from '../src/domain/equipment/account-luck.mjs';

function player(extra = {}) {
  return {
    gold: 4000,
    hoat: 80,
    luck: emptyAccountLuck(),
    ...extra
  };
}

test('L19-L1: five seals cover combat stats and empty board grants nothing', () => {
  assert.equal(ACCOUNT_LUCKS.length, 5);
  const stats = new Set(ACCOUNT_LUCKS.map(item => item.stat));
  assert.ok(['hp', 'atk', 'def', 'spd'].every(stat => stats.has(stat)));
  assert.ok(stats.has('all'));
  assert.equal(accountLuckMasterLevel(emptyAccountLuck()), 0);
  assert.deepEqual(accountLuckBonus(emptyAccountLuck()), { hp: 0, atk: 0, def: 0, spd: 0 });
});

test('L19-L2: enhance spends gold and hoat, stays immutable, and rejects max or missing funds', () => {
  const state = player();
  const first = prepareLuckEnhance(state, { id: 'van-phu' });
  const cost = luckEnhanceCost(0);
  assert.equal(first.ok, true);
  assert.equal(first.luck.levels['van-phu'].lvl, 1);
  assert.equal(first.gold, 4000 - cost.gold);
  assert.equal(first.hoat, 80 - cost.hoat);
  assert.equal(state.luck.levels['van-phu'].lvl, 0);
  assert.equal(prepareLuckEnhance(state, { id: 'no-such' }).code, 'INVALID_LUCK');
  assert.equal(prepareLuckEnhance(player({ gold: 0, hoat: 80 }), { id: 'van-phu' }).code, 'INSUFFICIENT_GOLD');
  assert.equal(prepareLuckEnhance(player({ gold: 4000, hoat: 0 }), { id: 'van-phu' }).code, 'INSUFFICIENT_HOAT');
  const capped = emptyAccountLuck();
  capped.levels['van-phu'] = { lvl: LUCK_MAX_LEVEL };
  assert.equal(prepareLuckEnhance(player({ luck: capped }), { id: 'van-phu' }).code, 'LUCK_MAX_LEVEL');
  const burst = prepareLuckEnhance(state, { id: 'van-quy', times: 3 });
  assert.equal(burst.ok, true);
  assert.equal(burst.raised, 3);
});

test('L19-L3: only the chosen seal counts, Ninh grants all stats, Bậc Thầy needs all five', () => {
  const board = emptyAccountLuck();
  board.levels['van-phu'] = { lvl: 4 };
  board.levels['van-ninh'] = { lvl: 5 };
  assert.deepEqual(accountLuckBonus(board), { hp: 0, atk: 0, def: 0, spd: 0 });
  board.chosen = 'van-phu';
  const one = accountLuckBonus(board);
  assert.equal(one.hp, LUCK_PCT_PER_LEVEL.hp * 4);
  assert.equal(one.atk, 0);
  board.chosen = 'van-ninh';
  const all = accountLuckBonus(board);
  assert.equal(all.hp, LUCK_ALL_PCT_PER_LEVEL * 5);
  assert.equal(all.atk, LUCK_ALL_PCT_PER_LEVEL * 5);
  const swapped = prepareLuckChoose(player({ luck: board }), { id: 'van-tho' });
  assert.equal(swapped.luck.chosen, 'van-tho');
  const off = prepareLuckChoose({ luck: swapped.luck }, { id: 'van-tho' });
  assert.equal(off.luck.chosen, null);
  for (const item of ACCOUNT_LUCKS) board.levels[item.id] = { lvl: 2 };
  board.chosen = 'van-phu';
  const armed = accountLuckBonus(board);
  assert.equal(accountLuckMasterLevel(board), 2);
  assert.equal(armed.hp, LUCK_PCT_PER_LEVEL.hp * 2 + LUCK_MASTER_PCT_PER_LEVEL * 2);
  assert.equal(armed.atk, LUCK_MASTER_PCT_PER_LEVEL * 2);
  board.levels['van-ninh'] = { lvl: 0 };
  assert.equal(accountLuckMasterLevel(board), 0);
});

const ui = readFileSync(new URL('../src/ui/account-gear-runtime.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/ui/account-gear-board.css', import.meta.url), 'utf8');
const inject = readFileSync(new URL('../scripts/account-gear-v1.mjs', import.meta.url), 'utf8');

test('L19-L4: wheel opens Tuệ Vận as five fortune seals', () => {
  assert.match(ui, /open:\s*'luck'/);
  assert.match(ui, /data-gear-view="luck"/);
  assert.match(ui, /data-luck="/);
  assert.match(ui, /Bậc Thầy Tuệ Vận/);
  assert.match(ui, /openLuck/);
  assert.match(ui, /assist === 'luck'/);
  assert.match(ui, /accountLuckBonus/);
  assert.match(ui, /divineAdd\.hp \+ luckAdd\.hp/);
  assert.match(css, /\.hv-luck-row/);
  assert.match(css, /\.hv-luck-seal/);
  assert.match(inject, /account-luck\.mjs/);
  new Function(ui);
});
