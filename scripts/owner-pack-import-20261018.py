"""Import owner RGBA atlases. Usage: python script.py <upload-directory>.
No keying, per-frame recentering, or generated artwork. Runtime adapters retain
existing action clocks, atlas layouts and cache owners. Requires Pillow/ffmpeg.
"""
import hashlib, io, json, subprocess, sys, zipfile
from pathlib import Path
from PIL import Image

root=Path(__file__).resolve().parents[1]
upload=Path(sys.argv[1]); out=root/'assets/owner-refresh-20261018';out.mkdir(parents=True,exist_ok=True)
manifest={'schema':'owner-refresh/v1','baseline':'1b271d439b3effd46e34e33e13701f7998d7ffde','archives':[], 'clips':{}}
def digest(b):return hashlib.sha256(b).hexdigest()
for pattern,prefix in [('kiemthe-victory*.zip','result'),('*6st.zip','dinh'),('vfxdinhdong.zip','dinh-fx'),('idle vfx*.zip','thay')]:
    archive=next(upload.glob(pattern));raw=archive.read_bytes();z=zipfile.ZipFile(io.BytesIO(raw))
    manifest['archives'].append({'file':archive.name,'sha256':digest(raw)})
    for name in z.namelist():
        if not name.endswith('/metadata.json'):continue
        meta=json.loads(z.read(name));state=Path(name).parent.name;key=prefix+'-'+state
        atlasName=str(Path(name).parent/meta['atlasPages'][0]['file']);atlas=Image.open(io.BytesIO(z.read(atlasName))).convert('RGBA')
        cols=meta['atlasPages'][0]['columns'];count=meta['frameCount'];w,h=meta['crop']['cell']
        runtimeW,runtimeH=w,h
        if prefix in ['dinh','thay'] and state!='vfx-ultimate':
            runtimeW,runtimeH=300,275
            packed=Image.new('RGBA',(cols*runtimeW,((count+cols-1)//cols)*runtimeH))
            for i in range(count):packed.paste(atlas.crop((i%cols*w,i//cols*h,i%cols*w+w,i//cols*h+h)).resize((runtimeW,runtimeH),Image.Resampling.LANCZOS),(i%cols*runtimeW,i//cols*runtimeH))
        else:packed=atlas
        encoded=io.BytesIO();packed.save(encoded,format='WEBP',quality=90,method=3)
        assert len(encoded.getvalue())>100
        (out/(key+'.webp')).write_bytes(encoded.getvalue())
        durations=[f['durationMs'] for f in meta['frames']] if isinstance(meta.get('frames'),list) and 'durationMs' in meta['frames'][0] else [4000/count]*count
        manifest['clips'][key]={'file':key+'.webp','frames':count,'cols':cols,'cellW':runtimeW,'cellH':runtimeH,'durations':durations,'runtimeDensity':runtimeW/w,'sourceMetadata':meta,'sourceAtlasSha256':digest(z.read(atlasName))}
        if prefix=='result':
            x,y=meta['crop']['contentOffset'];cw,ch=meta['crop']['contentSizeNoUpscale'];frames=[]
            for i in range(count):frames.append(atlas.crop((i%cols*w+x,i//cols*h+y,i%cols*w+x+cw,i//cols*h+y+ch)))
            frames[0].save(out/(key+'-animated.webp'),save_all=True,append_images=frames[1:],duration=[222]*17+[226],loop=0,quality=92,method=3)
z=zipfile.ZipFile(upload/'KIEMTHE-VFX-SFX-FULL-20261017.zip');base='SKILLPACK/vfx/tianwang/tw_70_jzz_b/';info=json.loads(z.read(base+'info.json'))
atlas=Image.new('RGBA',(128*5,160*3))
for i,f in enumerate(info['frames']):
    im=Image.open(io.BytesIO(z.read(base+f['png']))).convert('RGBA');atlas.paste(im,(i%5*128+f['ox'],i//5*160+f['oy']))
atlas.save(out/'dinh-shield.webp',lossless=True,method=3)
manifest['clips']['dinh-shield']={'file':'dinh-shield.webp','frames':15,'cols':5,'cellW':128,'cellH':160,'durations':[60]*15,'sourceMetadata':info,'blend':'screen'}
for pattern,prefix in [('sfxdinhdong.zip','dinh'),('sfx ulti*.zip','thay')]:
    archive=next(upload.glob(pattern));raw=archive.read_bytes();z=zipfile.ZipFile(io.BytesIO(raw));manifest['archives'].append({'file':archive.name,'sha256':digest(raw)})
    for name in z.namelist():
        if name.endswith('.wav'):
            key=prefix+('-atk' if 'atk' in name else '-ultimate');dest=out/(key+'-source.wav');dest.write_bytes(z.read(name))
            manifest.setdefault('audio',{})[key]={'file':dest.name,'source':name,'sha256':digest(z.read(name))}
# Short repeated pierce cue derived from the already used Kiếm Thế launch sample.
z=zipfile.ZipFile(upload/'KIEMTHE-VFX-SFX-FULL-20261017.zip');cue=next(n for n in z.namelist() if n.endswith('/tm_shyy_c.wav'));tmp=out/'pierce-source.wav';tmp.write_bytes(z.read(cue));dest=root/'assets/audio/sfx/co-nuong/pierce.wav';dest.parent.mkdir(parents=True,exist_ok=True)
subprocess.run(['ffmpeg','-y','-loglevel','error','-i',str(tmp),'-af','atrim=start=0.04:end=0.18,asetpts=PTS-STARTPTS,afade=t=out:st=0.10:d=0.04','-ar','44100',str(dest)],check=True);tmp.unlink()
manifest['pierce']={'source':cue,'rangeMs':[40,180],'fadeOutMs':40,'description':'Reused/trimmed cue, not claimed to be original sword hit pairing'}
for key,dest,duration in [('dinh-atk','dinh-loi/atk',1.073),('dinh-atk','dinh-loi/skill',1.184),('dinh-ultimate','dinh-loi/ultimate',2.035),('thay-ultimate','thay-mo/ultimate',1.536)]:
    source=out/(key+'-source.wav');target=root/'assets/audio/sfx'/(dest+'.m4a');target.parent.mkdir(parents=True,exist_ok=True)
    factor=4/duration;filters=[]
    while factor>2:filters.append('atempo=2');factor/=2
    filters += [f'atempo={factor:.8f}',f'apad=whole_dur={duration}',f'atrim=duration={duration}',f'afade=t=out:st={duration-.04}:d=0.04']
    subprocess.run(['ffmpeg','-y','-loglevel','error','-i',str(source),'-af',','.join(filters),'-c:a','aac','-b:a','128k',str(target)],check=True)
for wav in out.glob('*-source.wav'):wav.unlink()
for c in manifest['clips'].values():c['runtimeSha256']=digest((out/c['file']).read_bytes())
(out/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print('Imported',len(manifest['clips']),'clips')
