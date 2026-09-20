import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const out = join(process.cwd(), 'dist');
const battlePath = join(out, 'battle.html');
let battle = readFileSync(battlePath, 'utf8');
const marker = 'HV_RESULT_CHARACTER_MOTION_V1';
if (battle.includes(marker)) {
  console.log('Result character motion already installed');
  process.exit(0);
}

let readiness = [];
const readinessPath = join(out, 'battle-readiness-assets.json');
if (existsSync(readinessPath)) {
  try { readiness = JSON.parse(readFileSync(readinessPath, 'utf8')); } catch (_error) { readiness = []; }
}
const readyBySource = new Map(readiness.map(row => [row.source, row]));

function clip(source, frames, cols, cellW, cellH, ms, extra = {}) {
  const ready = readyBySource.get(source);
  const scale = ready?.scale || 1;
  return {
    src: ready?.src || source,
    frames,
    cols,
    cellW: Math.round(cellW * scale),
    cellH: Math.round(cellH * scale),
    ms,
    ...extra
  };
}

const manifest = {
  luc_anh: {
    aliases: ['luc_anh', 'luc-anh', 'hero_splus_luc_anh'],
    run: clip('assets/characters/luc-anh/run-atlas.webp', 61, 8, 240, 240, 28),
    idle: clip('assets/characters/luc-anh/idle-atlas.webp', 64, 8, 240, 240, 58),
    fall: clip('assets/characters/luc-anh/fall-atlas.webp', 64, 8, 240, 240, 34)
  },
  linh_dong: {
    aliases: ['linh_dong', 'linh-dong', 'hero_splus_linh_dong'],
    run: clip('assets/characters/linh-dong/run-atlas.webp', 96, 8, 480, 440, 42),
    idle: clip('assets/characters/linh-dong/idle-atlas.webp', 96, 8, 480, 440, 42),
    fall: clip('assets/characters/linh-dong/fall-atlas.webp', 96, 8, 480, 440, 42)
  },
  bach_dien: {
    aliases: ['bach_dien', 'bach-dien', 'hero_splus_bach_dien'],
    run: clip('assets/characters/bach-dien/run-atlas.webp', 94, 8, 480, 440, 34),
    idle: clip('assets/characters/bach-dien/idle-atlas.webp', 94, 8, 480, 440, 34),
    fall: clip('assets/characters/bach-dien/fall-atlas.webp', 94, 8, 480, 440, 34)
  },
  dinh_loi: {
    aliases: ['dinh_loi', 'dinh-loi'],
    run: clip('assets/characters/dinh-loi/run-atlas.png', 64, 8, 480, 270, 63),
    idle: clip('assets/characters/dinh-loi/idle-atlas.png', 64, 8, 480, 270, 63),
    fall: clip('assets/characters/dinh-loi/fall-atlas.png', 64, 8, 480, 270, 63)
  },
  ong_pho: {
    aliases: ['ong_hang_pho', 'ong-pho-gif-test', 'ong_pho'],
    run: clip('assets/battle-runtime/embedded-11.png', 61, 10, 240, 135, 41, { frameStart: 28, frameEnd: 36 }),
    idle: clip('assets/battle-runtime/embedded-12.png', 48, 8, 240, 135, 120),
    fall: clip('assets/battle-runtime/embedded-14.png', 32, 8, 240, 135, 50)
  }
};

