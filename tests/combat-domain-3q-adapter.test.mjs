import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { COMBAT_RESULT_TYPES, createCombatDomain } from '../scripts/combat-domain-3q-core.mjs';

function unit(id, team, slot, hp, extra = {}) {
  return { id, team, slot, hp, maxHp: 100, statuses: [], ...extra };
}

test('3Q-derived fighter lifecycle stays compositional and resettable', () => {
  const domain = createCombatDomain();
  const fighter = domain.normalizeFighter({ id: 'h1', hp: 100, statuses: [{ type: 'stun', turns: 1 }], cd: { record: { skill: 4 } } });
  assert.deepEqual(Object.keys(fighter).filter((key) => ['attr', 'buff', 'skill', 'cd', 'roundVar'].includes(key)).sort(), ['attr', 'buff', 'cd', 'roundVar', 'skill']);
  assert.equal(domain.canAct(fighter), false, 'buff hooks block an action when a control status is present');
  const reset = domain.resetFighter(fighter);
  assert.deepEqual(reset.cd.record, {});
  assert.deepEqual(reset.buff.list, []);
  assert.deepEqual(reset.roundVar, {});
  assert.equal(domain.canAct(reset), true);
});

test('round → move → action produces typed deterministic results and stable IDs', () => {
  const domain = createCombatDomain();
  const session = domain.createSession({ battleId: 'b-1', seed: 'seed-7', roundMax: 15 });
  const before = [unit('a', 1, 0, 100), unit('b', 2, 0, 100)];
  const after = [unit('a', 1, 0, 100), unit('b', 2, 0, 0, { dead: true, statuses: [{ type: 'stun', turns: 1 }] })];
  const action = domain.recordAction(session, { roundIndex: 1, actorId: 'a', action: 'basic', kind: 'damage', targetId: 'b', before, after });
  assert.equal(action.id, 'b-1:r1:m1:a1');
  assert.deepEqual(action.results.map((entry) => entry.type), [COMBAT_RESULT_TYPES.DAMAGE, COMBAT_RESULT_TYPES.BUFF_ADD, COMBAT_RESULT_TYPES.DEATH]);
  assert.equal(action.results[0].amount, 100);
  assert.equal(session.events[2].id, 'b-1:r1:m1:a1:res3');
  assert.match(domain.serializeReplay(session), /"schema":"hon-viet-combat\/v1"/);
});

test('target selection is deterministic and supports front, back, health and seeded modes', () => {
  const domain = createCombatDomain();
  const roster = [unit('u3', 2, 2, 30, { atk: 90 }), unit('u1', 2, 0, 70, { atk: 50 }), unit('u2', 2, 1, 20, { atk: 120 })];
  assert.deepEqual(domain.selectTargets(roster, { mode: 'front', count: 2 }).map((x) => x.id), ['u1', 'u2']);
  assert.deepEqual(domain.selectTargets(roster, { mode: 'back', count: 1 }).map((x) => x.id), ['u3']);
  assert.deepEqual(domain.selectTargets(roster, { mode: 'lowestHp', count: 2 }).map((x) => x.id), ['u2', 'u3']);
  assert.deepEqual(domain.selectTargets(roster, { mode: 'random', seed: 'same', count: 3 }).map((x) => x.id), domain.selectTargets(roster, { mode: 'random', seed: 'same', count: 3 }).map((x) => x.id));
});

test('cooldown availability follows a round-ready record with rewrite config', () => {
  const domain = createCombatDomain();
  const cd = domain.createCooldownState({ rewriteCfg: { 7: 1 } });
  domain.handleSkillUsed(cd, { id: 7, cd: 3, unlockRound: 0 }, 1);
  assert.equal(domain.getCooldown(cd, 7), 3);
  assert.equal(domain.available(cd, 7, 2), false);
  assert.equal(domain.available(cd, 7, 3), true);
  domain.offsetCooldown(cd, 1);
  assert.equal(domain.getCooldown(cd, 7), 2);
});

test('browser injection factory has no Node-only closure dependencies', () => {
  const source = `(${createCombatDomain.toString()})()`;
  const sandbox = {};
  vm.runInNewContext(`globalThis.domain=${source};`, sandbox);
  const session = sandbox.domain.createSession({ battleId: 'browser' });
  assert.equal(session.schema, 'hon-viet-combat/v1');
});
