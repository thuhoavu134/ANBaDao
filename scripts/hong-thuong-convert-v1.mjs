// Hong Thuong (temp technical name) — green-screen MP4 → RGBA atlas webp + runtime-meta.
// Source: owner-supplied 1920x1080 24fps green-screen clips (openclaw media inbound,
// 2026-10-16 batch). Prerequisite: ffmpeg -i <mp4> staging/<clip>/f%03d.png
// (see meta.clips[k].source + sourcePackSha256 for exact files/hashes).
// Contract: one uniform scale for every clip; fixed per-clip crop window (no per-frame
// fit); spear tip headroom kept; foot line and body-centre recorded per clip so the
// runtime paints body-anchored, matching the authored-hero display benchmark.
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync,mkdirSync,copyFileSync,readdirSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT=join(dirname(fileURLToPath(import.meta.url)),'..');
const STAGING=join(ROOT,'.staging','spear-frames');
const OUT=join(ROOT,'assets','characters','hong-thuong');
const S=474/1040; // uniform display scale: source y[40..1080] -> 474px cell; idle body ≈ 423px (benchmark)
const Y0=40;
const sha256=p=>createHash('sha256').update(readFileSync(p)).digest('hex');

// clip plan — measured from the real motion trace (docs/qa/hong-thuong-integration-20261016.md)
// hits: frame numbers in the SOURCE clip that the runtime must resolve damage at.
const CLIPS={
  basic:{frames:[2,54],step:2,ms:48,window:[400,1920],hits:[18,36,38]},
  'ult-prep':{frames:[2,26],step:2,ms:48,window:[300,1580]},
  'ult-cluster':{frames:[27,55],step:2,ms:48,window:[340,1760],hits:[31,43,55]},
  'ult-finisher':{frames:[58,100],step:2,ms:48,window:[290,1760],hits:[88]},
  run:{frames:[1,44],step:2,ms:48,window:[360,1560]},
  hit:{frames:[17,64],step:2,ms:48,window:[330,1560]},
  'fall-die':{frames:[21,88],step:2,ms:48,window:[150,1290]},
};
const IDLE={frames:[1,88],step:2,ms:48,window:[440,1520],pageFrames:8,cols:4};
const SOURCES={
  basic:'atk_2---16d8c557-3c30-4008-af73-f85289ada16f.mp4',
  ultimate:'ulti_2---071c36d3-7610-4af3-a48d-40877387b921.mp4',
  idle:'idle_2---42f3850d-2c20-4171-958a-d56b5c27e953.mp4',
  run:'run_2---a5f83296-a2aa-425b-9371-3d0d2ad9d7a4.mp4',
  hit:'Hit---9bdaf646-789a-478b-87f8-436fd46a04c4.mp4',
  'fall-die':'fall_die---3e7a535b-12b7-4e0b-a351-53751f95799d.mp4'};
const SOURCE_DIR='C:/Users/Admin/aicoworker/openclaw/media/inbound';

