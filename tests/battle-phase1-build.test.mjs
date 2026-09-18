import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const build = fs.readFileSync('scripts/build-static.mjs', 'utf8');
const initializerPattern = /<script id="hv-battle-phase1-trace">([\s\S]*?)<\/script>/g;

function generatedInitializer() {
  const html = fs.readFileSync('dist/battle.html', 'utf8');
  const scripts = [...html.matchAll(initializerPattern)];
  assert.equal(scripts.length, 1, 'the final build must contain one owned trace initializer');
  return { html, script: scripts[0] };
}

test('Phase 1 build keeps the opt-in trace patch in the build pipeline', () => {
  assert.match(build, /battle-phase1-trace-v1/);
  const patch = fs.readFileSync('scripts/battle-phase1-trace-v1.mjs', 'utf8');
  assert.match(patch, /new URLSearchParams\(location\.search\)\.has\('qaPhase01'\)/);
});

test('final generated battle installs tracing before its first action hook', () => {
  const { html, script } = generatedInitializer();
  const hookIndex = html.search(/const\s+phase1Trace\s*=\s*window\.__HV_BATTLE_PHASE1_TRACE/);
  assert.ok(hookIndex > script.index, 'initializer must precede action hooks, not merely share their symbol');
  assert.ok(script.index < html.search(/<\/head\s*>/i), 'initializer belongs in the head');
  const context = vm.createContext({ window: {}, location: { search: '?qaPhase01=1' }, URLSearchParams });
  vm.runInContext(script[1], context, { timeout: 1000 });
  const trace = context.window.__HV_BATTLE_PHASE1_TRACE;
  assert.equal(typeof trace?.begin, 'function');
  assert.equal(trace.begin({ actionId: 'generated:1' }).ok, true);
  assert.equal(trace.marker('impact', { actionId: 'generated:1' }).ok, true);
  assert.equal(trace.complete({ actionId: 'generated:1' }).ok, true);
  assert.deepEqual(Array.from(trace.events(), event => event.type), ['action:start', 'marker:impact', 'action:complete']);
  assert.equal(vm.runInContext('typeof createBattlePresentationTrace', context), 'undefined');
});

test('final generated battle creates no trace or global helpers without the QA flag', () => {
  const { script } = generatedInitializer();
  const context = vm.createContext({ window: {}, location: { search: '' }, URLSearchParams });
  vm.runInContext(script[1], context, { timeout: 1000 });
  assert.equal(context.window.__HV_BATTLE_PHASE1_TRACE, undefined);
  assert.equal(vm.runInContext('typeof clone', context), 'undefined');
  assert.equal(vm.runInContext('typeof createBattlePresentationTrace', context), 'undefined');
});
