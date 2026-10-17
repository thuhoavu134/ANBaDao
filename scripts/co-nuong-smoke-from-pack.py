"""Pack dark falling Cổ Mộ mist and upscale Ultimate 2x per frame.
Usage: python scripts/co-nuong-smoke-from-pack.py /path/to/KIEMTHE-VFX-SFX-FULL-20261017.zip
Pillow; original offsets and alpha preserved. No generated replacement artwork.
"""
import io
import json
import sys
import zipfile
from pathlib import Path
from PIL import Image, ImageFilter
root = Path(__file__).resolve().parents[1]
with zipfile.ZipFile(sys.argv[1]) as archive:
    for code, filename, width, height, factor in [
        ('zgm_125_hmrx_a', 'vfx-parasite-smoke', 224, 224, 1),
        ('zgm_110_wnrf_a', 'vfx-ultimate', 200, 210, 2),
    ]:
        source = 'SKILLPACK/vfx/gumu/' + code + '/'
        info = json.loads(archive.read(source + 'info.json'))
        assert len(info['frames']) == 15
        cols, padding = 5, 12
        atlas = Image.new('RGBA', (cols * width * factor, 3 * height * factor))
        for index, frame in enumerate(info['frames']):
            name = frame['png']
            assert '/' not in name and '\\' not in name and '..' not in name
            image = Image.open(io.BytesIO(archive.read(source + name))).convert('RGBA')
            assert image.width + frame['ox'] <= width - 2 * padding
            assert image.height + frame['oy'] <= height - 2 * padding
            cell = Image.new('RGBA', (width, height))
            cell.paste(image, (padding + frame['ox'], padding + frame['oy']))
            if factor > 1:
                # Pillow RGBA resize uses premultiplied alpha; sharpen RGB only, retain resized alpha.
                cell = cell.resize((width * factor, height * factor), Image.Resampling.LANCZOS)
                alpha = cell.getchannel('A')
                cell = cell.convert('RGB').filter(ImageFilter.UnsharpMask(radius=.7, percent=65, threshold=3)).convert('RGBA')
                cell.putalpha(alpha)
            atlas.paste(cell, ((index % cols) * width * factor, (index // cols) * height * factor))
        output = root / 'assets/vfx/co-nuong' / (filename + '.webp')
        atlas.save(output, lossless=factor==1, quality=95, method=6)
        metadata = dict(archive=Path(sys.argv[1]).name, source=source+'info.json', code=code,
            frameCount=15, intervalMs=60, cols=cols, cellW=width*factor, cellH=height*factor,
            padding=padding*factor, upscale=factor, blend='source-over' if factor==1 else 'screen',
            processing='Original RGBA' if factor==1 else 'Per-frame 2x Lanczos, RGB unsharp radius .7 percent 65 threshold 3; resized alpha unchanged', sourceInfo=info)
        output.with_suffix('.source.json').write_text(json.dumps(metadata, ensure_ascii=False, indent=2)+'\n')
        print(output)
