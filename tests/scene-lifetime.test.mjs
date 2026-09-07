import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');
const lifetimeSource = read('../src/ui/scene-lifetime.js');
const lifetimeModule = { exports: {} };
new Function('module', 'exports', lifetimeSource.replace('export function createSceneLifetime', 'function createSceneLifetime') + '\nmodule.exports.createSceneLifetime = createSceneLifetime;')(lifetimeModule, lifetimeModule.exports);
const { createSceneLifetime } = lifetimeModule.exports;

test('scene lifetime disposes resources once in reverse order and rejects stale callbacks', () => {
  const released = [];
  const scope = createSceneLifetime('campaign');
  const guarded = scope.guard(value => value + 1);
  scope.add(() => released.push('first'));
  scope.add(() => released.push('second'));

  assert.equal(guarded(4), 5);
  const result = scope.dispose();
  assert.equal(result.ok, true);
  assert.deepEqual(released, ['second', 'first']);
  assert.equal(scope.isDisposed(), true);
  assert.equal(guarded(4), undefined);
  assert.equal(scope.dispose().released, 0);
  assert.deepEqual(released, ['second', 'first']);
  assert.equal(scope.snapshot().pending, 0);
  assert.equal(scope.snapshot().generation, 1);
});

test('scene lifetime unregisters listeners, tracks cancel handles and releases late registrations immediately', () => {
  const events = [];
  const target = {
    addEventListener(type, listener, options) { events.push(['add', type, listener, options]); },
    removeEventListener(type, listener, options) { events.push(['remove', type, listener, options]); }
  };
  const canceled = [];
  const scope = createSceneLifetime('hero-detail');
  const listener = () => {};
  scope.trackEventListener(target, 'scroll', listener, { passive: true });
  scope.track('raf-1', handle => canceled.push(handle));

  assert.equal(scope.snapshot().pending, 2);
  scope.dispose();
  assert.deepEqual(canceled, ['raf-1']);
  assert.deepEqual(events.map(([kind, type]) => [kind, type]), [['add', 'scroll'], ['remove', 'scroll']]);

  const late = [];
  scope.add(() => late.push('late'));
  assert.deepEqual(late, ['late']);
  assert.equal(scope.snapshot().pending, 0);
});

test('scene lifetime reports disposal errors without preventing other owners from cleaning up', () => {
  const released = [];
  const scope = createSceneLifetime('test');
  scope.add(() => { throw new Error('broken resource'); });
  scope.add(() => released.push('healthy'));

  const result = scope.dispose();
  assert.equal(result.ok, false);
  assert.deepEqual(released, ['healthy']);
  assert.equal(result.errors[0].message, 'broken resource');
  assert.equal(scope.snapshot().errors.length, 1);
});

test('L04b source/build owner keeps campaign activation scope separate from the reusable DOM root', () => {
  const lifetime = read('../src/ui/scene-lifetime.js');
  const campaign = read('../src/ui/campaign-scene.js');
  const afkBuild = read('../scripts/afk-chest-runtime-v1.mjs');
  assert.match(lifetime, /export function createSceneLifetime/);
  assert.match(campaign, /scope: null/);
  assert.match(campaign, /createSceneLifetime\('campaign'\)/);
  assert.match(campaign, /sceneState\.scope\?\.dispose\(\)/);
  assert.match(campaign, /sceneState\.booted/);
  assert.match(campaign, /sceneState\.scope\.add/);
  assert.match(afkBuild, /src\/ui\/scene-lifetime\.js/);
  assert.match(afkBuild, /lifetimeSource/);
  new Function(lifetime.replace(/^export\s+/gm, ''));
});
