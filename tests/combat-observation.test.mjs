import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  COMBAT_OBSERVATION_GAPS,
  COMBAT_OBSERVATION_SCHEMA,
  combatObservationReport,
  createCombatObservation,
  finishCombatObservation,
  recordCombatImpact,
  recordCombatObservation,
  rngSitesForAction
} from '../src/domain/combat/action-observation.mjs';

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');
function unit(id, team, slot, hp, extra = {}) {
  return { id, team, slot, hp, maxHp: 100, shield: 0, energy: 20, statuses: [], ...extra };
}

test('L05a fixture recorder keeps ordered before/after evidence for basic, combo, AOE, heal and status cases', () => {
  const observation = createCombatObservation({
    fixtureId: 'l05a-engine-cases',
    sessionId: 'fixture-battle-1',
    seed: 'l05a-seed',
    mode: 'campaign',
    roundMax: 15,
    startedAt: 100
  });
  const targetBefore = [unit('ong_hang_pho', 1, 0, 100), unit('enemy-1', 2, 0, 100)];
  const targetAfter = [unit('ong_hang_pho', 1, 0, 100), unit('enemy-1', 2, 0, 72)];
  const basic = recordCombatObservation(observation, {
    round: 1, actionId: 'fixture-battle-1:r1:basic', actorId: 'ong_hang_pho',
    targetId: 'enemy-1', action: 'basic', kind: 'damage', before: targetBefore, after: targetAfter
  });
  assert.equal(basic.ok, true);
  assert.equal(basic.action.results[0].type, 'damage');

  const comboBefore = targetAfter;
  const comboAfter = [unit('ong_hang_pho', 1, 0, 100), unit('enemy-1', 2, 0, 44)];
  const combo = recordCombatObservation(observation, {
    round: 1, actionId: 'fixture-battle-1:r1:combo-2', actorId: 'ong_hang_pho',
    targetId: 'enemy-1', action: 'skill', kind: 'contactCombo', before: comboBefore, after: comboAfter
  });
  assert.equal(combo.action.results[0].amount, 28);

  const aoeBefore = [unit('luc_anh', 1, 1, 100), unit('enemy-a', 2, 0, 100), unit('enemy-b', 2, 1, 100), unit('enemy-c', 2, 2, 100)];
  const aoeAfter = [unit('luc_anh', 1, 1, 100), unit('enemy-a', 2, 0, 75), unit('enemy-b', 2, 1, 82), unit('enemy-c', 2, 2, 91)];
  const aoe = recordCombatObservation(observation, {
    round: 2, actorId: 'luc_anh', action: 'ultimate', kind: 'aoe', before: aoeBefore, after: aoeAfter
  });
  assert.deepEqual(aoe.action.results.map(result => result.type), ['damage', 'damage', 'damage']);

  const healBefore = [unit('thay_mo', 1, 2, 40), unit('ally', 1, 3, 70)];
  const healAfter = [unit('thay_mo', 1, 2, 40), unit('ally', 1, 3, 82, { shield: 20 })];
  const heal = recordCombatObservation(observation, {
    round: 3, actorId: 'thay_mo', targetId: 'ally', action: 'skill', kind: 'heal', before: healBefore, after: healAfter
  });
  assert.deepEqual(heal.action.results.map(result => result.type), ['heal', 'barrier']);

  const statusBefore = [unit('enemy-stun', 2, 0, 100)];
  const statusAfter = [unit('enemy-stun', 2, 0, 100, { statuses: [{ type: 'stun', turns: 1, sourceId: 'luc_anh' }] })];
  const status = recordCombatObservation(observation, {
    round: 4, actorId: 'luc_anh', targetId: 'enemy-stun', action: 'skill', kind: 'stun', before: statusBefore, after: statusAfter
  });
  assert.equal(status.action.results[0].type, 'buffAdd');

  const dotBefore = [unit('enemy-dot', 2, 1, 90, { statuses: [{ type: 'poison', turns: 2, power: 4, sourceId: 'thay_mo' }] })];
  const dotAfter = [unit('enemy-dot', 2, 1, 86, { statuses: [{ type: 'poison', turns: 1, power: 4, sourceId: 'thay_mo' }] })];
  const dot = recordCombatObservation(observation, {
    round: 5, actorId: 'thay_mo', targetId: 'enemy-dot', action: 'status-tick', kind: 'dot', before: dotBefore, after: dotAfter
  });
  assert.deepEqual(dot.action.results.map(result => result.type), ['damage', 'buffUpdate']);

  const report = combatObservationReport(observation);
  assert.equal(report.schema, COMBAT_OBSERVATION_SCHEMA);
  assert.equal(report.actionCount, 6);
  assert.ok(report.resultTypes.includes('damage'));
  assert.ok(report.resultTypes.includes('heal'));
  assert.ok(report.resultTypes.includes('barrier'));
  assert.ok(report.resultTypes.includes('buffAdd'));
  assert.ok(report.rngSites.includes('applyDamage.hit'));
  assert.ok(report.rngSites.includes('burst.angle'));
  assert.ok(report.gaps.some(item => item.code === COMBAT_OBSERVATION_GAPS.PER_IMPACT_BOUNDARY));
  assert.equal(finishCombatObservation(observation, { finishedAt: 200 }).status, 'finished');
  assert.equal(recordCombatObservation(observation, { round: 6 }).code, 'COMBAT_OBSERVATION_CLOSED');
});

test('L05a can attach an explicit sub-impact without mutating the captured snapshots', () => {
  const observation = createCombatObservation({ fixtureId: 'l05a-impact', sessionId: 'impact-session' });
  const before = [unit('target', 2, 0, 100)];
  const after = [unit('target', 2, 0, 80)];
  const action = recordCombatObservation(observation, {
    round: 1, actionId: 'impact-session:r1:combo', actorId: 'actor', targetId: 'target',
    action: 'skill', kind: 'contactCombo', before, after
  });
  const impact = recordCombatImpact(observation, action.action.actionId, {
    type: 'damage', subActionIndex: 0, actorId: 'actor', targetId: 'target', before, after,
    rngCalls: [{ site: 'applyDamage.hit', domain: 'rule', value: 0.1 }]
  });
  assert.equal(impact.ok, true);
  assert.equal(impact.impact.rngCalls[0].captured, true);
  assert.equal(combatObservationReport(observation).impactCount, 1);
  before[0].hp = 1;
  assert.equal(observation.actions[0].before[0].hp, 100);
  assert.equal(rngSitesForAction('heal').some(site => site.site === 'applyDamage.hit'), false);
});

test('L05a build owner exposes opt-in fixture capture at resolveAction boundary and records the known gap', () => {
  const adapter = read('../scripts/combat-domain-3q-adapter-v1.mjs');
  const index = read('../src/domain/combat/index.mjs');
  const shell = read('../index.html');
  assert.match(index, /action-observation\.mjs/);
  assert.match(adapter, /action-observation\.mjs/);
  assert.match(adapter, /__HV_COMBAT_FIXTURE_V1/);
  assert.match(adapter, /qaCombatFixture/);
  assert.match(adapter, /fixture\.start/);
  assert.match(adapter, /hvCombatFixtureReport/);
  assert.match(adapter, /data-report/);
  assert.match(adapter, /snapshotBoundary/);
  assert.match(adapter, /rngSitesForAction/);
  assert.match(adapter, /before/);
  assert.match(adapter, /after/);
  assert.match(adapter, /shellMarker/);
  assert.match(adapter, /fixtureSuffix/);
  assert.match(adapter, /qaCombatFixture=l05a/);
  assert.doesNotMatch(shell, /qaCombatFixture/);
});
