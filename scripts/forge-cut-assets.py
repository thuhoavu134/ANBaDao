"""Tach nen xanh + cat vat the tu sheet gpt_image cho man Ren (mau A). Chi can numpy + PIL."""
from pathlib import Path
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / 'assets/ui/forge/v2/raw'
OUT = ROOT / 'assets/ui/forge/v2'


def key_green(img):
    a = np.asarray(img.convert('RGB')).astype(np.float32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    dom = g - np.maximum(r, b)
    alpha = np.clip(1.0 - (dom - 30) / 60.0, 0, 1)
    g2 = np.where(dom > 0, np.maximum(r, b) + np.clip(dom, 0, None) * 0.15, g)
    rgb = np.stack([r, g2, b], -1).clip(0, 255).astype(np.uint8)
    return rgb, (alpha * 255).astype(np.uint8)


def spans(v, min_gap, min_len):
    on = v > 0
    res, start, gap = [], None, 0
    for i, x in enumerate(on):
        if x:
            if start is None:
                start = i
            gap = 0
            end = i
        elif start is not None:
            gap += 1
            if gap >= min_gap:
                if end - start + 1 >= min_len:
                    res.append((start, end + 1))
                start = None
    if start is not None and end - start + 1 >= min_len:
        res.append((start, end + 1))
    return res


def grid(name, min_gap_y=14, min_gap_x=14, min_len=24, thresh=3):
    rgb, al = key_green(Image.open(RAW / name))
    m = (al > 60).astype(np.int32)
    out = []
    for y0, y1 in spans((m.sum(1) > thresh).astype(int), min_gap_y, min_len):
        band = m[y0:y1]
        for x0, x1 in spans((band.sum(0) > thresh).astype(int), min_gap_x, min_len):
            sub = m[y0:y1, x0:x1]
            ys = np.where(sub.sum(1) > 0)[0]
            yy0, yy1 = y0 + ys[0], y0 + ys[-1] + 1
            pad = 3
            Y0, Y1 = max(0, yy0 - pad), min(m.shape[0], yy1 + pad)
            X0, X1 = max(0, x0 - pad), min(m.shape[1], x1 + pad)
            piece = np.dstack([rgb[Y0:Y1, X0:X1], al[Y0:Y1, X0:X1]])
            out.append((y0, x0, X1 - X0, Y1 - Y0, Image.fromarray(piece, 'RGBA')))
    return out


def save(img, name, maxw=None):
    if maxw and img.width > maxw:
        img = img.resize((maxw, round(img.height * maxw / img.width)), Image.LANCZOS)
    p = OUT / name
    img.save(p, 'WEBP', quality=88, method=6)
    print(name, img.size, p.stat().st_size)


btn = grid('buttons-sheet.png', 20, 30, 60)
print('buttons found', len(btn), [(p[0], p[1], p[2], p[3]) for p in btn])
for nm, p in zip(['btn-ren', 'btn-songren', 'btn-cuonghoa', 'btn-trangbi', 'btn-phanra', 'btn-huy'], btn):
    save(p[4], nm + '.webp', 520)

kit = grid('kit-sheet.png', 14, 18, 30)
print('kit found', len(kit), [(p[0], p[1], p[2], p[3]) for p in kit])
for nm, p in zip(['plaque', 'TABS', 'bar-frame', 'bar-fill', 'panel'], kit):
    if nm != 'TABS':
        save(p[4], nm + '.webp', 900)
        continue
    t = np.asarray(p[4]); a = (t[..., 3] > 60).astype(int)
    cols = spans((a.sum(0) > 1).astype(int), 3, 40)
    print('tab cols', cols)
    if len(cols) != 3:
        cs = a.sum(0); w = len(cs); cuts = []
        for lo, hi in ((w // 6, w // 2), (w // 2, w * 5 // 6)):
            cuts.append(lo + int(np.argmin(cs[lo:hi])))
        cols = [(0, cuts[0]), (cuts[0], cuts[1]), (cuts[1], w)]
        print('tab cols (min cut)', cols)
    for tn, (x0, x1) in zip(['tab-vukhi', 'tab-giap', 'tab-trangsuc'], cols):
        sub = t[:, x0:x1]; ys = np.where(sub[..., 3].max(1) > 60)[0]
        save(Image.fromarray(np.ascontiguousarray(sub[ys[0]:ys[-1] + 1]), 'RGBA'), tn + '.webp', 420)

sc = Image.open(RAW / 'scene.png').convert('RGB').resize((1152, 768), Image.LANCZOS)
sc.save(OUT / 'scene.webp', 'WEBP', quality=82, method=6)
print('scene.webp', sc.size, (OUT / 'scene.webp').stat().st_size)
