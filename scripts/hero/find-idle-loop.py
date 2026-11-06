"""Tim cap khung dau-cuoi khop nhat de idle lap MUOT ma KHONG phai tron khung (khong nhoe).

Vi sao: packager mac dinh tron 4 mau cuoi vao cac khung dan ve START khi diem noi chua khop.
Tron hai hinh khac nhau -> hinh chong mo ("nhoe"). Neu tim duoc cua so ma khung SAU khung cuoi
gan nhu trung khung dau, ta tat tron va 30 frame deu la hinh goc sach.

Cach do: lay 30 mau deu tu start..end (giu 2 dau). Khung "tiep theo" sau end la end + buoc,
buoc = (end-start)/29 (noi suy giua 2 khung video). Seam = khac biet pixel trung binh giua khung tiep theo
va khung start, tren vung nhan vat da thu nho. Chia cho buoc thuong (trung vi khac biet giua 2 mau lien tiep)
-> ty le. Ty le < 1 nghia la cho noi con em hon mot buoc binh thuong = lap khong thay.

Dung:
  python scripts/hero/find-idle-loop.py <idle.mp4> [--samples 30] [--min-sec 2.5] [--top 8]
In ra cac cua so tot nhat (start, end tinh tu 0). Dua cap tot nhat vao packager voi IDLE_SEAM_CROSSFADE=0
(xem docs/HERO-INTEGRATION-STANDARD.md, muc "IDLE LAP MUOT KHONG NHOE").
"""
import argparse, subprocess, tempfile
from pathlib import Path
import numpy as np
from PIL import Image

ap = argparse.ArgumentParser()
ap.add_argument('video')
ap.add_argument('--samples', type=int, default=30)
ap.add_argument('--min-sec', type=float, default=2.5)
ap.add_argument('--fps', type=float, default=24.0)
ap.add_argument('--top', type=int, default=8)
a = ap.parse_args()

with tempfile.TemporaryDirectory(prefix='idle-loop-') as td:
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', a.video, '-vsync', '0', str(Path(td) / 'f_%04d.png')], check=True)
    files = sorted(Path(td).glob('f_*.png'))
    imgs = [np.asarray(Image.open(f).convert('RGB'), dtype=np.int16) for f in files]

# vung nhan vat = hop cac diem khong phai nen xanh tren toan clip
mask = np.zeros(imgs[0].shape[:2], bool)
for im in imgs[::4]:
    r, g, b = im[..., 0], im[..., 1], im[..., 2]
    mask |= (g - np.maximum(r, b)) < 60
ys, xs = np.where(mask)
pad = 20
box = (max(0, xs.min() - pad), max(0, ys.min() - pad), min(imgs[0].shape[1], xs.max() + pad), min(imgs[0].shape[0], ys.max() + pad))
A = np.stack([np.asarray(Image.fromarray(im.astype(np.uint8)).crop(box).resize((176, 200), Image.BILINEAR), dtype=np.float32) for im in imgs])
n, S = len(A), a.samples
minL = int(a.min_sec * a.fps)

def diff(x, y): return float(np.abs(x - y).mean())
res = []
for i in range(n):
    for j in range(i + minL, n):
        step = (j - i) / (S - 1)
        t = j + step
        t0 = int(np.floor(t))
        if t0 + 1 >= n: continue
        w = t - t0
        nxt = (1 - w) * A[t0] + w * A[t0 + 1]
        seam = diff(nxt, A[i])
        idx = [round(i + k * step) for k in range(S)]
        typ = float(np.median([diff(A[idx[k]], A[idx[k + 1]]) for k in range(S - 1)]))
        res.append((seam / max(typ, 1e-6), seam, typ, i, j, (j - i) / a.fps))
res.sort()
print(f'{n} khung, vung nhan vat {box}')
for r in res[:a.top]:
    print('ty le %.3f  seam %.2f  buoc thuong %.2f  start %d  end %d  (%.2fs)' % r)
