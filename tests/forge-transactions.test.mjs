import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const fixture = () => ({
  v: 1, schemaVersion: 2, revision: 4, gold: 3000, tinh: 120, hoat: 120,
  heroes: { ong_hang_pho: { owned: true, level: 1 } }, squad: [],
  inventory: [{ uid: 1, slot: 'weapon', rar: 'b', lvl: 0, mold: 'strike' }],
  itemSeq: 1, equip: {},
  economy: { craftPity: 0, forgeMold: 'strike', forgePending: null, forgeStats: { dual: 0, chosen: 0 } },
  daily: { quests: [{ id: 'craft', progress: 0, claimed: false }] },
  weekly: { weekIndex: 0, quests: [], points: 0, claimed: [] }
});

// Exercise the shipped commands, progress functions and R06/R07 commit path.
// Failure injection happens only at the storage boundary.
function runtime(player = fixture()) {
  const html = read('dist/index.html');
  const section = (startMarker, endMarker) => {
    const start = html.indexOf(startMarker), end = html.indexOf(endMarker, start);
    assert.ok(start >= 0 && end > start, startMarker);
    return html.slice(start, end);
  };
  const line = marker => { const start = html.indexOf(marker); assert.ok(start >= 0); return html.slice(start, html.indexOf('\n', start)); };
  const storage = new Map(); let failWrite = false, writes = 0, rolls = 0, locked = false, renders = 0;
  const random = Object.create(Math); random.random = () => { rolls++; return 0.99; };
  const context = vm.createContext({
    console, P: player, ST: {}, window: {}, Math: random, SAVE_KEY: 'player', MEMORY_ONLY: false,
    DATA: { heroes: { ong_hang_pho: { name: 'Ông Phở' } }, daily: { quests: [{ id: 'craft', type: 'craft', goal: 3 }] } },
    SAFE_LS: {
      getItem: key => storage.get(key) ?? null,
      setItem(key, value) { if (key === 'player') { if (failWrite) throw new Error('QUOTA_EXCEEDED'); writes++; } storage.set(key, value); }
    },
    normalizeSquad: squad => squad.map(pick => ({ ...pick })), netScheduleSync() {}, refreshResbar() {},
    featLocked: () => locked, today: () => 7, messages: [], toast: message => context.messages.push(message)
  });
  for (const path of ['src/domain/save/save-contract.mjs', 'src/domain/transaction/receipt-contract.mjs', 'src/domain/equipment/forge-commands.mjs']) {
    vm.runInContext(read(path).replace(/^export\s+/gm, ''), context);
  }
  const helper = section('function hvReceiptForCommand(', 'window.HonVietTransaction=Object.freeze(');
  const persist = html.match(/function persist\(\)\{[\s\S]*?\n\}/)?.[0]; assert.ok(persist);
  vm.runInContext([
    persist, helper, section('const ECON=', 'function awakeningRank('), line('const GACHA='),
    section('const WEEKLY_QUESTS=', 'function claimWeeklyQuest('), section('function questProgress(', 'function claimQuest('),
    section('DATA.items={', 'function forgeMoldBonus('), section('function rollForgeRarity(', 'const RFAC='),
    section('const RFAC=', '/* Samkok E10/E11:'), section('function forgeCommand(', 'function renderForge(')
  ].join('\n'), context);
  context.renderForge = () => { renders++; };
  return {
    context, run: code => vm.runInContext(code, context),
    state: () => JSON.parse(JSON.stringify(context.P)), saved: () => JSON.parse(storage.get('player')),
    reload: () => { context.P = JSON.parse(storage.get('player')); },
    fail: value => { failWrite = value; }, lockFeature: value => { locked = value; },
    writes: () => writes, rolls: () => rolls, renders: () => renders
  };
}

