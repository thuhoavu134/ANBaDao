import test from 'node:test';
import assert from 'node:assert/strict';
import {createSplusCombat} from '../src/domain/combat/splus-mechanics.mjs';
const H=(key,team=1,slot=0)=>({id:`${team}:${key}`,sourceId:`hero_splus_${key}`,team,slot,hp:100000,maxHp:100000,atk:1000,def:0,speed:100,energy:100,crit:0,accuracy:100});
const make=(units)=>{const e=createSplusCombat({units,rng:()=>.99});e.start();return e;};
test('action slow affects ordering speed for both authored rounds and emits current queue delay',()=>{
 const e=make([H('tram_tue'),H('enemy',2)]);e.act('1:tram_tue','ultimate');
 assert.equal(e.stat('2:enemy','speed'),60);assert.ok(e.events.some(x=>x.type==='actionDelay'&&x.fraction===.4));
 e.beginRound(2);assert.equal(e.stat('2:enemy','speed'),60);e.beginRound(3);assert.equal(e.stat('2:enemy','speed'),100);
});
test('poison detonation consumes the authored raw tick amount once',()=>{
 const run=poison=>{const e=make([H('mang_xa'),H('enemy',2)]);if(poison)e.addStatus('1:mang_xa','2:enemy',{type:'poison',power:.02,rawPerTick:75,turns:2,ticksLeft:2});e.act('1:mang_xa','ultimate');return e;};
 const a=run(false),b=run(true);assert.equal(a.unit('2:enemy').hp-b.unit('2:enemy').hp,150);assert.ok(!b.hud('2:enemy').some(x=>x.type==='poison'));
});
test('burn-to-healing consumes the zone source so it cannot return next turn',()=>{
 const e=make([H('hoa_bai'),H('hoa_duc',1,1),H('enemy',2)]);e.act('1:hoa_bai','basic');
 assert.ok(e.hud('2:enemy').some(x=>x.type==='brimstone'));e.act('1:hoa_duc','ultimate');e.beginTurn('2:enemy');assert.ok(!e.hud('2:enemy').some(x=>x.type==='brimstone'));
});
