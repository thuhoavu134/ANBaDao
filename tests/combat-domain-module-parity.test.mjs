import test from 'node:test';
import assert from 'node:assert/strict';
import {
  COMBAT_RESULT_TYPES as CORE_RESULT_TYPES,
  createCombatDomain
} from '../scripts/combat-domain-3q-core.mjs';
import {
  COMBAT_RESULT_TYPES as MODULE_RESULT_TYPES,
  beginRound,
  beginMove,
  createBattleSessionStore,
  deriveCombatResults,
  finishBattleSession,
  finishMove,
  finishRound,
  recordCombatAction,
  snapshotCombatUnits
} from '../src/domain/combat/index.mjs';

function unit(id, team, slot, hp, extra = {}) {
  return { id, team, slot, hp, maxHp: 100, statuses: [], ...extra };
}

function comparableSession(session) {
  return {
    schema: session.schema,
    battleId: session.battleId,
    seed: session.seed,
    roundMax: session.roundMax,
    status: session.status,
    winner: session.winner,
    reason: session.reason,
    counters: session.counters,
    rounds: session.rounds,
    currentRound: session.currentRound,
    currentMove: session.currentMove,
    events: session.events,
    startedAt: session.startedAt,
    finishedAt: session.finishedAt
  };
}

test('module snapshot and result derivation stay byte-compatible with the 3Q core', () => {
  const core = createCombatDomain();
  const before = [
    unit('target-2', 2, 1, 88, { shield: 12, statuses: [{ type: 'poison', turns: 2, sourceId: 'caster' }] }),
    unit('actor-1', 1, 0, 100)
  ];
  const after = [
    unit('target-2', 2, 1, 0, { dead: true, statuses: [{ type: 'stun', turns: 1, sourceId: 'actor-1' }] }),
    unit('actor-1', 1, 0, 100)
  ];
  const action = { targetId: 'target-2' };
  assert.deepEqual(snapshotCombatUnits(before), core.snapshotUnits(before));
  assert.deepEqual(deriveCombatResults(before, after, action), core.deriveResults(before, after, action));
  assert.equal(MODULE_RESULT_TYPES.DAMAGE, CORE_RESULT_TYPES.DAMAGE);
  assert.equal(MODULE_RESULT_TYPES.DEATH, CORE_RESULT_TYPES.DEATH);
});

test('module round/action lifecycle matches core IDs, counters and ordered result stream', () => {
  const core = createCombatDomain();
  const coreSession = core.createSession({ battleId: 'parity-battle', seed: 'same-seed', roundMax: 15 });
  const moduleSession = createBattleSessionStore().create({ battleId: 'parity-battle', seed: 'same-seed', roundMax: 15 });
  const before = [unit('actor', 1, 0, 100), unit('target', 2, 0, 100)];
  const after = [unit('actor', 1, 0, 100), unit('target', 2, 0, 55)];

  const coreAction = core.recordAction(coreSession, {
    roundIndex: 1,
    actorId: 'actor',
    action: 'basic',
    kind: 'damage',
    targetId: 'target',
    before,
    after
  });
  const moduleAction = recordCombatAction(moduleSession, {
    roundIndex: 1,
    actorId: 'actor',
    action: 'basic',
    kind: 'damage',
    targetId: 'target',
    before,
    after
  });

  assert.deepEqual(moduleAction, coreAction);
  assert.deepEqual(comparableSession(moduleSession), comparableSession(coreSession));
});

test('module round manager preserves core round rollover and battle finish behavior', () => {
  const core = createCombatDomain();
  const coreSession = core.createSession({ battleId: 'round-parity' });
  const moduleSession = createBattleSessionStore().create({ battleId: 'round-parity' });

  const coreRound = core.beginRound(coreSession, 1, { phase: 'opening' });
  const moduleRound = beginRound(moduleSession, 1, { phase: 'opening' });
  assert.deepEqual(moduleRound, coreRound);

  const coreMove = core.beginMove(coreSession, { roundIndex: 1, actorId: 'a', skillId: 'basic' });
  const moduleMove = beginMove(moduleSession, { roundIndex: 1, actorId: 'a', skillId: 'basic' });
  assert.deepEqual(moduleMove, coreMove);

  finishMove(moduleSession, moduleMove);
  core.finishMove(coreSession, coreMove);
  assert.deepEqual(comparableSession(moduleSession), comparableSession(coreSession));

  const moduleStoredRound = finishRound(moduleSession, { actions: 1 });
  const coreStoredRound = core.finishRound(coreSession, { actions: 1 });
  assert.deepEqual(moduleStoredRound, coreStoredRound);

  finishBattleSession(moduleSession, { winner: 1, reason: 'objective' });
  core.finishBattle(coreSession, { winner: 1, reason: 'objective' });
  assert.deepEqual(comparableSession(moduleSession), comparableSession(coreSession));
});

test('module result contract keeps miss/noop fallback aligned with core', () => {
  const core = createCombatDomain();
  const before = [unit('a', 1, 0, 100)];
  assert.deepEqual(
    deriveCombatResults(before, before, { targetId: 'missing' }),
    core.deriveResults(before, before, { targetId: 'missing' })
  );
  assert.deepEqual(
    deriveCombatResults(before, before, {}),
    core.deriveResults(before, before, {})
  );
});
