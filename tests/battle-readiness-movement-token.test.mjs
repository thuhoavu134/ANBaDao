import test from 'node:test';
import assert from 'node:assert/strict';
import { createSkillCastMovement } from '../src/combat-domain/skill-cast-movement.mjs';
function setup(){
  const actor={id:'a',team:1,hp:100,x:300,y:300,baseX:300,baseY:300,_hvAssetLease:{taskId:4}},target={id:'b',team:2,hp:100,x:1300,y:300,baseX:1300,baseY:300};
  const state={battleId:2,mode:'battle',currentId:'a',actionCount:0},moves=[];
  const api=createSkillCastMovement({teamPlayer:1,getUnits:()=>[actor,target],getState:()=>state,getWorld:()=>({width:1600,height:900}),
    actionSequenceFor:u=>u._hvAssetLease?.taskId??state.actionCount,heroKeyFor:()=> 'bach-dien',approachMs:()=>300,returnMs:()=>300,setStatus(){},setPhase(){},
    setUnitState:(unit,next)=>{unit.state=next;},tweenUnit:async(u,x,y)=>{u.x=x;u.y=y;moves.push({x,y});return true;}});
  return {api,actor,target,state,moves};
}
test('S+ movement keeps ownership when actionCount advances at impact',async()=>{
  const f=setup();assert.equal(await f.api.approach(f.actor,'basic',f.target,2),true);
  f.state.actionCount++;assert.equal(await f.api.returnHome(f.actor,2),true);
  assert.equal(f.actor.x,f.actor.baseX);assert.equal(f.actor.y,f.actor.baseY);assert.equal(f.actor.state,'idle');assert.equal(f.moves.length,2);
});
test('a new action lease still rejects a stale return',async()=>{
  const f=setup();await f.api.approach(f.actor,'basic',f.target,2);f.actor._hvAssetLease={taskId:5};
  assert.equal(await f.api.returnHome(f.actor,2),false);assert.equal(f.moves.length,1);
});


function formation({hero='luc-anh', enemyShift=0}={}) {
  const allies = [
    [260,250],[420,250],[580,250],
    [260,500],[420,500],[580,500]
  ].map(([x,y],slot)=>({id:'a'+slot,team:1,slot,hp:100,x,y,baseX:x,baseY:y,name:'A'+slot}));
  const enemies = [
    [1020+enemyShift,250],[1180+enemyShift,250],[1340+enemyShift,250],
    [1020+enemyShift,500],[1180+enemyShift,500],[1340+enemyShift,500]
  ].map(([x,y],slot)=>({id:'e'+slot,team:2,slot,hp:100,x,y,baseX:x,baseY:y,name:'E'+slot}));
  const state={battleId:1,mode:'battle',currentId:'a1',actionCount:0};
  const actor=allies[1], target=enemies[4]; actor.hero=hero; actor._hvAssetLease={taskId:1};
  const api=createSkillCastMovement({teamPlayer:1,getUnits:()=>[...allies,...enemies],getState:()=>state,getWorld:()=>({width:1600,height:900}),
    actionSequenceFor:u=>u._hvAssetLease?.taskId??state.actionCount,heroKeyFor:u=>u.hero,approachMs:()=>300,returnMs:()=>300,
    setStatus(){},setPhase(){},setUnitState(){},tweenUnit:async()=>true});
  return {api,actor,target,allies,enemies,state};
}

test('AoE cast position follows live enemy frontline instead of a fixed own-team caster line',()=>{
  const base=formation({hero:'luc-anh',enemyShift:0});
  const shifted=formation({hero:'luc-anh',enemyShift:140});
  const p1=base.api.plan(base.actor,'ultimate',base.target);
  const p2=shifted.api.plan(shifted.actor,'ultimate',shifted.target);
  assert.equal(p1.mode,'target-team');assert.equal(p2.mode,'target-team');
  assert.ok(p1.destination.x>base.actor.baseX);
  assert.ok(p1.destination.x<Math.min(...base.enemies.map(e=>e.baseX)));
  assert.ok(Math.abs((p2.destination.x-p1.destination.x)-140)<0.001);
});

test('target-aligned team skill changes row with the actual target',()=>{
  const f=formation({hero:'thay-mo'}),top=f.enemies[1],bottom=f.enemies[4];
  const a=f.api.plan(f.actor,'skill',top),b=f.api.plan(f.actor,'skill',bottom);
  assert.equal(a.mode,'target-team');assert.equal(a.destination.y,top.baseY);assert.equal(b.destination.y,bottom.baseY);assert.notEqual(a.destination.y,b.destination.y);
});

test('ranged basic advances toward its target but does not walk through the living enemy frontline',()=>{
  const f=formation({hero:'linh-dong'}),back=f.enemies[2],p=f.api.plan(f.actor,'basic',back),frontX=Math.min(...f.enemies.map(e=>e.baseX));
  assert.equal(p.mode,'target');assert.ok(p.destination.x>f.actor.baseX);assert.ok(p.destination.x<frontX);assert.equal(p.destination.y,back.baseY);
});

test('explicit penetrate policy may cross the frontline for a dash-style skill',()=>{
  const f=formation({hero:'custom'});f.actor.skillMovement={basic:{mode:'target',distance:0.4,penetrate:true}};
  const back=f.enemies[2],p=f.api.plan(f.actor,'basic',back),frontX=Math.min(...f.enemies.map(e=>e.baseX));
  assert.ok(p.destination.x>frontX);assert.ok(p.destination.x<back.baseX);
});

test('enemy-side movement mirrors toward the player formation',()=>{
  const f=formation({hero:'bach-dien'}),enemyActor=f.enemies[1],playerTarget=f.allies[4];enemyActor.hero='bach-dien';
  const p=f.api.plan(enemyActor,'basic',playerTarget),playerFrontX=Math.max(...f.allies.map(a=>a.baseX));
  assert.ok(p.destination.x<enemyActor.baseX);assert.ok(p.destination.x>playerFrontX);assert.equal(p.destination.y,playerTarget.baseY);
});