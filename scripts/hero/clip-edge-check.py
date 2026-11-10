#!/usr/bin/env python
"""Kiểm clip gốc của boss trước khi đóng gói.

- In độ phân giải / thời lượng / fps.
- Kiểm 4 mép: 8px ngoài cùng phải là nền chroma xanh; báo % frame bị "chạm mép".

Dùng:
  python scripts/hero/clip-edge-check.py --dir C:\\lt\\packs\\hac-xa\\raw
"""
import argparse, glob, json, os, subprocess, sys
import numpy as np
from PIL import Image

STATES = ["idle", "hit", "fall-die", "atk", "ultimate"]
BORDER = 8
TOL = 0.002  # 0.2% pixel mép không phải nền = coi như chạm


def probe(path):
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
         "stream=width,height,r_frame_rate:format=duration", "-of", "json", path],
        capture_output=True, text=True, check=True).stdout
    j = json.loads(out)
    s = j["streams"][0]
    num, den = (s["r_frame_rate"].split("/") + ["1"])[:2]
    return {
        "w": int(s["width"]), "h": int(s["height"]),
        "fps": round(float(num) / float(den or 1), 2),
        "dur": round(float(j["format"]["duration"]), 2),
    }


def edge_report(path, tmpdir):
    os.makedirs(tmpdir, exist_ok=True)
    for f in glob.glob(os.path.join(tmpdir, "*.png")):
        os.remove(f)
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", path, "-vf", "fps=6",
                    os.path.join(tmpdir, "f%03d.png")], check=True)
    files = sorted(glob.glob(os.path.join(tmpdir, "*.png")))
    touch = 0
    worst = 0.0
    for f in files:
        a = np.asarray(Image.open(f).convert("RGB")).astype(int)
        green = (a[..., 1] > 150) & (a[..., 0] < 130) & (a[..., 2] < 130)
        edge = np.concatenate([green[:BORDER].ravel(), green[-BORDER:].ravel(),
                               green[:, :BORDER].ravel(), green[:, -BORDER:].ravel()])
        bad = 1 - edge.mean()
        worst = max(worst, bad)
        if bad > TOL:
            touch += 1
    return {"frames": len(files), "touchFrames": touch, "worstEdge": round(worst, 4)}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dir", required=True)
    ap.add_argument("--tmp", default=r"C:\tmp\clipedges")
    ap.add_argument("--max-touch", type=int, default=0, help="số khung chạm mép tối đa được chấp nhận")
    args = ap.parse_args()

    missing = [s for s in STATES if not os.path.exists(os.path.join(args.dir, s + ".mp4"))]
    if missing:
        print("THIẾU clip:", ", ".join(missing))
    ok = True
    for s in STATES:
        p = os.path.join(args.dir, s + ".mp4")
        if not os.path.exists(p):
            ok = False
            continue
        info = probe(p)
        rep = edge_report(p, os.path.join(args.tmp, s))
        flag = "OK" if (info["w"] >= 1280 and rep["touchFrames"] <= args.max_touch) else "CẦN XEM"
        if rep["touchFrames"] > args.max_touch:
            ok = False
        print(f"{s:9s} {info['w']}x{info['h']} {info['fps']}fps {info['dur']}s "
              f"frames={rep['frames']} chamMep={rep['touchFrames']} worst={rep['worstEdge']} -> {flag}")
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
