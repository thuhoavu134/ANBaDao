import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  BACH_BAO_COST,
  BACH_BAO_SLOT_COUNT,
  BACH_BAO_SLOTS,
  FESTIVAL_MARKS,
  FESTIVAL_MARK_KEYS,
  HOADANG_COST,
  HOADANG_PER_DAY,
  LANTERN_THEME_IDS,
  LANTERN_THEMES,
  LIVE_FESTIVAL,
  emptyBachBao,
  emptyHoadang,
  prepareFestivalDay,
  prepareOpenChest,
  prepareReleaseLantern,
  prepareSetTheme,
  prepareSpin
} from '../src/domain/festival/festival-run.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const heroes = {
  ong_hang_pho: { name: 'Ông Phở', rarity: 'ssr' },
  ong_chu_wifi: { name: 'Ông Chú Wifi', rarity: 'ss' }
};
const rosterIds = ['ong_hang_pho', 'ong_chu_wifi'];

function player(extra = {}) {
  return {
    gold: 400,
    gems: 80,
    so: 3,
    stamina: 80,
    tinh: 10,
    hoat: 10,
    shards: {},
    inventory: [],
    itemSeq: 0,
    clearedChapters: [0, 1],
    hoadang: { ...emptyHoadang(), day: 9, theme: 'ankhang' },
    bachBao: { ...emptyBachBao() },
    ...extra
  };
}

function args(extra = {}) {
  return { day: 9, heroes, rosterIds, rng: () => 0, stamCap: 120, now: 1, ...extra };
}

test('L20-T1: live catalog frozen — 5 đèn, 🪙100, 3 hướng, mốc 3/7/12, 20 ô, bảng rương', () => {
  assert.equal(HOADANG_PER_DAY, 5);
  assert.equal(HOADANG_COST, 100);
  assert.deepEqual(LANTERN_THEME_IDS, ['ankhang', 'duyenpho', 'khailo']);
  assert.equal(LANTERN_THEMES.ankhang.weights[0][2], 40);
  assert.equal(LANTERN_THEMES.duyenpho.weights[0][0], 'shard');
  assert.equal(LANTERN_THEMES.khailo.weights[0][1], 220);
  assert.deepEqual(FESTIVAL_MARK_KEYS, [3, 7, 12]);
  assert.equal(FESTIVAL_MARKS[0].reward.gold, 500);
  assert.equal(FESTIVAL_MARKS[0].reward.gems, 15);
  assert.equal(FESTIVAL_MARKS[1].reward.gold, 900);
  assert.equal(FESTIVAL_MARKS[1].reward.gems, 25);
  assert.equal(FESTIVAL_MARKS[2].reward.gold, 1500);
  assert.equal(FESTIVAL_MARKS[2].reward.gems, 40);
  assert.equal(BACH_BAO_SLOT_COUNT, 20);
  assert.equal(BACH_BAO_SLOTS.length, 20);
  assert.equal(BACH_BAO_COST, 1);
  assert.equal(LIVE_FESTIVAL.chestBau.ss30, 35);
  assert.equal(LIVE_FESTIVAL.chestBau.ssr20, 33);
  assert.equal(LIVE_FESTIVAL.chestBau.equip5, 22);
  assert.equal(LIVE_FESTIVAL.chestBau.gems120, 10);
  assert.equal(LIVE_FESTIVAL.chestSupreme.ssr40, 45);
  assert.equal(LIVE_FESTIVAL.chestSupreme.equip10, 40);
  assert.equal(LIVE_FESTIVAL.chestSupreme.ssr60, 15);
  assert.equal(Object.isFrozen(LANTERN_THEMES), true);
  assert.equal(BACH_BAO_SLOTS[6].t, 'chest');
  assert.equal(BACH_BAO_SLOTS[19].t, 'supreme');
});

