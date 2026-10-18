import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {patchActionDamageTotal} from '../scripts/action-damage-total-v1.mjs';
const read=p=>readFileSync(p,'utf8');
const runtime=read('src/runtime/action-damage-total.js');
function harness(){
  const timers=new Map();let serial=0;
  const c=vm.createContext({state:{battleId:1,intelligence:{units:{a:{damage:0,healing:0},b:{damage:0,healing:0}}}},dom:{actionTotal:{hidden:true,dataset:{}},actionTotalLabel:{},actionTotalValue:{}},setTimeout:f=>{timers.set(++serial,f);return serial;},clearTimeout:id=>timers.delete(id)});
  c.intelUnit=u=>c.state.intelligence.units[u.id];vm.runInContext(runtime,c);return {c,timers};
}
test('one actor multi-hit/AoE sums all ledger damage, independent of capped popups and other actors',()=>{
  const {c}=harness();c.state.intelligence.units.a.damage=50;
  const start=c.beginActionDamageTotal({id:'a'});
  for(const hit of [279,279,375,1,27])c.state.intelligence.units.a.damage+=hit;
  c.state.intelligence.units.b.damage=9999;
  c.finishActionDamageTotal(start);
  assert.equal(c.dom.actionTotal.dataset.damage,'961');
  assert.equal(c.dom.actionTotalValue.textContent,'961');
  const next=c.beginActionDamageTotal({id:'a'});c.state.intelligence.units.a.damage+=1;c.finishActionDamageTotal(next);
  assert.equal(c.dom.actionTotalValue.textContent,'001');
});
test('zero damage, healing, session cancellation and reset do not invent or leak damage',()=>{
  const {c,timers}=harness();const start=c.beginActionDamageTotal({id:'a'});
  c.finishActionDamageTotal(start);assert.equal(c.dom.actionTotalValue.textContent,'000');
  c.showActionTotal(0,27);assert.equal(c.dom.actionTotalLabel.textContent,'Tổng trị liệu');assert.equal(c.dom.actionTotalValue.textContent,'027');
  const stale=[...timers.values()][0];c.state.battleId=2;c.dom.actionTotalValue.textContent='new';
  c.finishActionDamageTotal(start);stale();assert.equal(c.dom.actionTotalValue.textContent,'new');assert.equal(c.dom.actionTotal.hidden,false);
  c.resetActionDamageTotal();assert.equal(c.dom.actionTotal.hidden,true);assert.equal(timers.size,0);
});
test('real legacy + S+ owner source composes with both recovery hooks and parses',()=>{
  const base=read('battle.html').replace('  function showActionTotal(damage, healing) {',read('src/runtime/splus-battle-bridge.js')+'\n  function showActionTotal(damage, healing) {');
  const patched=patchActionDamageTotal(base,runtime,read('src/ui/action-damage-total.css'));
  assert.equal(patchActionDamageTotal(patched,runtime,''),patched);
  assert.equal(patched.split('finishActionDamageTotal(actionDamageBefore);').length-1,2);
  assert.match(patched,/if\(actionRec\)showActionTotal/);
  assert.match(patched,/#actionTotal.action-total:not\(\[hidden\]\)/);
  for(const script of patched.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))new vm.Script(script[1]);
  assert.throws(()=>patchActionDamageTotal(base.replace('async function performCoNuongAction','async function changed'),runtime,''),/anchor/);
});
test('damage renderer pads presentation only, preserving signs and large values',()=>{
  const c=vm.createContext({});vm.runInContext(read('src/runtime/damage-floater-renderer.js'),c);
  for(const [text,crit,want]of [['−1',false,'−001'],['−27',false,'−027'],['BẠO KÍCH −279',true,'−279'],['−12345',false,'−12345']]){
    const calls=[],ctx={measureText:()=>({width:50}),translate(){},scale(){},createLinearGradient:()=>({addColorStop(){}}),beginPath(){},moveTo(){},lineTo(){},closePath(){},stroke(){},fill(){},strokeText(){},fillText:n=>calls.push(n)};
    const f={text,isCrit:crit,y:0};c.drawCompactDamageFloater(ctx,f,.3,()=>({x:0}));assert.equal(calls[0],want);assert.equal(f.text,text);
  }
});
