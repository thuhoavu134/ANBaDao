"""Lam sach cuon giay da cat tu mau B: xoa het chu mau (thay bang mau giay xung quanh), bo nen thua ngoai cuon."""
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter

OUT = Path(__file__).resolve().parents[1] / 'assets/ui/chat/hub'
SRC = Path(r'C:\Users\Admin\aicoworker\openclaw\workspace-main\openai-media\gpt-image-1794485612468.png')
im = Image.open(SRC).convert('RGB')
k = im.size[0] / 555.0
sc = im.crop(tuple(int(round(v * k)) for v in (12, 891, 480, 994)))
w, h = sc.size
a = np.asarray(sc).astype(np.float32)
rl, rr, pt, pb = 32, w - 32, 14, h - 14
x0, x1, y0, y1 = rl + 4, rr - 4, pt + 6, pb - 6

reg = a[y0:y1, x0:x1]
lum = reg.mean(-1)
# giay sang: chu = toi hon nhieu, hoac do (tag kenh)
pm = np.percentile(lum, 70)
mask = (lum < pm - 22) | ((reg[..., 0] - reg[..., 2] > 70) & (lum < pm - 5))
m = Image.fromarray((mask * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(7))
mask = np.asarray(m) > 0
fill = reg.copy()
# lap: lap day pixel chu bang trung binh lan can khong phai chu
known = ~mask
for _ in range(40):
    if known.all(): break
    acc = np.zeros_like(fill); cnt = np.zeros(mask.shape, np.float32)
    for dy in (-2, -1, 0, 1, 2):
        for dx in (-2, -1, 0, 1, 2):
            sh = np.roll(np.roll(fill * known[..., None], dy, 0), dx, 1)
            kn = np.roll(np.roll(known.astype(np.float32), dy, 0), dx, 1)
            acc += sh; cnt += kn
    new = (~known) & (cnt > 0)
    fill[new] = acc[new] / cnt[new][:, None]
    known = known | new
# lam muot nhe vung vua lap de khong lo vet
sm = np.asarray(Image.fromarray(fill.astype(np.uint8)).filter(ImageFilter.GaussianBlur(2))).astype(np.float32)
fill[mask] = sm[mask]
out = a.copy(); out[y0:y1, x0:x1] = fill

al = np.zeros((h, w), np.float32); al[pt:pb, :] = 1; al[:, :rl] = 1; al[:, rr:] = 1
img = np.dstack([np.clip(out, 0, 255).astype(np.uint8), (al * 255).astype(np.uint8)])
Image.fromarray(img, 'RGBA').save(OUT / 'scroll.webp', quality=90)
Image.fromarray(img, 'RGBA').save(r'C:\lt\tools\pw\scroll-v3.png')
print('ok', int(mask.sum()))