async function keyFrame(sharp,file,window){
  const [wx0,wx1]=window;
  const {data,info}=await sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const w=info.width,h=info.height,ch=info.channels;
  const out=Buffer.alloc(w*h*4);
  for(let i=0,p=0;i<w*h;i++,p+=ch){
    const r=data[p],g=data[p+1],b=data[p+2];
    // Three-zone chroma key. Pure/soft zones remove the green screen and its
    // halo; the muted-green zone removes the character's floor shadow without
    // touching the yellow-green sash (high red keeps it out of every key zone).
    const gr=g-r,gb=g-b,mg=Math.min(gr,gb);
    let a=255;
    if(gr>70&&gb>70)a=0;
    else if(gr>50&&gb>50)a=0;
    else if(gr>22&&gb>22&&r<120&&g>85)a=Math.round(255*Math.min(1,Math.max(0,(mg-45)/25)));
    const q=i*4;
    if(a>0&&(g>r+8||g>b+8)){ // hard despill: clamp green spill on kept pixels
      out[q]=r;out[q+1]=Math.max(r,b);out[q+2]=b;
    } else {out[q]=r;out[q+1]=g;out[q+2]=b;}
    out[q+3]=a;
  }
  const cw=Math.round((wx1-wx0)*S),chh=474;
  return sharp(out,{raw:{width:w,height:h,channels:4}}).extract({left:wx0,top:Y0,width:wx1-wx0,height:1040}).resize(cw,chh,{kernel:'lanczos3'}).raw().toBuffer({resolveWithObject:true});
}
function bodyMetrics(raw,cw){ // wide-row centroid + first-frame body height (spear excluded)
  let bodyCx=0,n=0,top=474,bot=0;
  const rows=new Int32Array(cw);
  for(let y=0;y<474;y++){
    rows.fill(0);
    let cnt=0;
    for(let x=0;x<cw;x++){if(raw[y*cw*4+x*4+3]>60){rows[x]=1;cnt++;}}
    if(cnt>12){if(y<top)top=y;bot=y;for(let x=0;x<cw;x++)if(rows[x]){bodyCx+=x;n++;}}
  }
  return {bodyCx:Math.round(bodyCx/Math.max(1,n)),bodyTop:top,bodyBottom:bot};
}
async function packGrid(sharp,framesBuf,cw,cols,file){
  const rows=Math.ceil(framesBuf.length/cols);
  const comps=[];
  for(let i=0;i<framesBuf.length;i++){
    comps.push({input:framesBuf[i].data,raw:{width:cw,height:474,channels:4},left:(i%cols)*cw,top:Math.floor(i/cols)*474});
  }
  await sharp({create:{width:cols*cw,height:rows*474,channels:4,background:{r:0,g:0,b:0,alpha:0}}})
    .composite(comps).webp({quality:92,alphaQuality:100,lossless:false}).toFile(file);
  return {cols,rows,frames:framesBuf.length};
}
export async function convertHongThuong(){
  const {default:sharp}=await import('sharp');
  mkdirSync(OUT,{recursive:true});
  const meta={schema:'hong-thuong/runtime-v1',sourceCharacter:'Owner-supplied green-screen batch 2026-10-16 (chibi spear heroine; name pending)',
    sourcePackSha256:Object.fromEntries(Object.entries(SOURCES).map(([k,f])=>[k,{file:f,sha256:sha256(join(SOURCE_DIR,f))}])),
    pending:['Tên hiển thị tạm "Hồng Thương" — chờ chủ dự án chốt','avatar.webp tạm cắt từ idle frame 21 — portrait authored chờ owner','ATK clip chỉ có 2 cú đâm riêng biệt; hit2+hit3 map vào cú đâm mạnh (đề xuất chờ duyệt)'],
    clips:{},idleVisual:{},ultimateTimeline:{},vfx:{},sfx:{}};
  const processClip=async(name,plan)=>{
    const frames=[];for(let f=plan.frames[0];f<=plan.frames[1];f+=plan.step)frames.push(f);
    const bufs=[];
    for(const f of frames){
      const src=plan.folder?join(STAGING,plan.folder,`f${String(f).padStart(3,'0')}.png`):join(STAGING,name==='idle'?'idle':Object.keys(SOURCES).find(k=>SOURCES[k]===plan.source),'unused');
      bufs.push(await keyFrame(sharp,src,plan.window));
    }
    const cw=bufs[0].info.width;
    const cols=plan.cols||Math.max(1,Math.min(6,Math.floor(3600/cw)));
    const grid=await packGrid(sharp,bufs,cw,cols,join(OUT,`${name}.webp`));
    const m=bodyMetrics(bufs[0].data,cw);
    const clip={file:`${name}.webp`,cols:grid.cols,rows:grid.rows,frames:grid.frames,cellW:cw,cellH:474,
      durationMs:frames.length*plan.ms,frameDurationsMs:Array(frames.length).fill(plan.ms),
      sourceFrames:frames,sourceClip:plan.source,content:{bodyCx:m.bodyCx,bodyTop:m.bodyTop,footCellY:m.bodyBottom,bodyHeightPx:m.bodyBottom-m.bodyTop}};
    clip.content.scale=Math.round(423/Math.max(1,m.bodyBottom-m.bodyTop)*1000)/1000;
    if(plan.hits){
      clip.hitMs=plan.hits.map(hf=>Math.round((frames.indexOf(hf))*plan.ms));
      clip.hitSourceFrames=[...plan.hits];
    }
    meta.clips[name]=clip;
    return clip;
  };
  const FOLDERS={basic:'atk','ult-prep':'ulti','ult-cluster':'ulti','ult-finisher':'ulti',run:'run',hit:'hit','fall-die':'fall'};
  for(const [name,plan] of Object.entries(CLIPS)){
    const folder=FOLDERS[name];
    await processClip(name,{...plan,folder,source:SOURCES[folder==='atk'?'basic':folder==='ulti'?'ultimate':folder]});
  }
  // idle — paginated 8 frames/page like the shared idle-page lease owner
  {
    const plan=IDLE;const frames=[];for(let f=plan.frames[0];f<=plan.frames[1];f+=plan.step)frames.push(f);
    const pages=Math.ceil(frames.length/plan.pageFrames);
    const first=await keyFrame(sharp,join(STAGING,'idle','f001.png'),plan.window);
    const m=bodyMetrics(first.data,first.info.width);
    for(let p=0;p<pages;p++){
      const bufs=[];
      for(let i=p*plan.pageFrames;i<Math.min(frames.length,(p+1)*plan.pageFrames);i++){
        bufs.push(await keyFrame(sharp,join(STAGING,'idle',`f${String(frames[i]).padStart(3,'0')}.png`),plan.window));
      }
      await packGrid(sharp,bufs,first.info.width,plan.cols,join(OUT,`idle-authored-${p}.webp`));
    }
    const cw=first.info.width;
    meta.idle={frames:frames.length,durationMs:frames.length*plan.ms};
    meta.idleVisual={schema:'idle-pages-v1',frames:frames.length,durationMs:frames.length*plan.ms,
      frameDurationsMs:Array(frames.length).fill(plan.ms),pageFrames:plan.pageFrames,pages,cols:plan.cols,
      cellW:cw,cellH:474,content:{bodyCx:m.bodyCx,bodyTop:m.bodyTop,footCellY:m.bodyBottom,bodyHeightPx:m.bodyBottom-m.bodyTop},
      contentScale:Math.round(423/Math.max(1,m.bodyBottom-m.bodyTop)*1000)/1000};
    meta.clips.standing={file:'idle-authored-0.webp',cols:plan.cols,rows:Math.ceil(Math.min(plan.pageFrames,frames.length)/plan.cols),frames:1,cellW:cw,cellH:474,durationMs:plan.ms,
      frameDurationsMs:[plan.ms],sourceFrames:[frames[0]],sourceClip:SOURCES.idle,
      content:{bodyCx:m.bodyCx,bodyTop:m.bodyTop,footCellY:m.bodyBottom,bodyHeightPx:m.bodyBottom-m.bodyTop,scale:meta.idleVisual.contentScale}};
    // temporary avatar from a mid idle frame (art.pending)
    const avatarFrame=await keyFrame(sharp,join(STAGING,'idle','f021.png'),plan.window);
    const ab=avatarFrame.data,acw=avatarFrame.info.width;
    let ax0=acw,ax1=0,ay0=474,ay1=0;
    for(let y=0;y<474;y++)for(let x=0;x<acw;x++)if(ab[(y*acw+x)*4+3]>60){if(x<ax0)ax0=x;if(x>ax1)ax1=x;if(y<ay0)ay0=y;if(y>ay1)ay1=y;}
    await sharp(ab.subarray(),{raw:{width:acw,height:474,channels:4}}).extract({left:ax0,top:ay0,width:ax1-ax0+1,height:ay1-ay0+1}).resize(300,Math.round(300*(ay1-ay0+1)/(ax1-ax0+1))).webp({quality:92,alphaQuality:100}).toFile(join(OUT,'avatar.webp'));
  }
  // ultimate module timeline (absolute ms from cast start, pre-travel)
  {
    const prep=meta.clips['ult-prep'],cluster=meta.clips['ult-cluster'],fin=meta.clips['ult-finisher'];
    const prepMs=prep.durationMs,clusterMs=cluster.durationMs,finMs=fin.durationMs;
    meta.ultimateTimeline={schema:'modules-v1',prepMs,clusterMs,finisherMs:finMs,
      clusterHitsAt:cluster.hitMs,finisherHitAt:fin.hitMs[0],hitMsBasic:meta.clips.basic.hitMs};
  }
  // VFX sample 22 (owner-approved): SKILLPACK tw_90_zxzy_d, original pairs kept per-frame ox/oy
  {
    const packRoot='C:/Users/Admin/Downloads/FULL_KIEMTHECHUAN/SKILLPACK';
    const vdir=join(packRoot,'vfx','tianwang','tw_90_zxzy_d');
    const info=JSON.parse(readFileSync(join(vdir,'info.json'),'utf8'));
    const files=readdirSync(vdir).filter(f=>/^f\d+\.png$/.test(f)).sort();
    const cell=128,cols=5,rows=Math.ceil(files.length/cols);
    const comps=[];
    for(let i=0;i<files.length;i++){
      const fr=info.frames[i];
      const buf=await sharp(join(vdir,files[i])).raw().toBuffer({resolveWithObject:true});
      comps.push({input:buf.data,raw:{width:buf.info.width,height:buf.info.height,channels:buf.info.channels},left:(i%cols)*cell+fr.ox,top:Math.floor(i/cols)*cell+fr.oy});
    }
    const vout=join(ROOT,'assets','vfx','hong-thuong');mkdirSync(vout,{recursive:true});
    await sharp({create:{width:cols*cell,height:rows*cell,channels:4,background:{r:0,g:0,b:0,alpha:0}}})
      .composite(comps).webp({quality:95,alphaQuality:100}).toFile(join(vout,'impact.webp'));
    const wavSrc=join(packRoot,'sfx','tianwang','tw_zxzy_c.wav');
    const sdir=join(ROOT,'assets','audio','sfx','hong-thuong');mkdirSync(sdir,{recursive:true});
    copyFileSync(wavSrc,join(sdir,'impact.wav'));
    meta.vfx={provenance:{approved:'Mẫu 22 — video 24-VFX-can-chien-co-SFX.mp4, duyệt 2026-10-16',
      vfxCode:'tw_90_zxzy_d',vfxSource:`SKILLPACK/vfx/tianwang/tw_90_zxzy_d (${info.nguon}; ${files.length} khung có nội dung, canvas gốc ${cell}x${cell}, giữ ox/oy từng khung)`,
      sfxCode:'tw_zxzy_c',sfxSource:'SKILLPACK/sfx/tianwang/tw_zxzy_c.wav (22050Hz mono 16-bit 0.479s)',
      note:'Cặp dùng trong preview đã duyệt; KHÔNG tuyên bố cặp gốc đã xác minh từ bảng game.'},
      clips:{impact:{file:'impact.webp',frames:files.length,cols,cellW:cell,cellH:cell,fps:1000/info.interval_ms,blendMode:'screen'}}};
    meta.sfx={cues:{'hong-thuong-impact':'hong-thuong/impact.wav'},provenance:meta.vfx.provenance};
  }
  writeFileSync(join(OUT,'runtime-meta.json'),JSON.stringify(meta,null,1));
  console.log('hong-thuong convert done:',Object.keys(meta.clips).join(','));
}
if(process.argv[1]&&process.argv[1].endsWith('hong-thuong-convert-v1.mjs'))convertHongThuong().catch(e=>{console.error(e);process.exit(1);});

