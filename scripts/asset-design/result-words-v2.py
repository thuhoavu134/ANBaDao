"""Deterministic VICTORY / DEFEAT word marks, v2.

Same principle as result-words.py: text is converted to outlines so no mobile
font substitution can change the shape, and the result is a vector SVG so it
stays crisp at any device-pixel-ratio. What changed in v2:

* a chiselled serif face (Constantia Bold) instead of the generic DejaVu face,
* a tight viewBox around the letters (v1 carried ~70% empty canvas, which made
  the CSS `width:100%` box misrepresent the real letter size),
* a layered metal treatment — dark rim, four-stop gold gradient, top-edge
  highlight and bottom-edge shadow clipped inside the letters, plus a soft
  contact shadow — so the word reads over the busy wing artwork,
* per-word palettes (gold for victory, cold steel for defeat).

Run:  python scripts/asset-design/result-words-v2.py
Out:  assets/result-art/result-word-v2/{victory,defeat}.svg
"""
from pathlib import Path

from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'assets/result-art/result-word-v2'
OUT.mkdir(parents=True, exist_ok=True)

# Constantia Bold: wedge serifs that hold up at phone size and echo the crest's
# blade-like feather tips. Outlines only, so no mobile font substitution can change it.
FONT = 'C:/Windows/Fonts/constanb.ttf'

WORDS = {
    'victory': {
        'text': 'VICTORY',
        'cap': 100.0,
        'tracking': 0.05,          # em
        'palette': {
            'rim': '#2a1404',
            'stops': ['#fffbe2', '#f7d98c', '#c4822d', '#f2cd7d'],
            'edge_light': '#fff6d0',
            'edge_dark': '#8d4f13',
            'glow': '#ffbe3d',
        },
    },
    'defeat': {
        'text': 'DEFEAT',
        'cap': 100.0,
        'tracking': 0.06,
        'palette': {
            'rim': '#0f0b10',
            'stops': ['#fdfaf1', '#d6d9e1', '#7e828d', '#c6cad3'],
            'edge_light': '#ffffff',
            'edge_dark': '#4b4d57',
            'glow': '#a82c22',
        },
    },
}


def build(word_key, spec):
    font = TTFont(FONT)
    glyphs = font.getGlyphSet()
    cmap = font.getBestCmap()
    upem = font['head'].unitsPerEm
    cap = getattr(font['OS/2'], 'sCapHeight', None) or int(upem * 0.7)
    scale = spec['cap'] / cap
    tracking = spec['tracking'] * upem

    names = [cmap[ord(c)] for c in spec['text']]
    advances = [glyphs[n].width for n in names]
    total = sum(advances) + tracking * (len(names) - 1)

    x = 0.0
    parts = []
    for name, advance in zip(names, advances):
        pen = SVGPathPen(glyphs)
        glyphs[name].draw(TransformPen(pen, (scale, 0, 0, -scale, x * scale, spec['cap'])))
        parts.append(pen.getCommands())
        x += advance + tracking

    path = ' '.join(parts)
    pad = 8.0            # room for the rim + glow inside the viewBox
    width = round(total * scale + pad * 2, 2)
    height = round(spec['cap'] + pad * 2, 2)
    offset = f'translate({pad} 0)'
    mid = pad + spec['cap'] * 0.52

    pal = spec['palette']
    stops = ''.join(
        f'<stop offset="{o}" stop-color="{c}"/>'
        for o, c in zip([0, .18, .46, .72, .88, 1],
                        [pal['stops'][0], pal['stops'][0], pal['stops'][1],
                         pal['stops'][2], pal['stops'][2], pal['stops'][3]])
    )
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" role="img" aria-label="{spec['text']}">
<title>{spec['text']}</title>
<defs>
<linearGradient id="metal" x1="0" y1="0" x2="0" y2="1">{stops}</linearGradient>
<linearGradient id="gloss" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="#ffffff" stop-opacity=".42"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
</linearGradient>
<clipPath id="letters"><path d="{path}" transform="{offset}"/></clipPath>
<filter id="soft" x="-14%" y="-30%" width="128%" height="160%">
<feGaussianBlur stdDeviation="2.4"/>
</filter>
</defs>
<g clip-path="url(#letters)">
<rect x="0" y="{pad}" width="{width}" height="{height}" fill="url(#metal)"/>
<rect x="0" y="{pad - 2}" width="{width}" height="{spec['cap'] * 0.42}" fill="url(#gloss)"/>
<rect x="0" y="{mid}" width="{width}" height="{spec['cap'] * 0.5}" fill="{pal['edge_dark']}" opacity=".20"/>
</g>
<path d="{path}" transform="{offset}" fill="none" stroke="{pal['glow']}" stroke-width="7" stroke-linejoin="round" opacity=".30" filter="url(#soft)"/>
<path d="{path}" transform="{offset}" fill="{pal['rim']}" stroke="{pal['rim']}" stroke-width="6.5" stroke-linejoin="round"/>
<g clip-path="url(#letters)">
<path d="{path}" transform="{offset}" fill="url(#metal)"/>
<path d="{path}" transform="{offset}" fill="none" stroke="{pal['edge_light']}" stroke-width="2.6" stroke-opacity=".75" stroke-linejoin="round"/>
<g transform="translate(0 2.4)"><path d="{path}" transform="{offset}" fill="none" stroke="{pal['edge_dark']}" stroke-width="2.4" stroke-opacity=".5" stroke-linejoin="round"/></g>
</g>
</svg>
'''
    dest = OUT / f'{word_key}.svg'
    dest.write_text(svg, encoding='utf-8')
    print(f'{dest}  ratio={width / height:.3f}  viewBox=0 0 {width} {height}')


for key, spec in WORDS.items():
    build(key, spec)
