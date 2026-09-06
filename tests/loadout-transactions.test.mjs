import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { prepareFormationChange, prepareEquipmentChange } from '../src/domain/hero/loadout.mjs';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const ids = ['ong_hang_pho', 'thay_mo', 'lac_yen', 'cung_thu_tre', 'dinh_loi', 'luc_anh'];
const catalog = Object.fromEntries([...ids, 'locked'].map(id => [id, { name: id }]));
const fixture = () => ({
  v: 1, schemaVersion: 2, revision: 4, gold: 500,
  heroes: Object.fromEntries(Object.keys(catalog).map(id => [id, { owned: id !== 'locked', level: 1 }])),
  squad: ids.map((id, i) => ({ id, row: i < 3 ? 'front' : 'back' })),
  inventory: [{ uid: 1, slot: 'weapon', lvl: 0 }, { uid: 2, slot: 'weapon', lvl: 0 }],
  equip: { ong_hang_pho: { weapon: 1 }, thay_mo: { weapon: 2 } }
});

test('formation keeps six unique owned identities, rows and order without aliasing the draft', () => {
  const player = fixture(), draft = player.squad.toReversed();
  const before = JSON.stringify(player);
  const result = prepareFormationChange(player, catalog, draft);
  assert.equal(result.ok, true);
  assert.deepEqual(result.squad, draft);
  result.squad[0].row = 'front';
  assert.equal(draft[0].row, 'back');
  assert.equal(JSON.stringify(player), before);
  for (const [squad, code] of [
    [draft.slice(1), 'INVALID_FORMATION_SIZE'],
    [[...draft.slice(1), draft[1]], 'DUPLICATE_HERO'],
    [[...draft.slice(1), { id: 'locked', row: 'back' }], 'HERO_NOT_OWNED'],
    [[...draft.slice(1), { id: 'missing', row: 'back' }], 'HERO_NOT_OWNED'],
    [[...draft.slice(1), { id: draft[0].id, row: 'middle' }], 'INVALID_ROW']
  ]) assert.equal(prepareFormationChange(player, catalog, squad).code, code);
});

test('moving and replacing equipment moves links while preserving every inventory instance', () => {
  const player = fixture(), before = JSON.stringify(player);
  const change = prepareEquipmentChange(player, catalog, ['weapon'], { uid: 1, heroId: 'thay_mo' });
  assert.equal(change.ok, true);
  assert.equal(change.replacedUid, 2);
  assert.equal(change.equip.ong_hang_pho.weapon, null);
  assert.equal(change.equip.thay_mo.weapon, 1);
  assert.equal(JSON.stringify(player), before);
  assert.equal(prepareEquipmentChange(player, catalog, ['weapon'], { uid: 1, heroId: 'ong_hang_pho' }).unchanged, true);
  const corrupt = fixture(); corrupt.equip.luc_anh = { weapon: 1 };
  const repaired = prepareEquipmentChange(corrupt, catalog, ['weapon'], { uid: 1, heroId: 'thay_mo' });
  assert.equal(Object.values(repaired.equip).filter(e => e.weapon === 1).length, 1);
});

test('invalid ownership, item instances and unequip requests leave the loadout untouched', () => {
  const player = fixture(), before = JSON.stringify(player);
  for (const [request, code] of [
    [{ uid: 1, heroId: 'locked' }, 'HERO_NOT_OWNED'],
    [{ uid: 99, heroId: 'luc_anh' }, 'INVALID_EQUIPMENT'],
    [{ uid: 1, heroId: 'luc_anh', action: 'unequip' }, 'EQUIPMENT_NOT_WORN'],
    [{ uid: 1, heroId: 'luc_anh', action: 'sell' }, 'INVALID_EQUIP_ACTION']
  ]) assert.equal(prepareEquipmentChange(player, catalog, ['weapon'], request).code, code);
  assert.equal(JSON.stringify(player), before);
  player.inventory.push({ ...player.inventory[0] });
  assert.equal(prepareEquipmentChange(player, catalog, ['weapon'], { uid: 1, heroId: 'luc_anh' }).code, 'INVALID_EQUIPMENT');
});

