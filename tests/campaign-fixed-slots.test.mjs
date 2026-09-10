import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';
import {
  CAMPAIGN_BOARD_SIZE,
  compactCampaignBoard,
  expandCampaignBoard,
  replaceCampaignSlot,
  swapCampaignPositions,
  toggleCampaignHero
} from '../src/domain/campaign/campaign-view.mjs';
import { prepareFormationChange } from '../src/domain/hero/loadout.mjs';

const ids = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
const catalog = Object.fromEntries(ids.map(id => [id, {}]));
const player = { heroes: Object.fromEntries(ids.map(id => [id, { owned: true }])) };
const squad = ids.slice(0, 6).map((id, i) => ({ id, row: i < 3 ? 'front' : 'back', slot: i }));

function sourceFn(name, next) {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const start = html.indexOf(`function ${name}(`);
  const end = html.indexOf(`\nfunction ${next}(`, start);
  assert.ok(start >= 0 && end > start, name + ' owner missing');
  return html.slice(start, end);
}

test('L12-S1: a six-cell board keeps authored holes instead of packing remaining heroes', () => {
  const removed = toggleCampaignHero(squad, 'b', ids);
  assert.deepEqual(removed.map(pick => pick.slot), [0, 2, 3, 4, 5]);
  assert.equal(removed.some(pick => pick.id === 'b'), false);
  const board = expandCampaignBoard(removed);
  assert.equal(board.length, CAMPAIGN_BOARD_SIZE);
  assert.equal(board[1], null);
  assert.equal(board[2].id, 'c');
});

test('L12-S2: reserve fill occupies the first hole and leaves other slots in place', () => {
  const hole = toggleCampaignHero(squad, 'b', ids);
  const filled = toggleCampaignHero(hole, 'g', ids);
  assert.deepEqual(filled.find(pick => pick.id === 'g'), { id: 'g', row: 'front', slot: 1 });
  assert.deepEqual(filled.map(pick => pick.id), ['a', 'g', 'c', 'd', 'e', 'f']);
});

test('L12-S3: drag onto an empty slot moves without compacting', () => {
  const single = [{ id: 'a', row: 'front', slot: 0 }];
  const moved = swapCampaignPositions(single, 0, 2);
  assert.deepEqual(moved, [{ id: 'a', row: 'front', slot: 2 }]);
  assert.equal(expandCampaignBoard(moved)[0], null);
  assert.equal(expandCampaignBoard(moved)[2].id, 'a');
});

test('L12-S4: placing a reserve onto a selected empty slot keeps existing holes', () => {
  const draft = [{ id: 'a', row: 'front', slot: 0 }];
  const placed = replaceCampaignSlot(draft, 4, 'g', ids);
  assert.deepEqual(placed, [
    { id: 'a', row: 'front', slot: 0 },
    { id: 'g', row: 'back', slot: 4 }
  ]);
});

test('L12-S5: unique slots survive formation save; missing slots stay legacy-safe', () => {
  const gapped = [{ id: 'a', row: 'front', slot: 2 }];
  const kept = prepareFormationChange(player, catalog, gapped, { allowPartial: true });
  assert.equal(kept.ok, true);
  assert.deepEqual(kept.squad, [{ id: 'a', row: 'front', slot: 2 }]);
  const legacy = prepareFormationChange(player, catalog, [{ id: 'a', row: 'back' }], { allowPartial: true });
  assert.equal(legacy.ok, true);
  assert.deepEqual(legacy.squad, [{ id: 'a', row: 'back' }]);
});

test('L12-S6: compacting the board never invents extra heroes or duplicate slots', () => {
  const board = expandCampaignBoard([{ id: 'a', row: 'back', slot: 5 }, { id: 'c', row: 'front', slot: 1 }]);
  assert.equal(board[1].id, 'c');
  assert.equal(board[5].id, 'a');
  assert.deepEqual(compactCampaignBoard(board), [
    { id: 'c', row: 'front', slot: 1 },
    { id: 'a', row: 'back', slot: 5 }
  ]);
});

test('L12-S7: source normalizeSquad keeps unique slots and still recovers empty saves', () => {
  const context = createContext({
    DATA: { heroes: catalog },
    P: player,
    defaultPlayer: () => ({ squad: squad.map(({ id, row }) => ({ id, row })) })
  });
  runInContext(sourceFn('normalizeSquad', 'defaultPlayer'), context);
  context.picks = [{ id: 'a', row: 'front', slot: 2 }];
  const kept = JSON.parse(runInContext('JSON.stringify(normalizeSquad(picks,P,false))', context));
  assert.deepEqual(kept, [{ id: 'a', row: 'front', slot: 2 }]);
  assert.equal(runInContext('normalizeSquad([],P,true).length', context), 6);
});

test('L12-S8: source assignFormationSlots honors unique saved slots before packing leftovers', () => {
  const context = createContext({ formationSlotPos: () => ({ x: 0, y: 0 }) });
  runInContext(sourceFn('assignFormationSlots', 'assignAllySlots'), context);
  const list = [
    { id: 'a', row: 'front', slot: 2 },
    { id: 'b', row: 'back', slot: 5 },
    { id: 'c', row: 'front' }
  ];
  context.list = list;
  runInContext('assignFormationSlots(list,"ally")', context);
  assert.equal(list.find(unit => unit.id === 'a').slot, 2);
  assert.equal(list.find(unit => unit.id === 'b').slot, 5);
  assert.equal(list.find(unit => unit.id === 'c').slot, 0);
  assert.equal(list.find(unit => unit.id === 'a').row, 'front');
  assert.equal(list.find(unit => unit.id === 'b').row, 'back');
});

test('L12-S11: occupied field units keep authored position and pointer hit targets', () => {
  const css = readFileSync(new URL('../src/ui/campaign-scene.css', import.meta.url), 'utf8');
  assert.match(css, /#hvCampaignScene \.cs-field-unit\{position:absolute/);
  assert.match(css, /pointer-events:auto/);
  assert.match(css, /\.cs-field-unit\.is-empty\{/);
});
