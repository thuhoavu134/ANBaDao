import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  ACCOUNT_FISHES,
  FISH_MAX_LEVEL,
  FISH_STAT_PER_LEVEL,
  FISH_MASTER_PER_LEVEL,
  FISH_CAST_COST,
  accountFishBonus,
  accountFishMasterLevel,
  emptyAccountFish,
  prepareFishCast
} from '../src/domain/equipment/account-fish.mjs';

function player(extra = {}) {
  return {
    gold: 4000,
    hoat: 80,
    fish: emptyAccountFish(),
    ...extra
  };
}

test('L21-F1: eight fish cover combat stats and empty board grants nothing', () => {
  assert.equal(ACCOUNT_FISHES.length, 8);
  const stats = new Set(ACCOUNT_FISHES.map(item => item.stat));
  assert.deepEqual([...stats].sort(), ['atk', 'def', 'hp', 'spd']);
  assert.equal(accountFishMasterLevel(emptyAccountFish()), 0);
  assert.deepEqual(accountFishBonus(emptyAccountFish()), { hp: 0, atk: 0, def: 0, spd: 0 });
});

test('L21-F2: Câu spends gold and hoat, stays immutable, rng picks the fish, and rejects missing funds or a full dex', () => {
  const state = player();
  const first = prepareFishCast(state, { rng: () => 0 });
  assert.equal(first.ok, true);
  assert.equal(first.id, 'ca-loc');
  assert.equal(first.fish['ca-loc'].lvl, 1);
  assert.equal(first.gold, 4000 - FISH_CAST_COST.gold);
  assert.equal(first.hoat, 80 - FISH_CAST_COST.hoat);
  assert.equal(state.fish['ca-loc'].lvl, 0);
  assert.equal(prepareFishCast(player({ gold: 0, hoat: 80 })).code, 'INSUFFICIENT_GOLD');
  assert.equal(prepareFishCast(player({ gold: 4000, hoat: 0 })).code, 'INSUFFICIENT_HOAT');
  const full = emptyAccountFish();
  for (const item of ACCOUNT_FISHES) full[item.id] = { lvl: FISH_MAX_LEVEL };
  assert.equal(prepareFishCast(player({ fish: full })).code, 'FISH_MAX_LEVEL');
  const second = prepareFishCast(state, { rng: () => 0.99 });
  assert.equal(second.id, 'ca-guom');
});

test('L21-F3: every leveled fish counts and Bậc Thầy needs all eight', () => {
  const board = emptyAccountFish();
  board['ca-loc'] = { lvl: 5 };
  board['ca-ngu'] = { lvl: 3 };
  const one = accountFishBonus(board);
  assert.equal(one.hp, FISH_STAT_PER_LEVEL.hp * 5);
  assert.equal(one.atk, FISH_STAT_PER_LEVEL.atk * 3);
  assert.equal(accountFishMasterLevel(board), 0);
  for (const item of ACCOUNT_FISHES) board[item.id] = { lvl: 2 };
  const armed = accountFishBonus(board);
  assert.equal(accountFishMasterLevel(board), 2);
  assert.equal(armed.hp, FISH_STAT_PER_LEVEL.hp * 2 * 2 + FISH_MASTER_PER_LEVEL.hp * 2);
  assert.equal(armed.atk, FISH_STAT_PER_LEVEL.atk * 2 * 2 + FISH_MASTER_PER_LEVEL.atk * 2);
  board['ca-dua'] = { lvl: 0 };
  assert.equal(accountFishMasterLevel(board), 0);
});

const ui = readFileSync(new URL('../src/ui/account-gear-runtime.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/ui/account-gear-board.css', import.meta.url), 'utf8');
const inject = readFileSync(new URL('../scripts/account-gear-v1.mjs', import.meta.url), 'utf8');

test('L21-F4: wheel opens Đồ Giám Cẩu Cá as a catch catalog', () => {
  assert.match(ui, /open:\s*'fish'/);
  assert.match(ui, /data-gear-view="fish"/);
  assert.match(ui, /data-fish="/);
  assert.match(ui, /Bậc Thầy Cẩu Cá/);
  assert.match(ui, /openFish/);
  assert.match(ui, /assist === 'fish'/);
  assert.match(ui, /accountFishBonus/);
  assert.match(ui, /prepareFishCast/);
  assert.match(css, /\.hv-fish-grid/);
  assert.match(css, /\.hv-fish-cell/);
  assert.match(inject, /account-fish\.mjs/);
  new Function(ui);
});
