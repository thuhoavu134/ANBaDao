// Single source of truth for result-screen reward icons.
//
// One logical reward id -> one canonical asset, everywhere it is drawn:
//   * the battle result loot tiles (renderResultRewards, injected into battle.html)
//   * the in-battle reward cards (RESULT_REWARD_ART_ICONS in battle.html)
//   * the campaign reward chips (src/ui/campaign-scene.js sceneRewards)
//
// All ids resolve inside the same painterly "result-icons-art" family, except
// gems, which has no member in that family; it points at the game's canonical
// resource gem instead of the shop glyph (that one has baked "300" text on it).
//
// tests/result-reward-icons.test.mjs fails if any surface drifts from this map.

export const REWARD_ICON_BASE = 'assets/result-icons-art/';

export const REWARD_ICONS = Object.freeze({
  gold: REWARD_ICON_BASE + 'gold-imagen.png',
  mastery: REWARD_ICON_BASE + 'mastery-imagen.png',
  playerXp: REWARD_ICON_BASE + 'scroll-imagen.png',
  exp: REWARD_ICON_BASE + 'scroll-imagen.png',
  shards: REWARD_ICON_BASE + 'hero-shard-imagen.png',
  gems: 'assets/ui/menu-v3233/icons/resource-gem-imagen.png',
});

// Unknown ids must not borrow another reward's art (the old fallback showed a
// mastery orb for anything unrecognised). This is the neutral empty-slot frame.
export const REWARD_ICON_FALLBACK = 'assets/result-art/reward-empty-slot-imagen-v154.png';

export function rewardIcon(id) {
  const key = String(id ?? '').trim();
  return REWARD_ICONS[key] || REWARD_ICON_FALLBACK;
}

// Ready-to-embed literal for the generated scripts that run inside the page.
export function rewardIconMapLiteral() {
  return JSON.stringify(REWARD_ICONS);
}
