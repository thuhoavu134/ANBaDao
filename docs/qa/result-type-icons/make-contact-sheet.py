"""Contact sheet of candidate reward icons, labelled, for visual family check."""
from PIL import Image, ImageDraw
from pathlib import Path

ROOT = Path(r'C:/lt/wt-result-icons')
items = [
    ('result-icons-art/gold-imagen', 'assets/result-icons-art/gold-imagen.png'),
    ('result-icons-art/mastery-imagen', 'assets/result-icons-art/mastery-imagen.png'),
    ('result-icons-art/scroll-imagen', 'assets/result-icons-art/scroll-imagen.png'),
    ('result-icons-art/hero-shard-imagen', 'assets/result-icons-art/hero-shard-imagen.png'),
    ('meta/economy/icon-gems', 'assets/meta/economy/icon-gems.png'),
    ('menu-v3233/resource-gem-imagen', 'assets/ui/menu-v3233/icons/resource-gem-imagen.png'),
    ('menu-v3233/resource-gold-imagen', 'assets/ui/menu-v3233/icons/resource-gold-imagen.png'),
    ('items/materials/gold', 'assets/items/materials/gold.png'),
    ('result-art/master-v3155/reward', 'assets/result-art/master-v3155/reward.png'),
]
CELL = 190
LABEL = 42
cols = 3
rows = (len(items) + cols - 1) // cols
sheet = Image.new('RGB', (cols * CELL, rows * (CELL + LABEL)), (24, 20, 16))
draw = ImageDraw.Draw(sheet)
for i, (name, rel) in enumerate(items):
    p = ROOT / rel
    x = (i % cols) * CELL
    y = (i // cols) * (CELL + LABEL)
    try:
        im = Image.open(p).convert('RGBA')
        im.thumbnail((CELL - 14, CELL - 14), Image.LANCZOS)
        bg = Image.new('RGBA', (CELL, CELL), (24, 20, 16, 255))
        bg.alpha_composite(im, ((CELL - im.width) // 2, (CELL - im.height) // 2))
        sheet.paste(bg.convert('RGB'), (x, y))
        print(f'{name}: {im.width}x{im.height}')
    except Exception as exc:  # noqa: BLE001
        print('FAIL', name, exc)
    draw.text((x + 6, y + CELL + 12), f'{i+1}. {name}', fill=(240, 225, 190))
out = ROOT / 'docs/qa/result-type-icons/candidates.png'
out.parent.mkdir(parents=True, exist_ok=True)
sheet.save(out)
print('WROTE', out)
