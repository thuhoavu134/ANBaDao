import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const entryPatch = readFileSync(new URL('../scripts/battle-entry-fail-open-v1.mjs', import.meta.url), 'utf8');
const iosEntryPatch = readFileSync(new URL('../scripts/ios-battle-direct-enter-v1.mjs', import.meta.url), 'utf8');

for (const lowMemory of [false, true]) test(`${lowMemory ? 'mobile' : 'desktop'} battle presents complete composited Canvas frames`, () => {
  assert.match(entryPatch, /function __hvCreateBattleContext\(canvas\)/);
  assert.match(entryPatch, /canvas\.getContext\("2d", options\)/);
  assert.match(entryPatch, /canvas\.getContext\("2d"\)/);
  assert.match(entryPatch, /const ctx = __hvCreateBattleContext\(dom\.canvas\);/);

  const start = entryPatch.indexOf('function __hvCreateBattleContext(canvas)');
  const end = entryPatch.indexOf('  const ctx = __hvCreateBattleContext(dom.canvas);', start);
  const owner = entryPatch.slice(start, end);
  const calls = [];
  const safeContext = { profile: 'webkit-safe' };
  const context = {
    __HV_BATTLE_LOW_MEMORY: lowMemory,
    canvas: {
      getContext(type, options) {
        calls.push({ type, options });
        if (options?.desynchronized) throw new Error('WebKit rejects desynchronized');
        return options?.alpha === false ? safeContext : null;
      },
    },
    console: { warn() {} },
    result: null,
  };
  vm.runInNewContext(`${owner}\nresult = __hvCreateBattleContext(canvas);`, context);
  assert.equal(context.result, safeContext);
  assert.equal(JSON.stringify(calls), JSON.stringify([{ type: '2d', options: { alpha: false } }]));
});

test('Canvas startup falls back when context options throw or return null', () => {
  const start = entryPatch.indexOf('function __hvCreateBattleContext(canvas)');
  const end = entryPatch.indexOf('  const ctx = __hvCreateBattleContext(dom.canvas);', start);
  const owner = entryPatch.slice(start, end);
  for (const rejects of [false, true]) {
    const calls = [], safeContext = {};
    const env = { console: { warn() {} }, __HV_BATTLE_LOW_MEMORY: false,
      canvas: { getContext(type, options) {
        calls.push({type, options});
        if (options) { if (rejects) throw Error('unsupported options'); return null; }
        return safeContext;
      } } };
    vm.runInNewContext(`${owner}\nresult = __hvCreateBattleContext(canvas);`, env);
    assert.equal(env.result, safeContext);
    assert.equal(calls.length, 2);
    assert.ok(calls.every(call => !call.options?.desynchronized));
  }
});

test('embedded battle lets the render loop start before deferred autostart retries', () => {
  assert.doesNotMatch(entryPatch, /Immediate battle autostart failed/);
  assert.match(entryPatch, /\[50,400,1200,2500\]\.forEach\(delay=>setTimeout\(__hvAutoStartBattle,delay\)\)/);
  assert.doesNotMatch(entryPatch, /resetBattleState\("intro"\);[\s\S]*?beginBattle\(\);[\s\S]*?requestAnimationFrame\(render\);/);
});

test('iPhone direct recovery uses a fresh battle document cache token', () => {
  assert.match(iosEntryPatch, /'&v=3175\$\{qaSuffix\}'[\s\S]*?'&v=20260924-entry4\$\{qaSuffix\}'/);
  assert.match(iosEntryPatch, /&v=20260924-entry4/);
});
