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

test('canonical Linh Dong compresses full VFX frames around impact instead of crawling through the source atlas', () => {
  assert.match(linh, /impactOffset\+120,combatVfxMs\(recoveryWindow\)/);
  assert.match(linh, /sourceElapsed=\(vfxElapsed\/vfxDuration\)\*sourceDuration/);
  assert.match(linh, /if\(vfxElapsed>=vfxDuration\)\{linhDongFx=null;return;\}/);
});

test('Bach Dien VFX ends on its accelerated authored duration instead of holding the last frame', () => {
  assert.match(bach, /const vfxDuration=combatVfxMs\(sourceVfxDuration\)/);
  assert.match(bach, /sourceElapsed=vfxElapsed\/COMBAT_VFX_TIME_SCALE/);
  assert.match(bach, /if\(vfxElapsed>=vfxDuration\)\{bachDienFx=null;return;\}/);
});

test('generated battle keeps the VFX speed contract after all build patches', () => {
  const dist = readFileSync('dist/battle.html','utf8');
  assert.match(dist, /const COMBAT_VFX_TIME_SCALE = 0\.74;/);
  assert.match(dist, /impactOffset\+120,combatVfxMs\(recoveryWindow\)/);
  assert.match(dist, /sourceElapsed=vfxElapsed\/COMBAT_VFX_TIME_SCALE/);
});
