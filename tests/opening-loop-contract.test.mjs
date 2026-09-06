import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  OPENING_LOOP_CONTRACT_SCHEMA,
  OPENING_LOOP_STATUSES,
  OPENING_STEP_STATUSES,
  buildOpeningEventKey,
  claimOpeningStep,
  createOpeningLoopState,
  getOpeningLoopView,
  advanceOpeningLoop,
  skipOpeningLoop,
  validateOpeningGraph,
  validateOpeningStep
} from '../src/domain/quest/opening-loop-contract.mjs';

const definition = {
  entryId: 'opening.stage.one',
  steps: [
    {
      id: 'opening.stage.one',
      label: 'Đánh ải đầu',
      eventId: 'campaign.win',
      target: 1,
      route: { screen: 'campaign', anchorId: 'chapter-0-stage-1' },
      next: 'opening.formation'
    },
    {
      id: 'opening.formation',
      label: 'Lưu đội hình',
      eventId: 'formation.save',
      target: 1,
      prerequisite: ['opening.stage.one'],
      route: { screen: 'team', anchorId: 'starter-formation' },
      next: 'opening.upgrade'
    },
    {
      id: 'opening.upgrade',
      label: 'Nâng tướng',
      eventId: 'hero.upgrade',
      target: 1,
      prerequisite: ['opening.formation'],
      route: { screen: 'heroes', anchorId: 'starter-upgrade' },
      next: 'opening.equip'
    },
    {
      id: 'opening.equip',
      label: 'Mặc trang bị',
      eventId: 'hero.equip',
      target: 1,
      prerequisite: ['opening.upgrade'],
      route: { screen: 'forge', anchorId: 'starter-equipment' },
      next: null,
      terminal: true
    }
  ]
};

function fresh() {
  const created = createOpeningLoopState(definition, { now: 10 });
  assert.equal(created.ok, true);
  return created.state;
}

test('opening contract exposes stable schema and validates a linear graph', () => {
  assert.equal(OPENING_LOOP_CONTRACT_SCHEMA, 'hon-viet-opening-loop/v1');
  const graph = validateOpeningGraph(definition);
  assert.equal(graph.ok, true);
  assert.deepEqual(graph.terminalIds, ['opening.equip']);
  assert.equal(graph.steps.length, 4);
});

test('step validator requires route, target, event and explicit terminal shape', () => {
  assert.equal(validateOpeningStep({
    id: 'bad',
    eventId: 'campaign.win',
    target: 1,
    next: null,
    terminal: true
  }).code, 'INVALID_OPENING_STEP');
  assert.equal(validateOpeningStep({
    id: 'good',
    eventId: 'campaign.win',
    target: 1,
    route: { screen: 'campaign' },
    next: null,
    terminal: true
  }).ok, true);
});

test('graph rejects missing links, cycles, and prerequisite deadlocks', () => {
  const missing = validateOpeningGraph({
    entryId: 'a',
    steps: [{
      id: 'a',
      eventId: 'event.a',
      target: 1,
      route: { screen: 'hub' },
      next: 'missing'
    }]
  });
  assert.equal(missing.code, 'MISSING_OPENING_NEXT');

  const cycle = validateOpeningGraph({
    entryId: 'a',
    steps: [
      { id: 'a', eventId: 'event.a', target: 1, route: { screen: 'hub' }, next: 'b' },
      { id: 'b', eventId: 'event.b', target: 1, route: { screen: 'hub' }, next: 'a' }
    ]
  });
  assert.equal(cycle.code, 'OPENING_NEXT_CYCLE');

  const deadlock = validateOpeningGraph({
    entryId: 'a',
    steps: [
      { id: 'a', eventId: 'event.a', target: 1, route: { screen: 'hub' }, next: 'b' },
      { id: 'b', eventId: 'event.b', target: 1, prerequisite: ['c'], route: { screen: 'hub' }, next: 'c' },
      { id: 'c', eventId: 'event.c', target: 1, route: { screen: 'hub' }, next: null, terminal: true }
    ]
  });
  assert.equal(deadlock.code, 'OPENING_PREREQUISITE_DEADLOCK');
});

test('event key and transaction guard prevent double counting', () => {
  assert.equal(buildOpeningEventKey({
    eventId: 'campaign.win',
    periodKey: 'permanent',
    sourceId: 'battle-1'
  }), 'campaign.win|permanent|battle-1');
  const state = fresh();
  const blocked = advanceOpeningLoop(state, definition, {
    eventId: 'campaign.win',
    sourceId: 'battle-1',
    transactionStatus: 'failed'
  });
  assert.equal(blocked.code, 'TRANSACTION_NOT_COMMITTED');
  const first = advanceOpeningLoop(state, definition, {
    eventId: 'campaign.win',
    sourceId: 'battle-1',
    route: { screen: 'campaign' },
    now: 20
  });
  assert.equal(first.ok, true);
  const duplicate = advanceOpeningLoop(first.state, definition, {
    eventId: 'campaign.win',
    sourceId: 'battle-1',
    route: { screen: 'campaign' },
    now: 21
  });
  assert.equal(duplicate.ok, true);
  assert.equal(duplicate.duplicate, true);
  assert.equal(duplicate.state.progress['opening.stage.one'], 1);
});

