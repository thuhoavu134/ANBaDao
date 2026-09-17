import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

function sliceFn(html, name, nextHint) {
  const start = html.indexOf(`function ${name}`);
  assert.ok(start >= 0, `${name} missing`);
  const endHint = nextHint ? html.indexOf(nextHint, start + 12) : -1;
  const end = endHint > start ? endHint : start + 2400;
  return html.slice(start, end);
}

test('L158-T1: Xuất chiến unlocks host SFX and plays combat BGM before the iframe src', () => {
  const index = read('dist/index.html');
  const open = sliceFn(index, 'openIntegratedBattle', 'function syncResultIntoMongGioi');
  const beforeSrc = open.slice(0, open.indexOf('frame.src = url;'));
  assert.match(beforeSrc, /HonVietSfx\?\.unlock/);
  assert.match(beforeSrc, /HonVietAudio\?\.unlock/);
  assert.match(beforeSrc, /setCombatEnabled\?\.\(true\)/);
  assert.match(beforeSrc, /playBgm\('combat'\)/);
  assert.match(read('scripts/build-static.mjs'), /battle-enter-audio-v1\.mjs/);
  assert.doesNotMatch(read('index.html'), /playBgm\('combat'\)/);
});

test('L158-T2: enterFallback keeps the overlay; it does not location.assign battle.html', () => {
  const index = read('dist/index.html');
  const start = index.indexOf('activeBattle.enterFallback = setTimeout');
  assert.ok(start >= 0, 'enterFallback missing');
  const chunk = index.slice(start, start + 420);
  assert.doesNotMatch(chunk, /location\.assign\(url\)/);
  assert.match(chunk, /loading\.firstChild\.textContent/);
  const nested = index.slice(
    index.indexOf('if (window.parent !== window)'),
    index.indexOf('frame.src = url;')
  );
  assert.match(nested, /location\.assign\(url\)/);
});

test('L158-T3: embedded beginBattle uses parent combat BGM instead of iframe HTMLAudio', () => {
  const battle = read('dist/battle.html');
  const fn = sliceFn(battle, 'beginBattle()', '\n  function ');
  assert.match(fn, /parent\.playBgm/);
  assert.match(fn, /parentBgm\('combat'\)/);
  const parentBranch = fn.slice(fn.indexOf('if (parentBgm)'), fn.indexOf('} else {'));
  assert.doesNotMatch(parentBranch, /new Audio/);
  assert.match(fn, /new Audio\("assets\/audio\/bgm-combat-new\.mp3"\)/);
});

test('L158-T4: closeOverlay restores host BGM after ending the battle bus', () => {
  const index = read('dist/index.html');
  const close = sliceFn(index, 'closeOverlay()', 'function finishIntegratedBattle');
  assert.match(close, /HonVietSfx\?\.endBattle\(\)/);
  const afterEnd = close.slice(close.indexOf('HonVietSfx?.endBattle()'));
  assert.match(afterEnd, /playBgm\(desiredBgm/);
});

test('L158-T5: hunt overlay observer does not pause the unlocked host combat player', () => {
  const index = read('dist/index.html');
  const start = index.indexOf('function hushParentBgm()');
  assert.ok(start >= 0, 'hushParentBgm missing');
  const chunk = index.slice(start, start + 280);
  assert.doesNotMatch(chunk, /bgmPlayer\.pause/);
  assert.doesNotMatch(chunk, /stopCombat/);
  assert.match(read('src/ui/hunt-3d-runtime.js'), /bgmPlayer\.pause/);
});
