import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';
import { expandCampaignBoard, swapCampaignPositions } from '../src/domain/campaign/campaign-view.mjs';

const source = readFileSync(new URL('../src/ui/campaign-scene.js', import.meta.url), 'utf8');
function harness(draft = [{ id: 'a', row: 'front', slot: 0 }, { id: 'b', row: 'back', slot: 3 }]) {
  const listeners = new Map(), captures = new Map(), redraws = [], swaps = [];
  const panel = { innerHTML: '', querySelector: () => ({ append() {} }), addEventListener: (type, fn) => listeners.set(type, fn) };
  const root = { querySelector: selector => selector === '.cs-prepare' ? panel : { close() {}, append() {}, focus() {} } };
  const context = createContext({
    window: { matchMedia: () => ({ matches: true }) },
    document: { readyState: 'loading', addEventListener() {}, createElement: () => ({ dataset: {}, setAttribute() {} }),
      body: { classList: { toggle() {} } }, querySelectorAll: () => [], elementFromPoint: () => context.dropTarget },
    performance: { now: () => 10 }, DATA: { heroes: {} }, P: { heroes: {} }, OFFICIAL_ROSTER_12_IDS: [],
    LUC_ANH_IDLE_1080: {}, AFK_THAY_MO_IDLE_DURATIONS: [], AFK_CHEST_SCHEMA: 1, AFK_CAP_SECONDS: 54000,
    createAfkChestState() {}, normalizeAfkChestState() {}, accrueAfkChest() {}, getAfkChestView() {}, claimAfkChest() {},
    expandCampaignBoard, swapCampaignPositions: (...args) => { swaps.push(args); return swapCampaignPositions(...args); },
    root, draft, redraws, dropTarget: null
  });
  runInContext(source + `
    sceneState.root = root; sceneState.active = true; sceneState.draft = draft;
    drawScene = () => redraws.push(preparationDrag ? { dx: preparationDrag.dx, dy: preparationDrag.dy } : null);
    renderPreparation = () => drawScene(); renderScene = () => {}; startSceneClock = () => {};
    mountPreparationView();
  `, context);
  const slots = [0, 3, 2].map(index => ({
    dataset: { sceneSlot: String(index) }, closest() { return this; },
    setPointerCapture(id) { captures.set(id, this); }, hasPointerCapture(id) { return captures.get(id) === this; },
    releasePointerCapture(id) { captures.delete(id); listeners.get('lostpointercapture')?.({ pointerId: id }); }
  }));
  function event(type, pointerId = 1, extra = {}) {
    listeners.get(type)?.({ pointerId, isPrimary: true, button: 0, clientX: 0, clientY: 0, target: slots[0], preventDefault() {}, ...extra });
  }
  const state = () => runInContext('({ drag: preparationDrag, draft: sceneState.draft, suppress: suppressSlotClick, slot: sceneState.slot })', context);
  function move() { event('pointerdown'); event('pointermove', 1, { clientX: 20, clientY: 20 }); }
  return { context, slots, captures, redraws, swaps, event, state, move };
}

for (const type of ['pointerup', 'pointercancel']) test(`L12-P1: foreign ${type} does not end the active drag`, () => {
  const h = harness(); h.move(); h.event(type, 2);
  assert.equal(h.state().drag?.pointer, 1);
  h.context.dropTarget = h.slots[1]; h.event('pointerup');
  assert.deepEqual(Array.from(h.state().draft, p => p.id), ['b', 'a']);
});
test('L12-P1: a second pointer cannot replace the drag owner', () => {
  const h = harness(); h.move(); h.event('pointerdown', 2, { target: h.slots[1], isPrimary: false });
  assert.equal(h.state().drag?.pointer, 1);
  assert.equal(h.captures.has(2), false);
});
for (const type of ['pointercancel', 'lostpointercapture', 'pointerup']) test(`L12-P2: ${type} restores a displaced sprite without committing a move`, () => {
  const h = harness(); h.move(); assert.equal(h.redraws.at(-1)?.dx, 20);
  h.event(type);
  assert.equal(h.state().drag, null);
  assert.equal(h.redraws.at(-1), null, 'reduced-motion canvas must snap back immediately');
  assert.equal(h.captures.size, 0, 'release capture even when the gesture ends outside a slot');
  assert.equal(h.swaps.length, 0);
  assert.deepEqual(Array.from(h.state().draft, p => p.id), ['a', 'b']);
});
for (const command of ['cancelPreparation()', "onSceneRoute('hub')"]) test(`L12-P3: ${command} releases capture and permits the next drag`, () => {
  const h = harness(); h.move(); runInContext(command, h.context);
  assert.equal(h.captures.size, 0);
  assert.equal(h.state().drag, null);
  runInContext('sceneState.active = true; sceneState.draft = draft;', h.context);
  h.move(); h.context.dropTarget = h.slots[1]; h.event('pointerup');
  assert.deepEqual(Array.from(h.state().draft, p => p.id), ['b', 'a']);
});
test('L12-P1: primary drag swaps once, releases capture, and ignores late capture loss', () => {
  const h = harness(); h.move(); h.context.dropTarget = h.slots[1]; h.event('pointerup'); h.event('lostpointercapture');
  assert.equal(h.swaps.length, 1); assert.equal(h.captures.size, 0);
  assert.deepEqual(Array.from(h.state().draft, p => p.id), ['b', 'a']);
});
test('L12-S9: occupied drag onto an empty slot moves without compacting', () => {
  const h = harness([{ id: 'a', row: 'front', slot: 0 }]);
  h.move(); h.context.dropTarget = h.slots[2]; h.event('pointerup');
  assert.deepEqual(h.state().draft, [{ id: 'a', row: 'front', slot: 2 }]);
});
test('L12-S9: empty slots cannot start a drag', () => {
  const h = harness([{ id: 'a', row: 'front', slot: 0 }]);
  h.event('pointerdown', 1, { target: h.slots[2] });
  assert.equal(h.state().drag, null);
  assert.equal(h.captures.size, 0);
});
test('L12-D1: a completed drag does not swallow the next empty-slot tap', () => {
  const h = harness([{ id: 'a', row: 'front', slot: 0 }]);
  h.move(); h.context.dropTarget = h.slots[2]; h.event('pointerup');
  assert.equal(h.state().suppress, true, 'trailing click after innerHTML rebuild may never arrive');
  h.event('pointerdown', 1, { target: h.slots[0] });
  assert.equal(h.state().drag, null);
  assert.equal(h.state().suppress, false);
});
test('L12-D2: a moved drop clears the selected slot so the vacated hole is not still armed', () => {
  const h = harness([{ id: 'a', row: 'front', slot: 0 }]);
  runInContext('sceneState.slot = 0', h.context);
  h.move(); h.context.dropTarget = h.slots[2]; h.event('pointerup');
  assert.equal(h.state().slot, -1);
  assert.deepEqual(h.state().draft, [{ id: 'a', row: 'front', slot: 2 }]);
});
