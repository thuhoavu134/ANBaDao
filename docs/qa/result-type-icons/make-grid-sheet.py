"""Contact sheet: word-mark geometry variants (top crest area only)."""
from PIL import Image, ImageDraw
import glob
import os

ROOT = r'C:/lt/wt-result-icons/docs/qa/result-type-icons'
CROP_H = 760          # device px: keeps the crest + MVP name
COLS = 2
files = sorted(glob.glob(os.path.join(ROOT, 'grid-victory-375-*.png')))
cells = []
for f in files:
    im = Image.open(f).convert('RGB').crop((0, 0, 750, CROP_H))
    thumb = im.resize((375, CROP_H // 2), Image.LANCZOS)
    cells.append((os.path.basename(f).replace('grid-victory-375-', '').replace('.png', ''), thumb))

HEIGHT = CROP_H // 2 + 26
sheet = Image.new('RGB', (375 * COLS, HEIGHT * ((len(cells) + 1) // 2)), (12, 12, 14))
d = ImageDraw.Draw(sheet)
for i, (label, im) in enumerate(cells):
    x, y = (i % COLS) * 375, (i // COLS) * HEIGHT
    sheet.paste(im, (x, y))
    d.text((x + 6, y + im.height + 6), label, fill=(240, 226, 190))
out = os.path.join(ROOT, 'grid-sheet.png')
sheet.save(out)
print('WROTE', out, sheet.size)
