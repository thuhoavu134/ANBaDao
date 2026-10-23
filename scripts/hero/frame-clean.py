#!/usr/bin/env python3
"""Clean a source frame before it becomes a game asset.

The owner's rule (2026-10-23): a video frame is only usable when it carries NOTHING but the character.
Gemini sparkles, stray text (e.g. the "#00FF00" chroma label), a mouse cursor, black letterbox bars and the
green screen all have to go, or the packed atlas inherits them.

What it does, in order:
  1. crop uniform black letterbox bars (top/bottom/left/right);
  2. find the chroma colour (the dominant greenish tone around the border);
  3. remove foreign ink that sits INSIDE the chroma area and is small (text, sparkles, cursors) by painting it
     with the chroma colour, so the key pass takes it away with the background;
  4. key the chroma out to alpha and despill the green fringe;
  5. report every removal, and fail (exit 1) when something survived.

Usage:
  python scripts/hero/frame-clean.py --in <file-or-dir> --out <dir> [--report <json>] [--tolerance 60]
  python scripts/hero/frame-clean.py --selftest
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image

MAX_ARTIFACT_AREA = 0.02      # >2% of the frame is treated as part of the character, not as an artifact
CURSOR_MAX_AREA = 0.0015      # a cursor is tiny; text/logo blobs are bigger than this
GREEN_TOLERANCE_DEFAULT = 60


def _label(mask: np.ndarray) -> tuple[np.ndarray, int]:
    """4-connected component labels without scipy (frames are small)."""
    h, w = mask.shape
    labels = np.zeros((h, w), np.int32)
    current = 0
    stack: list[tuple[int, int]] = []
    for y0 in range(h):
        for x0 in range(w):
            if not mask[y0, x0] or labels[y0, x0]:
                continue
            current += 1
            labels[y0, x0] = current
            stack.append((y0, x0))
            while stack:
                y, x = stack.pop()
                for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    ny, nx = y + dy, x + dx
                    if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and not labels[ny, nx]:
                        labels[ny, nx] = current
                        stack.append((ny, nx))
        stack.clear()
    return labels, current


def _longest_run(flags: np.ndarray) -> tuple[int, int]:
    """Start/end (inclusive) of the longest contiguous True run — a stray bright line at the bottom edge must not
    stretch the crop back over the whole letterbox."""
    best = (0, -1)
    start = None
    for i, v in enumerate(flags):
        if v and start is None:
            start = i
        elif not v and start is not None:
            if i - 1 - start > best[1] - best[0]:
                best = (start, i - 1)
            start = None
    if start is not None and len(flags) - 1 - start > best[1] - best[0]:
        best = (start, len(flags) - 1)
    return best


def _border_touch(component: np.ndarray, green: np.ndarray) -> float:
    """Share of the component's outer border that touches the chroma area."""
    grown = np.zeros_like(component)
    grown[1:, :] |= component[:-1, :]
    grown[:-1, :] |= component[1:, :]
    grown[:, 1:] |= component[:, :-1]
    grown[:, :-1] |= component[:, 1:]
    ring = grown & ~component
    inside = np.zeros_like(component)
    inside[1:-1, 1:-1] = True                  # ring pixels that lie outside the image cannot be green
    ring &= inside
    total = int(ring.sum())
    if not total:
        return 0.0
    return float((ring & green).sum()) / total


