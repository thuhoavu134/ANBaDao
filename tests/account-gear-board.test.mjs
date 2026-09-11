import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  ACCOUNT_GEAR_SLOTS,
  accountGearBonus,
  accountGearMasterLevel,
  candidatesForGearSlot,
  emptyAccountGear,
  prepareAccountGearChange,
  prepareQuickEquip,
  prepareQuickUnequip,
  prepareSmeltSelection,
  rankGearItem,
  smeltCandidates
} from '../src/domain/equipment/account-board.mjs';

const rarOrder = { ssr: 0, ss: 1, s: 2, a: 3, b: 4 };
const statMap = { weapon: 'atk', armor: 'hp', charm: 'def', boots: 'spd' };
const itemStat = item => ({ weapon: 12, armor: 120, charm: 10, boots: 4 }[item.slot] * (1 + 0.12 * item.lvl));
const kinds = Object.fromEntries(ACCOUNT_GEAR_SLOTS.map(slot => [slot.id, slot.kind]));

function player(extra = {}) {
  return {
    inventory: [
      { uid: 1, slot: 'armor', rar: 's', lvl: 3 },
      { uid: 2, slot: 'weapon', rar: 'ssr', lvl: 0 },
      { uid: 3, slot: 'charm', rar: 'a', lvl: 1 },
      { uid: 4, slot: 'boots', rar: 'b', lvl: 0 },
      { uid: 5, slot: 'weapon', rar: 'b', lvl: 9 }
    ],
    gear: emptyAccountGear(),
    ...extra
  };
}

