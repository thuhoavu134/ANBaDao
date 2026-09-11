import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  TOWER_CATCHUP_MAX_DAYS,
  TOWER_CATCHUP_PER_DAY,
  TOWER_CLIMB_STAMINA,
  TOWER_DAY_MS,
  TOWER_GOLD_BASE,
  TOWER_GOLD_PER_FLOOR,
  TOWER_GEMS_AMOUNT,
  TOWER_POWER_BASE,
  TOWER_POWER_PER_FLOOR,
  TOWER_SHARDS_AMOUNT,
  TOWER_TRIALS,
  emptyTower,
  normalizeTower,
  prepareTowerAttempt,
  prepareTowerClaimMilestone,
  prepareTowerClear,
  prepareTowerClimb,
  prepareTowerSelectTrial,
  towerEncounterUnits,
  towerFloorGold,
  towerPowerGate,
  towerRequiredPower,
  towerTrialOffer
} from '../src/domain/tower/tower-progress.mjs';

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

test('L22-T1: empty tower starts at floor 1 and encounters stay four units', () => {
  const tower = normalizeTower(null);
  assert.equal(tower.floor, 1);
  assert.equal(tower.best, 0);
  assert.equal(tower.sigils, 0);
  const first = towerEncounterUnits(1);
  assert.equal(first.length, 4);
  assert.equal(first.every(unit => unit.name.startsWith('Bóng Tầng')), true);
  const bossFloor = towerEncounterUnits(5);
  assert.equal(bossFloor.length, 4);
  assert.equal(bossFloor.some(unit => unit.name === 'Chúa Tầng 5'), true);
});

test('L22-T2: clear is immutable, keeps campaign, and rejects a stale floor', () => {
  const state = player();
  const chapters = state.clearedChapters;
  const win = { win: true, playerAlive: 6, playerTotal: 6, round: 6 };
  const first = prepareTowerClear(state, { floor: 1, report: win, rng: () => 0, ssrPool: ['ong_pho'] });
  assert.equal(first.ok, true);
  assert.equal(first.goldGain, towerFloorGold(1));
  assert.equal(first.gold, 200 + TOWER_GOLD_BASE + TOWER_GOLD_PER_FLOOR);
  assert.equal(first.tower.floor, 2);
  assert.equal(first.tower.best, 1);
  assert.equal(state.tower.floor, 1);
  assert.equal(state.gold, 200);
  assert.deepEqual(first.clearedChapters, [0]);
  assert.equal(first.clearedChapters === chapters, false);
  assert.deepEqual(state.clearedChapters, [0]);
  const fifth = prepareTowerClear(player({ tower: { ...emptyTower(), floor: 5 } }), {
    floor: 5,
    report: win
  });
  assert.equal(fifth.gemsGain, TOWER_GEMS_AMOUNT);
  const tenth = prepareTowerClear(player({ tower: { ...emptyTower(), floor: 10 } }), {
    floor: 10,
    report: win,
    rng: () => 0.99,
    ssrPool: ['a', 'b']
  });
  assert.equal(tenth.shardHero, 'b');
  assert.equal(tenth.shards.b, TOWER_SHARDS_AMOUNT);
  const stale = prepareTowerClear({ ...state, tower: first.tower, gold: first.gold }, {
    floor: 1,
    report: win
  });
  assert.equal(stale.code, 'STALE_FLOOR');
  assert.equal(prepareTowerClimb(player({ stamina: 4 })).code, 'INSUFFICIENT_STAMINA');
  const climb = prepareTowerClimb(state);
  assert.equal(climb.ok, true);
  assert.equal(climb.stamina, 20 - TOWER_CLIMB_STAMINA);
  assert.equal(state.stamina, 20);
});

test('L22-T3: rotating trials, bonus on success, milestone claim rejects duplicates', () => {
  assert.deepEqual(towerTrialOffer(1), ['intact', 'swift', 'self']);
  assert.deepEqual(towerTrialOffer(2), ['swift', 'self', 'reserve']);
  const armed = player();
  const picked = prepareTowerSelectTrial(armed, 'intact');
  assert.equal(picked.ok, true);
  assert.equal(picked.tower.selectedTrial, 'intact');
  assert.equal(armed.tower.selectedTrial, null);
  const clear = prepareTowerClear({ ...armed, tower: picked.tower }, {
    floor: 1,
    report: { win: true, playerAlive: 5, playerTotal: 6, round: 8 }
  });
  assert.equal(clear.trialOk, true);
  assert.equal(clear.goldGain, towerFloorGold(1) + Math.round(towerFloorGold(1) * TOWER_TRIALS.intact.goldBonus));
  assert.equal(clear.tower.sigils, 1);
  const miss = prepareTowerClear({ ...armed, tower: picked.tower }, {
    floor: 1,
    report: { win: true, playerAlive: 2, playerTotal: 6, round: 8 }
  });
  assert.equal(miss.trialOk, false);
  assert.equal(miss.tower.sigils, 0);
  const rich = player({ tower: { ...emptyTower(), sigils: 3 } });
  const claim = prepareTowerClaimMilestone(rich, 3);
  assert.equal(claim.ok, true);
  assert.equal(claim.gold, 700);
  assert.equal(rich.gold, 200);
  assert.equal(prepareTowerClaimMilestone({ ...rich, tower: claim.tower, gold: claim.gold }, 3).code, 'ALREADY_CLAIMED');
  assert.equal(prepareTowerClaimMilestone(player(), 3).code, 'NOT_ENOUGH_SIGILS');
});

