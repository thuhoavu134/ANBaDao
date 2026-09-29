import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import Core from '../src/domain/combat/hon-viet-core.mjs';
import { createSplusMechanics } from '../src/domain/combat/splus-mechanics.mjs';

const html = readFileSync('dist/battle.html','utf8');
const unit = (team, slot, hp=100) => ({id:`${team}-${slot}`,team,slot,hp,maxHp:100,atk:1,def:0,energy:0,speed:1000-slot*17,archetype:'striker',statuses:[]});
function expected(actor, enemies) {
  const front=enemies.filter(e=>e.hp>0&&e.slot<3), back=enemies.filter(e=>e.hp>0&&e.slot>=3);
  const row=(front.length?front:back).sort((a,b)=>a.slot-b.slot);
  return row.find(e=>e.slot%3===actor.slot%3)||row[0]||null;
}
function extract(name) {
  const start=html.indexOf('function '+name+'(');assert.ok(start>=0,name);let end=start;
  while((end=html.indexOf('}',end+1))>=0){const s=html.slice(start,end+1);try{new vm.Script('('+s+')');return s;}catch{}}
  throw Error(name);
}
test('mixed S+ battle queue follows vertical slots 1..6 rather than speed',()=>{
  const start=html.indexOf('const LegacyCore=globalThis.HonVietCore;'),end=html.indexOf('\n  };',start)+5;
  const fast={stat:u=>u.speed};
  const live=vm.runInNewContext(html.slice(start,end)+';Core',{HonVietCore:Core,splusCombat:()=>fast});
  const units=[];for(let slot=0;slot<6;slot++)for(const team of ['enemy','player'])units.unshift(unit(team,slot));
  units.find(u=>u.id==='player-5').speed=9999;
  assert.deepEqual(Array.from(live.buildTurnOrder(units)),Array.from({length:6},(_,s)=>[`player-${s}`,`enemy-${s}`]).flat());
  units.find(u=>u.id==='player-1').hp=0;
  assert.deepEqual(Array.from(live.buildTurnOrder(units)).filter(id=>id.startsWith('player')),['player-0','player-2','player-3','player-4','player-5']);
});
test('core and S+ default targets obey facing row and lowest surviving slot for every casualty pattern',()=>{
  for(const team of ['player','enemy'])for(let slot=0;slot<6;slot++)for(let mask=0;mask<64;mask++){
    const actor=unit(team,slot),other=team==='player'?'enemy':'player';
    const enemies=Array.from({length:6},(_,s)=>unit(other,s,mask&(1<<s)?100:0)).reverse();
    const want=expected(actor,enemies)?.id||null;
    for(const role of ['striker','ranger','mystic','healer'])assert.equal(Core.preferredOppositeTarget({...actor,archetype:role},enemies)?.id||null,want,`${team}/${slot}/${mask}/${role}`);
    const engine=createSplusMechanics({units:[actor,...enemies],rng:()=>.99});
    assert.equal(engine.targets(actor.id,'basic')[0]?.id||null,want,`S+ ${team}/${slot}/${mask}`);
  }
});
test('generated legacy routing in a mixed battle preserves heals and uses facing slot for damage',()=>{
  const actor={...unit('player',1),skillKind:'heal',ultimateKind:'aoe'},enemies=[unit('enemy',5),unit('enemy',3)],ally={...unit('player',4),hp:10};
  const box=vm.createContext({Core,TEAM_PLAYER:'player',TEAM_ENEMY:'enemy',REFERENCE_SIMPLE:true,state:{bossPhase:null,enemyFormation:null},
    splusCombat:()=>({targets:()=>[enemies[0]]}),splusOwnsActor:()=>false,
    living:team=>team==='player'?[actor,ally]:enemies,enemiesOf:()=>enemies});
  for(const name of ['actionKind','actionIgnoresFormation','legalTargetsFor','preferredTargetFor'])vm.runInContext(extract(name),box);
  assert.equal(box.preferredTargetFor(actor,'basic').id,'enemy-3','slot 2 chooses slot 4 when slot 5 is absent');
  assert.equal(box.preferredTargetFor(actor,'skill').id,ally.id,'legacy healer must not delegate to S+ enemy targets');
});

test('S+ action damage rejects stale/back-row basic targets and follows the same slot shown by targeting',()=>{
  const actor=unit('player',1),enemies=[unit('enemy',5),unit('enemy',3),unit('enemy',0)];
  actor.atk=40;
  const engine=createSplusMechanics({units:[actor,...enemies],rng:()=>.5,mutate:true});
  assert.equal(engine.targets(actor,'basic')[0].id,'enemy-0');
  assert.equal(engine.act(actor,'basic','enemy-5').ok,true);
  assert.ok(enemies[2].hp<100,'living front receives damage');
  assert.equal(enemies[0].hp,100);
  enemies[2].hp=0;
  assert.equal(engine.targets(actor,'basic')[0].id,'enemy-3');
  assert.equal(engine.act(actor,'basic','enemy-0').ok,true);
  assert.ok(enemies[1].hp<100,'missing opposite back slot falls to slot 4, before slot 6');
});
