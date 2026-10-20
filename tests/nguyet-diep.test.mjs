import test from 'node:test';
import assert from 'node:assert/strict';
import {createSplusCombat} from '../src/domain/combat/splus-mechanics.mjs';
const H=(key,team=1,slot=0,extra={})=>({id:`${team}:${key}`,sourceId:`hero_splus_${key}`,team,slot,hp:10000,maxHp:10000,atk:1000,def:200,speed:100,energy:100,crit:0,accuracy:100,statuses:[],...extra});
const make=(heroes,rng=()=>.99)=>{const e=createSplusCombat({units:heroes,rng});e.start();return e;};
const status=(e,id,type)=>e.unit(id).statuses.find(s=>s.type===type&&(s.expiresRound==null||s.expiresRound>e.round));

test('Nguyet Diep basic: two souls pierce the lane (front + back), 100% each, -15% speed -10% armor',()=>{
 const e=make([H('nguyet_diep',1,4),H('front',2,1,{maxHp:1e6,hp:1e6}),H('back',2,4,{maxHp:1e6,hp:1e6}),H('side',2,0,{maxHp:1e6,hp:1e6})]);
 e.act('1:nguyet_diep','basic','2:front');
 assert.ok(e.unit('2:front').hp<1e6,'front of the lane is hit');assert.ok(e.unit('2:back').hp<1e6,'back of the lane is hit');
 assert.equal(e.unit('2:side').hp,1e6,'other lane untouched');
 for(const id of ['2:front','2:back']){assert.equal(status(e,id,'speedDown').power,.15);assert.equal(status(e,id,'armorDown').power,.1);}
});
test('Nguyet Diep ultimate: three sword waves per target, each half the previous (sum 185%)',()=>{
 const e=make([H('nguyet_diep'),H('a',2,0,{maxHp:1e6,hp:1e6,def:0})],()=>.5);
 e.act('1:nguyet_diep','ultimate');
 const hits=e.events.filter(x=>x.type==='damage'&&x.targetId==='2:a'&&x.action==='ultimate').map(x=>x.amount);
 assert.equal(hits.length,3);assert.ok(Math.abs(hits[1]/hits[0]-.5)<.02&&Math.abs(hits[2]/hits[1]-.5)<.02,JSON.stringify(hits));
});
test('Nguyet Diep ultimate: all enemies, pierce on armor-broken, 40% silence, +100 rage to top-damage ally',()=>{
 const e=make([H('nguyet_diep',1,4),H('carry',1,0,{energy:0}),H('weak',1,1,{energy:0}),H('a',2,0,{maxHp:1e6,hp:1e6}),H('b',2,1,{maxHp:1e6,hp:1e6})],()=>.1);
 e.damage('1:carry','2:a',{raw:500});
 e.act('1:nguyet_diep','basic','2:a');
 const a0=e.unit('2:a').hp,b0=e.unit('2:b').hp;e.unit('1:nguyet_diep').energy=100;e.act('1:nguyet_diep','ultimate');
 assert.ok(e.unit('2:a').hp<a0&&e.unit('2:b').hp<b0,'every enemy hit');
 assert.ok(status(e,'2:a','silence')&&status(e,'2:b','silence'),'rng .1 < .4 silences');
 assert.ok(e.unit('1:carry').energy>=100,'top-damage ally refilled');assert.ok(e.unit('1:weak').energy<100);
 assert.equal(e.events.filter(x=>x.type==='linhKinhRage').length,1);
});
test('Nguyet Diep passive: round start cleanses 2 allies (controlled first), +15% evasion and heal 60% atk',()=>{
 const e=make([H('nguyet_diep',1,4),H('stunned',1,0,{hp:9000}),H('low',1,1,{hp:2000}),H('fine',1,2,{hp:3000}),H('enemy',2,0)]);
 for(const id of ['1:stunned','1:low','1:fine'])e.addStatus('2:enemy',id,{type:'attackDown',power:.2,turns:3});
 e.addStatus('2:enemy','1:stunned',{type:'stun',turns:3});
 e.beginRound(2);
 assert.equal(status(e,'1:stunned','stun'),undefined);assert.equal(status(e,'1:low','attackDown'),undefined);
 assert.ok(status(e,'1:fine','attackDown'),'third ally not cleansed this round');
 assert.equal(status(e,'1:low','evasionUp').power,.15);assert.ok(e.unit('1:low').hp>2000);
 assert.equal(e.events.filter(x=>x.type==='linhKinh').length,2);
 assert.ok(e.modifiers('1:nguyet_diep').resist>=.3);
});
