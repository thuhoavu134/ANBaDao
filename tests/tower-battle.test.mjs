import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  TOWER_NPC_ROSTER_12,
  buildTowerNpcTeam
} from '../src/domain/tower/tower-npc-team.mjs';
import {
  emptyTower,
  prepareTowerClear,
  prepareTowerClimb,
  prepareTowerFail,
  TOWER_CLIMB_STAMINA,
  towerFloorGold
} from '../src/domain/tower/tower-progress.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => readFileSync(join(root, rel), 'utf8');

const HEROES = Object.fromEntries(TOWER_NPC_ROSTER_12.map((id, i) => [id, {
  name: 'Tướng ' + id,
  col: '#7a7fb0',
  role: 'NPC',
  stats: { hp: 600 + i * 10, atk: 90 + i, def: 40 + i, spd: 80 + i }
}]));

function player(extra = {}) {
  return {
    gold: 200,
    gems: 10,
    stamina: 20,
    shards: {},
    clearedChapters: [0],
    tower: emptyTower(),
    ...extra
  };
}

test('L65-T1: wrap startTower calls runBattle __tower and never auto-wins', () => {
  const ui = read('src/ui/tower-battle-runtime.js');
  assert.match(ui, /startTower = function/);
  assert.match(ui, /runBattle\('__tower'/);
  assert.match(ui, /prepareTowerClimb/);
  assert.doesNotMatch(ui, /towerPowerWinReport/);
  assert.doesNotMatch(ui, /prepareTowerAttempt/);
  const frozen = read('src/ui/tower-runtime.js');
  assert.match(frozen, /prepareTowerAttempt/);
  assert.match(read('src/domain/tower/tower-progress.mjs'), /towerPowerWinReport/);
});

test('L65-T2: factory returns 6 unique roster clones, 3 front / 3 back', () => {
  const floor1 = buildTowerNpcTeam({ floor: 1, heroes: HEROES });
  assert.equal(floor1.length, 6);
  const ids = floor1.map(u => u.sourceHeroId);
  assert.equal(new Set(ids).size, 6);
  for (const id of ids) assert.equal(TOWER_NPC_ROSTER_12.includes(id), true);
  assert.equal(floor1.filter(u => u.row === 'front').length, 3);
  assert.equal(floor1.filter(u => u.row === 'back').length, 3);
  const floor5 = buildTowerNpcTeam({ floor: 5, heroes: HEROES });
  assert.equal(floor5.length, 6);
  assert.equal(floor5.filter(u => u.name === 'Chúa Tầng 5').length, 1);
  assert.equal(new Set(floor5.map(u => u.sourceHeroId)).size, 6);
  const scaled = buildTowerNpcTeam({ floor: 3, heroes: HEROES });
  const base = HEROES[scaled[0].sourceHeroId].stats.hp;
  assert.equal(scaled[0].stats.hp, Math.round(base * (1 + 2 * 0.12)));
});

test('L65-T3: win/lose settle uses real report, stamina 5, gold formula', () => {
  const state = player();
  const climb = prepareTowerClimb(state);
  assert.equal(climb.ok, true);
  assert.equal(climb.spentStamina, TOWER_CLIMB_STAMINA);
  assert.equal(climb.spentStamina, 5);
  const report = { win: true, playerAlive: 5, playerTotal: 6, round: 6, supportCall: { used: false }, endEnergyAvg: 10 };
  const clear = prepareTowerClear(state, { floor: 1, report, rng: () => 0, ssrPool: ['ong_hang_pho'] });
  assert.equal(clear.ok, true);
  assert.equal(clear.goldGain, towerFloorGold(1));
  assert.equal(clear.gold, 200 + towerFloorGold(1));
  const fail = prepareTowerFail(state);
  assert.equal(fail.ok, true);
  assert.equal(fail.passed, false);
  assert.equal(fail.tower.floor, 1);
  const ui = read('src/ui/tower-battle-runtime.js');
  assert.match(ui, /prepareTowerClear/);
  assert.match(ui, /prepareTowerFail/);
  assert.match(ui, /__HV_LAST_BATTLE_REPORT/);
  assert.match(ui, /spendStamina/);
});

test('L65-T4: stub lane loads runtime; no battle.html; no tower-3d rewrite', () => {
  const build = read('scripts/build-static.mjs');
  const inject = read('scripts/tower-battle-v1.mjs');
  const stub = read('scripts/lanes/tkt-0065-tower-battle.mjs');
  assert.match(build, /lanes\/tkt-0065-tower-battle\.mjs/);
  assert.match(stub, /await import\(['"]\.\.\/tower-battle-v1\.mjs['"]\)/);
  assert.match(inject, /src\/ui\/tower-battle-runtime\.js/);
  assert.match(inject, /src\/domain\/tower\/tower-npc-team\.mjs/);
  assert.doesNotMatch(inject, /battle\.html/);
  assert.doesNotMatch(read('src/ui/tower-battle-runtime.js'), /battle\.html|tower-3d-runtime|index\.html|campaign-scene/);
  const qa = read('scripts/qa-tower-screen.mjs');
  assert.match(qa, /battles >= 1/);
  assert.doesNotMatch(qa, /battles === 0/);
});
