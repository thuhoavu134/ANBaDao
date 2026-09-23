import test from 'node:test';
import assert from 'node:assert/strict';
import { createBattleAssetReadiness } from '../src/combat-domain/battle-asset-readiness.mjs';

function fixture() {
  const calls = [], unpins = [];
  const state = { battleId: 1 };
  const loader = {
    ensure: (clip, options) => { calls.push({ clip, options }); return { image: { src: clip.src } }; },
    cache: { unpin: (src, pin) => { unpins.push({ src, pin }); return true; } },
  };
  const readiness = createBattleAssetReadiness({
    getState: () => state, getUnits: () => [], sound: () => null,
    describe: () => null,
  });
  return { calls, unpins, state, loader, readiness };
}

test('mobile idle atlas stays pinned while visible and unpins at battle change/disposal', () => {
  const f = fixture(), idle = { src: 'idle.webp' }, run = { src: 'run.webp' };
  f.readiness.image(f.loader, idle, 'idle');
  f.readiness.image(f.loader, idle, 'idle');
  assert.ok(f.calls[0].options.pin, 'visible idle image has a persistent cache pin');
  assert.equal(f.calls[1].options.pin, f.calls[0].options.pin, 'repeated paints reuse one pin');
  f.readiness.image(f.loader, run, 'run');
  assert.equal(f.calls[2].options.pin, undefined, 'transient action art is protected only by its action lease');
  f.state.battleId = 2;
  f.readiness.image(f.loader, idle, 'idle');
  assert.deepEqual(f.unpins.map(item => item.src), ['idle.webp'], 'the previous battle releases its idle pin');
  f.readiness.dispose();
  assert.deepEqual(f.unpins.map(item => item.src), ['idle.webp', 'idle.webp'], 'dispose releases the current battle pin');
});
