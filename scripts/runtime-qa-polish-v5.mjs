import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const battlePath = join(process.cwd(), 'dist', 'battle.html');
let battle = readFileSync(battlePath, 'utf8');

// The V4 Ultimate correctly stacked three copies and clipped them to the enemy half,
// but the source VFX atlas contains a dark opaque background. Drawing it with normal
// source-over compositing exposes the rectangular video frame. Replace the whole block
// with SCREEN blending: black becomes visually transparent while smoke/highlights remain.
const oldBlock = "const xs=slots.map(u=>u.x),ys=slots.map(u=>u.y),avgX=xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:cx,targetRight=avgX>=WORLD.width/2,halfX=targetRight?WORLD.width/2:0,halfW=WORLD.width/2,minY=ys.length?Math.min(...ys):cy-120,maxY=ys.length?Math.max(...ys):cy+120,fxCx=targetRight?WORLD.width*.66:WORLD.width*.34,rowYs=[Math.max(120,minY-95),(minY+maxY)/2,Math.min(WORLD.height-90,maxY+95)],fxW=Math.min(halfW*1.38,980),fxH=Math.max(320,Math.min(420,(maxY-minY)*.78+270));context.save();context.beginPath();context.rect(halfX,0,halfW,WORLD.height);context.clip();for(const rowY of rowYs){drawLucAnhAtlas(context,key,frame,fxCx,rowY,fxW,fxH,{baseline:fxH/2,alpha:.98});}const pulse=.72+.18*Math.sin(p*Math.PI);context.globalCompositeOperation='source-over';for(const rowY of rowYs){const g=context.createRadialGradient(fxCx,rowY,45,fxCx,rowY,fxW*.48);g.addColorStop(0,'rgba(6,10,7,'+(.62*pulse)+')');g.addColorStop(.62,'rgba(14,25,17,'+(.40*pulse)+')');g.addColorStop(1,'rgba(3,7,4,0)');context.fillStyle=g;context.beginPath();context.ellipse(fxCx,rowY,fxW*.48,fxH*.40,0,0,Math.PI*2);context.fill();}context.restore();";

const newBlock = "const xs=slots.map(u=>u.x),ys=slots.map(u=>u.y),avgX=xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:cx,targetRight=avgX>=WORLD.width/2,halfX=targetRight?WORLD.width/2:0,halfW=WORLD.width/2,minY=ys.length?Math.min(...ys):cy-120,maxY=ys.length?Math.max(...ys):cy+120,fxCx=targetRight?WORLD.width*.66:WORLD.width*.34,rowYs=[Math.max(120,minY-95),(minY+maxY)/2,Math.min(WORLD.height-90,maxY+95)],fxW=Math.min(halfW*1.38,980),fxH=Math.max(320,Math.min(420,(maxY-minY)*.78+270)),pulse=.82+.10*Math.sin(p*Math.PI);context.save();context.beginPath();context.rect(halfX,0,halfW,WORLD.height);context.clip();context.globalCompositeOperation='screen';for(let i=0;i<rowYs.length;i++){const rowY=rowYs[i],edgeFade=i===1?0.76:0.66;drawLucAnhAtlas(context,key,frame,fxCx,rowY,fxW,fxH,{baseline:fxH/2,screen:true,alpha:edgeFade*pulse});}context.restore();";

if (!battle.includes(oldBlock)) {
  throw new Error('runtime-qa-polish-v5: expected V4 Luc Anh triple ultimate block not found');
}
battle = battle.replace(oldBlock, newBlock);

writeFileSync(battlePath, battle);
console.log('Runtime QA polish v5 applied: Luc Anh triple ultimate now uses screen blend; dark rectangular source background is visually removed');
