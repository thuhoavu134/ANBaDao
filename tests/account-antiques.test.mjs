import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  ACCOUNT_ANTIQUES,
  ANTIQUE_MAX_LEVEL,
  ANTIQUE_STAT_PER_LEVEL,
  ANTIQUE_MASTER_PER_LEVEL,
  accountAntiqueBonus,
  accountAntiqueMasterLevel,
  emptyAccountAntiques,
  prepareAntiqueEnhance,
  prepareAntiqueEquip,
  antiqueEnhanceCost
} from '../src/domain/equipment/account-antiques.mjs';

function player(extra = {}) {
  return {
    gold: 4000,
    hoat: 80,
    antiques: emptyAccountAntiques(),
    ...extra
  };
}

test('L18-A1: six antiques cover combat stats and empty board grants nothing', () => {
  assert.equal(ACCOUNT_ANTIQUES.length, 6);
  const stats = new Set(ACCOUNT_ANTIQUES.map(item => item.stat));
  assert.deepEqual([...stats].sort(), ['atk', 'def', 'hp', 'spd']);
  assert.equal(accountAntiqueMasterLevel(emptyAccountAntiques()), 0);
  assert.deepEqual(accountAntiqueBonus(emptyAccountAntiques()), { hp: 0, atk: 0, def: 0, spd: 0 });
});

test('L18-A2: enhance spends gold and hoat, stays immutable, and rejects max or missing funds', () => {
  const state = player();
  const first = prepareAntiqueEnhance(state, { id: 'bia-tien-si' });
  const cost = antiqueEnhanceCost(0);
  assert.equal(first.ok, true);
  assert.equal(first.antiques.levels['bia-tien-si'].lvl, 1);
  assert.equal(first.gold, 4000 - cost.gold);
  assert.equal(first.hoat, 80 - cost.hoat);
  assert.equal(state.antiques.levels['bia-tien-si'].lvl, 0);
  assert.equal(prepareAntiqueEnhance(state, { id: 'no-such' }).code, 'INVALID_ANTIQUE');
  assert.equal(prepareAntiqueEnhance(player({ gold: 0, hoat: 80 }), { id: 'bia-tien-si' }).code, 'INSUFFICIENT_GOLD');
  assert.equal(prepareAntiqueEnhance(player({ gold: 4000, hoat: 0 }), { id: 'bia-tien-si' }).code, 'INSUFFICIENT_HOAT');
  const capped = emptyAccountAntiques();
  capped.levels['bia-tien-si'] = { lvl: ANTIQUE_MAX_LEVEL };
  assert.equal(prepareAntiqueEnhance(player({ antiques: capped }), { id: 'bia-tien-si' }).code, 'ANTIQUE_MAX_LEVEL');
  const burst = prepareAntiqueEnhance(state, { id: 'riu-da', times: 3 });
  assert.equal(burst.ok, true);
  assert.equal(burst.raised, 3);
});

test('L18-A3: only the equipped antique counts, An vị swaps the one slot, Bậc Thầy needs all six', () => {
  const board = emptyAccountAntiques();
  board.levels['bia-tien-si'] = { lvl: 5 };
  board.levels['riu-da'] = { lvl: 4 };
  assert.deepEqual(accountAntiqueBonus(board), { hp: 0, atk: 0, def: 0, spd: 0 });
  board.equipped = 'bia-tien-si';
  const one = accountAntiqueBonus(board);
  assert.equal(one.def, ANTIQUE_STAT_PER_LEVEL.def * 5);
  assert.equal(one.atk, 0);
  const state = player({ antiques: board });
  const swapped = prepareAntiqueEquip(state, { id: 'riu-da' });
  assert.equal(swapped.ok, true);
  assert.equal(swapped.antiques.equipped, 'riu-da');
  const off = prepareAntiqueEquip({ antiques: swapped.antiques }, { id: 'riu-da' });
  assert.equal(off.antiques.equipped, null);
  for (const item of ACCOUNT_ANTIQUES) board.levels[item.id] = { lvl: 2 };
  board.equipped = 'chuong-mot-cot';
  const armed = accountAntiqueBonus(board);
  assert.equal(accountAntiqueMasterLevel(board), 2);
  assert.equal(armed.hp, ANTIQUE_STAT_PER_LEVEL.hp * 2 + ANTIQUE_MASTER_PER_LEVEL.hp * 2);
  assert.equal(armed.atk, ANTIQUE_MASTER_PER_LEVEL.atk * 2);
  board.levels['lu-huong'] = { lvl: 0 };
  assert.equal(accountAntiqueMasterLevel(board), 0);
});

const ui = readFileSync(new URL('../src/ui/account-gear-runtime.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/ui/account-gear-board.css', import.meta.url), 'utf8');
const inject = readFileSync(new URL('../scripts/account-gear-v1.mjs', import.meta.url), 'utf8');

test('L18-A4: wheel opens Cổ Vật as a 2x3 An vị board', () => {
  assert.match(ui, /open:\s*'antique'/);
  assert.match(ui, /data-gear-view="antique"/);
  assert.match(ui, /data-antique="/);
  assert.match(ui, /Bậc Thầy Cổ Vật/);
  assert.match(ui, /openAntique/);
  assert.match(ui, /assist === 'antique'/);
  assert.match(ui, /accountAntiqueBonus/);
  assert.match(css, /\.hv-antique-grid/);
  assert.match(css, /\.hv-antique-cell/);
  assert.match(inject, /account-antiques\.mjs/);
  new Function(ui);
});
