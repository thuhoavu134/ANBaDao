import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  ROGUE_BLESSING_IDS,
  ROGUE_CLEAR_GEMS,
  ROGUE_GOLD_BASE,
  ROGUE_GOLD_PER_FLOOR,
  ROGUE_MAX_FLOOR,
  ROGUE_REROLL_COST,
  ROGUE_ROUTES,
  emptyRogue,
  makeRogueOffer,
  normalizeRogue,
  prepareRogueAbandon,
  prepareRogueChooseBlessing,
  prepareRogueChooseRoute,
  prepareRogueFight,
  prepareRogueLose,
  prepareRogueReroll,
  prepareRogueStart,
  prepareRogueWin,
  rogueClearGems,
  rogueEncounterUnits,
  rogueGoldGain
} from '../src/domain/expedition/expedition-run.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function player(extra = {}) {
  return {
    gold: 400,
    gems: 10,
    stamina: 20,
    clearedChapters: [0, 1],
    rogue: emptyRogue(),
    ...extra
  };
}

function started(extra = {}) {
  const start = prepareRogueStart(player());
  return player({ rogue: { ...start.rogue, ...extra } });
}

test('L15-T1: empty run is inactive, five floors, three routes', () => {
  const rogue = normalizeRogue(null);
  assert.equal(rogue.active, false);
  assert.equal(rogue.floor, 0);
  assert.equal(rogue.maxFloor, ROGUE_MAX_FLOOR);
  assert.equal(ROGUE_MAX_FLOOR, 5);
  assert.equal(Object.keys(ROGUE_ROUTES).length, 3);
  assert.equal(ROGUE_BLESSING_IDS.length, 5);
  const start = prepareRogueStart(player({ rogue: { best: 4 } }));
  assert.equal(start.ok, true);
  assert.equal(start.rogue.active, true);
  assert.equal(start.rogue.floor, 1);
  assert.equal(start.rogue.best, 4);
  assert.equal(start.rogue.blessings.length, 0);
  const kept = normalizeRogue({ best: 4 });
  assert.equal(kept.best, 4);
  assert.equal(kept.active, false);
});

test('L15-T2: fight needs a route except the dream lord; gold and sigils keep the live formula', () => {
  const bare = prepareRogueFight(started());
  assert.equal(bare.code, 'NEED_ROUTE');
  const mist = prepareRogueChooseRoute(started(), 'mist');
  assert.equal(mist.ok, true);
  assert.equal(mist.rogue.route, 'mist');
  const fight = prepareRogueFight(player({ rogue: mist.rogue, heroList: [
    { id: 'a', name: 'A', stats: { hp: 100, atk: 10, def: 5, spd: 80 } }
  ] }));
  assert.equal(fight.ok, true);
  assert.equal(fight.boss, false);
  assert.equal(fight.encounter.length, 6);
  assert.equal(rogueGoldGain(1, ROGUE_ROUTES.mist), Math.round((ROGUE_GOLD_BASE + ROGUE_GOLD_PER_FLOOR) * 1.10));
  assert.equal(rogueGoldGain(2, ROGUE_ROUTES.steady), Math.round((ROGUE_GOLD_BASE + 2 * ROGUE_GOLD_PER_FLOOR) * 0.90));
  const win = prepareRogueWin(player({ rogue: mist.rogue, gold: 400, gems: 10, clearedChapters: [0, 1] }), {
    floor: 1,
    routeId: 'mist'
  });
  assert.equal(win.ok, true);
  assert.equal(win.passed, true);
  assert.equal(win.cleared, false);
  assert.equal(win.goldGain, rogueGoldGain(1, ROGUE_ROUTES.mist));
  assert.equal(win.gold, 400 + win.goldGain);
  assert.equal(win.sigilGain, 1);
  assert.equal(win.rogue.pending, true);
  assert.equal(win.rogue.floor, 1);
  assert.equal(win.rogue.best, 1);
  assert.deepEqual(win.clearedChapters, [0, 1]);
  assert.equal(mist.rogue.pending, false);
  const bossFight = prepareRogueFight(started({ floor: 5, route: null }));
  assert.equal(bossFight.ok, true);
  assert.equal(bossFight.boss, true);
  assert.equal(bossFight.encounter.length, 4);
  assert.equal(bossFight.encounter.some(u => String(u.name).startsWith('Mộng Chủ')), true);
});

