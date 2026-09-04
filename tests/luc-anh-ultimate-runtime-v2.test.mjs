import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const v5=fs.readFileSync(new URL('../scripts/runtime-qa-polish-v5.mjs',import.meta.url),'utf8');
const v2=fs.readFileSync(new URL('../scripts/runtime-qa-polish-v2.mjs',import.meta.url),'utf8');

test('Lục Ảnh Ultimate VFX keeps authored aspect and source-cell scale',()=>{
  const match=v5.match(/const finalBlock = "([^"]+)";/);
  assert.ok(match,'v5 final Ultimate renderer contract is present');
  const line=match[1];
  assert.match(line,/drawLucAnhAtlas\(context,key,frame,cx,cy\+255,960,660/);
  assert.match(line,/globalCompositeOperation='screen'/);
  assert.match(line,/screen:true,alpha:1/);
  assert.doesNotMatch(line,/fxW|fxH|createRadialGradient/);
});

test('Lục Ảnh Ultimate voice uses local iOS-safe unlock bridge',()=>{
  assert.match(v2,/id="luc-anh-ultimate-voice-guaranteed"/);
  assert.match(v2,/new Audio\(URL\)/);
  assert.match(v2,/audio\.preload='auto'/);
  assert.match(v2,/audio\.muted=true/);
  assert.match(v2,/\['pointerdown','touchstart','click','keydown'\]/);
  assert.match(v2,/window\.__playLucAnhUltimateVoiceGuaranteed=/);
});
