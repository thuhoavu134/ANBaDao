import test from 'node:test';
import assert from 'node:assert/strict';
import {createSplusCombat} from '../src/domain/combat/splus-mechanics.mjs';
const H=(key,team=1,slot=0,extra={})=>({id:`${team}:${key}`,sourceId:`hero_splus_${key}`,team,slot,hp:10000,maxHp:10000,atk:1000,def:200,speed:100,energy:100,crit:0,accuracy:100,statuses:[],...extra});
const make=(heroes,rng=()=>.5)=>{const e=createSplusCombat({units:heroes,rng});e.start();return e;};
const status=(e,id,type)=>e.unit(id).statuses.find(s=>s.type===type&&(s.expiresRound==null||s.expiresRound>e.round));
const hits=(e,src,tgt,action)=>e.events.filter(x=>x.type==='damage'&&x.sourceId===src&&x.targetId===tgt&&(!action||x.action===action));

test('Tinh Mac basic: one target, Hon Xieu Phach Lac (healDown 20% + soulRend 15%) for 2 rounds',()=>{
  const e=make([H('tinh_mac',1,0),H('a',2,0,{maxHp:1e6,hp:1e6}),H('b',2,1,{maxHp:1e6,hp:1e6})]);
  e.act('1:tinh_mac','basic','2:a');
  assert.equal(hits(e,'1:tinh_mac','2:a','basic').length,1);
  assert.equal(e.unit('2:b').hp,1e6,'single target');
  assert.equal(status(e,'2:a','healDown').power,.2);
  assert.equal(status(e,'2:a','soulRend').power,.15);
});

test('Tinh Mac basic: soulRend makes the victim take +15% from his side only',()=>{
  const base=make([H('tinh_mac',1,0),H('ally',1,1),H('a',2,0,{maxHp:1e6,hp:1e6})]);
  base.damage('1:ally','2:a',{multiplier:1,type:'elemental',forceHit:true});
  const plain=hits(base,'1:ally','2:a').at(-1).amount;
  const e=make([H('tinh_mac',1,0),H('ally',1,1),H('a',2,0,{maxHp:1e6,hp:1e6})]);
  e.act('1:tinh_mac','basic','2:a');
  e.damage('1:ally','2:a',{multiplier:1,type:'elemental',forceHit:true});
  const rent=hits(e,'1:ally','2:a').at(-1).amount;
  assert.ok(Math.abs(rent/plain-1.15)<.01,`${rent}/${plain}`);
});

test('Tinh Mac Tam Nhan: immune to blind and ignores 50% of enemy evasion',()=>{
  const e=make([H('tinh_mac',1,0),H('a',2,0,{evasion:60})]);
  assert.equal(e.addStatus('2:a','1:tinh_mac',{type:'blind',power:1,turns:2}),null);
  assert.equal(status(e,'1:tinh_mac','blind'),undefined);
  assert.ok(e.events.some(x=>x.type==='immune'&&x.targetId==='1:tinh_mac'));
  // accuracy 100 - evasion 60*0.5 = 70%: rng .65 hits for him, would miss for a normal hero.
  const hit=make([H('tinh_mac',1,0),H('a',2,0,{evasion:60,maxHp:1e6,hp:1e6})],()=>.65);
  hit.act('1:tinh_mac','basic','2:a');assert.ok(hit.unit('2:a').hp<1e6,'evasion halved');
  const miss=make([H('other',1,0),H('a',2,0,{evasion:60,maxHp:1e6,hp:1e6})],()=>.65);
  miss.damage('1:other','2:a',{multiplier:1});assert.equal(miss.unit('2:a').hp,1e6,'control: normal hero misses');
});

test('Tinh Mac U Hon: +1 when an enemy first drops to 70%, +1 on death, capped at 5; allies do not count',()=>{
  const e=make([H('tinh_mac',1,0),H('ally',1,1),H('a',2,0),H('b',2,1)]);
  e.damage('2:a','1:ally',{raw:4000});
  assert.equal(e.unit('1:tinh_mac').splus.memory.uHon??0,0,'ally loss ignored');
  e.damage('1:ally','2:a',{raw:3500});assert.equal(e.unit('1:tinh_mac').splus.memory.uHon,1);
  e.damage('1:ally','2:a',{raw:1000});assert.equal(e.unit('1:tinh_mac').splus.memory.uHon,1,'threshold counted once');
  e.damage('1:ally','2:a',{raw:1e5});assert.equal(e.unit('1:tinh_mac').splus.memory.uHon,2,'death adds one');
  e.unit('1:tinh_mac').splus.memory.uHon=5;e.damage('1:ally','2:b',{raw:1e5});
  assert.equal(e.unit('1:tinh_mac').splus.memory.uHon,5,'capped');
  const m=e.modifiers('1:tinh_mac');assert.ok(Math.abs(m.lifesteal-.25)<1e-9);
});

test('Tinh Mac ultimate: hits every enemy, consumes U Hon into true damage that ignores shields',()=>{
  const e=make([H('tinh_mac',1,0),H('a',2,0,{maxHp:1e6,hp:1e6}),H('b',2,1,{maxHp:1e6,hp:1e6,shield:1e5})]);
  e.unit('1:tinh_mac').splus.memory.uHon=3;
  e.act('1:tinh_mac','ultimate');
  for(const id of ['2:a','2:b'])assert.ok(hits(e,'1:tinh_mac',id,'ultimate').some(x=>x.damageType==='true'),id+' took true damage');
  assert.equal(e.unit('1:tinh_mac').splus.memory.uHon,0);
  assert.equal(e.events.filter(x=>x.type==='uHonConsume').length,1);
});

test('Tinh Mac ultimate: Tram Quyet executes under 20% (30% at 5 stacks) and refunds 50 rage once',()=>{
  const e=make([H('tinh_mac',1,0),H('low',2,0,{maxHp:1e6,hp:2.6e5,def:1e6}),H('mid',2,1,{maxHp:1e6,hp:2.6e5,def:1e6})]);
  e.unit('1:tinh_mac').splus.memory.uHon=0;
  e.act('1:tinh_mac','ultimate');
  assert.ok(e.unit('2:low').hp>0,'25% hp survives at 0 stacks (20% threshold)');
  const f=make([H('tinh_mac',1,0),H('low',2,0,{maxHp:1e6,hp:2.6e5,def:1e6}),H('mid',2,1,{maxHp:1e6,hp:2.6e5,def:1e6})]);
  f.unit('1:tinh_mac').splus.memory.uHon=5;
  f.act('1:tinh_mac','ultimate');
  assert.ok(f.unit('2:low').dead&&f.unit('2:mid').dead,'both executed at 5 stacks (30% threshold)');
  assert.equal(f.events.filter(x=>x.type==='tramQuyet').length,2);
  assert.equal(f.events.filter(x=>x.type==='energy'&&x.reason==='tramQuyet').length,1,'rage refund once per cast');
});

test('Tinh Mac has no rage skill and targets never contain holes',()=>{
  const e=make([H('tinh_mac',1,0),H('a',2,0),H('b',2,3)]);
  assert.equal(e.canUse('1:tinh_mac','skill'),false);
  for(const action of ['basic','ultimate']){const t=e.targets('1:tinh_mac',action);assert.ok(t===null||t.every(Boolean),action);}
});
