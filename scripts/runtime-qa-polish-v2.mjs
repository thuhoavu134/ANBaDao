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

// 1) Normalize Lục Ảnh to the original approved battle scale. The previous 500px override
// made idle visibly larger than the rest of the roster and larger than his own skill poses.
battle = replaceOptional(
  battle,
  'drawLucAnhAtlas(context,key,frame,0,0,500,500,{baseline:72,flip:unit.team===TEAM_ENEMY});',
  'drawLucAnhAtlas(context,key,frame,0,0,330,330,{baseline:48,flip:unit.team===TEAM_ENEMY});',
  'Luc Anh battle scale 500 -> 330'
);

// 2) Restore a readable Ultimate cadence. Voice begins first, then character cast, then a long
// full-team cloud phase before damage resolves. Keep all authored frames; only timeline changes.
battle = replaceOptional(
  battle,
  'playLucAnhUltimateVoice();\n        if(!await sleepVisualMilliseconds(180,battleId))return;setUnitState(actor,"ultimate",LUC_ANH_META.ultimate.frames*LUC_ANH_META.ultimate.ms);\n        if(!await sleepVisualMilliseconds(500,battleId))return;startLucAnhFx("ultimateVfx",actor,null,1250);',
  'playLucAnhUltimateVoice();\n        if(!await sleepVisualMilliseconds(260,battleId))return;setUnitState(actor,"ultimate",LUC_ANH_META.ultimate.frames*LUC_ANH_META.ultimate.ms);\n        if(!await sleepVisualMilliseconds(760,battleId))return;startLucAnhFx("ultimateVfx",actor,null,2800);',
  'Luc Anh ultimate lead/cast/cloud timing'
);
battle = replaceOptional(
  battle,
  'if(!await sleepVisualMilliseconds(620,battleId))return;',
  'if(!await sleepVisualMilliseconds(1650,battleId))return;',
  'Luc Anh ultimate impact hold'
);

// 3) Make Độc Vân actually cover the full enemy formation. Size derives from the six enemy slots,
// with a generous minimum so front/back rows are covered on mobile and tablet layouts.
const oldVfx = "context.save();drawLucAnhAtlas(context,key,frame,cx,cy+150,700,482,{baseline:241,alpha:1});context.restore();context.save();const pulse=.68+.16*Math.sin(p*Math.PI),g=context.createRadialGradient(cx,cy-25,35,cx,cy,330);g.addColorStop(0,'rgba(7,11,8,'+(.58*pulse)+')');g.addColorStop(.58,'rgba(15,26,18,'+(.38*pulse)+')');g.addColorStop(1,'rgba(4,8,5,0)');context.fillStyle=g;context.beginPath();context.ellipse(cx,cy-5,355,225,0,0,Math.PI*2);context.fill();context.restore();";
const newVfx = "const xs=slots.map(u=>u.x),ys=slots.map(u=>u.y),minX=xs.length?Math.min(...xs):cx-300,maxX=xs.length?Math.max(...xs):cx+300,minY=ys.length?Math.min(...ys):cy-150,maxY=ys.length?Math.max(...ys):cy+150,fxCx=(minX+maxX)/2,fxCy=(minY+maxY)/2,fxW=Math.max(1120,(maxX-minX)+620),fxH=Math.max(760,(maxY-minY)+560);context.save();drawLucAnhAtlas(context,key,frame,fxCx,fxCy,fxW,fxH,{baseline:fxH/2,alpha:1});context.restore();context.save();const pulse=.72+.18*Math.sin(p*Math.PI),g=context.createRadialGradient(fxCx,fxCy,70,fxCx,fxCy,Math.max(fxW*.48,420));g.addColorStop(0,'rgba(6,10,7,'+(.70*pulse)+')');g.addColorStop(.58,'rgba(14,25,17,'+(.48*pulse)+')');g.addColorStop(1,'rgba(3,7,4,0)');context.fillStyle=g;context.beginPath();context.ellipse(fxCx,fxCy,fxW*.48,fxH*.43,0,0,Math.PI*2);context.fill();context.restore();";
battle = replaceOptional(battle, oldVfx, newVfx, 'Luc Anh full-team ultimate VFX');

