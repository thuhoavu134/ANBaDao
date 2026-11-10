#!/usr/bin/env python
"""Đóng gói pack 6-state (packager) thành atlas anim cho boss Săn Boss.

Dùng:
  python scripts/hero/boss-atlas.py --slug hac-xa --pack C:\\lt\\packs\\hac-xa\\
      --out assets/hunt/hac-xa --form ca_voi_nuot_trang

- Đọc sprite_sheets + metadata.json của packager (idle dùng bản idle-fixed nếu có).
- Chuẩn hoá 0.5x, lưới 6 cột, ghi anim.json (frames/cols/cellW/cellH/pivot/foot/durationMs/loop).
- Không phụ thuộc Blender: packager đã key nền xanh trước đó.
"""
import argparse, glob, json, os
import numpy as np
from PIL import Image

DUR = {"idle": 3042, "atk": 1500, "ultimate": 2600, "hit": 700, "fall-die": 1600}
STATES = ["idle", "atk", "ultimate", "hit", "fall-die"]
COLS = 6
SCALE = 0.5


def cell_of(state_dir):
    m = os.path.join(state_dir, "metadata.json")
    if os.path.exists(m):
        try:
            return json.load(open(m, encoding="utf-8"))["crop"]["cell"]
        except Exception:
            pass
    return None


def frames_of(state_dir, cell, limit):
    out = []
    for sp in sorted(glob.glob(os.path.join(state_dir, "sprite_sheets", "*.png"))):
        sh = Image.open(sp).convert("RGBA")
        cw, ch = cell
        for r in range(sh.height // ch):
            for c in range(sh.width // cw):
                f = sh.crop((c * cw, r * ch, (c + 1) * cw, (r + 1) * ch))
                if f.getbbox() is None:
                    continue
                out.append(f)
                if len(out) >= limit:
                    return out
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--slug", required=True)
    ap.add_argument("--pack", required=True, help="thư mục pack (chứa idle/, atk/, ...)")
    ap.add_argument("--idle", default="", help="thư mục idle đã làm lại vòng lặp (tuỳ chọn)")
    ap.add_argument("--out", required=True)
    ap.add_argument("--form", default="ca_voi_nuot_trang")
    args = ap.parse_args()

    os.makedirs(args.out, exist_ok=True)
    meta = {
        "schema": "hunt-boss-anim/v1",
        "slug": args.slug,
        "form": args.form,
        "source": "Google Flow Omni 1.2 Flash + kiemthe-animation-packager (uniform framing)",
        "clips": {},
    }
    for state in STATES:
        sdir = args.idle if (state == "idle" and args.idle) else os.path.join(args.pack, state)
        cell = cell_of(sdir) or cell_of(os.path.join(args.pack, state))
        if not cell:
            raise SystemExit(f"thiếu metadata.json cho state {state} ({sdir})")
        n = 30 if state == "idle" else 18
        frames = frames_of(sdir, cell, n)
        if len(frames) < n:
            raise SystemExit(f"{state}: chỉ có {len(frames)}/{n} frame")
        w, h = int(cell[0] * SCALE), int(cell[1] * SCALE)
        rows = (len(frames) + COLS - 1) // COLS
        atlas = Image.new("RGBA", (w * COLS, h * rows), (0, 0, 0, 0))
        foot = 0
        for i, f in enumerate(frames):
            f = f.resize((w, h), Image.LANCZOS)
            a = np.asarray(f)[..., 3]
            ys = np.nonzero(a.max(axis=1) > 40)[0]
            if len(ys):
                foot = max(foot, int(ys.max()))
            atlas.paste(f, ((i % COLS) * w, (i // COLS) * h))
        fn = f"{state}.webp"
        atlas.save(os.path.join(args.out, fn), "WEBP", quality=90, method=6)
        meta["clips"][state] = {
            "src": f"assets/hunt/{args.slug}/{fn}",
            "frames": len(frames),
            "cols": COLS,
            "cellW": w,
            "cellH": h,
            "pivot": w // 2,
            "foot": foot,
            "durationMs": DUR[state],
            "loop": state == "idle",
        }
        print(state, len(frames), (w, h), "foot", foot, os.path.getsize(os.path.join(args.out, fn)))

    json.dump(meta, open(os.path.join(args.out, "anim.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print("wrote", os.path.join(args.out, "anim.json"))


if __name__ == "__main__":
    main()
