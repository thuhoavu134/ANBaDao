"""Verify each face shot really renders the intended word/palette (no trusting OCR)."""
from PIL import Image
from pathlib import Path

ROOT = Path(r'C:/lt/wt-result-icons/docs/qa/result-type-icons')
BAND = (0, 150, 750, 420)   # device px around the word


def stats(path):
    im = Image.open(path).convert('RGB').crop(BAND)
    px = im.load()
    gold = silver = 0
    for y in range(0, im.height, 2):
        for x in range(0, im.width, 2):
            r, g, b = px[x, y]
            if r > 170 and g > 130 and b < 130 and r - b > 60:
                gold += 1
            elif r > 150 and g > 150 and b > 150 and abs(r - b) < 26 and abs(r - g) < 26:
                silver += 1
    return gold, silver


for word in ('victory', 'defeat'):
    for face in ('palatino', 'bookman', 'constantia'):
        p = ROOT / f'face-{word}-{face}.png'
        g, s = stats(p)
        print(f'{word:8s} {face:11s} gold={g:6d} silver={s:6d} verdict={"GOLD" if g > s * 2 else "SILVER" if s > g else "MIXED"}')