// Run the shipped commands, save function and transaction helper from the build.
// Storage failures are injected at the storage boundary, not by replacing commands.
function runtime() {
  const html = read('dist/index.html');
  const helperStart = html.indexOf('function hvReceiptForCommand(');
  const helperEnd = html.indexOf('\n', html.indexOf('window.HonVietTransaction=Object.freeze(', helperStart));
  const persist = html.match(/function persist\(\)\{[\s\S]*?\n\}/)?.[0];
  const opening = html.match(/<script id="samkok-r10-opening-loop">([\s\S]*?)<\/script>/)?.[1];
  assert.ok(helperStart >= 0 && helperEnd > helperStart && persist && opening);
  const storage = new Map(); let failWrite = false, writes = 0;
  const context = vm.createContext({
    console, P: fixture(), DATA: { heroes: catalog, items: { slots: ['weapon'] } },
    window: {}, MEMORY_ONLY: false, SAVE_KEY: 'player', messages: [],
    SAFE_LS: {
      getItem: key => storage.get(key) ?? null,
      setItem: (key, value) => {
        if (key === 'player') { if (failWrite) throw new Error('QUOTA_EXCEEDED'); writes++; }
        storage.set(key, value);
      }
    },
    normalizeSquad: squad => squad.map(pick => ({ ...pick })),
    netScheduleSync() {}, itemName: item => 'Item ' + item.uid,
    toast(message) { context.messages.push(message); }
  });
  for (const path of ['src/domain/save/save-contract.mjs', 'src/domain/transaction/receipt-contract.mjs', 'src/domain/hero/loadout.mjs', 'src/domain/quest/opening-loop-contract.mjs']) {
    vm.runInContext(read(path).replace(/^export\s+/gm, ''), context);
  }
  vm.runInContext(persist + '\n' + html.slice(helperStart, helperEnd) + '\n' + read('src/ui/party-command-runtime.js'), context);
  vm.runInContext('window.HonVietOpeningLoopCore={validateOpeningGraph,createOpeningLoopState,validateOpeningResume,advanceOpeningLoop,getOpeningLoopView};', context);
  vm.runInContext(opening, context);
  return {
    context, run: code => vm.runInContext(code, context),
    state: () => JSON.parse(JSON.stringify(context.P)),
    saved: () => JSON.parse(storage.get('player')),
    fail: value => { failWrite = value; }, writes: () => writes
  };
}

function advanceToFormation(r) {
  for (const sourceId of ['battle:one', 'battle:two']) {
    assert.equal(r.run(`window.HonVietOpeningLoop.record('campaign.win',{sourceId:'${sourceId}',route:{screen:'campaign'}})`).ok, true);
  }
  assert.equal(r.run('window.HonVietOpeningLoop.view().current.id'), 'opening.formation');
}

test('formation save and opening progress commit once, survive reload, and retry reuses receipt', () => {
  const r = runtime(); advanceToFormation(r);
  const beforeWrites = r.writes();
  assert.equal(r.run("saveFormationCommand(P.squad.toReversed(),'formation:one')").ok, true);
  assert.equal(r.writes(), beforeWrites + 1);
  assert.deepEqual(r.saved().squad.map(p => p.id), ids.toReversed());
  assert.equal(r.run('window.HonVietOpeningLoop.view().current.id'), 'opening.hero.upgrade');
  const saved = JSON.stringify(r.saved());
  assert.equal(r.run("saveFormationCommand([], 'formation:one')").duplicate, true);
  assert.equal(JSON.stringify(r.saved()), saved);
  r.context.P = r.saved();
  assert.equal(r.run('window.HonVietOpeningLoop.view().current.id'), 'opening.hero.upgrade');
});

test('formation storage failure rolls back squad, receipt and opening progress, then can retry', () => {
  const r = runtime(); advanceToFormation(r);
  const before = r.state(), writes = r.writes(); r.fail(true);
  assert.equal(r.run("saveFormationCommand(P.squad.toReversed(),'formation:retry')").code, 'SAVE_WRITE_FAILED');
  assert.deepEqual(r.state(), before);
  assert.equal(r.writes(), writes);
  r.fail(false);
  assert.equal(r.run("saveFormationCommand(P.squad.toReversed(),'formation:retry')").ok, true);
  assert.equal(r.run('window.HonVietOpeningLoop.view().current.id'), 'opening.hero.upgrade');
});

