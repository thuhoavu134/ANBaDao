import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../src/runtime/splus-battle-bridge.js',import.meta.url),'utf8');
function fixture(speed=1,sound=true){
 let now=0,skip=false;const calls=[],hits=[];
 const actor={id:'a',sourceId:'hero_splus_co_nuong',team:'player',hp:100,x:100,y:400,baseX:100,baseY:400,name:'Cổ Nương'};
 const foes=[0,1,2].map(i=>({id:'e'+i,team:'enemy',hp:100,x:500+i*50,y:400}));
 const state={battleId:1,speed,sound,mode:'battle',currentId:'a',actionCount:0,actionBreakdown:{}};
 const context={console,AbortController,setTimeout,clearTimeout,innerWidth:1280,performance:{now:()=>now},state,units:[actor,...foes],TEAM_ENEMY:'enemy',Image:class{complete=true;naturalWidth=100;decode(){return Promise.resolve();}},Audio:class{play(){calls.push({type:'raw-audio',at:now});return Promise.resolve();}},
 window:{HonVietSfx:{prepare:async()=>true,play:(key,options)=>{calls.push({type:'audio',key,options,at:now});return Promise.resolve(true);}}},
 __hvIsSkipping:()=>skip,sleepVisualMilliseconds:async ms=>{now+=ms;return state.battleId===1;},sleep:async ms=>{now+=ms/state.speed;return state.battleId===1;},
 getUnit:id=>[actor,...foes].find(u=>u.id===id),intelUnit:()=>null,addFloater(){},setUnitState(){},clearTargets(){},updateActorHud(){},setStatus(){},dom:{phaseLabel:{}},updateTeamCounters(){},addLog(){},battleHasWinner:()=>false,advanceTurn:()=>calls.push({type:'next',at:now}),
 combatPresentationProfileFor:()=> 'ranged',COMBAT_PRESENTATION_STANDARD:{profiles:{ranged:{}}},approachPoint:()=>({}),weaponFlightDuration:()=>100,TIMING:{windup:200,turnRest:100},queueChargeEffect:()=>calls.push({type:'fallback'}),queueWeaponAnticipation(){},playActionSound(){},launchWeaponEffect:async()=>{calls.push({type:'fallback'});return true;},triggerImpactPresentation:()=>calls.push({type:'fallback'})};
 context.globalThis=context;context.SPLUS42={catalog:[{id:actor.sourceId,actions:{basic:{name:'basic'},ultimate:{name:'ult'}}}]};
 vm.createContext(context);vm.runInContext(source,context);
 context.engine={hud:()=>[],act:()=>({ok:true,castId:'test-cast',targetIds:foes.map(t=>t.id)}),resolveCoNuongImpact:(a,c,id,hit)=>{hits.push(now);vm.runInContext(`splusFloater(getUnit('${id}'),10)`,context);return {ok:true};},finishCoNuongCast:()=>true};
 vm.runInContext('splusCombat=()=>engine;splusStateView=()=>{};',context);
 return {context,actor,foes,calls,hits,state,run:action=>context.performSplusAction(actor,action,foes[0]),effects:()=>vm.runInContext('coNuongImpacts',context),setSkip:()=>{skip=true;}};
}
for(const speed of [1,2,3])test(`Cổ Nương x${speed}: authored impact/recovery, shared cue, all targets, no generic VFX`,async()=>{
 const f=fixture(speed);await f.run('ultimate');
 assert.ok(Math.abs(f.hits[0]-1560/speed)<.01,`impact ${f.hits[0]}`);
 assert.ok(Math.abs(f.calls.find(x=>x.type==='next').at-4500/speed)<.01);
 const cues=f.calls.filter(x=>x.type==='audio');assert.equal(cues.length,3);assert.equal(cues[0].key,'co-nuong-ultimate');assert.ok(Math.abs(cues[0].at-1380/speed)<.01);assert.equal(cues[0].options.playbackRate,speed);
 assert.equal(f.effects().filter(x=>x.kind==='vfx-ultimate').length,18);assert.equal(f.hits.length,18);for(let i=0;i<3;i++)assert.ok(Math.abs(cues[i].at-(1380+i*900)/speed)<.01);
 assert.equal(f.calls.filter(x=>['fallback','raw-audio'].includes(x.type)).length,0);
});
test('mute and skip do not create an independent audio player',async()=>{for(const mode of ['mute','skip']){const f=fixture(1,mode!=='mute');if(mode==='skip')f.setSkip();await f.run('basic');assert.equal(f.calls.filter(x=>/audio/.test(x.type)).length,0);if(mode==='skip')assert.equal(f.effects().length,0);}});
test('cancel during readiness never settles damage or advances the next battle',async()=>{const f=fixture();f.context.window.HonVietSfx.prepare=async()=>{f.state.battleId=2;return true;};await f.run('ultimate');assert.equal(f.hits.length,0);assert.equal(f.calls.filter(x=>x.type==='next').length,0);});
test('active cast keeps its captured speed when the speed control changes',async()=>{const f=fixture(2);const sleep=f.context.sleepVisualMilliseconds;f.context.sleepVisualMilliseconds=async ms=>{f.state.speed=3;return sleep(ms);};await f.run('basic');assert.ok(Math.abs(f.hits[0]-495.5)<.01);assert.ok(Math.abs(f.calls.find(x=>x.type==='next').at-1000)<.01);});
test('exit after release aborts the shared cue and cannot hit or advance',async()=>{const f=fixture();f.context.window.HonVietSfx.play=(key,options)=>{f.calls.push({type:'audio',options});f.state.battleId=2;};await f.run('basic');assert.equal(f.hits.length,0);assert.equal(f.calls[0].options.signal.aborted,true);assert.equal(f.calls.filter(x=>x.type==='next').length,0);});
test('enemy VFX mirrors once, uses screen blend and expires on the captured clock',async()=>{const f=fixture(3);f.actor.team='enemy';for(const t of f.foes)t.team='player';await f.run('ultimate');const effects=f.effects();assert.equal(effects.length,18);assert.ok(effects.every(x=>x.mirror&&x.speed===3));let mirrored=false,blend;const ctx={save(){},restore(){},translate(){},scale(x){mirrored=x<0;},drawImage(){blend=this.globalCompositeOperation;}};f.context.coNuongAtlas(ctx,'vfx-ultimate',0,0,100,.7,true,true);assert.equal(mirrored,true);assert.equal(blend,'screen');f.context.drawCoNuongImpactOverlay(ctx,effects[effects.length-1].start+301);assert.equal(effects.length,0);});

