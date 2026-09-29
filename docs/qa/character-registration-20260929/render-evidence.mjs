// Supplementary offline pixel QA; requires @napi-rs/canvas in the QA environment.
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import vm from 'node:vm';
const root=process.cwd();
const require=createRequire(root+'/package.json');
const { createCanvas, loadImage }=require('@napi-rs/canvas');
const sharp=require('sharp');
const { getClip }=await import(root+'/src/assets/asset-catalog.mjs');
const { drawCanvasSprite, sourceRectForFrame }=await import(root+'/src/render/canvas-sprite-renderer.mjs');
const built=readFileSync(root+'/dist/battle.html','utf8');
if(!built.includes(drawCanvasSprite.toString()))throw new Error('Built renderer differs from source');
const c={};vm.createContext(c);
for(const name of ['LINH_DONG_CLIPS','LINH_DONG_REGISTRATION','BACH_DIEN_CLIPS','__HV_READY_ATLASES']){
 const m=built.match(new RegExp('const '+name+'\\s*=\\s*(Object\\.freeze\\([\\s\\S]*?\\)|\\{[^\\n]*\\});'));
 if(!m)throw new Error('Missing '+name);vm.runInContext('this.'+name+'='+m[1]+';',c);
}
c.LINH_DONG_ASSET_BASE='assets/characters/linh-dong/';c.BACH_DIEN_ASSET_BASE='assets/characters/bach-dien/';
for(const name of ['__hvOriginalClipFor','__hvOriginalClipForBachDien','__hvReadyClip']){
 const m=built.match(new RegExp('function '+name+'\\([^]*?\\n}'));
 if(!m)throw new Error('Missing '+name);vm.runInContext(m[0],c);
}
const out=root+'/docs/qa/character-registration-20260929';mkdirSync(out,{recursive:true});
const report={baseline:'52153e0147313feadc874f9dd0f5122cad1433e3',method:'Generated clip adapters + production drawCanvasSprite with real RGBA atlases, Skia Canvas2D. Offline render; not browser interaction.',rows:[],browser:'NOT_RUN: cloud browser rejects localhost (ERR_BLOCKED_BY_CLIENT); local Chromium is not installed',physicalIOS:'NOT_RUN',production:'NOT_DEPLOYED'};
for(const hero of ['linh_dong','bach_dien']){
 const canvas=createCanvas(5*300,6*340),ctx=canvas.getContext('2d');ctx.fillStyle='#202c35';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.font='15px sans-serif';
 for(const [row,key] of ['idle','attack','ultimate'].entries()){
  const clip=getClip(hero,key),img=await loadImage(root+'/'+clip.src);
  const frameIndices=[0,Math.floor(clip.frames/4),Math.floor(clip.frames/2),Math.floor(clip.frames*3/4),clip.frames-1];
  for(let pass=0;pass<2;pass++)for(let col=0;col<5;col++){
   const x=col*300+160,y=(row+pass*3)*340+272;
   ctx.fillStyle='#ffffff';ctx.fillText(`${pass?'AFTER':'BEFORE'} ${key} f${frameIndices[col]}`,col*300+9,(row+pass*3)*340+22);
   ctx.strokeStyle='#59706d';ctx.beginPath();ctx.moveTo(col*300+5,y+27);ctx.lineTo(col*300+295,y+27);ctx.stroke();
   ctx.save();ctx.translate(x,y);ctx.scale(.62,.62);drawCanvasSprite(ctx,{image:img,clip:pass?clip:{...clip,registration:undefined},frame:frameIndices[col],width:477,height:440,baseline:64});ctx.restore();
  }
  for(const profile of ['native','desktop','mobile']){
   c.__HV_LOW_MEMORY_IOS=profile==='mobile';
   const actual=hero==='linh_dong'?c.__hvOriginalClipFor(key):c.__hvOriginalClipForBachDien(key);
   const adapted=profile==='native'?actual:c.__hvReadyClip(actual);
   if(JSON.stringify(actual.registration)!==JSON.stringify(clip.registration))throw new Error('Built registration drift '+hero+'/'+key);
   const image=await loadImage(root+'/dist/'+adapted.src);
   for(const flip of [false,true]){
    const tile=createCanvas(800,700),cx=tile.getContext('2d');drawCanvasSprite(cx,{image,clip:adapted,width:477,height:440,baseline:64,x:400,y:500,flip});
    const {data,info}=await sharp(tile.toBuffer('image/png')).raw().toBuffer({resolveWithObject:true});let top=info.height,bottom=0,left=info.width,right=0;
    for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>100){top=Math.min(top,y);bottom=Math.max(bottom,y+1);left=Math.min(left,x);right=Math.max(right,x+1);}
    report.rows.push({hero,key,profile,team:flip?'enemy':'player',height:bottom-top,bottom,left,right,registration:clip.registration});
   }
  }
 }
 writeFileSync(out+'/'+hero+'-before-after.png',canvas.toBuffer('image/png'));
}
report.ok=true;
for(const row of report.rows){const idle=report.rows.find(x=>x.hero===row.hero&&x.profile===row.profile&&x.team===row.team&&x.key==='idle');if(Math.abs(row.height/idle.height-1)>.03||Math.abs(row.bottom-idle.bottom)>2)report.ok=false;}
writeFileSync(out+'/pixel-report.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({ok:report.ok,rows:report.rows.map(({hero,key,profile,team,height,bottom})=>({hero,key,profile,team,height,bottom}))}));if(!report.ok)process.exitCode=1;
const comparison=createCanvas(1140,1120),cx=comparison.getContext('2d');cx.fillStyle='#202c35';cx.fillRect(0,0,1140,1120);cx.font='18px sans-serif';
for(const [h,hero] of ['linh_dong','bach_dien'].entries())for(let after=0;after<2;after++)for(const [col,key] of ['idle','attack','ultimate'].entries()){
 const row=h*2+after,clip=getClip(hero,key),img=await loadImage(root+'/'+clip.src),x=col*380+230,y=row*280+226;
 cx.fillStyle='#fff';cx.fillText(`${hero==='linh_dong'?'LINH DONG':'BACH DIEN'} / ${after?'AFTER':'BEFORE'} / ${key}`,col*380+14,row*280+26);
 cx.strokeStyle='#536564';cx.beginPath();cx.moveTo(col*380+14,y+22);cx.lineTo(col*380+365,y+22);cx.stroke();
 cx.save();cx.translate(x,y);cx.scale(.48,.48);drawCanvasSprite(cx,{image:img,clip:after?clip:{...clip,registration:undefined},width:477,height:440,baseline:64});cx.restore();
}
await sharp(comparison.toBuffer('image/png')).webp({quality:88}).toFile(out+'/comparison.webp');
