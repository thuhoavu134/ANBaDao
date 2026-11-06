"""Pack idle (vd Tich Dao vong 19..121) (khop dau-cuoi tot nhat theo pixel, seam 0.29x buoc thuong),
TAT tron mep (IDLE_SEAM_CROSSFADE=0) de khong con khung nhoe. Moi buoc khac giu nguyen cua packager."""
import sys, json, tempfile, shutil, argparse
from pathlib import Path
import numpy as np
from PIL import Image

ap = argparse.ArgumentParser(description='Pack idle voi cua so lap co dinh, tat tron khung')
ap.add_argument('video'); ap.add_argument('--start', type=int, required=True); ap.add_argument('--end', type=int, required=True)
ap.add_argument('--out', required=True)
ap.add_argument('--blender', default=r'C:\Program Files\Blender Foundation\Blender 5.1\blender.exe')
ap.add_argument('--packager', default=r'C:\Users\Admin\aicoworker\openclaw\skills\kiemthe-animation-packager\scripts')
args = ap.parse_args()
sys.path.insert(0, args.packager)
import package_six_states as K
START, END = args.start, args.end
SRC = Path(args.video)
OUT = Path(args.out)
if OUT.exists(): shutil.rmtree(OUT)
OUT.mkdir(parents=True)
BLENDER = args.blender

def iou(a, b):
    x = np.asarray(Image.open(a).getchannel('A')) > 128
    y = np.asarray(Image.open(b).getchannel('A')) > 128
    return float((x & y).sum() / max(1, (x | y).sum()))

def fixed_loop(keyed, pts, durs, min_seam_iou=K.IDLE_SEAM_MIN_IOU):
    step = (END - START) / 29
    nxt = min(len(keyed) - 1, round(END + step))
    v = round(iou(keyed[START], keyed[nxt]), 4)
    print(f'[idle] fixed loop {START}..{END} (next={nxt}) IoU start/next {v}; crossfade OFF')
    return START, END, v

K.IDLE_SEAM_CROSSFADE = 0
K.choose_idle_loop = fixed_loop
ffmpeg, ffprobe = K.find_tool('ffmpeg'), K.find_tool('ffprobe')
with tempfile.TemporaryDirectory(prefix='td-idle2-') as td:
    w = Path(td) / 'idle'
    info = K.probe_video(ffprobe, SRC)
    raw = K.extract_frames(ffmpeg, SRC, w / 'raw', info['frameCount'])
    key = K.sample_key_color(raw)
    keyed = K.key_frames(BLENDER, raw, w / 'rgba', key, info['width'], info['height'], 'idle')
    scrub = K.scrub_strays(keyed, 'idle')
    uniform = K.measure_uniform({'idle': keyed}, {'idle'})
    res = K.pack_state('idle', SRC, info, raw, keyed, key, OUT / 'idle', ffmpeg, K.IDLE_SEAM_MIN_IOU, None, 'uniform', uniform)
    md = json.loads((OUT / 'idle' / 'metadata.json').read_text(encoding='utf-8'))
    print(json.dumps({'frames': res.get('frameCount'), 'crossfade': md['loop'].get('seamCrossfade'), 'dur': md['loop'].get('durationSeconds')}))
