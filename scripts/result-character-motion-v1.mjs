import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { LUC_ANH_IDLE_BATTLE } from '../src/domain/character/luc-anh-idle.mjs';
import { loadAuthoredHeroes } from './authored-hero-install.mjs';

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

function newHeroMotion(slug) {
  const meta=JSON.parse(readFileSync(new URL('../assets/characters/'+slug+'/runtime-meta.json',import.meta.url),'utf8'));
  const make=key=>{
    const iv=meta.idleVisual,page=Number(key.slice('idle-authored-'.length));
    const c=meta.clips[key]||(key.startsWith('idle-authored-')&&iv?{file:key+'.webp',frames:Math.min(iv.pageFrames,iv.frames-page*iv.pageFrames),cols:iv.cols,cellW:iv.cellW,cellH:iv.cellH,durationMs:iv.frameDurationsMs.slice(page*iv.pageFrames,(page+1)*iv.pageFrames).reduce((a,b)=>a+b,0),frameDurationsMs:iv.frameDurationsMs.slice(page*iv.pageFrames,(page+1)*iv.pageFrames)}:null);
    return clip('assets/characters/'+slug+'/'+c.file+(meta.assetRevision?'?v='+encodeURIComponent(meta.assetRevision):''),c.frames,c.cols,c.cellW,c.cellH,c.durationMs/c.frames,{durations:c.frameDurationsMs});
  };
  // Single-atlas authored packs (Co Nuong) have clips.idle, not idle pages.
  if(meta.clips.idle&&!meta.idleVisual&&!meta.clips['idle-0']){
    const id=slug.replaceAll('-','_');
    return {aliases:[id,slug,'hero_splus_'+id],run:{...make('run'),playbackRate:1},idle:make('idle'),fall:make('fall-die')};
  }
  // Packs with a repaginated authored idle have no 16-frame legacy pages; their
  // pages and pageFrames come from the idleVisual contract instead. Packs that
  // still ship idle-N keep the original 16-frame paging.
  const pagedIdle=meta.clips['idle-0']?null:meta.idleVisual;
  const pageFrames=pagedIdle?pagedIdle.pageFrames:16;
  const pages=Array.from({length:Math.ceil(meta.idle.frames/pageFrames)},(_,i)=>make(pagedIdle?'idle-authored-'+i:'idle-'+i));
  const id=slug.replaceAll('-','_');
  return {aliases:[id,slug,'hero_splus_'+id],
    run:make('run'),idle:{...pages[0],pages,pageFrames,frames:meta.idle.frames,durations:pagedIdle?.frameDurationsMs||meta.idle.frameDurationsMs},
    fall:make('fall-die')};
}

