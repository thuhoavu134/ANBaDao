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


test('S+ mechanics failure fails open instead of aborting battle bootstrap', () => {
  const source = readFileSync(new URL('../src/runtime/splus-battle-bridge.js', import.meta.url), 'utf8');
  const actor = { id:'p', sourceId:'hero_splus_test', hp:100, maxHp:100, energy:35, statuses:[] };
  const warnings = [];
  const context = vm.createContext({
    HEROES:[actor], units:[actor],
    __hvRuleRandom3qAdapter:()=>0.5,
    console:{ warn:(...args)=>warnings.push(args) },
    SPLUS42:{
      catalog:[{id:'hero_splus_test'}],
      create(){ throw new Error('synthetic S+ bootstrap failure'); }
    }
  });
  vm.runInContext(`${source}\nglobalThis.__combat = splusCombat;`, context);
  assert.doesNotThrow(() => assert.equal(context.__combat(), null));
  assert.equal(context.__combat(), null, 'failed S+ owner must stay disabled for the current battle');
  assert.equal(warnings.length, 1, 'failure should be reported once without killing battle boot');
});

test('missing optional S+ action-zone UI cannot block battle bootstrap', () => {
  const source = readFileSync(new URL('../src/runtime/splus-battle-bridge.js', import.meta.url), 'utf8');
  const context = vm.createContext({
    state:{currentId:null},
    getUnit:()=>null,
    document:{
      querySelector:()=>null,
      getElementById:()=>null,
      createElement(){ throw new Error('optional HUD should not allocate without a host'); }
    },
    SPLUS42:{profiles:{}},
    createSplusSkillUI(){ throw new Error('optional UI factory should not run without a host'); }
  });
  vm.runInContext(`${source}\nglobalThis.__skillBar = splusSkillBar;`, context);
  assert.doesNotThrow(() => context.__skillBar());
});


test('S+ displacement reuses the current crop-aware formation owner after P0 recovery', () => {
  const source = readFileSync(new URL('../src/runtime/splus-battle-bridge.js', import.meta.url), 'utf8');
  const block = source.slice(source.indexOf("if(event.type==='displacement'||event.type==='swap')"), source.indexOf('function splusStateView'));
  assert.match(block, /typeof battleFormationForViewport==='function'/);
  assert.match(block, /battleFormationForViewport\(rect\.width,rect\.height\)/);
  assert.match(block, /typeof mobileFormationForViewport==='function'/, 'legacy formation remains fallback-only for older builds');
  assert.doesNotMatch(block, /innerWidth<600\?MOBILE_POSITIONS:POSITIONS/, 'stale direct MOBILE_POSITIONS owner must not return');
});
