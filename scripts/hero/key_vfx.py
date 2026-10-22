"""STEP: owner green-screen VFX clips -> one RGBA atlas per role + provenance rows.

Generalised from the per-hero scripts used for Bach Y / Nguyet Diep / Tinh Mac (key_vfx7.py, key_vfx_tinh_mac.py).
Reads the bundle written by scripts/hero/intake.mjs, so no clip name is ever typed by hand.

  <pack python> scripts/hero/key_vfx.py --bundle C:/lt/packs/<slug>/bundle.json --slug <slug> [--root <repo>]

Writes assets/vfx/<slug>/vfx-<role>-<sha8>.webp (old atlases of the same role are removed) and merges the rows
into assets/vfx/<slug>/provenance.json["clips"] (the "sfx" part is left to extract_sfx.py).
Keying: difference matte against the median border green, alpha ramp 55..150, unmix + green spill clamp,
Gemini sparkle corner (bottom-right 250px) masked. Frame count / cell size / playback speed per role match the
values tuned on the shipped heroes; the owner can retune frameMs in provenance.json.
"""
import argparse, hashlib, json, shutil, subprocess, sys, tempfile
from pathlib import Path

import numpy as np
from PIL import Image

# role -> (bundle label, frames, max cell edge px, frameMs, role note)
JOBS = {
    'vfx-basic': ('vfx-basic', 16, 300, 60, 'basic VFX (owner clip vfxatk)'),
    'vfx-ultimate': ('vfx-ultimate', 24, 360, 90, 'ultimate VFX (owner clip vfxulti)'),
    'vfx-passive': ('vfx-passive', 16, 300, 60, 'passive VFX (owner clip vfxnoitai)'),
}
MAX_DECODED = 12 * 1024 * 1024  # hero-doctor battle page limit
MAX_EDGE = 4096


def frames_of(src, workdir, count):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(src), str(workdir / 'f_%04d.png')], check=True)
    allf = sorted(workdir.glob('f_*.png'))
    if len(allf) < count:
        raise SystemExit(f'{src.name}: only {len(allf)} frames, need {count}')
    idx = [round(i * (len(allf) - 1) / (count - 1)) for i in range(count)]
    return [allf[i] for i in idx], idx, len(allf)


def key(path):
    rgb = np.asarray(Image.open(path).convert('RGB')).astype(np.float32)
    h, w, _ = rgb.shape
    border = np.concatenate([rgb[:12].reshape(-1, 3), rgb[-12:].reshape(-1, 3), rgb[:, :12].reshape(-1, 3), rgb[:, -12:].reshape(-1, 3)])
    gdom = border[:, 1] - np.maximum(border[:, 0], border[:, 2])
    bg = np.median(border[gdom > 60], axis=0) if (gdom > 60).sum() > 50 else np.array([48, 177, 54], np.float32)
    dist = np.sqrt(((rgb - bg) ** 2).sum(-1))
    a = np.clip((dist - 55) / (150 - 55), 0, 1)
    a[h - 250:, w - 250:] = 0  # Gemini sparkle corner
    safe = np.maximum(a, 1e-3)[..., None]
    col = np.clip((rgb - bg * (1 - a[..., None])) / safe, 0, 255)
    g_lim = np.maximum(col[..., 0], col[..., 2]) + 12
    col[..., 1] = np.where(a < 0.98, np.minimum(col[..., 1], g_lim), col[..., 1])
    return np.dstack([col, a * 255]).astype(np.uint8)


