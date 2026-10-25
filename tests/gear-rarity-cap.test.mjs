// Owner 2026-10-25: trần cường hoá theo phẩm + màu cường hoá không được đè lên phẩm đã có màu sẵn.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { forgeMaxLevel, prepareForgeCommand, FORGE_MAX_LEVEL_BY_RAR } from '../src/domain/equipment/forge-commands.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => readFileSync(join(root, rel), 'utf8');

function loadGlow() {
  const src = read('src/ui/forge-item-assets-runtime.js');
  const start = src.indexOf('const HV_GLOW_RANK');
  const end = src.indexOf('const HV_ENH_FX');
  assert.ok(start > 0 && end > start, 'glow block must exist in the runtime');
  const block = src.slice(start, end);
  // forgeMaxLevel comes from the inlined domain module in the real page; pass the real one in the test.
  return new Function('forgeMaxLevel', block + '\nreturn { enhGlowTier, gearMaxLvl };')(forgeMaxLevel);
}

function enhanceAt(rar, lvl) {
  const state = { inventory: [{ uid: 1, slot: 'armor', rar, lvl, mold: 'strike' }], itemSeq: 1 };
  const config = {
    slots: ['armor', 'weapon', 'charm', 'boots'], molds: { strike: {} }, craftCost: {}, dualCost: {},
    factors: { b: 1, a: 1, s: 1, ss: 1, ssr: 1 }
  };
  return prepareForgeCommand(state, config, 'enhance', { uid: 1 });
}

test('trần cường hoá theo phẩm: b/a +10, s +12, ss/ssr +15', () => {
  assert.deepEqual({ ...FORGE_MAX_LEVEL_BY_RAR }, { b: 10, a: 10, s: 12, ss: 15, ssr: 15 });
  assert.equal(forgeMaxLevel('b'), 10);
  assert.equal(forgeMaxLevel('a'), 10);
  assert.equal(forgeMaxLevel('s'), 12);
  assert.equal(forgeMaxLevel('ss'), 15);
  assert.equal(forgeMaxLevel('ssr'), 15);
  assert.equal(forgeMaxLevel('la'), 15, 'phẩm lạ vẫn chặn ở trần chung');
});

test('domain chặn cường hoá khi chạm trần của phẩm', () => {
  assert.equal(enhanceAt('b', 9).ok, true);
  assert.equal(enhanceAt('b', 9).level, 10);
  assert.equal(enhanceAt('b', 10).code, 'ITEM_MAX_LEVEL');
  assert.equal(enhanceAt('a', 10).code, 'ITEM_MAX_LEVEL');
  assert.equal(enhanceAt('s', 11).ok, true);
  assert.equal(enhanceAt('s', 12).code, 'ITEM_MAX_LEVEL');
  assert.equal(enhanceAt('ss', 14).ok, true);
  assert.equal(enhanceAt('ss', 15).code, 'ITEM_MAX_LEVEL');
  assert.equal(enhanceAt('ssr', 14).ok, true);
  assert.equal(enhanceAt('ssr', 15).code, 'ITEM_MAX_LEVEL');
});

test('màu cường hoá không đè lên màu sẵn của phẩm', () => {
  const { enhGlowTier } = loadGlow();
  // b/a chưa có màu: lên tím ở +9, trần +10 vẫn tím
  assert.equal(enhGlowTier(8, 'b'), '');
  assert.equal(enhGlowTier(9, 'b'), 'purple');
  assert.equal(enhGlowTier(10, 'b'), 'purple');
  assert.equal(enhGlowTier(10, 'a'), 'purple');
  // s vốn tím: +9 giữ tím, +12 lên vàng kim
  assert.equal(enhGlowTier(9, 's'), 'purple');
  assert.equal(enhGlowTier(12, 's'), 'gold');
  // ss vốn vàng kim: không bị tím đè, +12 vàng, +14 đỏ
  assert.equal(enhGlowTier(9, 'ss'), '');
  assert.equal(enhGlowTier(10, 'ss'), '');
  assert.equal(enhGlowTier(12, 'ss'), 'gold');
  assert.equal(enhGlowTier(14, 'ss'), 'red');
  // ssr vốn đỏ: tím và vàng kim không được đè, chỉ còn đỏ
  assert.equal(enhGlowTier(9, 'ssr'), '');
  assert.equal(enhGlowTier(12, 'ssr'), '');
  assert.equal(enhGlowTier(14, 'ssr'), 'red');
  assert.equal(enhGlowTier(15, 'ssr'), 'red');
  // không truyền phẩm = coi như phẩm chưa màu (giữ hành vi cũ)
  assert.equal(enhGlowTier(9), 'purple');
});

test('mọi chỗ gọi enhGlowTier đều truyền phẩm và dùng trần theo phẩm', () => {
  const board = read('src/ui/account-gear-runtime.js');
  const forge = read('src/ui/forge-item-assets-runtime.js');
  const html = read('index.html');
  for (const src of [board, forge]) {
    assert.doesNotMatch(src, /enhGlowTier\((?:item && )?item\.lvl\)/, 'phải truyền cả rar');
  }
  assert.match(board, /gearMaxLvl\(item\)/);
  assert.match(forge, /gearMaxLvl\(it\)/);
  assert.match(html, /gearMaxLvl\(it\)/);
  assert.doesNotMatch(html, /it\.lvl>=15\?/, 'không còn chặn cứng ở 15');
  assert.equal(loadGlow().gearMaxLvl({ rar: 'b' }), 10);
  assert.equal(loadGlow().gearMaxLvl({ rar: 'ssr' }), 15);
});
