import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BATTLE_BACKGROUND_ENTRIES,
  BATTLE_BACKGROUND_BY_BATTLE_ID,
  selectBattleBackground
} from '../src/domain/battle/background-registry.mjs';

test('20 battle-stage entries are unique and ordered', () => {
  assert.equal(BATTLE_BACKGROUND_ENTRIES.length, 20);
  assert.deepEqual(BATTLE_BACKGROUND_ENTRIES.map((entry) => entry.index), Array.from({ length: 20 }, (_, index) => index + 1));
  assert.equal(new Set(BATTLE_BACKGROUND_ENTRIES.map((entry) => entry.source)).size, 20);
  assert.ok(BATTLE_BACKGROUND_ENTRIES.every((entry) => entry.source.startsWith('assets/battle/backgrounds-v1/')));
});

test('campaign IDs select their authored stage and reserve fallback themes', () => {
  assert.equal(selectBattleBackground('ch01_fight_street_mobs').index, 1);
  assert.equal(selectBattleBackground('ch06_boss_phase_3').index, 18);
  assert.equal(selectBattleBackground('luyen_tap').index, 19);
  assert.equal(BATTLE_BACKGROUND_BY_BATTLE_ID.default.index, 20);
  assert.equal(selectBattleBackground('').index, 20);
});

test('unknown battle IDs receive a deterministic stage', () => {
  const first = selectBattleBackground('weekly-raid-2026-09');
  const second = selectBattleBackground('weekly-raid-2026-09');
  assert.equal(first.source, second.source);
  assert.ok(first.index >= 1 && first.index <= 20);
});
