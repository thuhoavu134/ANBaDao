import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('L150-T1: combat waits and VFX keep authored duration even if the OS asks to reduce motion', () => {
  const battle = read('battle.html');
  const start = battle.indexOf('function motionDuration(milliseconds)');
  const end = battle.indexOf('\n  }', start);
  const fn = battle.slice(start, end);
  assert.match(fn, /scaled \/ playbackRate/);
  assert.doesNotMatch(fn, /Math\.min\(80/);
  assert.match(battle, /cameraShake > 0\.2 && !REDUCED_MOTION/);
});

test('L150-T2: Linh Đồng VFX atlases start loading before the first ATK', () => {
  const patch = read('scripts/linh-dong-timing-main-v1.mjs');
  assert.match(patch, /atkVfx:\{file:"skill1_vfx-atlas\.webp"/);
  assert.match(patch, /Object\.keys\(LINH_DONG_CLIPS\)\.forEach\(linhDongImage\)/);
});

test('L150-T4: a new battle never starts with skip-animations armed', () => {
  const battle = read('battle.html');
  const start = battle.indexOf('function beginBattle()');
  const end = battle.indexOf('\n  function ', start + 10);
  const fn = battle.slice(start, Math.max(end, start + 800));
  assert.match(fn, /state\.skipAnimations = false/);
});
