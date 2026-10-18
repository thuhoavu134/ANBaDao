import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFileSync} from 'node:fs';
import {createSplusCombat} from '../src/domain/combat/splus-mechanics.mjs';
const read=p=>readFileSync(p,'utf8');
for(const speed of [1,2,3])test(`Tiêu Phong deferred impacts emit once at each marker, including critical wave, x${speed}`,async()=>{
  let now=0;const popups=[];
  const actor={id:'a',sourceId:'hero_splus_tieu_phong',team:'player',slot:0,hp:10000,maxHp:10000,atk:100,energy:100,accuracy:100,crit:0,statuses:[]};
  const foes=[0,3].map(slot=>({id:'e'+slot,team:'enemy',slot,hp:10000,maxHp:10000,atk:1,energy:0,def:0,statuses:[]}));
  const units=[actor,...foes];
  const c=vm.createContext({state:{battleId:1,queue:[]},performance:{now:()=>now},getUnit:id=>units.find(u=>u.id===id),intelUnit:()=>null,
    updateTeamCounters(){},splusStateView(){},addFloater:(u,text)=>popups.push({id:u.id,text,at:now})});
  vm.runInContext(read('src/runtime/splus-battle-bridge.js'),c);
  vm.runInContext(read('src/runtime/tieu-phong.js'),c);
  // Production bridge state stays active for the whole async cast: this is the
  // original failure condition (re-queue into the same Map, then clear it).
  vm.runInContext('splusPresentation=new Map()',c);
  c.updateTeamCounters=()=>{};c.splusStateView=()=>{};
  c.waitTieuPhongMarker=async(info,at)=>{now=at/speed;return true;};
  const e=createSplusCombat({units,mutate:true,rng:()=>0,onEvent:c.splusEvent});e.start();
  const impacts=Array.from({length:3},(_,wave)=>foes.map((u,i)=>({wave,targetId:u.id,at:500+wave*600+i*50}))).flat();
  assert.equal((await c.resolveTieuPhongCast(e,{impacts},actor,'ultimate',foes[0],1)).ok,true);
  assert.equal(popups.length,impacts.length);
  popups.forEach((p,i)=>{assert.equal(p.id,impacts[i].targetId);assert.equal(p.at,impacts[i].at/speed);assert.match(p.text,impacts[i].wave===2?/^BẠO KÍCH −\d+$/ : /^−\d+$/);});
});