test('L22-P1: required power rises with the floor and floor 1 sits under a 6-hero start', () => {
  assert.equal(towerRequiredPower(1), TOWER_POWER_BASE);
  assert.equal(towerRequiredPower(2), TOWER_POWER_BASE + TOWER_POWER_PER_FLOOR);
  assert.equal(towerRequiredPower(10) > towerRequiredPower(2), true);
  assert.equal(TOWER_POWER_BASE < 4800, true);
});

test('L22-P2: under-power attempt spends stamina, keeps the floor, and records the stuck clock', () => {
  const now = 1_700_000_000_000;
  const state = player({ tower: { ...emptyTower(), floor: 12 } });
  const required = towerRequiredPower(12);
  const weak = Math.floor(required * 0.7);
  const gate = towerPowerGate(state, { teamPower: weak, now });
  assert.equal(gate.pass, false);
  const attempt = prepareTowerAttempt(state, { teamPower: weak, now });
  assert.equal(attempt.ok, true);
  assert.equal(attempt.passed, false);
  assert.equal(attempt.stamina, 20 - TOWER_CLIMB_STAMINA);
  assert.equal(attempt.tower.floor, 12);
  assert.equal(attempt.tower.stuckFloor, 12);
  assert.equal(attempt.tower.stuckSince, now);
  assert.equal(attempt.gold, 200);
  assert.deepEqual(attempt.clearedChapters, [0]);
  assert.equal(state.tower.floor, 12);
  assert.equal(state.stamina, 20);
  assert.equal(prepareTowerAttempt(player({ stamina: 0 }), { teamPower: 99999 }).code, 'INSUFFICIENT_STAMINA');
  const later = now + TOWER_DAY_MS;
  const again = prepareTowerAttempt(
    { ...state, tower: attempt.tower, stamina: 15 },
    { teamPower: weak, now: later }
  );
  assert.equal(again.passed, false);
  assert.equal(again.tower.stuckSince, now);
  assert.equal(again.tower.floor, 12);
});

test('L22-P3: a near-miss can pass after a few catch-up days and the bonus caps', () => {
  const now = 1_700_000_000_000;
  const floor = 8;
  const required = towerRequiredPower(floor);
  const power = Math.floor(required * 0.82);
  const stuck = { ...emptyTower(), floor, stuckFloor: floor, stuckSince: now };
  const day0 = prepareTowerAttempt(player({ tower: stuck }), { teamPower: power, now });
  assert.equal(day0.passed, false);
  const later = now + 3 * TOWER_DAY_MS;
  const day3 = prepareTowerAttempt(player({ tower: stuck }), { teamPower: power, now: later });
  assert.equal(day3.passed, true);
  assert.equal(day3.tower.floor, floor + 1);
  assert.equal(day3.tower.stuckSince, 0);
  assert.equal(day3.gate.days, 3);
  assert.equal(day3.gate.effective, Math.round(power * (1 + TOWER_CATCHUP_PER_DAY * 3)));
  const capped = towerPowerGate(player({ tower: stuck }), {
    teamPower: power,
    now: now + 20 * TOWER_DAY_MS
  });
  assert.equal(capped.days, TOWER_CATCHUP_MAX_DAYS);
});

const ui = readFileSync(new URL('../src/ui/tower-runtime.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/ui/tower-screen.css', import.meta.url), 'utf8');
const inject = readFileSync(new URL('../scripts/tower-runtime-v1.mjs', import.meta.url), 'utf8');

test('L22-T4: hub landmark and lacquer climb screen are wired', () => {
  assert.match(ui, /data-tower-climb/);
  assert.match(ui, /data-art-go="tower"/);
  assert.match(ui, /prepareTowerAttempt/);
  assert.match(ui, /prepareTowerClimb/);
  assert.match(ui, /Leo tầng/);
  assert.match(css, /#hvTowerRoot/);
  assert.match(css, /\.hv-tower-climb/);
  assert.match(inject, /tower-progress\.mjs/);
  new Function(ui);
});

test('L22-P4: climb screen shows the power gate and auto-resolves attempts', () => {
  assert.match(ui, /prepareTowerAttempt/);
  assert.match(ui, /towerPowerGate/);
  assert.match(ui, /data-tower-power/);
  assert.match(ui, /Lực chiến/);
  assert.match(css, /\.hv-tower-power/);
  assert.match(css, /\.hv-tower-power-bar/);
  new Function(ui);
});