def clean_array(rgb: np.ndarray, tolerance: int = GREEN_TOLERANCE_DEFAULT) -> tuple[np.ndarray, dict]:
    """Return (RGBA uint8 image, report dict)."""
    h, w, _ = rgb.shape
    a = rgb.astype(np.int16)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]

    # 1) letterbox: a row/column is "content" when it holds anything brighter than near-black
    # A row counts as content only when a real share of it is not black: one stray bright pixel at the very bottom
    # used to keep 300 px of letterbox in the frame (and that bar then showed up as opaque background).
    row_content = (a.max(axis=2) > 14).mean(axis=1) > 0.02
    col_content = (a.max(axis=2) > 14).mean(axis=0) > 0.02
    r0, r1 = _longest_run(row_content)
    c0, c1 = _longest_run(col_content)
    crop = (r0, c0, r1 + 1, c1 + 1) if r1 >= r0 and c1 >= c0 else (0, 0, h, w)
    if crop != (0, 0, h, w):
        a = a[crop[0]:crop[2], crop[1]:crop[3]]
        h, w, _ = a.shape
        r, g, b = a[..., 0], a[..., 1], a[..., 2]

    # 2) chroma colour: the most common strong green in the frame
    mx = a.max(axis=2)
    mn = a.min(axis=2)
    # greenish = green is the dominant channel with real saturation; brightness independent, so a dim or
    # JPEG-noisy chroma still counts (a fixed 'g > 100' test left ~70% of the real frame opaque).
    green = (a[..., 1] == mx) & ((mx - mn) > 28)
    if green.mean() < 0.05:
        return _to_rgba(a), {"greenScreen": False, "note": "no chroma background detected", "crop": crop, "removed": []}
    # Take the 75th percentile: a shaded/JPEG-dimmed background drags the median down and the distance test
    # then rejects the brighter half of the same chroma.
    key = np.array([int(np.percentile(a[..., 0][green], 75)), int(np.percentile(a[..., 1][green], 75)),
                    int(np.percentile(a[..., 2][green], 75))], np.int16)

    # 3) foreign ink inside the chroma area: small islands painted out (text, sparkles, cursor)
    ink = ~green
    ink &= a.max(axis=2) > 10                     # a dark cursor is ink too; only true black holes are skipped
    labels, count = _label(ink)
    removed = []
    fill = np.zeros((h, w), bool)
    frame_area = h * w
    for idx in range(1, count + 1):
        comp = labels == idx
        area = int(comp.sum())
        if area < 6 or area > frame_area * MAX_ARTIFACT_AREA:
            continue                              # the character itself is big
        ys, xs = np.nonzero(comp)
        # A small island whose bounding box sits in an overlay corner is a watermark/label even when it is not fully
        # ringed by green (the Gemini sparkles touch the body, the "#00FF00" label touches the frame edge).
        in_corner = (xs.min() > w * 0.72 and ys.min() > h * 0.45) or (ys.max() < h * 0.22) or (xs.max() < w * 0.30 and ys.max() < h * 0.25)
        if _border_touch(comp, green) < 0.5 and not in_corner:
            continue                              # sits inside the character, keep it
        ys, xs = np.nonzero(comp)
        removed.append({
            "x": int(xs.mean()), "y": int(ys.mean()), "area": area,
            "kind": "cursor" if area <= frame_area * CURSOR_MAX_AREA else "textOrLogo",
        })
        fill |= comp
    if fill.any():
        a[fill] = key

    # 3b) overlay pass: AI watermarks and annotation labels are bright, desaturated and live in the corners. They
    # are often merged into the subject component, so the island rule above cannot see them — strip them by colour
    # inside the overlay zones instead (the same idea be-an-convert.py used for the source watermark).
    mxz = a.max(axis=2).astype(np.float32)
    mnz = a.min(axis=2).astype(np.float32)
    sat = (mxz - mnz) / np.maximum(mxz, 1)
    overlay_ink = (mxz > 130) & (sat < 0.24)
    zone = np.zeros((h, w), bool)
    zone[:max(1, int(h * 0.24)), :max(1, int(w * 0.45))] = True        # top-left: "#00FF00"-style label
    zone[int(h * 0.52):, int(w * 0.68):] = True                        # bottom-right: Gemini sparkles
    labels2, count2 = _label(overlay_ink & zone)
    overlays = []
    for idx in range(1, count2 + 1):
        comp = labels2 == idx
        area = int(comp.sum())
        if area < 8 or area > frame_area * 0.02:
            continue
        ys, xs = np.nonzero(comp)
        fill |= comp
        overlays.append({"x": int(xs.mean()), "y": int(ys.mean()), "area": area, "kind": "overlay"})
    if overlays:
        a[fill] = key

    # 4) key the chroma out, despill the fringe
    mx2 = a.max(axis=2)
    mn2 = a.min(axis=2)
    g2 = (a[..., 1] == mx2) & ((mx2 - mn2) > 24)
    dist = np.abs(a - key).sum(axis=2)
    keyed = g2 & (dist < tolerance)
    # A label or a watermark sitting on the chroma is greenish but much BRIGHTER than the background, so the distance
    # test rejects it and it survives as a green ghost. In the overlay corners only, key greenish pixels that are
    # clearly brighter than the sampled key (a dark green prop stays untouched).
    try:
        key_max = int(max(key))
        bright_green = g2 & (a.max(axis=2) > key_max + 35)
        keyed = keyed | (bright_green & zone)
    except NameError:
        pass
    out = np.dstack([a.astype(np.uint8), np.where(keyed, 0, 255).astype(np.uint8)])
    despill = g2 & ~keyed
    if despill.any():
        out[..., 1][despill] = np.minimum(out[..., 1][despill], 200)

    report = {
        "greenScreen": True,
        "crop": crop,
        "keyColor": [int(v) for v in key],
        "removed": removed,
        "cursors": sum(1 for x in removed if x["kind"] == "cursor"),
        "overlays": overlays,
        "opaqueRatio": round(float((out[..., 3] > 0).mean()), 4),
        "remainingGreen": int((keyed & (out[..., 3] > 0)).sum()),
    }
    return out, report


