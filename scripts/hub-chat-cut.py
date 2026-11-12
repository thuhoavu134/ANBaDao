"""Cat dung mau B owner da duyet (gpt-image-1794485612468.png): cuon giay + nut tron do.
Xoa chu mau trong cuon (de game ghi chu that) bang inpaint, khong ve lai."""
import sys
from pathlib import Path
import numpy as np
from PIL import Image

SRC = Path(r'C:\Users\Admin\aicoworker\openclaw\workspace-main\openai-media\gpt-image-1794485612468.png')
OUT = Path(__file__).resolve().parents[1] / 'assets/ui/chat/hub'
OUT.mkdir(parents=True, exist_ok=True)
im = Image.open(SRC).convert('RGB')
W, H = im.size
k = W / 555.0  # anh duyet hien thi 555px ngang
box = lambda x0, y0, x1, y1: tuple(int(round(v * k)) for v in (x0, y0, x1, y1))

# 1) Cuon giay (ca 2 truc go)
sc = im.crop(box(12, 891, 480, 994))
a = np.asarray(sc).astype(np.int16)
h, w = a.shape[:2]
# vung chu: giua 2 truc, bo vien tren/duoi
x0, x1 = int(w * .055), int(w * .93)
y0, y1 = int(h * .14), int(h * .86)
reg = a[y0:y1, x0:x1]
lum = reg.mean(-1)
r, g, b = reg[..., 0], reg[..., 1], reg[..., 2]
paper = np.median(lum)
mask = (lum < paper - 38) | ((r - g > 55) & (r > 120))
try:
    import cv2
    m = np.zeros((h, w), np.uint8); m[y0:y1, x0:x1] = mask.astype(np.uint8) * 255
    m = cv2.dilate(m, np.ones((5, 5), np.uint8), 1)
    clean = cv2.inpaint(np.asarray(sc)[:, :, ::-1].copy(), m, 7, cv2.INPAINT_TELEA)[:, :, ::-1]
    print('inpaint cv2')
except ImportError:
    clean = np.asarray(sc).copy()
    # fallback: thay pixel chu bang trung binh hang giay sach
    for yy in range(y0, y1):
        row = clean[yy, x0:x1]; mk = mask[yy - y0]
        if (~mk).any(): row[mk] = row[~mk].mean(0).astype(np.uint8)
    print('inpaint fallback')
Image.fromarray(np.asarray(clean)).save(OUT / 'scroll.webp', quality=90)
print('scroll', sc.size, 'text px', int(mask.sum()))

# 2) Nut tron do (giu nguyen, alpha tron)
bx = im.crop(box(480, 909, 545, 974)).convert('RGBA')
bw, bh = bx.size
yy, xx = np.mgrid[0:bh, 0:bw]
cx, cy, rr = bw / 2, bh / 2, min(bw, bh) / 2 - 1
d = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2)
al = np.clip((rr - d) * 2 + 1, 0, 1)
arr = np.asarray(bx).copy(); arr[..., 3] = (al * 255).astype(np.uint8)
Image.fromarray(arr, 'RGBA').save(OUT / 'say.webp', quality=92)
print('say', bx.size)
