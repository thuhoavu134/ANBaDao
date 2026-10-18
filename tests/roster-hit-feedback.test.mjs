import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {createSplusCombat} from '../src/domain/combat/splus-mechanics.mjs';
import {SPLUS_HEROES,SPLUS_EXTRA_HEROES} from '../src/domain/hero/splus-catalog.mjs';

const runtime=readFileSync('src/runtime/splus-battle-bridge.js','utf8');
const fighter=(sourceId,id,team,slot)=>({id,sourceId,team,slot,x:300+slot*100,y:500,baseX:300+slot*100,baseY:500,
  hp:100000,maxHp:100000,atk:1000,def:0,speed:100,energy:100,crit:0,critDamage:1.5,accuracy:100,statuses:[]});
// Real domain events flow through the real production bridge. This is event
// coverage, not an asset/browser timing certification for unimplemented art.
for(const hero of [...SPLUS_HEROES,...SPLUS_EXTRA_HEROES]){
  for(const action of ['basic','skill','ultimate'])test(`${hero.key} ${action}: every HP-damage event has exactly one matching victim popup`,()=>{
    const units=[fighter(hero.id,'actor','player',0),...Array.from({length:5},(_,i)=>fighter('dummy','ally'+i,'player',i+1)),...Array.from({length:6},(_,i)=>fighter('dummy','foe'+i,'enemy',i))];
    const calls=[];
    const c=vm.createContext({units,addFloater:(target,text)=>calls.push({id:target.id,text}),getUnit:id=>units.find(u=>u.id===id),intelUnit:()=>null,
      state:{queue:[]},setUnitState:()=>{},markDefeated:()=>{},performance:{now:()=>100},innerWidth:1280,innerHeight:800,
      POSITIONS:{player:units.slice(0,6).map(u=>({x:u.x,y:u.y})),enemy:units.slice(6).map(u=>({x:u.x,y:u.y}))}});
    vm.runInContext(runtime,c);
    const e=createSplusCombat({units,mutate:true,rng:()=>.99,onEvent:c.splusEvent});e.start();
    calls.length=0;const start=e.events.length;
    vm.runInContext('splusPresentation=new Map()',c);
    const available=e.canUse('actor',action);
    const result=e.act('actor',action,'foe0');
    if(!available){assert.equal(result.reason,'ACTION_UNAVAILABLE');assert.equal(calls.length,0);return;}
    assert.equal(result.ok,true,JSON.stringify(result));
    const events=e.events.slice(start).filter(v=>v.type==='damage'&&!v.legacyImpact&&v.amount>0);
    const numbers=calls.filter(v=>v.text.startsWith('−')||v.text.startsWith('BẠO KÍCH'));
    assert.deepEqual(numbers,events.map(v=>({id:v.targetId,text:`${v.critical?'BẠO KÍCH ':''}−${v.amount}`})));
  });
}
