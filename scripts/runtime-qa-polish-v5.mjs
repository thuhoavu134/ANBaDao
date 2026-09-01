import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const battlePath = join(process.cwd(), 'dist', 'battle.html');
let battle = readFileSync(battlePath, 'utf8');

// V5 removes the opaque black rectangle with SCREEN compositing. Keep that blend mode,
// but DO NOT dim or pulse the source artwork. The goal is to preserve the authored Ultimate
// as closely as possible: original brightness, contrast, smoke density and frame timing.
const oldBlock = "const xs=slots.map(u=>u.x),ys=slots.map(u=>u.y),avgX=xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:cx,targetRight=avgX>=WORLD.width/2,halfX=targetRight?WORLD.width/2:0,halfW=WORLD.width/2,minY=ys.length?Math.min(...ys):cy-120,maxY=ys.length?Math.max(...ys):cy+120,fxCx=targetRight?WORLD.width*.66:WORLD.width*.34,rowYs=[Math.max(120,minY-95),(minY+maxY)/2,Math.min(WORLD.height-90,maxY+95)],fxW=Math.min(halfW*1.38,980),fxH=Math.max(320,Math.min(420,(maxY-minY)*.78+270)),pulse=.82+.10*Math.sin(p*Math.PI);context.save();context.beginPath();context.rect(halfX,0,halfW,WORLD.height);context.clip();context.globalCompositeOperation='screen';for(let i=0;i<rowYs.length;i++){const rowY=rowYs[i],edgeFade=i===1?0.76:0.66;drawLucAnhAtlas(context,key,frame,fxCx,rowY,fxW,fxH,{baseline:fxH/2,screen:true,alpha:edgeFade*pulse});}context.restore();";

const newBlock = "const xs=slots.map(u=>u.x),ys=slots.map(u=>u.y),avgX=xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:cx,targetRight=avgX>=WORLD.width/2,halfX=targetRight?WORLD.width/2:0,halfW=WORLD.width/2,minY=ys.length?Math.min(...ys):cy-120,maxY=ys.length?Math.max(...ys):cy+120,fxCx=targetRight?WORLD.width*.66:WORLD.width*.34,rowYs=[Math.max(120,minY-95),(minY+maxY)/2,Math.min(WORLD.height-90,maxY+95)],fxW=Math.min(halfW*1.38,980),fxH=Math.max(320,Math.min(420,(maxY-minY)*.78+270));context.save();context.beginPath();context.rect(halfX,0,halfW,WORLD.height);context.clip();context.globalCompositeOperation='screen';for(const rowY of rowYs){drawLucAnhAtlas(context,key,frame,fxCx,rowY,fxW,fxH,{baseline:fxH/2,screen:true,alpha:1});}context.restore();";

if (!battle.includes(oldBlock)) {
  throw new Error('runtime-qa-polish-v5: expected previous screen-blend block not found');
}
battle = battle.replace(oldBlock, newBlock);

writeFileSync(battlePath, battle);
console.log('Runtime QA polish v5 updated: original Luc Anh Ultimate intensity preserved at full alpha; only black-background removal remains');
