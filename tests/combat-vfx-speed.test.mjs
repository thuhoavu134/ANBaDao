import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync('battle.html','utf8');
const linh = readFileSync('scripts/linh-dong-timing-main-v1.mjs','utf8');
const bach = readFileSync('scripts/bach-dien-canvas-runtime-v1.mjs','utf8');

test('combat VFX uses a dedicated faster clock without changing movement timing', () => {
  assert.match(source, /const COMBAT_VFX_TIME_SCALE = 0\.74;/);
  assert.match(source, /const combatVfxMs = milliseconds =>/);
  assert.match(source, /approach: 520,/);
  assert.match(source, /return: 500,/);
  assert.match(source, /run:\{file:"run-atlas\.webp",frames:61,w:240,h:240,ms:42/);
});

test('legacy authored VFX owners use the shared VFX clock', () => {
  assert.match(source, /startDinhLoiFx\(kind,actor,target,duration=1000\).*duration:combatVfxMs\(duration\)/s);
  assert.match(source, /startLucAnhFx\(kind,actor,target=null,duration=1000\).*duration:combatVfxMs\(duration\)/s);
  assert.match(source, /sourceElapsed=elapsed\/COMBAT_VFX_TIME_SCALE,frame=linhDongFrame/);
});

test('canonical Linh Dong Skill 1 has a dedicated 620ms VFX window', () => {
  assert.match(linh, /fx\.kind==='atkVfx'[\s\S]*Math\.min\(recoveryWindow,620\)/);
  assert.match(linh, /sourceElapsed=\(vfxElapsed\/vfxDuration\)\*sourceDuration/);
  assert.match(linh, /if\(vfxElapsed>=vfxDuration\)\{linhDongFx=null;return;\}/);
});

test('Bach Dien Skill 1 has a dedicated 560ms VFX window', () => {
  assert.match(bach, /fx\.kind==='atkVfx'\?Math\.min\(560,/);
  assert.match(bach, /sourceElapsed=\(vfxElapsed\/vfxDuration\)\*sourceVfxDuration/);
  assert.match(bach, /if\(vfxElapsed>=vfxDuration\)\{bachDienFx=null;return;\}/);
});

test('generated battle keeps the VFX speed contract after all build patches', () => {
  const dist = readFileSync('dist/battle.html','utf8');
  assert.match(dist, /const COMBAT_VFX_TIME_SCALE = 0\.74;/);
  assert.match(dist, /fx\.kind==='atkVfx'[\s\S]*Math\.min\(recoveryWindow,620\)/);
  assert.match(dist, /fx\.kind==='atkVfx'\?Math\.min\(560,/);
});

test('Skill 1 action clocks keep damage inside the faster visual beat', () => {
  const linhPresentation = readFileSync('src/combat-domain/linh-dong-presentation.mjs','utf8');
  const bachPresentation = readFileSync('src/combat-domain/bach-dien-presentation.mjs','utf8');
  assert.match(linhPresentation, /releaseMs: 160,[\s\S]*impactMs: 500,[\s\S]*recoveryEndMs: 720/);
  assert.match(bachPresentation, /releaseMs: 140,[\s\S]*impactMs: 430,[\s\S]*recoveryEndMs: 680/);
  assert.match(linh, /attack:\{file:"basic-atlas\.webp",frames:44,cols:8,w:480,h:440,ms:16\.364,loop:false,durationMs:720\}/);
  assert.match(bach, /clips\.attack = \{ \.\.\.clips\.attack, ms: 22\.667, fps: 44\.1176470588, durationMs: 680 \}/);
});
