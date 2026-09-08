import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

function loadOptions(actor, getUnit, state, engine) {
  const source = readFileSync(new URL('../src/runtime/splus-battle-bridge.js', import.meta.url), 'utf8');
  const context = vm.createContext({
    state,
    getUnit,
    splusCombat: () => engine,
    chooseAction: () => {},
    HEROES: [actor],
    units: [actor],
    __hvRuleRandom3qAdapter: () => 0.5,
    SPLUS42: { catalog: [{ id: 'hero_splus_test' }], create: () => engine },
  });
  vm.runInContext(`${source}\n globalThis.__options = splusSkillOptions;`, context);
  return context.__options;
}

test('battle skill options follow the replacement actor when a battle restarts with the same id', () => {
  let actor = { id: 'player:0', sourceId: 'hero_splus_test', energy: 18, splus: { cooldowns: { skill: 2, ultimate: 0 } } };
  const state = { mode: 'battle', currentId: actor.id, locked: false, auto: false };
  const engine = { round: 1, start: () => {}, canUse: () => true };
  const options = loadOptions(actor, id => id === actor.id ? actor : null, state, engine)(actor);
  actor = { id: 'player:0', sourceId: 'hero_splus_test', energy: 91, splus: { cooldowns: { skill: 0, ultimate: 0 } } };
  assert.equal(options.getState().energy, 91);
  assert.equal(options.getState().cooldowns.skill, 0);
});

test('orphaned skill options cannot cast after their actor leaves the battle', () => {
  const actor = { id:'p', sourceId:'hero_splus_test', energy:100, splus:{cooldowns:{}} };
  const state = {mode:'battle', currentId:'p', locked:false, auto:false};
  const engine = {round:1,start(){},canUse(){return true;}};
  const options = loadOptions(actor, () => null, state, engine)(actor);
  assert.equal(options.getState().canUse.skill, false);
});
