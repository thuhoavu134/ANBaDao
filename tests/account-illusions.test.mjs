import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  ACCOUNT_ILLUSIONS,
  ILLUSION_MAX_LEVEL,
  ILLUSION_STAT_PER_LEVEL,
  ILLUSION_MASTER_PER_LEVEL,
  ILLUSION_SUPPORT_RATE,
  accountIllusionBonus,
  accountIllusionMasterLevel,
  emptyAccountIllusions,
  prepareIllusionEnhance,
  prepareIllusionSlot,
  illusionEnhanceCost
} from '../src/domain/equipment/account-illusions.mjs';

function player(extra = {}) {
  return {
    gold: 4000,
    hoat: 80,
    illusions: emptyAccountIllusions(),
    ...extra
  };
}

test('L20-I1: six illusions cover combat stats and empty board grants nothing', () => {
  assert.equal(ACCOUNT_ILLUSIONS.length, 6);
  const stats = new Set(ACCOUNT_ILLUSIONS.map(item => item.stat));
  assert.deepEqual([...stats].sort(), ['atk', 'def', 'hp', 'spd']);
  assert.equal(accountIllusionMasterLevel(emptyAccountIllusions()), 0);
  assert.deepEqual(accountIllusionBonus(emptyAccountIllusions()), { hp: 0, atk: 0, def: 0, spd: 0 });
});

test('L20-I2: enhance spends gold and hoat, stays immutable, and rejects max or missing funds', () => {
  const state = player();
  const first = prepareIllusionEnhance(state, { id: 'hon-trang' });
  const cost = illusionEnhanceCost(0);
  assert.equal(first.ok, true);
  assert.equal(first.illusions.levels['hon-trang'].lvl, 1);
  assert.equal(first.gold, 4000 - cost.gold);
  assert.equal(first.hoat, 80 - cost.hoat);
  assert.equal(state.illusions.levels['hon-trang'].lvl, 0);
  assert.equal(prepareIllusionEnhance(state, { id: 'no-such' }).code, 'INVALID_ILLUSION');
  assert.equal(prepareIllusionEnhance(player({ gold: 0, hoat: 80 }), { id: 'hon-trang' }).code, 'INSUFFICIENT_GOLD');
  assert.equal(prepareIllusionEnhance(player({ gold: 4000, hoat: 0 }), { id: 'hon-trang' }).code, 'INSUFFICIENT_HOAT');
  const capped = emptyAccountIllusions();
  capped.levels['hon-trang'] = { lvl: ILLUSION_MAX_LEVEL };
  assert.equal(prepareIllusionEnhance(player({ illusions: capped }), { id: 'hon-trang' }).code, 'ILLUSION_MAX_LEVEL');
  const burst = prepareIllusionEnhance(state, { id: 'mat-na-tuong', times: 3 });
  assert.equal(burst.ok, true);
  assert.equal(burst.raised, 3);
});

test('L20-I3: chính is full, phụ is half, An vị toggles, Bậc Thầy needs all six', () => {
  const board = emptyAccountIllusions();
  board.levels['khoi-den'] = { lvl: 4 };
  board.levels['mat-na-tuong'] = { lvl: 4 };
  assert.deepEqual(accountIllusionBonus(board), { hp: 0, atk: 0, def: 0, spd: 0 });
  const first = prepareIllusionSlot(player({ illusions: board }), { id: 'khoi-den' });
  assert.deepEqual(first.illusions.slots, ['khoi-den', null]);
  const second = prepareIllusionSlot({ illusions: first.illusions }, { id: 'mat-na-tuong' });
  assert.deepEqual(second.illusions.slots, ['khoi-den', 'mat-na-tuong']);
  const armed = accountIllusionBonus(second.illusions);
  assert.equal(armed.hp, ILLUSION_STAT_PER_LEVEL.hp * 4);
  assert.equal(armed.atk, ILLUSION_STAT_PER_LEVEL.atk * 4 * ILLUSION_SUPPORT_RATE);
  const off = prepareIllusionSlot({ illusions: second.illusions }, { id: 'khoi-den' });
  assert.deepEqual(off.illusions.slots, [null, 'mat-na-tuong']);
  for (const item of ACCOUNT_ILLUSIONS) board.levels[item.id] = { lvl: 2 };
  board.slots = ['khoi-den', 'mat-na-tuong'];
  const mastered = accountIllusionBonus(board);
  assert.equal(accountIllusionMasterLevel(board), 2);
  assert.equal(mastered.hp, ILLUSION_STAT_PER_LEVEL.hp * 2 + ILLUSION_MASTER_PER_LEVEL.hp * 2);
  board.levels['anh-son-mai'] = { lvl: 0 };
  assert.equal(accountIllusionMasterLevel(board), 0);
});

const ui = readFileSync(new URL('../src/ui/account-gear-runtime.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/ui/account-gear-board.css', import.meta.url), 'utf8');
const inject = readFileSync(new URL('../scripts/account-gear-v1.mjs', import.meta.url), 'utf8');

test('L20-I4: wheel opens Ảo Hình as a 2x3 chính/phụ board', () => {
  assert.match(ui, /open:\s*'illusion'/);
  assert.match(ui, /data-gear-view="illusion"/);
  assert.match(ui, /data-illusion="/);
  assert.match(ui, /Bậc Thầy Ảo Hình/);
  assert.match(ui, /openIllusion/);
  assert.match(ui, /assist === 'illusion'/);
  assert.match(ui, /accountIllusionBonus/);
  assert.match(css, /\.hv-illusion-grid/);
  assert.match(css, /\.hv-illusion-cell/);
  assert.match(inject, /account-illusions\.mjs/);
  new Function(ui);
});
