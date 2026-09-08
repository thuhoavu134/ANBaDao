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
test('Bundled browser factory has the same damage/status/rage results as source',()=>{
  const html=patchSplusBattleHtml(readFileSync(new URL('../battle.html',import.meta.url),'utf8'));
  const script=html.match(/<script id="splus42-runtime-v1">([\s\S]*?)<\/script>/)[1],context=vm.createContext({});vm.runInContext(script,context);
  const fixture=createSplusFixture(SPLUS_HEROES,'hero_splus_mang_xa');
  const options={units:fixture.heroes.map(h=>({...h,maxHp:h.hp})),rng:()=>0.45};
  const a=createSplusCombat(options),b=context.SPLUS42.create(options);a.start();b.start();a.act(options.units[0].id,'skill');b.act(options.units[0].id,'skill');assert.equal(JSON.stringify(a.events),JSON.stringify(b.events));assert.equal(JSON.stringify(a.units),JSON.stringify(b.units));
});
