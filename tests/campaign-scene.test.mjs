import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';
import { campaignCheckpoint, replaceCampaignSlot, swapCampaignRows } from '../src/domain/campaign/campaign-view.mjs';
import { prepareFormationChange } from '../src/domain/hero/loadout.mjs';

const chapters = [{ idx: 0, title: 'Mộng phố' }, { idx: 1, title: 'Bến sông' }, { idx: 2, title: 'Rừng thiêng' }];
const sequence = i => ['chapter-' + i + '-a', 'chapter-' + i + '-boss'];
const squad = ['a', 'b', 'c', 'd', 'e', 'f'].map((id, i) => ({ id, row: i < 3 ? 'front' : 'back', slot: i }));
const catalog = Object.fromEntries([...squad.map(p => p.id), 'reserve'].map(id => [id, { name: id }]));
const player = () => ({ heroes: Object.fromEntries(Object.keys(catalog).map(id => [id, { owned: true }])), squad: structuredClone(squad), unlockedChapters: [0, 1], clearedChapters: [0], campaignStages: { 1: 1 }, stamina: 12 });

test('opening AFK and preparation retains the saved checkpoint and does not advance the player', () => {
  const p = player(), before = structuredClone(p);
  for (let i = 0; i < 10; i++) assert.equal(campaignCheckpoint(p, chapters, sequence).battleId, 'chapter-1-boss');
  assert.deepEqual(p, before);
});
test('no unlocked chapter cannot launch; completed campaign replays latest unlocked chapter', () => {
  assert.equal(campaignCheckpoint({ unlockedChapters: [] }, chapters, sequence), null);
  const p = player(); p.clearedChapters = [0, 1];
  assert.deepEqual([campaignCheckpoint(p, chapters, sequence).chapterIndex, campaignCheckpoint(p, chapters, sequence).stageIndex, campaignCheckpoint(p, chapters, sequence).replay], [1, 0, true]);
});
test('invalid or stale stage cursors stay inside authored encounters', () => {
  for (const [raw, expected] of [[-2, 0], [Infinity, 0], ['invalid', 0], [999, 1], [1.8, 1]]) {
    const p = player(); p.campaignStages[1] = raw;
    assert.equal(campaignCheckpoint(p, chapters, sequence).stageIndex, expected);
  }
  assert.equal(campaignCheckpoint(player(), chapters, () => []), null);
});
test('replacing an occupied hero swaps identities and preserves slot rows without duplicating a hero', () => {
  const original = structuredClone(squad);
  const draft = replaceCampaignSlot(squad, 0, 'e', Object.keys(catalog));
  assert.equal(draft[0].id, 'e'); assert.equal(draft[4].id, 'a');
  assert.equal(draft[0].row, 'front'); assert.equal(draft[4].row, 'back');
  assert.equal(new Set(draft.map(p => p.id)).size, 6);
  assert.deepEqual(squad, original);
  assert.equal(prepareFormationChange(player(), catalog, draft).ok, true);
});
test('reserve replacement and row edits remain a draft until confirmed; invalid selections are ignored', () => {
  const p = player(), before = structuredClone(p);
  const draft = replaceCampaignSlot(p.squad, 3, 'reserve', Object.keys(catalog));
  draft[3].row = 'front';
  assert.deepEqual(p, before);
  for (const [index, id] of [[-1, 'a'], [6, 'a'], [1.5, 'a'], [0, 'unowned']]) {
    assert.deepEqual(replaceCampaignSlot(squad, index, id, Object.keys(catalog)), squad);
  }
});

function runtimeHarness() {
  const context = createContext({ console, Intl, URLSearchParams, performance: { now: () => 0 },
    window: { matchMedia: () => ({ matches: false }), addEventListener() {} },
    document: { readyState: 'loading', addEventListener() {} },
    P: player(), DATA: { heroes: catalog, chapters, daily: { chapterCost: 6, stamCap: 120 } },
    OFFICIAL_ROSTER_12_IDS: Object.keys(catalog),
    chapterBattleSequence: sequence, refreshStamina() {}, toast() {}, prepareFormationChange,
    saveFormationCommand: () => ({ ok: true }), starts: 0,
    startChapter: () => runInContext('starts++; sceneState.active = false;', context)
  });
  const strip = path => readFileSync(new URL(path, import.meta.url), 'utf8').replace(/^export\s+/gm, '');
  runInContext(strip('../src/domain/afk/afk-chest.mjs') + '\n' + strip('../src/domain/campaign/campaign-view.mjs') + '\n' + strip('../src/domain/character/luc-anh-idle.mjs') + '\nconst AFK_THAY_MO_IDLE_DURATIONS = [60,70];\n' + strip('../src/ui/campaign-scene.js'), context);
  runInContext('updateLaunchState = () => {}; sceneState.active = true; sceneState.draft = P.squad.map(p => ({...p})); sceneState.checkpoint = currentCheckpoint();', context);
  return context;
}
test('two launch taps reach the existing battle owner once', () => {
  const context = runtimeHarness();
  runInContext('launchPreparedBattle(); launchPreparedBattle();', context);
  assert.equal(context.starts, 1);
});
test('insufficient stamina or failed formation save never reaches battle', () => {
  const insufficient = runtimeHarness(); insufficient.P.stamina = 5;
  runInContext('launchPreparedBattle()', insufficient); assert.equal(insufficient.starts, 0);
  const failed = runtimeHarness(); failed.saveFormationCommand = () => ({ ok: false, message: 'storage full' });
  runInContext('sceneState.draft[0].row = "back"; launchPreparedBattle();', failed);
  assert.equal(failed.starts, 0);
  assert.equal(runInContext('sceneState.launching', failed), false);
});
test('a changed campaign cursor cancels preparation before any save or stamina command', () => {
  const context = runtimeHarness(); context.P.campaignStages[1] = 0;
  runInContext('cancelPreparation = () => { sceneState.draft = null; }; launchPreparedBattle();', context);
  assert.equal(context.starts, 0); assert.equal(runInContext('sceneState.draft', context), null);
});

test('changing row swaps the paired slots and keeps the exact three-by-three battle layout', () => {
  const draft = swapCampaignRows(squad, 2);
  assert.equal(draft[5].id, 'c'); assert.equal(draft[5].row, 'back');
  assert.equal(draft[2].id, 'f'); assert.equal(draft[2].row, 'front');
  assert.equal(draft.filter(pick => pick.row === 'front').length, 3);
  assert.equal(draft.filter(pick => pick.row === 'back').length, 3);
  assert.deepEqual(swapCampaignRows(draft, 5), squad);
});

test('legacy chapter reward heroes do not enter the official preparation bench', () => {
  const context = runtimeHarness();
  context.DATA = { ...context.DATA, heroes: { ...catalog, legacy_reward: { name: 'Legacy reward' } } };
  context.P.heroes.legacy_reward = { owned: true };
  context.P.heroes.reserve.owned = false;
  const ids = Array.from(runInContext('ownedSceneHeroIds()', context));
  assert.deepEqual(ids, squad.map(pick => pick.id));
  assert.deepEqual(replaceCampaignSlot(squad, 0, 'legacy_reward', ids), squad);
});
