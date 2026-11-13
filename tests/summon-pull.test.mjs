import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  ESSENCE_BY_RARITY,
  GACHA_COST1,
  GACHA_COST10,
  GACHA_DUP_SHARDS,
  GACHA_PITY_AT,
  GACHA_RATES,
  LIVE_GACHA,
  SPARK_SELECT,
  gachaRatesSum,
  poolOfCatalog,
  prepareSparkSelect,
  prepareSummonPull,
  rollTier,
  validateSummonBanner
} from '../src/domain/summon/summon-pull.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const mixedHeroes = {
  ssr_a: { rarity: 'ssr', name: 'SSR A' },
  ss_a: { rarity: 'ss', name: 'SS A' },
  s_a: { rarity: 's', name: 'S A' },
  a_a: { rarity: 'a', name: 'A A' },
  b_a: { rarity: 'b', name: 'B A' }
};
const mixedIds = Object.keys(mixedHeroes);

const official12 = [
  'ong_hang_pho', 'thay_mo', 'lac_yen', 'cung_thu_tre', 'co_dao_ganh_hoi', 'phong_tu',
  'thuy_nuong_roi_nuoc', 'hong_lien_dao_nuong', 'thach_quyen', 'dinh_loi', 'luc_anh', 'to_diep'
];
const officialAllSsr = Object.fromEntries(official12.map(id => [id, { rarity: 'ssr' }]));

function rngSeq(values) {
  let i = 0;
  return () => {
    const v = values[Math.min(i, values.length - 1)];
    i += 1;
    return v;
  };
}

function player(extra = {}) {
  const heroes = {};
  for (const id of mixedIds) heroes[id] = { owned: false };
  return {
    gems: 800,
    pity: 0,
    shards: {},
    summonCount: 0,
    freePullDay: -1,
    clearedChapters: [0, 1],
    heroes,
    economy: { dreamEssence: 0, spark: 0, craftPity: 0, awakeningSpent: 0 },
    ...extra
  };
}

const pullOpts = { heroes: mixedHeroes, rosterIds: mixedIds };

test('L07-T1: live catalog frozen — rates sum 100, costs and pity unchanged', () => {
  assert.equal(GACHA_COST1, 80);
  assert.equal(GACHA_COST10, 720);
  assert.equal(GACHA_PITY_AT, 60);
  assert.equal(SPARK_SELECT, 120);
  assert.equal(gachaRatesSum(), 100);
  assert.deepEqual(GACHA_RATES.map(([t, w]) => [t, w]), [['ssr', 3], ['ss', 12], ['s', 85]]);
  assert.deepEqual(GACHA_DUP_SHARDS, { ssr: 15, ss: 10, s: 6, a: 4, b: 3 });
  assert.deepEqual(ESSENCE_BY_RARITY, { ssr: 12, ss: 8, s: 5, a: 3, b: 2 });
  assert.equal(LIVE_GACHA.cost1, 80);
  assert.equal(Object.isFrozen(GACHA_RATES), true);
});

test('L07-T2: pity 60 forces SSR; rate SSR resets; player is not mutated', () => {
  const forced = rollTier({ pity: 59, rng: () => 0.99, rates: GACHA_RATES, pityAt: 60 });
  assert.equal(forced.tier, 'ssr');
  assert.equal(forced.pity, 0);
  const ssr = rollTier({ pity: 4, rng: () => 0, rates: GACHA_RATES, pityAt: 60 });
  assert.equal(ssr.tier, 'ssr');
  assert.equal(ssr.pity, 0);
  const src = player({ pity: 59, gems: 800 });
  const pull = prepareSummonPull(src, { n: 1, rng: rngSeq([0.99, 0]), ...pullOpts });
  assert.equal(pull.ok, true);
  assert.equal(pull.pulls[0].t, 'ssr');
  assert.equal(pull.pity, 0);
  assert.equal(src.pity, 59);
  assert.equal(src.gems, 800);
});

test('L07-T3: ×10 floor to S+; free is once per day and only ×1', () => {
  const allB = rngSeq(Array(30).fill(0.99));
  const ten = prepareSummonPull(player(), { n: 10, rng: allB, ...pullOpts });
  assert.equal(ten.ok, true);
  assert.equal(ten.pulls.length, 10);
  assert.equal(ten.pulls.some(p => ['s', 'ss', 'ssr'].includes(p.t)), true);
  assert.equal(ten.pulls[9].t, 's');
  const badFree = prepareSummonPull(player(), { n: 10, free: true, day: 9, ...pullOpts });
  assert.equal(badFree.code, 'INVALID_COUNT');
  const free = prepareSummonPull(player(), { n: 1, free: true, day: 9, rng: rngSeq([0.5, 0]), ...pullOpts });
  assert.equal(free.ok, true);
  assert.equal(free.gemsSpent, 0);
  assert.equal(free.freePullDay, 9);
  const again = prepareSummonPull(player({ freePullDay: 9 }), { n: 1, free: true, day: 9, ...pullOpts });
  assert.equal(again.code, 'FREE_USED');
});