test('craft debits once and commits item, pity, quest and receipt together across reload/retry', () => {
  const r = runtime();
  const item = r.run("craftItem('weapon','craft:one')");
  assert.equal(item.uid, 2); assert.equal(item.rar, 'b');
  const saved = r.saved();
  assert.equal(saved.gold, 2800); assert.equal(saved.tinh, 100);
  assert.equal(saved.economy.craftPity, 1); assert.equal(saved.daily.quests[0].progress, 1);
  assert.deepEqual(saved.receipts['craft:one'].delta, { tinh: -20, gold: -200 });
  assert.equal(saved.inventory.length, 2); assert.equal(saved.revision, 5); assert.equal(r.writes(), 1);
  r.reload(); assert.equal(r.run("craftItem('weapon','craft:one')").uid, 2);
  assert.deepEqual(r.saved(), saved); assert.equal(r.writes(), 1); assert.equal(r.rolls(), 1);
  assert.equal(r.context.messages.length, 1);
});

test('invalid slot, locked forge, missing funds and invalid sequence reject before rolling or mutation', () => {
  for (const action of ['craft', 'dual']) {
    for (const setup of [r => {}, r => { r.context.P.gold = 0; }, r => { r.context.P.tinh = 0; },
      r => r.lockFeature(true), r => { r.context.P.itemSeq = Number.MAX_SAFE_INTEGER; }]) {
      const r = runtime(); setup(r); const before = r.state();
      const slot = before.gold === 3000 && before.tinh === 120 && before.itemSeq === 1 ? 'invalid' : 'weapon';
      assert.equal(r.run(`forgeCommand('${action}',{slot:'${slot}'},'reject')`).ok, false);
      assert.deepEqual(r.state(), before); assert.equal(r.writes(), 0); assert.equal(r.rolls(), 0);
    }
  }
  const r = runtime(); r.lockFeature(true);
  assert.equal(r.run("forgeCommand('craft',{slot:'weapon'},'locked')").code, 'FORGE_LOCKED');
});

test('every forge mutation rolls back all state on storage failure and can retry', () => {
  for (const command of [
    "forgeCommand('craft',{slot:'weapon'},'retry')", "forgeCommand('dual',{slot:'armor'},'retry')",
    "forgeCommand('enhance',{uid:1},'retry')", "forgeCommand('lock',{uid:1,locked:true},'retry')",
    "forgeCommand('mold',{mold:'ward'},'retry')",
    "forgeCommand('salvage',{uid:1,quote:previewForgeSalvage(P,1,DATA.items.slots).quote},'retry')"
  ]) {
    const r = runtime(), before = r.state(); r.fail(true);
    assert.equal(r.run(command).code, 'SAVE_WRITE_FAILED', command);
    assert.deepEqual(r.state(), before, command); assert.equal(r.writes(), 0);
    r.fail(false); assert.equal(r.run(command).ok, true); assert.equal(r.writes(), 1);
    assert.ok(r.saved().receipts.retry);
  }
});

test('craft allocates beyond existing UIDs when an old itemSeq is behind inventory', () => {
  const p = fixture(); p.inventory[0].uid = 40;
  const r = runtime(p); assert.equal(r.run("craftItem('armor','seq')").uid, 41);
  assert.deepEqual(r.saved().inventory.map(item => item.uid), [40, 41]);
});

test('existing pity boundaries and two sequential dual rolls are preserved', () => {
  for (const [pity, rarity, next] of [[8, 'b', 9], [9, 'ss', 10], [29, 'ssr', 0]]) {
    const p = fixture(); p.economy.craftPity = pity;
    const r = runtime(p); assert.equal(r.run("craftItem('weapon','pity')").rar, rarity);
    assert.equal(r.saved().economy.craftPity, next);
  }
  const p = fixture(); p.economy.craftPity = 28;
  const r = runtime(p); assert.equal(r.run("startDualForge('armor','dual:pity')").ok, true);
  assert.deepEqual(r.saved().economy.forgePending.candidates.map(item => item.rar), ['ss', 'ssr']);
  assert.equal(r.saved().economy.craftPity, 0); assert.equal(r.saved().gold, 2580); assert.equal(r.saved().tinh, 78);
  assert.equal(r.saved().daily.quests[0].progress, 0);
});

