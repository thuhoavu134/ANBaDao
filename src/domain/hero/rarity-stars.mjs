// Owner rule 2026-10-27: SSR starts at five real stars. Six-star investments survive.
export function rarityBaseStars(definition) {
  return String(definition?.rarity || '').toLowerCase() === 'ssr' ? 5 : 1;
}
export function initialHeroStars(definition) {
  const base = rarityBaseStars(definition);
  return { stars: base, ...(base === 5 ? { rarityStarsVersion: 1, legacyStarRefund: 0 } : {}) };
}
export function normalizeRarityStars(player, definitions) {
  if (!player?.heroes) return player;
  for (const [id, hero] of Object.entries(player.heroes)) {
    if (!hero || rarityBaseStars(definitions?.[id]) !== 5) continue;
    const oldStars = Math.max(1, Math.min(6, Math.floor(Number(hero.stars) || 1)));
    if (hero.rarityStarsVersion !== 1) {
      // Preserve previously paid shard investment for Tẩy Tủy, once only.
      const paidBase = Math.min(5, oldStars);
      hero.legacyStarRefund = hero.owned ? 10 * paidBase * (paidBase - 1) : 0;
      hero.rarityStarsVersion = 1;
    }
    hero.stars = Math.max(5, oldStars);
  }
  return player;
}
export function refundableHeroStarShards(hero, definition) {
  const base = rarityBaseStars(definition);
  const stars = Math.max(base, Math.min(6, Math.floor(Number(hero?.stars) || base)));
  const legacy = base === 5 ? Math.max(0, Number(hero?.legacyStarRefund) || 0) : 0;
  return 10 * (stars * (stars - 1) - base * (base - 1)) + legacy;
}
