import test from 'node:test';
import assert from 'node:assert/strict';
import { createDecodedAtlasCache } from '../src/assets/decoded-atlas-cache.mjs';
import { createBattleAssetReadiness } from '../src/combat-domain/battle-asset-readiness.mjs';

const MiB = 1024 * 1024;

test('iPhone/iPad keeps a native-quality decoded atlas budget and one-at-a-time decode', () => {
  const cache = createDecodedAtlasCache({
    maxBytes: 128 * MiB,
    maxLoading: 2,
    deviceProfile: {
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)',
      platform: 'iPhone',
      maxTouchPoints: 5
    },
    makeImage: () => ({ removeAttribute() {} })
  });
  const state = cache.inspect();
  assert.equal(state.maxBytes, 96 * MiB);
  assert.equal(state.maxLoading, 1);
  assert.equal(state.constrainedMobile, true);
});

test('iPadOS desktop user agent keeps native-quality budget with constrained decode concurrency', () => {
  const cache = createDecodedAtlasCache({
    maxBytes: 128 * MiB,
    maxLoading: 2,
    deviceProfile: {
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15)',
      platform: 'MacIntel',
      maxTouchPoints: 5
    },
    makeImage: () => ({ removeAttribute() {} })
  });
  assert.equal(cache.inspect().constrainedMobile, true);
  assert.equal(cache.inspect().maxLoading, 1);
});

test('desktop keeps the existing decoded atlas budget', () => {
  const cache = createDecodedAtlasCache({
    maxBytes: 128 * MiB,
    maxLoading: 2,
    deviceProfile: {
      userAgent: 'Mozilla/5.0 (X11; Linux x86_64)',
      platform: 'Linux x86_64',
      maxTouchPoints: 0
    },
    makeImage: () => ({ removeAttribute() {} })
  });
  const state = cache.inspect();
  assert.equal(state.maxBytes, 128 * MiB);
  assert.equal(state.maxLoading, 2);
  assert.equal(state.constrainedMobile, false);
});

function readinessFixture() {
  const state = { battleId: 1, mode: 'battle', currentId: 'actor', sound: false };
  const actor = { id: 'actor', hp: 100, hero: 'linh-dong' };
  const target = { id: 'target', hp: 100, hero: 'bach-dien' };
  const acquired = [];
  const pins = [];
  const unpins = [];
  const loader = {
    cache: { unpin(src, pin) { unpins.push([src, pin]); }, constrainedMobile: true },
    inspect: () => ({ maxBytes: 96 * MiB, maxLoading: 1, constrainedMobile: true }),
    ensure(clip, opts = {}) {
      if (opts.pin) pins.push({ src: clip.src, pin: opts.pin });
      return { state: 'ready', image: { complete: true }, promise: Promise.resolve() };
    },
    async acquire(clips, opts) {
      acquired.push({ clips: clips.map(clip => clip.src), opts });
      return { release() {} };
    }
  };
  const api = createBattleAssetReadiness({
    getState: () => state,
    getUnits: () => [actor, target],
    sound: () => null,
    describe: unit => ({
      hero: unit.hero,
      loader,
      clip: key => ({ src: unit.hero + '/' + key }),
      sfx: () => null
    })
  });
  return { api, actor, target, loader, acquired, pins, unpins };
}

test('action readiness blocks only on the current actor working set', async () => {
  const f = readinessFixture();
  const lease = await f.api.prepare(f.actor, 'basic', f.target, 1);
  assert.deepEqual(f.acquired[0].clips, [
    'linh-dong/run',
    'linh-dong/attack',
    'linh-dong/atkVfx'
  ]);
  lease.release();
  f.api.dispose();
});

test('low-memory visible idle is pinned per battle and released on dispose', () => {
  const f = readinessFixture();
  // 869c66f: visible idle atlases are pinned for the lifetime of the battle so
  // iOS does not thrash them back in every frame; dispose() unpins via resetVisible().
  f.api.image(f.loader, { src: 'linh-dong/idle' }, 'idle');
  assert.equal(f.pins.length, 1);
  assert.equal(f.pins[0].src, 'linh-dong/idle');
  assert.equal(typeof f.pins[0].pin, 'symbol');
  f.api.dispose();
  assert.deepEqual(f.unpins, f.pins.map((entry) => [entry.src, entry.pin]));
});
