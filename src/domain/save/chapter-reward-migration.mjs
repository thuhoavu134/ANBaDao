import {
  L02B_REWARD_MAPPING_PROPOSAL
} from '../catalog/reward-mapping-proposal.mjs';

export const CHAPTER_REWARD_MIGRATION_SCHEMA =
  'hon-viet-chapter-reward-migration/v1';
export const CHAPTER_REWARD_RECEIPT_SCHEMA =
  'hon-viet-chapter-reward-receipt/v1';
export const CHAPTER_REWARD_MAPPING_VERSION = 'l02b-proposal-v1';

function isRecord(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function cloneJson(value) {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value));
}

function text(value) {
  return String(value ?? '').trim();
}

function chapterIdOf(chapter) {
  return text(chapter?.id);
}

function chapterIndexOf(chapter, fallback) {
  const value = Number(chapter?.idx ?? fallback);
  return Number.isInteger(value) && value >= 0 ? value : fallback;
}

function chapterRewardRefs(chapter) {
  const refs = [];
  const shardHero = text(chapter?.reward?.shardHero);
  const unlockHero = text(chapter?.unlockHero);
  if (shardHero) refs.push({ field: 'reward.shardHero', id: shardHero });
  if (unlockHero) refs.push({ field: 'unlockHero', id: unlockHero });
  return refs;
}

function chapterListById(chapters) {
  return new Map(
    (Array.isArray(chapters) ? chapters : [])
      .map((chapter, index) => [
        chapterIdOf(chapter),
        { chapter, index, chapterIndex: chapterIndexOf(chapter, index) }
      ])
      .filter(([id]) => id)
  );
}

function proposalById(proposal) {
  return new Map(
    (Array.isArray(proposal) ? proposal : [])
      .map(row => [text(row?.chapterId), row])
      .filter(([id]) => id)
  );
}

function normalizedClearedIndexes(save) {
  return new Set(
    (Array.isArray(save?.clearedChapters) ? save.clearedChapters : [])
      .map(value => Number(value))
      .filter(value => Number.isInteger(value) && value >= 0)
  );
}

function receiptMap(save) {
  return isRecord(save?.chapterRewardReceipts)
    ? save.chapterRewardReceipts
    : {};
}

function isClaimedReceipt(receipt) {
  return isRecord(receipt) &&
    (receipt.status === 'claimed' || receipt.claimed === true);
}

function finiteInteger(value, fallback = 0) {
  const number = Number(value);
  return Number.isInteger(number) && Number.isFinite(number)
    ? number
    : fallback;
}

function validateReward(row, chapterId) {
  const reward = row?.proposedReward;
  if (!isRecord(reward)) {
    return {
      ok: false,
      code: 'MISSING_PROPOSED_REWARD',
      chapterId
    };
  }
  const shardHero = text(reward.shardHero);
  if (!shardHero) {
    return {
      ok: false,
      code: 'MISSING_PROPOSED_HERO',
      chapterId
    };
  }
  for (const field of ['gold', 'gems', 'shards']) {
    const value = Number(reward[field] ?? 0);
    if (!Number.isInteger(value) || !Number.isFinite(value) || value < 0) {
      return {
        ok: false,
        code: 'INVALID_PROPOSED_REWARD',
        chapterId,
        field
      };
    }
  }
  return { ok: true };
}

function timestamp(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : Date.now();
}

function rewardReceipt({
  chapterId,
  chapterIndex,
  reward,
  legacyRefs,
  commandId,
  source,
  now
}) {
  return {
    schema: CHAPTER_REWARD_RECEIPT_SCHEMA,
    schemaVersion: 1,
    mappingVersion: CHAPTER_REWARD_MAPPING_VERSION,
    chapterId,
    chapterIndex,
    status: 'claimed',
    commandId: text(commandId) || null,
    source,
    legacyRefs: cloneJson(legacyRefs),
    reward: cloneJson(reward),
    createdAt: timestamp(now)
  };
}

/**
 * Produce a read-only decision report. Absence of a receipt is not treated as
 * proof that an already-cleared chapter needs a second reward.
 */
