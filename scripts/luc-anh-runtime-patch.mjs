import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const out = join(process.cwd(), 'dist');
function patchFile(name, edits) {
  const p = join(out, name);
  let s = readFileSync(p, 'utf8');
  for (const [from,to,label] of edits) {
    if (!s.includes(from)) throw new Error(`Luc Anh patch missing ${label} in ${name}`);
    s = s.replace(from,to);
  }
  writeFileSync(p,s);
}

patchFile('index.html', [
  ["const h=178,w=178;return drawLucAtlasFrame(kind,f,x-w/2,groundY-h+8,w,h,c.side==='foe');", "const h=228,w=228;return drawLucAtlasFrame(kind,f,x-w/2,groundY-h+10,w,h,c.side==='foe');", 'index Luc Anh combat scale'],
  ["function playLucAnhVoice(src,vol=.92){ try{ if(_lucAnhVoice){_lucAnhVoice.pause();_lucAnhVoice.currentTime=0;} _lucAnhVoice=new Audio(src); _lucAnhVoice.volume=vol; _lucAnhVoice.play().catch(()=>{}); }catch(_e){} }", "function playLucAnhVoice(src,vol=1){ try{ if(_lucAnhVoice){_lucAnhVoice.pause();_lucAnhVoice.currentTime=0;} _lucAnhVoice=new Audio(src); _lucAnhVoice.preload='auto'; _lucAnhVoice.volume=Math.min(1,vol); _lucAnhVoice.play().catch(()=>{}); }catch(_e){} }", 'index voice volume'],
  ["function startLucAnhDetailIdle(){cancelAnimationFrame(_lucDetailRaf);const cv=document.getElementById('lucAnhDetailIdle');if(!cv)return;const c=cv.getContext('2d'),a=LUC_ANH_ANIMS.idle,im=LUC_ANH_IMAGES.idle,start=performance.now();function tick(){if(!cv.isConnected)return;c.clearRect(0,0,cv.width,cv.height);if(im.complete&&im.naturalWidth>1){const f=lucFrame(a,start,true),sx=(f%a.cols)*a.w,sy=Math.floor(f/a.cols)*a.h;c.drawImage(im,sx,sy,a.w,a.h,0,0,cv.width,cv.height);}_lucDetailRaf=requestAnimationFrame(tick);}tick();}", "function startLucAnhDetailIdle(){cancelAnimationFrame(_lucDetailRaf);const cv=document.getElementById('lucAnhDetailIdle');if(!cv)return;const css=280,dpr=Math.min(3,window.devicePixelRatio||1);cv.style.width=css+'px';cv.style.height=css+'px';cv.width=Math.round(css*dpr);cv.height=Math.round(css*dpr);const c=cv.getContext('2d'),a=LUC_ANH_ANIMS.idle,im=LUC_ANH_IMAGES.idle,start=performance.now();c.setTransform(dpr,0,0,dpr,0,0);c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';function tick(){if(!cv.isConnected)return;c.clearRect(0,0,css,css);if(im.complete&&im.naturalWidth>1){const f=lucFrame(a,start,true),sx=(f%a.cols)*a.w,sy=Math.floor(f/a.cols)*a.h;c.drawImage(im,sx,sy,a.w,a.h,0,0,css,css);}_lucDetailRaf=requestAnimationFrame(tick);}tick();}", 'detail retina idle'],
  ["playLucAnhVoice(LUC_ANH_HERO_VOICE,.92)", "playLucAnhVoice(LUC_ANH_HERO_VOICE,1)", 'detail voice volume']
]);

patchFile('battle.html', [
  ["drawLucAnhAtlas(context,key,frame,0,0,330,330,{baseline:48,flip:unit.team===TEAM_ENEMY});", "drawLucAnhAtlas(context,key,frame,0,0,520,520,{baseline:74,flip:unit.team===TEAM_ENEMY});", 'battle Luc Anh scale'],
  ["function playLucAnhUltimateVoice(){try{if(lucAnhVoice){lucAnhVoice.pause();lucAnhVoice.currentTime=0;}lucAnhVoice=new Audio(LUC_ANH_ULTI_VOICE);lucAnhVoice.volume=.96;lucAnhVoice.play().catch(()=>{});}catch(_e){}}", "function playLucAnhUltimateVoice(){try{if(lucAnhVoice){lucAnhVoice.pause();lucAnhVoice.currentTime=0;}lucAnhVoice=new Audio(LUC_ANH_ULTI_VOICE);lucAnhVoice.preload='auto';lucAnhVoice.volume=1;lucAnhVoice.play().catch(()=>{document.addEventListener('pointerdown',()=>{lucAnhVoice?.play().catch(()=>{});},{once:true});});}catch(_e){}}", 'battle ultimate voice'],
  ["context.save();context.globalCompositeOperation=\"screen\";/* exact 3x source-cell display: 320x220 -> 960x660 */drawLucAnhAtlas(context,key,frame,cx,cy+255,960,660,{baseline:330,screen:true,alpha:.96});context.restore();", "context.save();context.globalCompositeOperation=\"screen\";/* exact 3x source-cell display: 320x220 -> 960x660 */drawLucAnhAtlas(context,key,frame,cx,cy+255,960,660,{baseline:330,screen:true,alpha:1});context.restore();context.save();const pulse=.72+.18*Math.sin(p*Math.PI),g=context.createRadialGradient(cx,cy-30,40,cx,cy,430);g.addColorStop(0,'rgba(8,12,10,'+(.62*pulse)+')');g.addColorStop(.55,'rgba(18,30,22,'+(.46*pulse)+')');g.addColorStop(1,'rgba(5,10,7,0)');context.fillStyle=g;context.beginPath();context.ellipse(cx,cy,460,300,0,0,Math.PI*2);context.fill();slots.forEach((u,i)=>{const rr=95+18*Math.sin(p*Math.PI*2+i);const gg=context.createRadialGradient(u.x,u.y-90,8,u.x,u.y-70,rr);gg.addColorStop(0,'rgba(30,48,34,.05)');gg.addColorStop(.55,'rgba(10,18,12,.42)');gg.addColorStop(1,'rgba(4,8,5,0)');context.fillStyle=gg;context.beginPath();context.arc(u.x,u.y-70,rr,0,Math.PI*2);context.fill();});context.restore();", 'battle toxic cloud visibility']
]);
console.log('Luc Anh runtime patch applied');
