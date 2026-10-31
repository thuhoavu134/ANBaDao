"""Bake the vector word mark + unified reward-icon mapping into the build sources."""
from pathlib import Path

root = Path(r'C:/lt/wt-result-icons')

# ---------------------------------------------------------------- 1. word mark
p = root / 'scripts/owner-refresh-20261018.mjs'
s = p.read_text(encoding='utf-8')

old_img = """  s=once(s,'<div class="irv-hero-wrap">',`<img class="irv-word" alt="\\${victory?'Victory':'Defeat'}" src="assets/owner-refresh-20261018/result-\\${victory?'victory':'defeat'}-letters.png"><div class="irv-hero-wrap">`);"""
new_img = """  // Result word mark: vector outlines (result-words-v2.py) instead of a 480px raster.
  s=once(s,'<div class="irv-hero-wrap">',`<img class="irv-word" alt="\\${victory?'Victory':'Defeat'}" src="assets/result-art/result-word-v2/\\${victory?'victory':'defeat'}.svg"><div class="irv-hero-wrap">`);"""
assert old_img in s, 'word img anchor missing'
s = s.replace(old_img, new_img)

old_css = """ /* Letter pixels are a separate lower layer; never crop the wing animation. */
 .irv-title{clip-path:none!important;z-index:3}
 .irv-word{position:absolute;left:50%;transform:translateX(-50%);width:100%;top:0;z-index:2;pointer-events:none;aspect-ratio:16/9;object-fit:contain}
 .irv-defeat .irv-word{top:1.5%}"""
new_css = """ /* Word mark sits inside the wing crest; wings stay the top layer. */
 .irv-title{clip-path:none!important;z-index:3}
 .irv-word{position:absolute!important;left:50%!important;transform:translateX(-50%)!important;
   width:min(72vw,331px)!important;height:auto!important;aspect-ratio:auto!important;object-fit:contain!important;
   top:calc(min(100vw,56.25vh) * .22)!important;z-index:2!important;pointer-events:none;
   filter:drop-shadow(0 5px 9px rgba(30,13,3,.55))}
 .irv-defeat .irv-word{width:min(64vw,294px)!important;top:calc(min(100vw,56.25vh) * .24)!important}"""
assert old_css in s, 'word css anchor missing'
s = s.replace(old_css, new_css)
p.write_text(s, encoding='utf-8')
print('owner-refresh patched:', 'result-word-v2' in s)

# ------------------------------------------------- 2. shared reward icon map
new_module = '''// Single source of truth for result-screen reward icons.
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
'''
(root / 'scripts/result-reward-icons.mjs').write_text(new_module, encoding='utf-8')
print('module written')

# --------------------------------------------- 3. result loot tiles -> module
p = root / 'scripts/result-screen-contract-v1.mjs'
s = p.read_text(encoding='utf-8')
old_icons = """   const icons={gold:'assets/result-icons-art/gold-imagen.png',mastery:'assets/result-icons-art/mastery-imagen.png',playerXp:'assets/result-icons-art/scroll-imagen.png',gems:'assets/meta/economy/icon-gems.png',shards:'assets/result-icons-art/hero-shard-imagen.png'};"""
new_icons = """   const icons=${REWARD_ICON_MAP};const fallback=${REWARD_ICON_FALLBACK};"""
assert old_icons in s, 'loot icon map anchor missing'
s = s.replace(old_icons, new_icons)
s = s.replace("esc(icons[r.id]||'assets/result-icons-art/scroll-imagen.png')", "esc(icons[r.id]||fallback)")
p.write_text(s, encoding='utf-8')
print('contract script patched')
