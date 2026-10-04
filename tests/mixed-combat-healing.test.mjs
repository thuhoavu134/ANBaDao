import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFileSync} from 'node:fs';
import Core from '../src/domain/combat/hon-viet-core.mjs';import {createSplusCombat} from '../src/domain/combat/splus-mechanics.mjs';
const html=readFileSync('dist/battle.html','utf8');const a=html.indexOf('  function __hvApplyHeal3qAdapter('),b=html.indexOf('\n  function applyHeroControllerDrain(',a);assert.ok(a>=0&&b>a);
function scenario({active=true,hp=100,status='antiHeal',power=1}={}){
 const actor={id:'legacy',sourceId:'legacy',team:'player',slot:3,atk:180,hp:2000,maxHp:2000,statuses:[],energy:35};
 const target={id:'splus',sourceId:'hero_splus_linh_dong',team:'player',slot:0,atk:180,hp,maxHp:2000,statuses:[],energy:35};
 const enemy={id:'enemy',sourceId:'hero_splus_bach_dien',team:'enemy',slot:0,atk:180,hp:2000,maxHp:2000,statuses:[],energy:35};
 const engine=createSplusCombat({units:[actor,target,enemy],mutate:true,rng:()=>.5});engine.start();if(status)engine.addStatus(enemy,target,{type:status,power,turns:2});
 const c=vm.createContext({Core,splusCombat:()=>active?engine:null,TEAM_PLAYER:'player',state:{enemyAdaptive:{observation:{healing:0}},sound:false},intelUnit:()=>null,addFloater(){},burst(){},COMBAT_PRESENTATION_STANDARD:{colors:{heal:'#fff'}}});vm.runInContext(html.slice(a,b),c);return{actor,target,enemy,engine,heal:()=>c.__hvApplyHeal3qAdapter(actor,target,1)};
}
test('legacy healer respects S+ anti-heal on either side of a mixed battle',()=>{
 for(const team of ['player','enemy']){const h=scenario();h.actor.team=team;h.target.team=team;assert.equal(h.heal(),0);assert.equal(h.target.hp,100);}
});
test('S+ healing reduction applies once, before missing-HP cap',()=>{
 const normal=scenario({status:null}),raw=normal.heal();const reduced=scenario({status:'healDown',power:.5});assert.equal(reduced.heal(),Math.round(raw*.5));
 const nearFull=scenario({hp:1980,status:'healDown',power:.5});assert.equal(nearFull.heal(),20);assert.equal(nearFull.target.hp,2000);
});
test('dead targets are not healed; legacy-only healing retains existing calculation',()=>{
 const dead=scenario({hp:0,status:null});assert.equal(dead.heal(),0);
 const old=scenario({active:false,status:null});const want=Core.calculateHeal(old.actor,old.target,1);assert.equal(old.heal(),want);
});
test('mixed healing emits one canonical event and resumes after anti-heal expires',()=>{
 const h=scenario();const before=h.engine.events.filter(e=>e.type==='heal').length;assert.equal(h.heal(),0);const emitted=h.engine.events.filter(e=>e.type==='heal').slice(before);assert.equal(emitted.length,1);assert.equal(emitted[0].blocked,340);
 h.engine.beginRound(3);assert.equal(h.heal(),340);assert.equal(h.target.hp,440);
});
