"""Final wiring: word mark src + battle.html reward icon map + fallback."""
from pathlib import Path
import re

root = Path(r'C:/lt/wt-result-icons')

# ------------------------------------------------- word mark image source
p = root / 'scripts/owner-refresh-20261018.mjs'
s = p.read_text(encoding='utf-8')
old = "src=\"assets/owner-refresh-20261018/result-\\\\${victory?'victory':'defeat'}-letters.png\""
new = "src=\"assets/result-art/result-word-v2/\\\\${victory?'victory':'defeat'}.svg\""
if old in s:
    s = s.replace(old, new)
    p.write_text(s, encoding='utf-8')
print('img src -> svg:', old not in s)

# ------------------------------------------------- battle.html card icons
p = root / 'battle.html'
s = p.read_text(encoding='utf-8')
old_map = '''RESULT_REWARD_ART_ICONS = Object.freeze({
    gold: "assets/result-icons-art/gold-imagen.png",
    mastery: "assets/result-icons-art/mastery-imagen.png",
    scroll: "assets/result-icons-art/scroll-imagen.png",
    shard: "assets/result-icons-art/hero-shard-imagen.png"
  });'''
new_map = '''RESULT_REWARD_ART_ICONS = Object.freeze({
    // Mirrors scripts/result-reward-icons.mjs; tests/result-reward-icons.test.mjs
    // fails the build if the two drift apart.
    gold: "assets/result-icons-art/gold-imagen.png",
    mastery: "assets/result-icons-art/mastery-imagen.png",
    scroll: "assets/result-icons-art/scroll-imagen.png",
    playerXp: "assets/result-icons-art/scroll-imagen.png",
    exp: "assets/result-icons-art/scroll-imagen.png",
    shard: "assets/result-icons-art/hero-shard-imagen.png",
    shards: "assets/result-icons-art/hero-shard-imagen.png",
    gems: "assets/ui/menu-v3233/icons/resource-gem-imagen.png"
  });
  const RESULT_REWARD_ART_FALLBACK = "assets/result-art/reward-empty-slot-imagen-v154.png";'''
assert old_map in s, 'card map anchor missing'
s = s.replace(old_map, new_map)
p.write_text(s, encoding='utf-8')
print('card map extended:', 'resource-gem-imagen' in s)

# show rewardArtIcon body so the fallback can be fixed
m = re.search(r'function rewardArtIcon\([\s\S]{0,400}?\n\s*\}', s)
print('--- rewardArtIcon ---')
print(m.group(0) if m else 'NOT FOUND')
