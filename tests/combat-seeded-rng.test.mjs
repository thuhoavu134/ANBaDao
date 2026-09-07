import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  COMBAT_OBSERVATION_GAPS,
  combatObservationReport,
  createBattleSessionStore,
  createCombatObservation,
  createCombatSessionRng,
  createSeededCombatRng,
  recordCombatObservation
} from '../src/domain/combat/index.mjs';
import { createCombatDomain } from '../scripts/combat-domain-3q-core.mjs';

function unit(id, team, hp, extra = {}) {
  return { id, team, slot: 0, hp, maxHp: 100, shield: 0, energy: 20, statuses: [], ...extra };
}

test('same combat seed keeps rule values stable when presentation calls are interleaved', () => {
  const first = createSeededCombatRng('l05c-seed');
  const second = createSeededCombatRng('l05c-seed');
  assert.equal(first.nextRule('applyDamage.hit'), second.nextRule('applyDamage.hit'));
  first.nextPresentation('burst.angle');
  first.nextPresentation('burst.speed');
  assert.equal(first.nextRule('applyDamage.variance'), second.nextRule('applyDamage.variance'));
  assert.equal(first.nextRule('applyDamage.crit'), second.nextRule('applyDamage.crit'));
  assert.notEqual(first.nextPresentation('burst.life'), first.nextRule('applyDamage.hit'));
});

test('session RNG is cached per battle object without changing the session shape', () => {
  const store = createBattleSessionStore();
  const session = store.create({ battleId: 'battle-1', seed: 'session-seed' });
  const first = createCombatSessionRng(session);
  assert.equal(createCombatSessionRng(session), first);
  assert.deepEqual(Object.keys(session), [
    'schema', 'battleId', 'sessionId', 'seed', 'roundMax', 'status', 'winner',
    'reason', 'counters', 'rounds', 'currentRound', 'currentMove', 'events',
    'startedAt', 'finishedAt'
  ]);
});

test('observation report closes only when every expected rule call is captured', () => {
  const observation = createCombatObservation({ fixtureId: 'l05c-rng', sessionId: 'l05c-rng', seed: 'capture-seed' });
  const rng = createSeededCombatRng('capture-seed');
  const calls = [
    { index: 0, site: 'applyDamage.hit', domain: 'rule', cursor: 0, value: rng.nextRule('applyDamage.hit') },
    { index: 1, site: 'applyDamage.variance', domain: 'rule', cursor: 1, value: rng.nextRule('applyDamage.variance') },
    { index: 2, site: 'applyDamage.crit', domain: 'rule', cursor: 2, value: rng.nextRule('applyDamage.crit') }
  ];
  recordCombatObservation(observation, {
    round: 1,
    actorId: 'actor',
    action: 'basic',
    kind: 'damage',
    targetId: 'target',
    before: [unit('actor', 1, 100), unit('target', 2, 100)],
    after: [unit('actor', 1, 100), unit('target', 2, 80)],
    rngCalls: calls,
    rngCursor: { start: 0, end: 3 }
  });
  const report = combatObservationReport(observation);
  assert.equal(report.capturedRuleRngCallCount, 3);
  assert.equal(report.gaps.some(entry => entry.code === COMBAT_OBSERVATION_GAPS.RNG_VALUE), false);
  const incomplete = createCombatObservation({ fixtureId: 'l05c-incomplete', sessionId: 'l05c-incomplete' });
  recordCombatObservation(incomplete, {
    round: 1,
    kind: 'damage',
    before: [unit('actor', 1, 100)],
    after: [unit('actor', 1, 100)],
    rngCalls: [{ site: 'applyDamage.hit', domain: 'rule', cursor: 0, value: 0.2 }]
  });
  assert.equal(combatObservationReport(incomplete).gaps.some(entry => entry.code === COMBAT_OBSERVATION_GAPS.RNG_VALUE), true);
});

test('core replay preserves captured RNG calls and cursor without changing existing fields', () => {
  const domain = createCombatDomain();
  const session = domain.createSession({ battleId: 'replay-battle', seed: 'replay-seed', roundMax: 15 });
  const calls = [{ index: 4, site: 'applyDamage.hit', domain: 'rule', cursor: 2, captured: true, value: 0.25 }];
  domain.recordAction(session, {
    roundIndex: 1,
    actorId: 'actor',
    action: 'basic',
    kind: 'damage',
    targetId: 'target',
    before: [unit('actor', 1, 100), unit('target', 2, 100)],
    after: [unit('actor', 1, 100), unit('target', 2, 80)],
    rngCalls: calls,
    rngCursor: { start: 2, end: 3 }
  });
  const replay = JSON.parse(domain.serializeReplay(session));
  const replayAction = replay.rounds[0].moves[0].actions[0];
  assert.deepEqual(replayAction.rngCalls, calls);
  assert.deepEqual(replayAction.rngCursor, { start: 2, end: 3 });
});

test('3Q build owner wires seeded rule and presentation streams through source patching', () => {
  const adapter = readFileSync(new URL('../scripts/combat-domain-3q-adapter-v1.mjs', import.meta.url), 'utf8');
  assert.match(adapter, /readCombatModuleSource\('seeded-rng\.mjs'\)/);
  assert.match(adapter, /__hvRuleRandom3qAdapter\("applyDamage\.hit"\)/);
  assert.match(adapter, /__hvPresentationRandom3qAdapter\("burst\.angle"\)/);
  assert.match(adapter, /__hvCombatRngCallsSince3qAdapter\(rngStart\)/);
  assert.match(adapter, /rngCursor: \{ start: rngStart, end: rngEnd \}/);
  assert.match(adapter, /configuredSeed = EMBED_CONFIG\?\.combatSeed \?\? EMBED_CONFIG\?\.seed/);
  assert.match(adapter, /remainingMathRandomCalls/);
});

