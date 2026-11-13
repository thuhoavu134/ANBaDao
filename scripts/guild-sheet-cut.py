"""Cat asset bang chuc nang Bang Hoi (mau B) tu 2 sheet gpt_image. numpy + PIL, khong ve lai."""
import sys
from pathlib import Path
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets/ui/guild/sheet'
(OUT / 'icons').mkdir(parents=True, exist_ok=True)
COMP, ICON = Path(sys.argv[1]), Path(sys.argv[2])

def spans(v, gap, mn):
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

def alpha_of(im):
    a = np.asarray(im.convert('RGBA'))[..., 3]
    if a.min() > 200:  # khong co kenh alpha that: coi nen den la nen
        rgb = np.asarray(im.convert('RGB')).max(-1)
        a = np.where(rgb > 14, 255, 0).astype(np.uint8)
    return a

def crop(im, a, x0, y0, x1, y1):
    sub = a[y0:y1, x0:x1] > 10
    ys, xs = np.where(sub)
    return im.crop((x0 + xs.min(), y0 + ys.min(), x0 + xs.max() + 1, y0 + ys.max() + 1))

# ---- thanh phan
im = Image.open(COMP).convert('RGBA'); a = alpha_of(im)
rows = spans((a > 10).sum(1), 14, 20)
print('component rows', rows)
names = [['panel'], ['cap'], ['bead-on', 'bead-off', 'close'], ['track', 'fill']]
for (y0, y1), nm in zip(rows, names):
    cols = spans((a[y0:y1] > 10).sum(0), 12, 10)
    print(' row', (y0, y1), 'cols', cols)
    for (x0, x1), n in zip(cols, nm):
        c = crop(im, a, x0, y0, x1, y1)
        if n == 'panel':
            c = c.resize((720, int(720 * c.size[1] / c.size[0])), Image.Resampling.LANCZOS)
        c.save(OUT / (n + '.webp'), quality=88, method=6)
        print('  ', n, c.size)

# ---- icon
im = Image.open(ICON).convert('RGBA')
W, H = im.size
rgb = np.asarray(im.convert('RGB')).max(-1)
mask = rgb > 60  # vien toi mo khong tinh la huy hieu
COLS, ROWS = 6, 4
cw, ch = W / COLS, H / ROWS
k = 0
for r in range(ROWS):
    for cidx in range(COLS):
        x0, y0, x1, y1 = int(cidx * cw), int(r * ch), int((cidx + 1) * cw), int((r + 1) * ch)
        sub = mask[y0:y1, x0:x1]
        ys, xs = np.where(sub)
        bx0, bx1, by0, by1 = x0 + xs.min(), x0 + xs.max() + 1, y0 + ys.min(), y0 + ys.max() + 1
        side = max(bx1 - bx0, by1 - by0)
        cx, cy = (bx0 + bx1) // 2, (by0 + by1) // 2
        box = (cx - side // 2, cy - side // 2, cx - side // 2 + side, cy - side // 2 + side)
        c = im.crop(box)
        # nen den ngoai huy hieu -> trong suot theo do sang
        arr = np.asarray(c).copy()
        lum = arr[..., :3].max(-1).astype(np.float32)
        a0 = np.clip((lum - 18) / 40.0, 0, 1)
        hh, ww = a0.shape
        yy, xx = np.mgrid[0:hh, 0:ww]
        dist = np.sqrt((xx - ww / 2.0) ** 2 + (yy - hh / 2.0) ** 2)
        circ = np.clip((ww / 2.0 - 1.0 - dist) / 3.0, 0, 1)  # vung ngoai duong tron: goc o -> trong suot
        arr[..., 3] = (a0 * circ * 255).astype(np.uint8)
        c = Image.fromarray(arr, 'RGBA').resize((192, 192), Image.Resampling.LANCZOS)
        k += 1
        c.save(OUT / 'icons' / ('%02d.webp' % k), quality=90, method=6)
        print(k, (r, cidx), 'side', side)
print('icons', k)
