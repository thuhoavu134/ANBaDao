import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {createSplusCombat} from '../src/domain/combat/splus-mechanics.mjs';
import {settleLegacyDamage} from '../src/domain/combat/legacy-damage-settlement.mjs';
const html=readFileSync('dist/battle.html','utf8'),start=html.indexOf('  function applyReactionDamage('),end=html.indexOf('  function resolveTeamSkillReactions(',start);
assert.ok(start>=0&&end>start);
function fixture(status,active=true){
 const actor={id:'a',sourceId:'legacy',team:'player',slot:0,hp:1000,maxHp:1000,atk:200,def:0,energy:0,statuses:[],archetype:'striker'},target={...actor,id:'t',team:'enemy',hp:100,statuses:[]};
 const records=new Map([[actor.id,{damage:0,kills:0}],[target.id,{damageTaken:0}]]),floaters=[];
 const combat=createSplusCombat({units:[actor,target],mutate:true,rng:()=>.5});combat.start();
 if(status)combat.addStatus(target,target,{type:status,power:1,turns:2,charges:1});
 const c=vm.createContext({settleLegacyDamage,splusCombat:()=>active?combat:null,intelUnit:u=>records.get(u.id),addFloater:(...args)=>floaters.push(args),burst(){},markDefeated:u=>u.dead=true,gainEnergy:(u,n)=>u.energy+=n,addLog(){},state:{actionCount:1}});
 vm.runInContext(html.slice(start,end),c);
 return{actor,target,combat,records,floaters,hit:n=>c.applyReactionDamage(actor,target,n,'test')};
}
test('team reaction respects managed immunity and lethal prevention',()=>{
 const immune=fixture('damageImmune');assert.equal(immune.hit(200),0);assert.equal(immune.target.hp,100);
 for(const status of ['immortal','deathWard']){const f=fixture(status);f.hit(200);assert.equal(f.target.hp,status==='deathWard'?201:1,status);assert.equal(f.actor.kills||0,0);}
});
test('team reaction gives one kill and one kill-rage grant',()=>{const f=fixture();assert.equal(f.hit(200),100);assert.equal(f.actor.kills,1);assert.equal(f.actor.energy,12);assert.equal(f.records.get('a').kills,1);assert.equal(f.floaters.filter(x=>String(x[1]).includes('−')).length,1);assert.equal(f.hit(200),0);});
test('reaction uses managed shields and legacy-only fallback',()=>{for(const active of [true,false]){const f=fixture(null,active);f.target.shield=40;assert.equal(f.hit(80),40);assert.equal(f.target.hp,60);assert.equal(f.target.shield,0);}});
test('defeated actors cannot produce team reaction damage',()=>{const f=fixture();f.actor.hp=0;assert.equal(f.hit(40),0);assert.equal(f.target.hp,100);});
