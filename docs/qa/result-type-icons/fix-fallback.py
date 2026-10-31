"""Fix the battle.html reward-icon fallback chain: no silent mastery mislabelling."""
from pathlib import Path

p = Path(r'C:/lt/wt-result-icons/battle.html')
s = p.read_text(encoding='utf-8')

old = '''    if(id.includes("scroll")||name.includes("cuộn")||name.includes("hồn ức"))return RESULT_REWARD_ART_ICONS.scroll;
    if(id.includes("shard")||name.includes("mảnh"))return RESULT_REWARD_ART_ICONS.shard;
    return item.icon || RESULT_REWARD_ART_ICONS.mastery;'''
new = '''    if(id.includes("scroll")||name.includes("cuộn")||name.includes("hồn ức")||id.includes("exp"))return RESULT_REWARD_ART_ICONS.scroll;
    if(id.includes("shard")||name.includes("mảnh"))return RESULT_REWARD_ART_ICONS.shard;
    if(id.includes("gem")||name.includes("ngọc"))return RESULT_REWARD_ART_ICONS.gems;
    // Never borrow another reward's art for an unknown id: that reads as a
    // mislabelled reward. Fall through to the neutral empty slot instead.
    return item.icon || RESULT_REWARD_ART_FALLBACK;'''
assert old in s, 'fallback chain anchor missing'
s = s.replace(old, new)
p.write_text(s, encoding='utf-8')
print('fallback fixed:', 'RESULT_REWARD_ART_FALLBACK;' in s)