def build(role, src, out_dir, count, cell_max, frame_ms, note):
    work = Path(tempfile.mkdtemp(prefix=f'{role}-'))
    try:
        paths, idx, total = frames_of(src, work, count)
        keyed = [key(p) for p in paths]
    finally:
        shutil.rmtree(work, ignore_errors=True)
    union = None
    for k in keyed:
        ys, xs = np.where(k[..., 3] > 16)
        if len(xs) == 0:
            continue
        b = (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)
        union = b if union is None else (min(union[0], b[0]), min(union[1], b[1]), max(union[2], b[2]), max(union[3], b[3]))
    if union is None:
        raise SystemExit(f'{role}: {src.name} keyed to nothing (not a green-screen clip?)')
    pad = 8
    x0, y0 = max(0, union[0] - pad), max(0, union[1] - pad)
    x1, y1 = min(keyed[0].shape[1], union[2] + pad), min(keyed[0].shape[0], union[3] + pad)
    s = min(1.0, cell_max / (x1 - x0), cell_max / (y1 - y0))
    cw, ch = max(1, round((x1 - x0) * s)), max(1, round((y1 - y0) * s))
    cols = 8
    rows = (count + cols - 1) // cols
    if cw * cols > MAX_EDGE or ch * rows > MAX_EDGE or cw * cols * ch * rows * 4 > MAX_DECODED:
        raise SystemExit(f'{role}: atlas {cw * cols}x{ch * rows} breaks the battle page budget')
    sheet = Image.new('RGBA', (cw * cols, ch * rows), (0, 0, 0, 0))
    for i, k in enumerate(keyed):
        im = Image.fromarray(k, 'RGBA').crop((x0, y0, x1, y1)).resize((cw, ch), Image.Resampling.LANCZOS)
        sheet.alpha_composite(im, ((i % cols) * cw, (i // cols) * ch))
    import io
    buf = io.BytesIO()
    sheet.save(buf, 'WEBP', quality=88, alpha_quality=95, method=5)
    data = buf.getvalue()
    sha = hashlib.sha256(data).hexdigest()
    name = f'{role}-{sha[:8]}.webp'
    for old in out_dir.glob(f'{role}-*.webp'):
        if old.name != name:
            old.unlink()
    (out_dir / name).write_bytes(data)
    return {'file': name, 'frames': count, 'cols': cols, 'rows': rows, 'cellW': cw, 'cellH': ch,
            'atlasWidth': cw * cols, 'atlasHeight': ch * rows, 'frameMs': frame_ms,
            'blend': 'source-over', 'pivot': round(cw / 2), 'foot': round(ch / 2),
            'sourceClip': src.name, 'sourceFrames': list(map(int, idx)), 'sourceFrameCount': total,
            'sourceRect': [int(x0), int(y0), int(x1), int(y1)],
            'keying': 'difference matte vs border green, alpha 55..150, unmix + spill clamp, Gemini corner masked',
            'role': note, 'sha256': sha, 'bytes': len(data)}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--bundle', required=True)
    ap.add_argument('--slug', required=True)
    ap.add_argument('--root', default=str(Path(__file__).resolve().parents[2]))
    a = ap.parse_args()
    bundle = json.loads(Path(a.bundle).read_text(encoding='utf-8'))
    out_dir = Path(a.root) / 'assets' / 'vfx' / a.slug
    out_dir.mkdir(parents=True, exist_ok=True)
    prov_path = out_dir / 'provenance.json'
    prov = json.loads(prov_path.read_text(encoding='utf-8')) if prov_path.exists() else {}
    prov.setdefault('source', {})
    prov.setdefault('clips', {})
    made = []
    for role, (label, count, cell_max, frame_ms, note) in JOBS.items():
        src = bundle['sources'].get(label)
        if not src:
            continue
        row = build(role, Path(src['path']), out_dir, count, cell_max, frame_ms, note)
        prov['clips'][role] = row
        made.append(role)
        print(f"{role}: {row['file']} {row['cellW']}x{row['cellH']} x{count} {row['bytes']}B")
    prov['source']['vfx'] = 'owner-supplied green-screen clips ' + ' / '.join(bundle['sources'][JOBS[r][0]]['name'].split('---')[0] for r in made) if made else prov['source'].get('vfx', 'none')
    prov_path.write_text(json.dumps(prov, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'KEY VFX PASS: {len(made)} atlas -> {out_dir}')


if __name__ == '__main__':
    main()