// 4) Ultimate voice: always route through the parent page's globally unlocked AudioContext first.
// The voice file exists in assets/audio. This avoids iframe autoplay restrictions on iOS/iPadOS.
const voiceRe = /function playLucAnhUltimateVoice\(\)\{[\s\S]*?(?=function lucAnhFrame)/;
if(voiceRe.test(battle)){
  battle = battle.replace(voiceRe, `function playLucAnhUltimateVoice(){
  try{
    const bus=(window.parent&&window.parent!==window&&window.parent.HonVietAudio)?window.parent.HonVietAudio:window.HonVietAudio;
    if(bus&&typeof bus.playVoice==='function'){
      bus.preload?.('/assets/audio/voice-luc-anh-ultimate.mp3').catch?.(()=>{});
      bus.playVoice('/assets/audio/voice-luc-anh-ultimate.mp3',4.5).catch(()=>{});
      return;
    }
    initAudio?.();
    if(audioContext&&lucAnhVoiceBuffer){
      if(audioContext.state==='suspended')audioContext.resume().catch(()=>{});
      const src=audioContext.createBufferSource(),gain=audioContext.createGain();
      src.buffer=lucAnhVoiceBuffer;gain.gain.value=4.5;src.connect(gain);gain.connect(audioContext.destination);src.start(0);return;
    }
    const a=new Audio('/assets/audio/voice-luc-anh-ultimate.mp3');a.preload='auto';a.volume=1;a.play().catch(()=>{});
  }catch(_e){}
}
`);
}else console.warn('[QA polish] ultimate voice function not found');

// Also unlock/preload the parent audio bus on the first battle interaction.
const preloadHook = `<script id="luc-anh-ultimate-voice-bridge">\n(()=>{const prime=()=>{try{const b=(parent&&parent!==window&&parent.HonVietAudio)?parent.HonVietAudio:window.HonVietAudio;b?.unlock?.().catch?.(()=>{});b?.preload?.('/assets/audio/voice-luc-anh-ultimate.mp3').catch?.(()=>{});}catch(_e){}};['pointerdown','touchstart','click'].forEach(t=>document.addEventListener(t,prime,{capture:true,passive:true,once:true}));})();\n</script>`;
if(!battle.includes('luc-anh-ultimate-voice-bridge')) battle=battle.replace('</body>',preloadHook+'\n</body>');

// 5) Victory: actual Lục Ảnh run/idle frames instead of a static portrait sliding across the screen.
const paintOld = "root.querySelectorAll('canvas.irv-hero').forEach(c=>paintHero(c,m));";
const paintNew = `if(victory&&String(m?.sourceId||m?.id)==='luc_anh'){
 const runC=root.querySelector('canvas.irv-hero.run'),idleC=root.querySelector('canvas.irv-hero.idle');
 const anim=(c,key,loop)=>{if(!c)return;const g=c.getContext('2d'),meta=LUC_ANH_META[key],start=performance.now();const tick=()=>{if(!c.isConnected)return;g.clearRect(0,0,c.width,c.height);const elapsed=performance.now()-start,f=lucAnhFrame(key,elapsed,loop);drawLucAnhAtlas(g,key,f,c.width/2,c.height-4,250,250,{baseline:44});if(loop||f<meta.frames-1)requestAnimationFrame(tick);};tick();};
 anim(runC,'run',true);anim(idleC,'idle',true);
}else root.querySelectorAll('canvas.irv-hero').forEach(c=>paintHero(c,m));`;
battle = replaceOptional(battle,paintOld,paintNew,'Victory Luc Anh actual run/idle');

// Strong visibility guarantees for result hero and buttons.
const resultStyle = `<style id="qa-result-polish-v2">\n#integratedResultV6 .irv-hero-wrap{z-index:8!important;overflow:visible!important}#integratedResultV6 .irv-hero.run{opacity:1!important;visibility:visible!important;display:block!important}#integratedResultV6 .irv-actions{z-index:30!important;pointer-events:auto!important}#integratedResultV6 .irv-btn{pointer-events:auto!important;touch-action:manipulation!important;cursor:pointer!important}\n</style>`;
if(!battle.includes('qa-result-polish-v2')) battle=battle.replace('</head>',resultStyle+'\n</head>');

// 6) Result buttons: capture phase handler so Safari/iOS cannot lose the click behind the overlay.
// Xác nhận -> return to Chinh Chiến. Ải sau -> publish the result so the parent callback advances.
const resultBridge = `<script id="qa-result-actions-v2">\n(()=>{if(window.__qaResultActionsV2)return;window.__qaResultActionsV2=true;const handle=(ev)=>{const b=ev.target?.closest?.('#integratedResultV6 [data-result-action]');if(!b)return;ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation?.();const a=b.dataset.resultAction;if(a==='confirm'){if(typeof EMBEDDED!=='undefined'&&EMBEDDED){try{parent.postMessage({source:'hon-viet-battle',type:'battle-nav',payload:{sessionId:EMBED_CONFIG?.sessionId||'',target:'campaign'}},'*');}catch(_e){}}else try{continueFromBattleResult();}catch(_e){}return;}if(a==='next'){try{if(typeof EMBEDDED!=='undefined'&&EMBEDDED){state.resultPublished=false;publishBattleResult();window.__hideIntegratedResultV6?.();}else continueFromBattleResult();}catch(_e){try{parent.postMessage({source:'hon-viet-battle',type:'battle-nav',payload:{sessionId:EMBED_CONFIG?.sessionId||'',target:'campaign'}},'*');}catch(_e2){}}return;}if(a==='back'){try{if(typeof EMBEDDED!=='undefined'&&EMBEDDED)parent.postMessage({source:'hon-viet-battle',type:'battle-nav',payload:{sessionId:EMBED_CONFIG?.sessionId||'',target:'campaign'}},'*');else nav('campaign');}catch(_e){}}};document.addEventListener('click',handle,true);document.addEventListener('touchend',handle,{capture:true,passive:false});})();\n</script>`;
if(!battle.includes('qa-result-actions-v2')) battle=battle.replace('</body>',resultBridge+'\n</body>');

writeFileSync(battlePath,battle);

// Keep any legacy/index battle surface at the same visual scale; the previous 228px override made
// Lục Ảnh larger than the roster benchmark there as well.
let index = readFileSync(indexPath,'utf8');
index = replaceOptional(index,
  "const h=228,w=228;return drawLucAtlasFrame(kind,f,x-w/2,groundY-h+10,w,h,c.side==='foe');",
  "const h=178,w=178;return drawLucAtlasFrame(kind,f,x-w/2,groundY-h+8,w,h,c.side==='foe');",
  'index Luc Anh scale 228 -> 178'
);
writeFileSync(indexPath,index);

console.log('Runtime QA polish v2 applied: victory controls/run, Luc Anh normalized scale, full-team slower ultimate, iOS voice bridge');
