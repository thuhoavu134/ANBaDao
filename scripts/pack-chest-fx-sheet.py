#!/usr/bin/env python3
"""Pack already-extracted 480px frames into magenta-keyed RGBA sheets."""
from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
FX = ROOT / "assets/ui/festival/fx"
ART = Path("/workspace/artifacts/chest-fx")
COLS = 12
CELL = 180
MAGENTA = np.array([255.0, 0.0, 255.0], dtype=np.float32)
DIST = 118.0


def dilate(mask: np.ndarray, n: int) -> np.ndarray:
    out = mask.copy()
    for _ in range(n):
        nxt = out.copy()
        nxt[1:, :] |= out[:-1, :]
        nxt[:-1, :] |= out[1:, :]
        nxt[:, 1:] |= out[:, :-1]
        nxt[:, :-1] |= out[:, 1:]
        out = nxt
    return out


def key_magenta(im: Image.Image) -> Image.Image:
    arr = np.array(im.convert("RGBA"))
    rgb = arr[:, :, :3].astype(np.float32)
    d = np.linalg.norm(rgb - MAGENTA, axis=2)
    r, g, b = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
    pinkish = (r > 140) & (b > 140) & (g < 160) & ((r + b) / 2 - g > 28)
    key = dilate((d <= DIST) | pinkish, 3)
    out = arr.copy()
    out[key, 3] = 0
    fringe = (~key) & (d < DIST + 36)
    if fringe.any():
        fr = out[fringe].astype(np.float32)
        spill = np.maximum(0.0, (fr[:, 0] + fr[:, 2]) / 2.0 - fr[:, 1])
        factor = np.clip(1.0 - spill / 160.0, 0.15, 1.0)
        fr[:, 0] = np.clip(fr[:, 0] - spill * 0.4, 0, 255)
        fr[:, 2] = np.clip(fr[:, 2] - spill * 0.4, 0, 255)
        fr[:, 3] = np.clip(fr[:, 3] * factor, 0, 255)
        out[fringe] = fr.astype(np.uint8)
    out[out[:, :, 3] == 0, :3] = 0
    return Image.fromarray(out, "RGBA")


def content_bbox(im: Image.Image, alpha_min: int = 48):
    mask = np.array(im)[:, :, 3] > alpha_min
    if not mask.any():
        return None
    ys, xs = np.where(mask)
    return int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1


def pad_square(bb, w, h, pad=1.55):
    x0, y0, x1, y1 = bb
    cx = (x0 + x1) / 2.0
    cy = (y0 + y1) / 2.0
    s = int(round(min(max(x1 - x0, y1 - y0) * pad, w, h)))
    nx0 = max(0, min(int(round(cx - s / 2)), w - s))
    ny0 = max(0, min(int(round(cy - s / 2)), h - s))
    return nx0, ny0, nx0 + s, ny0 + s


def pack(kind: str) -> int:
    raws = sorted((ART / kind / "frames-raw").glob("frame_*.png"))
    if not raws:
        raise SystemExit(f"no raw frames for {kind}")
    print(f"{kind} {len(raws)} frames")
    cleaned = [key_magenta(Image.open(p)) for p in raws]
    w, h = cleaned[0].size
    bb0 = content_bbox(cleaned[0]) or (w // 4, h // 4, 3 * w // 4, 3 * h // 4)
    crop = pad_square(bb0, w, h)
    n = len(cleaned)
    rows = int(np.ceil(n / COLS))
    sheet = Image.new("RGBA", (COLS * CELL, rows * CELL), (0, 0, 0, 0))
    for i, im in enumerate(cleaned):
        piece = im.crop(crop).resize((CELL, CELL), Image.Resampling.LANCZOS)
        sheet.paste(piece, ((i % COLS) * CELL, (i // COLS) * CELL), piece)
    dest = FX / f"{kind}-sheet.webp"
    sheet.save(dest, "WEBP", quality=78, method=4)
    png_dir = FX / "png"
    png_dir.mkdir(exist_ok=True)
    cleaned[0].crop(crop).resize((CELL, CELL), Image.Resampling.LANCZOS).save(
        png_dir / f"{kind}-0001.png"
    )
    mid = cleaned[min(n - 1, n * 2 // 3)]
    mid.crop(crop).resize((CELL, CELL), Image.Resampling.LANCZOS).save(
        png_dir / f"{kind}-0120.png"
    )
    peek = ART / "peek"
    peek.mkdir(exist_ok=True)
    for idx in (0, n // 4, n // 2, (3 * n) // 4, n - 1):
        x = (idx % COLS) * CELL
        y = (idx // COLS) * CELL
        cell = sheet.crop((x, y, x + CELL, y + CELL))
        cell.save(peek / f"{kind}-{idx:04d}.png")
        print(f"  {kind}[{idx}] corner={cell.getpixel((2,2))}")
    print(f"wrote {dest.name} {sheet.size} n={n} {dest.stat().st_size}B")
    return n


def main() -> None:
    counts = {k: pack(k) for k in ("chest", "supreme")}
    (ART / "sheet-meta.txt").write_text(f"{counts}\ncols={COLS} cell={CELL}\n")
    print("OK", counts)


if __name__ == "__main__":
    main()
