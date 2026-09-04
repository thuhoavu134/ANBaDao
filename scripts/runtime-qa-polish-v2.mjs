import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const out = join(process.cwd(), 'dist');
const battlePath = join(out, 'battle.html');
const indexPath = join(out, 'index.html');

function replaceOptional(s, from, to, label){
  if(!s.includes(from)){console.warn(`[QA polish] skip ${label}`);return s;}
  return s.replace(from,to);
}

let battle = readFileSync(battlePath,'utf8');

// 1) Normalize apparent Lục Ảnh size across idle/basic/skill1/ultimate.
// Source clips have different internal padding, so identical canvas sizes do NOT look identical.
// Idle stays at the approved 330 benchmark; action clips get a small compensation only.
battle = replaceOptional(
  battle,
  'drawLucAnhAtlas(context,key,frame,0,0,500,500,{baseline:72,flip:unit.team===TEAM_ENEMY});',
  'const lucAnhVisualSize=(key==="attack"||key==="skill1"||key==="ultimate")?372:330;const lucAnhBaseline=(key==="attack"||key==="skill1"||key==="ultimate")?54:48;drawLucAnhAtlas(context,key,frame,0,0,lucAnhVisualSize,lucAnhVisualSize,{baseline:lucAnhBaseline,flip:unit.team===TEAM_ENEMY});',
  'Luc Anh state-aware battle scale'
);
// If an earlier QA build already restored 330, still upgrade it to the state-aware form.
battle = replaceOptional(
  battle,
  'drawLucAnhAtlas(context,key,frame,0,0,330,330,{baseline:48,flip:unit.team===TEAM_ENEMY});',
  'const lucAnhVisualSize=(key==="attack"||key==="skill1"||key==="ultimate")?372:330;const lucAnhBaseline=(key==="attack"||key==="skill1"||key==="ultimate")?54:48;drawLucAnhAtlas(context,key,frame,0,0,lucAnhVisualSize,lucAnhVisualSize,{baseline:lucAnhBaseline,flip:unit.team===TEAM_ENEMY});',
  'Luc Anh 330 scale -> state-aware compensation'
);

// 2) Ultimate cadence: voice first, readable lantern cast, then a long poison-cloud phase.
battle = replaceOptional(
  battle,
  'playLucAnhUltimateVoice();\n        if(!await sleepVisualMilliseconds(180,battleId))return;setUnitState(actor,"ultimate",LUC_ANH_META.ultimate.frames*LUC_ANH_META.ultimate.ms);\n        if(!await sleepVisualMilliseconds(500,battleId))return;startLucAnhFx("ultimateVfx",actor,null,1250);',
  'window.__playLucAnhUltimateVoiceGuaranteed?.();\n        if(!await sleepVisualMilliseconds(260,battleId))return;setUnitState(actor,"ultimate",LUC_ANH_META.ultimate.frames*LUC_ANH_META.ultimate.ms);\n        if(!await sleepVisualMilliseconds(760,battleId))return;startLucAnhFx("ultimateVfx",actor,null,3200);',
  'Luc Anh ultimate voice/cast/cloud timing'
);
// Current deployed QA variant may already be 2800ms; force the guaranteed voice and a longer cloud.
battle = replaceOptional(
  battle,
  'playLucAnhUltimateVoice();\n        if(!await sleepVisualMilliseconds(260,battleId))return;setUnitState(actor,"ultimate",LUC_ANH_META.ultimate.frames*LUC_ANH_META.ultimate.ms);\n        if(!await sleepVisualMilliseconds(760,battleId))return;startLucAnhFx("ultimateVfx",actor,null,2800);',
  'window.__playLucAnhUltimateVoiceGuaranteed?.();\n        if(!await sleepVisualMilliseconds(260,battleId))return;setUnitState(actor,"ultimate",LUC_ANH_META.ultimate.frames*LUC_ANH_META.ultimate.ms);\n        if(!await sleepVisualMilliseconds(760,battleId))return;startLucAnhFx("ultimateVfx",actor,null,3200);',
  'Luc Anh deployed ultimate -> guaranteed voice'
);
battle = replaceOptional(
  battle,
  'if(!await sleepVisualMilliseconds(620,battleId))return;',
  'if(!await sleepVisualMilliseconds(1850,battleId))return;',
  'Luc Anh ultimate impact hold'
);
battle = replaceOptional(
  battle,
  'if(!await sleepVisualMilliseconds(1650,battleId))return;',
  'if(!await sleepVisualMilliseconds(1850,battleId))return;',
  'Luc Anh deployed ultimate impact hold'
);

