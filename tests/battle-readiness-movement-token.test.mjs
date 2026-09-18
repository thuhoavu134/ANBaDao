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
