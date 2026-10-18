import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync,existsSync} from 'node:fs';

const bridge=readFileSync('src/runtime/splus-battle-bridge.js','utf8');
function bridgeContext(){
  const calls=[];
  const c=vm.createContext({addFloater:(...args)=>calls.push(args)});
  vm.runInContext(bridge,c);
  c.target={id:'victim',hp:100,x:300,y:400};
  return {c,calls};
}
test('damage 1 and every critical hit escape an active S+ presentation batch immediately',()=>{
  const {c,calls}=bridgeContext();
  vm.runInContext('splusPresentation=new Map();splusFloater(target,1);splusFloater(target,27,false,true);splusFloater(target,3);',c);
  assert.equal(calls.length,3,'never aggregate or swallow separate hit events');
  assert.equal(calls[0][1],'−1');
  assert.match(calls[1][1],/BẠO KÍCH.*27/);
  assert.equal(calls[2][1],'−3');
});
test('S+ critical metadata reaches the shared damage painter even outside a batch',()=>{
  const {c,calls}=bridgeContext();
  vm.runInContext('splusFloater(target,1,false,true);splusFloater(target,0);',c);
  assert.equal(calls.length,1);assert.match(calls[0][1],/BẠO KÍCH.*1/);
});
test('healing flush detaches its batch before emission (no merge-back then clear loss)',()=>{
  const {c,calls}=bridgeContext();
  vm.runInContext('splusPresentation=new Map();splusFloater(target,4,true);flushSplusPresentation();flushSplusPresentation();',c);
  assert.equal(calls.length,1);assert.equal(calls[0][1],'+4');
});

function feedbackContext(){
  let now=100;
  const c=vm.createContext({performance:{now:()=>now},floaters:[],getUnit:id=>c.unit?.id===id?c.unit:null,battleCharacterBody:u=>({centerX:u.x,topY:u.y-140,footY:u.y,height:140}),Core:{clamp:(n,a,b)=>Math.max(a,Math.min(b,n))}});
  const path='src/runtime/battle-hit-feedback.js';
  if(existsSync(path))vm.runInContext(readFileSync(path,'utf8'),c);
  c.unit={id:'victim',x:300,y:400,hp:100};
  return {c,tick:n=>{now+=n;}};
}
test('rapid hits stay in one ordered column without six-hit lane reuse',()=>{
  const {c,tick}=feedbackContext();
  for(let i=1;i<=12;i++){vm.runInContext(`addBattleHitFloater(unit,'−${i}','yellow')`,c);tick(30);}
  assert.equal(c.floaters.length,12);
  for(let i=1;i<c.floaters.length;i++){
    assert.equal(c.floaters[i].x,300);
    assert.ok(c.floaters[i].y-c.floaters[i-1].y>=28);
  }
  assert.equal(c.floaters.at(-1).y,240,'uses head bounds, not a hard-coded foot offset');
});
test('a floater follows its victim including a lethal hit, and rage loss is not damage',()=>{
  const {c}=feedbackContext();
  vm.runInContext("addBattleHitFloater(unit,'−1','yellow');unit.x+=40;unit.y-=20;unit.hp=0;updateBattleHitFloater(floaters[0],0);addBattleHitFloater(unit,'−12 NỘ','yellow');",c);
  assert.equal(c.floaters[0].x,340);assert.equal(c.floaters[0].y,220);
  assert.equal(c.floaters[0].isDamage,true);assert.equal(c.floaters[1].isDamage,false);
});
test('shared foot shadow uses foot bounds, a light neutral fill and balanced canvas state',()=>{
  const {c}=feedbackContext();const calls=[];
  c.ctx={save(){calls.push('save');},restore(){calls.push('restore');},beginPath(){},ellipse(...a){calls.push(a);},fill(){calls.push(this.fillStyle);}};
  vm.runInContext('drawBattleFootShadow(ctx,unit,100)',c);
  assert.equal(calls[0],'save');assert.equal(calls.at(-1),'restore');
  assert.deepEqual(calls[1].slice(0,2),[300,402]);
  assert.match(calls[2],/0\.18/);
});
test('authored shadow follows the painted spear pose and disappears during shadow vanish',()=>{
  const {c}=feedbackContext();
  Object.assign(c,{state:{battleId:1},HONG_THUONG_META:{clips:{hit:{durationMs:200}}},hongThuongElapsed:()=>400,hongThuongBodyPos:()=>({x:800,y:420})});
  c.unit._hongThuongAction={battleId:1,action:'ultimate'};
  assert.equal(c.battleFeedbackBody(c.unit).centerX,800);
  assert.equal(c.battleFeedbackBody(c.unit).footY,420);
  delete c.unit._hongThuongAction;
  Object.assign(c,{TICH_DAO_META:{clips:{hit:{durationMs:200}}},tichDaoElapsed:()=>400,tichDaoBodyPos:()=>({x:700,y:450}),tichDaoPhaseAt:()=>({visible:false})});
  c.unit._tichDaoAction={battleId:1,action:'ultimate'};
  assert.equal(c.battleFeedbackBody(c.unit).visible,false);
});
test('counter and reaction damage use numeric style, but shield/rage/status labels do not',()=>{
  const {c}=feedbackContext();
  for(const text of ['PHẢN 1','⚗ −12','VIỆN KÍCH −3','BIẾN CỐ −4','⛊2','−12 NỘ','HỘ TƯỚNG −15%'])c.addBattleHitFloater(c.unit,text,'white');
  assert.deepEqual(Array.from(c.floaters,f=>f.isDamage),[true,true,true,true,false,false,false]);
});
