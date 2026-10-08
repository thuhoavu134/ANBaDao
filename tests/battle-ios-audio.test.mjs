import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const battle = readFileSync(new URL('../battle.html', import.meta.url), 'utf8');
const unlock = readFileSync(new URL('../scripts/ios-audio-unlock-patch.mjs', import.meta.url), 'utf8');
const sfx = readFileSync(new URL('../src/ui/audio-sfx-runtime.js', import.meta.url), 'utf8');

test('L12-A1: battle reuses the early AudioContext instead of creating a locked one after navigation', () => {
  assert.match(battle, /audioContext = window\.__HV_EARLY_CTX/);
  assert.match(unlock, /window\.__HV_EARLY_CTX/);
  assert.match(sfx, /window\.__HV_EARLY_CTX/);
});

test('L12-A2: embedded battle starts combat BGM and unlocks audio on gesture without a Bật tiếng button', () => {
  assert.match(battle, /bgm-combat-new\.mp3/);
  assert.match(battle, /__HV_BATTLE_BGM/);
  assert.match(unlock, /battle=battle\.replace\(\/<head/);
  assert.match(unlock, /function unlock\(/);
  assert.match(unlock, /firstGesture/);
});

test('L12-C2: iOS unlock does not inject a floating Bật tiếng control', () => {
  assert.doesNotMatch(unlock, /Bật tiếng/);
  assert.doesNotMatch(unlock, /hvUnmuteAudio/);
  assert.doesNotMatch(unlock, /function showUnmute/);
  assert.match(unlock, /pointerdown/);
  assert.match(unlock, /c\.resume/);
});


test('an outstanding muted-audio unlock cannot pause the new combat BGM', async () => {
  const marker = 'const manager = String.raw' + String.fromCharCode(96);
  const managerStart = unlock.indexOf(marker) + marker.length;
  const managerEnd = unlock.indexOf(String.fromCharCode(96) + ';', managerStart);
  const manager = unlock.slice(managerStart, managerEnd);
  assert.ok(manager.length > 1000, 'iOS audio manager is present');
  let resolvePriming;
  const priming = new Promise(resolve => { resolvePriming = resolve; });
  const music = {
    muted: false, paused: false, currentTime: 2, currentSrc: 'hub.mp3',
    play() { this.paused = false; return priming; },
    pause() { this.paused = true; },
  };
  const context = {
    state: 'running', destination: {}, createBuffer: () => ({}),
    createBufferSource: () => ({ connect() {}, start() {} }),
  };
  const window = { __HV_EARLY_CTX: context, addEventListener() {} };
  const document = {
    documentElement: { dataset: {} }, visibilityState: 'visible',
    querySelectorAll: () => [music], addEventListener() {},
  };
  const scriptStart = manager.indexOf('>') + 1;
  const scriptEnd = manager.lastIndexOf('</script>');
  vm.runInNewContext(manager.slice(scriptStart, scriptEnd), {
    window, document, Audio: class {}, fetch: async () => { throw new Error('not needed'); },
    setTimeout, clearTimeout, AbortController, Promise, Map, Set, String, Number, Math,
  });
  await window.HonVietAudio.unlock();
  music.currentSrc = 'combat.mp3';
  music.paused = false;
  resolvePriming();
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(music.paused, false, 'late unlock cleanup must not pause the active combat track');
  assert.equal(music.currentTime, 2, 'late unlock cleanup must not rewind the active combat track');
});