test('real combat domain: Basic single, Skill front row, Ultimate all enemies',async()=>{
 const {createSplusCombat}=await import('../src/domain/combat/splus-mechanics.mjs');
 for(const action of ['basic','skill','ultimate']){
  const f=fixture();for(const [i,u] of [f.actor,...f.foes].entries())Object.assign(u,{sourceId:i? 'hero_splus_co_trong':u.sourceId,slot:i?i-1:0,hp:100000,maxHp:100000,atk:100,def:10,energy:100,accuracy:100,evasion:0,crit:0});
  f.foes[2].slot=3;
  const e=createSplusCombat({units:[f.actor,...f.foes],mutate:true,rng:()=>.99,onEvent:event=>f.context.splusEvent(event)});e.start();f.context.engine=e;
  await f.run(action);
  const hurt=f.foes.filter(t=>t.hp<100000);assert.equal(hurt.length,action==='basic'?1:action==='skill'?2:3);
  const impact=f.effects().filter(x=>x.kind==='vfx-'+(action==='ultimate'?'ultimate':'basic'));assert.equal(impact.length,hurt.length*(action==='ultimate'?6:1));
  assert.equal(f.state.actionCount,1);
 }
});

test('real parasite status owns smoke; shield-only hits add no mark and Ultimate consumes own marks',async()=>{
 const {createSplusCombat}=await import('../src/domain/combat/splus-mechanics.mjs');
 const f=fixture();for(const [i,u] of [f.actor,...f.foes].entries())Object.assign(u,{sourceId:i?'hero_splus_co_trong':u.sourceId,slot:i?i-1:0,hp:100000,maxHp:100000,atk:100,def:10,energy:100,accuracy:100,evasion:0,crit:0});
 const e=createSplusCombat({units:[f.actor,...f.foes],mutate:true,rng:()=>.99,onEvent:event=>f.context.splusEvent(event)});e.start();f.context.engine=e;
 f.foes[0].shield=10000;await f.run('basic');assert.equal(e.hud(f.foes[0]).filter(x=>x.type==='parasite').length,0);
 f.foes[0].shield=0;for(let i=0;i<4;i++)await f.run('basic');
 const marks=e.hud(f.foes[0]).filter(x=>x.type==='parasite');assert.equal(marks.length,1);assert.equal(marks[0].stacks,3);assert.equal(marks[0].remainingRounds,3);
 let images=0;const ctx={save(){},restore(){},translate(){},scale(){},drawImage(){images++;}};
 f.context.drawCoNuongParasites(ctx,100000);assert.equal(images,1,'clock alone cannot expire a three-round mark');
 f.actor.energy=100;await f.run('ultimate');assert.equal(e.hud(f.foes[0]).filter(x=>x.type==='parasite').length,0);images=0;f.context.drawCoNuongParasites(ctx,100001);assert.equal(images,0);
});

test('leaving after first ultimate wave cancels remaining waves and turn advance',async()=>{
 const f=fixture();const sleep=f.context.sleepVisualMilliseconds;f.context.sleepVisualMilliseconds=async ms=>{const result=await sleep(ms);if(f.calls.some(c=>c.type==='audio'))f.state.battleId=2;return result;};
 await f.run('ultimate');assert.equal(f.hits.length,0);assert.equal(f.calls.filter(c=>c.type==='audio').length,1);assert.equal(f.calls.filter(c=>c.type==='next').length,0);assert.ok(f.calls.find(c=>c.type==='audio').options.signal.aborted);
});

test('skipped ultimate resolves all contact tokens and advances once with no waves or audio',async()=>{const f=fixture();f.setSkip();await f.run('ultimate');assert.equal(f.hits.length,18);assert.equal(f.effects().length,0);assert.equal(f.calls.filter(c=>c.type==='audio').length,0);assert.equal(f.calls.filter(c=>c.type==='next').length,1);});

for(const speed of [1,2,3])test(`all twelve sword crossings have audio x${speed}`,async()=>{const f=fixture(speed);await f.run('basic');const cues=f.calls.filter(c=>c.key==='co-nuong-pierce');assert.equal(cues.length,12);const expected=Array.from({length:3},(_,blade)=>Array.from({length:4},(_,pass)=>600+.85*(blade*120+360+100+pass*200))).flat().sort((a,b)=>a-b);for(let i=0;i<12;i++)assert.ok(Math.abs(cues[i].at-expected[i]/speed)<.01);assert.equal(f.hits.length,36);});
test('each ultimate victim receives three pairs, echo delayed 300 authored ms',async()=>{const f=fixture(3);await f.run('ultimate');for(const victim of f.foes){const fx=f.effects().filter(x=>x.target===victim).sort((a,b)=>a.start-b.start);assert.equal(fx.length,6);for(let i=0;i<6;i+=2)assert.ok(Math.abs(fx[i+1].start-fx[i].start-100)<.01);}});

