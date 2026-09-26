import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync('dist/battle.html', 'utf8');

test('embedded battle starts even when iPhone combat audio fails synchronously', () => {
  const start = html.indexOf('function beginBattle() {');
  const marker = '    resetBattleState("battle");';
  const end = html.indexOf(marker, start);
  assert.ok(start >= 0 && end > start, 'built battle entry owner must exist');

  const entry = html.slice(start, end + marker.length) + '\n} beginBattle();';
  let started = null;
  const window = {};
  window.parent = window;

  const context = {
    state: { mode: 'intro' },
    dom: { introPanel: { hidden: false } },
    window,
    Audio: class {
      constructor() { throw new Error('iOS media constructor unavailable'); }
    },
    initAudio() { throw new Error('AudioContext unavailable'); },
    resetBattleState(mode) { started = mode; },
    console: { warn() {}, error() {} }
  };

  assert.doesNotThrow(() => vm.runInNewContext(entry, context));
  assert.equal(started, 'battle', 'audio failure must not prevent the battle state reset');
});
