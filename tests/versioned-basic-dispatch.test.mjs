import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const html=readFileSync('dist/battle.html','utf8');
function extract(name){
 const start=html.indexOf('function '+name+'(');assert.ok(start>=0,name);
 for(let end=start;(end=html.indexOf('}',end+1))>=0;){const s=html.slice(start,end+1);try{new vm.Script('('+s+')');return s;}catch{}}
 throw Error(name);
}
function harness(){
 const target={id:'enemy',team:'enemy',hp:1000,statuses:[]},hits=[];
 const box=vm.createContext({target,hits,TEAM_PLAYER:'player',TEAM_ENEMY:'enemy',
  Core:{skillLevelMultiplier:()=>1,hpRatio:u=>u.hp/1000},
  living:()=>[target],actionKind:()=> 'damage',isLinhDong:()=>false,isLucAnh:()=>false,isDinhLoi:()=>false,isThayMoAuthored:()=>false,
  nemViStacks:()=>0,ongPhoCritReady:()=>false,ongPhoChainTarget:()=>target,
  ongPhoFollowUp:(actor,t,m)=>{hits.push(m);t.hp-=100*m;return 100*m;},
  applyDamage:(actor,t,m)=>{hits.push(m);t.hp-=100*m;return 100*m;},
  gainEnergy:(u,n)=>{u.energy+=n;},addLog:()=>{},applyNemVi:()=>1
 });
 for(const name of ['isVersionedSkillKit','isVersionedBasic','isVersionedLucAnh','isOngPhoCarry','__hvResolveAction3qAdapter'])vm.runInContext(extract(name),box);
 return {box,target,hits};
}
test('versioned Ong Pho Basic resolves authored first contact, schedules second, and grants rage',()=>{
 const {box,target,hits}=harness(),actor={id:'actor',sourceId:'ong_hang_pho',kitVersion:'samkok-v2.1',hp:1000,energy:35,basicMultiplier:1.4};
 box.__hvResolveAction3qAdapter(actor,'basic',target);
 assert.equal(hits.length,1);assert.equal(hits[0],1.4*.62);
 assert.ok(target.hp<1000);assert.equal(actor.energy,50);
 assert.equal(actor._ongPhoSkill1SecondHitPlan.targetId,target.id);
 assert.equal(actor._ongPhoSkill1SecondHitPlan.multiplier,1.4*.50);
});
test('other versioned Basic uses its configured multiplier; legacy Basic remains 1',()=>{
 for(const [kitVersion,multiplier] of [['samkok-v2.1',1.7],['legacy-v1',1]]){
  const {box,target,hits}=harness(),actor={id:'actor',sourceId:'archer',kitVersion,hp:1000,energy:35,basicMultiplier:1.7};
  box.__hvResolveAction3qAdapter(actor,'basic',target);
  assert.equal(hits[0],multiplier);assert.equal(actor.energy,50);
 }
});
