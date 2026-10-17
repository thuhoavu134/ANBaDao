import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {createSplusCombat} from '../src/domain/combat/splus-mechanics.mjs';
import {patchDinhOpening} from '../scripts/owner-refresh-20261018.mjs';
import {HERO_SKILL_KIT_REGISTRY} from '../src/domain/hero/skill-kit.mjs';
function combat(){
 const units=[{id:'a',sourceId:'hero_splus_co_nuong',team:'player',slot:3},{id:'e',sourceId:'hero_splus_co_trong',team:'enemy',slot:0}].map(u=>({...u,hp:10000,maxHp:10000,atk:100,def:10,energy:100,accuracy:100,evasion:0,crit:0}));
 const e=createSplusCombat({units,mutate:true,rng:()=>.9});e.start();return {e,a:units[0],t:units[1]};
}
test('Cổ Nương resolves each contact once, with one parasite and one rage gain per basic',()=>{
 const {e,a,t}=combat();a.energy=0;
 const cast=e.act(a.id,'basic',t.id,{deferCoNuong:true});assert.ok(cast.ok);assert.equal(t.hp,10000);
 for(let i=0;i<12;i++){
  const before=t.hp;assert.ok(e.resolveCoNuongImpact(a.id,cast.castId,t.id,i).ok);assert.ok(t.hp<before);
  const after=t.hp;assert.equal(e.resolveCoNuongImpact(a.id,cast.castId,t.id,i).ok,false);assert.equal(t.hp,after);
 }
 assert.equal(a.energy,0);assert.equal(e.hud(t).find(x=>x.type==='parasite').stacks,1);
 assert.equal(e.finishCoNuongCast(a.id,cast.castId),true);assert.equal(a.energy,15);
 assert.equal(e.finishCoNuongCast(a.id,cast.castId),false);assert.equal(a.energy,15);
});
test('Cổ Nương ultimate pays once, each of three pulses damages, dead victims cannot be hit again',()=>{
 const {e,a,t}=combat(),cast=e.act(a.id,'ultimate',t.id,{deferCoNuong:true});assert.equal(a.energy,40);
 for(let i=0;i<3;i++){const before=t.hp;e.resolveCoNuongImpact(a.id,cast.castId,t.id,i);assert.ok(t.hp<before);}
 e.finishCoNuongCast(a.id,cast.castId);assert.equal(a.energy,40);
 const next=e.act(a.id,'basic',t.id,{deferCoNuong:true});t.hp=0;const count=e.events.filter(x=>x.type==='damage').length;
 e.resolveCoNuongImpact(a.id,next.castId,t.id,0);assert.equal(e.events.filter(x=>x.type==='damage').length,count);
});
test('Đình Lôi basic targets enemy, deals damage and grants both guards in the same resolver',()=>{
 const kit=HERO_SKILL_KIT_REGISTRY.dinh_loi;assert.equal(kit.actions.basic.kind,'damage');assert.equal(kit.actions.basic.target,'single_enemy');assert.equal(kit.actions.basic.cost,0);
 let html=readFileSync(new URL('../battle.html',import.meta.url),'utf8');html=html.replace('const protectedAlly=target&&target.team===actor.team?target:Core.lowestHealth(friends)||actor;','const protectedAlly=ownerDinhProtectedAlly(actor,target,friends);');html=patchDinhOpening(html);
 const start=html.indexOf('  function resolveAction(actor, action, target) {'),end=html.indexOf('\n  function ',start+5),fn=html.slice(start,end);
 for(const team of ['player','enemy']){
  const a={id:'a',team,hp:10,maxHp:100,shield:0,statuses:[],basicMultiplier:1},ally={id:'b',team,hp:50,maxHp:100,shield:0,statuses:[]},enemy={id:'e',team:team==='player'?'enemy':'player',hp:100};
  const c={Core:{skillLevelMultiplier:()=>1,lowestHealth:xs=>xs[0]},state:{resolvedActionIds:new Set()},TEAM_PLAYER:'player',TEAM_ENEMY:'enemy',DINH_LOI_ID:'dinh_loi',actionKind:()=> 'damage',isVersionedBasic:()=>true,isDinhLoi:()=>true,living:t=>[a,ally,enemy].filter(u=>u.team===t),applyDamage:(actor,t,m)=>{t.hp-=20*m;},gainEnergy:(actor,n)=>{actor.energy=(actor.energy||0)+n;},addStatus:(u,s)=>u.statuses.push(s),addFloater(){},addLog(){}};
  vm.createContext(c);vm.runInContext(readFileSync(new URL('../src/runtime/owner-visual-review.js',import.meta.url),'utf8')+'\n'+fn,c);
  c.resolveAction(a,'basic',enemy,'hit1');assert.equal(enemy.hp,80);assert.equal(a.shield,20);assert.equal(ally.shield,20);assert.equal(a.energy,15);
  c.resolveAction(a,'basic',enemy,'hit1');assert.equal(enemy.hp,80);assert.equal(a.energy,15);
 }
});
test('Cổ Nương splits stored true poison over three audible waves, without an extra final damage tick',()=>{
 const {e,a,t}=combat();
 for(let i=0;i<3;i++)e.act(a.id,'basic',t.id);
 const parasite=t.statuses.find(s=>s.type==='parasite');
 assert.equal(parasite.stacks,3);
 assert.equal(parasite.rawPerTick,50); // min(2% max HP, 50% ATK)
 const stored=e.storedDotDamage(t.id,parasite);assert.equal(stored,450);
 const cast=e.act(a.id,'ultimate',t.id,{deferCoNuong:true});
 let poison=0;
 for(let i=0;i<3;i++){
  const before=t.hp,result=e.resolveCoNuongImpact(a.id,cast.castId,t.id,i);
  assert.ok(result.ok);assert.ok(before-t.hp>=150);
  const dot=result.events.filter(x=>x.type==='damage'&&x.dot);
  poison+=dot.reduce((n,x)=>n+x.amount,0);
 }
 assert.equal(poison,stored);
 const before=t.hp;e.finishCoNuongCast(a.id,cast.castId);assert.equal(t.hp,before);
 assert.equal(t.statuses.filter(s=>s.type==='parasite').length,0);
});