const css = [
  '<style id="hv-result-character-motion-v1">',
  '@media (max-width:699px){#integratedResultV6.irv-defeat .irv-card{height:calc(100% - min(56.25vw,31.640625vh));object-fit:cover;object-position:center top}#integratedResultV6.irv-authored-motion.irv-defeat .irv-hero-wrap{top:11.5%}}',
  '#integratedResultV6.irv-authored-motion.irv-victory .irv-hero-wrap{top:13.5%}',
  '#integratedResultV6.irv-authored-motion .irv-hero{image-rendering:auto;will-change:transform,opacity;transition:opacity 180ms ease}',
  '#integratedResultV6.irv-authored-motion.irv-victory .irv-hero.run{opacity:1;transform:translateX(-118%);animation:none}',
  '#integratedResultV6.irv-authored-motion.irv-victory.irv-motion-run-active .irv-hero.run{animation:hvResultRunIn 1.2s .12s cubic-bezier(.2,.72,.2,1) forwards}',
  '#integratedResultV6.irv-authored-motion.irv-victory.irv-motion-idle .irv-hero.run{opacity:0}',
  '#integratedResultV6.irv-authored-motion.irv-victory .irv-hero.idle{opacity:0!important;animation:none!important;transform:translateX(0)!important}',
  '#integratedResultV6.irv-authored-motion.irv-victory.irv-motion-idle .irv-hero.idle{opacity:1!important}',
  '#integratedResultV6.irv-authored-motion.irv-defeat .irv-hero.fall:not(.irv-generic-fall){animation:none!important;transform:none!important;opacity:1!important;transform-origin:50% 86%}',
  '@media (min-width:700px){#integratedResultV6.irv-authored-motion.irv-defeat[data-irv-motion-hero="linh_dong"] .irv-hero.fall:not(.irv-generic-fall),#integratedResultV6.irv-authored-motion.irv-defeat[data-irv-motion-hero="bach_dien"] .irv-hero.fall:not(.irv-generic-fall){transform:translateY(-14%) scale(.90)!important}}',
  '#integratedResultV6.irv-authored-motion.irv-defeat .irv-hero.fall.irv-generic-fall{animation:hvResultGenericFall .76s cubic-bezier(.22,.72,.24,1) forwards!important;transform-origin:50% 84%}',
  '@keyframes hvResultRunIn{0%{transform:translateX(-118%) translateY(1.5%)}38%{transform:translateX(-68%) translateY(-2%)}74%{transform:translateX(-22%) translateY(.6%)}100%{transform:translateX(0) translateY(0)}}',
  '@keyframes hvResultGenericFall{0%{transform:translateY(0) rotate(0deg) scale(1)}28%{transform:translateY(-3%) rotate(-16deg) scale(.98)}72%{transform:translateY(2%) rotate(-70deg) scale(.86)}100%{transform:translateY(3%) rotate(-82deg) scale(.80)}}',
  '@keyframes hvResultGenericFallDesktop{0%{transform:translateY(0) rotate(0deg) scale(.94)}28%{transform:translateY(-4%) rotate(-16deg) scale(.90)}72%{transform:translateY(-4%) rotate(-70deg) scale(.72)}100%{transform:translateY(-4%) rotate(-82deg) scale(.66)}}',
  '@media (min-width:700px){#integratedResultV6.irv-authored-motion.irv-defeat .irv-hero.fall.irv-generic-fall{animation:hvResultGenericFallDesktop .76s cubic-bezier(.22,.72,.24,1) forwards!important}}',
  '@media (prefers-reduced-motion:reduce){#integratedResultV6.irv-authored-motion.irv-victory .irv-hero.run{animation:none!important;transform:none!important;opacity:0!important}#integratedResultV6.irv-authored-motion.irv-victory .irv-hero.idle{opacity:1!important}#integratedResultV6.irv-authored-motion.irv-defeat .irv-hero.fall.irv-generic-fall{animation:none!important;transform:translateY(3%) rotate(-82deg) scale(.80)!important}}',
  '@media (min-width:700px) and (prefers-reduced-motion:reduce){#integratedResultV6.irv-authored-motion.irv-defeat .irv-hero.fall.irv-generic-fall{transform:translateY(-4%) rotate(-82deg) scale(.66)!important}}',
  '</style>'
].join('\n');
if (!battle.includes('</head>')) throw new Error('Result motion: head boundary missing');
battle = battle.replace('</head>', css + '\n</head>');

// Legacy result painters can own their own RAF loops (notably Lục Ảnh idle).
// Skip them only for heroes handled by this authored result animator, otherwise
// they would paint over Run/Fall frames after show() returns.
const oldLucAnhPainter = [
  "if(victory&&String(m?.sourceId||m?.id)==='luc_anh'){",
  " const runC=root.querySelector('canvas.irv-hero.run'),idleC=root.querySelector('canvas.irv-hero.idle');",
  " if(runC)drawLucAnhIdle(runC);",
  " if(idleC)drawLucAnhIdle(idleC);",
  "}else root.querySelectorAll('canvas.irv-hero').forEach(c=>paintHero(c,m));"
].join('\n');
const fallbackPainter = "root.querySelectorAll('canvas.irv-hero').forEach(c=>paintHero(c,m));";
const guardedPainter = "if(!window.__HV_RESULT_MOTION_CAN_DRAW?.(m))root.querySelectorAll('canvas.irv-hero').forEach(c=>paintHero(c,m));";
if (battle.includes(oldLucAnhPainter)) battle = battle.replace(oldLucAnhPainter, guardedPainter);
else if (battle.includes(fallbackPainter)) battle = battle.replace(fallbackPainter, guardedPainter);
else throw new Error('Result motion: legacy painter boundary missing');

