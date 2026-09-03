import test from 'node:test';
import assert from 'node:assert/strict';
import {
  available,
  canAct,
  createCooldownState,
  handleSkillUsed,
  normalizeFighter,
  offsetCooldown,
  resetFighter,
  selectTargets
} from '../src/domain/combat/index.mjs';

function unit(id, team, slot, hp, extra = {}) {
  return { id, team, slot, hp, maxHp: 100, statuses: [], ...extra };
}

test('Fighter module keeps 3Q composition and blocked-action semantics', () => {
  const fighter = normalizeFighter({
    id: 'fighter-1',
    hp: 100,
    statuses: [{ type: 'stun', turns: 1 }],
    cd: { record: { ultimate: 4 } }
  });
  assert.equal(canAct(fighter), false);
  assert.deepEqual(Object.keys(fighter).filter((key) => ['attr', 'buff', 'skill', 'cd', 'roundVar'].includes(key)).sort(), ['attr', 'buff', 'cd', 'roundVar', 'skill']);
  const reset = resetFighter(fighter);
  assert.equal(canAct(reset), true);
  assert.deepEqual(reset.cd.record, {});
  assert.deepEqual(reset.buff.list, []);
});

test('TargetSelector has deterministic slot, priority and seeded ordering', () => {
  const roster = [
    unit('u3', 2, 2, 30, { atk: 90 }),
    unit('u1', 2, 0, 70, { atk: 50 }),
    unit('u2', 2, 1, 20, { atk: 120 }),
    unit('dead', 2, 3, 0, { dead: true, atk: 999 })
  ];
  assert.deepEqual(selectTargets(roster, { mode: 'front', count: 2 }).map((entry) => entry.id), ['u1', 'u2']);
  assert.deepEqual(selectTargets(roster, { mode: 'back', count: 1 }).map((entry) => entry.id), ['u3']);
  assert.deepEqual(selectTargets(roster, { mode: 'lowestHp', count: 2 }).map((entry) => entry.id), ['u2', 'u3']);
  assert.deepEqual(selectTargets(roster, { mode: 'highestAtk', count: 1 }).map((entry) => entry.id), ['u2']);
  assert.deepEqual(selectTargets(roster, { mode: 'all' }).map((entry) => entry.id), ['u1', 'u2', 'u3']);
  assert.deepEqual(
    selectTargets(roster, { mode: 'random', seed: 'fixed', count: 3 }).map((entry) => entry.id),
    selectTargets(roster, { mode: 'random', seed: 'fixed', count: 3 }).map((entry) => entry.id)
  );
});

test('Cooldown module preserves ready-round and rewrite semantics', () => {
  const state = createCooldownState({ rewriteCfg: { ultimate: 1 } });
  handleSkillUsed(state, { id: 'ultimate', cd: 3, unlockRound: 0 }, 1);
  assert.equal(state.record.ultimate, 3);
  assert.equal(available(state, 'ultimate', 2), false);
  assert.equal(available(state, 'ultimate', 3), true);
  offsetCooldown(state, 1);
  assert.equal(state.record.ultimate, 2);
});
