import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  combatObservationReport,
  compareCombatObservations,
  createCombatObservation,
  finishCombatObservation,
  recordCombatImpact,
  recordCombatObservation
} from '../src/domain/combat/action-observation.mjs';

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');

function unit(id, team, hp, extra = {}) {
  return { id, team, slot: 0, hp, maxHp: 100, energy: 20, shield: 0, statuses: [], ...extra };
}

function buildObservation(sessionId, finalAmount = 15, speed = 1) {
  const observation = createCombatObservation({
    fixtureId: `l05c-parity-${sessionId}`,
    sessionId,
    seed: 'l05c-fixed-seed',
    mode: 'campaign',
    roundMax: 15
  });
  for (let round = 1; round <= 15; round += 1) {
    const before = [unit('actor', 1, 100), unit('target', 2, 100 - round + 1)];
    const after = [unit('actor', 1, 100), unit('target', 2, 100 - round)];
    const action = recordCombatObservation(observation, {
      round,
      actorId: 'actor',
      targetId: 'target',
      action: 'basic',
      kind: 'damage',
      before,
      after,
      results: [{ type: 'damage', targetId: 'target', amount: round === 15 ? finalAmount : 1 }],
      rngCalls: [{ index: round - 1, site: 'applyDamage.hit', domain: 'rule', cursor: round - 1, value: 0.25 }]
    });
    assert.equal(action.ok, true);
    assert.equal(recordCombatImpact(observation, action.action.actionId, {
      type: 'damage',
      actorId: 'actor',
      targetId: 'target',
      amount: round === 15 ? finalAmount : 1,
      before,
      after,
      metadata: { sourceBoundary: 'applyDamage', effectPhase: 'action' }
    }).ok, true);
  }
  finishCombatObservation(observation, {
    winner: 'player',
    reason: 'round-limit-tie',
    round: 15,
    roundMax: 15,
    speed,
    finishedAt: 123
  });
  return observation;
}

test('L05c round-cap report records terminal round 15 without allowing round 16', () => {
  const report = combatObservationReport(buildObservation('cap-a'));
  assert.equal(report.roundMax, 15);
  assert.equal(report.maxObservedRound, 15);
  assert.equal(report.roundCapReached, true);
  assert.equal(report.roundsBeyondCap, 0);
  assert.deepEqual(report.completion, {
    winner: 'player',
    reason: 'round-limit-tie',
    round: 15,
    roundMax: 15,
    speed: 1
  });
});

test('L05c full replay parity ignores session identity but catches deterministic outcome drift', () => {
  const first = buildObservation('speed-1', 15, 1);
  const second = buildObservation('speed-2', 15, 2);
  const same = compareCombatObservations(first, second);
  assert.equal(same.equal, true);
  assert.equal(same.scope, 'full-replay-rule-outcome');
  assert.equal(same.left.actionCount, 15);
  assert.equal(same.right.roundCapReached, true);

  const changed = buildObservation('speed-2', 16);
  assert.equal(compareCombatObservations(first, changed).equal, false);
});

test('L05c build owner exposes round-cap fixture and terminal replay metadata', () => {
  const adapter = read('../scripts/combat-domain-3q-adapter-v1.mjs');
  assert.match(adapter, /l05c-round-cap/);
  assert.match(adapter, /isScenario/);
  assert.match(adapter, /__hvCheckBattleEnd3qAdapter/);
  assert.match(adapter, /round-limit-(?:hp|tie)/);
  assert.match(adapter, /roundMax: state\.objective\?\.maxRounds/);
  assert.match(adapter, /speed: state\.speed/);
  assert.match(adapter, /replay: window\.__HV_COMBAT_LAST_REPLAY/);
  assert.match(adapter, /full-replay-rule-outcome/);
});
