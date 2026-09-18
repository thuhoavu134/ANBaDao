import test from 'node:test';
import assert from 'node:assert/strict';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import vm from 'node:vm';

const patchPath = fileURLToPath(new URL('../scripts/battle-phase1-trace-v1.mjs', import.meta.url));
const tracePath = fileURLToPath(new URL('../src/domain/combat/battle-presentation-trace.mjs', import.meta.url));
const marker = 'id="hv-battle-phase1-trace"';
// These references already exist in battle.html after PR #159. They are not
// evidence that the trace initializer has been injected.
const htmlWithHooks = `<!doctype html><html><head><title>Trace fixture</title></head><body>
<script>
const clone = 'existing game binding';
const phase1Trace = window.__HV_BATTLE_PHASE1_TRACE;
phase1Trace?.begin({actionId:'battle:1',actorId:'player:1'});
phase1Trace?.marker('impact',{actionId:'battle:1',targetId:'enemy:1'});
phase1Trace?.complete({actionId:'battle:1'});
window.hookRan = true;
</script></body></html>`;

function fixture(t, html = htmlWithHooks) {
  const root = mkdtempSync(join(tmpdir(), 'hv-phase1-bootstrap-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, 'dist'), { recursive: true });
  mkdirSync(join(root, 'src/domain/combat'), { recursive: true });
  copyFileSync(tracePath, join(root, 'src/domain/combat/battle-presentation-trace.mjs'));
  const target = join(root, 'dist/battle.html');
  writeFileSync(target, html);
  return {
    root, target,
    run: () => spawnSync(process.execPath, [patchPath], { cwd: root, encoding: 'utf8', timeout: 10000 }),
    read: () => readFileSync(target, 'utf8'),
  };
}

function assertBuilt(f) {
  const result = f.run();
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return f.read();
}

function execute(html, search = '?qaPhase01=1') {
  const context = vm.createContext({ window: {}, location: { search }, URLSearchParams });
  for (const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)) {
    vm.runInContext(match[1], context, { timeout: 1000 });
  }
  return context;
}

test('trace initializer is injected even when existing battle hooks reference its global', t => {
  const html = assertBuilt(fixture(t));
  assert.equal(html.split(marker).length - 1, 1);
  const context = execute(html);
  assert.equal(typeof context.window.__HV_BATTLE_PHASE1_TRACE?.events, 'function');
  assert.equal(context.window.hookRan, true);
});

test('trace is ready before the first body action and does not leak helper bindings', t => {
  const context = execute(assertBuilt(fixture(t)));
  const trace = context.window.__HV_BATTLE_PHASE1_TRACE;
  assert.ok(trace, 'trace must exist before battle hooks execute');
  assert.deepEqual(Array.from(trace.events(), event => event.type), ['action:start', 'marker:impact', 'action:complete']);
  assert.equal(trace.snapshot().actions[0].completed, true);
  assert.equal(vm.runInContext('clone', context), 'existing game binding');
  assert.equal(vm.runInContext('typeof createBattlePresentationTrace', context), 'undefined');
});

test('normal production URLs leave tracing disabled and still execute battle hooks', t => {
  const html = assertBuilt(fixture(t));
  for (const search of ['', '?anotherFlag=1']) {
    const context = execute(html, search);
    assert.equal(context.window.__HV_BATTLE_PHASE1_TRACE, undefined);
    assert.equal(context.window.hookRan, true);
    assert.equal(vm.runInContext('typeof createBattlePresentationTrace', context), 'undefined');
  }
});

test('reapplying the patch is byte-idempotent and refreshes only its owned script', t => {
  const f = fixture(t);
  const first = assertBuilt(f);
  assert.equal(assertBuilt(f), first);
  assert.equal(first.split(marker).length - 1, 1);
  const sourcePath = join(f.root, 'src/domain/combat/battle-presentation-trace.mjs');
  writeFileSync(sourcePath, readFileSync(sourcePath, 'utf8') + '\n// refreshed trace source\n');
  const updated = assertBuilt(f);
  assert.equal(updated.split(marker).length - 1, 1);
  assert.ok(updated.includes('// refreshed trace source'));
  assert.ok(updated.includes("const clone = 'existing game binding'"));
  assert.equal(execute(updated).window.__HV_BATTLE_PHASE1_TRACE.events().length, 3);
});

test('missing head anchor fails loudly without overwriting the build', t => {
  const original = '<html><body>no head anchor</body></html>';
  const f = fixture(t, original);
  const result = f.run();
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /closing <\/head>/);
  assert.equal(f.read(), original);
});

test('source replacement preserves JavaScript dollar sequences literally', t => {
  const f = fixture(t);
  const sourcePath = join(f.root, 'src/domain/combat/battle-presentation-trace.mjs');
  writeFileSync(sourcePath, readFileSync(sourcePath, 'utf8') + '\n// literal $& $$ $` tokens\n');
  const html = assertBuilt(f);
  assert.ok(html.includes('// literal $& $$ $` tokens'));
  assert.equal(execute(html).window.__HV_BATTLE_PHASE1_TRACE.events().length, 3);
});
