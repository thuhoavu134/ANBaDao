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

test('L158-T4: closeOverlay preserves the shared BGM handoff after ending the battle bus', () => {
  const index = read('dist/index.html');
  const close = sliceFn(index, 'closeOverlay()', 'function finishIntegratedBattle');
  assert.match(close, /HonVietSfx\?\.endBattle\(\)/);
  // aaf8648: audio cleanup belongs to the battle-audio-lifecycle owner; closeOverlay
  // stops result audio while keeping the current track for the next route.
  const afterEnd = close.slice(close.indexOf('HonVietSfx?.endBattle()'));
  assert.match(afterEnd, /__HV_RESULT_AUDIO\?\.stop\(\{keepCurrent:true\}\)/);
  assert.doesNotMatch(afterEnd, /playBgm\(desiredBgm/);
});

test('L158-T5: hushParentBgm stays neutralized; hunt-3d owns its own pause', () => {
  const index = read('dist/index.html');
  // 3bf01b4: there is no separate host BGM to hush during integrated battles.
  // The build may keep the legacy helper for older index variants, but only in
  // its neutralized form — it must never pause bgmPlayer or stop shared combat.
  const start = index.indexOf('function hushParentBgm()');
  if (start >= 0) {
    const chunk = index.slice(start, start + 400);
    assert.doesNotMatch(chunk, /bgmPlayer\.pause/);
    assert.doesNotMatch(chunk, /stopCombat/);
  }
  assert.match(read('src/ui/hunt-3d-runtime.js'), /bgmPlayer\.pause/);
});


test('L158-T6: iPhone and iPadOS retain the audio host, release images and keep direct recovery', () => {
  const index = read('dist/index.html');
  const open = sliceFn(index, 'openIntegratedBattle', 'function syncResultIntoMongGioi');
  assert.match(open, /__HV_IOS_DIRECT_BATTLE/);
  assert.match(open, /\/iPad\|iPhone\|iPod\/i\.test\(ua\)/);
  assert.match(open, /platform==='MacIntel'&&touch>1/);
  const direct = open.slice(open.indexOf('const __HV_IOS_DIRECT_BATTLE'), open.indexOf('frame.src = url;'));
  assert.match(direct, /if \(window\.parent !== window\)/);
  assert.doesNotMatch(direct, /window\.parent !== window \|\| __HV_IOS_DIRECT_BATTLE/);
  assert.match(direct, /__HV_BATTLE_HOST_MEMORY_RELEASE/);
  assert.match(direct, /location\.assign\(url\)/);
  assert.match(direct, /window\.name = `hvBattleConfig:/);
  assert.match(read('scripts/build-static.mjs'), /ios-battle-direct-enter-v1\.mjs/);
});

test('P0: battle autostart is fail-open when iOS audio initialization throws', () => {
  const battle = read('dist/battle.html');
  const fn = sliceFn(battle, 'beginBattle()', '\n  function ');
  assert.match(fn, /Battle audio init skipped; combat continues/);
  assert.match(fn, /try \{[\s\S]*?initAudio\(\)/);
  assert.match(battle, /const __hvAutoStartBattle=/);
  for (const delay of [50, 400, 1200, 2500]) assert.match(battle, new RegExp('\\b' + delay + '\\b'));
  assert.match(read('scripts/build-static.mjs'), /battle-entry-fail-open-v1\.mjs/);
});

