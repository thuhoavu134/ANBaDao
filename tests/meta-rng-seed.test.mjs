import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => readFileSync(join(root, rel), 'utf8');

test('meta RNG seed owner is installed and wired into the build chain', () => {
  const build = read('scripts/build-static.mjs');
  assert.match(build, /meta-rng-seed-v1/);
  const patch = read('scripts/meta-rng-seed-v1.mjs');
  assert.match(patch, /hv_pull_seeds_v1/);
  assert.match(patch, /mulberry32/);
  if (!existsSync(join(root, 'dist/index.html'))) return;
  const dist = read('dist/index.html');
  assert.match(dist, /id="hv-meta-rng-seed-v1"/);
  assert.match(dist, /__HV_META_RNG_V1/);
});

test('the live summon roll is seeded: tier and pick sites use the meta RNG', () => {
  if (!existsSync(join(root, 'dist/index.html'))) return;
  const dist = read('dist/index.html');
  // rollTier tier roll
  assert.match(dist, /const r=window\.__HV_META_RNG_V1\.random\('summon\.tier'\)\*100;/);
  // hero pick within the tier pool
  assert.match(dist, /const id=pool\[\(window\.__HV_META_RNG_V1\.random\('summon\.pick'\)\*pool\.length\)\|0\];/);
  // every pull reseeds the stream and records the seed
  assert.match(dist, /window\.__HV_META_RNG_V1\.beginPull\(P, n, free\);/);
  // the seeded sites must be the only Math.random() callers left in rollTier/doSummon
  const summonBody = dist.slice(dist.indexOf('function doSummon(n,free)'), dist.indexOf('function renderSummon()'));
  assert.equal((summonBody.match(/Math\.random\(\)/g) || []).length, 0, 'doSummon must not call bare Math.random()');
});

test('same seed reproduces the same meta-roll sequence (replay contract)', () => {
  const patch = read('scripts/meta-rng-seed-v1.mjs');
  const script = patch.match(/<script id="hv-meta-rng-seed-v1">\n([\s\S]*?)\n<\/script>/)[1];
  const storage = new Map();
  const context = {
    window: {},
    localStorage: {
      getItem: k => storage.get(k) ?? null,
      setItem: (k, v) => storage.set(k, String(v))
    },
    crypto: { getRandomValues: arr => { arr[0] = 123456789; return arr; } }
  };
  context.window = context; // inline script assigns window.__HV_META_RNG_V1
  vm.createContext(context);
  vm.runInContext(script, context);
  const rng = context.window.__HV_META_RNG_V1;
  assert.ok(rng, 'meta RNG owner installed');

  const player = { pity: 7 };
  rng.beginPull(player, 10, false);
  const first = [rng.random('summon.tier'), rng.random('summon.pick'), rng.random('summon.tier'), rng.random('summon.pick')];
  rng.beginPull(player, 10, false);
  const second = [rng.random('summon.tier'), rng.random('summon.pick'), rng.random('summon.tier'), rng.random('summon.pick')];
  // Entropy is pinned by the fake crypto above, so both pulls must match exactly.
  assert.deepEqual(second, first, 'same recorded seed must replay the same sequence');

  const ring = rng.lastPulls();
  assert.equal(ring.length, 2);
  assert.equal(ring[0].n, 10);
  assert.equal(ring[0].pity, 7);
  assert.ok(Number.isFinite(ring[0].seed) && ring[0].seed > 0, 'recorded seed is a uint32');
  assert.equal(storage.get('hv_pull_seeds_v1') != null, true, 'seed ring persisted to its own localStorage key');
});
