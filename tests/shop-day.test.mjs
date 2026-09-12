import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  SHOP_STALLS,
  SHOP_STALL_COUNT,
  SHOP_STALL_KEYS,
  emptyShop,
  makeShopStock,
  normalizeShop,
  prepareShopBuy,
  prepareShopOpen,
  shopDayIndex,
  shopHasCombatGoods
} from '../src/domain/shop/shop-day.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const heroes = [
  { id: 'co_dao', rarity: 'r' },
  { id: 'ong_pho', rarity: 'ssr' }
];

function player(extra = {}) {
  return {
    gold: 500,
    gems: 800,
    stamina: 80,
    tinh: 60,
    hoat: 60,
    shards: {},
    clearedChapters: [0, 1],
    shop: emptyShop(),
    ...extra
  };
}

test('L08-T1: five stalls, no combat goods, day index matches live formula', () => {
  assert.equal(SHOP_STALL_COUNT, 8);
  assert.equal(SHOP_STALL_KEYS.length, 8);
  assert.equal(shopHasCombatGoods(), false);
  const now = 1_746_000_000_000;
  const tz = -420;
  assert.equal(shopDayIndex(now, tz), Math.floor((now - tz * 60000) / 86400000));
  const shop = normalizeShop(null);
  assert.equal(shop.day, -1);
  assert.equal(shop.stock.length, 0);
  assert.deepEqual(shop.bought, []);
});

test('L08-T2: same day keeps stock; new day resets bought and rolls heroes', () => {
  const first = prepareShopOpen(player(), { day: 10, heroes, rng: () => 0 });
  assert.equal(first.ok, true);
  assert.equal(first.refreshed, true);
  assert.equal(first.shop.stock.length, 8);
  assert.equal(first.shop.stock[0].hero, 'co_dao');
  assert.equal(first.shop.stock[1].hero, 'ong_pho');
  const same = prepareShopOpen(player({ shop: first.shop }), { day: 10, heroes, rng: () => 0.9 });
  assert.equal(same.refreshed, false);
  assert.equal(same.shop.stock[0].hero, 'co_dao');
  const next = prepareShopOpen(player({
    shop: { ...first.shop, bought: ['stam'] }
  }), { day: 11, heroes, rng: () => 0 });
  assert.equal(next.refreshed, true);
  assert.deepEqual(next.shop.bought, []);
  assert.equal(next.shop.day, 11);
  assert.equal(first.shop.bought.length, 0);
});

test('L08-T3: prices keep the live catalog; second buy is sold out', () => {
  const stock = makeShopStock({ heroes, rng: () => 0 });
  const byKey = Object.fromEntries(stock.map(it => [it.k, it]));
  assert.equal(byKey.sh10.gold, 320);
  assert.equal(byKey.sh5ssr.gems, 60);
  assert.equal(byKey.stam.gold, 160);
  assert.equal(byKey.gold.gems, 40);
  assert.equal(byKey.gold.qty, 450);
  assert.equal(byKey.craft.gold, 220);
  assert.equal(byKey.craft.tinh, 25);
  assert.equal(byKey.craft.hoat, 25);
  assert.equal(byKey.binh_tinh.gold, 280);
  assert.equal(byKey.binh_tinh.tinh, 30);
  assert.equal(byKey.lo_hoat.hoat, 30);
  assert.equal(byKey.goi_ngoc.gems, 50);
  assert.equal(byKey.goi_ngoc.tinh, 80);
  const opened = prepareShopOpen(player(), { day: 3, heroes, rng: () => 0 });
  const buy = prepareShopBuy(player({ shop: opened.shop }), 'stam', { day: 3, heroes });
  assert.equal(buy.ok, true);
  assert.equal(buy.gold, 340);
  assert.equal(buy.stamina, 100);
  assert.equal(buy.shop.bought.includes('stam'), true);
  assert.equal(opened.shop.bought.includes('stam'), false);
  const tinh = prepareShopBuy(player({ gold: 300, shop: opened.shop }), 'binh_tinh', { day: 3, heroes });
  assert.equal(tinh.ok, true);
  assert.equal(tinh.tinh, 90);
  assert.equal(tinh.hoat, 60);
  const gemPack = prepareShopBuy(player({ gems: 50, shop: opened.shop }), 'goi_ngoc', { day: 3, heroes });
  assert.equal(gemPack.ok, true);
  assert.equal(gemPack.tinh, 140);
  assert.equal(gemPack.hoat, 140);
  assert.equal(gemPack.gems, 0);
  const again = prepareShopBuy(player({ shop: buy.shop, gold: buy.gold, stamina: buy.stamina }), 'stam', { day: 3, heroes });
  assert.equal(again.code, 'ALREADY_BOUGHT');
});