test('equipment transfer, duplicate and removal preserve inventory and reload ownership', () => {
  const r = runtime(), inventory = r.state().inventory;
  assert.equal(r.run("equipItem(1,'thay_mo','equip:one')"), true);
  assert.equal(r.saved().equip.ong_hang_pho.weapon, null);
  assert.equal(r.saved().equip.thay_mo.weapon, 1);
  assert.deepEqual(r.saved().inventory, inventory);
  assert.equal(r.writes(), 1);
  assert.equal(r.run("equipItem(1,'thay_mo','equip:one')"), true);
  assert.equal(r.run("equipItem(1,'thay_mo')"), true);
  assert.equal(r.writes(), 1);
  assert.equal(r.context.messages.length, 1);
  r.context.P = r.saved();
  assert.equal(r.run("unequipItem(1,'thay_mo','unequip:one')"), true);
  assert.equal(r.saved().equip.thay_mo.weapon, null);
  assert.deepEqual(r.saved().inventory, inventory);
  assert.equal(r.run("unequipItem(1,'thay_mo','unequip:one')"), true);
  assert.equal(r.writes(), 2);
});

test('failed equipment transfer and removal keep old links and never report success', () => {
  for (const command of ["equipItem(1,'thay_mo','equip:retry')", "unequipItem(1,'ong_hang_pho','unequip:retry')"]) {
    const r = runtime(), before = r.state(); r.fail(true);
    assert.equal(r.run(command), false);
    assert.deepEqual(r.state(), before);
    assert.equal(r.writes(), 0);
    assert.equal(r.context.messages.length, 1);
    assert.match(r.context.messages[0], /Không thể lưu/);
    r.fail(false); assert.equal(r.run(command), true);
    assert.equal(r.writes(), 1);
  }
});

test('final opening equip event shares the item commit and stays pending if storage fails', () => {
  const r = runtime(); advanceToFormation(r);
  r.run("saveFormationCommand(P.squad,'formation:ready')");
  r.run("window.HonVietOpeningLoop.record('hero.upgrade',{sourceId:'ong_hang_pho',route:{screen:'heroes'}})");
  assert.equal(r.run('window.HonVietOpeningLoop.view().current.id'), 'opening.hero.equip');
  const before = r.state(), writes = r.writes(); r.fail(true);
  assert.equal(r.run("equipItem(1,'thay_mo','equip:final')"), false);
  assert.deepEqual(r.state(), before);
  r.fail(false);
  assert.equal(r.run("equipItem(1,'thay_mo','equip:final')"), true);
  assert.equal(r.writes(), writes + 1);
  r.context.P = r.saved();
  assert.equal(r.run('window.HonVietOpeningLoop.view().status'), 'terminal');
});

test('built formation button stays open on failure, blocks duplicate click and retries', () => {
  const r = runtime(), button = { disabled: false, dataset: {} }; let click;
  r.context.document = { getElementById: () => ({ ...button, addEventListener: (_event, handler) => { click = handler; } }) };
  const html = read('dist/index.html');
  const start = html.indexOf("document.getElementById('teamSave').addEventListener(");
  const end = html.indexOf('/* ---------- HEROES + DETAIL', start);
  r.run(html.slice(start, end));
  r.context.document.getElementById = () => button;
  r.context.teamPicks = r.context.P.squad.toReversed();
  const routes = []; r.context.navTo = route => routes.push(route);
  const before = r.state(); r.fail(true); click();
  assert.equal(button.disabled, false);
  assert.deepEqual(routes, []);
  assert.deepEqual(r.state(), before);
  assert.match(r.context.messages.at(-1), /Không thể lưu/);
  r.fail(false); click(); click();
  assert.equal(button.disabled, true);
  assert.deepEqual(routes, ['hub']);
  assert.equal(r.writes(), 1);
});