test('L20-T2: đèn đầu miễn phí, sau đó 🪙100, trần 5/ngày; không mutate input', () => {
  const src = player();
  const first = prepareReleaseLantern(src, args());
  assert.equal(first.ok, true);
  assert.equal(first.free, true);
  assert.equal(first.hoadang.count, 1);
  assert.equal(src.gold, 400);
  assert.equal(src.hoadang.count, 0);
  assert.deepEqual(src.clearedChapters, [0, 1]);
  const paid = prepareReleaseLantern({ ...src, gold: first.gold, hoadang: first.hoadang, stamina: first.stamina, shards: first.shards }, args());
  assert.equal(paid.ok, true);
  assert.equal(paid.free, false);
  assert.equal(paid.gold, first.gold - 100);
  assert.equal(paid.hoadang.count, 2);
  const capSrc = player({ hoadang: { ...emptyHoadang(), day: 9, count: 5, theme: 'ankhang' } });
  const cap = prepareReleaseLantern(capSrc, args());
  assert.equal(cap.ok, false);
  assert.equal(cap.code, 'HOADANG_CAP');
  const broke = prepareReleaseLantern(player({ gold: 50, hoadang: { ...emptyHoadang(), day: 9, count: 1, theme: 'ankhang' } }), args());
  assert.equal(broke.code, 'INSUFFICIENT_GOLD');
});

test('L20-T3: Tam Nguyện đủ 3 hướng +1 Lễ Ấn · +🪙150 · +💎5 một lần/ngày', () => {
  const src = player({
    hoadang: {
      ...emptyHoadang(),
      day: 9,
      theme: 'khailo',
      themesUsed: ['ankhang', 'duyenpho'],
      marks: 0,
      setClaimed: false
    }
  });
  const hit = prepareReleaseLantern(src, args());
  assert.equal(hit.ok, true);
  assert.equal(hit.hoadang.themesUsed.length, 3);
  assert.equal(hit.hoadang.setClaimed, true);
  assert.equal(hit.hoadang.marks, 1);
  assert.equal(src.gold, 400);
  assert.equal(src.gems, 80);
  assert.equal(src.hoadang.marks, 0);
  assert.match(hit.setBonus, /Tam Nguyện/);
  const again = prepareReleaseLantern({
    ...src,
    gold: hit.gold,
    gems: hit.gems,
    hoadang: hit.hoadang,
    stamina: hit.stamina,
    shards: hit.shards
  }, args({ rng: () => 0 }));
  assert.equal(again.ok, true);
  assert.equal(again.hoadang.marks, 1);
  assert.equal(again.setBonus, '');
});

test('L20-P1: mốc ấn 3/7/12; rollover ngày reset đèn/hướng, giữ ấn', () => {
  const src = player({
    hoadang: {
      ...emptyHoadang(),
      day: 9,
      theme: 'khailo',
      themesUsed: ['ankhang', 'duyenpho'],
      marks: 2,
      claimedMarks: [],
      setClaimed: false
    }
  });
  const hit = prepareReleaseLantern(src, args());
  assert.equal(hit.hoadang.marks, 3);
  assert.deepEqual(hit.milestones.map(m => m.n), [3]);
  assert.equal(hit.hoadang.claimedMarks.includes(3), true);
  assert.equal(src.gold, 400);
  const rolled = prepareFestivalDay({ gold: hit.gold, gems: hit.gems, hoadang: hit.hoadang, bachBao: hit.bachBao }, { day: 10 });
  assert.equal(rolled.refreshed, true);
  assert.equal(rolled.hoadang.count, 0);
  assert.deepEqual(rolled.hoadang.themesUsed, []);
  assert.equal(rolled.hoadang.setClaimed, false);
  assert.equal(rolled.hoadang.marks, 3);
  assert.equal(rolled.hoadang.claimedMarks.includes(3), true);
});