// 3) Keep legacy VFX replacement anchors available for older builds.
// runtime-qa-polish-v5 runs after this patch and finalizes the authored, aspect-correct
// single 3x cloud. No procedural gradient is part of the final renderer.
const oldVfxA = "context.save();drawLucAnhAtlas(context,key,frame,cx,cy+150,700,482,{baseline:241,alpha:1});context.restore();context.save();const pulse=.68+.16*Math.sin(p*Math.PI),g=context.createRadialGradient(cx,cy-25,35,cx,cy,330);g.addColorStop(0,'rgba(7,11,8,'+(.58*pulse)+')');g.addColorStop(.58,'rgba(15,26,18,'+(.38*pulse)+')');g.addColorStop(1,'rgba(4,8,5,0)');context.fillStyle=g;context.beginPath();context.ellipse(cx,cy-5,355,225,0,0,Math.PI*2);context.fill();context.restore();";
const oldVfxB = "const xs=slots.map(u=>u.x),ys=slots.map(u=>u.y),minX=xs.length?Math.min(...xs):cx-300,maxX=xs.length?Math.max(...xs):cx+300,minY=ys.length?Math.min(...ys):cy-150,maxY=ys.length?Math.max(...ys):cy+150,fxCx=(minX+maxX)/2,fxCy=(minY+maxY)/2,fxW=Math.max(1120,(maxX-minX)+620),fxH=Math.max(760,(maxY-minY)+560);context.save();drawLucAnhAtlas(context,key,frame,fxCx,fxCy,fxW,fxH,{baseline:fxH/2,alpha:1});context.restore();context.save();const pulse=.72+.18*Math.sin(p*Math.PI),g=context.createRadialGradient(fxCx,fxCy,70,fxCx,fxCy,Math.max(fxW*.48,420));g.addColorStop(0,'rgba(6,10,7,'+(.70*pulse)+')');g.addColorStop(.58,'rgba(14,25,17,'+(.48*pulse)+')');g.addColorStop(1,'rgba(3,7,4,0)');context.fillStyle=g;context.beginPath();context.ellipse(fxCx,fxCy,fxW*.48,fxH*.43,0,0,Math.PI*2);context.fill();context.restore();";
const tripleVfx = "const xs=slots.map(u=>u.x),ys=slots.map(u=>u.y),avgX=xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:cx,targetRight=avgX>=WORLD.width/2,halfX=targetRight?WORLD.width/2:0,halfW=WORLD.width/2,minY=ys.length?Math.min(...ys):cy-120,maxY=ys.length?Math.max(...ys):cy+120,fxCx=targetRight?WORLD.width*.75:WORLD.width*.25,rowYs=[Math.max(120,minY-95),(minY+maxY)/2,Math.min(WORLD.height-90,maxY+95)],fxW=Math.min(halfW*.96,760),fxH=Math.max(300,Math.min(390,(maxY-minY)*.72+250));context.save();context.beginPath();context.rect(halfX,0,halfW,WORLD.height);context.clip();for(const rowY of rowYs){drawLucAnhAtlas(context,key,frame,fxCx,rowY,fxW,fxH,{baseline:fxH/2,alpha:.98});}const pulse=.72+.18*Math.sin(p*Math.PI);context.globalCompositeOperation='source-over';for(const rowY of rowYs){const g=context.createRadialGradient(fxCx,rowY,45,fxCx,rowY,fxW*.48);g.addColorStop(0,'rgba(6,10,7,'+(.62*pulse)+')');g.addColorStop(.62,'rgba(14,25,17,'+(.40*pulse)+')');g.addColorStop(1,'rgba(3,7,4,0)');context.fillStyle=g;context.beginPath();context.ellipse(fxCx,rowY,fxW*.48,fxH*.40,0,0,Math.PI*2);context.fill();}context.restore();";
if(battle.includes(oldVfxB)) battle=battle.replace(oldVfxB,tripleVfx);
else battle = replaceOptional(battle,oldVfxA,tripleVfx,'Luc Anh triple enemy-half ultimate VFX');

