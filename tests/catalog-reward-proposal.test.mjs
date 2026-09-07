import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import { extractCatalogFromRuntimeSource } from '../src/domain/catalog/extract-catalog.mjs';
import {
  L02B_REWARD_MAPPING_PROPOSAL,
  validateRewardMappingProposal
} from '../src/domain/catalog/reward-mapping-proposal.mjs';

const source = fs.readFileSync('index.html', 'utf8');
const catalog = extractCatalogFromRuntimeSource(source);
const legacyHeroIds = Object.keys(catalog.heroes)
  .filter(id => !catalog.playableIds.includes(id));

test('L02b proposal covers every active legacy chapter reward without changing reward values', () => {
  const chaptersBefore = JSON.stringify(catalog.chapters);
  const result = validateRewardMappingProposal({
    chapters: catalog.chapters,
    playableHeroIds: catalog.playableIds,
    legacyHeroIds
  });

  assert.equal(result.ok, true, JSON.stringify(result.errors, null, 2));
  assert.equal(result.summary.chapterCount, 6);
  assert.equal(result.summary.proposalCount, 6);
  assert.equal(result.summary.legacyRewardRefCount, 11);
  assert.equal(result.summary.coveredLegacyRefCount, 11);
  assert.equal(result.summary.noUnlockHeroCount, 6);
  assert.deepEqual(result.summary.proposedTargetIds, [
    'co_dao_ganh_hoi',
    'phong_tu',
    'thuy_nuong_roi_nuoc',
    'luc_anh',
    'to_diep',
    'dinh_loi'
  ]);
  assert.equal(JSON.stringify(catalog.chapters), chaptersBefore);
});

test('L02b proposal rejects legacy or non-playable replacement targets', () => {
  const invalidProposal = L02B_REWARD_MAPPING_PROPOSAL.map(row =>
    row.chapterId === 'ch1'
      ? {
          ...row,
          proposedReward: {
            ...row.proposedReward,
            shardHero: 'ong_chu_wifi'
          }
        }
      : row
  );
  const result = validateRewardMappingProposal({
    chapters: catalog.chapters,
    playableHeroIds: catalog.playableIds,
    legacyHeroIds,
    proposal: invalidProposal
  });

  assert.equal(result.ok, false);
  assert.deepEqual(
    result.errors
      .filter(error => error.chapterId === 'ch1')
      .map(error => error.code),
    ['PROPOSED_HERO_NOT_PLAYABLE', 'PROPOSED_HERO_IS_LEGACY']
  );
});
