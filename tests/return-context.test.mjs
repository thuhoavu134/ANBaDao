import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  RETURN_CONTEXT_SCHEMA,
  RETURN_CONTEXT_SCHEMA_VERSION,
  captureReturnContext,
  validateReturnContext,
  resolveReturnContext
} from '../src/domain/navigation/return-context.mjs';

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');

test('return context captures route, hero, tab, scroll and draft revision immutably', () => {
  const sourceRoute = { screen: 'campaign', params: { encounterId: 'ch01_stage_1' } };
  const input = {
    sourceRoute,
    mode: 'campaign',
    encounterId: 'ch01_stage_1',
    heroId: 'ong_hang_pho',
    tab: 'skills',
    filter: 'hoa',
    scroll: { x: 4.4, y: 823.7 },
    draftRevision: 7,
    capturedAt: 42
  };
  const result = captureReturnContext(input);

  assert.equal(result.ok, true);
  assert.equal(result.context.schema, RETURN_CONTEXT_SCHEMA);
  assert.equal(result.context.schemaVersion, RETURN_CONTEXT_SCHEMA_VERSION);
  assert.deepEqual(result.context.sourceRoute, sourceRoute);
  assert.deepEqual(result.context.scroll, { x: 4, y: 824 });
  assert.equal(result.context.draftRevision, 7);
  assert.equal(result.context.capturedAt, 42);

  sourceRoute.params.encounterId = 'mutated-outside-context';
  assert.equal(result.context.sourceRoute.params.encounterId, 'ch01_stage_1');
  assert.equal(validateReturnContext(result.context).ok, true);
});

test('return context rejects malformed routes and uses a safe fallback for unavailable or stale sources', () => {
  assert.equal(captureReturnContext({ sourceRoute: { screen: 'hero detail' } }).code, 'INVALID_RETURN_CONTEXT');
  assert.equal(captureReturnContext({ sourceRoute: { screen: 'campaign' }, scroll: { y: -1 } }).code, 'INVALID_RETURN_CONTEXT');

  const captured = captureReturnContext({
    sourceRoute: { screen: 'campaign' },
    draftRevision: 8,
    capturedAt: 10
  });
  assert.equal(resolveReturnContext(captured.context, { availableScreens: ['heroes'] }).code, 'RETURN_SOURCE_UNAVAILABLE');
  assert.equal(resolveReturnContext(captured.context, { availableScreens: ['campaign'], currentRevision: 7 }).code, 'RETURN_REVISION_AHEAD');
  assert.equal(resolveReturnContext(captured.context, { availableScreens: ['campaign'], currentRevision: 8 }).target, 'campaign');
});

test('R04 build owner wires return context after settlement and before opening-loop patches', () => {
  const build = read('../scripts/build-static.mjs');
  const settlement = build.indexOf("await import('./settlement-navigation-v1.mjs');");
  const returnContext = build.indexOf("await import('./return-context-v1.mjs');");
  const opening = build.indexOf("await import('./opening-loop-v1.mjs');");
  assert.ok(settlement >= 0);
  assert.ok(returnContext > settlement);
  assert.ok(opening > returnContext);

  const patch = read('../scripts/return-context-v1.mjs');
  assert.match(patch, /samkok-r04-return-context/);
  assert.match(patch, /function navTo\(name\)/);
  assert.match(patch, /function showScreen\(name\)/);
  assert.match(patch, /renderHeroDetail\(id\)/);
  assert.match(patch, /beforeNavigate/);
  assert.match(patch, /enterHeroDetail/);
  assert.match(patch, /sessionStorage/);
  assert.match(patch, /draftRevision/);
  new Function(patch.replace(/^import[^\n]*\n/gm, ''));
});
