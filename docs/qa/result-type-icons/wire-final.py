"""Line-based, idempotent wiring for word mark CSS + reward icon map."""
from pathlib import Path
import re

root = Path(r'C:/lt/wt-result-icons')

# ---------------------------------------------------------------- word mark
p = root / 'scripts/owner-refresh-20261018.mjs'
lines = p.read_text(encoding='utf-8').split('\n')
out = []
changed_css = False
for line in lines:
    if line.startswith('.irv-title{clip-path:none!important;z-index:3}'):
        out.append(line)
        out.append('.irv-word{position:absolute!important;left:50%!important;transform:translateX(-50%)!important;'
                   'width:min(72vw,331px)!important;height:auto!important;aspect-ratio:auto!important;object-fit:contain!important;'
                   'top:calc(min(100vw,56.25vh) * .22)!important;z-index:2!important;pointer-events:none;'
                   'filter:drop-shadow(0 5px 9px rgba(30,13,3,.55))}')
        changed_css = True
        continue
    if line.startswith('.irv-word{position:absolute;left:50%'):
        continue          # superseded by the block above
    if line.startswith('.irv-defeat .irv-word{top:1.5%}'):
        out.append('.irv-defeat .irv-word{width:min(64vw,294px)!important;top:calc(min(100vw,56.25vh) * .24)!important}')
        continue
    out.append(line)
s = '\n'.join(out)
s = s.replace("/* Letter pixels are a separate lower layer; never crop the wing animation. */",
              "/* Word mark: vector outlines sized to the wing crest; wings stay the top layer. */")
p.write_text(s, encoding='utf-8')
print('css patched:', changed_css, '| svg src:', 'result-word-v2' in s)

# ---------------------------------------------------------------- contract
p = root / 'scripts/result-screen-contract-v1.mjs'
s = p.read_text(encoding='utf-8')
if 'result-reward-icons.mjs' not in s:
    idx = max(i for i, line in enumerate(s.split('\n')[:20]) if line.startswith('import '))
    ls = s.split('\n')
    ls.insert(idx + 1, "import { rewardIconMapLiteral, REWARD_ICON_FALLBACK } from './result-reward-icons.mjs';")
    ls.insert(idx + 2, "")
    ls.insert(idx + 3, "// Embedded into the generated in-page reward helper.")
    ls.insert(idx + 4, "const REWARD_ICON_MAP = rewardIconMapLiteral();")
    ls.insert(idx + 5, "const REWARD_ICON_FALLBACK_LITERAL = JSON.stringify(REWARD_ICON_FALLBACK);")
    s = '\n'.join(ls)

old_icons = """   const icons={gold:'assets/result-icons-art/gold-imagen.png',mastery:'assets/result-icons-art/mastery-imagen.png',playerXp:'assets/result-icons-art/scroll-imagen.png',gems:'assets/meta/economy/icon-gems.png',shards:'assets/result-icons-art/hero-shard-imagen.png'};"""
if old_icons in s:
    s = s.replace(old_icons, "   const icons=${REWARD_ICON_MAP};const fallback=${REWARD_ICON_FALLBACK_LITERAL};")
s = s.replace("esc(icons[r.id]||'assets/result-icons-art/scroll-imagen.png')", "esc(icons[r.id]||fallback)")
p.write_text(s, encoding='utf-8')
print('contract:', 'REWARD_ICON_MAP' in s, '| old map gone:', old_icons not in s)

# ---------------------------------------------------------------- battle cards
p = root / 'battle.html'
s = p.read_text(encoding='utf-8')
m = re.search(r'const RESULT_REWARD_ART_ICONS\s*=\s*\{[^}]*\};', s) or re.search(r'RESULT_REWARD_ART_ICONS\s*=\s*Object\.freeze\(\{[^}]*\}\);', s)
print('CARD MAP FOUND:', bool(m), (m.group(0)[:500] if m else ''))
