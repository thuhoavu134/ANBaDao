"""Deterministic vector typography; wings remain the owner's animated assets.
DejaVu Serif Bold (Bitstream Vera/DejaVu license), converted to outlines so
mobile font availability cannot change shape. No raster enlargement.
"""
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
font=TTFont('/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf')
glyphs=font.getGlyphSet(); cmap=font.getBestCmap()
out=Path(__file__).resolve().parents[2]/'assets/owner-refresh-20261018'
for word,w,h,y,colors in [('VICTORY',314,65,15,['#fff5c8','#eec66b','#ae691f']),('DEFEAT',212,49,5,['#f5f2e8','#bfc5cd','#737882'])]:
 names=[cmap[ord(c)] for c in word]; gap=50
 total=sum(glyphs[n].width for n in names)+gap*(len(names)-1)
 cap=font['OS/2'].sCapHeight if hasattr(font['OS/2'],'sCapHeight') else 1493
 sx=w/total;sy=h/cap;x=0;paths=[]
 for name in names:
  pen=SVGPathPen(glyphs);glyphs[name].draw(TransformPen(pen,(sx,0,0,-sy,(480-w)/2+x*sx,y+h)));paths.append(pen.getCommands());x+=glyphs[name].width+gap
 height=280 if word=='VICTORY' else 240
 d=' '.join(paths)
 svg=f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 {height}" role="img" aria-label="{word}">
<defs><linearGradient id="metal" x1="0" y1="0" x2="0" y2="1"><stop stop-color="{colors[0]}"/><stop offset=".48" stop-color="{colors[1]}"/><stop offset=".52" stop-color="{colors[2]}"/><stop offset="1" stop-color="{colors[1]}"/></linearGradient></defs>
<path d="{d}" transform="translate(0 2)" fill="#21180f" stroke="#21180f" stroke-width="3" stroke-linejoin="round"/>
<path d="{d}" fill="url(#metal)" stroke="#583b20" stroke-width="1.2" stroke-linejoin="round"/>
</svg>'''
 (out/f'result-{word.lower()}-word.svg').write_text(svg)
