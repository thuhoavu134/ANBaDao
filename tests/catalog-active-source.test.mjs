import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractCatalogFromRuntimeSource } from '../src/domain/catalog/extract-catalog.mjs';
import { validateCatalog } from '../src/domain/catalog/validate-catalog.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function walk(directory) {
  const result = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...walk(absolute));
    else result.push(path.relative(root, absolute).replaceAll('\\', '/'));
  }
  return result;
}

test('active index catalog is classified without silently hiding known legacy issues', () => {
  const source = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const catalog = extractCatalogFromRuntimeSource(source, {
    availableAssetPaths: walk(path.join(root, 'assets'))
  });
  const report = validateCatalog(catalog);
  const codes = new Set(report.issues.map((entry) => entry.code));

  assert.equal(report.summary.playableHeroCount, 12);
  assert.equal(report.summary.nonPlayableHeroCount, 11);
  assert.deepEqual(report.summary.npcIds, ['narrator', 'mob_sale', 'boss_chungcu']);
  assert.equal(report.summary.enemyCount, 11);
  assert.equal(report.summary.chapterCount, 6);
  assert.equal(report.summary.sceneCount, 21);
  assert.deepEqual(report.summary.missingAssetIds, []);
  assert.deepEqual(report.summary.negativePriceIds, []);
  assert.deepEqual(report.summary.invalidPriceIds, []);
  assert.equal(report.summary.issueCountByCode.MISSING_SCENE_REF, 5);
  assert.equal(report.summary.issueCountByCode.LEGACY_REWARD_HERO, 11);
  assert.deepEqual([...codes].sort(), ['LEGACY_REWARD_HERO', 'MISSING_SCENE_REF']);
});