const runtimeLines = [
  '<script id="hv-result-character-motion-v1">',
  '(()=>{',
  '"use strict";',
  'const MARKER="HV_RESULT_CHARACTER_MOTION_V1";',
  'const MANIFEST=' + JSON.stringify(manifest) + ';',
  'const GENERIC_ARCHETYPES={dong_quan:["guardian","assets/battle-runtime/embedded-05.webp"],lam_vu:["ranger","assets/battle-runtime/embedded-06.webp"],moc_an:["healer","assets/battle-runtime/embedded-07.webp"],hoa_ho:["striker","assets/battle-runtime/embedded-08.webp"],van_chi:["mystic","assets/battle-runtime/embedded-10.webp"]};',
  'const root=()=>document.getElementById("integratedResultV6");',
  'const normalize=value=>String(value||"").trim().toLowerCase().replace(/-/g,"_");',
  'const keyFor=m=>{const raw=normalize(m?.sourceId||m?.id||"");const name=String(m?.name||"").trim();for(const [key,entry] of Object.entries(MANIFEST)){if(entry.aliases.some(alias=>normalize(alias)===raw))return key;}if(name==="Ông Phở")return "ong_pho";if(name==="Lục Ảnh")return "luc_anh";if(name==="Linh Đồng")return "linh_dong";if(name==="Bạch Diện")return "bach_dien";if(name==="Đình Lôi")return "dinh_loi";return "";};',
  'const genericFor=m=>{const raw=normalize(m?.sourceId||m?.id||"");const row=GENERIC_ARCHETYPES[raw];return row?{key:"generic_"+row[0],archetype:row[0],src:row[1]}:null;};',
  'const mvp=snap=>(snap?.player||[]).slice().sort((a,b)=>(Number(b.damage)||0)-(Number(a.damage)||0)||(Number(b.kills)||0)-(Number(a.kills)||0))[0]||null;',
  'const imageCache=new Map();let epoch=0,animationStops=new Set(),timers=new Set();',
  'let qa={epoch:0,hero:"",supported:false,generic:false,phase:"idle",runFrames:0,idleFrames:0,fallFrames:0,fallCycles:0,lastRunFrame:null,lastIdleFrame:null,lastFallFrame:null,expectedFallLast:null,source:null};',
  'function cancelAll(){epoch++;for(const stop of animationStops){try{stop();}catch(_e){}}for(const id of timers)clearTimeout(id);animationStops.clear();timers.clear();}',
  'function later(fn,ms){const id=setTimeout(()=>{timers.delete(id);fn();},ms);timers.add(id);return id;}',
  'function imageFor(src,onReady){let record=imageCache.get(src);if(!record){const image=new Image();image.decoding="async";record={image,ready:false,error:false,waiters:new Set()};imageCache.set(src,record);image.onload=()=>{record.ready=true;const jobs=[...record.waiters];record.waiters.clear();jobs.forEach(job=>{try{job();}catch(_e){}});};image.onerror=()=>{record.error=true;record.waiters.clear();};image.src=src;if(image.complete&&image.naturalWidth>1)record.ready=true;}if(record.ready&&onReady)queueMicrotask(onReady);else if(!record.error&&onReady)record.waiters.add(onReady);return record;}',
  'function drawFrame(canvas,clip,frame){const record=imageFor(clip.src);const image=record?.image;if(!canvas||!image||!record.ready||image.naturalWidth<2)return false;const ctx=canvas.getContext("2d");if(!ctx)return false;const first=Math.max(0,Number(clip.frameStart)||0),last=Math.min(clip.frames-1,Number.isFinite(clip.frameEnd)?clip.frameEnd:clip.frames-1),safe=Math.max(first,Math.min(last,frame));const sx=(safe%clip.cols)*clip.cellW,sy=Math.floor(safe/clip.cols)*clip.cellH;ctx.clearRect(0,0,canvas.width,canvas.height);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";const scale=Math.min(canvas.width/clip.cellW,canvas.height/clip.cellH),w=clip.cellW*scale,h=clip.cellH*scale;ctx.drawImage(image,sx,sy,clip.cellW,clip.cellH,(canvas.width-w)/2,canvas.height-h,w,h);return true;}',
  'function drawGenericPose(canvas,generic,column){const record=imageFor(generic.src);const image=record?.image;if(!canvas||!image||!record.ready||image.naturalWidth<4)return false;const ctx=canvas.getContext("2d");if(!ctx)return false;const cellW=image.naturalWidth/4,cellH=image.naturalHeight/2,sx=Math.max(0,Math.min(3,column))*cellW,sy=0;ctx.clearRect(0,0,canvas.width,canvas.height);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";const scale=Math.min((canvas.width*.92)/cellW,(canvas.height*.94)/cellH),w=cellW*scale,h=cellH*scale;ctx.drawImage(image,sx,sy,cellW,cellH,(canvas.width-w)/2,canvas.height-h,w,h);return true;}',
  'function animateGeneric(canvas,generic,column,options){if(!canvas||!generic)return ()=>{};const kind=options.kind,ticket=options.ticket;let active=true,raf=0;const stop=()=>{if(!active)return;active=false;if(raf)cancelAnimationFrame(raf);animationStops.delete(stop);};animationStops.add(stop);const start=()=>{if(!active||ticket!==epoch||!canvas.isConnected){stop();return;}const tick=()=>{if(!active||ticket!==epoch||!canvas.isConnected){stop();return;}const painted=drawGenericPose(canvas,generic,column);if(painted){if(kind==="run"){qa.runFrames++;qa.lastRunFrame=column;}if(kind==="idle"){qa.idleFrames++;qa.lastIdleFrame=column;}if(kind==="fall"){qa.fallFrames++;qa.lastFallFrame=qa.phase==="fall-hold"?1:0;}}raf=requestAnimationFrame(tick);};raf=requestAnimationFrame(tick);};imageFor(generic.src,start);return stop;}',
  'function animate(canvas,clip,options){if(!canvas||!clip)return ()=>{};const loop=options.loop,kind=options.kind,ticket=options.ticket,onDone=options.onDone,first=Math.max(0,Number(clip.frameStart)||0),last=Math.min(clip.frames-1,Number.isFinite(clip.frameEnd)?clip.frameEnd:clip.frames-1),count=Math.max(1,last-first+1);let active=true,raf=0,begin=0;const stop=()=>{if(!active)return;active=false;if(raf)cancelAnimationFrame(raf);animationStops.delete(stop);};animationStops.add(stop);const start=()=>{if(!active||ticket!==epoch||!canvas.isConnected){stop();return;}begin=performance.now();const tick=now=>{if(!active||ticket!==epoch||!canvas.isConnected){stop();return;}const raw=Math.max(0,Math.floor((now-begin)/Math.max(1,clip.ms))),frame=loop?first+(raw%count):Math.min(last,first+raw),painted=drawFrame(canvas,clip,frame);if(painted){if(kind==="run"){qa.runFrames++;qa.lastRunFrame=frame;}if(kind==="idle"){qa.idleFrames++;qa.lastIdleFrame=frame;}if(kind==="fall"){qa.fallFrames++;qa.lastFallFrame=frame;}}if(!loop&&frame>=last){if(kind==="fall")qa.phase="fall-hold";stop();if(onDone)onDone(frame);return;}raf=requestAnimationFrame(tick);};raf=requestAnimationFrame(tick);};imageFor(clip.src,start);return stop;}',
  'function installMotion(victory,snap){cancelAll();const current=root(),m=mvp(snap),key=keyFor(m),entry=MANIFEST[key],generic=entry?null:genericFor(m),ticket=epoch,supported=Boolean(entry||generic),explicitLast=entry?(Number.isFinite(entry.fall.frameEnd)?entry.fall.frameEnd:entry.fall.frames-1):null;qa={epoch:ticket,hero:key||generic?.key||normalize(m?.sourceId||m?.id||m?.name),supported,generic:Boolean(generic),phase:victory?"run":"fall",runFrames:0,idleFrames:0,fallFrames:0,fallCycles:0,lastRunFrame:null,lastIdleFrame:null,lastFallFrame:null,expectedFallLast:entry?explicitLast:(generic?1:null),source:entry?{run:entry.run.src,idle:entry.idle.src,fall:entry.fall.src}:(generic?{run:generic.src,idle:generic.src,fall:generic.src}:null)};if(!current||!supported){if(current){current.classList.remove("irv-authored-motion","irv-motion-idle","irv-motion-run-active");delete current.dataset.irvMotionHero;}return;}current.classList.add("irv-authored-motion");current.classList.remove("irv-motion-idle","irv-motion-run-active");current.dataset.irvMotionHero=key||generic?.key||"";const reduced=window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;if(victory){const run=current.querySelector("canvas.irv-hero.run"),idle=current.querySelector("canvas.irv-hero.idle");if(reduced){if(run)run.style.opacity="0";if(idle)idle.style.opacity="1";current.classList.add("irv-motion-idle");qa.phase="idle";if(entry)animate(idle,entry.idle,{loop:true,kind:"idle",ticket});else animateGeneric(idle,generic,0,{kind:"idle",ticket});return;}let runStarted=false;const MIN_RUN_FRAMES=8;const stopRun=entry?animate(run,entry.run,{loop:true,kind:"run",ticket}):animateGeneric(run,generic,1,{kind:"run",ticket});const finishRun=()=>{if(ticket!==epoch||!current.isConnected||qa.phase!=="run")return;stopRun();current.classList.remove("irv-motion-run-active");current.classList.add("irv-motion-idle");qa.phase="idle";if(entry)animate(idle,entry.idle,{loop:true,kind:"idle",ticket});else animateGeneric(idle,generic,0,{kind:"idle",ticket});};const finishRunWhenVisible=()=>{if(ticket!==epoch||!current.isConnected||qa.phase!=="run")return;if(qa.runFrames>=MIN_RUN_FRAMES){finishRun();return;}later(finishRunWhenVisible,80);};const beginRun=()=>{if(ticket!==epoch||!current.isConnected||qa.phase!=="run"||runStarted)return;runStarted=true;current.classList.add("irv-motion-run-active");later(finishRunWhenVisible,1370);later(finishRun,5000);};const runSource=entry?entry.run.src:generic.src;imageFor(runSource,beginRun);later(()=>{if(!runStarted)finishRun();},10000);}else{const fall=current.querySelector("canvas.irv-hero.fall");qa.fallCycles=1;if(generic)fall?.classList.add("irv-generic-fall");if(reduced){if(entry)drawFrame(fall,entry.fall,explicitLast);else drawGenericPose(fall,generic,0);qa.lastFallFrame=entry?explicitLast:1;qa.fallFrames=1;qa.phase="fall-hold";return;}if(entry){animate(fall,entry.fall,{loop:false,kind:"fall",ticket,onDone:()=>{qa.phase="fall-hold";}});}else{const stopFall=animateGeneric(fall,generic,0,{kind:"fall",ticket});later(()=>{if(ticket!==epoch||!current.isConnected)return;qa.phase="fall-hold";qa.lastFallFrame=1;stopFall();drawGenericPose(fall,generic,0);},780);}}}',
  'window.__HV_RESULT_MOTION_CAN_DRAW=m=>Boolean(MANIFEST[keyFor(m)]||genericFor(m));',
  'const originalShow=window.__showIntegratedResultV6,originalHide=window.__hideIntegratedResultV6;if(typeof originalShow!=="function"||typeof originalHide!=="function")return;',
  'window.__showIntegratedResultV6=(victory,snap)=>{const value=originalShow(victory,snap);installMotion(Boolean(victory),snap);return value;};',
  'window.__hideIntegratedResultV6=()=>{cancelAll();const current=root();if(current){current.classList.remove("irv-authored-motion","irv-motion-idle","irv-motion-run-active");delete current.dataset.irvMotionHero;}return originalHide();};',
  'window.__HV_RESULT_MOTION_QA=Object.freeze({marker:MARKER,state:()=>({...qa,source:qa.source?{...qa.source}:null}),manifest:()=>JSON.parse(JSON.stringify(MANIFEST)),cancel:cancelAll});',
  '})();',
  '</script>'
];
const runtime = runtimeLines.join('\n');
if (!battle.includes('</body>')) throw new Error('Result motion: body boundary missing');
battle = battle.replace('</body>', runtime + '\n</body>');
writeFileSync(battlePath, battle);
console.log('Result character motion v1 applied: authored Victory entry -> Idle and one-shot Defeat Fall -> final-frame hold');
