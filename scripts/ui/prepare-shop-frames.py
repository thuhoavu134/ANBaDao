"""Deterministic frame preparation from immutable concept sources."""
from pathlib import Path
from PIL import Image
import numpy as np
import hashlib, json
from collections import deque

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / 'assets/ui/shop/source'
OUT = ROOT / 'assets/ui/shop'


def sha(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()


def matte(rgb):
    h, w = rgb.shape[:2]
    cand = np.min(rgb, axis=2) > 228
    out = np.zeros((h, w), bool)
    q = deque()
    for y in range(h):
        for x in (0, w - 1):
            if cand[y, x]:
                out[y, x] = True
                q.append((y, x))
    for x in range(w):
        for y in (0, h - 1):
            if cand[y, x] and not out[y, x]:
                out[y, x] = True
                q.append((y, x))
    while q:
        y, x = q.popleft()
        for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
            if 0 <= ny < h and 0 <= nx < w and cand[ny, nx] and not out[ny, nx]:
                out[ny, nx] = True
                q.append((ny, nx))
    return np.where(out, 0, 255).astype('uint8')


def defringe(rgb, alpha):
    """Kill the anti-aliased white line the flood fill leaves on the border.

    Edge pixels are a blend of frame and white: they survive `matte` with full
    alpha and read as a jagged white halo. Weight them by whiteness within 2px
    of the outside, erode 1px, then feather 1px.
    """
    a = alpha.astype(np.float32)
    lum = rgb.astype(np.float32).mean(axis=2)
    sat = rgb.astype(np.float32).max(axis=2) - rgb.astype(np.float32).min(axis=2)
    near = np.clip((lum - 180.0) / 60.0, 0, 1) * np.clip((60.0 - sat) / 60.0, 0, 1)
    outside = alpha < 8
    rim = outside.copy()
    for _ in range(2):
        rim |= np.roll(rim, 1, 0) | np.roll(rim, -1, 0) | np.roll(rim, 1, 1) | np.roll(rim, -1, 1)
    rim &= ~outside
    a = np.where(rim, a * (1.0 - near), a)
    # 2px erosion (kills the 1-2px white line the fill leaves), then feather
    for _ in range(2):
        er = a.copy()
        for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            er = np.minimum(er, np.roll(a, (dy, dx), (0, 1)))
        a = er
    fe = a.copy()
    for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
        fe = (fe + np.roll(a, (dy, dx), (0, 1))) / 2.0
    return np.clip(fe, 0, 255).astype('uint8')


records = []
for key, dest in [('city', 'city/city-frame.png'), ('pts', 'city/pts-frame.png'), ('night', 'shop-lacquer-frame.png')]:
    src = SRC / (key + '.jpg')
    rgb = np.array(Image.open(src).convert('RGB'))
    alpha = matte(rgb)
    erased = []
    if key == 'night':
        ys, xs = np.where(alpha > 0)
        box = (int(xs.min()), int(ys.min()), int(xs.max() + 1), int(ys.max() + 1))
        rgb = rgb[box[1]:box[3], box[0]:box[2]].copy()
    else:
        box = (0, 0, rgb.shape[1], rgb.shape[0])
    h, w = rgb.shape[:2]
    rw, rh = round(w * .16), round(h * .105)
    rgb[:rh, w - rw:] = rgb[:rh, :rw][:, ::-1]
    if key == 'night':
        for band in [(0.783, 0.823), (0.860, 0.896)]:
            by0, by1 = int(h * band[0]), int(h * band[1])
            off = by1 - by0 + 6
            rgb[by0:by1, :] = rgb[by0 - off:by1 - off, :]
            erased.append({'band': band, 'pixels': [0, by0, w, by1 - by0], 'sourceOffsetY': -off})
    alpha = matte(rgb)
    if key != 'night':
        alpha = defringe(rgb, alpha)
    out = OUT / dest
    Image.fromarray(np.dstack([rgb, alpha])).save(out)
    records.append({'id': key, 'input': src.relative_to(ROOT).as_posix(), 'inputSha256': sha(src),
                    'crop': box, 'mirrorRect': [w - rw, 0, rw, rh], 'erasedBaked': erased,
                    'output': out.relative_to(ROOT).as_posix(), 'outputSha256': sha(out), 'size': [w, h]})

(OUT / 'frame-manifest.json').write_text(json.dumps({
    'version': 2,
    'transforms': 'border-connected white matte removal; mirrored authored top rail (right end only); night-only parchment band erase by vertical copy',
    'frames': records}, indent=2), encoding='utf-8')
print('frames ok', [(r['id'], r['size'], len(r['erasedBaked'])) for r in records])
