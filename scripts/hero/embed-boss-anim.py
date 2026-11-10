"""Nạp anim.json của một boss vào HUNT_ANIM trong src/ui/hunt-battle-visual.js.

  python scripts/hero/embed-boss-anim.py --slug khaos

Chạy lại được nhiều lần: nếu slug đã có thì thay bằng bản mới.
"""
import argparse, json, re
from pathlib import Path

ap = argparse.ArgumentParser()
ap.add_argument('--slug', required=True)
a = ap.parse_args()
root = Path(__file__).resolve().parents[2]
p = root / 'src/ui/hunt-battle-visual.js'
s = p.read_text(encoding='utf-8')
meta = json.loads((root / f'assets/hunt/{a.slug}/anim.json').read_text(encoding='utf-8'))
head = 'const HUNT_ANIM = Object.freeze({ '
assert head in s, 'HUNT_ANIM anchor missing'
key = f'"{a.slug}": '
entry = key + json.dumps(meta, ensure_ascii=False) + ', '
if key + '{"schema"' in s:
    # thay entry cũ: tìm đoạn từ key tới ', "<slug kế>": {"schema"' hoặc '});'
    i = s.index(key + '{"schema"')
    depth, j = 0, i + len(key)
    while True:
        c = s[j]
        if c == '{': depth += 1
        elif c == '}':
            depth -= 1
            if depth == 0: j += 1; break
        j += 1
    if s[j:j + 2] == ', ': j += 2
    s = s[:i] + entry + s[j:]
    print('replaced', a.slug)
else:
    s = s.replace(head, head + entry, 1)
    print('added', a.slug)
p.write_text(s, encoding='utf-8')
print('clips', list(meta['clips'].keys()))