test('board keeps twelve roman slots, three of each forge kind', () => {
  assert.equal(ACCOUNT_GEAR_SLOTS.length, 12);
  assert.deepEqual(ACCOUNT_GEAR_SLOTS.map(slot => slot.roman), ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']);
  const counts = { weapon: 0, armor: 0, charm: 0, boots: 0 };
  for (const slot of ACCOUNT_GEAR_SLOTS) counts[slot.kind]++;
  assert.deepEqual(counts, { weapon: 3, armor: 3, charm: 3, boots: 3 });
});

test('empty board stays at master 0 and grants no combat bonus', () => {
  const state = player();
  assert.equal(accountGearMasterLevel(state.gear, state.inventory), 0);
  assert.deepEqual(accountGearBonus(state.gear, state.inventory, { statMap, itemStat }), { hp: 0, atk: 0, def: 0, spd: 0 });
});

test('matching kind equips, wrong kind is rejected, and a uid only occupies one slot', () => {
  const state = player();
  const helmet = prepareAccountGearChange(state, { slotId: 'I', uid: 1, action: 'equip' });
  assert.equal(helmet.ok, true);
  assert.equal(helmet.gear.I, 1);
  assert.equal(JSON.stringify(state.gear), JSON.stringify(emptyAccountGear()));
  assert.equal(prepareAccountGearChange(state, { slotId: 'I', uid: 2, action: 'equip' }).code, 'WRONG_SLOT_KIND');
  state.gear = helmet.gear;
  const moved = prepareAccountGearChange(state, { slotId: 'V', uid: 1, action: 'equip' });
  assert.equal(moved.ok, true);
  assert.equal(moved.gear.I, null);
  assert.equal(moved.gear.V, 1);
});

test('unequip clears the worn slot and rejects items the board is not wearing', () => {
  const state = player({ gear: { ...emptyAccountGear(), XII: 2 } });
  const cleared = prepareAccountGearChange(state, { slotId: 'XII', uid: 2, action: 'unequip' });
  assert.equal(cleared.ok, true);
  assert.equal(cleared.gear.XII, null);
  assert.equal(prepareAccountGearChange({ ...state, gear: cleared.gear }, { slotId: 'XII', uid: 2, action: 'unequip' }).code, 'EQUIPMENT_NOT_WORN');
});

test('picker lists unused matching pieces and skips the piece already in that slot', () => {
  const state = player({ gear: { ...emptyAccountGear(), XII: 2 } });
  const empty = candidatesForGearSlot(state, 'VI', { rarOrder });
  assert.deepEqual(empty.map(item => item.uid), [5]);
  const occupied = candidatesForGearSlot(state, 'XII', { rarOrder });
  assert.deepEqual(occupied.map(item => item.uid), [5]);
});

test('quick equip fills empty slots with the best leftover of each kind', () => {
  const state = player();
  const result = prepareQuickEquip(state, { rarOrder });
  assert.equal(result.ok, true);
  assert.equal(result.changed, 5);
  assert.equal(result.gear.I, 1);
  assert.equal(result.gear.XII, 2);
  assert.equal(result.gear.II, 3);
  assert.equal(result.gear.VII, 4);
  assert.equal(result.gear.VI, 5);
  const again = prepareQuickEquip({ ...state, gear: result.gear }, { rarOrder });
  assert.equal(again.changed, 0);
  assert.equal(again.message, 'Không có trang bị tốt hơn để mang');
});

test('quick unequip returns every board link to the bag', () => {
  const worn = prepareQuickEquip(player(), { rarOrder }).gear;
  const cleared = prepareQuickUnequip({ gear: worn });
  assert.equal(cleared.ok, true);
  assert.deepEqual(cleared.gear, emptyAccountGear());
});

test('worn pieces add their stats to the whole roster and master level is the lowest shared enhance', () => {
  const inventory = [
    { uid: 1, slot: 'armor', rar: 's', lvl: 4 },
    { uid: 2, slot: 'weapon', rar: 'a', lvl: 4 },
    { uid: 3, slot: 'charm', rar: 'a', lvl: 4 },
    { uid: 4, slot: 'boots', rar: 'b', lvl: 3 }
  ];
  const gear = emptyAccountGear();
  gear.I = 1; gear.XII = 2; gear.II = 3; gear.VII = 4;
  assert.equal(accountGearMasterLevel(gear, inventory), 0);
  gear.V = 1; // still missing eight slots
  assert.equal(accountGearMasterLevel(gear, inventory), 0);
  const full = emptyAccountGear();
  for (const slot of ACCOUNT_GEAR_SLOTS) full[slot.id] = { armor: 1, weapon: 2, charm: 3, boots: 4 }[slot.kind];
  assert.equal(accountGearMasterLevel(full, inventory), 3);
  const bonus = accountGearBonus(full, inventory, { statMap, itemStat });
  assert.ok(bonus.hp > 0 && bonus.atk > 0 && bonus.def > 0 && bonus.spd > 0);
});

test('ssr outranks a higher-level common piece when ranking bag items', () => {
  assert.ok(rankGearItem({ rar: 'ssr', lvl: 0 }, rarOrder) > rankGearItem({ rar: 'b', lvl: 15 }, rarOrder));
});


test('smelt rejects empty picks, worn board pieces and locked bag items', () => {
  const state = player({
    gear: { ...emptyAccountGear(), XII: 2 },
    inventory: player().inventory.concat([{ uid: 6, slot: 'boots', rar: 'a', lvl: 0, locked: true }])
  });
  assert.equal(prepareSmeltSelection(state, []).code, 'NO_SELECTION');
  assert.equal(prepareSmeltSelection(state, []).message, 'Hãy chọn trang bị!');
  assert.equal(prepareSmeltSelection(state, [2]).code, 'EQUIPMENT_WORN');
  assert.equal(prepareSmeltSelection(state, [6]).code, 'ITEM_LOCKED');
  assert.equal(smeltCandidates(state).some(item => item.uid === 6), false);
  const heroWorn = player({
    gear: emptyAccountGear(),
    equip: { 'ong-pho': { weapon: 2 } }
  });
  assert.equal(prepareSmeltSelection(heroWorn, [2]).code, 'EQUIPMENT_WORN');
});

test('smelt quotes tinh for unused extras and sums a batch without touching worn uids', () => {
  const state = player({ gear: { ...emptyAccountGear(), XII: 2 } });
  const bag = smeltCandidates(state);
  assert.deepEqual(bag.map(item => item.uid), [1, 3, 4, 5]);
  assert.deepEqual(smeltCandidates(state, { kind: 'weapon' }).map(item => item.uid), [5]);
  const one = prepareSmeltSelection(state, [5]);
  assert.equal(one.ok, true);
  assert.equal(one.gain, 23);
  assert.deepEqual(one.uids, [5]);
  assert.equal(one.quotes[0].gain, 23);
  const batch = prepareSmeltSelection(state, [1, 3, 5]);
  assert.equal(batch.ok, true);
  assert.equal(batch.gain, 18 + 10 + 23);
  assert.deepEqual(batch.uids, [1, 3, 5]);
});
const ui = readFileSync(new URL('../src/ui/account-gear-runtime.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/ui/account-gear-board.css', import.meta.url), 'utf8');

test('assist wheel and 12-slot board are the Trợ trận equipment surface', () => {
  assert.match(ui, /data-gear-slot="XII"/);
  assert.match(ui, /Mặc nhanh/);
  assert.match(ui, /Tháo nhanh/);
  assert.match(ui, /Cường hóa nhanh/);
  assert.match(ui, /Bậc Thầy Trang Bị/);
  assert.match(ui, /Dung luyện x1/);
  assert.match(ui, /Hãy chọn trang bị/);
  assert.match(ui, /Cường hóa x1/);
  assert.match(ui, /data-gear-view="smelt"/);
  assert.match(ui, /openSmelt/);
  assert.match(ui, /openAssistWheel/);
  assert.match(ui, /navTo\('team'/);
  assert.match(css, /hv-gear-slots/);
  assert.match(css, /\.hv-gear-stage/);
  assert.match(css, /margin-top:\s*auto/);
  assert.match(css, /\.hv-gear-hero/);
  assert.match(css, /object-position:\s*42% 0/);
  assert.match(css, /\.hv-smelt-bag/);
  new Function(ui);
});
