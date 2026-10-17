import test from 'node:test';
import assert from 'node:assert/strict';
import {pickSourceFrame, replacementFrame, makeReplacementPlan, patchOwnerRefresh} from '../scripts/owner-refresh-20261018.mjs';
test('timeline resampling includes final fall frame and preserves fractional idle holds',()=>{
 const clip={durations:[50,150,75],frames:3};
 assert.equal(pickSourceFrame(clip,0,64),0);
 assert.equal(pickSourceFrame(clip,63,64),2);
 assert.equal(pickSourceFrame(clip,32,64),1);
});
test('replacement plan covers six states, shield, all legacy VFX and both idle consumers',()=>{
 const plan=makeReplacementPlan();
 for(const file of ['idle-atlas.png','run-atlas.png','hit-atlas.png','fall-atlas.png','basic-cast-atlas.png','skill1-cast-atlas.png','ultimate-cast-atlas.png','basic-projectile-atlas.png','basic-impact-atlas.png','skill1-wave-atlas.png','skill1-impact-atlas.png','skill1-shield-atlas.png','ultimate-vfx-atlas.png','ultimate-impact-atlas.png'])assert.ok(plan.some(p=>p.output==='assets/characters/dinh-loi/'+file),file);
 assert.ok(plan.some(p=>p.output==='assets/characters/thay-mo/idle-v3193-atlas.png'));
 assert.ok(plan.some(p=>p.output==='assets/characters/thay-mo/ultimate-vfx-v3212-atlas.png'));
});
test('installer fails closed when final runtime owner is missing',()=>assert.throws(()=>patchOwnerRefresh('','battle'),/owner/));
test('Dinh hammer contact pose coincides with each existing release marker',()=>{
 for(const p of makeReplacementPlan().filter(p=>p.releaseAtMs)){
  const frame=Math.floor(p.releaseAtMs/4000*64);
  assert.equal(replacementFrame({frames:18},p,frame),p.releaseSourceFrame);
  assert.equal(replacementFrame({frames:18},p,63),17);
 }
});