test('L15-T3: blessing offer, pick advances the floor, reroll costs two sigils once', () => {
  const afterWin = prepareRogueWin(started({ route: 'rift' }), { floor: 1, routeId: 'rift' });
  assert.equal(afterWin.rogue.offer.length, 3);
  assert.equal(afterWin.rogue.offer.every(id => ROGUE_BLESSING_IDS.includes(id)), true);
  const pick = prepareRogueChooseBlessing(player({ rogue: afterWin.rogue }), afterWin.rogue.offer[0]);
  assert.equal(pick.ok, true);
  assert.equal(pick.rogue.floor, 2);
  assert.equal(pick.rogue.pending, false);
  assert.equal(pick.rogue.blessings.length, 1);
  assert.equal(pick.rogue.route, null);
  assert.equal(afterWin.rogue.floor, 1);
  const pending = player({
    rogue: { ...afterWin.rogue, sigils: 3, rerolls: 0, pending: true, offer: makeRogueOffer(afterWin.rogue) }
  });
  const reroll = prepareRogueReroll(pending);
  assert.equal(reroll.ok, true);
  assert.equal(reroll.rogue.sigils, 3 - ROGUE_REROLL_COST);
  assert.equal(reroll.rogue.rerolls, 1);
  assert.equal(prepareRogueReroll(player({ rogue: reroll.rogue })).code, 'REROLL_USED');
  assert.equal(prepareRogueChooseBlessing(player({ rogue: afterWin.rogue }), 'nope').code, 'UNKNOWN_BLESSING');
});

test('L15-P1: resume keeps the run; abandon keeps the record; lose does not drop best', () => {
  const mid = started({ floor: 3, route: 'mist', blessings: ['blood'], best: 2, earnedGold: 500 });
  const again = normalizeRogue(mid.rogue);
  assert.equal(again.active, true);
  assert.equal(again.floor, 3);
  assert.deepEqual(again.blessings, ['blood']);
  const left = prepareRogueAbandon(mid);
  assert.equal(left.rogue.active, false);
  assert.equal(left.rogue.floor, 0);
  assert.equal(left.rogue.best, 2);
  assert.equal(mid.rogue.active, true);
  const loss = prepareRogueLose(mid);
  assert.equal(loss.ok, true);
  assert.equal(loss.passed, false);
  assert.equal(loss.rogue.best, 2);
  assert.equal(loss.rogue.active, false);
  assert.equal(loss.gold, 400);
  assert.deepEqual(loss.clearedChapters, [0, 1]);
});

test('L15-P2: clearing floor 5 pays gems, does not touch campaign, and a stale floor is rejected', () => {
  const boss = started({ floor: 5, sigils: 6, earnedGold: 900, best: 4 });
  const win = prepareRogueWin(boss, { floor: 5 });
  assert.equal(win.cleared, true);
  assert.equal(win.gemsGain, rogueClearGems(6));
  assert.equal(win.gemsGain, ROGUE_CLEAR_GEMS + 12);
  assert.equal(win.rogue.active, false);
  assert.equal(win.rogue.best, 5);
  assert.deepEqual(win.clearedChapters, [0, 1]);
  assert.equal(boss.clearedChapters.length, 2);
  const stale = prepareRogueWin(started({ floor: 2, route: 'mist' }), { floor: 1, routeId: 'mist' });
  assert.equal(stale.code, 'STALE_FLOOR');
});

test('L15-P3: encounter scale is immutable and boss is four units', () => {
  const units = rogueEncounterUnits(
    { active: true, floor: 3, route: 'rift', maxFloor: 5 },
    [{ id: 'h', name: 'Hồn', stats: { hp: 1000, atk: 100, def: 50, spd: 100 } }]
  );
  assert.equal(units.length, 6);
  const scale = 1 + 2 * 0.18;
  assert.equal(units[0].stats.hp, Math.round(1000 * scale * 1.10));
  assert.equal(units[0].stats.atk, Math.round(100 * scale * 1.08));
  const boss = rogueEncounterUnits({ active: true, floor: 5, maxFloor: 5 }, [
    { id: 'h', name: 'Hồn', stats: { hp: 1000, atk: 100, def: 50, spd: 100 } }
  ]);
  assert.equal(boss.length, 4);
  const lord = boss.find(u => u.name === 'Mộng Chủ · Hồn');
  assert.equal(!!lord, true);
  assert.equal(lord.stats.hp, Math.round(1000 * (1 + 4 * 0.18) * 2.2));
});

const uiPath = new URL('../src/ui/expedition-runtime.js', import.meta.url);
const cssPath = new URL('../src/ui/expedition-screen.css', import.meta.url);
const injectPath = new URL('../scripts/expedition-runtime-v1.mjs', import.meta.url);

test('L15-P4: lacquer screen is wired and does not add a second hub landmark', () => {
  const ui = readFileSync(uiPath, 'utf8');
  const css = readFileSync(cssPath, 'utf8');
  const inject = readFileSync(injectPath, 'utf8');
  assert.match(ui, /data-expedition-start/);
  assert.match(ui, /data-expedition-route/);
  assert.match(ui, /prepareRogueStart/);
  assert.match(ui, /prepareRogueWin/);
  assert.match(ui, /Mộng Lộ/);
  assert.doesNotMatch(ui, /data-art-go="expedition"/);
  assert.match(css, /#hvExpeditionRoot/);
  assert.match(css, /[.]hv-exp-path/);
  assert.match(inject, /expedition-run[.]mjs/);
  new Function(ui);
  const build = join(root, 'scripts/build-static.mjs');
  if (existsSync(build)) {
    assert.match(readFileSync(build, 'utf8'), /expedition-runtime-v1[.]mjs/);
  }
});
