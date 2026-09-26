import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { patchBachDienImpactOwner } from '../src/combat-domain/bach-dien-impact-owner.mjs';

const runtimePatch = fs.readFileSync(new URL('../scripts/bach-dien-canvas-runtime-v1.mjs', import.meta.url), 'utf8');

const POST_LINH_DONG_TRACED = `    const linhImpact=usesLinhDong?actor._linhDongAction:null;
    const resolveAtImpact=!linhImpact||!linhImpact.impactResolved;
    if(linhImpact){linhImpact.clock.advance(LINH_DONG_TIMELINE[linhImpact.action].impactMs);linhImpact.impactResolved=true;}
    if(resolveAtImpact){phase1Trace?.marker('impact',{actionId:phase1ActionId,targetId:target?.id||null,position:{x:target?.x??actor.x,y:target?.y??actor.y}});resolveAction(actor, action, target, phase1ActionId);}
    if(!usesLucAnh && !usesLinhDong) triggerImpactPresentation(actor, target, action);`;

test('Bạch Diện attaches impact ownership after the canonical Linh Đồng traced block', () => {
  const patched = patchBachDienImpactOwner(POST_LINH_DONG_TRACED);
  assert.match(patched, /const bachImpact=usesBachDien\?actor\._bachDienAction:null;/);
  assert.match(patched, /const spriteImpact=linhImpact\|\|bachImpact;/);
  assert.match(patched, /const resolveAtImpact=!spriteImpact\|\|!spriteImpact\.impactResolved;/);
  assert.match(patched, /if\(bachImpact\)\{bachImpact\.clock\.advance\(BACH_DIEN_TIMELINE\[bachImpact\.action\]\.impactMs\);bachImpact\.impactResolved=true;\}/);
  assert.match(patched, /phase1Trace\?\.marker\('impact'/);
  assert.match(patched, /resolveAction\(actor, action, target, phase1ActionId\)/);
  assert.match(patched, /if\(!usesLucAnh && !usesLinhDong && !usesBachDien\) triggerImpactPresentation\(actor, target, action\);/);
  assert.equal((patched.match(/resolveAction\(actor, action, target, phase1ActionId\)/g)||[]).length,1);
  assert.equal((patched.match(/triggerImpactPresentation\(actor, target, action\)/g)||[]).length,1);
});

test('Bạch Diện impact owner patch is idempotent', () => {
  const once = patchBachDienImpactOwner(POST_LINH_DONG_TRACED);
  assert.equal(patchBachDienImpactOwner(once), once);
});

test('Bạch Diện impact owner refuses an unknown impact shape instead of silently skipping', () => {
  assert.throws(
    () => patchBachDienImpactOwner('    resolveSomethingElse(actor);'),
    /Bạch Diện impact owner anchor missing/
  );
});


test('Bạch Diện runtime delegates impact ownership to the canonical helper and never silently warns', () => {
  assert.match(runtimePatch, /patchBachDienImpactOwner\(html\)/);
  assert.doesNotMatch(runtimePatch, /impact\/trace anchor missing|keeping existing canonical trace owner/);
});
