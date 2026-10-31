"""Final geometry: lift the word mark into the empty crest band (clear of urn/hero)."""
from pathlib import Path

p = Path(r'C:/lt/wt-result-icons/scripts/owner-refresh-20261018.mjs')
s = p.read_text(encoding='utf-8')

s = s.replace('width:min(72vw,331px)!important', 'width:min(62vw,286px)!important')
s = s.replace('top:calc(min(100vw,56.25vh) * .22)!important', 'top:calc(min(100vw,56.25vh) * .085)!important')
s = s.replace('.irv-defeat .irv-word{width:min(64vw,294px)!important;top:calc(min(100vw,56.25vh) * .24)!important}',
              '.irv-defeat .irv-word{width:min(46vw,212px)!important;top:calc(min(100vw,56.25vh) * .075)!important}')
p.write_text(s, encoding='utf-8')
print('victory 62vw/.085:', 'min(62vw,286px)' in s and '56.25vh) * .085' in s)
print('defeat 46vw/.075:', 'min(46vw,212px)' in s and '56.25vh) * .075' in s)
