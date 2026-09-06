import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  ROSTER_PLAN_SCHEMA,
  ROSTER_RARITY_ORDER,
  ROSTER_TARGET_COUNTS,
  ROSTER_TARGET_TOTAL,
  summarizeRosterCapacity,
  validateRosterCapacity
} from '../src/domain/hero/roster-plan.mjs';
import { buildRosterView } from '../src/domain/hero/roster-view.mjs';

test('Samkok v2 roster capacity is explicit and totals 72 slots', () => {
  assert.equal(ROSTER_PLAN_SCHEMA, 'hon-viet-roster-plan/v1');
  assert.deepEqual(ROSTER_RARITY_ORDER, ['ssr', 'sr', 'a', 'b']);
  assert.deepEqual(ROSTER_TARGET_COUNTS, { ssr: 32, sr: 16, a: 16, b: 8 });
  assert.equal(ROSTER_TARGET_TOTAL, 72);
});

test('the current 12-hero production roster leaves future capacity without placeholders', () => {
  const ids = Array.from({ length: 12 }, (_, index) => 'current_' + index);
  const heroes = Object.fromEntries(ids.map(id => [id, { rarity: 'ssr' }]));
  const summary = summarizeRosterCapacity({ ids, heroes });

  assert.deepEqual(summary.activeCounts, { ssr: 12, sr: 0, a: 0, b: 0 });
  assert.deepEqual(summary.remainingCounts, { ssr: 20, sr: 16, a: 16, b: 8 });
  assert.equal(summary.activeTotal, 12);
  assert.equal(summary.targetTotal, 72);
  assert.equal(summary.withinCapacity, true);
  assert.deepEqual(summary.unknownIds, []);
  assert.deepEqual(summary.invalidIds, []);
});

test('future tiers can be counted from authored data before art is attached', () => {
  const ids = ['ssr_1', 'sr_1', 'a_1', 'b_1', 'sr_1'];
  const heroes = {
    ssr_1: { rarity: 'SSR' },
    sr_1: { rarity: 'sr' },
    a_1: { rarity: 'a' },
    b_1: { rarity: 'b' }
  };
  const summary = summarizeRosterCapacity({ ids, heroes });

  assert.deepEqual(summary.activeCounts, { ssr: 1, sr: 1, a: 1, b: 1 });
  assert.equal(summary.activeTotal, 4);
  assert.deepEqual(summary.activeIds, ['ssr_1', 'sr_1', 'a_1', 'b_1']);
  assert.deepEqual(summary.remainingCounts, { ssr: 31, sr: 15, a: 15, b: 7 });
});

test('invalid, unknown and over-capacity entries fail validation with actionable codes', () => {
  const ssrIds = Array.from({ length: 33 }, (_, index) => 'ssr_' + index);
  const ids = [...ssrIds, 'missing', 'bad'];
  const heroes = Object.fromEntries(ssrIds.map(id => [id, { rarity: 'ssr' }]));
  heroes.bad = { rarity: 'legendary' };

  const result = validateRosterCapacity({ ids, heroes });
  assert.equal(result.ok, false);
  assert.deepEqual(
    result.errors.map(error => error.code),
    ['UNKNOWN_HERO_ID', 'INVALID_RARITY', 'RARITY_CAPACITY_EXCEEDED']
  );
  assert.equal(result.summary.activeCounts.ssr, 33);
  assert.equal(result.summary.withinCapacity, false);
});

test('roster read-model carries the capacity summary without changing visible cards', () => {
  const view = buildRosterView({
    ids: ['hero_1'],
    heroes: { hero_1: { name: 'Tướng Một', he: 'hoa', rarity: 'ssr', role: 'Đấu sĩ' } },
    player: {
      gold: 1,
      gems: 2,
      squad: [],
      heroes: { hero_1: { owned: true, level: 1, stars: 1 } }
    },
    powerFor: () => 10,
    portraitFor: () => 'hero.webp'
  });

  assert.equal(view.total, 1);
  assert.equal(view.catalog.activeTotal, 1);
  assert.equal(view.catalog.targetTotal, 72);
  assert.deepEqual(view.catalog.activeCounts, { ssr: 1, sr: 0, a: 0, b: 0 });
});

test('the build embeds the plan module and exposes capacity metadata without fake cards', () => {
  const plan = readFileSync(new URL('../src/domain/hero/roster-plan.mjs', import.meta.url), 'utf8');
  const view = readFileSync(new URL('../src/domain/hero/roster-view.mjs', import.meta.url), 'utf8');
  const patch = readFileSync(new URL('../scripts/hero-roster-phase-a-v4.mjs', import.meta.url), 'utf8');
  const runtime = readFileSync(new URL('../src/ui/hero-roster-runtime.js', import.meta.url), 'utf8');
  const viewForBundle = view
    .replace(/^import \{ summarizeRosterCapacity \} from '\.\/roster-plan\.mjs';\s*$/m, '')
    .replace(/^export\s+/gm, '');
  new Function(plan.replace(/^export\s+/gm, '') + '\n' + viewForBundle + '\n' + runtime);
  assert.match(patch, /roster-plan\.mjs/);
  assert.match(runtime, /rosterTargetTotal/);
  assert.doesNotMatch(runtime, /ROSTER_TARGET_TOTAL.*view\.cards/);
});
