"""Clean one owner voice-over file for the hero screen.

Owner 2026-10-24: every voice file he sends is ONLY the hero-screen line (no ultimate voice), and it must be
cleaned: cut the dead air before and after, keep only the spoken line.

  python scripts/hero/clean-voice.py <input audio> <hero slug>
      -> assets/audio/voice-<slug>-hero.mp3

How: 20 ms energy windows within 24 dB of the loudest one mark where speech starts and ends; the clip is cut there with a short
pad, faded 30 ms in / 50 ms out so the cut never clicks, loudness-normalised to -18 LUFS (TP -1 dB) so every hero
plays at the same level, mono 44.1 kHz 128 kbps. Pauses INSIDE the line are kept untouched.
"""
import re
import subprocess
import sys
from pathlib import Path

FF = r'C:\ffmpeg\bin\ffmpeg.exe'
PROBE = r'C:\ffmpeg\bin\ffprobe.exe'
ROOT = Path(__file__).resolve().parents[2]
PAD_IN, PAD_OUT = 0.10, 0.04


def duration(src):
    out = subprocess.run([PROBE, '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', src],
                         capture_output=True, text=True, check=True).stdout
    return float(out.strip())


def speech_bounds(src, total):
    """Speech = runs of 20 ms windows within 24 dB of the loudest one, pauses < 0.3 s merged, lone blips < 0.12 s
    dropped. A fixed -40 dB silence gate kept Cô Nương's 1.2 s of breath/room noise after the line."""
    import numpy as np
    raw = subprocess.run([FF, '-v', 'error', '-i', src, '-f', 's16le', '-ac', '1', '-ar', '16000', '-'],
                         capture_output=True, check=True).stdout
    x = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0
    win = 320                                           # 20 ms at 16 kHz
    n = len(x) // win
    if n == 0:
        raise SystemExit(f'empty audio: {src}')
    rms = np.sqrt((x[:n * win].reshape(n, win) ** 2).mean(axis=1) + 1e-12)
    db = 20 * np.log10(rms)
    # Broadband noise (mic rustle / hiss) is as loud as the voice but crosses zero far more often: speech windows
    # sit at 0.03-0.23, Nguyệt Diệp's 1.3 s rustle after her line at 0.59. A run of zcr > 0.45 lasting 0.3 s or more
    # is noise, not a word ('s'/'x' consonants are much shorter), so it is muted before gating.
    fr = x[:n * win].reshape(n, win)
    zcr = (np.abs(np.diff(np.sign(fr), axis=1)) > 0).mean(axis=1)
    noisy = zcr > 0.45
    k = 0
    while k < n:
        if noisy[k]:
            m = k
            while m < n and noisy[m]:
                m += 1
            if (m - k) * 0.02 >= 0.3:
                db[k:m] = -120.0
            k = m
        else:
            k += 1
    # 24 dB under the loudest window: Cô Nương's room noise / breath after the line sits 28-36 dB down and must go.
    gate = max(db.max() - 24.0, -50.0)
    on = db > gate
    segs, i = [], 0
    while i < n:
        if on[i]:
            j = i
            while j < n and on[j]:
                j += 1
            segs.append([i, j]); i = j
        else:
            i += 1
    merged = []
    for a, b in segs:                                   # pauses inside the line (< 0.3 s) stay part of it
        if merged and (a - merged[-1][1]) * 0.02 < 0.3:
            merged[-1][1] = b
        else:
            merged.append([a, b])
    # a lone click / breath away from the line (shorter than 0.12 s) is not speech
    speech = [m for m in merged if (m[1] - m[0]) * 0.02 >= 0.12]
    if not speech:
        raise SystemExit(f'no speech found in {src}')
    begin = speech[0][0] * 0.02
    # End right after the last real syllable (owner 2026-10-24: 'cắt sát hơn khi nhân vật nói từ cuối cùng'):
    # the last window within 15 dB of the peak is the last word; follow its decay while it stays above the gate.
    # Breaths and clicks after it (Cô Nương: -27 dB at 4.96 s) never reach -15 dB, so they are cut.
    loud = np.where(db > db.max() - 15.0)[0]
    j = int(loud[-1])
    while j + 1 < n and db[j + 1] > gate:
        j += 1
    finish = (j + 1) * 0.02
    if finish - begin < 0.3:
        raise SystemExit(f'no speech found in {src} (begin {begin:.2f}, end {finish:.2f})')
    return max(0.0, begin - PAD_IN), min(total, finish + PAD_OUT)


def main():
    if len(sys.argv) != 3:
        raise SystemExit(__doc__)
    src, slug = sys.argv[1], sys.argv[2]
    total = duration(src)
    a, b = speech_bounds(src, total)
    dur = b - a
    out = ROOT / 'assets' / 'audio' / f'voice-{slug}-hero.mp3'
    af = f'afade=t=in:st=0:d=0.03,afade=t=out:st={max(0.0, dur - 0.05):.3f}:d=0.05,loudnorm=I=-18:TP=-1.0:LRA=11'
    subprocess.run([FF, '-y', '-hide_banner', '-loglevel', 'error', '-ss', f'{a:.3f}', '-t', f'{dur:.3f}', '-i', src,
                    '-af', af, '-ar', '44100', '-ac', '1', '-b:a', '128k', str(out)], check=True)
    print(f'{out.relative_to(ROOT)}  source {total:.2f}s -> speech {a:.2f}-{b:.2f}s ({dur:.2f}s, '
          f'cut {a:.2f}s head / {total - b:.2f}s tail)  {out.stat().st_size // 1024} KB')


if __name__ == '__main__':
    main()
