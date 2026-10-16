// tich-dao-vfx-v1.mjs — port 4 VFX clip Cổ Mộ (Kiếm Thế) vào PR #308:
//   src: hon-viet-v3.26.0-staging/assets/vfx/tich-dao/*.webp (animated webp)
//   out: assets/vfx/tich-dao/  — original webp (provenance) + grid atlas PNG (runtime)
//   meta: runtime-meta.json vfx section (provenance + clips + schedule)
// Run directly: node scripts/tich-dao-vfx-v1.mjs
import {existsSync,readFileSync,writeFileSync,copyFileSync,mkdirSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const staging=process.env.TICH_DAO_VFX_SRC||'C:/Users/Admin/Downloads/LucThan-VFX-port/tich-dao';
const outRoot=join(root,'assets/vfx/tich-dao');
const metaPath=join(root,'assets/characters/tich-dao/runtime-meta.json');

// clip key -> (source webp, original JX1 effect code, frames per second)
const SOURCES={
  vanish:{webp:'vanish-xoay.webp',code:'zgm_70_yfz_b (xoáy tím biến mất)',fps:30},
  appear:{webp:'appear-hoa-tran.webp',code:'jgm_30_hxc_c (vòng hoa-bướm tím)',fps:30},
  slash:{webp:'atk.webp',code:'zgm_105_lgss_c (3 vệt chém chéo tím)',fps:30},
  rain:{webp:'ultimate.webp',code:'zgm_85_xydy_c (chùm kiếm tím rơi)',fps:30},
};

async function main(){
  const {default:sharp}=await import('sharp');
  mkdirSync(outRoot,{recursive:true});
  const meta=JSON.parse(readFileSync(metaPath,'utf8'));
  meta.vfx=meta.vfx||{provenance:{},clips:{}};
  meta.vfx.provenance={
    source:'Kiếm Thế (JX1) — kit Cổ Mộ phái, thư mục gumupai trong update03.pak',
    extractedBy:'numpy g_FileNameHash brute-force + SPR decode (PROJECT/bruteforce_gumu.py, gumu_extract.py)',
    packedTo:'animated webp per-frame (FULL_KIEMTHECHUAN NGUHANH_GAME assets), atlas hóa tại đây',
    license:'asset học tập/tái sử dụng nội bộ — không phân phối thương mại',
    scheduledAt:{
      vanish:'phase-03 + phase-05 start (1000ms/1500ms) — thoắt biến mất tại thân',
      appear:'phase-04 + phase-06 start (1083ms/1750ms) — hoa trận tại điểm hiện hình',
      slash:'Ảnh Bộ basic impact (450ms) — kiếm quang chém',
      rain:'Mưa kiếm kết liễu, ngay sau nhịp 3 (phase-08) trước phase-09'
    }
  };
  for(const [key,src] of Object.entries(SOURCES)){
    const srcPath=join(staging,src.webp);
    if(!existsSync(srcPath))throw new Error('missing VFX source: '+srcPath);
    copyFileSync(srcPath,join(outRoot,src.webp));
    const img=sharp(srcPath);
    const frames=await webpFrameCount(img);
    const {width,height}=await img.metadata();
    // grid atlas: 8 cột, cell = max frame size (animated webp uniform canvas)
    const cols=8,rows=Math.ceil(frames/cols);
    const composed=[];
    for(let i=0;i<frames;i++){
      const buf=await extractWebpFrame(sharp,srcPath,i,width,height);
      composed.push(buf);
    }
    const atlasFile=key+'-atlas.png';
    await sharp({create:{width:cols*width,height:rows*height,channels:4,background:{r:0,g:0,b:0,alpha:0}}})
      .composite(composed.map((buf,i)=>({input:buf,left:(i%cols)*width,top:Math.floor(i/cols)*height})))
      .png()
      .toFile(join(outRoot,atlasFile));
    meta.vfx.clips[key]={file:atlasFile,source:src.webp,sourceCode:src.code,
      cols,rows,frames,cellW:width,cellH:height,fps:src.fps};
    console.log('vfx',key,src.webp,frames+'f',width+'x'+height,'->',atlasFile);
  }
  writeFileSync(metaPath,JSON.stringify(meta,null,1));
  console.log('TICH_DAO_VFX_OK provenance + clips written to runtime-meta.json');
}

// libwebp frame extraction: sharp concatenates animated frames vertically when
// called with {animated:true} — page through them via metadata.pages.
async function webpFrameCount(img){
  const meta=await img.metadata();
  if(meta.pages&&meta.pages>1)return meta.pages;
  throw new Error('not an animated webp');
}
async function extractWebpFrame(sharp,src,i,w,h){
  const buf=await sharp(src,{animated:true}).png().toBuffer();
  // raw stacked canvas: pages × h
  return sharp(buf).extract({left:0,top:i*h,width:w,height:h}).png().toBuffer();
}
main().catch(e=>{console.error('TICH_DAO_VFX_FAIL',e.message);process.exit(1);});
