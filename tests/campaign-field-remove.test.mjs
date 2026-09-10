import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';
import { expandCampaignBoard } from '../src/domain/campaign/campaign-view.mjs';

const source = readFileSync(new URL('../src/ui/campaign-scene.js', import.meta.url), 'utf8');
const domain = readFileSync(new URL('../src/domain/campaign/campaign-view.mjs', import.meta.url), 'utf8').replace(/^export\s+/gm, '');
const squad = ['a', 'b', 'c'].map((id, i) => ({ id, row: i < 3 ? 'front' : 'back', slot: i }));

function harness(draft = squad.map(pick => ({ ...pick }))) {
  const renders = [];
  const context = createContext({
    window: { matchMedia: () => ({ matches: false }), addEventListener() {} },
    document: { readyState: 'loading', addEventListener() {}, createElement: () => ({ dataset: {}, setAttribute() {} }),
      body: { classList: { toggle() {} } }, querySelectorAll: () => [] },
    performance: { now: () => 0 },
    DATA: { heroes: Object.fromEntries(squad.map(pick => [pick.id, { name: pick.id }])) },
    P: { heroes: Object.fromEntries(squad.map(pick => [pick.id, { owned: true }])) },
    OFFICIAL_ROSTER_12_IDS: squad.map(pick => pick.id),
    LUC_ANH_IDLE_1080: {}, AFK_THAY_MO_IDLE_DURATIONS: [], AFK_CHEST_SCHEMA: 1, AFK_CAP_SECONDS: 54000,
    createAfkChestState() {}, normalizeAfkChestState() {}, accrueAfkChest() {}, getAfkChestView() {}, claimAfkChest() {},
    toast() {}, renders, draft
  });
  runInContext(domain + '\n' + source + `
    sceneState.active = true;
    sceneState.draft = draft;
    sceneState.slot = -1;
    renderPreparation = () => renders.push({ draft: sceneState.draft.map(p => ({ ...p })), slot: sceneState.slot });
  `, context);
  return context;
}

function clickSlot(context, index) {
  context.clickTarget = {
    disabled: false,
    dataset: { sceneSlot: String(index) },
    hasAttribute(name) { return name === 'data-scene-slot'; },
    closest() { return this; }
  };
  runInContext('sceneClick({ target: clickTarget })', context);
}

function state(context) {
  return JSON.parse(runInContext('JSON.stringify({ draft: sceneState.draft, slot: sceneState.slot, suppress: suppressSlotClick })', context));
}

test('L12-R1: one tap on an occupied field hero undocks that hero and keeps the hole', () => {
  const context = harness();
  clickSlot(context, 1);
  const after = state(context);
  assert.deepEqual(after.draft.map(pick => pick.id), ['a', 'c']);
  assert.deepEqual(after.draft.map(pick => pick.slot), [0, 2]);
  assert.equal(expandCampaignBoard(after.draft)[1], null);
  assert.equal(after.slot, -1);
});

test('L12-R2: a tap on an empty field slot still selects it for a reserve', () => {
  const context = harness([{ id: 'a', row: 'front', slot: 0 }]);
  clickSlot(context, 4);
  const after = state(context);
  assert.deepEqual(after.draft, [{ id: 'a', row: 'front', slot: 0 }]);
  assert.equal(after.slot, 4);
});

test('L12-R3: a leftover drag click does not undock or select', () => {
  const context = harness();
  runInContext('suppressSlotClick = true', context);
  clickSlot(context, 1);
  const after = state(context);
  assert.deepEqual(after.draft.map(pick => pick.id), ['a', 'b', 'c']);
  assert.equal(after.slot, -1);
  assert.equal(after.suppress, false);
});

test('L12-R1: occupied field copy tells the player a tap will undock', () => {
  assert.match(source, /Bấm tướng trên sân để gỡ/);
  assert.match(source, /aria-label="Gỡ /);
});
