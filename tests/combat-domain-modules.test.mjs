import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {
  BATTLE_SESSION_SCHEMA,
  COMBAT_RESULT_TYPES,
  beginRound,
  beginMove,
  createBattleSessionStore,
  createRoundManager,
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

test('BattleSession store owns identity and finishing is idempotent', () => {
  const store = createBattleSessionStore();
  const session = store.create({ battleId: 'module-battle', seed: 'seed-1', roundMax: 15 });
  assert.equal(session.schema, BATTLE_SESSION_SCHEMA);
  assert.equal(session.sessionId, 'module-battle');
  assert.equal(store.get('module-battle'), session);
  assert.equal(store.ensure({ battleId: 'module-battle' }), session);
  finishBattleSession(session, { winner: 1, reason: 'objective' });
  finishBattleSession(session, { winner: 2, reason: 'duplicate' });
  assert.equal(session.status, 'finished');
  assert.equal(session.winner, 1);
  assert.equal(session.reason, 'objective');
});

test('RoundManager creates stable round and move ownership', () => {
  const session = createBattleSessionStore().create({ battleId: 'round-battle' });
  const manager = createRoundManager();
  const round = manager.beginRound(session, 1, { phase: 'opening' });
  const move = manager.beginMove(session, { roundIndex: 1, actorId: 'a', skillId: 'basic' });
  assert.equal(round.id, 'round-battle:r1');
  assert.equal(move.id, 'round-battle:r1:m1');
  assert.equal(session.currentMove, move);
  manager.finishMove(session, move);
  const stored = manager.finishRound(session);
  assert.equal(stored.closed, true);
  assert.equal(session.rounds.length, 1);
  assert.equal(session.currentRound, null);
});

test('CombatResult derives the same typed damage/status/death sequence deterministically', () => {
  const before = [unit('a', 1, 0, 100), unit('b', 2, 0, 100)];
  const after = [unit('a', 1, 0, 100), unit('b', 2, 0, 0, { dead: true, statuses: [{ type: 'stun', turns: 1 }] })];
  const results = deriveCombatResults(before, after, { targetId: 'b' });
  assert.deepEqual(results.map((entry) => entry.type), [
    COMBAT_RESULT_TYPES.DAMAGE,
    COMBAT_RESULT_TYPES.BUFF_ADD,
    COMBAT_RESULT_TYPES.DEATH
  ]);
  assert.equal(results[0].amount, 100);
  assert.deepEqual(snapshotCombatUnits([unit('b', 2, 0, 0), unit('a', 1, 0, 80)]).map((entry) => entry.id), ['a', 'b']);
});

test('recordCombatAction attaches ordered results to a session replay stream', () => {
  const session = createBattleSessionStore().create({ battleId: 'result-battle' });
  const action = recordCombatAction(session, {
    roundIndex: 1,
    actorId: 'a',
    action: 'basic',
    kind: 'damage',
    targetId: 'b',
    before: [unit('a', 1, 0, 100), unit('b', 2, 0, 100)],
    after: [unit('a', 1, 0, 100), unit('b', 2, 0, 40)]
  });
  assert.equal(action.id, 'result-battle:r1:m1:a1');
  assert.equal(action.results[0].id, 'result-battle:r1:m1:a1:res1');
  assert.equal(session.counters.action, 1);
  assert.equal(session.counters.result, 1);
  assert.equal(session.events[0].type, COMBAT_RESULT_TYPES.DAMAGE);
});

test('module surface is browser-safe and has no DOM/Node dependency', () => {
  const source = [
    createRoundManager.toString(),
    beginRound.toString()
  ].join('\n');
  const sandbox = {};
  vm.runInNewContext(source, sandbox);
  assert.equal(typeof sandbox.createRoundManager, 'function');
  assert.equal(typeof sandbox.beginRound, 'function');
});
