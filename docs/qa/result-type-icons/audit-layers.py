"""Render each result-screen art layer on its own so we can see where VICTORY lives."""
from PIL import Image, ImageDraw
from pathlib import Path

ROOT = Path(r'C:/lt/wt-result-icons')
OUT = ROOT / 'docs/qa/result-type-icons'
OUT.mkdir(parents=True, exist_ok=True)

layers = [
    ('stage.apng f0', 'assets/result-victory-v6/victory-stage-original-quality-smooth-v5.apng'),
    ('card.png', 'assets/result-victory-v6/victory-info-card-portrait-v6.png'),
    ('wings.png', 'assets/owner-refresh-20261018/result-victory-wings.png'),
    ('letters.png', 'assets/owner-refresh-20261018/result-victory-letters.png'),
    ('title.apng f0', 'assets/result-victory-v6/victory-text-clean-smooth-v5.apng'),
    ('defeat stage f0', 'assets/result-defeat-v4/victory-stage-original-quality-smooth-v5.apng'),
    ('defeat wings', 'assets/owner-refresh-20261018/result-defeat-wings.png'),
]

# Composite onto a checker-ish dark background so alpha is obvious.
CELL_W, CELL_H, LABEL = 400, 250, 30
cols = 2
rows = (len(layers) + cols - 1) // cols
sheet = Image.new('RGB', (CELL_W * cols, (CELL_H + LABEL) * rows), (10, 10, 12))
draw = ImageDraw.Draw(sheet)

for i, (label, rel) in enumerate(layers):
    p = ROOT / rel
    x, y = (i % cols) * CELL_W, (i // cols) * (CELL_H + LABEL)
    try:
        im = Image.open(p)
        im.seek(0)
        im = im.convert('RGBA')
        print(f'{label}: {im.width}x{im.height} frames={getattr(Image.open(p), "n_frames", 1)}')
        thumb = im.copy()
        thumb.thumbnail((CELL_W - 12, CELL_H - 12), Image.LANCZOS)
        bg = Image.new('RGBA', (CELL_W, CELL_H), (10, 10, 12, 255))
        bg.alpha_composite(thumb, ((CELL_W - thumb.width) // 2, (CELL_H - thumb.height) // 2))
        sheet.paste(bg.convert('RGB'), (x, y))
        # where is the topmost bright (text-like) pixel row in the middle 60%?
        w, h = im.size
        px = im.load()
        rows_hit = []
        for yy in range(int(h * 0.02), int(h * 0.55)):
            bright = sum(1 for xx in range(int(w * 0.2), int(w * 0.8))
                         if px[xx, yy][3] > 180 and sum(px[xx, yy][:3]) > 560)
            if bright > 6:
                rows_hit.append(yy)
        if rows_hit:
            print(f'   bright-band rows {rows_hit[0]}..{rows_hit[-1]} of {h} ({(rows_hit[0]/h):.2f}..{(rows_hit[-1]/h):.2f})')
    except Exception as exc:  # noqa: BLE001
        print('FAIL', label, exc)
    draw.text((x + 8, y + CELL_H + 8), f'{i+1}. {label}', fill=(240, 226, 190))

sheet.save(OUT / 'layer-audit.png')
print('WROTE', OUT / 'layer-audit.png')
