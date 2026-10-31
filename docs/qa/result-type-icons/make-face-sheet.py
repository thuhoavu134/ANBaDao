"""Contact sheet: 3 typefaces x victory/defeat, cropped to the crest."""
from PIL import Image, ImageDraw
from pathlib import Path

ROOT = Path(r'C:/lt/wt-result-icons/docs/qa/result-type-icons')
CROP_H = 620
faces = ['palatino', 'bookman', 'constantia']
words = ['victory', 'defeat']
CELL_W, CELL_H = 375, CROP_H // 2
sheet = Image.new('RGB', (CELL_W * len(words), (CELL_H + 24) * len(faces)), (12, 12, 14))
d = ImageDraw.Draw(sheet)
for r, face in enumerate(faces):
    for c, word in enumerate(words):
        p = ROOT / f'face-{word}-{face}.png'
        im = Image.open(p).convert('RGB').crop((0, 0, 750, CROP_H)).resize((CELL_W, CELL_H), Image.LANCZOS)
        x, y = c * CELL_W, r * (CELL_H + 24)
        sheet.paste(im, (x, y))
        d.text((x + 6, y + CELL_H + 5), f'{word} / {face}', fill=(240, 226, 190))
out = ROOT / 'face-sheet.png'
sheet.save(out)
print('WROTE', out, sheet.size)
