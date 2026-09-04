import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MAIN_QUEST_SCHEMA,
  claimMainQuest,
  bootstrapMainQuestState,
  createMainQuestState,
  getCurrentMainQuest,
  normalizeMainQuestState,
  recordMainQuestBattle
} from '../src/domain/quest/main-quest.mjs';

test('main quest state follows chapter and stage bounds', () => {
  const state = normalizeMainQuestState({ chapterIndex: 8, stageIndex: 9 }, {
    chapterCount: 2,
    stageCount: () => 3
  });
  assert.equal(state.schema, MAIN_QUEST_SCHEMA);
  assert.deepEqual([state.chapterIndex, state.stageIndex, state.progress], [1, 2, 0]);
});

test('bootstrap follows an existing campaign cursor instead of restarting', () => {
  const state = bootstrapMainQuestState({
    chapters: [{ idx: 0 }, { idx: 1 }, { idx: 2 }],
    unlockedChapters: [0, 1],
    clearedChapters: [0],
    campaignStages: { 1: 2 },
    campaignCycle: 2
  });
  assert.deepEqual([state.chapterIndex, state.stageIndex, state.allComplete, state.campaignCycle], [1, 2, false, 2]);
  const finished = bootstrapMainQuestState({
    chapters: [{ idx: 0 }, { idx: 1 }],
    unlockedChapters: [0, 1],
    clearedChapters: [0, 1],
    campaignCycle: 2
  });
  assert.equal(finished.allComplete, true);
  assert.equal(finished.campaignCycle, 2);
});

test('matching victory completes the current quest exactly once', () => {
  const state = createMainQuestState();
  const quest = getCurrentMainQuest(state, {
    chapterCount: 2,
    stageCount: 2,
    battleId: 'ch01_fight_street_mobs',
    title: 'Mộng Phố'
  });
  const won = recordMainQuestBattle(state, quest, { win: true, battleId: quest.battleId, at: 42 });
  assert.equal(won.changed, true);
  assert.equal(won.state.progress, 1);
  assert.equal(recordMainQuestBattle(won.state, quest, { win: true, battleId: quest.battleId }).changed, false);
  assert.equal(recordMainQuestBattle(state, quest, { win: true, battleId: 'wrong' }).changed, false);
  assert.equal(recordMainQuestBattle(state, quest, { win: true }).changed, false);
});

test('claim advances to the next stage and keeps a reward payload', () => {
  const state = createMainQuestState({ progress: 1 });
  const quest = getCurrentMainQuest(state, { chapterCount: 2, stageCount: 2, battleId: 'b1' });
  const claimed = claimMainQuest(state, quest, { chapterCount: 2, stageCount: 2, reward: { gold: 180 } });
  assert.equal(claimed.changed, true);
  assert.deepEqual(claimed.reward, { gold: 180 });
  assert.deepEqual([claimed.state.chapterIndex, claimed.state.stageIndex, claimed.state.progress], [0, 1, 0]);
  assert.ok(claimed.state.claimed.includes('main:0:0'));
});
