"""Cat bo nut/khung Bang Hoi tu sheet gpt_image -> assets/ui/guild/ink/*.webp. Khong ve lai.
Sheet gpt_image la RGBA co san nen trong suot: DUNG ALPHA GOC, khong tu tao mat na
(tu tao mat na lam lo mau rac do/vang nam duoi pixel trong suot o mep)."""
import sys
from pathlib import Path
import numpy as np
from PIL import Image

SRC = Path(sys.argv[1])
OUT = Path(__file__).resolve().parents[1] / 'assets/ui/guild/ink'
OUT.mkdir(parents=True, exist_ok=True)
im = Image.open(SRC).convert('RGBA')
al = np.asarray(im)[..., 3]
k = im.size[0] / 1130.0
BOX = {
    'title': (20, 20, 905, 180), 'back': (920, 10, 1105, 195),
    'btn-red': (25, 235, 388, 355), 'btn-cream': (388, 235, 745, 355), 'btn-jade': (745, 235, 1105, 355),
    'row': (25, 390, 1105, 585), 'hero': (22, 598, 1108, 845),
    'tile': (165, 850, 505, 1190), 'tile2': (625, 850, 965, 1190),
}
for name, (x0, y0, x1, y1) in BOX.items():
    x0, y0, x1, y1 = [int(round(v * k)) for v in (x0, y0, x1, y1)]
    sub = al[y0:y1, x0:x1] > 24
    ys = np.where(sub.sum(1) > 2)[0]; xs = np.where(sub.sum(0) > 2)[0]
    out = im.crop((x0 + xs[0], y0 + ys[0], x0 + xs[-1] + 1, y0 + ys[-1] + 1))
    out = out.resize((max(1, int(out.size[0] * .7)), max(1, int(out.size[1] * .7))), Image.LANCZOS)
    arr = np.asarray(out).copy()
    arr[arr[..., 3] < 10] = 0  # xoa mau rac o pixel gan nhu trong suot
    Image.fromarray(arr, 'RGBA').save(OUT / (name + '.webp'), lossless=True)
    print(name, out.size)
