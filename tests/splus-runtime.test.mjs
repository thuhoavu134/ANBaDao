import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { patchSplusBattleHtml, createSplusFixture } from '../scripts/splus-runtime-v1.mjs';
import { SPLUS_HEROES } from '../src/domain/hero/splus-catalog.mjs';
import { createSplusCombat } from '../src/domain/combat/splus-mechanics.mjs';

test('Source runtime patch compiles and does not duplicate scheduler',()=>{
  const raw=readFileSync(new URL('../battle.html',import.meta.url),'utf8'),html=patchSplusBattleHtml(raw);
  for(const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(match[1]);
  assert.equal((html.match(/requestAnimationFrame\(render\)/g)||[]).length,(raw.match(/requestAnimationFrame\(render\)/g)||[]).length);
  assert.throws(()=>patchSplusBattleHtml(html),/SPLUS_ALREADY_PATCHED/);
  assert.throws(()=>patchSplusBattleHtml(raw.replace('  let units = [];','')),/SPLUS_BUILD_ANCHOR/);
});
test('Every selectable hero reaches a valid 6v6 fixture without duplicate positions',()=>{
  for(const h of SPLUS_HEROES){const f=createSplusFixture(SPLUS_HEROES,h.id);assert.equal(f.heroes.length,12);assert.ok(f.heroes.some(u=>u.team==='player'&&u.sourceId===h.id));assert.equal(new Set(f.heroes.map(u=>`${u.team}:${u.slot}`)).size,12);assert.equal(f.referenceSimple,true);}
});
test('Dream fixture reserves frontline for Thạch Mộng before support overflow',()=>{
  const f=createSplusFixture(SPLUS_HEROES,'hero_splus_cuu_trieu');
  assert.ok(f.heroes.find(u=>u.sourceId==='hero_splus_thach_mong').slot<3);
  assert.equal(f.heroes.find(u=>u.sourceId==='hero_splus_cuu_trieu').slot,4);
});
test('Bundled browser factory has the same damage/status/rage results as source',()=>{
  const html=patchSplusBattleHtml(readFileSync(new URL('../battle.html',import.meta.url),'utf8'));
  const script=html.match(/<script id="splus42-runtime-v1">([\s\S]*?)<\/script>/)[1],context=vm.createContext({});vm.runInContext(script,context);
  const fixture=createSplusFixture(SPLUS_HEROES,'hero_splus_mang_xa');
  const options={units:fixture.heroes.map(h=>({...h,maxHp:h.hp})),rng:()=>0.45};
  const a=createSplusCombat(options),b=context.SPLUS42.create(options);a.start();b.start();a.act(options.units[0].id,'skill');b.act(options.units[0].id,'skill');assert.equal(JSON.stringify(a.events),JSON.stringify(b.events));assert.equal(JSON.stringify(a.units),JSON.stringify(b.units));
});


test('mixed roster routes only S+ owned actors through S+ action resolver',()=>{
  const raw=readFileSync(new URL('../battle.html',import.meta.url),'utf8');
  const html=patchSplusBattleHtml(raw);
  assert.match(html,/if\(actor\?\.kitVersion==='splus42-v2'&&splusCombat\(\)\)\{/);
  assert.doesNotMatch(html,/async function performAction\(actor, action, target\) \{\n\s*if\(splusCombat\(\)\)\{/);
});

test('non-authored S+ actions retain generic presentation while S+ engine owns mechanics',()=>{
  const bridge=readFileSync(new URL('../src/runtime/splus-battle-bridge.js',import.meta.url),'utf8');
  const start=bridge.indexOf('async function performSplusAction');
  const end=bridge.indexOf('function drawSplusToken',start);
  assert.ok(start>=0&&end>start);
  const action=bridge.slice(start,end);
  for(const call of [
    'queueChargeEffect(actor,action)',
    'queueWeaponAnticipation(actor,action)',
    'playActionSound(actor,action)',
    'launchWeaponEffect(actor,target||actor,action,battleId)',
    'triggerImpactPresentation(actor,target,action)'
  ]) assert.ok(action.includes(call),call);
  assert.match(action,/if\(!linhAction&&!bachAction\)/);
});
