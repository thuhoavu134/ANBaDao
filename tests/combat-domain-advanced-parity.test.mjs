import test from 'node:test';
import assert from 'node:assert/strict';
import { createCombatDomain } from '../scripts/combat-domain-3q-core.mjs';
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

test('Fighter module is parity-compatible with core normalization/reset/action gate', () => {
  const core = createCombatDomain();
  const input = { id: 'hero-7', hp: 100, statuses: [{ type: 'silence', turns: 1 }], cd: { record: { skill: 4 } } };
  assert.deepEqual(normalizeFighter(input), core.normalizeFighter(input));
  assert.deepEqual(resetFighter(input), core.resetFighter(input));
  assert.equal(canAct(normalizeFighter(input)), core.canAct(core.normalizeFighter(input)));
});

test('TargetSelector module matches core across every supported mode', () => {
  const core = createCombatDomain();
  const roster = [
    unit('u3', 2, 2, 30, { atk: 90 }),
    unit('u1', 2, 0, 70, { atk: 50 }),
    unit('u2', 2, 1, 20, { atk: 120 }),
    unit('dead', 2, 3, 0, { dead: true, atk: 999 })
  ];
  for (const mode of ['front', 'back', 'lowestHp', 'highestAtk', 'random', 'all']) {
    const options = { mode, seed: 'parity-seed', count: 3 };
    assert.deepEqual(selectTargets(roster, options), core.selectTargets(roster, options), mode);
  }
});

test('Cooldown module matches core ready-round and offset behavior', () => {
  const core = createCombatDomain();
  const coreState = core.createCooldownState({ rewriteCfg: { 7: 1 } });
  const moduleState = createCooldownState({ rewriteCfg: { 7: 1 } });
  core.handleSkillUsed(coreState, { id: 7, cd: 3, unlockRound: 0 }, 1);
  handleSkillUsed(moduleState, { id: 7, cd: 3, unlockRound: 0 }, 1);
  assert.deepEqual(moduleState, coreState);
  for (const round of [0, 1, 2, 3, 4]) assert.equal(available(moduleState, 7, round), core.available(coreState, 7, round));
  offsetCooldown(moduleState, 1);
  core.offsetCooldown(coreState, 1);
  assert.deepEqual(moduleState, coreState);
});
