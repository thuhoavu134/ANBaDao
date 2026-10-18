import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';
import {readFileSync,mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';import {join,resolve} from 'node:path';import {execFileSync} from 'node:child_process';
import {patchBattleHitFeedback} from '../scripts/battle-hit-feedback-v1.mjs';
const runtime=readFileSync('src/runtime/battle-hit-feedback.js','utf8');
test('shared installer replaces the real legacy floater and shadow owners once; missing anchors fail closed',()=>{
  const dir=mkdtempSync(join(tmpdir(),'hit-feedback-'));
  try{
    mkdirSync(join(dir,'dist'));
    writeFileSync(join(dir,'dist/battle.html'),readFileSync('battle.html'));
    execFileSync(process.execPath,[resolve('scripts/battle-visual-polish-v1.mjs')],{cwd:dir});
    // Minimal staging of the existing defeat visibility guard for an installer
    // unit test. This is NOT a replacement full build or playable game fixture.
    let html=readFileSync(join(dir,'dist/battle.html'),'utf8').replace('  function drawUnit(context, unit, time) {',
      '  function drawUnit(context, unit, time) {\n    if (!unit || (unit.hp <= 0 && !defeatState(unit, time).visible)) return;');
    const patched=patchBattleHitFeedback(html,runtime);
    assert.equal(patchBattleHitFeedback(patched,runtime),patched);
    assert.equal(patched.split('drawBattleFootShadow(context,unit,time);').length-1,1);
    assert.equal(patched.includes('37 * depthScale, 12 * depthScale'),false);
    assert.match(patched,/updateBattleHitFloater\(floater,delta\)/);
    for(const match of patched.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))new vm.Script(match[1]);
    assert.throws(()=>patchBattleHitFeedback(html.replace('function addFloater','function renamedFloater'),runtime),/owner missing/);
  }finally{rmSync(dir,{recursive:true,force:true});}
});
