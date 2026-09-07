import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  COMBAT_OBSERVATION_GAPS,
  combatObservationReport,
  createCombatObservation,
  recordCombatImpact,
  recordCombatObservation
} from '../src/domain/combat/action-observation.mjs';

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');

function unit(id, team, hp, extra = {}) {
  return { id, team, slot: 0, hp, maxHp: 100, energy: 20, shield: 0, statuses: [], ...extra };
}

test('L05c report closes final-action and per-impact snapshot gaps', () => {
  const observation = createCombatObservation({
    fixtureId: 'l05c-boundary-contract',
    sessionId: 'l05c-boundary-contract',
    seed: 'stable-seed',
    roundMax: 15
  });
  const before = [unit('actor', 1, 100), unit('target', 2, 100, { statuses: [{ type: 'poison', turns: 2, power: 4 }] })];
  const after = [unit('actor', 1, 92), unit('target', 2, 72, { statuses: [{ type: 'poison', turns: 1, power: 4 }] })];
  const recorded = recordCombatObservation(observation, {
    round: 1,
    actorId: 'actor',
    targetId: 'target',
    action: 'skill',
    kind: 'multi',
    before,
    after,
    finalSnapshot: after,
    finalSnapshotBoundary: 'resolveAction.complete',
    results: [{ type: 'damage', targetId: 'target', amount: 20 }]
  });
  assert.equal(recorded.ok, true);
  const actionId = recorded.action.actionId;

  for (const impact of [
    { type: 'damage', amount: 12, metadata: { sourceBoundary: 'applyDamage', effectPhase: 'action' } },
    { type: 'damage', amount: 8, metadata: { sourceBoundary: 'applyDamage', effectPhase: 'action' } },
    { type: 'dot', amount: 4, metadata: { sourceBoundary: 'tickStatuses', effectPhase: 'turn-start', statusType: 'poison', eventIndex: 0 } },
    { type: 'heal', amount: 8, metadata: { sourceBoundary: 'applyHeal', effectPhase: 'action' } }
  ]) {
    assert.equal(recordCombatImpact(observation, actionId, { ...impact, actorId: 'actor', targetId: 'target', before, after }).ok, true);
  }

  const report = combatObservationReport(observation);
  assert.deepEqual(report.impactBoundaryCoverage, {
    applyDamage: 2,
    applyHeal: 1,
    tickStatuses: 1
  });
  assert.deepEqual(report.directBoundaryTypes, ['applyDamage', 'applyHeal', 'tickStatuses']);
  assert.equal(report.directBoundaryCount, 4);
  assert.equal(report.multiImpactActionCount, 1);
  assert.equal(report.multiHitActionCount, 1);
  assert.deepEqual(report.finalSnapshotCoverage, { captured: 1, expected: 1, complete: true });
  assert.deepEqual(report.finalSnapshotBoundaryTypes, ['resolveAction.complete']);
  assert.deepEqual(report.impactSnapshotCoverage, {
    captured: 4,
    expected: 4,
    actions: 1,
    actionsWithBoundary: 1,
    complete: true
  });
  assert.deepEqual(report.impactSnapshotBoundaryTypes, ['applyDamage', 'applyHeal', 'tickStatuses']);
  assert.equal(report.gaps.some(entry => entry.code === COMBAT_OBSERVATION_GAPS.FINAL_ACTION_SNAPSHOT), false);
  assert.equal(report.gaps.some(entry => entry.code === COMBAT_OBSERVATION_GAPS.PER_IMPACT_BOUNDARY), false);
});

test('L05c report keeps final-action snapshot gap open when any action omits the explicit capture', () => {
  const observation = createCombatObservation({ fixtureId: 'l05c-final-gap', sessionId: 'l05c-final-gap' });
  const before = [unit('actor', 1, 100), unit('target', 2, 100)];
  const after = [unit('actor', 1, 100), unit('target', 2, 80)];
  recordCombatObservation(observation, {
    round: 1,
    actorId: 'actor',
    targetId: 'target',
    action: 'basic',
    kind: 'damage',
    before,
    after
  });
  const report = combatObservationReport(observation);
  assert.deepEqual(report.finalSnapshotCoverage, { captured: 0, expected: 1, complete: false });
  assert.equal(report.gaps.some(entry => entry.code === COMBAT_OBSERVATION_GAPS.FINAL_ACTION_SNAPSHOT), true);
});

test('L05c build owner injects action-cost and tick-status boundaries at source runtime', () => {
  const adapter = read('../scripts/combat-domain-3q-adapter-v1.mjs');
  assert.match(adapter, /__hvDebitActionEnergy3qAdapter/);
  assert.match(adapter, /performAction\.action-cost/);
  assert.match(adapter, /__hvTickStatuses3qAdapter/);
  assert.match(adapter, /sourceBoundary: 'tickStatuses'/);
  assert.match(adapter, /effectPhase: 'turn-start'/);
  assert.match(adapter, /statusType/);
  assert.match(adapter, /eventIndex/);
  assert.match(adapter, /actor\.energy = Math\.max\(0, actor\.energy - cost\);/);
  assert.match(adapter, /const statusEvents = __hvTickStatuses3qAdapter\(actor\);/);
  assert.match(adapter, /metadata: \{ sourceBoundary: 'applyHeal', effectPhase: 'action' \}/);
  assert.match(adapter, /finalSnapshot: after/);
  assert.match(adapter, /finalSnapshotBoundary: 'resolveAction\.complete'/);
});
