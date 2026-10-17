"""Import owner-approved reduced-frame RGBA pack. Usage: python script.py pack.zip
Requires Pillow. No chroma key, interpolation, or per-frame fitting.
"""
from pathlib import Path
import json,sys,zipfile,io,math,hashlib
from PIL import Image
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'assets/characters/hong-thuong'
z=zipfile.ZipFile(sys.argv[1]);prefix=z.namelist()[0].split('/')[0]+'/'
def read(p):return z.read(prefix+p)
def meta(k):return json.loads(read(k+'/metadata.json'))
S=474/1080
# Source-space anchor shared across all clips, independent of crop/weapon width.
CX,FOOT=880,1035
sizes={}
def frames(k):
 m=meta(k);c=m['crop'];x0,y0,x1,y1=c['sourceRect'];cw=math.ceil((x1-x0)*S/2)*2
 result=[]
 for p in m['atlasPages']:
  im=Image.open(io.BytesIO(read(k+'/'+p['file']))).convert('RGBA')
  for i in range(p['frameCount']):
   w,h=c['cell'];ox,oy=c['contentOffset'];sw,sh=c['contentSizeNoUpscale']
   f=im.crop(((i%p['columns'])*w+ox,(i//p['columns'])*h+oy,(i%p['columns'])*w+ox+sw,(i//p['columns'])*h+oy+sh))
   f=f.resize((round((x1-x0)*S),round((y1-y0)*S)),Image.Resampling.LANCZOS)
   canvas=Image.new('RGBA',(cw,474));canvas.paste(f,(0,round(y0*S)));result.append(canvas)
 content={'bodyCx':round((CX-x0)*S,3),'footCellY':round(FOOT*S,3),'bodyTop':18,'bodyHeightPx':423,'scale':1}
 return result,content,m

def atlas(name,fs,cols):
 rows=math.ceil(len(fs)/cols);im=Image.new('RGBA',(fs[0].width*cols,474*rows))
 for i,f in enumerate(fs):im.paste(f,((i%cols)*f.width,(i//cols)*474))
 im.save(OUT/(name+'.webp'),'WEBP',quality=90,method=6,alpha_quality=100)
 sizes[name+'.webp']=list(im.size)
 return rows
m=json.loads((OUT/'runtime-meta.json').read_text());m['ownerPack']={'file':Path(sys.argv[1]).name,'sha256':hashlib.sha256(Path(sys.argv[1]).read_bytes()).hexdigest(),'policy':'Owner explicitly accepts 18 sampled frames per non-idle state to reduce size; preserve 81 idle frames.'}
m['assetRevision']='rgba-v2-'+m['ownerPack']['sha256'][:16]
m['pending']=[x for x in m['pending'] if not x.startswith('ATK clip')]
fs,c,src=frames('idle');dur=[f['durationMs'] for f in src['frames']]
iv=dict(schema='idle-pages-v1',frames=len(fs),pageFrames=8,pages=math.ceil(len(fs)/8),cols=4,cellW=fs[0].width,cellH=474,content={k:v for k,v in c.items() if k!='scale'},contentScale=1,frameDurationsMs=dur,durationMs=sum(dur))
for p in range(iv['pages']):atlas('idle-authored-'+str(p),fs[p*8:p*8+8],4)
m['idleVisual']=iv;m['idle']={'frames':len(fs),'durationMs':sum(dur)}
m['clips']['standing']=dict(file='idle-authored-0.webp',cols=4,rows=2,frames=1,cellW=fs[0].width,cellH=474,durationMs=dur[0],frameDurationsMs=[dur[0]],content=c)
# Avatar retains approved colors and alpha.
fs[0].save(OUT/'avatar.webp','WEBP',quality=92,method=6)
plans={'basic':('atk',[0,1]+[2,3,4]*3+[5,6,7],80),'run':('run',list(range(18)),48),'hit':('hit',list(range(18)),36),'fall-die':('fall-die',list(range(18)),64),'ult-prep':('ultimate',[0,1,2,3],48),'ult-cluster':('ultimate',[4,5,6,7,8],144),'ult-finisher':('ultimate',list(range(9,18)),96)}
for key,(state,indices,ms) in plans.items():
 fs,c,src=frames(state);chosen=[fs[i] for i in indices];cols=min(5,len(chosen));rows=atlas(key,chosen,cols)
 m['clips'][key]=dict(file=key+'.webp',cols=cols,rows=rows,frames=len(chosen),cellW=chosen[0].width,cellH=474,durationMs=len(chosen)*ms,frameDurationsMs=[ms]*len(chosen),content=c,sourceClip=src['sourceName'],sourceSampleIndices=indices,sourceFrames=[src['frames'][i]['sourceFrameNumber'] for i in indices])
m['ultimateTimeline'].update(prepMs=192,clusterMs=720,clusterHitsAt=[144,432,576],finisherMs=864,finisherHitAt=432,hitMsBasic=[240,480,720])
(OUT/'runtime-meta.json').write_text(json.dumps(m,ensure_ascii=False,indent=1)+'\n')
(OUT/'v2-atlas-dimensions.json').write_text(json.dumps(sizes,indent=1)+'\n')
(OUT/'source-pack-manifest.json').write_bytes(read('PACK-MANIFEST.json'))
print('Imported',len(sizes),'atlases;',sum((OUT/n).stat().st_size for n in sizes),'bytes')