test('dual pending survives reload, failed choice keeps both, competing choices grant one item', () => {
  const r = runtime(); r.run("startDualForge('armor','dual:one')"); r.reload();
  const pending = r.saved(), rolls = r.rolls(); r.fail(true);
  assert.equal(r.run("chooseDualForge(0,'choose:one','dual:one')"), false);
  assert.deepEqual(r.state(), pending); assert.equal(r.writes(), 1);
  r.fail(false); assert.equal(r.run("chooseDualForge(0,'choose:one','dual:one')"), true);
  assert.equal(r.run("chooseDualForge(1,'choose:one','dual:one')"), true);
  assert.equal(r.run("chooseDualForge(1,'choose:two','dual:one')"), false);
  assert.equal(r.saved().inventory.length, 2); assert.equal(r.saved().economy.forgePending, null);
  assert.equal(r.saved().economy.forgeStats.chosen, 1); assert.equal(r.saved().daily.quests[0].progress, 1);
  assert.equal(r.writes(), 2); assert.equal(r.rolls(), rolls);
  r.reload(); r.run("startDualForge('weapon','dual:two')");
  const before = r.state();
  assert.equal(r.run("forgeCommand('choose',{index:1,pendingId:'dual:one'},'stale')").code, 'STALE_FORGE_PENDING');
  assert.deepEqual(r.state(), before);
});

test('old dual pending without an ID is preserved and can be selected without another charge or roll', () => {
  const p = fixture(); p.economy.forgePending = { slot: 'weapon', mold: 'strike', candidates: [
    { uid: null, slot: 'weapon', rar: 'ss', lvl: 0, mold: 'strike' },
    { uid: null, slot: 'weapon', rar: 'ssr', lvl: 0, mold: 'strike' }
  ] };
  const r = runtime(p); assert.equal(r.run('chooseDualForge(1)'), true);
  assert.equal(r.saved().inventory[1].rar, 'ssr'); assert.equal(r.saved().gold, 3000);
  assert.equal(r.saved().tinh, 120); assert.equal(r.rolls(), 0);
});

test('enhancement updates the equipped stat once, preserves links and stops at cost/cap', () => {
  const p = fixture(); p.equip = { ong_hang_pho: { weapon: 1 } };
  const r = runtime(p); assert.equal(r.run("heroEquipBonus('ong_hang_pho').atk"), 12);
  assert.equal(r.run("enhanceItem(1,'enhance:one')"), true);
  assert.equal(r.run("enhanceItem(1,'enhance:one')"), true);
  assert.equal(r.saved().gold, 2920); assert.equal(r.saved().hoat, 116); assert.equal(r.writes(), 1);
  r.reload(); assert.equal(r.run("heroEquipBonus('ong_hang_pho').atk"), 13);
  assert.deepEqual(r.saved().equip, p.equip);
  for (const [lvl, gold, hoat, code] of [[15, 3000, 120, 'ITEM_MAX_LEVEL'], [0, 79, 120, 'INSUFFICIENT_FUNDS'], [0, 3000, 3, 'INSUFFICIENT_FUNDS']]) {
    const player = fixture(); player.inventory[0].lvl = lvl; player.gold = gold; player.hoat = hoat;
    const check = runtime(player), before = check.state();
    assert.equal(check.run("forgeCommand('enhance',{uid:1},'cap')").code, code); assert.deepEqual(check.state(), before);
  }
});

test('salvage protects worn/locked items, rejects missing/stale confirmation and credits exactly once', () => {
  const r = runtime(); const before = r.state();
  assert.equal(r.run("forgeCommand('salvage',{uid:1},'salvage')").code, 'CONFIRMATION_REQUIRED');
  assert.deepEqual(r.state(), before);
  r.run('globalThis.quote = previewForgeSalvage(P,1,DATA.items.slots).quote; P.inventory[0].lvl=1');
  assert.equal(r.run("forgeCommand('salvage',{uid:1,quote},'salvage')").code, 'STALE_SALVAGE_QUOTE');
  r.run('quote=previewForgeSalvage(P,1,DATA.items.slots).quote; P.inventory[0].lock=true');
  assert.equal(r.run("forgeCommand('salvage',{uid:1,quote},'salvage')").code, 'ITEM_LOCKED');
  r.run("P.inventory[0].lock=false; P.equip={ong_hang_pho:{weapon:1}}");
  assert.equal(r.run("forgeCommand('salvage',{uid:1,quote},'salvage')").code, 'EQUIPMENT_WORN');
  r.run('P.equip={}'); assert.equal(r.run("salvageItem(1,'salvage',quote)"), true);
  assert.equal(r.saved().tinh, 127); assert.equal(r.saved().inventory.length, 0);
  assert.deepEqual(r.saved().receipts.salvage.delta, { tinh: 7 });
  r.reload(); assert.equal(r.run("salvageItem(1,'salvage',quote)"), true);
  assert.equal(r.writes(), 1); assert.equal(r.saved().tinh, 127);
});

