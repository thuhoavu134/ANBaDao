import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { extractCatalogFromRuntimeSource } from '../src/domain/catalog/extract-catalog.mjs';
import {
  CATALOG_VALIDATOR_SCHEMA,
  validateCatalog
} from '../src/domain/catalog/validate-catalog.mjs';

function validCatalog() {
  return {
    playableIds: ['hero_a', 'hero_b'],
    heroes: {
      hero_a: { name: 'Hero A' },
      hero_b: { name: 'Hero B' }
    },
    chapters: [{
      id: 'ch1',
      first: 'scene_start',
      reward: { heroId: 'hero_a' }
    }],
    scenes: {
      scene_start: { next: 'scene_end', battleId: 'encounter_a' },
      scene_end: {}
    },
    encounters: {
      encounter_a: [{ id: 'enemy_a' }]
    },
    assetRefs: [{ id: 'hero_a.card', path: 'assets/hero-a/card.png' }],
    availableAssetPaths: ['assets/hero-a/card.png'],
    prices: [{ id: 'stamina', amount: 6 }]
  };
}

test('valid catalog passes without changing the input data', () => {
  const catalog = validCatalog();
  const before = JSON.stringify(catalog);
  const report = validateCatalog(catalog);
  assert.equal(report.schema, CATALOG_VALIDATOR_SCHEMA);
  assert.equal(report.ok, true);
  assert.deepEqual(report.issues, []);
  assert.equal(JSON.stringify(catalog), before);
  assert.equal(report.summary.playableHeroCount, 2);
  assert.deepEqual(report.summary.enemyIds, ['enemy_a']);
});

test('catalog report separates legacy reward, unknown reward, cycle and unreachable data', () => {
  const report = validateCatalog({
    playableIds: ['hero_a', 'hero_a', 'missing_playable'],
    heroes: {
      hero_a: { name: 'Hero A' },
      legacy_npc: { name: 'Legacy NPC' }
    },
    chapters: [{
      id: 'ch1',
      first: 'scene_a',
      reward: {
        shardHero: 'legacy_npc',
        unlockHero: 'missing_reward'
      }
    }],
    scenes: {
      scene_a: { next: 'scene_b', battleId: 'encounter_a' },
      scene_b: { next: 'scene_a' },
      orphan: {}
    },
    encounters: {
      encounter_a: [{ id: 'enemy_a' }],
      unreachable: [{ id: 'enemy_b' }]
    },
    assetRefs: [{ id: 'hero_a.card', path: 'assets/missing.png' }],
    availableAssetPaths: [],
    prices: [{ id: 'bad-price', amount: -1 }]
  });
  const codes = new Set(report.issues.map((entry) => entry.code));
  assert.equal(report.ok, false);
  assert.ok(codes.has('DUPLICATE_PLAYABLE_ID'));
  assert.ok(codes.has('UNKNOWN_PLAYABLE_ID'));
  assert.ok(codes.has('LEGACY_REWARD_HERO'));
  assert.ok(codes.has('UNKNOWN_REWARD_HERO_ID'));
  assert.ok(codes.has('SCENE_CYCLE'));
  assert.ok(codes.has('UNREACHABLE_SCENE'));
  assert.ok(codes.has('UNREACHABLE_ENCOUNTER'));
  assert.ok(codes.has('MISSING_ASSET'));
  assert.ok(codes.has('NEGATIVE_PRICE'));
  assert.deepEqual(report.summary.legacyRewardHeroIds, ['legacy_npc']);
  assert.deepEqual(report.summary.npcIds, []);
});

test('extractor reads only the active catalog bindings and resolves role fallback assets', () => {
  const source = fs.readFileSync(new URL('./fixtures/catalog-runtime.html', import.meta.url), 'utf8');
  const catalog = extractCatalogFromRuntimeSource(source, {
    availableAssetPaths: [
      'assets/hero-a/card.png',
      'assets/heroes-concept/crops/striker-00.png'
    ]
  });
  assert.deepEqual(catalog.playableIds, ['hero_a', 'hero_b']);
  assert.equal(Object.keys(catalog.heroes).length, 3);
  assert.equal(catalog.chapters.length, 1);
  assert.ok(catalog.assetRefs.some((ref) => ref.id === 'hero:hero_a:card'));
  assert.ok(catalog.assetRefs.some((ref) => ref.id === 'hero:hero_b:role-fallback'));
  const report = validateCatalog(catalog);
  assert.equal(report.summary.legacyRewardHeroIds[0], 'legacy_npc');
  assert.ok(report.issues.some((entry) => entry.code === 'LEGACY_REWARD_HERO'));
  assert.equal(report.issues.some((entry) => entry.code === 'MISSING_ASSET'), false);
});
