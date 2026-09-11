import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  ACCOUNT_DIVINES,
  DIVINE_MAX_LEVEL,
  DIVINE_PCT_PER_LEVEL,
  DIVINE_MASTER_PCT_PER_LEVEL,
  accountDivineBonus,
  accountDivineMasterLevel,
  emptyAccountDivines,
  prepareDivineEnhance,
  divineEnhanceCost
} from '../src/domain/equipment/account-divines.mjs';

function player(extra = {}) {
  return {
    gold: 4000,
    hoat: 80,
    divines: emptyAccountDivines(),
    ...extra
  };
}

test('L16-D1: four troop banners cover percent stats and empty board grants nothing', () => {
  assert.equal(ACCOUNT_DIVINES.length, 4);
  const stats = { hp: 0, atk: 0, def: 0, spd: 0 };
  for (const troop of ACCOUNT_DIVINES) {
    stats[troop.stat] += 1;
    assert.ok(troop.id && troop.name);
  }
  assert.deepEqual(stats, { hp: 1, atk: 1, def: 1, spd: 1 });
  assert.equal(accountDivineMasterLevel(emptyAccountDivines()), 0);
  assert.deepEqual(accountDivineBonus(emptyAccountDivines()), { hp: 0, atk: 0, def: 0, spd: 0 });
});

test('L16-D2: enhance spends gold and hoat, stays immutable, and rejects max or missing funds', () => {
  const state = player();
  const first = prepareDivineEnhance(state, { id: 'cam-quan' });
  const cost = divineEnhanceCost(0);
  assert.equal(first.ok, true);
  assert.equal(first.divines['cam-quan'].lvl, 1);
  assert.equal(first.gold, 4000 - cost.gold);
  assert.equal(first.hoat, 80 - cost.hoat);
  assert.equal(state.divines['cam-quan'].lvl, 0);
  assert.equal(prepareDivineEnhance(state, { id: 'no-such' }).code, 'INVALID_DIVINE');
  assert.equal(prepareDivineEnhance(player({ gold: 0, hoat: 80 }), { id: 'cam-quan' }).code, 'INSUFFICIENT_GOLD');
  assert.equal(prepareDivineEnhance(player({ gold: 4000, hoat: 0 }), { id: 'cam-quan' }).code, 'INSUFFICIENT_HOAT');
  const capped = player({ divines: { ...emptyAccountDivines(), 'cam-quan': { lvl: DIVINE_MAX_LEVEL } } });
  assert.equal(prepareDivineEnhance(capped, { id: 'cam-quan' }).code, 'DIVINE_MAX_LEVEL');
  const burst = prepareDivineEnhance(state, { id: 'voi-chien', times: 3 });
  assert.equal(burst.ok, true);
  assert.equal(burst.raised, 3);
});

test('L16-D3: troop percent stacks, Bậc Thầy needs all four', () => {
  const board = emptyAccountDivines();
  board['cam-quan'] = { lvl: 5 };
  const one = accountDivineBonus(board);
  assert.equal(one.def, DIVINE_PCT_PER_LEVEL.def * 5);
  assert.equal(one.atk, 0);
  for (const troop of ACCOUNT_DIVINES) board[troop.id] = { lvl: 2 };
  const armed = accountDivineBonus(board);
  assert.equal(accountDivineMasterLevel(board), 2);
  assert.equal(armed.hp, DIVINE_PCT_PER_LEVEL.hp * 2 + DIVINE_MASTER_PCT_PER_LEVEL * 2);
  assert.equal(armed.atk, DIVINE_PCT_PER_LEVEL.atk * 2 + DIVINE_MASTER_PCT_PER_LEVEL * 2);
  assert.equal(armed.def, DIVINE_PCT_PER_LEVEL.def * 2 + DIVINE_MASTER_PCT_PER_LEVEL * 2);
  assert.equal(armed.spd, DIVINE_PCT_PER_LEVEL.spd * 2 + DIVINE_MASTER_PCT_PER_LEVEL * 2);
  board['thuy-quan'] = { lvl: 0 };
  assert.equal(accountDivineMasterLevel(board), 0);
});

const ui = readFileSync(new URL('../src/ui/account-gear-runtime.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/ui/account-gear-board.css', import.meta.url), 'utf8');
const inject = readFileSync(new URL('../scripts/account-gear-v1.mjs', import.meta.url), 'utf8');

test('L16-D4: wheel opens Thần Binh as 2x2 percent banners', () => {
  assert.match(ui, /open:\s*'divine'/);
  assert.match(ui, /data-gear-view="divine"/);
  assert.match(ui, /data-divine="/);
  assert.match(ui, /Bậc Thầy Thần Binh/);
  assert.match(ui, /openDivine/);
  assert.match(ui, /assist === 'divine'/);
  assert.match(ui, /accountDivineBonus/);
  assert.match(ui, /1 \+ divineAdd/);
  assert.match(css, /\.hv-divine-grid/);
  assert.match(css, /\.hv-divine-banner/);
  assert.match(inject, /account-divines\.mjs/);
  new Function(ui);
});
