import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {extractCatalogFromRuntimeSource} from '../src/domain/catalog/extract-catalog.mjs';
const source=readFileSync(new URL('../src/ui/campaign-scene.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const data=extractCatalogFromRuntimeSource(html);
function context(encounter=data.encounters.ch01_fight_street_mobs){
 const c=vm.createContext({window:{matchMedia:()=>({matches:true})},DATA:{heroes:data.heroes,encounters:{stage:encounter}},formationSlotPos:()=>({x:0,y:0}),heroPower:()=>{throw Error('player stats forbidden');}});
 for(const [a,b] of [['function inferArchetype(', 'function makeCombatant('],['function assignFormationSlots(','function assignAllySlots(']]) vm.runInContext(html.slice(html.indexOf(a),html.indexOf(b)),c);
 vm.runInContext(source.slice(0,source.indexOf('const escapeScene')),c);
 vm.runInContext('sceneState.checkpoint={battleId:"stage"}',c);return c;
}
test('EP-1 enemy power is 2966 from encounter, independent of player upgrades',()=>{
 const c=context();assert.equal(vm.runInContext('preparationEnemyPower()',c),2966);
});
test('EP-1 preview copies rows and uses combat formation slots',()=>{
 const input=[{id:'one',stats:{hp:8,atk:1,def:1,spd:1}}];const c=context(input);
 const enemies=vm.runInContext('preparationEnemies()',c);assert.equal(enemies[0].row,'front');assert.equal(enemies[0].slot,0);assert.equal(input[0].row,undefined);
});
test('EP-1 dynamic factory is not invoked or reported as zero strength',()=>{
 const c=context(()=>{throw Error('side effect');});assert.equal(vm.runInContext('preparationEnemyPower()',c),null);assert.equal(vm.runInContext('preparationEnemies().length',c),0);
});
test('EP-2 generic enemy selects enemy pose row then team atlas by slot',()=>{
 const c=context();const art=vm.runInContext('preparationEnemies().map((p,i,all)=>preparationEnemyArt(p,all))',c);
 assert.equal(art[0].src,'assets/battle-runtime/embedded-08.webp');assert.equal(art[0].row,1);assert.equal(art[0].cols,4);
 assert.equal(art[1].src,'assets/battle-runtime/embedded-04.webp');assert.equal(art[1].column,1);assert.equal(art[3].column,0);assert.equal(art[3].row,1);
});
