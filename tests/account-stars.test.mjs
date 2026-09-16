import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  STAR_MAX,
  STAR_ROSTER_IDS,
  accountStarMasterLevel,
  prepareStarUp,
  starUpCost
} from '../src/domain/hero/account-stars.mjs';

const IDS = STAR_ROSTER_IDS;

function player(extra = {}) {
  const heroes = Object.fromEntries(IDS.map(id => [id, { owned: true, stars: 1, level: 1 }]));
  const shards = Object.fromEntries(IDS.map(id => [id, 80]));
  return { heroes, shards, ...extra };
}

test('L17-T1: star cost matches live 20x current stars and caps at 6', () => {
  assert.equal(STAR_MAX, 6);
  assert.equal(STAR_ROSTER_IDS.length, 14);
  assert.equal(starUpCost(1), 20);
  assert.equal(starUpCost(5), 100);
  assert.ok(STAR_ROSTER_IDS.includes('ong_hang_pho'));
  assert.ok(STAR_ROSTER_IDS.includes('luc_anh'));
  assert.ok(STAR_ROSTER_IDS.includes('linh_dong'));
  assert.ok(STAR_ROSTER_IDS.includes('bach_dien'));
});

test('L17-T2: prepare spends shards, stays immutable, and rejects max/unowned/missing shards', () => {
  const state = player();
  const first = prepareStarUp(state, { id: 'ong_hang_pho' });
  assert.equal(first.ok, true);
  assert.equal(first.heroes['ong_hang_pho'].stars, 2);
  assert.equal(first.shards['ong_hang_pho'], 60);
  assert.equal(state.heroes['ong_hang_pho'].stars, 1);
  assert.equal(state.shards['ong_hang_pho'], 80);
  assert.equal(prepareStarUp(state, { id: 'ghost' }).code, 'INVALID_HERO');
  assert.equal(prepareStarUp(player({ heroes: { ...player().heroes, ong_hang_pho: { owned: false, stars: 1 } } }), { id: 'ong_hang_pho' }).code, 'HERO_NOT_OWNED');
  assert.equal(prepareStarUp(player({ shards: { ...player().shards, ong_hang_pho: 0 } }), { id: 'ong_hang_pho' }).code, 'INSUFFICIENT_SHARDS');
  const capped = player({ heroes: { ...player().heroes, ong_hang_pho: { owned: true, stars: STAR_MAX } } });
  assert.equal(prepareStarUp(capped, { id: 'ong_hang_pho' }).code, 'STAR_MAX');
});

test('L17-T3: Bậc Thầy is the min star of all twelve, unowned counts as zero', () => {
  const state = player();
  assert.equal(accountStarMasterLevel(state), 1);
  state.heroes['to_diep'].stars = 4;
  assert.equal(accountStarMasterLevel(state), 1);
  for (const id of IDS) state.heroes[id].stars = 3;
  assert.equal(accountStarMasterLevel(state), 3);
  state.heroes['luc_anh'].owned = false;
  assert.equal(accountStarMasterLevel(state), 0);
});

const ui = readFileSync(new URL('../src/ui/account-gear-runtime.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/ui/account-gear-board.css', import.meta.url), 'utf8');
const inject = readFileSync(new URL('../scripts/account-gear-v1.mjs', import.meta.url), 'utf8');

test('L17-T4: wheel opens Tướng Tinh as a 12-hero star board', () => {
  assert.match(ui, /open:\s*'star'/);
  assert.match(ui, /data-gear-view="star"/);
  assert.match(ui, /data-star="/);
  assert.match(ui, /Bậc Thầy Tướng Tinh/);
  assert.match(ui, /Thăng sao/);
  assert.match(ui, /openStar/);
  assert.match(ui, /assist === 'star'/);
  assert.match(ui, /prepareStarUp/);
  assert.match(css, /\.hv-star-grid/);
  assert.match(css, /\.hv-star-cell/);
  assert.match(inject, /account-stars\.mjs/);
  new Function(ui);
});
