"""Run after be-an-convert.py; argument is owner Kiếm Thế archive path."""
import sys,json,zipfile,io,subprocess,pathlib,hashlib
from PIL import Image
root=pathlib.Path(__file__).resolve().parents[1];out=root/'assets/characters/be-an'
meta=json.loads((out/'runtime-meta.json').read_text())
def webp(image,name):
    temp=out/(name+'.png');image.save(temp)
    subprocess.run(['node','--input-type=module','-e',"import sharp from 'sharp';await sharp(process.argv[1]).webp({quality:92,alphaQuality:100}).toFile(process.argv[2]);",str(temp),str(out/(name+'.webp'))],cwd=root,check=True);temp.unlink()
for kind in ['idle','run','basic']:
    c=meta['clips'][kind]
    # Campaign is display-scale optimized, not a replacement for 3x formation/detail assets.
    target_w,target_h=352,224
    cols=8; rows=(c['frames']+cols-1)//cols
    atlas=Image.new('RGBA',(target_w*cols,target_h*rows))
    for frame_no in range(c['frames']):
        page_index=frame_no//c['pageFrames']; j=frame_no%c['pageFrames']
        page_meta=c['pages'][page_index]
        with Image.open(out/page_meta['file']) as page:
            left=(j%page_meta['cols'])*c['cellW'];top=(j//page_meta['cols'])*c['cellH']
            cell=page.crop((left,top,left+c['cellW'],top+c['cellH']))
            cell=cell.resize((target_w,target_h),Image.Resampling.LANCZOS)
            atlas.paste(cell,((frame_no%cols)*target_w,(frame_no//cols)*target_h))
    webp(atlas,kind+'-campaign')
archive=pathlib.Path(sys.argv[1]);z=zipfile.ZipFile(archive);base='SKILLPACK/vfx/cuiyan/cy_50_bhcs_a/'
info=json.loads(z.read(base+'info.json'));atlas=Image.new('RGBA',(224*5,224*5))
for i,f in enumerate(info['frames']):
    image=Image.open(io.BytesIO(z.read(base+f['png'])));atlas.paste(image,(i%5*224+18+f['ox'],i//5*224+16+f['oy']))
webp(atlas,'shield')
meta['clips']['shield']={'frames':25,'pageFrames':25,'cols':5,'cellW':224,'cellH':224,'pivot':112,'foot':202,'durationMs':1500,'blend':'screen','pages':[{'file':'shield.webp','frames':25,'cols':5}],'source':archive.name+':cy_50_bhcs_a','sourceSha256':hashlib.sha256(archive.read_bytes()).hexdigest(),'sourceInfo':info}
release=43/24*1000;ult=76/24*1000
meta['timeline']={'basic':{'release':release,'hits':[release+312.5,release+1156.25],'vfxEnd':release+1500,'recovery':4000},'ultimate':{'release':ult,'hits':[ult+89/112*800,ult+800+29/52*800,ult+1600+29/52*800],'vfxEnd':ult+2400,'recovery':6650,'sourcePhases':[[0,112],[60,112],[60,112]]}}
(out/'runtime-meta.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2)+'\n')
body_height=meta['clips']['idle']['body'];foot_x=meta['clips']['idle']['pivot'];foot_y=meta['clips']['idle']['foot']
pres={'schema':'battle-hero-presentation/v1','heroId':'hero_splus_be_an','aliases':['be_an','be-an','hero_splus_be_an'],'referenceBodyHeight':body_height,'footOffsetY':0,'registration':'source-body','clips':{k:{'bodyHeight':meta['clips'][k]['body'],'footX':meta['clips'][k]['pivot'],'footY':meta['clips'][k]['foot']} for k in ['idle','run','basic','ultimate','hit','fall-die','special']},'vfxClips':['vfx-basic','vfx-ultimate','shield'],'states':{'idle':['idle'],'attack':['basic'],'ultimate':['ultimate']},'evidence':'Source 24 fps; fixed first-pose registration per clip. Special contains the body and replaces it.'}
(out/'presentation.json').write_text(json.dumps(pres,indent=2)+'\n')
audio=root/'assets/audio/sfx/be-an'
subprocess.run(['ffmpeg','-v','error','-y','-i',str(audio/'vfx-basic.wav'),'-af','atempo=2,atempo=2',str(audio/'basic.wav')],check=True)
f='[0:a]asplit=3[a][b][c];[a]atrim=0:4.666667,asetpts=PTS-STARTPTS,atempo=2,atempo=2,atempo=1.458333[x];[b]atrim=2.5:4.666667,asetpts=PTS-STARTPTS,atempo=2,atempo=1.354167[y];[c]atrim=2.5:4.666667,asetpts=PTS-STARTPTS,atempo=2,atempo=1.354167[z];[x][y][z]concat=n=3:v=0:a=1[out]'
subprocess.run(['ffmpeg','-v','error','-y','-i',str(audio/'vfx-ultimate.wav'),'-filter_complex',f,'-map','[out]',str(audio/'ultimate.wav')],check=True)

for name in ["basic","ultimate","special"]:
    subprocess.run(["ffmpeg","-v","error","-y","-i",str(audio/(name+".wav")),"-c:a","aac","-b:a","128k",str(audio/(name+".m4a"))],check=True)
