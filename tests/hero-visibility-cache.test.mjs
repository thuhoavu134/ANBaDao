import test from 'node:test';
import assert from 'node:assert/strict';
import { createHeroVisibilityCache } from '../src/render/hero-visibility-cache.mjs';

function fixture() {
  const canvases = [], captures = [], operations = [];
  const cache = createHeroVisibilityCache({ makeCanvas: () => {
    const canvas = { width: 0, height: 0, getContext: () => ({ translate: (...xy) => captures.push(xy) }) };
    canvases.push(canvas); return canvas;
  } });
  const context = { save() {}, restore() {}, scale: (...xy) => operations.push(['scale', ...xy]),
    drawImage: (...args) => operations.push(['draw', ...args]) };
  const render = (_ctx, unit) => { captures.push(unit.team); return true; };
  return { cache, canvases, captures, operations, context, render };
}
test('backup is shared across teams, bounded to 5 MiB and never recaptured on every paint', () => {
  const f = fixture(), unit = { hp: 1, state: 'idle', team: 'enemy' };
  for (const hero of ['linh', 'bach', 'luc', 'dinh']) {
    for (let frame = 0; frame < 60; frame++) f.cache.finish(f.context, hero, unit, frame, true, f.render, true);
  }
  assert.equal(f.canvases.length, 4);
  assert.equal(f.cache.inspect().bytes, 5 * 1024 * 1024);
  assert.equal(f.captures.filter(v => v === 'player').length, 4);
  f.cache.finish(f.context, 'extra', unit, 0, true, f.render);
  assert.equal(f.cache.inspect().count, 4);
  assert.equal(f.canvases[0].width, 0, 'bounded cache releases the oldest backing store');
  f.cache.clear(); assert.equal(f.cache.inspect().bytes, 0);
  assert.ok(f.canvases.every(c => c.width === 0 && c.height === 0));
});
test('backup keeps reference-space foot anchor and mirrors only for the S+ owner', () => {
  const f = fixture(), unit = { hp: 1, state: 'idle', team: 'enemy' };
  f.cache.finish(f.context, 'hero', unit, 0, true, f.render, true);
  assert.deepEqual(f.captures[0], [320, 440]);
  f.cache.finish(f.context, 'hero', unit, 1, false, f.render, true);
  assert.deepEqual(f.operations[0], ['scale', -1, 1]);
  assert.deepEqual(f.operations[1].slice(2), [-320, -440]);
  f.operations.length = 0;
  f.cache.finish(f.context, 'hero', unit, 2, false, f.render, false);
  assert.equal(f.operations.length, 1, 'native drawUnit already owns its mirror');
});
test('first ready action can seed backup; first idle replaces it once without changing live state', () => {
  const f = fixture(), unit = { hp: 1, state: 'attack', team: 'enemy', stateStarted: 42 };
  f.cache.finish(f.context, 'hero', unit, 100, true, f.render, true);
  assert.equal(unit.team, 'enemy'); assert.equal(unit.stateStarted, 42);
  unit.state = 'idle';
  f.cache.finish(f.context, 'hero', unit, 200, true, f.render, true);
  assert.equal(f.canvases.length, 2); assert.equal(f.canvases[0].width, 0);
  assert.equal(f.cache.inspect().count, 1);
});
test('cold miss, failed snapshot and defeated hero never manufacture a visible pose', () => {
  const f = fixture(), unit = { hp: 1, state: 'idle', team: 'player' };
  assert.equal(f.cache.finish(f.context, 'cold', unit, 0, false, f.render), false);
  f.cache.finish(f.context, 'failed-copy', unit, 0, true, () => false);
  assert.equal(f.cache.inspect().count, 0); assert.equal(f.canvases[0].width, 0);
  f.cache.finish(f.context, 'alive', unit, 0, true, f.render);
  unit.hp = 0;
  assert.equal(f.cache.finish(f.context, 'alive', unit, 1, false, f.render), false);
  assert.equal(f.operations.length, 0);
});