test('opening events advance only through the current route and do not consume future events', () => {
  const state = fresh();
  const wrong = advanceOpeningLoop(state, definition, {
    eventId: 'hero.upgrade',
    sourceId: 'hero-1',
    route: { screen: 'heroes' }
  });
  assert.equal(wrong.code, 'UNEXPECTED_OPENING_EVENT');
  const first = advanceOpeningLoop(state, definition, {
    eventId: 'campaign.win',
    sourceId: 'battle-1',
    route: { screen: 'campaign' }
  });
  const next = advanceOpeningLoop(first.state, definition, {
    eventId: 'formation.save',
    sourceId: 'starter',
    route: { screen: 'team' }
  });
  assert.equal(next.advancedTo, 'opening.upgrade');
  assert.equal(next.state.stepStatus['opening.formation'], OPENING_STEP_STATUSES.COMPLETED);
});

test('resume view reports progress and terminal state safely', () => {
  let state = fresh();
  for (const event of [
    { eventId: 'campaign.win', sourceId: 'battle-1', route: { screen: 'campaign' } },
    { eventId: 'formation.save', sourceId: 'starter', route: { screen: 'team' } },
    { eventId: 'hero.upgrade', sourceId: 'hero-1', route: { screen: 'heroes' } },
    { eventId: 'hero.equip', sourceId: 'hero-1:item-1', route: { screen: 'forge' } }
  ]) {
    const result = advanceOpeningLoop(state, definition, event);
    assert.equal(result.ok, true);
    state = result.state;
  }
  const view = getOpeningLoopView(state, definition);
  assert.equal(view.status, OPENING_LOOP_STATUSES.TERMINAL);
  assert.equal(view.currentStepId, null);
  assert.equal(view.canResume, false);
  assert.equal(view.completedSteps, 4);
});

test('reward steps distinguish completed from claimed and keep reward IDs only', () => {
  const rewardDefinition = {
    entryId: 'reward.one',
    steps: [{
      id: 'reward.one',
      eventId: 'battle.win',
      target: 1,
      route: { screen: 'campaign' },
      rewardId: 'reward.chapter.one',
      next: null,
      terminal: true
    }]
  };
  const state = createOpeningLoopState(rewardDefinition).state;
  const completed = advanceOpeningLoop(state, rewardDefinition, {
    eventId: 'battle.win',
    sourceId: 'battle-1'
  });
  assert.equal(completed.ok, true);
  assert.equal(completed.state.status, OPENING_LOOP_STATUSES.COMPLETED);
  assert.equal(completed.state.stepStatus['reward.one'], OPENING_STEP_STATUSES.COMPLETED);
  const claimed = claimOpeningStep(completed.state, rewardDefinition, {
    stepId: 'reward.one',
    commandId: 'claim:reward.one'
  });
  assert.equal(claimed.ok, true);
  assert.equal(claimed.rewardId, 'reward.chapter.one');
  const duplicate = claimOpeningStep(claimed.state, rewardDefinition, {
    stepId: 'reward.one',
    commandId: 'claim:reward.one:retry'
  });
  assert.equal(duplicate.ok, true);
  assert.equal(duplicate.duplicate, true);
  assert.equal(claimed.state.stepStatus['reward.one'], OPENING_STEP_STATUSES.CLAIMED);
});

test('skip and route validators are explicit and recoverable', () => {
  const state = fresh();
  const routeMismatch = advanceOpeningLoop(state, definition, {
    eventId: 'campaign.win',
    sourceId: 'battle-1',
    route: { screen: 'team' }
  });
  assert.equal(routeMismatch.code, 'OPENING_ROUTE_MISMATCH');
  const skipped = skipOpeningLoop(state, definition, { reason: 'returning-player' });
  assert.equal(skipped.ok, true);
  assert.equal(skipped.state.status, OPENING_LOOP_STATUSES.SKIPPED);
  assert.equal(getOpeningLoopView(skipped.state, definition).canResume, false);
});

test('R10 build wires runtime instrumentation without touching seed or economy values', () => {
  const patch = readFileSync(new URL('../scripts/opening-loop-v1.mjs', import.meta.url), 'utf8');
  const build = readFileSync(new URL('../scripts/build-static.mjs', import.meta.url), 'utf8');
  assert.match(build, /await import\('\.\/settlement-navigation-v1\.mjs'\);/);
  assert.match(build, /await import\('\.\/opening-loop-v1\.mjs'\);/);
  assert.ok(build.indexOf("await import('./opening-loop-v1.mjs');") >
    build.indexOf("await import('./settlement-navigation-v1.mjs');"));
  assert.match(patch, /samkok-r10-opening-loop/);
  assert.match(patch, /HonVietOpeningLoopCore/);
  assert.match(patch, /TRANSACTION_NOT_COMMITTED/);
  assert.match(patch, /opening\.formation/);
  assert.match(patch, /data-hv-opening-go/);
  assert.ok(!patch.includes('P.gold+='));
  assert.ok(!patch.includes('P.gold +='));
  assert.ok(!patch.includes('P.gems-='));
  assert.ok(!patch.includes('P.gems -='));
  new Function(patch.replace(/^import[^\n]*\n/gm, ''));
});
