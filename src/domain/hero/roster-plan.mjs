export const ROSTER_PLAN_SCHEMA = 'hon-viet-roster-plan/v1';

export const ROSTER_RARITY_ORDER = Object.freeze(['ssr', 'sr', 'a', 'b']);

export const ROSTER_TARGET_COUNTS = Object.freeze({
  ssr: 32,
  sr: 16,
  a: 16,
  b: 8
});

export const ROSTER_TARGET_TOTAL = Object.values(ROSTER_TARGET_COUNTS)
  .reduce((sum, count) => sum + count, 0);

function normalizedIds(ids) {
  return [...new Set((Array.isArray(ids) ? ids : [])
    .map(id => String(id ?? '').trim())
    .filter(Boolean))];
}

function normalizedTargets(targetCounts) {
  return Object.fromEntries(ROSTER_RARITY_ORDER.map(tier => {
    const value = Number(targetCounts?.[tier]);
    return [tier, Number.isInteger(value) && value >= 0
      ? value : ROSTER_TARGET_COUNTS[tier]];
  }));
}

export function normalizeRarity(value) {
  const rarity = String(value ?? '').trim().toLowerCase();
  return ROSTER_RARITY_ORDER.includes(rarity) ? rarity : null;
}

// This is a data-readiness summary, not an asset-readiness claim.
// Assetless planned heroes are intentionally absent until their data is authored.
export function summarizeRosterCapacity({
  ids = [],
  heroes = {},
  targetCounts = ROSTER_TARGET_COUNTS
} = {}) {
  const targets = normalizedTargets(targetCounts);
  const activeCounts = Object.fromEntries(
    ROSTER_RARITY_ORDER.map(tier => [tier, 0])
  );
  const activeIds = [];
  const unknownIds = [];
  const invalidIds = [];

  for (const id of normalizedIds(ids)) {
    const hero = heroes?.[id];
    if (!hero) {
      unknownIds.push(id);
      continue;
    }
    const rarity = normalizeRarity(hero.rarity);
    if (!rarity) {
      invalidIds.push(id);
      continue;
    }
    activeIds.push(id);
    activeCounts[rarity] += 1;
  }

  const remainingCounts = Object.fromEntries(
    ROSTER_RARITY_ORDER.map(tier => [
      tier, Math.max(0, targets[tier] - activeCounts[tier])
    ])
  );
  const targetTotal = ROSTER_RARITY_ORDER
    .reduce((sum, tier) => sum + targets[tier], 0);

  return {
    schema: ROSTER_PLAN_SCHEMA,
    targetCounts: targets,
    activeCounts,
    remainingCounts,
    targetTotal,
    activeTotal: activeIds.length,
    activeIds,
    unknownIds,
    invalidIds,
    withinCapacity: ROSTER_RARITY_ORDER
      .every(tier => activeCounts[tier] <= targets[tier])
  };
}

export function validateRosterCapacity({
  ids = [],
  heroes = {},
  targetCounts = ROSTER_TARGET_COUNTS
} = {}) {
  const summary = summarizeRosterCapacity({ ids, heroes, targetCounts });
  const errors = [];

  for (const id of summary.unknownIds) {
    errors.push({ code: 'UNKNOWN_HERO_ID', id });
  }
  for (const id of summary.invalidIds) {
    errors.push({
      code: 'INVALID_RARITY',
      id,
      rarity: heroes?.[id]?.rarity ?? null
    });
  }
  for (const tier of ROSTER_RARITY_ORDER) {
    if (summary.activeCounts[tier] > summary.targetCounts[tier]) {
      errors.push({
        code: 'RARITY_CAPACITY_EXCEEDED',
        rarity: tier,
        actual: summary.activeCounts[tier],
        target: summary.targetCounts[tier]
      });
    }
  }

  return { ok: errors.length === 0, errors, summary };
}
