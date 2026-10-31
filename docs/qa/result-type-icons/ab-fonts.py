"""A/B the word-mark typeface: Palatino Bold vs Bookman Old Style Bold vs Constantia Bold.

Writes alternates next to the chosen output so the preview page can compare them
without touching the shipped file.
"""
import importlib.util
import sys
from pathlib import Path

ROOT = Path(r'C:/lt/wt-result-icons')
spec = importlib.util.spec_from_file_location('rw2', ROOT / 'scripts/asset-design/result-words-v2.py')

# Re-run the module with a different FONT by patching the module attribute.
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)  # builds the shipped victory/defeat first

for label, font_path in [
    ('palatino', 'C:/Windows/Fonts/palab.ttf'),
    ('bookman', 'C:/Windows/Fonts/BOOKOSB.TTF'),
    ('constantia', 'C:/Windows/Fonts/constanb.ttf'),
]:
    mod.FONT = font_path
    for key in ('victory', 'defeat'):
        out_dir = ROOT / 'assets/result-art/result-word-alt'
        mod.OUT = out_dir
        out_dir.mkdir(parents=True, exist_ok=True)
        mod.OUT = out_dir
        # write with a font-specific name
        original_write = Path.write_text
        target = out_dir / f'{key}-{label}.svg'
        mod.build = mod.build  # keep reference
        # build() writes f'{key}.svg'; temporarily monkeypatch the destination name
        mod.WORDS[key]['_label'] = label
        mod.build(key, mod.WORDS[key])
        produced = out_dir / f'{key}.svg'
        if produced.exists():
            produced.replace(target)
        print('wrote', target)