function beAnMotion(){
 const m=JSON.parse(readFileSync(new URL('../assets/characters/be-an/runtime-meta.json',import.meta.url),'utf8'));
 const make=key=>{const c=m.clips[key];return {...c,ms:1000/24,pages:c.pages.map(p=>({...p,src:'assets/characters/be-an/'+p.file,ms:1000/24}))};};
 return {aliases:['be_an','be-an','hero_splus_be_an'],run:{...make('run'),playbackRate:1},idle:make('idle'),fall:make('fall-die')};
}
// Every hero described by assets/characters/<slug>/hero.json gets its Victory/Defeat motion here
// automatically (Victory showed a generic portrait for Khaos, 19/10/2026). Idle uses the
// full-resolution detail atlas when shipped; run/fall use the battle atlases.
function authoredResultMotions(){
 const out={};
 for(const {hero,meta,base} of loadAuthoredHeroes(process.cwd())){
  const make=key=>{
   const c=meta.clips[key];if(!c)return null;
   const ms=c.durationMs/c.frames;
   const px=typeof c.pivot==='object'?c.pivot.x:c.pivot,py=c.foot??(typeof c.pivot==='object'?c.pivot.y:c.cellH);
   if(!c.pages||c.pages.length<=1){
    const file=c.pages?.[0]?.file||c.file;
    return {src:base+file,frames:c.frames,cols:c.cols,cellW:c.cellW,cellH:c.cellH,ms,pivot:px,foot:py};
   }
   const pages=c.pages.map(p=>({cellW:c.cellW,cellH:c.cellH,cols:p.cols||c.cols,frames:p.frames,src:base+p.file,ms}));
   return {...c,src:pages[0].src,ms,pages,pageFrames:c.pageFrames||c.frames};
  };
  const d=meta.detail;
  const idle=d?{src:base+d.file,frames:d.frames,cols:d.cols,cellW:d.cellW,cellH:d.cellH,durationMs:d.durationMs,ms:d.durationMs/d.frames,
    pivot:(typeof meta.clips.idle.pivot==='object'?meta.clips.idle.pivot.x:meta.clips.idle.pivot)*d.cellW/meta.clips.idle.cellW,foot:(meta.clips.idle.foot??meta.clips.idle.pivot?.y)*d.cellH/meta.clips.idle.cellH}:make('idle');
  const runVisualScale=Number(hero.battle?.victory?.runVisualScale)||1;
  out[hero.id]={aliases:[hero.id,hero.slug,hero.sourceId],run:{...make('run'),playbackRate:1,visualScale:runVisualScale},idle,fall:make('fall-die')};
 }
 return out;
}
const manifest = {
  ...authoredResultMotions(),
  be_an:beAnMotion(),
  co_nuong:newHeroMotion('co-nuong'),
  hong_thuong:newHeroMotion('hong-thuong'),
  ky_van:newHeroMotion('ky-van'),
  tieu_phong:newHeroMotion('tieu-phong'),
  tich_dao:newHeroMotion('tich-dao'),
  thay_mo: {
    aliases: ['thay_mo', 'thay-mo', 'hero_thay_mo'],
    run: clip('assets/owner-refresh-20261018/thay-run.webp',18,6,480,440,4000/18,{playbackRate:1}),
    idle: clip('assets/characters/thay-mo/idle-v3193-atlas.png', 96, 12, 235, 264, 62.5,
      { strideW: 241, strideH: 270, pad: 3, durations: Array.from({length:96},(_,i)=>i%4===1?70:60) }),
    fall: clip('assets/owner-refresh-20261018/thay-fall-die.webp',18,6,480,440,4000/18)
  },
  luc_anh: {
    aliases: ['luc_anh', 'luc-anh', 'hero_splus_luc_anh'],
    run: clip('assets/characters/luc-anh/run-atlas.webp', 61, 8, 240, 240, 28),
    idle: clip(LUC_ANH_IDLE_BATTLE.src, 96, 8, 240, 240, 42),
    fall: clip('assets/characters/luc-anh/fall-atlas.webp', 64, 8, 240, 240, 34)
  },
  linh_dong: {
    aliases: ['linh_dong', 'linh-dong', 'hero_splus_linh_dong'],
    run: clip('assets/characters/linh-dong/run-atlas.webp', 96, 8, 480, 440, 42),
    idle: clip('assets/characters/linh-dong/idle-atlas.webp', 96, 8, 480, 440, 42),
    fall: clip('assets/characters/linh-dong/fall-atlas.webp', 96, 8, 480, 440, 42)
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
  '#integratedResultV6.irv-authored-motion .irv-hero{image-rendering:auto;will-change:transform,opacity;transition:none}',
  '#integratedResultV6.irv-authored-motion.irv-victory .irv-hero.run{opacity:1;transform:translateX(var(--irv-run-start,-118%));animation:none}',
  '#integratedResultV6.irv-authored-motion.irv-victory.irv-motion-run-active .irv-hero.run{animation:hvResultRunIn 1.6s .12s linear forwards}',
  '#integratedResultV6.irv-authored-motion.irv-victory.irv-motion-idle .irv-hero.run{opacity:0!important;visibility:hidden!important}',
  '#integratedResultV6.irv-authored-motion.irv-victory .irv-hero.idle{opacity:0!important;animation:none!important;transform:translateX(0)!important}',
  '#integratedResultV6.irv-authored-motion.irv-victory.irv-motion-idle .irv-hero.idle{opacity:1!important}',
  '#integratedResultV6.irv-authored-motion.irv-defeat .irv-hero.fall:not(.irv-generic-fall){animation:none!important;transform:none!important;opacity:1!important;transform-origin:50% 86%}',
  '@media (min-width:700px){#integratedResultV6.irv-authored-motion.irv-defeat[data-irv-motion-hero="linh_dong"] .irv-hero.fall:not(.irv-generic-fall),#integratedResultV6.irv-authored-motion.irv-defeat[data-irv-motion-hero="bach_dien"] .irv-hero.fall:not(.irv-generic-fall){transform:translateY(-14%) scale(.90)!important}}',
  '#integratedResultV6.irv-authored-motion.irv-defeat .irv-hero.fall.irv-generic-fall{animation:hvResultGenericFall .76s cubic-bezier(.22,.72,.24,1) forwards!important;transform-origin:50% 84%}',
  '@keyframes hvResultRunIn{0%{transform:translateX(var(--irv-run-start,-118%)) translateY(1.5%)}100%{transform:translateX(0) translateY(0)}}',
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
const compactLucPainter = oldLucAnhPainter.replace(/\n /g, '').replace(/\n/g, '');
if (battle.includes(compactLucPainter)) battle = battle.replace(compactLucPainter, guardedPainter);
else if (battle.includes(oldLucAnhPainter)) battle = battle.replace(oldLucAnhPainter, guardedPainter);
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
  'const keyFor=m=>{const raw=normalize(m?.sourceId||m?.sourceHeroId||m?.id||"");const name=String(m?.name||"").trim();for(const [key,entry] of Object.entries(MANIFEST)){if(entry.aliases.some(alias=>normalize(alias)===raw))return key;}if(name==="Thầy Mo")return "thay_mo";if(name==="Ông Phở")return "ong_pho";if(name==="Lục Ảnh")return "luc_anh";if(name==="Linh Đồng")return "linh_dong";if(name==="Bạch Diện")return "bach_dien";if(name==="Đình Lôi")return "dinh_loi";return "";};',
  'const genericFor=m=>{const raw=normalize(m?.sourceId||m?.sourceHeroId||m?.id||""),type=String(m?.archetype||""),sources={guardian:"assets/battle-runtime/embedded-05.webp",ranger:"assets/battle-runtime/embedded-06.webp",healer:"assets/battle-runtime/embedded-07.webp",striker:"assets/battle-runtime/embedded-08.webp",duelist:"assets/battle-runtime/embedded-09.webp",mystic:"assets/battle-runtime/embedded-10.webp"};const row=GENERIC_ARCHETYPES[raw]||(Object.hasOwn(sources,type)?[type,sources[type]]:null);return row?{key:"generic_"+row[0],archetype:row[0],src:row[1]}:null;};',
  'const mvp=snap=>(snap?.player||[]).slice().sort((a,b)=>(Number(b.damage)||0)-(Number(a.damage)||0)||(Number(b.kills)||0)-(Number(a.kills)||0))[0]||null;',
  'const imageCache=new Map();let epoch=0,animationStops=new Set(),timers=new Set();',
  'let qa={epoch:0,hero:"",supported:false,generic:false,phase:"idle",runFrames:0,idleFrames:0,fallFrames:0,fallCycles:0,lastRunFrame:null,lastIdleFrame:null,lastFallFrame:null,expectedFallLast:null,source:null};',
  'function cancelAll(){epoch++;for(const stop of animationStops){try{stop();}catch(_e){}}for(const id of timers)clearTimeout(id);animationStops.clear();timers.clear();for(const record of imageCache.values()){record.waiters.clear();record.image.onload=null;record.image.onerror=null;record.image.removeAttribute?.("src");}imageCache.clear();}',
  'function later(fn,ms){const id=setTimeout(()=>{timers.delete(id);fn();},ms);timers.add(id);return id;}',
  'function imageFor(src,onReady){let record=imageCache.get(src);if(!record){const image=new Image();image.decoding="async";record={image,ready:false,error:false,waiters:new Set()};imageCache.set(src,record);image.onload=()=>{record.ready=true;const jobs=[...record.waiters];record.waiters.clear();jobs.forEach(job=>{try{job();}catch(_e){}});};image.onerror=()=>{record.error=true;record.waiters.clear();};image.src=src;if(image.complete&&image.naturalWidth>1)record.ready=true;}if(record.ready&&onReady)queueMicrotask(onReady);else if(!record.error&&onReady)record.waiters.add(onReady);return record;}',
  'function drawFrame(canvas,clip,frame){if(clip.pages){const pageIndex=Math.min(clip.pages.length-1,Math.floor(frame/clip.pageFrames)),page=clip.pages[pageIndex];const pageWithDims={cellW:clip.cellW,cellH:clip.cellH,cols:clip.cols,strideW:clip.strideW,strideH:clip.strideH,pad:clip.pad,...page};const painted=drawFrame(canvas,pageWithDims,frame%clip.pageFrames);imageFor(clip.pages[(pageIndex+1)%clip.pages.length].src);return painted;}const record=imageFor(clip.src);const image=record?.image;if(!canvas||!image||!record.ready||image.naturalWidth<2)return false;const ctx=canvas.getContext("2d");if(!ctx)return false;const first=Math.max(0,Number(clip.frameStart)||0),last=Math.min(clip.frames-1,Number.isFinite(clip.frameEnd)?clip.frameEnd:clip.frames-1),safe=Math.max(first,Math.min(last,frame));const sx=(safe%clip.cols)*(clip.strideW||clip.cellW)+(clip.pad||0),sy=Math.floor(safe/clip.cols)*(clip.strideH||clip.cellH)+(clip.pad||0);ctx.clearRect(0,0,canvas.width,canvas.height);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";const visualScale=Number(clip.visualScale)||1;const scale=Math.min(canvas.width/clip.cellW,canvas.height/clip.cellH)*visualScale,w=clip.cellW*scale,h=clip.cellH*scale;ctx.drawImage(image,sx,sy,clip.cellW,clip.cellH,(canvas.width-w)/2,canvas.height-h,w,h);return true;}',
  'function drawGenericPose(canvas,generic,column){const record=imageFor(generic.src);const image=record?.image;if(!canvas||!image||!record.ready||image.naturalWidth<4)return false;const ctx=canvas.getContext("2d");if(!ctx)return false;const cellW=image.naturalWidth/4,cellH=image.naturalHeight/2,sx=Math.max(0,Math.min(3,column))*cellW,sy=0;ctx.clearRect(0,0,canvas.width,canvas.height);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";const scale=Math.min((canvas.width*.92)/cellW,(canvas.height*.94)/cellH),w=cellW*scale,h=cellH*scale;ctx.drawImage(image,sx,sy,cellW,cellH,(canvas.width-w)/2,canvas.height-h,w,h);return true;}',
  'function animateGeneric(canvas,generic,column,options){if(!canvas||!generic)return ()=>{};const kind=options.kind,ticket=options.ticket;let active=true,raf=0;const stop=()=>{if(!active)return;active=false;if(raf)cancelAnimationFrame(raf);animationStops.delete(stop);};animationStops.add(stop);const start=()=>{if(!active||ticket!==epoch||!canvas.isConnected){stop();return;}const tick=()=>{if(!active||ticket!==epoch||!canvas.isConnected){stop();return;}const painted=drawGenericPose(canvas,generic,column);if(painted){if(kind==="run"){qa.runFrames++;qa.lastRunFrame=column;}if(kind==="idle"){qa.idleFrames++;qa.lastIdleFrame=column;}if(kind==="fall"){qa.fallFrames++;qa.lastFallFrame=qa.phase==="fall-hold"?1:0;}}raf=requestAnimationFrame(tick);};raf=requestAnimationFrame(tick);};imageFor(generic.src,start);return stop;}',
  'function animate(canvas,clip,options){if(!canvas||!clip)return ()=>{};const loop=options.loop,kind=options.kind,ticket=options.ticket,onDone=options.onDone,first=Math.max(0,Number(clip.frameStart)||0),last=Math.min(clip.frames-1,Number.isFinite(clip.frameEnd)?clip.frameEnd:clip.frames-1),count=Math.max(1,last-first+1);let active=true,raf=0,begin=0;const stop=()=>{if(!active)return;active=false;if(raf)cancelAnimationFrame(raf);animationStops.delete(stop);};animationStops.add(stop);const start=()=>{if(!active||ticket!==epoch||!canvas.isConnected){stop();return;}begin=performance.now()-(options.offsetMs||0);const tick=now=>{if(!active||ticket!==epoch||!canvas.isConnected){stop();return;}let elapsed=Math.max(0,now-begin)*(kind==="run"?(clip.playbackRate??0.30):1),raw=Math.floor(elapsed/Math.max(1,clip.ms));if(clip.durations?.length){const total=clip.durations.reduce((a,b)=>a+b,0);if(loop)elapsed%=total;raw=0;while(raw<clip.frames-1&&elapsed>=clip.durations[raw]){elapsed-=clip.durations[raw];raw++;}}const frame=loop?first+(raw%count):Math.min(last,first+raw),painted=drawFrame(canvas,clip,frame);if(painted){if(kind==="run"){qa.runFrames++;qa.lastRunFrame=frame;}if(kind==="idle"){qa.idleFrames++;qa.lastIdleFrame=frame;}if(kind==="fall"){qa.fallFrames++;qa.lastFallFrame=frame;}}if(!loop&&frame>=last){if(kind==="fall")qa.phase="fall-hold";stop();if(onDone)onDone(frame);return;}raf=requestAnimationFrame(tick);};raf=requestAnimationFrame(tick);};imageFor(clip.src,start);return stop;}',
  'function installMotion(victory,snap){cancelAll();const current=root(),m=mvp(snap),key=keyFor(m),entry=MANIFEST[key],generic=entry?null:genericFor(m),ticket=epoch,supported=Boolean(entry||generic),explicitLast=entry?(Number.isFinite(entry.fall.frameEnd)?entry.fall.frameEnd:entry.fall.frames-1):null;qa={epoch:ticket,hero:key||generic?.key||normalize(m?.sourceId||m?.id||m?.name),supported,entryMotion:entry?.entryMotion||(generic?"generic-pose":"authored-run"),generic:Boolean(generic),phase:victory?"run":"fall",runFrames:0,idleFrames:0,fallFrames:0,fallCycles:0,lastRunFrame:null,lastIdleFrame:null,lastFallFrame:null,expectedFallLast:entry?explicitLast:(generic?1:null),source:entry?{run:entry.run.src,idle:entry.idle.src,fall:entry.fall.src}:(generic?{run:generic.src,idle:generic.src,fall:generic.src}:null)};if(!current||!supported){if(current){current.classList.remove("irv-authored-motion","irv-motion-idle","irv-motion-run-active");delete current.dataset.irvMotionHero;}return;}current.classList.add("irv-authored-motion");current.classList.remove("irv-motion-idle","irv-motion-run-active");current.dataset.irvMotionHero=key||generic?.key||"";const reduced=window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;if(victory){const run=current.querySelector("canvas.irv-hero.run"),idle=current.querySelector("canvas.irv-hero.idle");if(reduced){if(run)run.style.opacity="0";if(idle)idle.style.opacity="1";current.classList.add("irv-motion-idle");qa.phase="idle";if(entry)animate(idle,entry.idle,{loop:true,kind:"idle",ticket});else animateGeneric(idle,generic,0,{kind:"idle",ticket});return;}let runStarted=false;const MIN_RUN_FRAMES=8;const stopRun=entry?animate(run,entry.run,{loop:true,kind:"run",ticket}):animateGeneric(run,generic,1,{kind:"run",ticket});const finishRun=()=>{if(ticket!==epoch||!current.isConnected||qa.phase!=="run")return;const continuous=entry?.entryMotion==="idle-translation",idleFrame=continuous?(qa.lastRunFrame||0):0;const idleReady=entry?drawFrame(idle,entry.idle,idleFrame):drawGenericPose(idle,generic,0);if(!idleReady){if(imageFor(entry?entry.idle.src:generic.src).error){qa.phase="run-hold";return;}later(finishRun,80);return;}stopRun();current.classList.add("irv-motion-idle");qa.phase="idle";const offsetMs=continuous?(entry.idle.durations?entry.idle.durations.slice(0,idleFrame).reduce((a,b)=>a+b,0):idleFrame*entry.idle.ms):0;if(entry)animate(idle,entry.idle,{loop:true,kind:"idle",ticket,offsetMs});else animateGeneric(idle,generic,0,{kind:"idle",ticket});};const finishRunWhenVisible=()=>{if(ticket!==epoch||!current.isConnected||qa.phase!=="run")return;if(qa.runFrames>=MIN_RUN_FRAMES){finishRun();return;}later(finishRunWhenVisible,80);};const beginRun=()=>{if(ticket!==epoch||!current.isConnected||qa.phase!=="run"||runStarted)return;runStarted=true;const view=current.querySelector(".irv-viewport");if(run&&view)run.style.setProperty("--irv-run-start",(-((view.clientWidth+run.clientWidth)/2)-8)+"px");current.classList.add("irv-motion-run-active");later(finishRunWhenVisible,1770);later(finishRun,5000);};const runSource=entry?entry.run.src:generic.src;imageFor(entry?entry.idle.src:generic.src);imageFor(runSource,beginRun);later(()=>{if(!runStarted)finishRun();},10000);}else{const fall=current.querySelector("canvas.irv-hero.fall");qa.fallCycles=1;if(generic||entry?.fall.syntheticFall)fall?.classList.add("irv-generic-fall");if(reduced){imageFor(entry?entry.fall.src:generic.src,()=>{if(ticket!==epoch)return;if(entry)drawFrame(fall,entry.fall,explicitLast);else drawGenericPose(fall,generic,0);});qa.lastFallFrame=entry?explicitLast:1;qa.fallFrames=1;qa.phase="fall-hold";return;}if(entry){animate(fall,entry.fall,{loop:false,kind:"fall",ticket,onDone:()=>{qa.phase="fall-hold";}});}else{const stopFall=animateGeneric(fall,generic,0,{kind:"fall",ticket});later(()=>{if(ticket!==epoch||!current.isConnected)return;qa.phase="fall-hold";qa.lastFallFrame=1;stopFall();drawGenericPose(fall,generic,0);},780);}}}',
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






