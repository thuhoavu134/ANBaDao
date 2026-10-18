import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import{readFileSync}from'node:fs';
import{createSplusCombat}from'../src/domain/combat/splus-mechanics.mjs';import{getSplusHero}from'../src/domain/hero/splus-catalog.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8'),meta=JSON.parse(read('assets/characters/be-an/runtime-meta.json'));
function harness(speed,action,cancelAt=Infinity){
 let now=0,advanced=0;const played=[],totals=[],records={a:{damage:0}},actor={id:'a',sourceId:'hero_splus_be_an',team:'player',slot:3,hp:10000,maxHp:10000,atk:100,energy:action==='ultimate'?60:0,accuracy:100,crit:0,x:100,y:400},foes=Array.from({length:6},(_,i)=>({id:'e'+i,team:'enemy',slot:i,hp:20000,maxHp:20000,atk:10,x:700,y:350+i*25}));
 const state={battleId:1,speed,sound:true,actionCount:0,actionBreakdown:{},currentId:'a'};
 const e=createSplusCombat({units:[actor,...foes],mutate:true,rng:()=>.5,onEvent:event=>{if(event.type==='damage'&&event.sourceId==='a')records.a.damage+=event.amount;}});
 const c={BE_AN_META:meta,state,TEAM_ENEMY:'enemy',innerWidth:1000,performance:{now:()=>now},AbortController,Image:class{complete=true;naturalWidth=2112;decode(){return Promise.resolve();}},window:{HonVietSfx:{prepare:async()=>true,play:(k,o)=>{played.push([k,o.playbackRate]);}}},__hvIsSkipping:()=>false,sleepVisualMilliseconds:async ms=>{now+=ms;if(now>=cancelAt)state.battleId=2;return state.battleId===1;},getUnit:id=>e.unit(id),intelUnit:u=>records[u?.id],clearTargets(){},updateActorHud(){},setUnitState(){},setStatus(){},dom:{phaseLabel:{}},updateTeamCounters(){},splusStateView(){},addLog(){},showActionTotal:n=>totals.push(n),battleHasWinner:()=>false,advanceTurn:()=>advanced++,SPLUS42:{catalog:[getSplusHero('be_an')]}};
 vm.createContext(c);vm.runInContext(read('src/runtime/be-an.js'),c);
 return {c,e,actor,played,totals,state,run:()=>c.performBeAnAction(actor,action,e.unit('e0'),e,1),advanced:()=>advanced,now:()=>now};
}
for(const speed of [1,2,3])for(const action of ['basic','ultimate'])test(`${action} at x${speed}: exact hits, one cue, total and next turn`,async()=>{
 const h=harness(speed,action);await h.run();assert.equal(h.e.events.filter(x=>x.type==='damage').length,action==='basic'?2:18);assert.equal(h.played.length,1);assert.equal(h.played[0][1],speed);assert.equal(h.advanced(),1);assert.equal(h.state.locked,false);assert.equal(h.totals[0],h.e.events.filter(x=>x.type==='damage').reduce((s,x)=>s+x.amount,0));assert.ok(Math.abs(h.now()-(action==='basic'?4000:6650)/speed)<1);
});
test('scene change cancels remaining contacts and does not advance the new battle',async()=>{const h=harness(1,'ultimate',4100);await h.run();assert.equal(h.e.events.filter(x=>x.type==='damage').length,6);assert.equal(h.advanced(),0);assert.equal(h.totals.length,0);});
for(const team of ['player','enemy'])test('body and VFX mirror exactly once: '+team,()=>{
 const h=harness(1,'basic'),scales=[],draws=[];const ctx={save(){},restore(){},translate(){},scale:(x,y)=>scales.push([x,y]),drawImage:(...a)=>draws.push(a)};
 h.c.beAnSprite(ctx,'basic',49,100,400,1,team==='enemy');assert.equal(scales.length,1);assert.equal(scales[0][0],team==='enemy'?-1:1);assert.equal(draws.length,1);assert.ok(draws[0][1]>=0&&draws[0][2]>=0);
});

test('ultimate renders one independent giant seal for each living target',()=>{
 const h=harness(1,'ultimate'),calls=[];
 const ctx={save(){},restore(){},translate(){},scale(){},drawImage(){}};
 h.c.beAnSprite=(context,key,frame,x,y,scale,mirror)=>{calls.push({key,x,y,scale,mirror});return true;};
 const info={actor:h.actor,kind:'ultimate',battleId:1,speed:1,start:0,release:meta.timeline.ultimate.release,vfxEnd:meta.timeline.ultimate.vfxEnd,targets:Array.from({length:6},(_,i)=>'e'+i)};
 h.c.info=info;vm.runInContext('beAnActions.add(info)',h.c);
 h.c.drawBeAnVfx(ctx,meta.timeline.ultimate.hits[0]);
 const seals=calls.filter(c=>c.key==='vfx-ultimate');
 assert.equal(seals.length,6);
 assert.equal(new Set(seals.map(c=>c.y)).size,6);
 assert.ok(seals.every(c=>c.scale>0));
});
