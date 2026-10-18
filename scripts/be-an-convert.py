"""Reproducible source-video import; fixed registration per clip, never per frame.
FIXED: decode at 960x540 (3x the original 320x180) and scale the output cell /
body-height / foot-anchor constants by the same 3x factor so every downstream
placement math stays geometrically identical, just at 3x the pixel resolution.
Usage: python3 scripts/be-an-convert.py /path/to/upload
"""
import sys, pathlib, subprocess, json, hashlib, io
import numpy as np
from PIL import Image, ImageFilter, ImageDraw
from scipy.ndimage import label

ROOT=pathlib.Path(__file__).resolve().parents[1]
SOURCE=pathlib.Path(sys.argv[1])
OUT=ROOT/'assets/characters/be-an'; OUT.mkdir(parents=True,exist_ok=True)
mapping={'idle':'Character_standing','run':'Ta','basic':'Character_throwing','ultimate':'Animated_character','hit':'Character_hit','fall-die':'Character_falling','special':'Giant_seal_hugging','vfx-basic':'Ha','vfx-ultimate':'Giant_seal_falling'}
SCALE_FACTOR = 3
DECODE_W, DECODE_H = 320 * SCALE_FACTOR, 180 * SCALE_FACTOR   # was 320,180
BODY_HEIGHT = 160 * SCALE_FACTOR                               # was 160
FOOT_Y = 202 * SCALE_FACTOR                                    # was 202
W,H=352*SCALE_FACTOR, 224*SCALE_FACTOR          # idle/basic/run/ultimate/hit/fall-die
meta={'schema':'be-an-assets/v1','assetRevision':'source24-20261018-hires3x','clips':{},'sources':{}}
if (OUT/'runtime-meta.json').exists(): meta=json.loads((OUT/'runtime-meta.json').read_text())
def matte(rgb):
    a=np.asarray(rgb).astype(np.float32);r,g,b=a[:,:,0],a[:,:,1],a[:,:,2]
    # Green dominance, with a soft 12px-value transition and neutral despill.
    dominance=g-np.maximum(r,b)
    alpha=np.clip((28-dominance)/16,0,1)
    # Remove only disconnected source watermark at bottom right.
    labs,num=label(alpha>.1)
    watermark_x = int(280 * DECODE_W / 320)
    watermark_y = int(130 * DECODE_H / 180)
    for k in range(1,num+1):
        yy,xx=np.where(labs==k)
        if len(xx) and xx.min()>watermark_x and yy.min()>watermark_y: alpha[labs==k]=0
    a[:,:,1]=np.minimum(g,np.maximum(r,b)+8)
    return Image.fromarray(np.dstack((a,np.round(alpha*255))).astype('uint8'),'RGBA')
for kind,prefix in mapping.items():
    if len(sys.argv)>2 and kind not in sys.argv[2].split(','):continue
    cell_w = 384*SCALE_FACTOR if kind.startswith('vfx-') else 352*SCALE_FACTOR
    path=next(p for p in SOURCE.glob('*.mp4') if p.name.startswith(prefix))
    raw=subprocess.check_output(['ffmpeg','-v','error','-i',str(path),'-vf',f'scale={DECODE_W}:{DECODE_H}','-f','rawvideo','-pix_fmt','rgb24','-'])
    frames=np.frombuffer(raw,np.uint8).reshape(-1,DECODE_H,DECODE_W,3)
    keyed=[matte(Image.fromarray(f)) for f in frames]
    bounds=keyed[0].getbbox(); isv=kind.startswith('vfx-')
    # First-frame body registration remains fixed throughout the clip.
    scale=1 if isv else BODY_HEIGHT/max(1,bounds[3]-bounds[1])
    px=DECODE_W/2 if isv else (bounds[0]+bounds[2])/2
    py=DECODE_H if isv else bounds[3]
    # Transfer the released seal to the separate projectile layer. Remove only
    # disconnected components to the right of the body after the authored throw.
    release={'basic':43,'ultimate':76}.get(kind)
    if release is not None:
        for i in range(release,len(keyed)):
            a=np.array(keyed[i]);labs,num=label(a[:,:,3]>25)
            for k in range(1,num+1):
                yy,xx=np.where(labs==k)
                if len(xx) and xx.min()>px+22*SCALE_FACTOR and len(xx)<1400*SCALE_FACTOR*SCALE_FACTOR:a[labs==k,3]=0
            keyed[i]=Image.fromarray(a,'RGBA')
    pages=[]; count=len(keyed); perpage=24; cols=6
    for page in range((count+perpage-1)//perpage):
        batch=keyed[page*perpage:(page+1)*perpage];atlas=Image.new('RGBA',(cell_w*cols,H*4))
        for j,frame in enumerate(batch):
            frame=frame.resize((round(DECODE_W*scale),round(DECODE_H*scale)),Image.Resampling.LANCZOS)
            cell=Image.new('RGBA',(cell_w,H));cell.paste(frame,(round(cell_w/2-px*scale),round(FOOT_Y-py*scale)))
            atlas.paste(cell,(j%cols*cell_w,j//cols*H))
            if kind=='idle' and page==0 and j==0:
                cell.save(OUT/'avatar.webp',lossless=True)
        file=f'{kind}-{page}.webp';atlas.save(OUT/(file+'.png')); subprocess.run(['node','--input-type=module','-e',"import sharp from 'sharp';await sharp(process.argv[1]).webp({quality:90,alphaQuality:100}).toFile(process.argv[2]);",str(OUT/(file+'.png')),str(OUT/file)],cwd=ROOT,check=True);(OUT/(file+'.png')).unlink()
        pages.append({'file':file,'frames':len(batch),'cols':cols,'cellW':cell_w,'cellH':H,'durationMs':len(batch)*1000/24})
    meta['clips'][kind]={'file':pages[0]['file'],'frames':count,'cols':cols,'cellW':cell_w,'cellH':H,'durationMs':count*1000/24,'pageFrames':perpage,'pages':pages,'pivot':cell_w/2,'foot':FOOT_Y,'body':BODY_HEIGHT,'sourceFacing':1,'registrationScale':scale}
    meta['sources'][kind]={'file':path.name,'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'frames':count,'fps':24}
    print(kind,count,flush=True)
    if kind in ['vfx-basic','vfx-ultimate','special']:
        audio=ROOT/'assets/audio/sfx/be-an';audio.mkdir(parents=True,exist_ok=True)
        subprocess.run(['ffmpeg','-v','error','-y','-i',str(path),'-vn','-ar','48000','-ac','2',str(audio/(kind+'.wav'))],check=True)
(OUT/'runtime-meta.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2)+'\n')
