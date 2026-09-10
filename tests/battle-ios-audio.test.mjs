import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const battle = readFileSync(new URL('../battle.html', import.meta.url), 'utf8');
const unlock = readFileSync(new URL('../scripts/ios-audio-unlock-patch.mjs', import.meta.url), 'utf8');
const sfx = readFileSync(new URL('../src/ui/audio-sfx-runtime.js', import.meta.url), 'utf8');

test('L12-A1: battle reuses the early AudioContext instead of creating a locked one after navigation', () => {
  assert.match(battle, /audioContext = window\.__HV_EARLY_CTX/);
  assert.match(unlock, /window\.__HV_EARLY_CTX/);
  assert.match(sfx, /window\.__HV_EARLY_CTX/);
});

test('L12-A2: embedded battle starts combat BGM and offers a tap-to-unmute control', () => {
  assert.match(battle, /bgm-combat-new\.mp3/);
  assert.match(battle, /__HV_BATTLE_BGM/);
  assert.match(unlock, /Bật tiếng/);
  assert.match(unlock, /battle=battle\.replace\(\/<head/);
});
