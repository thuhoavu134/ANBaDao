"""Cat bo nut UI v3 (gpt_image, nen den) cho man Ren 12/11. numpy + PIL."""
import sys
from pathlib import Path
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = Path(sys.argv[1])
OUT = ROOT / 'assets/ui/forge/v3'
OUT.mkdir(parents=True, exist_ok=True)
(OUT / 'raw').mkdir(exist_ok=True)
Image.open(SRC).save(OUT / 'raw' / 'ui-sheet.png')

src = Image.open(SRC).convert('RGBA')
a = np.asarray(src)[..., :3].astype(np.float32)
alpha = np.asarray(src)[..., 3].astype(np.float32) / 255.0

def spans(v, gap=12, mn=30):
    on = v > 0
    res, s, g, e = [], None, 0, 0
    for i, x in enumerate(on):
        if x:
            if s is None: s = i
            g = 0; e = i
        elif s is not None:
            g += 1
            if g >= gap:
                if e - s + 1 >= mn: res.append((s, e + 1))
                s = None
    if s is not None and e - s + 1 >= mn: res.append((s, e + 1))
    return res

mask = alpha > .5
names = [['btn-gold', 'btn-fire', 'btn-jade'], ['tab-on', 'tab-off', 'badge'], ['slot', 'slot-on', 'plate']]
rows = spans(mask.sum(1) > 3)
print('rows', rows)
for ri, (y0, y1) in enumerate(rows[:3]):
    cols = spans(mask[y0:y1].sum(0) > 2)
    print(' row', ri, cols)
    for ci, (x0, x1) in enumerate(cols[:3]):
        sub = mask[y0:y1, x0:x1]
        ys = np.where(sub.any(1))[0]
        yy0, yy1 = y0 + ys[0], y0 + ys[-1] + 1
        rgba = np.dstack([a[yy0:yy1, x0:x1].astype(np.uint8), (alpha[yy0:yy1, x0:x1] * 255).astype(np.uint8)])
        im = Image.fromarray(rgba, 'RGBA')
        # khung o do: giu long den dac
        if names[ri][ci].startswith('slot') or names[ri][ci] == 'plate':
            arr = np.asarray(im).copy(); h, w = arr.shape[:2]
            arr[int(h*.12):int(h*.88), int(w*.12):int(w*.88), 3] = 255
            im = Image.fromarray(arr, 'RGBA')
        im.save(OUT / (names[ri][ci] + '.webp'), quality=90)
        print('  ', names[ri][ci], im.size)