test('L20-P2: Bách Bảo Luân 20 ô, 1🐚 / lượt; thiếu sò fail; không mutate input', () => {
  const src = player();
  const spin = prepareSpin(src, args());
  assert.equal(spin.ok, true);
  assert.equal(spin.idx, 0);
  assert.equal(spin.slot.t, 'gold');
  assert.equal(spin.so, 2);
  assert.equal(spin.gold, 660);
  assert.equal(spin.bachBao.spins, 1);
  assert.equal(src.so, 3);
  assert.equal(src.gold, 400);
  const empty = prepareSpin(player({ so: 0 }), args());
  assert.equal(empty.code, 'INSUFFICIENT_SO');
  const chestSpin = prepareSpin(src, args({ rng: () => 0.3 }));
  assert.equal(chestSpin.idx, 6);
  assert.equal(chestSpin.bachBao.chests, 1);
  assert.equal(chestSpin.grant.type, 'chest');
});

test('L20-P3: Rương Báu 35/33/22/10 và Chí Bảo 45/40/15', () => {
  const bau = player({ bachBao: { ...emptyBachBao(), chests: 4, supreme: 3 } });
  const ss = prepareOpenChest(bau, args({ kind: 'normal', rng: () => 0.20 }));
  assert.equal(ss.ok, true);
  assert.equal(ss.grant.type, 'shards');
  assert.equal(ss.grant.rarity, 'ss');
  assert.equal(ss.grant.qty, 30);
  assert.equal(ss.shards.ong_chu_wifi, 30);
  const ssr = prepareOpenChest(bau, args({ kind: 'normal', rng: () => 0.50 }));
  assert.equal(ssr.grant.rarity, 'ssr');
  assert.equal(ssr.grant.qty, 20);
  const eq = prepareOpenChest(bau, args({ kind: 'normal', rng: () => 0.80 }));
  assert.equal(eq.grant.type, 'equip');
  assert.equal(eq.grant.lvl, 5);
  assert.equal(eq.inventory.length, 1);
  const gem = prepareOpenChest(bau, args({ kind: 'normal', rng: () => 0.95 }));
  assert.equal(gem.grant.type, 'gems');
  assert.equal(gem.gems, 200);
  const s40 = prepareOpenChest(bau, args({ kind: 'supreme', rng: () => 0.20 }));
  assert.equal(s40.grant.qty, 40);
  const sEq = prepareOpenChest(bau, args({ kind: 'supreme', rng: () => 0.60 }));
  assert.equal(sEq.grant.lvl, 10);
  const s60 = prepareOpenChest(bau, args({ kind: 'supreme', rng: () => 0.90 }));
  assert.equal(s60.grant.qty, 60);
  const none = prepareOpenChest(player(), args({ kind: 'normal' }));
  assert.equal(none.code, 'NO_CHEST');
  assert.equal(prepareSetTheme(player(), { id: 'nope', day: 9 }).code, 'UNKNOWN_THEME');
  const themed = prepareSetTheme(player(), { id: 'duyenpho', day: 9 });
  assert.equal(themed.hoadang.theme, 'duyenpho');
});

const uiPath = new URL('../src/ui/festival-runtime.js', import.meta.url);
const cssPath = new URL('../src/ui/festival-screen.css', import.meta.url);
const injectPath = new URL('../scripts/festival-runtime-v1.mjs', import.meta.url);

test('L20-P4: lacquer #hvFestivalRoot; no second hub landmark; inject after hunt', () => {
  const ui = readFileSync(uiPath, 'utf8');
  const css = readFileSync(cssPath, 'utf8');
  const inject = readFileSync(injectPath, 'utf8');
  assert.match(ui, /prepareReleaseLantern/);
  assert.match(ui, /prepareSpin/);
  assert.match(ui, /Tam Nguyện Sông Mơ/);
  assert.match(ui, /data-fest-release/);
  assert.doesNotMatch(ui, /data-art-go="festival"/);
  assert.match(ui, /JOURNEY_UNLOCK\.festival/);
  assert.match(ui, /festival\.ch = 0/);
  assert.match(css, /#hvFestivalRoot/);
  assert.match(css, /[.]hv-fest-wheel/);
  assert.match(inject, /festival-run[.]mjs/);
  new Function(ui);
  const build = join(root, 'scripts/build-static.mjs');
  if (existsSync(build)) {
    assert.match(readFileSync(build, 'utf8'), /hunt-runtime-v1[\s\S]*festival-runtime-v1/);
  }
});
