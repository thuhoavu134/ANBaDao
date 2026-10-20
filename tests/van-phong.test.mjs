import test from 'node:test';
import assert from 'node:assert/strict';
import {createSplusCombat} from '../src/domain/combat/splus-mechanics.mjs';
const H=(key,team=1,slot=0,extra={})=>({id:`${team}:${key}`,sourceId:`hero_splus_${key}`,team,slot,hp:10000,maxHp:10000,atk:1000,def:0,speed:100,energy:100,crit:0,accuracy:100,statuses:[],...extra});
const make=(heroes,rng=()=>.99)=>{const e=createSplusCombat({units:heroes,rng});e.start();return e;};
const status=(e,id,type)=>e.unit(id).statuses.find(s=>s.type===type&&(s.expiresRound==null||s.expiresRound>e.round));

test('Van Phong basic: 30% Thất Phong (speed -15%, attack -10%)',()=>{
 const miss=make([H('van_phong'),H('enemy',2,0,{maxHp:1e6,hp:1e6})],()=>.99);
 miss.act('1:van_phong','basic','2:enemy');assert.ok(miss.unit('2:enemy').hp<1e6);assert.equal(status(miss,'2:enemy','windSeal'),undefined);
 const hit=make([H('van_phong'),H('enemy',2,0,{maxHp:1e6,hp:1e6})],()=>.1);
 hit.act('1:van_phong','basic','2:enemy');
 assert.ok(status(hit,'2:enemy','windSeal'));assert.equal(status(hit,'2:enemy','speedDown').power,.15);assert.equal(status(hit,'2:enemy','attackDown').power,.1);
});
test('Van Phong ultimate: every enemy, blind 35%, silence on sealed target, domain for allies',()=>{
 const e=make([H('van_phong'),H('ally',1,1),H('enemy',2,0,{maxHp:1e6,hp:1e6}),H('other',2,1,{maxHp:1e6,hp:1e6})],()=>.1);
 e.act('1:van_phong','basic','2:enemy');assert.ok(status(e,'2:enemy','windSeal'));
 e.unit('1:van_phong').energy=100;e.act('1:van_phong','ultimate');
 assert.ok(e.unit('2:other').hp<1e6);
 assert.equal(status(e,'2:other','blind').power,.35);
 assert.ok(status(e,'2:enemy','silence'),'sealed target is silenced');
 assert.equal(status(e,'2:other','silence'),undefined,'unsealed target is not silenced');
 assert.equal(status(e,'1:ally','speedUp').power,.2);assert.equal(status(e,'1:ally','evasionUp').power,.15);
 assert.equal(e.events.filter(x=>x.type==='vanPhongDomain').length,1,'domain once per cast');
});
test('Van Phong passive: +20% evasion, +15% control resist, dodge counter 60% + 15 rage',()=>{
 const e=make([H('van_phong',1,0,{energy:0,evasion:0}),H('enemy',2,0,{maxHp:1e6,hp:1e6,accuracy:100})],()=>.85);
 assert.equal(e.stat('1:van_phong','evasion'),20);assert.ok(e.modifiers('1:van_phong').resist>=.15);
 e.damage('2:enemy','1:van_phong',{multiplier:1});
 assert.ok(e.events.some(x=>x.type==='miss'));assert.ok(e.events.some(x=>x.type==='vanPhongCounter'));
 assert.ok(e.unit('2:enemy').hp<1e6);assert.ok(e.unit('1:van_phong').energy>=15);
});
test('Van Phong guard: same-row ally crit reduced 30%, once per battle',()=>{
 const e=make([H('van_phong',1,0),H('ally',1,1),H('enemy',2,0)]);
 e.damage('2:enemy','1:ally',{raw:1000,critical:true});assert.equal(e.unit('1:ally').hp,9300);
 e.damage('2:enemy','1:ally',{raw:1000,critical:true});assert.equal(e.unit('1:ally').hp,8300);
 assert.equal(e.events.filter(x=>x.type==='vanPhongGuard').length,1);
 const far=make([H('van_phong',1,0),H('back',1,3),H('enemy',2,0)]);
 far.damage('2:enemy','1:back',{raw:1000,critical:true});assert.equal(far.unit('1:back').hp,9000,'other row is not guarded');
});