test('L08-P1: rolling the day is independent of campaign chapters', () => {
  const buy = prepareShopBuy(player({ shop: { day: 1, stock: makeShopStock({ heroes, rng: () => 0 }), bought: [] } }), 'craft', {
    day: 1,
    heroes
  });
  assert.equal(buy.ok, true);
  assert.deepEqual(buy.clearedChapters, [0, 1]);
  assert.equal(buy.tinh, 85);
  assert.equal(buy.hoat, 85);
});

test('L08-P2: shop catalog never sells combat power', () => {
  assert.equal(SHOP_STALLS.every(s => !s.atk && !s.hp && !s.def && !s.spd && !s.power), true);
  assert.equal(shopHasCombatGoods(SHOP_STALLS), false);
  const stock = makeShopStock({ heroes, rng: () => 0 });
  assert.equal(stock.every(s => !s.atk && !s.hp && !s.def && !s.spd), true);
});

test('L08-P3: funds check and grants match live; input player is not mutated', () => {
  const opened = prepareShopOpen(player({ gold: 100 }), { day: 4, heroes, rng: () => 0 });
  const poor = prepareShopBuy(player({ gold: 100, shop: opened.shop }), 'sh10', { day: 4, heroes });
  assert.equal(poor.code, 'NOT_ENOUGH_GOLD');
  const gemPoor = prepareShopBuy(player({ gems: 10, shop: opened.shop }), 'sh5ssr', { day: 4, heroes });
  assert.equal(gemPoor.code, 'NOT_ENOUGH_GEMS');
  const src = player({ shop: opened.shop, gold: 500, gems: 80 });
  const pack = prepareShopBuy(src, 'gold', { day: 4, heroes });
  assert.equal(pack.ok, true);
  assert.equal(pack.gems, 40);
  assert.equal(pack.gold, 950);
  assert.equal(src.gold, 500);
  assert.equal(src.gems, 80);
  const shards = prepareShopBuy(player({ shop: opened.shop }), 'sh10', { day: 4, heroes });
  assert.equal(shards.shards.co_dao, 10);
  const rare = prepareShopBuy(player({ shop: opened.shop }), 'sh5ssr', { day: 4, heroes });
  assert.equal(rare.shards.ong_pho, 5);
  const cap = prepareShopBuy(player({ shop: opened.shop, stamina: 120 }), 'stam', { day: 4, heroes, stamCap: 120 });
  assert.equal(cap.stamina, 120);
  assert.equal(cap.gold, 340);
});

const uiPath = new URL('../src/ui/shop-runtime.js', import.meta.url);
const cssPath = new URL('../src/ui/shop-screen.css', import.meta.url);
const injectPath = new URL('../scripts/shop-runtime-v1.mjs', import.meta.url);

test('L08-P4: lacquer screen is wired and does not add a second hub landmark', () => {
  const ui = readFileSync(uiPath, 'utf8');
  const css = readFileSync(cssPath, 'utf8');
  const inject = readFileSync(injectPath, 'utf8');
  assert.match(ui, /data-shop-buy/);
  assert.match(ui, /prepareShopBuy/);
  assert.match(ui, /Chợ Mộng/);
  assert.doesNotMatch(ui, /data-art-go="shop"/);
  assert.match(css, /#hvShopRoot/);
  assert.match(css, /[.]hv-shop-shelf/);
  assert.match(inject, /shop-day[.]mjs/);
  new Function(ui);
  const build = join(root, 'scripts/build-static.mjs');
  if (existsSync(build)) {
    assert.match(readFileSync(build, 'utf8'), /shop-runtime-v1[.]mjs/);
  }
});
