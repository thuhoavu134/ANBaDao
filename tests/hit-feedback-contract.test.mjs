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
  assert.equal(c.floaters.length,3);
  assert.deepEqual(Array.from(c.floaters,f=>f.text),['−10','−11','−12']);
  for(let i=1;i<c.floaters.length;i++){
    assert.equal(c.floaters[i].x-c.floaters[i-1].x,3);
    assert.equal(c.floaters[i].y-c.floaters[i-1].y,14);
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
  assert.deepEqual(Array.from(c.floaters,f=>f.isDamage),[true,true,true,false,false,false]);
});

test('spaced hits reflow tightly after travel and mirror inward on the enemy side',()=>{
  const {c}=feedbackContext();c.TEAM_ENEMY='enemy';c.unit.team='enemy';
  c.addBattleHitFloater(c.unit,'−1','yellow');
  c.updateBattleHitFloater(c.floaters[0],.6);
  c.unit.x+=20;c.unit.y-=10;
  c.addBattleHitFloater(c.unit,'BẠO KÍCH 27','red');
  assert.equal(c.floaters[0].y,c.floaters[1].y-14);
  assert.equal(c.floaters[0].x,c.floaters[1].x+3);
  const before=c.floaters.map(f=>({x:f.x,y:f.y}));
  c.floaters.forEach(f=>c.updateBattleHitFloater(f,0));
  assert.deepEqual(c.floaters.map(f=>({x:f.x,y:f.y})),before,'reflow must not apply victim movement twice');
  c.floaters.forEach(f=>c.updateBattleHitFloater(f,.1));
  assert.ok(Math.abs(c.floaters[1].y-c.floaters[0].y-14)<1e-9);
});

test('generated painter preserves status order but paints earlier damage over later damage',async()=>{
  const {patchCompactDamageFloaters}=await import('../scripts/compact-damage-floaters-v1.mjs');
  const input='    for (const floater of floaters) {\n      if(floater.isDamage){\n        let pop=1;\n      }else{\n        const weight=floater.large?900:800;\nconst baseSize=floater.large?25:18;\ncontext.lineWidth=5;\n        context.strokeStyle="rgba(5,18,16,.85)";\n}}';
  const html=patchCompactDamageFloaters(input,'');
  const loop=html.match(/for \(const floater of (.*?)\) \{/)[1];
  const order=vm.runInNewContext(loop,{floaters:[{id:'heal1'},{id:'old',isDamage:true},{id:'heal2'},{id:'new',isDamage:true}]});
  assert.deepEqual(Array.from(order,f=>f.id),['heal1','heal2','new','old']);
  assert.equal(patchCompactDamageFloaters(html,''),html);
});

test('three-row cap is per victim and leaves healing/status feedback intact',()=>{
  const {c}=feedbackContext();const other={id:'other',x:500,y:400,hp:100};
  for(let i=1;i<=8;i++){c.addBattleHitFloater(c.unit,'−'+i,'yellow');c.addBattleHitFloater(other,'−'+i,'yellow');}
  c.addBattleHitFloater(c.unit,'+27','green');
  assert.equal(c.floaters.filter(f=>f.unitId==='victim'&&f.isDamage).length,3);
  assert.equal(c.floaters.filter(f=>f.unitId==='other'&&f.isDamage).length,3);
  assert.equal(c.floaters.filter(f=>!f.isDamage).length,1);
});
