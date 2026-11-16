import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import vm from 'node:vm';

// Exercise the source action shape restored by the final build owners.
function productionFixture() {
  let html = readFileSync('battle.html', 'utf8');
  html = html.replace('|| drawThayMoIdleQa(context, unit)', '|| drawBachDienHero(context,unit,time) || drawThayMoIdleQa(context, unit)');
  html = html.replace('    drawThayMoRangedFx(ctx,time);', '    drawBachDienFx(ctx,time);\n    drawThayMoRangedFx(ctx,time);');
  // battle-skill-movement-v1 consolidates the third (return-home) QA arm.
  html = html.replace('} else if (usesThayMoBasicQa) {\n        actor.x=origin.x; actor.y=origin.y; setUnitState(actor,"idle",800);\n      } else if (usesOngPhoGif) {', '} else if (usesOngPhoGif) {');
  html = html.replace('    state.locked = true;\n    state.selectedAction = action;', '    state.locked = true;\n    let __hvActionAssets;\n    __hvActionAssets=await __hvBattleAssets.prepare(actor,action,target,battleId);\n    state.selectedAction = action;');
  html = html.replace('    void advanceTurn();\n  }\n\n  function statusLabel', '    void advanceTurn();\n      if(actor._hvAssetLease===__hvActionAssets)delete actor._hvAssetLease;\n  }\n\n  function statusLabel');
  return html;
}
function applyFixture() {
  const dir = mkdtempSync(join(tmpdir(), 'thay-mo-production-'));
  mkdirSync(join(dir,'dist'));
  writeFileSync(join(dir,'dist/battle.html'), productionFixture());
  const result = spawnSync(process.execPath, [resolve('scripts/thay-mo-authored-production-v1.mjs')], {cwd:dir,encoding:'utf8'});
  const html = readFileSync(join(dir,'dist/battle.html'),'utf8');
  rmSync(dir,{recursive:true,force:true});
  return {result,html};
}
test('Thầy Mo production patch emits syntactically valid character and action owners',()=>{
  const {result,html}=applyFixture();
  assert.equal(result.status,0,result.stderr);
  assert.ok(html.includes('drawThayMoAuthoredFx(ctx,time)'));
  assert.match(html,/else if \(usesThayMoAuthored\)/);
  assert.match(html,/if\(!usesThayMoAuthored && !usesLucAnh[^\n]*\) triggerImpactPresentation/);
  for(const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) {
    if(!match[0].includes('type="module"')) new vm.Script(match[1]);
  }
});

function runtimeFixture() {
  const {result,html}=applyFixture();
  assert.equal(result.status,0,result.stderr);
  const start=html.indexOf('  const THAY_MO_PRODUCTION_IDS');
  const end=html.indexOf('  function drawThayMoIdleQa(',start);
  const pending=[];
  const image={complete:false,naturalWidth:0,src:'authored.png',decode:()=>new Promise(resolve=>pending.push(()=>{image.complete=true;image.naturalWidth=300;resolve();}))};
  const actor={sourceId:'thay_mo'};
  const env={actor,state:{sound:false},window:{},setTimeout,clearTimeout,AbortController,
    BATTLE_LEGACY_LAZY_IMAGES:new Map([['authored.png',image]]),
    battleLegacyImage:()=>image,
    THAY_MO_IDLE_IMAGE:()=>image,THAY_MO_SKILL1_CAST_IMAGE:()=>image,
    THAY_MO_SKILL1_WAVE_IMAGE:()=>image,THAY_MO_SKILL1_IMPACT_IMAGE:()=>image,
    THAY_MO_ULTIMATE_CAST_IMAGE:()=>image,THAY_MO_ULTIMATE_VFX_IMAGE:()=>image};
  vm.createContext(env);vm.runInContext(html.slice(start,end),env);
  return {env,actor,pending,html};
}
test('cold authored Thầy Mo assets finish decoding before the clock/energy gate',async()=>{
  const {env,pending,html}=runtimeFixture();
  assert.equal(typeof env.prepareThayMoAuthoredAssets,'function');
  let ready=false;
  const result=env.prepareThayMoAuthoredAssets('basic',new AbortController().signal).then(()=>{ready=true});
  await Promise.resolve(); assert.equal(ready,false,'a network-cold cast must wait');
  for(let i=0;i<8;i++){pending.splice(0).forEach(f=>f());await new Promise(resolve=>setImmediate(resolve));}
  await result;assert.equal(ready,true);
  const call=html.indexOf('await prepareThayMoAuthoredAssets(action,__hvActionAssets.signal)');
  assert.ok(call>0&&call<html.indexOf('    actor.energy = Math.max(0, actor.energy - cost);'),'wait before cost and action start');
});
test('leaving the battle cancels the pending Thầy Mo decode',async()=>{
  const {env}=runtimeFixture();
  assert.equal(typeof env.prepareThayMoAuthoredAssets,'function');
  const controller=new AbortController();
  const pending=env.prepareThayMoAuthoredAssets('ultimate',controller.signal);
  controller.abort();await assert.rejects(pending,{name:'AbortError'});
});
test('authored Thầy Mo dispatches sound at release before waiting for impact',()=>{
  const {result,html}=applyFixture();assert.equal(result.status,0,result.stderr);
  const start=html.indexOf('} else if (usesThayMoAuthored) {');
  const end=html.indexOf('} else if (usesThayMoBasicQa) {',start);
  const branch=html.slice(start,end);
  assert.match(branch,/waitThayMoAuthoredMarker\(thayMoAction,'release'/);
  assert.match(branch,/waitThayMoAuthoredMarker\(thayMoAction,'impact'/);
  assert.ok(branch.indexOf("'release'")<branch.indexOf('playActionSound(actor,action)'));
  assert.ok(branch.indexOf('playActionSound(actor,action)')<branch.indexOf("'impact'"));
});
