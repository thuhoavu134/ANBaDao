import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import vm from 'node:vm';
import {createSplusCombat} from '../src/domain/combat/splus-mechanics.mjs';
import {getSplusHero} from '../src/domain/hero/splus-catalog.mjs';
import {splusProfilePayload} from '../src/domain/hero/splus-profiles.mjs';
const an={id:'an',sourceId:'hero_splus_be_an',team:'player',slot:3,hp:10000,maxHp:10000,atk:100,def:0,energy:0,accuracy:100,crit:0};
const enemy=i=>({id:'e'+i,team:'enemy',slot:i,hp:20000,maxHp:20000,atk:20,energy:0,accuracy:100,crit:0});
const setup=()=>createSplusCombat({units:[an,...Array.from({length:6},(_,i)=>enemy(i))],rng:()=>.5});
test('canonical identity, skill alias blocked, and shared UI profile',()=>{const e=setup();assert.equal(getSplusHero('be-an').name,'Bé An');assert.equal(e.canUse('an','skill'),false);assert.equal(e.chooseAction('an'),'basic');assert.ok(splusProfilePayload().profiles.find(p=>p.id===an.sourceId).skills.ultimate);});
test('basic defers HP, resolves exactly two contacts and one mark, grants rage once',()=>{
 const e=setup(),hp=e.unit('e0').hp,c=e.act('an','basic','e0',{deferBeAn:true});assert.equal(e.unit('e0').hp,hp);
 assert.equal(e.resolveBeAnImpact('an',c.castId,'e0',0).ok,true);const after=e.unit('e0').hp;
 assert.equal(e.resolveBeAnImpact('an',c.castId,'e0',0).ok,false);assert.equal(e.unit('e0').hp,after);
 assert.equal(e.hud('e0').filter(s=>s.type==='sealPaw').length,0);
 e.resolveBeAnImpact('an',c.castId,'e0',1);assert.equal(e.hud('e0').find(s=>s.type==='sealPaw').stacks,1);
 e.finishBeAnCast('an',c.castId);assert.equal(e.unit('an').energy,15);assert.equal(e.finishBeAnCast('an',c.castId),false);
 assert.equal(e.events.filter(x=>x.type==='damage').length,2);
});
test('four natural basics earn ultimate; three AoE hits consume marks and freeze',()=>{
 const e=setup();for(let i=0;i<4;i++)e.act('an','basic','e0');assert.equal(e.chooseAction('an'),'ultimate');
 const c=e.act('an','ultimate',null,{deferBeAn:true});assert.equal(c.targetIds.length,6);
 for(let hit=0;hit<3;hit++)for(const id of c.targetIds)e.resolveBeAnImpact('an',c.castId,id,hit);
 e.finishBeAnCast('an',c.castId);
 for(const id of c.targetIds){assert.ok(e.hasStatus(id,'timeFreeze'));assert.equal(e.hasStatus(id,'sealPaw'),false);}
 assert.equal(e.events.filter(x=>x.type==='damage'&&x.action==='ultimate').length,18);
});
test('dead victim is not replaced mid-combo and invalid target cannot be damaged',()=>{
 const e=setup();e.unit('e0').hp=1;const c=e.act('an','basic','e0',{deferBeAn:true});e.resolveBeAnImpact('an',c.castId,'e0',0);
 assert.equal(e.resolveBeAnImpact('an',c.castId,'e1',1).ok,false);e.resolveBeAnImpact('an',c.castId,'e0',1);assert.equal(e.unit('e1').hp,20000);
});
test('three incoming actions trigger counter once and shield, not three hits of one cast',()=>{
 const e=setup();e.unit('e0').sourceId='hero_splus_co_nuong';
 for(let action=0;action<3;action++){
  const c=e.act('e0','basic','an',{deferCoNuong:true});
  for(let hit=0;hit<12;hit++)e.resolveCoNuongImpact('e0',c.castId,'an',hit);
  e.finishCoNuongCast('e0',c.castId);
 }
 assert.equal(e.events.filter(x=>x.type==='sealCounter').length,1);assert.ok(e.unit('an').shield>0);assert.equal(e.unit('an').splus.memory.sealSulks,0);
});
test('once-per-battle rescue cleanses, restores exactly 35%, fills rage, no extra turn',()=>{
 const e=setup();e.addStatus('e0','an',{type:'stun',turns:3});e.damage('e0','an',{raw:20000});
 assert.equal(e.unit('an').hp,3500);assert.equal(e.unit('an').energy,100);assert.equal(e.hasStatus('an','stun'),false);assert.equal(e.hasStatus('an','controlImmune'),true);
 assert.equal(e.events.some(x=>x.type==='extraTurn'),false);e.act('an','ultimate');assert.equal(e.hasStatus('an','controlImmune'),false);
 e.damage('e0','an',{raw:20000});assert.equal(e.unit('an').hp,0);assert.equal(e.events.filter(x=>x.type==='sealRescue').length,1);
});
test('seal marks expire through shared status owner',()=>{const e=setup();e.act('an','basic','e0');e.beginRound(4);assert.equal(e.hasStatus('e0','sealPaw'),false);});
test('source pages preserve all nine clips and bounded decode',()=>{
 const m=JSON.parse(readFileSync(new URL('../assets/characters/be-an/runtime-meta.json',import.meta.url)));
 for(const [key,c]of Object.entries(m.clips)){assert.equal(c.pages.reduce((a,p)=>a+p.frames,0),c.frames);if(key!=='shield'){const authoredFrames=key.startsWith('vfx-')?144:key==='idle'?30:96;assert.equal(c.frames,authoredFrames,key+' authored frame count');assert.ok(c.cellW*c.cellH*24*4<8*1024*1024);}for(const p of c.pages)assert.ok(readFileSync(new URL('../assets/characters/be-an/'+p.file,import.meta.url)).length>100);}
});
test('result owner uses paged run/fall and authored 30-frame idle',()=>{
 const s=readFileSync(new URL('../scripts/result-character-motion-v1.mjs',import.meta.url),'utf8');const f=s.slice(s.indexOf('function beAnMotion()'),s.indexOf('const manifest =')).replaceAll('import.meta.url',"'file:///repo/scripts/result-character-motion-v1.mjs'");
 const meta=readFileSync(new URL('../assets/characters/be-an/runtime-meta.json',import.meta.url),'utf8'),c={readFileSync:()=>meta,URL,JSON};vm.runInNewContext(f,c);const m=c.beAnMotion();
 for(const [key,frames,pages]of [['run',96,4],['idle',30,1],['fall',96,4]]){assert.equal(m[key].frames,frames);assert.equal(m[key].pages.length,pages);assert.ok(m[key].pages.every(p=>p.src.includes('/be-an/')));}
});