def _to_rgba(a: np.ndarray) -> np.ndarray:
    return np.dstack([a.astype(np.uint8), np.full(a.shape[:2], 255, np.uint8)])


def clean_file(src: Path, dst: Path, tolerance: int) -> dict:
    img = Image.open(src).convert("RGB")
    out, report = clean_array(np.asarray(img), tolerance)
    dst.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(out, "RGBA").save(dst)
    report["file"] = src.name
    return report


def selftest() -> int:
    """Build a frame with every artifact the owner listed, clean it, and assert each one is handled."""
    h, w = 300, 400
    bg = np.zeros((h, w, 3), np.int16)
    bg[:] = (0, 0, 0)                       # letterbox
    bg[40:h - 40, :] = (0, 255, 0)          # chroma
    bg[120:200, 150:250] = (230, 210, 190)  # the character: big, must survive
    bg[75:80, 20:90] = (255, 255, 255)      # stray text row  ("#00FF00")
    bg[150:158, 300:308] = (255, 255, 255)  # gemini sparkle
    bg[210:216, 330:336] = (20, 20, 20)     # mouse cursor (dark, tiny, inside the chroma)
    out, rep = clean_array(bg.astype(np.uint8))
    ok = True
    def check(label, cond):
        nonlocal ok
        print(("OK   " if cond else "FAIL ") + label)
        ok = ok and cond
    check("letterbox cropped", rep["crop"][0] == 40 and rep["crop"][2] == h - 40)
    check("chroma detected", rep["greenScreen"] is True)
    check("text + sparkle + cursor removed", len(rep["removed"]) >= 3)
    check("cursor flagged", rep["cursors"] >= 1)
    check("character survived", int((out[..., 3] > 0).sum()) > 3000)
    check("background keyed out", rep["opaqueRatio"] < 0.35)
    return 0 if ok else 1


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--in", dest="src")
    ap.add_argument("--out", dest="out")
    ap.add_argument("--report")
    ap.add_argument("--tolerance", type=int, default=GREEN_TOLERANCE_DEFAULT)
    ap.add_argument("--selftest", action="store_true")
    args = ap.parse_args()
    if args.selftest:
        return selftest()
    if not args.src:
        ap.error("--in is required (or use --selftest)")
    src = Path(args.src)
    out = Path(args.out or (src.parent / "clean"))
    targets = [src] if src.is_file() else sorted(p for p in src.iterdir() if p.suffix.lower() in {".png", ".jpg", ".jpeg", ".webp"})
    if not targets:
        print("no images found", file=sys.stderr)
        return 1
    reports, bad = [], 0
    for f in targets:
        dst = out / (f.stem + ".png")
        rep = clean_file(f, dst, args.tolerance)
        reports.append(rep)
        if rep.get("remainingGreen"):
            bad += 1
        print(f"{f.name}: removed={len(rep.get('removed', []))} cursors={rep.get('cursors', 0)} "
              f"opaque={rep.get('opaqueRatio')} -> {dst.name}")
    if args.report:
        Path(args.report).write_text(json.dumps(reports, ensure_ascii=False, indent=2), encoding="utf-8")
    return 1 if bad else 0


if __name__ == "__main__":
    raise SystemExit(main())
