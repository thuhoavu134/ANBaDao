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
  '#integratedResultV6.irv-authored-motion .irv-hero{image-rendering:auto;will-change:transform,opacity;transition:opacity 180ms ease}',
  '#integratedResultV6.irv-authored-motion.irv-victory .irv-hero.run{opacity:1;transform:translateX(-118%);animation:hvResultRunIn 1.2s .12s cubic-bezier(.2,.72,.2,1) forwards}',
  '#integratedResultV6.irv-authored-motion.irv-victory.irv-motion-idle .irv-hero.run{opacity:0}',
  '#integratedResultV6.irv-authored-motion.irv-victory .irv-hero.idle{opacity:0!important;animation:none!important;transform:translateX(0)!important}',
  '#integratedResultV6.irv-authored-motion.irv-victory.irv-motion-idle .irv-hero.idle{opacity:1!important}',
  '#integratedResultV6.irv-authored-motion.irv-defeat .irv-hero.fall{animation:none!important;transform:none!important;opacity:1!important;transform-origin:50% 86%}',
  '@keyframes hvResultRunIn{0%{transform:translateX(-118%) translateY(1.5%)}38%{transform:translateX(-68%) translateY(-2%)}74%{transform:translateX(-22%) translateY(.6%)}100%{transform:translateX(0) translateY(0)}}',
  '@media (prefers-reduced-motion:reduce){#integratedResultV6.irv-authored-motion.irv-victory .irv-hero.run{animation:none!important;transform:none!important;opacity:0!important}#integratedResultV6.irv-authored-motion.irv-victory .irv-hero.idle{opacity:1!important}}',
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
  'const root=()=>document.getElementById("integratedResultV6");',
  'const normalize=value=>String(value||"").trim().toLowerCase().replace(/-/g,"_");',
  'const keyFor=m=>{const raw=normalize(m?.sourceId||m?.id||"");const name=String(m?.name||"").trim();for(const [key,entry] of Object.entries(MANIFEST)){if(entry.aliases.some(alias=>normalize(alias)===raw))return key;}if(name==="Ông Phở")return "ong_pho";if(name==="Lục Ảnh")return "luc_anh";if(name==="Linh Đồng")return "linh_dong";if(name==="Bạch Diện")return "bach_dien";if(name==="Đình Lôi")return "dinh_loi";return "";};',
  'const mvp=snap=>(snap?.player||[]).slice().sort((a,b)=>(Number(b.damage)||0)-(Number(a.damage)||0)||(Number(b.kills)||0)-(Number(a.kills)||0))[0]||null;',
  'const imageCache=new Map();let epoch=0,animationStops=new Set(),timers=new Set();',
  'let qa={epoch:0,hero:"",supported:false,phase:"idle",runFrames:0,idleFrames:0,fallFrames:0,fallCycles:0,lastRunFrame:null,lastIdleFrame:null,lastFallFrame:null,source:null};',
  'function cancelAll(){epoch++;for(const stop of animationStops){try{stop();}catch(_e){}}for(const id of timers)clearTimeout(id);animationStops.clear();timers.clear();}',
  'function later(fn,ms){const id=setTimeout(()=>{timers.delete(id);fn();},ms);timers.add(id);return id;}',
  'function imageFor(src,onReady){let record=imageCache.get(src);if(!record){const image=new Image();image.decoding="async";record={image,ready:false,error:false,waiters:new Set()};imageCache.set(src,record);image.onload=()=>{record.ready=true;const jobs=[...record.waiters];record.waiters.clear();jobs.forEach(job=>{try{job();}catch(_e){}});};image.onerror=()=>{record.error=true;record.waiters.clear();};image.src=src;if(image.complete&&image.naturalWidth>1)record.ready=true;}if(record.ready&&onReady)queueMicrotask(onReady);else if(!record.error&&onReady)record.waiters.add(onReady);return record;}',
  'function drawFrame(canvas,clip,frame){const record=imageFor(clip.src);const image=record?.image;if(!canvas||!image||!record.ready||image.naturalWidth<2)return false;const ctx=canvas.getContext("2d");if(!ctx)return false;const first=Math.max(0,Number(clip.frameStart)||0),last=Math.min(clip.frames-1,Number.isFinite(clip.frameEnd)?clip.frameEnd:clip.frames-1),safe=Math.max(first,Math.min(last,frame));const sx=(safe%clip.cols)*clip.cellW,sy=Math.floor(safe/clip.cols)*clip.cellH;ctx.clearRect(0,0,canvas.width,canvas.height);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";const scale=Math.min(canvas.width/clip.cellW,canvas.height/clip.cellH),w=clip.cellW*scale,h=clip.cellH*scale;ctx.drawImage(image,sx,sy,clip.cellW,clip.cellH,(canvas.width-w)/2,canvas.height-h,w,h);return true;}',
  'function animate(canvas,clip,options){if(!canvas||!clip)return ()=>{};const loop=options.loop,kind=options.kind,ticket=options.ticket,onDone=options.onDone,first=Math.max(0,Number(clip.frameStart)||0),last=Math.min(clip.frames-1,Number.isFinite(clip.frameEnd)?clip.frameEnd:clip.frames-1),count=Math.max(1,last-first+1);let active=true,raf=0,begin=0;const stop=()=>{if(!active)return;active=false;if(raf)cancelAnimationFrame(raf);animationStops.delete(stop);};animationStops.add(stop);const start=()=>{if(!active||ticket!==epoch||!canvas.isConnected){stop();return;}begin=performance.now();const tick=now=>{if(!active||ticket!==epoch||!canvas.isConnected){stop();return;}const raw=Math.max(0,Math.floor((now-begin)/Math.max(1,clip.ms))),frame=loop?first+(raw%count):Math.min(last,first+raw),painted=drawFrame(canvas,clip,frame);if(painted){if(kind==="run"){qa.runFrames++;qa.lastRunFrame=frame;}if(kind==="idle"){qa.idleFrames++;qa.lastIdleFrame=frame;}if(kind==="fall"){qa.fallFrames++;qa.lastFallFrame=frame;}}if(!loop&&frame>=last){if(kind==="fall")qa.phase="fall-hold";stop();if(onDone)onDone(frame);return;}raf=requestAnimationFrame(tick);};raf=requestAnimationFrame(tick);};imageFor(clip.src,start);return stop;}',
  'function installMotion(victory,snap){cancelAll();const current=root(),m=mvp(snap),key=keyFor(m),entry=MANIFEST[key],ticket=epoch;qa={epoch:ticket,hero:key||normalize(m?.sourceId||m?.id||m?.name),supported:Boolean(entry),phase:victory?"run":"fall",runFrames:0,idleFrames:0,fallFrames:0,fallCycles:0,lastRunFrame:null,lastIdleFrame:null,lastFallFrame:null,source:entry?{run:entry.run.src,idle:entry.idle.src,fall:entry.fall.src}:null};if(!current||!entry){current?.classList.remove("irv-authored-motion","irv-motion-idle");return;}current.classList.add("irv-authored-motion");current.classList.remove("irv-motion-idle");const reduced=window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;if(victory){const run=current.querySelector("canvas.irv-hero.run"),idle=current.querySelector("canvas.irv-hero.idle");if(reduced){if(run)run.style.opacity="0";if(idle)idle.style.opacity="1";current.classList.add("irv-motion-idle");qa.phase="idle";animate(idle,entry.idle,{loop:true,kind:"idle",ticket});return;}const stopRun=animate(run,entry.run,{loop:true,kind:"run",ticket});later(()=>{if(ticket!==epoch||!current.isConnected)return;stopRun();current.classList.add("irv-motion-idle");qa.phase="idle";animate(idle,entry.idle,{loop:true,kind:"idle",ticket});},1370);}else{const fall=current.querySelector("canvas.irv-hero.fall");qa.fallCycles=1;if(reduced){const last=Number.isFinite(entry.fall.frameEnd)?entry.fall.frameEnd:entry.fall.frames-1;drawFrame(fall,entry.fall,last);qa.lastFallFrame=last;qa.phase="fall-hold";return;}animate(fall,entry.fall,{loop:false,kind:"fall",ticket,onDone:()=>{qa.phase="fall-hold";}});}}',
  'window.__HV_RESULT_MOTION_CAN_DRAW=m=>Boolean(MANIFEST[keyFor(m)]);',
  'const originalShow=window.__showIntegratedResultV6,originalHide=window.__hideIntegratedResultV6;if(typeof originalShow!=="function"||typeof originalHide!=="function")return;',
  'window.__showIntegratedResultV6=(victory,snap)=>{const value=originalShow(victory,snap);installMotion(Boolean(victory),snap);return value;};',
  'window.__hideIntegratedResultV6=()=>{cancelAll();const current=root();current?.classList.remove("irv-authored-motion","irv-motion-idle");return originalHide();};',
  'window.__HV_RESULT_MOTION_QA=Object.freeze({marker:MARKER,state:()=>({...qa,source:qa.source?{...qa.source}:null}),manifest:()=>JSON.parse(JSON.stringify(MANIFEST)),cancel:cancelAll});',
  '})();',
  '</script>'
];
const runtime = runtimeLines.join('\n');
if (!battle.includes('</body>')) throw new Error('Result motion: body boundary missing');
battle = battle.replace('</body>', runtime + '\n</body>');
writeFileSync(battlePath, battle);
console.log('Result character motion v1 applied: authored Victory entry -> Idle and one-shot Defeat Fall -> final-frame hold');