test('L07-P1: funds check, campaign untouched, empty official-12 pool does not debit', () => {
  const poor = prepareSummonPull(player({ gems: 40 }), { n: 1, rng: () => 0, ...pullOpts });
  assert.equal(poor.code, 'NOT_ENOUGH_GEMS');
  const ok = prepareSummonPull(player({ gems: 800, clearedChapters: [0, 1] }), { n: 1, rng: rngSeq([0.5, 0]), ...pullOpts });
  assert.equal(ok.ok, true);
  assert.equal(ok.gems, 720);
  assert.deepEqual(ok.clearedChapters, [0, 1]);
  const locked = prepareSummonPull(player({ gems: 800 }), {
    n: 1,
    rng: () => 0,
    heroes: officialAllSsr,
    rosterIds: official12
  });
  assert.equal(locked.code, 'EMPTY_POOL');
  assert.equal(locked.gems, undefined);
  const banner = validateSummonBanner(GACHA_RATES, t => poolOfCatalog(official12, officialAllSsr, t));
  assert.equal(banner.ok, false);
  assert.equal(banner.reason, 'EMPTY_POOL');
});

test('L07-P2: new own vs duplicate shards and essence; spark increases by n', () => {
  const first = prepareSummonPull(player(), { n: 1, rng: rngSeq([0.5, 0]), ...pullOpts });
  assert.equal(first.ok, true);
  assert.equal(first.economy.spark, 1);
  const id = first.pulls[0].id;
  assert.equal(first.heroes[id].owned, true);
  assert.equal(first.pulls[0].dup, false);
  const src = player({ heroes: { ...player().heroes, [id]: { owned: true } }, economy: { spark: 3, dreamEssence: 0 } });
  const dup = prepareSummonPull(src, { n: 1, rng: rngSeq([0.5, 0]), ...pullOpts });
  assert.equal(dup.ok, true);
  assert.equal(dup.pulls[0].dup, true);
  assert.equal(dup.shards[id] > 0, true);
  assert.equal(dup.economy.spark, 4);
  assert.equal(dup.economy.dreamEssence > 0, true);
  assert.equal(src.economy.spark, 3);
});

test('L07-P3: Hồi Ức 120 picks SSR; owned converts to 30 shards + 8 essence', () => {
  const poor = prepareSparkSelect(player({ economy: { spark: 119 } }), 'ssr_a', { heroes: mixedHeroes });
  assert.equal(poor.code, 'NOT_ENOUGH_SPARK');
  const notSsr = prepareSparkSelect(player({ economy: { spark: 120 } }), 's_a', { heroes: mixedHeroes });
  assert.equal(notSsr.code, 'NOT_SSR');
  const fresh = prepareSparkSelect(player({ economy: { spark: 120 } }), 'ssr_a', { heroes: mixedHeroes });
  assert.equal(fresh.ok, true);
  assert.equal(fresh.heroes.ssr_a.owned, true);
  assert.equal(fresh.economy.spark, 0);
  assert.equal(fresh.msg.includes('gia nhập'), true);
  const owned = prepareSparkSelect(player({
    heroes: { ssr_a: { owned: true } },
    shards: {},
    economy: { spark: 120, dreamEssence: 1 }
  }), 'ssr_a', { heroes: mixedHeroes });
  assert.equal(owned.ok, true);
  assert.equal(owned.shards.ssr_a, 30);
  assert.equal(owned.economy.dreamEssence, 9);
  assert.equal(owned.economy.spark, 0);
});

const uiPath = new URL('../src/ui/summon-runtime.js', import.meta.url);
const cssPath = new URL('../src/ui/summon-screen.css', import.meta.url);
const injectPath = new URL('../scripts/summon-runtime-v1.mjs', import.meta.url);

test('L07-P4: lacquer screen is wired and does not add a second hub landmark', () => {
  const ui = readFileSync(uiPath, 'utf8');
  const css = readFileSync(cssPath, 'utf8');
  const inject = readFileSync(injectPath, 'utf8');
  assert.match(ui, /prepareSummonPull/);
  assert.match(ui, /Vòng Chiêu Mộ/);
  assert.match(ui, /data-summon-pull/);
  assert.doesNotMatch(ui, /data-art-go="summon"/);
  assert.match(css, /#hvSummonRoot/);
  assert.match(css, /[.]hv-sum-grid/);
  assert.match(inject, /summon-pull[.]mjs/);
  new Function(ui);
  const build = join(root, 'scripts/build-static.mjs');
  if (existsSync(build)) {
    assert.match(readFileSync(build, 'utf8'), /summon-runtime-v1[.]mjs/);
  }
});