export function previewChapterRewardMigration({
  save = {},
  chapters = [],
  proposal = L02B_REWARD_MAPPING_PROPOSAL
} = {}) {
  const errors = [];
  const decisions = [];
  const chapterMap = chapterListById(chapters);
  const proposals = proposalById(proposal);
  const clearedIndexes = normalizedClearedIndexes(save);
  const receipts = receiptMap(save);

  for (const [chapterId, entry] of chapterMap) {
    const row = proposals.get(chapterId);
    const chapter = entry.chapter;
    const legacyRefs = chapterRewardRefs(chapter);
    const receipt = receipts[chapterId];
    const claimed = clearedIndexes.has(entry.chapterIndex) ||
      isClaimedReceipt(receipt);

    if (!row) {
      errors.push({
        code: 'MISSING_PROPOSAL_CHAPTER',
        chapterId
      });
    }

    if (claimed) {
      decisions.push({
        chapterId,
        chapterIndex: entry.chapterIndex,
        status: 'claimed',
        action: 'preserve-existing',
        legacyRefs: cloneJson(legacyRefs),
        receipt: cloneJson(receipt) ?? null
      });
      continue;
    }

    const rewardValidation = validateReward(row, chapterId);
    if (!rewardValidation.ok) errors.push(rewardValidation);
    decisions.push({
      chapterId,
      chapterIndex: entry.chapterIndex,
      status: 'unclaimed',
      action: 'use-proposal-on-explicit-claim',
      legacyRefs: cloneJson(legacyRefs),
      proposedReward: cloneJson(row?.proposedReward) ?? null
    });
  }

  const claimedCount = decisions.filter(
    decision => decision.status === 'claimed'
  ).length;
  const unclaimedCount = decisions.filter(
    decision => decision.status === 'unclaimed'
  ).length;

  return {
    schema: CHAPTER_REWARD_MIGRATION_SCHEMA,
    mappingVersion: CHAPTER_REWARD_MAPPING_VERSION,
    ok: errors.length === 0,
    errors,
    decisions,
    summary: {
      chapterCount: chapterMap.size,
      claimedCount,
      unclaimedCount,
      receiptCount: Object.keys(receipts).length,
      legacyRewardRefCount: decisions
        .reduce((count, decision) => count + decision.legacyRefs.length, 0)
    }
  };
}

/**
 * Backfill receipts only for chapters already marked cleared. This makes the
 * old clearedChapters marker explicit without granting, removing, or rewriting
 * any reward, hero ownership, shard, currency, or chapter progress.
 */
export function backfillClaimedChapterRewardReceipts({
  save = {},
  chapters = [],
  now = Date.now()
} = {}) {
  if (!isRecord(save)) {
    return {
      schema: CHAPTER_REWARD_MIGRATION_SCHEMA,
      ok: false,
      code: 'INVALID_SAVE_ROOT',
      message: 'Bản lưu không phải object.'
    };
  }

  const chapterMap = chapterListById(chapters);
  const clearedIndexes = normalizedClearedIndexes(save);
  const candidate = cloneJson(save);
  const receipts = cloneJson(receiptMap(save));
  const backfilledChapterIds = [];

  for (const [chapterId, entry] of chapterMap) {
    if (!clearedIndexes.has(entry.chapterIndex)) continue;
    if (isRecord(receipts[chapterId])) continue;
    receipts[chapterId] = rewardReceipt({
      chapterId,
      chapterIndex: entry.chapterIndex,
      reward: null,
      legacyRefs: chapterRewardRefs(entry.chapter),
      commandId: null,
      source: 'legacy-clearedChapters',
      now
    });
    backfilledChapterIds.push(chapterId);
  }

  candidate.chapterRewardReceipts = receipts;
  return {
    schema: CHAPTER_REWARD_MIGRATION_SCHEMA,
    ok: true,
    candidate,
    backfilledChapterIds,
    summary: {
      preservedClearedChapterCount: clearedIndexes.size,
      backfilledCount: backfilledChapterIds.length,
      rewardMutationCount: 0,
      ownershipMutationCount: 0
    }
  };
}

/**
 * Build a new save candidate for one explicit, not-yet-claimed chapter
 * reward. The input save is never mutated. A caller must persist the returned
 * candidate atomically and pass a stable commandId.
 */
