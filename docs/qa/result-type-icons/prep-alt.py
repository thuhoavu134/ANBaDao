"""Copy preview assets into dist and shoot the three typeface alternates."""
import shutil
from pathlib import Path
from PIL import Image, ImageDraw
import subprocess
import os

ROOT = Path(r'C:/lt/wt-result-icons')
dist_alt = ROOT / 'dist/assets/result-art/result-word-alt'
dist_alt.mkdir(parents=True, exist_ok=True)
for f in (ROOT / 'assets/result-art/result-word-alt').glob('*.svg'):
    shutil.copy2(f, dist_alt / f.name)
shutil.copy2(ROOT / 'docs/qa/result-type-icons/word-preview.html', ROOT / 'dist/word-preview.html')
print('assets copied:', len(list(dist_alt.glob('*.svg'))))
