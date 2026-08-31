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
  ["ultimate_vfx:{src:'assets/characters/luc-anh/ultimate_vfx-atlas.webp'", "ultimate_vfx:{src:'assets/characters/luc-anh/ultimate_vfx-alpha.webp'", 'index ultimate alpha asset'],
  ["const h=178,w=178;return drawLucAtlasFrame(kind,f,x-w/2,groundY-h+8,w,h,c.side==='foe');", "const h=228,w=228;return drawLucAtlasFrame(kind,f,x-w/2,groundY-h+10,w,h,c.side==='foe');", 'index Luc Anh combat scale'],
  ["function playLucAnhVoice(src,vol=.92){ try{ if(_lucAnhVoice){_lucAnhVoice.pause();_lucAnhVoice.currentTime=0;} _lucAnhVoice=new Audio(src); _lucAnhVoice.volume=vol; _lucAnhVoice.play().catch(()=>{}); }catch(_e){} }", "function playLucAnhVoice(src,vol=1){ try{ if(_lucAnhVoice){_lucAnhVoice.pause();_lucAnhVoice.currentTime=0;} const oldBgm=typeof bgmPlayer!=='undefined'?bgmPlayer.volume:null; if(oldBgm!==null)bgmPlayer.volume=Math.min(oldBgm,.14); _lucAnhVoice=new Audio(src); _lucAnhVoice.preload='auto'; _lucAnhVoice.volume=Math.min(1,vol); _lucAnhVoice.play().catch(()=>{}); const restore=()=>{if(oldBgm!==null)bgmPlayer.volume=oldBgm;}; _lucAnhVoice.addEventListener('ended',restore,{once:true}); setTimeout(restore,3200); }catch(_e){} }", 'index voice priority'],
  ["function startLucAnhDetailIdle(){cancelAnimationFrame(_lucDetailRaf);const cv=document.getElementById('lucAnhDetailIdle');if(!cv)return;const c=cv.getContext('2d'),a=LUC_ANH_ANIMS.idle,im=LUC_ANH_IMAGES.idle,start=performance.now();function tick(){if(!cv.isConnected)return;c.clearRect(0,0,cv.width,cv.height);if(im.complete&&im.naturalWidth>1){const f=lucFrame(a,start,true),sx=(f%a.cols)*a.w,sy=Math.floor(f/a.cols)*a.h;c.drawImage(im,sx,sy,a.w,a.h,0,0,cv.width,cv.height);}_lucDetailRaf=requestAnimationFrame(tick);}tick();}", "function startLucAnhDetailIdle(){cancelAnimationFrame(_lucDetailRaf);const cv=document.getElementById('lucAnhDetailIdle');if(!cv)return;const css=280,dpr=Math.min(3,window.devicePixelRatio||1);cv.style.width=css+'px';cv.style.height=css+'px';cv.width=Math.round(css*dpr);cv.height=Math.round(css*dpr);const c=cv.getContext('2d'),a=LUC_ANH_ANIMS.idle,im=LUC_ANH_IMAGES.idle,start=performance.now();c.setTransform(dpr,0,0,dpr,0,0);c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';function tick(){if(!cv.isConnected)return;c.clearRect(0,0,css,css);if(im.complete&&im.naturalWidth>1){const f=lucFrame(a,start,true),sx=(f%a.cols)*a.w,sy=Math.floor(f/a.cols)*a.h;c.drawImage(im,sx,sy,a.w,a.h,0,0,css,css);}_lucDetailRaf=requestAnimationFrame(tick);}tick();}", 'detail retina idle'],
  ["playLucAnhVoice(LUC_ANH_HERO_VOICE,.92)", "playLucAnhVoice(LUC_ANH_HERO_VOICE,1)", 'detail voice volume']
]);

patchFile('battle.html', [
  ["ultimateVfx:{file:\"ultimate_vfx-atlas.webp\"", "ultimateVfx:{file:\"ultimate_vfx-alpha.webp\"", 'battle ultimate alpha asset'],
  ["drawLucAnhAtlas(context,key,frame,0,0,330,330,{baseline:48,flip:unit.team===TEAM_ENEMY});", "drawLucAnhAtlas(context,key,frame,0,0,520,520,{baseline:74,flip:unit.team===TEAM_ENEMY});", 'battle Luc Anh scale'],
  ["function playLucAnhUltimateVoice(){try{if(lucAnhVoice){lucAnhVoice.pause();lucAnhVoice.currentTime=0;}lucAnhVoice=new Audio(LUC_ANH_ULTI_VOICE);lucAnhVoice.volume=.96;lucAnhVoice.play().catch(()=>{});}catch(_e){}}", "function playLucAnhUltimateVoice(){try{if(lucAnhVoice){lucAnhVoice.pause();lucAnhVoice.currentTime=0;}lucAnhVoice=new Audio(LUC_ANH_ULTI_VOICE);lucAnhVoice.preload='auto';lucAnhVoice.volume=1;lucAnhVoice.play().catch(()=>{document.addEventListener('pointerdown',()=>{lucAnhVoice?.play().catch(()=>{});},{once:true});});}catch(_e){}}", 'battle ultimate voice'],
  ["else if(key===\"ultimateVfx\"){const enemyTeam=actor.team===TEAM_PLAYER?TEAM_ENEMY:TEAM_PLAYER,slots=units.filter(u=>u.team===enemyTeam),cx=slots.length?slots.reduce((a,u)=>a+u.x,0)/slots.length:(actor.team===TEAM_PLAYER?WORLD.width*.72:WORLD.width*.28),cy=slots.length?slots.reduce((a,u)=>a+u.y,0)/slots.length:WORLD.height*.52;context.save();context.globalCompositeOperation=\"screen\";/* exact 3x source-cell display: 320x220 -> 960x660 */drawLucAnhAtlas(context,key,frame,cx,cy+255,960,660,{baseline:330,screen:true,alpha:.96});context.restore();}", "else if(key===\"ultimateVfx\"){const enemyTeam=actor.team===TEAM_PLAYER?TEAM_ENEMY:TEAM_PLAYER,slots=units.filter(u=>u.team===enemyTeam),cx=slots.length?slots.reduce((a,u)=>a+u.x,0)/slots.length:(actor.team===TEAM_PLAYER?WORLD.width*.72:WORLD.width*.28),cy=slots.length?slots.reduce((a,u)=>a+u.y,0)/slots.length:WORLD.height*.52;context.save();/* exact 3x source-cell display: 320x220 -> 960x660; source-over keeps black toxic smoke visible */drawLucAnhAtlas(context,key,frame,cx,cy+255,960,660,{baseline:330,alpha:1});context.restore();}", 'battle black smoke composite']
]);
console.log('Luc Anh runtime patch applied');
