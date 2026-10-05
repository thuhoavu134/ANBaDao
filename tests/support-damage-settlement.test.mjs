import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import{readFileSync}from'node:fs';
import{createSplusCombat}from'../src/domain/combat/splus-mechanics.mjs';import{settleLegacyDamage}from'../src/domain/combat/legacy-damage-settlement.mjs';
const html=readFileSync('dist/battle.html','utf8'),start=html.indexOf('  function useSupportCall('),end=html.indexOf('\n',start);assert.ok(start>=0);
function fixture({status,shield=0,hp=200,active=true}={}){
 const ally={id:'p',team:'player',slot:0,hp:1000,maxHp:1000,energy:0,statuses:[]},target={id:'e',sourceId:'legacy',team:'enemy',slot:0,hp,maxHp:1000,energy:0,shield,statuses:[]};
 const hero={id:'reserve',sourceId:'reserve',name:'Reserve',atk:200,archetype:'striker'},original=JSON.stringify(hero),units=[ally,target],floaters=[],deaths=[];
 const combat=createSplusCombat({units,mutate:true,rng:()=>.5});combat.start();if(status)combat.addStatus(target,target,{type:status,power:1,turns:2,charges:1});
 const c=vm.createContext({state:{mode:'battle',locked:false,round:1,actionCount:0,supportCall:{used:false,uses:0,history:[]}},selectedSupportHero:()=>hero,Core:{heroTacticalRoleFor:()=> 'vanguard',hpRatio:u=>u.hp/u.maxHp},TEAM_PLAYER:'player',TEAM_ENEMY:'enemy',living:t=>units.filter(u=>u.team===t&&u.hp>0),settleLegacyDamage,splusCombat:()=>active?combat:null,addFloater:(...a)=>floaters.push(a),markDefeated:u=>deaths.push(u.id),intelUnit:()=>null,addLog(){},updateTeamCounters(){},renderSupportCall(){},renderBattleObjective(){},checkBattleEnd(){}});
 vm.runInContext(html.slice(start,end),c);return{c,ally,target,hero,original,floaters,deaths,combat,call:()=>c.useSupportCall()};
}
test('reserve strike respects managed immunity, shield and lethal prevention',()=>{
 const immune=fixture({status:'damageImmune'});assert.equal(immune.call(),true);assert.equal(immune.target.hp,200);
 const shield=fixture({shield:100});shield.call();assert.equal(shield.target.hp,170);assert.equal(shield.target.shield,0);
 for(const status of ['immortal','deathWard']){const f=fixture({status,hp:50});f.call();assert.ok(f.target.hp>0,status);assert.equal(f.deaths.length,0);}
});
test('support is consumed once without spending a turn or mutating roster data',()=>{const f=fixture();assert.equal(f.call(),true);const hp=f.target.hp;assert.equal(f.call(),false);assert.equal(f.target.hp,hp);assert.equal(f.c.state.supportCall.uses,1);assert.equal(f.c.state.actionCount,0);assert.equal(JSON.stringify(f.hero),f.original);});
test('legacy-only reserve strike still uses shields and records actual HP loss',()=>{const f=fixture({active:false,shield:100});f.call();assert.equal(f.target.hp,170);assert.match(f.c.state.supportCall.history[0].effect,/30 sát thương/);});
test('support damage does not recursively trigger reflection or bonus hit passives',()=>{const f=fixture({status:'reflectAll'});f.call();assert.equal(f.target.hp,70);assert.equal(f.combat.events.filter(e=>e.type==='damage').length,1);});
test('reserve strike consumes cocoon and lethal damage is presented once',()=>{const blocked=fixture({status:'cocoon'});blocked.call();assert.equal(blocked.target.hp,200);assert.equal(blocked.combat.hud(blocked.target).some(s=>s.type==='cocoon'),false);const lethal=fixture({hp:50});lethal.call();assert.equal(lethal.target.hp,0);assert.deepEqual(lethal.deaths,['e']);assert.equal(lethal.combat.events.filter(e=>e.type==='death').length,1);assert.equal(lethal.floaters.filter(x=>String(x[1]).includes('VIỆN KÍCH')).length,1);});

test('exploding shield never targets or kills a phantom reserve body',()=>{const f=fixture();f.combat.shield(f.target,f.target,100,{explodes:true,explosionPower:.5});assert.doesNotThrow(()=>f.call());assert.equal(f.target.hp,170);assert.equal(f.combat.events.some(e=>e.type==='death'&&String(e.targetId).startsWith('__support_')),false);assert.equal(f.target.kills||0,0);assert.equal(f.target.energy,0);assert.equal(f.combat.units.length,2);});
