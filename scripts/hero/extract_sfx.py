"""STEP: cut the hero SFX out of the audio of the owner's own clips (trimmed, never mixed or synthesised).

Generalised from extract_sfx_tinh_mac.py + audio_envelope.py, where the windows were picked by eye from an RMS
envelope. Here the same envelope is computed and the sound events are found automatically:
  envelope 10 ms, smoothed 50 ms -> frames above max(25% of peak, 3x median) form events (gaps < 120 ms merged)
  -> each event grows back/forward until the envelope falls under 10% of peak -> length clamped to 250..1600 ms.

  <pack python> scripts/hero/extract_sfx.py --bundle C:/lt/packs/<slug>/bundle.json --slug <slug> --key <hero_key>

Cue names are "<key with - >-<role>" (tests/authored-hero.test.mjs requires the hero prefix). Writes
assets/audio/sfx/<slug>/<role>.wav (mono 44.1 kHz s16), merges assets/vfx/<slug>/provenance.json["sfx"] and
writes C:/lt/packs/<slug>/sfx-rows.json for scaffold.mjs. Owner review is required: every row says so.
"""
import argparse, hashlib, json, subprocess
from pathlib import Path

import numpy as np

SR = 44100
# role -> (bundle label, which event): 'strongest' | 'first' | 'last' (of the two strongest events)
JOBS = [
    ('basic', 'atk', 'strongest'),          # the hero's swing / voice
    ('basic-hit', 'vfx-basic', 'strongest'),  # the basic VFX landing
    ('ultimate', 'ultimate', 'strongest'),
    ('ultimate-vfx', 'vfx-ultimate', 'first'),
    ('ultimate-hit', 'vfx-ultimate', 'last'),
    ('hit', 'hit', 'strongest'),
    ('passive', 'vfx-passive', 'strongest'),
]


def pcm(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(path), '-vn', '-ac', '1', '-ar', str(SR), '-f', 's16le', '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0


def events(x):
    hop = SR // 100  # 10 ms
    n = len(x) // hop
    if n < 10:
        return []
    env = np.sqrt((x[:n * hop].reshape(n, hop) ** 2).mean(1))
    env = np.convolve(env, np.ones(5) / 5, mode='same')
    peak = float(env.max())
    if peak < 0.01:  # silent clip
        return []
    # 3x median rejects background hum, but a sustained clip (vfxulti: median 0.11, peak 0.31) would push the
    # threshold above its own peak, so it is capped at 60% of the peak.
    thr = max(0.25 * peak, min(3 * float(np.median(env)), 0.6 * peak))
    on = env > thr
    segs, i = [], 0
    while i < n:
        if on[i]:
            j = i
            while j + 1 < n and on[j + 1]:
                j += 1
            segs.append([i, j])
            i = j + 1
        else:
            i += 1
    merged = []
    for s in segs:
        if merged and s[0] - merged[-1][1] < 12:
            merged[-1][1] = s[1]
        else:
            merged.append(s)
    out = []
    for a, b in merged:
        lo = a
        while lo > 0 and a - lo < 15 and env[lo - 1] > 0.1 * peak:
            lo -= 1
        hi = b
        while hi + 1 < n and hi - b < 40 and env[hi + 1] > 0.1 * peak:
            hi += 1
        length = max(25, min(160, hi - lo + 1))
        out.append({'start': lo / 100.0, 'dur': length / 100.0, 'energy': float((env[lo:lo + length] ** 2).sum())})
    return out


def pick(evts, which):
    if not evts:
        return None
    top = sorted(evts, key=lambda e: -e['energy'])[:2]
    if which == 'strongest':
        return top[0]
    if len(top) < 2:
        return top[0] if which == 'first' else None
    top.sort(key=lambda e: e['start'])
    return top[0] if which == 'first' else top[1]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--bundle', required=True)
    ap.add_argument('--slug', required=True)
    ap.add_argument('--key', required=True, help='domain key, e.g. tinh_mac (cue prefix tinh-mac-)')
    ap.add_argument('--root', default=str(Path(__file__).resolve().parents[2]))
    ap.add_argument('--allow-missing', action='store_true', help='write what the clips can supply and exit 0; scripts/hero/sfx-source.mjs fills the rest from the libraries')
    a = ap.parse_args()
    bundle = json.loads(Path(a.bundle).read_text(encoding='utf-8'))
    prefix = a.key.replace('_', '-')
    out_dir = Path(a.root) / 'assets' / 'audio' / 'sfx' / a.slug
    out_dir.mkdir(parents=True, exist_ok=True)
    cache, rows, skipped = {}, {}, []
    for role, label, which in JOBS:
        src = bundle['sources'].get(label)
        if not src:
            if label != 'vfx-passive':
                skipped.append(f'{role}: no {label} clip')
            continue
        if not src.get('audio'):
            skipped.append(f'{role}: {src["name"]} has no audio track')
            continue
        if label not in cache:
            cache[label] = events(pcm(src['path']))
        ev = pick(cache[label], which)
        if not ev:
            skipped.append(f'{role}: no sound event in {src["name"]}')
            continue
        dst = out_dir / f'{role}.wav'
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f"{ev['start']:.3f}", '-t', f"{ev['dur']:.3f}", '-i', src['path'],
                        '-vn', '-ac', '1', '-ar', str(SR), '-c:a', 'pcm_s16le', str(dst)], check=True)
        data = dst.read_bytes()
        cue = f'{prefix}-{role}'
        rows[cue] = {'file': f'{a.slug}/{role}.wav', 'source': src['name'], 'trim': [round(ev['start'], 3), round(ev['dur'], 3)],
                     'sha256': hashlib.sha256(data).hexdigest(), 'durationMs': int(round(ev['dur'] * 1000)),
                     'sampleRate': SR, 'channels': 1,
                     'provenance': f'audio of owner clip {label}, auto-picked {which} sound event, trimmed (not mixed); owner review pending'}
        print(f"{cue:26s} {src['name'].split('---')[0]:>12s} {ev['start']:.2f}s +{ev['dur']:.2f}s")
    prov_path = Path(a.root) / 'assets' / 'vfx' / a.slug / 'provenance.json'
    prov_path.parent.mkdir(parents=True, exist_ok=True)
    prov = json.loads(prov_path.read_text(encoding='utf-8')) if prov_path.exists() else {'source': {}, 'clips': {}}
    prov.setdefault('source', {})['sfx'] = 'audio tracks of the owner clips, auto-cut by scripts/hero/extract_sfx.py (trimmed, not mixed)'
    prov['sfx'] = {**prov.get('sfx', {}), **rows}
    prov_path.write_text(json.dumps(prov, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    packs = Path(a.bundle).parent
    (packs / 'sfx-rows.json').write_text(json.dumps({'cues': rows, 'skipped': skipped}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    for s in skipped:
        print('WARN ' + s)
    basic_ok = any(c.endswith(('-basic', '-basic-hit')) for c in rows)
    ult_ok = any(c.endswith(('-ultimate', '-ultimate-vfx', '-ultimate-hit')) for c in rows)
    if not (basic_ok and ult_ok):
        msg = 'basic and ultimate each need at least one cue (hero-doctor).'
        if a.allow_missing:
            print('EXTRACT SFX: ' + msg + ' Continuing - scripts/hero/sfx-source.mjs fills the rest from the libraries.')
        else:
            print('EXTRACT SFX FAIL: ' + msg + ' Add SKILLPACK WAVs by hand, or run with --allow-missing.')
            raise SystemExit(1)
    print(f'EXTRACT SFX PASS: {len(rows)} cues -> {out_dir}')


if __name__ == '__main__':
    main()
