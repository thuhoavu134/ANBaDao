"""Switch the word mark to Constantia Bold (chosen from the face A/B)."""
from pathlib import Path

p = Path(r'C:/lt/wt-result-icons/scripts/asset-design/result-words-v2.py')
s = p.read_text(encoding='utf-8')
s = s.replace("FONT = 'C:/Windows/Fonts/palab.ttf'", "FONT = 'C:/Windows/Fonts/constanb.ttf'")
s = s.replace("# Windows core serif with calligraphic flared stems; outlines only.",
              "# Constantia Bold: wedge serifs that hold up at phone size and echo the crest's\n# blade-like feather tips. Outlines only, so no mobile font substitution can change it.")
s = s.replace("* a warmer engraved serif face (Palatino) instead of the generic DejaVu face,",
              "* a chiselled serif face (Constantia Bold) instead of the generic DejaVu face,")
p.write_text(s, encoding='utf-8')
print('font switched:', 'constanb' in s)