test('lock toggles survive reload and block salvage while allowing enhancement', () => {
  const r = runtime(); assert.equal(r.run("setForgeItemLock(1,true,'lock')"), true); r.reload();
  assert.equal(r.run('previewForgeSalvage(P,1,DATA.items.slots).code'), 'ITEM_LOCKED');
  assert.equal(r.run("enhanceItem(1,'enhance:locked')"), true);
  assert.equal(r.run("setForgeItemLock(1,false,'unlock')"), true); r.reload();
  assert.equal(r.run('previewForgeSalvage(P,1,DATA.items.slots).ok'), true);
});

function node() {
  const listeners = {}, children = new Map();
  return { dataset: {}, disabled: false, isConnected: true, textContent: '',
    addEventListener: (name, fn) => { listeners[name] = fn; }, click: () => listeners.click?.(),
    setAttribute() {}, focus() {}, showModal() { this.open = true; },
    close() { this.open = false; listeners.close?.(); }, remove() { this.isConnected = false; },
    querySelector(selector) { if (!children.has(selector)) children.set(selector, node()); return children.get(selector); }
  };
}

test('salvage dialog previews exact gain, cancel keeps gear, failed write stays open and retry consumes once', () => {
  const r = runtime(), dialogs = [], opener = node();
  r.context.document = { createElement: () => node(), getElementById: () => ({
    querySelector: () => dialogs.find(dialog => dialog.isConnected), append: dialog => dialogs.push(dialog)
  }) };
  r.context.opener = opener; const before = r.state();
  r.run('confirmForgeSalvage(1,opener)');
  assert.match(dialogs[0].querySelector('.forge-salvage-gain').textContent, /\+5 ⚗ Tinh Lực/);
  dialogs[0].querySelector('[data-forge-cancel]').click();
  assert.deepEqual(r.state(), before); assert.equal(r.writes(), 0);
  r.run('confirmForgeSalvage(1,opener)'); const dialog = dialogs[1], button = dialog.querySelector('[data-forge-confirm]');
  r.fail(true); button.click();
  assert.equal(dialog.open, true); assert.equal(button.disabled, false); assert.deepEqual(r.state(), before);
  assert.match(dialog.querySelector('.forge-salvage-error').textContent, /Không thể lưu/);
  r.fail(false); button.click(); button.click();
  assert.equal(r.saved().tinh, 125); assert.equal(r.saved().inventory.length, 0);
  assert.equal(r.writes(), 1); assert.equal(r.renders(), 1); assert.equal(dialog.isConnected, false);
});

test('rendered action handler rejects double click and reuses its command after a storage retry', () => {
  for (const [selector, dataset] of [['.craftb', { s: 'weapon' }], ['.enh', { u: '1' }]]) {
    const r = runtime(), button = node(); button.dataset = dataset;
    r.context.body = { querySelectorAll: query => query === selector ? [button] : [] };
    r.run('bindForgeCommands(body)'); const before = r.state(); r.fail(true); button.click();
    assert.equal(button.disabled, false); assert.deepEqual(r.state(), before); assert.equal(r.renders(), 0);
    r.fail(false); button.click(); button.click();
    assert.equal(r.writes(), 1); assert.equal(r.renders(), 1); assert.equal(button.disabled, true);
  }
});

test('nontransactional quest callers retain default persistence', () => {
  const r = runtime(); r.run("questProgress('craft',1)");
  assert.equal(r.writes(), 1); assert.equal(r.saved().daily.quests[0].progress, 1);
});
