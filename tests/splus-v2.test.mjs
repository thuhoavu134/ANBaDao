import test from 'node:test';
import assert from 'node:assert/strict';
import {createSplusCombat} from '../src/domain/combat/splus-mechanics.mjs';
const H=(key,team=1,slot=0,extra={})=>({id:`${team}:${key}`,sourceId:`hero_splus_${key}`,team,slot,hp:10000,maxHp:10000,atk:1000,def:0,speed:100,energy:100,crit:0,accuracy:100,statuses:[],...extra});
const make=(heroes,rng=()=>.99)=>{const e=createSplusCombat({units:heroes,rng});e.start();return e;};
const status=(e,id,type)=>e.unit(id).statuses.find(s=>s.type===type&&s.expiresRound>e.round);

test('V2 metal: gear cap, 3% aura, caster HP shields and expiry',()=>{
 const e=make([H('co_trong',1,4,{maxHp:20000,hp:20000}),H('ally',1,0),H('enemy',2,0,{hp:1e6,maxHp:1e6})]);
 for(let i=0;i<10;i++)e.act('1:ally','basic','2:enemy');
 assert.equal(e.modifiers('1:ally').defense,.3);assert.equal(e.unit('1:ally').shield,3000);
 e.act('1:co_trong','skill');assert.equal(e.unit('1:ally').shield,7400);
 e.beginRound(5);assert.equal(e.unit('1:ally').shield,0);
});
test('V2 Cuong: mitigation applies to ranged attacks and reflection never loops',()=>{
 const e=make([H('cuong_dong'),H('enemy',2)]);
 e.damage('2:enemy','1:cuong_dong',{raw:1000,melee:true});assert.equal(e.unit('1:cuong_dong').hp,9000);
 e.damage('2:enemy','1:cuong_dong',{raw:1000,melee:false});assert.equal(e.unit('1:cuong_dong').hp,8250);
 assert.equal(e.events.filter(x=>x.reflection).length,2);
});
test('V2 Lac An: eight focus stacks affect rate and crit damage, controlled targets guarantee crit',()=>{
 const e=make([H('lac_an'),H('enemy',2,3,{hp:1e6,maxHp:1e6})]);
 for(let i=0;i<10;i++)e.damage('1:lac_an','2:enemy',{raw:1});
 assert.equal(e.unit('1:lac_an').splus.memory.focus,8);assert.equal(e.modifiers('1:lac_an').critDamage,.48);
 e.addStatus('1:lac_an','2:enemy',{type:'stun',turns:1});e.act('1:lac_an','basic');
 assert.equal(e.events.filter(x=>x.type==='damage').at(-1).critical,true);
});
test('V2 Linh/Tieu: third basic mark drains rage; soul siphon is 15 and rage lock blocks gain',()=>{
 const e=make([H('linh_dong'),H('enemy',2)]);
 for(let i=0;i<3;i++)e.damage('1:linh_dong','2:enemy',{raw:1,action:'basic'});
 assert.equal(e.unit('2:enemy').energy,85);assert.equal(status(e,'2:enemy','healDown').power,.2);
 const f=make([H('tieu_hon',1,5,{energy:0}),H('enemy',2,3,{energy:50})]);
 f.damage('1:tieu_hon','2:enemy',{raw:1,action:'basic'});assert.equal(f.unit('1:tieu_hon').energy,15);
 f.unit('1:tieu_hon').energy=100;f.act('1:tieu_hon','skill');assert.equal(f.gainRage('2:enemy','2:enemy',30),0);
});
test('V2 Thach Kinh accumulates damage in 10% HP units, not one layer per hit',()=>{
 const e=make([H('thach_kinh'),H('enemy',2)]);
 for(let i=0;i<4;i++)e.damage('2:enemy','1:thach_kinh',{raw:100});assert.equal(e.unit('1:thach_kinh').splus.memory.resentment||0,0);
 e.damage('2:enemy','1:thach_kinh',{raw:1600});assert.equal(e.unit('1:thach_kinh').splus.memory.resentment,2);
 assert.equal(e.modifiers('1:thach_kinh').magicDefense,.12);
});
test('V2 Vong marks only highest attack and delays its skill cooldown',()=>{
 const e=make([H('vong_co'),H('carry',2,3,{atk:2000}),H('other',2,4)]);
 assert.ok(status(e,'2:carry','cooldownDelay'));assert.equal(status(e,'2:other','cooldownDelay'),undefined);
 e.act('2:other','skill','1:vong_co');e.act('2:carry','skill','1:vong_co');
 assert.equal(e.unit('2:other').splus.cooldowns.skill,3);assert.equal(e.unit('2:carry').splus.cooldowns.skill,4);
});
test('V2 Co Nuong parasite drains tankiest on hit and returns actual lost HP',()=>{
 const e=make([H('co_nuong',1,4,{hp:5000}),H('tank',2,0,{hp:20000,maxHp:20000}),H('weak',2,3)]);
 e.damage('1:co_nuong','2:weak',{raw:1});assert.ok(status(e,'2:tank','parasite'));
 e.finishRound();assert.equal(e.unit('1:co_nuong').hp,6200);assert.equal(e.unit('2:tank').hp,18800);
});
test('V2 water: same-row haste, caster HP healing, critical-only cap',()=>{
 const e=make([H('thuy_co',1,4),H('adjacent',1,3),H('front',1,1),H('enemy',2)]);
 e.act('1:thuy_co','basic');assert.equal(e.modifiers('1:adjacent').speed,.12);assert.equal(e.modifiers('1:front').speed,0);
 const f=make([H('hai_phong'),H('enemy',2)]);f.damage('2:enemy','1:hai_phong',{raw:3000});assert.equal(f.unit('1:hai_phong').hp,7000);
 f.damage('2:enemy','1:hai_phong',{raw:3000,critical:true});assert.equal(f.unit('1:hai_phong').hp,5000);
});
test('V2 Tram Chau bubble blocks crit/bleed only while shield remains and damage conversion prevents HP loss',()=>{
 const e=make([H('tram_chau'),H('ally',1,3,{hp:1000}),H('enemy',2)]);e.act('1:tram_chau','skill');assert.equal(e.unit('1:ally').shield,2500);
 e.damage('2:enemy','1:ally',{raw:2500});assert.equal(e.hud('1:ally').some(x=>x.type==='bubble'),false);
 const f=make([H('tram_chau'),H('enemy',2)]);f.act('1:tram_chau','ultimate');f.unit('1:tram_chau').energy=0;
 f.damage('2:enemy','1:tram_chau',{raw:4000,bypassShield:true});assert.equal(f.unit('1:tram_chau').hp,8000);assert.ok(f.unit('1:tram_chau').energy>0);
});
test('V2 Nung burns only melee attackers using Nung HP; Deep Wound bleeds using source ATK',()=>{
 const e=make([H('nung',1,0,{maxHp:20000,hp:20000}),H('enemy',2)]);
 e.damage('2:enemy','1:nung',{raw:10,melee:false});assert.equal(status(e,'2:enemy','burn'),undefined);
 e.damage('2:enemy','1:nung',{raw:10,melee:true});e.finishRound();assert.equal(e.unit('2:enemy').hp,9400);
 const f=make([H('hac_dao',1,0,{atk:2000}),H('enemy',2)]);f.damage('1:hac_dao','2:enemy',{raw:1});f.finishRound();assert.equal(f.unit('2:enemy').hp,9899);
});
test('V2 Hoa Bai ground zone ticks on victim turn and follows the slot after displacement',()=>{
 const e=make([H('hoa_bai'),H('enemy',2,0),H('other',2,3)]);
 e.damage('1:hoa_bai','2:enemy',{raw:1});e.beginTurn('2:enemy');assert.equal(e.unit('2:enemy').hp,9599);
 [e.unit('2:enemy').slot,e.unit('2:other').slot]=[3,0];e.beginTurn('2:other');assert.equal(e.unit('2:other').hp,9600);
});
test('V2 Mien heals at each ally turn start once when host prepares before act',()=>{
 const e=make([H('mien_nuong',1,4,{maxHp:20000,hp:20000}),H('ally',1,0,{hp:1000}),H('enemy',2)]);
 e.beginTurn('1:ally');assert.equal(e.unit('1:ally').hp,2000);e.act('1:ally','basic','2:enemy');assert.equal(e.unit('1:ally').hp,2000);
 e.beginTurn('1:mien_nuong');assert.equal(e.unit('1:ally').hp,3000);
});
test('V2 Tue Y emergency has a shared two-round cooldown and resurrects most recent death',()=>{
 const e=make([H('tue_y'),H('ally',1,1,{hp:3500}),H('enemy',2)]);
 e.damage('2:enemy','1:ally',{raw:1000});assert.equal(e.unit('1:ally').hp,5000);
 e.damage('2:enemy','1:ally',{raw:2500});assert.equal(e.unit('1:ally').hp,2500);
 e.beginRound(3);e.damage('2:enemy','1:ally',{raw:100});assert.equal(e.unit('1:ally').hp,4900);
 const f=make([H('tue_y'),H('old',1,1,{hp:0,dead:true,splus:{memory:{deathSequence:10},cooldowns:{}}}),H('recent',1,2,{hp:0,dead:true,splus:{memory:{deathSequence:20},cooldowns:{}}}),H('enemy',2)]);
 f.act('1:tue_y','ultimate');assert.equal(f.unit('1:recent').hp,5000);assert.equal(f.unit('1:old').hp,0);
});
test('V2 sleep survives DoT; Tằm Nương renews a two-hit cocoon after two rounds',()=>{
 const e=make([H('tram_tue'),H('enemy',2)]);e.addStatus('1:tram_tue','2:enemy',{type:'sleep',turns:2});e.damage('1:tram_tue','2:enemy',{raw:1,dot:true});assert.equal(e.canUse('2:enemy','basic'),false);
 e.damage('1:tram_tue','2:enemy',{raw:1});assert.equal(e.canUse('2:enemy','basic'),true);
 const f=make([H('tam_nuong'),H('enemy',2)]);for(let i=0;i<2;i++)f.damage('2:enemy','1:tam_nuong',{raw:100});f.beginRound(3);assert.equal(status(f,'1:tam_nuong','cocoon').charges,2);
});
test('V2 Mang poison spreads on each victim action, next-hit blindness consumes one charge',()=>{
 const e=make([H('mang_xa'),H('enemy',2,0),H('adjacent',2,1)]);
 for(let i=0;i<5;i++)e.damage('1:mang_xa','2:enemy',{raw:1});
 e.act('2:enemy','basic','1:mang_xa');assert.equal(status(e,'2:adjacent','viperPoison').stacks,1);
 e.act('2:enemy','basic','1:mang_xa');assert.equal(status(e,'2:adjacent','viperPoison').stacks,2);
 e.addStatus('1:mang_xa','2:enemy',{type:'blind',power:1,turns:2,charges:1});e.act('2:enemy','basic','1:mang_xa');assert.equal(e.hud('2:enemy').some(x=>x.type==='blind'),false);
});
test('V2 Kinh Nuong successful basic reflection negates damage and cannot bounce',()=>{
 const e=make([H('kinh_nuong'),H('enemy',2)],()=>0);e.damage('2:enemy','1:kinh_nuong',{raw:1000,action:'basic'});
 assert.equal(e.unit('1:kinh_nuong').hp,10000);assert.equal(e.unit('2:enemy').hp,9000);assert.equal(e.events.filter(x=>x.type==='damage').length,1);
});
test('V2 Khaos Thủy Mặc: no clone; ultimate damages every enemy and lowers magic defence',()=>{
 const e=make([H('khaos'),H('enemy',2,0,{maxHp:1e6,hp:1e6}),H('other',2,1)]);
 e.damage('2:enemy','1:khaos',{raw:1000});assert.ok(!e.events.some(x=>x.type==='cloneAbsorb'||x.type==='cloneDestroyed'));
 const before=e.unit('2:enemy').hp,other=e.unit('2:other').hp;e.act('1:khaos','ultimate');
 assert.ok(e.unit('2:enemy').hp<before);assert.ok(e.unit('2:other').hp<other);assert.ok(status(e,'2:enemy','magicArmorDown'));
});
test('V2 Hoi Anh forces an immediate friendly strike; Van ward rolls 35% after action',()=>{
 const e=make([H('hoi_anh'),H('enemy',2,0),H('friend',2,1)]);e.act('1:hoi_anh','skill');assert.ok(e.unit('2:friend').hp<10000);
 const f=make([H('van_phap'),H('ally',1,1),H('enemy',2)]);assert.equal(status(f,'1:ally','ccReflect'),undefined);f.act('1:ally','basic','2:enemy');assert.equal(status(f,'1:ally','ccReflect').chance,.35);
 f.addStatus('2:enemy','1:ally',{type:'stun',turns:1});assert.ok(status(f,'1:ally','stun'),'99% roll does not reflect');
});
test('V2 Cuu Trieu stacks on all actors, burns current HP, loses half stacks to silence',()=>{
 const e=make([H('cuu_trieu',1,4,{hp:5000}),H('ally',1,0),H('enemy',2,0,{maxHp:1e6,hp:1e6})]);
 for(let i=0;i<8;i++)e.act('1:ally','basic','2:enemy');assert.equal(e.unit('1:cuu_trieu').splus.memory.cadence,8);
 e.act('1:cuu_trieu','basic','2:enemy');assert.equal(e.unit('1:cuu_trieu').hp,4700);
 e.addStatus('2:enemy','1:cuu_trieu',{type:'silence',turns:2});assert.equal(e.unit('1:cuu_trieu').splus.memory.cadence,4);
});
test('V2 Time Freeze suppresses rage gain and passive reflection',()=>{
 const e=make([H('to_linh'),H('cuong_dong',2)]);e.act('1:to_linh','ultimate');e.unit('2:cuong_dong').energy=0;
 assert.equal(e.gainRage('2:cuong_dong','2:cuong_dong',40),0);const before=e.unit('1:to_linh').hp;e.damage('1:to_linh','2:cuong_dong',{raw:1000});assert.equal(e.unit('1:to_linh').hp,before);
});

