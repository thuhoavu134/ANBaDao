import test from 'node:test';
import assert from 'node:assert/strict';
import {createSplusCombat} from '../src/domain/combat/splus-mechanics.mjs';
import {SPLUS_HEROES,getSplusHero} from '../src/domain/hero/splus-catalog.mjs';
import {tickMixedStatuses} from '../src/domain/combat/mixed-status-tick.mjs';
const actor={id:'ky',sourceId:'hero_splus_ky_van',team:'player',slot:4,hp:10000,maxHp:10000,atk:100,energy:100,accuracy:10000,crit:0};
const foe=i=>({id:'e'+i,team:'enemy',slot:i,hp:5000,maxHp:10000,atk:10,energy:100,statuses:[]});
function setup(proc=0){let rolls=0;const e=createSplusCombat({units:[actor,...Array.from({length:6},(_,i)=>foe(i))],rng:site=>site==='splus.ky-van-stun'?(rolls++,proc):.5});return {e,rolls:()=>rolls};}
const legacy={tickStatuses:()=>[]};
test('Kỷ Vân registered outside the fixed 42 and exposes review probability',()=>{assert.equal(SPLUS_HEROES.length,42);assert.equal(getSplusHero('ky_van')?.actions.ultimate.rules.stunChance,.3);});
test('ultimate rolls once per living enemy, blocks healing and exactly one action',()=>{const {e,rolls}=setup();assert.equal(e.act('ky','ultimate').ok,true);assert.equal(rolls(),6);for(let i=0;i<6;i++){const u=e.unit('e'+i);assert.equal(e.hasStatus(u,'stun'),true);assert.equal(e.heal(u,u,100),0);assert.equal(e.canUse(u,'basic'),false);assert.ok(tickMixedStatuses(u,legacy,e).some(x=>x.type==='control'));assert.equal(e.canUse(u,'basic'),true);assert.equal(e.heal(u,u,100),100);assert.deepEqual(tickMixedStatuses(u,legacy,e),[]);}});
test('failed proc still damages but does not prohibit healing',()=>{const {e,rolls}=setup(.99);e.act('ky','ultimate');assert.equal(rolls(),6);assert.ok(e.unit('e0').hp<5000);assert.equal(e.hasStatus('e0','stun'),false);assert.equal(e.heal('e0','e0',100),100);});
test('turn status survives round boundary until recipient turn, keeps native immunities',()=>{const {e}=setup();e.addStatus('e0','e0',{type:'controlImmune',turns:2});e.act('ky','ultimate');assert.equal(e.hasStatus('e0','antiHeal'),false);e.beginRound(2);assert.equal(e.hasStatus('e1','stun'),true);assert.ok(tickMixedStatuses(e.unit('e1'),legacy,e).some(x=>x.type==='control'));assert.equal(e.hasStatus('e1','antiHeal'),false);});
test('normal ATK does not apply the ultimate debuff',()=>{const {e,rolls}=setup();e.act('ky','basic');assert.equal(rolls(),0);assert.equal(e.hasStatus('e0','stun'),false);});