// 4) Guaranteed Ultimate voice bridge. This is intentionally independent of the older function
// patch: the action calls this global function directly, so iOS iframe/global-binding quirks cannot
// silently bypass the voice. The parent audio bus was unlocked by the user's first real game tap.
const voiceBridge = String.raw`<script id="luc-anh-ultimate-voice-guaranteed">
(()=> {
 const URL='/assets/audio/voice-luc-anh-ultimate.mp3';
 const getBus=()=>{try{return (window.parent&&window.parent!==window&&window.parent.HonVietAudio)?window.parent.HonVietAudio:window.HonVietAudio;}catch(_e){return window.HonVietAudio;}};
 const audio=new Audio(URL);
 audio.preload='auto';
 audio.autoplay=false;
 audio.loop=false;
 audio.volume=1;
 audio.setAttribute('playsinline','');
 let unlocked=false,unlocking=null;
 const unlock=()=>{
   if(unlocked)return Promise.resolve(true);
   if(unlocking)return unlocking;
   const oldMuted=audio.muted,oldVolume=audio.volume;
   audio.muted=true;audio.volume=0;
   try{
     const p=audio.play();
     unlocking=Promise.resolve(p).then(()=>{
       audio.pause();audio.currentTime=0;unlocked=true;return true;
     },()=>false).finally(()=>{
       audio.muted=oldMuted;audio.volume=oldVolume;unlocking=null;
     });
   }catch(_e){
     audio.muted=oldMuted;audio.volume=oldVolume;unlocking=Promise.resolve(false);
   }
   return unlocking;
 };
 try{audio.load();}catch(_e){}
 audio.addEventListener('ended',()=>{try{audio.currentTime=0;}catch(_e){}});
 const fallback=()=>{
   try{
     const bus=getBus();
     if(bus&&typeof bus.playVoice==='function'){
       const p=bus.playVoice(URL,5);
       if(p&&typeof p.catch==='function')p.catch(()=>{});
       return p&&typeof p.catch==='function'?p.catch(()=>false):Promise.resolve(true);
     }
   }catch(_e){}
   try{
     const a=new Audio(URL);a.preload='auto';a.volume=1;
     const p=a.play();return p&&typeof p.catch==='function'?p.catch(()=>false):Promise.resolve(true);
   }catch(_e){return Promise.resolve(false);}
 };
 const play=()=>{
   try{
     audio.pause();audio.currentTime=0;audio.muted=false;audio.volume=1;
     const p=audio.play();
     if(p&&typeof p.catch==='function')return p.catch(()=>Promise.resolve(fallback()).catch(()=>false));
     return Promise.resolve(true);
   }catch(_e){return fallback();}
 };
 window.__HV_LUC_ANH_ULTIMATE_AUDIO_V2={audio,unlock,play,isUnlocked:()=>unlocked,url:URL};
 window.__playLucAnhUltimateVoiceGuaranteed=()=>{try{const p=window.__HV_LUC_ANH_ULTIMATE_AUDIO_V2.play();if(p&&typeof p.catch==='function')p.catch(()=>{});return p;}catch(_e){return false;}};
 const onGesture=()=>{
   unlock().catch(()=>{});
   try{const bus=getBus(),p=bus?.unlock?.();if(p&&typeof p.catch==='function')p.catch(()=>{});}catch(_e){}
 };
 ['pointerdown','touchstart','click','keydown'].forEach(t=>document.addEventListener(t,onGesture,{capture:true,passive:true}));
})();
</script>`;
if(!battle.includes('luc-anh-ultimate-voice-guaranteed')) battle=battle.replace('</body>',voiceBridge+'\n</body>');