export function commitChapterRewardClaim({
  save = {},
  chapterId,
  chapters = [],
  proposal = L02B_REWARD_MAPPING_PROPOSAL,
  commandId,
  now = Date.now()
} = {}) {
  if (!isRecord(save)) {
    return {
      schema: CHAPTER_REWARD_MIGRATION_SCHEMA,
      ok: false,
      code: 'INVALID_SAVE_ROOT',
      message: 'Bản lưu không phải object.'
    };
  }

  const normalizedChapterId = text(chapterId);
  const entry = chapterListById(chapters).get(normalizedChapterId);
  if (!entry) {
    return {
      schema: CHAPTER_REWARD_MIGRATION_SCHEMA,
      ok: false,
      code: 'UNKNOWN_CHAPTER',
      chapterId: normalizedChapterId
    };
  }

  const receipts = receiptMap(save);
  if (isClaimedReceipt(receipts[normalizedChapterId])) {
    return {
      schema: CHAPTER_REWARD_MIGRATION_SCHEMA,
      ok: false,
      code: 'ALREADY_CLAIMED',
      chapterId: normalizedChapterId,
      receipt: cloneJson(receipts[normalizedChapterId])
    };
  }
  if (normalizedClearedIndexes(save).has(entry.chapterIndex)) {
    return {
      schema: CHAPTER_REWARD_MIGRATION_SCHEMA,
      ok: false,
      code: 'ALREADY_CLAIMED',
      chapterId: normalizedChapterId,
      reason: 'clearedChapters'
    };
  }

  const normalizedCommandId = text(commandId);
  if (!normalizedCommandId) {
    return {
      schema: CHAPTER_REWARD_MIGRATION_SCHEMA,
      ok: false,
      code: 'MISSING_COMMAND_ID',
      chapterId: normalizedChapterId
    };
  }

  const row = proposalById(proposal).get(normalizedChapterId);
  const rewardValidation = validateReward(row, normalizedChapterId);
  if (!rewardValidation.ok) {
    return {
      schema: CHAPTER_REWARD_MIGRATION_SCHEMA,
      ...rewardValidation
    };
  }

  const reward = cloneJson(row.proposedReward);
  const candidate = cloneJson(save);
  const currentGold = Number(candidate.gold ?? 0);
  const currentGems = Number(candidate.gems ?? 0);
  if (!Number.isFinite(currentGold) || !Number.isFinite(currentGems)) {
    return {
      schema: CHAPTER_REWARD_MIGRATION_SCHEMA,
      ok: false,
      code: 'INVALID_SAVE_BALANCE',
      chapterId: normalizedChapterId
    };
  }
  if (candidate.shards !== undefined && !isRecord(candidate.shards)) {
    return {
      schema: CHAPTER_REWARD_MIGRATION_SCHEMA,
      ok: false,
      code: 'INVALID_SAVE_SHARDS',
      chapterId: normalizedChapterId
    };
  }

  candidate.gold = currentGold + finiteInteger(reward.gold);
  candidate.gems = currentGems + finiteInteger(reward.gems);
  candidate.shards = isRecord(candidate.shards)
    ? candidate.shards
    : {};
  candidate.shards[reward.shardHero] = finiteInteger(
    candidate.shards[reward.shardHero]
  ) + finiteInteger(reward.shards);

  const cleared = Array.isArray(candidate.clearedChapters)
    ? [...candidate.clearedChapters]
    : [];
  if (!cleared.some(value => Number(value) === entry.chapterIndex)) {
    cleared.push(entry.chapterIndex);
  }
  candidate.clearedChapters = cleared;

  const nextReceipts = isRecord(candidate.chapterRewardReceipts)
    ? candidate.chapterRewardReceipts
    : {};
  const receipt = rewardReceipt({
    chapterId: normalizedChapterId,
    chapterIndex: entry.chapterIndex,
    reward,
    legacyRefs: chapterRewardRefs(entry.chapter),
    commandId: normalizedCommandId,
    source: 'l02c-explicit-claim',
    now
  });
  nextReceipts[normalizedChapterId] = receipt;
  candidate.chapterRewardReceipts = nextReceipts;

  return {
    schema: CHAPTER_REWARD_MIGRATION_SCHEMA,
    ok: true,
    mappingVersion: CHAPTER_REWARD_MAPPING_VERSION,
    candidate,
    reward,
    receipt,
    chapterId: normalizedChapterId
  };
}
