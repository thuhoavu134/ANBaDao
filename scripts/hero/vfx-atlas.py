"""Cắt clip VFX nền đen (Flow) thành atlas có alpha cho trận.

  python scripts/hero/vfx-atlas.py --src clip.mp4 --out assets/hunt/hac-xa --name vfx-atk --frames 18

- alpha = độ sáng (kênh lớn nhất) -> nền đen thành trong suốt, giữ màu gốc (premultiply ngược).
- Mép khung được làm mờ dần (feather) để chỗ hiệu ứng chạm mép không lộ đường cắt thẳng.
- Cắt theo hộp bao chung mọi frame, thu nhỏ để atlas gọn.
"""
import argparse, json, os, subprocess, tempfile
import numpy as np
from PIL import Image

ap = argparse.ArgumentParser()
ap.add_argument('--src', required=True)
ap.add_argument('--out', required=True)
ap.add_argument('--name', required=True)
ap.add_argument('--frames', type=int, default=18)
ap.add_argument('--maxh', type=int, default=260)
ap.add_argument('--feather', type=float, default=0.10)
a = ap.parse_args()

tmp = tempfile.mkdtemp()
dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', a.src],
                           capture_output=True, text=True).stdout.strip())
fps = a.frames / dur
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', a.src, '-vf', f'fps={fps:.4f},scale=960:-1', os.path.join(tmp, 'f%03d.png')], check=True)
files = sorted(os.listdir(tmp))[:a.frames]

rgba = []
for f in files:
    im = np.asarray(Image.open(os.path.join(tmp, f)).convert('RGB')).astype(np.float32) / 255.0
    h, w, _ = im.shape
    al = np.clip((im.max(axis=2) - 0.06) / 0.5, 0, 1)
    # feather 4 mép
    fy = np.minimum(np.arange(h), np.arange(h)[::-1]) / (h * a.feather)
    fx = np.minimum(np.arange(w), np.arange(w)[::-1]) / (w * a.feather)
    al *= np.clip(fy, 0, 1)[:, None] * np.clip(fx, 0, 1)[None, :]
    # xoa dau ✦ cua Flow/Veo o goc duoi phai (khong phai hieu ung)
    al[int(h * 0.74):, int(w * 0.85):] = 0
    col = np.clip(im / np.maximum(al[..., None], 1e-3), 0, 1)
    rgba.append(np.dstack([col, al]))

mask = np.zeros(rgba[0].shape[:2], bool)
for r in rgba:
    mask |= r[..., 3] > 0.04
ys, xs = np.nonzero(mask)
y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
ch = y1 - y0; cw = x1 - x0
s = min(1.0, a.maxh / ch)
cw2, ch2 = max(1, int(cw * s)), max(1, int(ch * s))
cols = 6
rows = (len(rgba) + cols - 1) // cols
atlas = Image.new('RGBA', (cw2 * cols, ch2 * rows), (0, 0, 0, 0))
for i, r in enumerate(rgba):
    fr = Image.fromarray((r[y0:y1, x0:x1] * 255).astype(np.uint8), 'RGBA').resize((cw2, ch2), Image.LANCZOS)
    atlas.paste(fr, ((i % cols) * cw2, (i // cols) * ch2))
os.makedirs(a.out, exist_ok=True)
atlas.save(os.path.join(a.out, a.name + '.webp'), 'WEBP', quality=88, method=6)
H, W = rgba[0].shape[:2]
meta = {'src': f'{a.out.replace(os.sep, "/")}/{a.name}.webp', 'frames': len(rgba), 'cols': cols, 'cellW': cw2, 'cellH': ch2,
        'durationMs': round(dur * 1000),
        # tâm hộp bao so với tâm khung gốc (tỉ lệ), để đặt hiệu ứng
        'cx': round(((x0 + x1) / 2) / W, 3), 'cy': round(((y0 + y1) / 2) / H, 3)}
json.dump(meta, open(os.path.join(a.out, a.name + '.json'), 'w', encoding='utf-8'), indent=1)
print(json.dumps(meta), os.path.getsize(os.path.join(a.out, a.name + '.webp')))
