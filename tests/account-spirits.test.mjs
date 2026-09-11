import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  ACCOUNT_SPIRITS,
  SPIRIT_MAX_LEVEL,
  SPIRIT_SETS,
  SPIRIT_STAT_PER_LEVEL,
  accountSpiritBonus,
  accountSpiritMasterBonus,
  accountSpiritMasterLevel,
  emptyAccountSpirits,
  normalizeAccountSpirits,
  prepareSpiritEnhance,
  prepareSpiritSlot,
  spiritEnhanceCost
} from '../src/domain/equipment/account-spirits.mjs';

function player(extra = {}) {
  return {
    gold: 4000,
    hoat: 80,
    spirits: emptyAccountSpirits(),
    ...extra
  };
}

test('L15-S1: nine spirits sit in three triads and empty board grants nothing', () => {
  assert.equal(ACCOUNT_SPIRITS.length, 9);
  assert.equal(SPIRIT_SETS.length, 3);
  const counts = Object.fromEntries(SPIRIT_SETS.map(set => [set.id, 0]));
  for (const spirit of ACCOUNT_SPIRITS) {
    counts[spirit.set] += 1;
    assert.ok(spirit.row >= 0 && spirit.row <= 2);
    assert.ok(spirit.col >= 0 && spirit.col <= 2);
  }
  assert.deepEqual(counts, { 'son-thuy': 3, 'tien-thanh': 3, 'hong-bang': 3 });
  const empty = emptyAccountSpirits();
  assert.equal(empty.slots.length, 3);
  assert.equal(accountSpiritMasterLevel(empty), 0);
  assert.deepEqual(accountSpiritBonus(empty), { hp: 0, atk: 0, def: 0, spd: 0 });
});

test('L15-S2: enhance spends gold and hoat, stays immutable, and rejects max or missing funds', () => {
  const state = player();
  const first = prepareSpiritEnhance(state, { id: 'son-tinh' });
  const cost = spiritEnhanceCost(0);
  assert.equal(first.ok, true);
  assert.equal(first.spirits.levels['son-tinh'].lvl, 1);
  assert.equal(first.gold, 4000 - cost.gold);
  assert.equal(first.hoat, 80 - cost.hoat);
  assert.equal(state.spirits.levels['son-tinh'].lvl, 0);
  assert.equal(prepareSpiritEnhance(state, { id: 'no-such' }).code, 'INVALID_SPIRIT');
  assert.equal(prepareSpiritEnhance(player({ gold: 0, hoat: 80 }), { id: 'son-tinh' }).code, 'INSUFFICIENT_GOLD');
  assert.equal(prepareSpiritEnhance(player({ gold: 4000, hoat: 0 }), { id: 'son-tinh' }).code, 'INSUFFICIENT_HOAT');
  const capped = player({
    spirits: { ...emptyAccountSpirits(), levels: { ...emptyAccountSpirits().levels, 'son-tinh': { lvl: SPIRIT_MAX_LEVEL } } }
  });
  assert.equal(prepareSpiritEnhance(capped, { id: 'son-tinh' }).code, 'SPIRIT_MAX_LEVEL');
  const burst = prepareSpiritEnhance(state, { id: 'thuy-tinh', times: 3 });
  assert.equal(burst.ok, true);
  assert.equal(burst.raised, 3);
});

test('L15-S3: only slotted spirits count, triad bonus needs three matching slots, Bậc Thầy needs all nine', () => {
  const spirits = emptyAccountSpirits();
  spirits.levels['son-tinh'] = { lvl: 4 };
  spirits.levels['lieu-hanh'] = { lvl: 4 };
  spirits.slots = ['son-tinh', null, null];
  const one = accountSpiritBonus(spirits);
  assert.equal(one.def, SPIRIT_STAT_PER_LEVEL.def * 4);
  assert.equal(one.hp, 0);
  spirits.slots = ['son-tinh', 'thuy-tinh', 'thanh-giong'];
  spirits.levels['thuy-tinh'] = { lvl: 4 };
  spirits.levels['thanh-giong'] = { lvl: 4 };
  const triad = accountSpiritBonus(spirits);
  const set = SPIRIT_SETS.find(item => item.id === 'son-thuy');
  assert.equal(triad.def, SPIRIT_STAT_PER_LEVEL.def * 4 + (set.three.def || 0));
  assert.equal(triad.atk, SPIRIT_STAT_PER_LEVEL.atk * 4 + (set.three.atk || 0));
  const moved = prepareSpiritSlot(player({ spirits }), { slot: 1, id: 'lieu-hanh' });
  assert.equal(moved.ok, true);
  assert.equal(moved.spirits.slots[1], 'lieu-hanh');
  assert.equal(spirits.slots[1], 'thuy-tinh');
  assert.equal(prepareSpiritSlot(player(), { slot: 0, id: 'ghost' }).code, 'INVALID_SPIRIT');
  for (const spirit of ACCOUNT_SPIRITS) spirits.levels[spirit.id] = { lvl: 2 };
  assert.equal(accountSpiritMasterLevel(spirits), 2);
  const armed = accountSpiritBonus(spirits);
  const master = accountSpiritMasterBonus(2);
  assert.ok(armed.hp >= master.hp);
  spirits.levels['than-sam'] = { lvl: 0 };
  assert.equal(accountSpiritMasterLevel(spirits), 0);
});

const ui = readFileSync(new URL('../src/ui/account-gear-runtime.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/ui/account-gear-board.css', import.meta.url), 'utf8');
const inject = readFileSync(new URL('../scripts/account-gear-v1.mjs', import.meta.url), 'utf8');

test('L15-S4: wheel opens Cửu Ứ Chiến Linh as a 3x3 an vị board', () => {
  assert.match(ui, /open:\s*'spirit'/);
  assert.match(ui, /data-gear-view="spirit"/);
  assert.match(ui, /data-spirit="/);
  assert.match(ui, /Bậc Thầy Chiến Linh/);
  assert.match(ui, /An vị/);
  assert.match(ui, /openSpirit/);
  assert.match(ui, /assist === 'spirit'/);
  assert.match(ui, /accountSpiritBonus/);
  assert.match(css, /\.hv-spirit-grid/);
  assert.match(css, /\.hv-spirit-slot/);
  assert.match(inject, /account-spirits\.mjs/);
  new Function(ui);
});
