import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import { extractCatalogFromRuntimeSource } from '../src/domain/catalog/extract-catalog.mjs';
import {
  backfillClaimedChapterRewardReceipts,
  commitChapterRewardClaim,
  previewChapterRewardMigration
} from '../src/domain/save/chapter-reward-migration.mjs';

const source = fs.readFileSync('index.html', 'utf8');
const catalog = extractCatalogFromRuntimeSource(source);

function saveFixture() {
  return {
    v: 1,
    gold: 100,
    gems: 10,
    clearedChapters: [0],
    heroes: {
      ong_chu_wifi: { owned: true, level: 1, stars: 1 }
    },
    shards: {
      ong_chu_wifi: 40,
      existing_hero: 7
    }
  };
}

test('preview separates an already-cleared legacy chapter from an unclaimed proposal', () => {
  const save = saveFixture();
  const before = JSON.stringify(save);
  const report = previewChapterRewardMigration({
    save,
    chapters: catalog.chapters
  });

  assert.equal(report.ok, true);
  assert.equal(report.summary.chapterCount, 6);
  assert.equal(report.summary.claimedCount, 1);
  assert.equal(report.summary.unclaimedCount, 5);
  assert.equal(report.decisions[0].action, 'preserve-existing');
  assert.equal(report.decisions[1].action, 'use-proposal-on-explicit-claim');
  assert.equal(report.decisions[1].proposedReward.shardHero, 'phong_tu');
  assert.equal(JSON.stringify(save), before);
});

test('receipt backfill preserves existing ownership, shards, currencies and progress', () => {
  const save = saveFixture();
  const before = JSON.stringify(save);
  const result = backfillClaimedChapterRewardReceipts({
    save,
    chapters: catalog.chapters,
    now: 1234567890
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.backfilledChapterIds, ['ch1']);
  assert.equal(result.summary.rewardMutationCount, 0);
  assert.equal(result.summary.ownershipMutationCount, 0);
  assert.equal(result.candidate.gold, 100);
  assert.equal(result.candidate.gems, 10);
  assert.deepEqual(result.candidate.shards, save.shards);
  assert.deepEqual(result.candidate.clearedChapters, [0]);
  assert.equal(result.candidate.chapterRewardReceipts.ch1.status, 'claimed');
  assert.equal(
    result.candidate.chapterRewardReceipts.ch1.mappingVersion,
    'l02b-proposal-v1'
  );
  assert.equal(JSON.stringify(save), before);
});

test('explicit unclaimed claim applies proposed reward once and preserves legacy data', () => {
  const save = saveFixture();
  const before = JSON.stringify(save);
  const result = commitChapterRewardClaim({
    save,
    chapterId: 'ch2',
    chapters: catalog.chapters,
    commandId: 'chapter-reward:ch2:migration-test',
    now: 1234567891
  });

  assert.equal(result.ok, true);
  assert.equal(result.reward.shardHero, 'phong_tu');
  assert.equal(result.candidate.gold, 1200);
  assert.equal(result.candidate.gems, 110);
  assert.equal(result.candidate.shards.ong_chu_wifi, 40);
  assert.equal(result.candidate.shards.existing_hero, 7);
  assert.equal(result.candidate.shards.phong_tu, 40);
  assert.deepEqual(result.candidate.clearedChapters, [0, 1]);
  assert.equal(result.candidate.chapterRewardReceipts.ch2.status, 'claimed');
  assert.equal(
    result.candidate.chapterRewardReceipts.ch2.commandId,
    'chapter-reward:ch2:migration-test'
  );
  assert.equal(JSON.stringify(save), before);

  const duplicate = commitChapterRewardClaim({
    save: result.candidate,
    chapterId: 'ch2',
    chapters: catalog.chapters,
    commandId: 'chapter-reward:ch2:migration-test-duplicate'
  });
  assert.equal(duplicate.ok, false);
  assert.equal(duplicate.code, 'ALREADY_CLAIMED');
});

test('cleared chapter cannot be regranted even when it has no receipt yet', () => {
  const result = commitChapterRewardClaim({
    save: saveFixture(),
    chapterId: 'ch1',
    chapters: catalog.chapters
  });

  assert.equal(result.ok, false);
  assert.equal(result.code, 'ALREADY_CLAIMED');
  assert.equal(result.reason, 'clearedChapters');
});

test('explicit unclaimed claim requires a stable command id', () => {
  const result = commitChapterRewardClaim({
    save: {
      gold: 0,
      gems: 0,
      heroes: {},
      shards: {},
      clearedChapters: []
    },
    chapterId: 'ch2',
    chapters: catalog.chapters
  });

  assert.equal(result.ok, false);
  assert.equal(result.code, 'MISSING_COMMAND_ID');
});