// 5) Victory: actual Lục Ảnh run/idle frames instead of a static portrait sliding across the screen.
const paintOld = "root.querySelectorAll('canvas.irv-hero').forEach(c=>paintHero(c,m));";
const paintNew = `if(victory&&String(m?.sourceId||m?.id)==='luc_anh'){
 const runC=root.querySelector('canvas.irv-hero.run'),idleC=root.querySelector('canvas.irv-hero.idle');
 const anim=(c,key,loop)=>{if(!c)return;const g=c.getContext('2d'),meta=LUC_ANH_META[key],start=performance.now();const tick=()=>{if(!c.isConnected)return;g.clearRect(0,0,c.width,c.height);const elapsed=performance.now()-start,f=lucAnhFrame(key,elapsed,loop);drawLucAnhAtlas(g,key,f,c.width/2,c.height-4,250,250,{baseline:44});if(loop||f<meta.frames-1)requestAnimationFrame(tick);};tick();};
 anim(runC,'run',true);anim(idleC,'idle',true);
}else root.querySelectorAll('canvas.irv-hero').forEach(c=>paintHero(c,m));`;
battle = replaceOptional(battle,paintOld,paintNew,'Victory Luc Anh actual run/idle');

const resultStyle = `<style id="qa-result-polish-v2">\n#integratedResultV6 .irv-hero-wrap{z-index:8!important;overflow:visible!important}#integratedResultV6 .irv-hero.run{opacity:1!important;visibility:visible!important;display:block!important}#integratedResultV6 .irv-actions{z-index:30!important;pointer-events:auto!important}#integratedResultV6 .irv-btn{pointer-events:auto!important;touch-action:manipulation!important;cursor:pointer!important}\n</style>`;
if(!battle.includes('qa-result-polish-v2')) battle=battle.replace('</head>',resultStyle+'\n</head>');

const resultBridge = `<script id="qa-result-actions-v2">\n(()=>{if(window.__qaResultActionsV2)return;window.__qaResultActionsV2=true;const handle=(ev)=>{const b=ev.target?.closest?.('#integratedResultV6 [data-result-action]');if(!b)return;ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation?.();const a=b.dataset.resultAction;if(a==='confirm'){if(typeof EMBEDDED!=='undefined'&&EMBEDDED){try{parent.postMessage({source:'hon-viet-battle',type:'battle-nav',payload:{sessionId:EMBED_CONFIG?.sessionId||'',target:'campaign'}},'*');}catch(_e){}}else try{continueFromBattleResult();}catch(_e){}return;}if(a==='next'){try{if(typeof EMBEDDED!=='undefined'&&EMBEDDED){state.resultPublished=false;publishBattleResult();window.__hideIntegratedResultV6?.();}else continueFromBattleResult();}catch(_e){try{parent.postMessage({source:'hon-viet-battle',type:'battle-nav',payload:{sessionId:EMBED_CONFIG?.sessionId||'',target:'campaign'}},'*');}catch(_e2){}}return;}if(a==='back'){try{if(typeof EMBEDDED!=='undefined'&&EMBEDDED)parent.postMessage({source:'hon-viet-battle',type:'battle-nav',payload:{sessionId:EMBED_CONFIG?.sessionId||'',target:'campaign'}},'*');else nav('campaign');}catch(_e){}}};document.addEventListener('click',handle,true);document.addEventListener('touchend',handle,{capture:true,passive:false});})();\n</script>`;
if(!battle.includes('qa-result-actions-v2')) battle=battle.replace('</body>',resultBridge+'\n</body>');

writeFileSync(battlePath,battle);

let index = readFileSync(indexPath,'utf8');
index = replaceOptional(index,
  "const h=228,w=228;return drawLucAtlasFrame(kind,f,x-w/2,groundY-h+10,w,h,c.side==='foe');",
  "const h=178,w=178;return drawLucAtlasFrame(kind,f,x-w/2,groundY-h+8,w,h,c.side==='foe');",
  'index Luc Anh scale 228 -> 178'
);
writeFileSync(indexPath,index);

console.log('Runtime QA polish v3 applied: state-matched Luc Anh scale, 3-row enemy-half ultimate, guaranteed ultimate voice');
