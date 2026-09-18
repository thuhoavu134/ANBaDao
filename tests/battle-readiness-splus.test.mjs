import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
const html=readFileSync('dist/battle.html','utf8');
const from=html.indexOf('async function performSplusAction('),to=html.indexOf('\nfunction drawSplusToken(',from);
assert.ok(from>0&&to>from);
const source=html.slice(from,to);
function fixture(){
  let resolve,reject;const pending=new Promise((a,b)=>{resolve=a;reject=b;});
  const calls=[];const state={mode:'battle',battleId:1,currentId:'a',locked:false};
  const context=vm.createContext({state,splusCombat:()=>({}),isLinhDong:()=>true,isBachDien:()=>false,
    normalizeLinhDongAction:()=> 'atk',__hvBattleAssets:{prepare:()=>{calls.push('prepare');return pending;}},
    __hvBattleAssetError:()=>{state.locked=false;calls.push('failure');},
    __hvSkillMovement:{approach:async()=>{calls.push('approach');return true;}},
    clearTargets:()=>{},updateActorHud:()=>{},setStatus:()=>{},dom:{phaseLabel:{}},SPLUS42:{catalog:[]},
    beginLinhDongAction:()=>{calls.push('cast');throw new Error('CAST_REACHED');}});
  const action=vm.runInContext(source+';performSplusAction',context);
  return {action,calls,state,actor:{id:'a',hp:100,energy:80},resolve:()=>resolve({release:()=>calls.push('release')}),reject};
}
test('real S+ path waits for resources before movement/cast/domain act',async()=>{
  const f=fixture();const p=f.action(f.actor,'basic',{});
  assert.deepEqual(f.calls,['prepare']);assert.equal(f.actor.energy,80);assert.equal(f.state.locked,true);
  f.resolve();await assert.rejects(p,/CAST_REACHED/);
  assert.deepEqual(f.calls,['prepare','approach','cast','release']);assert.equal(f.actor._hvAssetLease,undefined);
});
test('S+ asset failure leaves a retryable turn without casting or spending energy',async()=>{
  const f=fixture();const p=f.action(f.actor,'basic',{});f.reject(new Error('network'));await p;
  assert.deepEqual(f.calls,['prepare','failure']);assert.equal(f.actor.energy,80);assert.equal(f.state.locked,false);
});
test('S+ path returns to its per-skill home before releasing the action lease',()=>{
  assert.match(source,/await __hvSkillMovement\.returnHome\(actor,battleId\)/);
  assert.ok(source.indexOf('__hvSkillMovement.returnHome')<source.indexOf('__hvSplusAssets.release()'));
  assert.ok(source.indexOf('__hvBattleAssets.prepare')<source.indexOf('e.act(actor.id,action,target?.id)'));
});
