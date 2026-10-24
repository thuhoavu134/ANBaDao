"""Clean a whole folder of owner voice-over files and print the wiring rows.

Owner rule (2026-10-24): every file he sends is the HERO SCREEN line only, and it must be cleaned before it enters
the game - dead air and breath/noise before and after the line are cut, only the speech stays.

    python scripts/hero/voice-import.py <folder> [--slug-from-name]

File naming decides the hero: `nguyetdiep1.mp3`, `nguyet-diep.mp3` and `Nguyet Diep.mp3` all resolve to the hero
slug by matching the roster, so a folder from Telegram (which appends ---uuid) works as-is. Each file is cleaned with
scripts/hero/clean-voice.py into assets/audio/voice-<slug>-hero.mp3, then the script prints the HERO_VOICE_LINES rows
to paste into index.html and flags any file it could not match (nothing is guessed silently).
"""
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PY = sys.executable
AUDIO_EXT = {'.mp3', '.m4a', '.wav', '.ogg', '.aac', '.opus', '.flac'}


def roster_slugs():
    slugs = set()
    chars = ROOT / 'assets' / 'characters'
    if chars.exists():
        slugs.update(d.name for d in chars.iterdir() if d.is_dir())
    meta = ROOT / 'src' / 'domain' / 'hero'
    for f in meta.glob('*.mjs'):
        slugs.update(re.findall(r"key:\s*'([a-z0-9_]+)'", f.read_text(encoding='utf-8', errors='ignore')))
    return {s.replace('-', '_') for s in slugs}


def digits_stripped(name):
    return re.sub(r'---[0-9a-f-]{8,}.*$', '', name)          # Telegram uuid suffix


def guess_slug(filename, slugs):
    stem = Path(digits_stripped(filename)).stem.lower()
    flat = re.sub(r'[^a-z0-9]', '', stem)
    flat = re.sub(r'\d+$', '', flat)                        # trailing take number
    best = None
    for s in slugs:
        f = s.replace('_', '')
        if flat == f or flat.startswith(f):
            if not best or len(f) > len(best[1]):
                best = (s, f)
    return best[0] if best else None


def main():
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    folder = Path(sys.argv[1])
    files = sorted(p for p in folder.iterdir() if p.suffix.lower() in AUDIO_EXT)
    if not files:
        raise SystemExit(f'no audio in {folder}')
    slugs = roster_slugs()
    done, missed = [], []
    for f in files:
        slug = guess_slug(f.name, slugs)
        if not slug:
            missed.append(f.name); continue
        r = subprocess.run([PY, str(ROOT / 'scripts' / 'hero' / 'clean-voice.py'), str(f), slug.replace('_', '-')],
                           capture_output=True, text=True)
        line = (r.stdout or r.stderr).strip().splitlines()[-1] if (r.stdout or r.stderr).strip() else 'no output'
        print(('OK   ' if r.returncode == 0 else 'FAIL ') + f.name + ' -> ' + slug + ' | ' + line)
        if r.returncode == 0:
            done.append(slug)
    print()
    print('HERO_VOICE_LINES rows (paste into index.html):')
    for slug in done:
        print(f"  {slug}:{{hero:'assets/audio/voice-{slug.replace('_', '-')}-hero.mp3'}},")
    if missed:
        print('\nKHONG KHOP TEN (can owner dat ten theo slug):')
        for n in missed:
            print('  ', n)
    print(f'\n{len(done)} cleaned, {len(missed)} unmatched')


if __name__ == '__main__':
    main()
