import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => readFileSync(join(root, rel), 'utf8');

const SCOPED_FUNCTIONS = ['sweepRun', 'claimJob', 'towerReward', 'ensureShop', 'lanternGrant', 'releaseLantern', 'pickBachBaoIndex', 'openBachBaoChest', 'rollForgeRarity'];

test('meta RNG v2 owner is installed and wired into the build chain', () => {
  const build = read('scripts/build-static.mjs');
  assert.match(build, /meta-rng-seed-v2/);
  const patch = read('scripts/meta-rng-seed-v2.mjs');
  assert.match(patch, /hv_scope_seeds_v1/);
  if (!existsSync(join(root, 'dist/index.html'))) return;
  const dist = read('dist/index.html');
  assert.match(dist, /id="hv-meta-rng-seed-v2"/);
  assert.match(dist, /__HV_SCOPE_RNG_V2/);
});

test('the economy roll sites are seeded inside their owning functions', () => {
  if (!existsSync(join(root, 'dist/index.html'))) return;
  const dist = read('dist/index.html');
  const lines = dist.split('\n');
  const fnRe = /^function ([A-Za-z_$][\w$]*)\(/;
  let lastFn = '';
  const siteExpect = [
    [/random\?\.\('loot\.sweepShard'\)/, 'sweepRun'],
    [/random\?\.\('loot\.sweepPick'\)/, 'sweepRun'],
    [/random\?\.\('loot\.jobPick'\)/, 'claimJob'],
    [/random\?\.\('loot\.towerShard'\)/, 'towerReward'],
    [/random\?\.\('shop\.pick'\)/, 'ensureShop'],
    [/random\?\.\('festival\.lantern'\)/, 'lanternGrant'],
    [/random\?\.\('festival\.wish'\)/, 'releaseLantern'],
    [/random\?\.\('festival\.bachBaoIndex'\)/, 'pickBachBaoIndex'],
    [/random\?\.\('festival\.wheelPrize'\)/, 'openBachBaoChest'],
    [/random\?\.\('forge\.rarity'\)/, 'rollForgeRarity']
  ];
  const seen = new Map();
  for (const line of lines) {
    const f = line.match(fnRe);
    if (f) lastFn = f[1];
    for (const [re, fn] of siteExpect) {
      if (re.test(line)) {
        assert.equal(lastFn, fn, 'site ' + re + ' must live inside ' + fn + ', found in ' + lastFn);
        seen.set(re.source, true);
      }
    }
  }
  for (const [re] of siteExpect) assert.ok(seen.has(re.source), 'missing seeded site: ' + re);
});

test('same scope seed reproduces the same roll sequence (replay contract)', () => {
  const patch = read('scripts/meta-rng-seed-v2.mjs');
  const script = patch.match(/<script id="hv-meta-rng-seed-v2">\n([\s\S]*?)\n<\/script>/)[1];
  const storage = new Map();
  const context = {
    window: {},
    localStorage: {
      getItem: k => storage.get(k) ?? null,
      setItem: (k, v) => storage.set(k, String(v))
    },
    crypto: { getRandomValues: arr => { arr[0] = 987654321; return arr; } }
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(script, context);
  const rng = context.window.__HV_SCOPE_RNG_V2;
  assert.ok(rng, 'scoped RNG owner installed');

  rng.beginRoll('forge.rarity');
  const first = [rng.random('forge.rarity'), rng.random('forge.rarity'), rng.random('forge.rarity')];
  rng.beginRoll('forge.rarity');
  const second = [rng.random('forge.rarity'), rng.random('forge.rarity'), rng.random('forge.rarity')];
  assert.deepEqual(second, first, 'same recorded seed must replay the same sequence');

  const ring = rng.lastRolls();
  assert.equal(ring.length, 2);
  assert.equal(ring[0].scope, 'forge.rarity');
  assert.ok(Number.isFinite(ring[0].seed) && ring[0].seed > 0);
  assert.equal(storage.get('hv_scope_seeds_v1') != null, true, 'scope seed ring persisted');
});
