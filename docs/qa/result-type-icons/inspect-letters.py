"""Inspect the VICTORY/DEFEAT lettering pipeline: PNG letters, APNG first frame, SVG."""
from PIL import Image
from pathlib import Path

ROOT = Path(r'C:/lt/wt-result-icons')
OUT = ROOT / 'docs/qa/result-type-icons'
OUT.mkdir(parents=True, exist_ok=True)

items = [
    ('letters.png (in use)', 'assets/owner-refresh-20261018/result-victory-letters.png'),
    ('apng frame 1', 'assets/result-victory-v6/victory-text-clean-smooth-v5.apng'),
    ('defeat letters.png', 'assets/owner-refresh-20261018/result-defeat-letters.png'),
    ('defeat apng frame 1', 'assets/result-defeat-v4/defeat-clean-loop.apng'),
    ('victory wings', 'assets/owner-refresh-20261018/result-victory-wings.png'),
]

CELL_W, CELL_H, LABEL = 380, 260, 34
sheet = Image.new('RGB', (CELL_W * 2, (CELL_H + LABEL) * 3), (18, 14, 10))
from PIL import ImageDraw
draw = ImageDraw.Draw(sheet)

for i, (label, rel) in enumerate(items):
    p = ROOT / rel
    x = (i % 2) * CELL_W
    y = (i // 2) * (CELL_H + LABEL)
    try:
        im = Image.open(p)
        n_frames = getattr(im, 'n_frames', 1)
        im.seek(0)
        im = im.convert('RGBA')
        print(f'{label}: {im.width}x{im.height} frames={n_frames} mode={Image.open(p).mode}')
        thumb = im.copy()
        thumb.thumbnail((CELL_W - 16, CELL_H - 16), Image.LANCZOS)
        bg = Image.new('RGBA', (CELL_W, CELL_H), (18, 14, 10, 255))
        bg.alpha_composite(thumb, ((CELL_W - thumb.width) // 2, (CELL_H - thumb.height) // 2))
        sheet.paste(bg.convert('RGB'), (x, y))
        # opaque pixel bbox tells whether the asset is letters-only or full art
        bbox = im.getbbox()
        print('   bbox', bbox)
    except Exception as exc:  # noqa: BLE001
        print('FAIL', label, exc)
    draw.text((x + 8, y + CELL_H + 10), f'{i+1}. {label}', fill=(240, 226, 190))

sheet.save(OUT / 'letters-source.png')
print('WROTE', OUT / 'letters-source.png')
