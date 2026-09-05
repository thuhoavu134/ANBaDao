import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { LUC_ANH_IDLE_1080 as IDLE } from '../src/domain/character/luc-anh-idle.mjs';

const root = process.cwd();
const out = join(root, 'dist');
const idle = Object.freeze({ src: IDLE.src, file: IDLE.src.split('/').pop(), frames: IDLE.frames,
  cols: IDLE.cols, rows: IDLE.rows, w: IDLE.cellW, h: IDLE.cellH, ms: IDLE.ms });

if (!existsSync(join(root, idle.src))) {
  throw new Error(`Lục Ảnh idle asset is missing: ${idle.src}`);
}

function replaceOnce(source, expression, replacement, label) {
  const matches = source.match(expression) || [];
  if (matches.length !== 1) {
    throw new Error(`M0/P0 expected one ${label}, found ${matches.length}`);
  }
  return source.replace(expression, replacement);
}

function removeGeneratedDeclaration(source, expression, label) {
  const matches = source.match(expression) || [];
  if (matches.length > 1) throw new Error(`M0/P0 expected at most one ${label}, found ${matches.length}`);
  return source.replace(expression, '');
}

function patchBattleIdle(source) {
  source = replaceOnce(
    source,
    /idle:\{file:"[^"\n]+\.webp",frames:\d+,w:\d+,h:\d+,ms:\d+,loop:true(?:,trimmed:true)?\}/g,
    `idle:{file:"${idle.file}",frames:${idle.frames},w:${idle.w},h:${idle.h},ms:${idle.ms},loop:true}`,
    'battle idle metadata'
  );
  source = removeGeneratedDeclaration(source, /^\s*const LUC_ANH_IDLE_TRIMMED_FRAMES=.*;\n/m, 'battle idle trim table');
  source = removeGeneratedDeclaration(source, /^\s*const LUC_ANH_IDLE_FALLBACK_IMAGE=.*;\n/m, 'battle idle fallback image');

  const start = source.indexOf('function drawLucAnhAtlas(');
  const end = source.indexOf('function drawLucAnhHero', start);
  if (start < 0 || end < 0) throw new Error('M0/P0 missing battle Lục Ảnh atlas renderer boundary');
  const renderer = `function drawLucAnhAtlas(context,key,frame,x,y,width,height,options={}){
    const m=LUC_ANH_META[key],image=LUC_ANH_IMAGES[key];
    if(!m||!image?.complete||image.naturalWidth<2)return false;
    const safeFrame=Math.max(0,Math.min(m.frames-1,Math.floor(Number(frame)||0)));
    const sx=(safeFrame%LUC_ANH_COLS)*m.w,sy=Math.floor(safeFrame/LUC_ANH_COLS)*m.h;
    const baseline=Number.isFinite(Number(options.baseline))?Number(options.baseline):46;
    const drawW=Number(width)||m.w,drawH=Number(height)||m.h;
    context.save();context.imageSmoothingEnabled=true;context.imageSmoothingQuality="high";context.translate(Math.round(x),Math.round(y));
    if(options.flip)context.scale(-1,1);context.globalAlpha=options.alpha??1;if(options.screen)context.globalCompositeOperation="screen";
    context.drawImage(image,sx,sy,m.w,m.h,Math.round(-drawW*.5),Math.round(-drawH+baseline),Math.round(drawW),Math.round(drawH));
    context.restore();return true;}
`;
  return source.slice(0, start) + renderer + source.slice(end);
}

function patchIndexIdle(source) {
  source = replaceOnce(
    source,
    /idle:\{src:'assets\/characters\/luc-anh\/[^'\n]+\.webp',frames:\d+,cols:\d+,w:\d+,h:\d+,ms:\d+,loop:true(?:,trimmed:true)?\}/g,
    `idle:{src:'${idle.src}',frames:${idle.frames},cols:${idle.cols},w:${idle.w},h:${idle.h},ms:${idle.ms},loop:true}`,
    'hero-detail idle metadata'
  );
  source = removeGeneratedDeclaration(source, /^\s*const LUC_ANH_IDLE_TRIMMED_FRAMES=.*;\n/m, 'hero-detail idle trim table');
  source = removeGeneratedDeclaration(source, /^\s*const LUC_ANH_IDLE_FALLBACK_IMAGE=.*;\n/m, 'hero-detail idle fallback image');
  source = source.replaceAll('assets/characters/luc-anh/idle-trimmed-atlas-v2.webp', idle.src);

  const atlasStart = source.indexOf('function drawLucAtlasFrame(');
  const atlasEnd = source.indexOf('function drawLucAnh(c,', atlasStart);
  if (atlasStart < 0 || atlasEnd < 0) throw new Error('M0/P0 missing hero-detail Lục Ảnh atlas renderer boundary');
  const renderer = `function drawLucAtlasFrame(kind,frame,dx,dy,dw,dh,mirror=false,alpha=1){
  const a=LUC_ANH_ANIMS[kind],image=LUC_ANH_IMAGES[kind];if(!a||!image?.complete||image.naturalWidth<2)return false;
  const safeFrame=Math.max(0,Math.min(a.frames-1,Math.floor(Number(frame)||0))),sx=(safeFrame%a.cols)*a.w,sy=Math.floor(safeFrame/a.cols)*a.h;
  ctx.save();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.globalAlpha=alpha;
  if(mirror){ctx.translate(dx+dw,0);ctx.scale(-1,1);ctx.drawImage(image,sx,sy,a.w,a.h,0,Math.round(dy),Math.round(dw),Math.round(dh));}
  else ctx.drawImage(image,sx,sy,a.w,a.h,Math.round(dx),Math.round(dy),Math.round(dw),Math.round(dh));
  ctx.restore();return true;}
`;
  source = source.slice(0, atlasStart) + renderer + source.slice(atlasEnd);

  const detailStart = source.indexOf('function startLucAnhDetailIdle()');
  const detailEnd = source.indexOf('function renderHeroDetail(', detailStart);
  if (detailStart < 0 || detailEnd < 0) throw new Error('M0/P0 missing hero-detail idle loop boundary');
  const detail = `function startLucAnhDetailIdle(){
  cancelAnimationFrame(_lucDetailRaf);const cv=document.getElementById('lucAnhDetailIdle');if(!cv)return;const css=260,dpr=Math.min(3,window.devicePixelRatio||1);cv.style.width=css+'px';cv.style.height=css+'px';cv.style.filter='none';cv.width=Math.round(css*dpr);cv.height=Math.round(css*dpr);const c=cv.getContext('2d'),a=LUC_ANH_ANIMS.idle,preferred=LUC_ANH_IMAGES.idle,start=performance.now();
  function tick(){if(!cv.isConnected)return;c.setTransform(dpr,0,0,dpr,0,0);c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.clearRect(0,0,css,css);if(preferred?.complete&&preferred.naturalWidth>1){const f=lucFrame(a,start,true),sx=(f%a.cols)*a.w,sy=Math.floor(f/a.cols)*a.h;c.drawImage(preferred,sx,sy,a.w,a.h,0,0,css,css);}_lucDetailRaf=requestAnimationFrame(tick);}
  tick();
}

`;
  return source.slice(0, detailStart) + detail + source.slice(detailEnd);
}

function patchResultOverlay(source) {
  const resultStart = source.indexOf('<script id="v3246-result-v6-v4-js">');
  const resultEnd = source.indexOf('</script>', resultStart);
  if (resultStart < 0 || resultEnd < 0) throw new Error('M0/P0 result overlay script boundary not found');
  const resultScript = source.slice(resultStart, resultEnd);
  const idleStart = resultScript.indexOf(' function drawLucAnhIdle(canvas){');
  const idleEnd = resultScript.indexOf(' function paintHero(canvas,m){', idleStart);
  if (idleStart < 0 || idleEnd < 0) throw new Error('M0/P0 result Lục Ảnh idle boundary not found');
  const resultIdle = ` function drawLucAnhIdle(canvas){
  if(!canvas)return;const context=canvas.getContext('2d');if(!context)return;const image=new Image();image.decoding='async';image.src='${idle.src}';const start=performance.now(),frames=${idle.frames},cols=${idle.cols},cell=${idle.w},ms=${idle.ms};
  const tick=()=>{if(!canvas.isConnected)return;context.clearRect(0,0,canvas.width,canvas.height);if(image.complete&&image.naturalWidth>1){const frame=Math.floor((performance.now()-start)/ms)%frames,sx=(frame%cols)*cell,sy=Math.floor(frame/cols)*cell;const size=220;context.imageSmoothingEnabled=true;context.imageSmoothingQuality='high';context.drawImage(image,sx,sy,cell,cell,(canvas.width-size)/2,canvas.height-size-4,size,size);}requestAnimationFrame(tick);};
  tick();
 }
`;
  let patched = resultScript.slice(0, idleStart) + resultIdle + resultScript.slice(idleEnd);
  const showStart = patched.indexOf(' function show(victory,snap){');
  const showEnd = patched.indexOf(' window.__showIntegratedResultV6=show;', showStart);
  if (showStart < 0 || showEnd < 0) throw new Error('M0/P0 result show function boundary not found');
  const show = ` function show(victory,snap){
  const m=mvpFromSnapshot(snap),name=m?.name||'Chiến tướng',damage=Math.round(Number(m?.damage)||0),kills=Math.round(Number(m?.kills)||0);root.className='show '+(victory?'irv-victory':'irv-defeat');
  const base=victory?'assets/result-victory-v6/':'assets/result-defeat-v4/';root.innerHTML=\`<main class="irv-viewport"><img class="irv-stage" src="\${base}victory-stage-original-quality-smooth-v5.apng"><img class="irv-card" src="\${base}victory-info-card-portrait-v6.png"><img class="irv-title" src="\${base}\${victory?'victory-text-clean-smooth-v5.apng':'defeat-clean-loop.apng'}"><div class="irv-hero-wrap"><canvas class="irv-hero \${victory?'run':'fall'}" width="480" height="270"></canvas>\${victory?'<canvas class="irv-hero idle" width="480" height="270"></canvas>':''}</div><section class="irv-result"><small>Xuất sắc nhất phe ta</small><h1>\${name}</h1><p>⚔ \${damage} sát thương · ☠ \${kills} kết liễu</p></section>\${victory?\`<section class="irv-rewards"><div class="irv-grid"><div class="irv-tip"><img src="\${base}tinh-thong.png">Tinh thông</div><div class="irv-tip"><img src="\${base}sach-exp.png">EXP tướng</div><div class="irv-tip"><img src="\${base}ruong-trang-bi-thuong.png">Trang bị</div></div></section>\`:\`<section class="irv-tips"><div class="irv-grid"><button class="irv-tip" data-nav="daily"><img src="\${base}idle-reward.png">Thưởng treo máy</button><button class="irv-tip" data-nav="heroes"><img src="\${base}upgrade-hero.png">Tăng cấp tướng</button><button class="irv-tip" data-nav="summon"><img src="\${base}summon-hero.png">Chiêu mộ danh tướng</button><button class="irv-tip" data-nav="forge"><img src="\${base}equip-gear.png">Mang trang bị</button></div></section>\`}<section class="irv-actions"><button class="irv-btn" data-result-action="confirm">\${victory?'Xác nhận':'Xác định'}</button><button class="irv-btn" data-result-action="\${victory?'next':'back'}">\${victory?'Ải sau':'Quay lại'}</button></section></main>\`;\n+  if(victory&&String(m?.sourceId||m?.id)==='luc_anh'){const runC=root.querySelector('canvas.irv-hero.run'),idleC=root.querySelector('canvas.irv-hero.idle');if(runC)drawLucAnhIdle(runC);if(idleC)drawLucAnhIdle(idleC);}else root.querySelectorAll('canvas.irv-hero').forEach(c=>paintHero(c,m));root.querySelectorAll('[data-nav]').forEach(b=>b.onclick=()=>nav(b.dataset.nav));
 }
`;
  const cleanShow = show.replaceAll('\n+', '\n');
  patched = patched.slice(0, showStart) + cleanShow + patched.slice(showEnd);
  source = source.slice(0, resultStart) + patched + source.slice(resultEnd);

  // The earlier QA bridges registered document-level capture listeners and
  // therefore won the event race before the visible button handler. Remove
  // both generated bridges; the single owner below handles pointerup/click.
  source = source.replace(/\s*<script id="qa-result-actions-v2">[\s\S]*?<\/script>\s*/g, '\n');
  source = source.replace(/\s*<script id="qa-result-actions-v4">[\s\S]*?<\/script>\s*/g, '\n');

  const owner = `<script id="m0-p0-result-action-owner-v1">
(()=>{
  if(window.__HV_RESULT_ACTION_OWNER_V1)return;window.__HV_RESULT_ACTION_OWNER_V1=true;let last=0;
  const act=(ev)=>{const button=ev.target?.closest?.('#integratedResultV6 [data-result-action]');if(!button)return;const now=Date.now();if(now-last<350)return;last=now;ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation?.();button.classList.add('is-pressed');setTimeout(()=>button.classList.remove('is-pressed'),140);
    const action=button.dataset.resultAction,api=window.__HV_BATTLE_RESULT_API,embedded=!!api?.embedded?.();
    if(action==='confirm'||action==='next'){try{if(embedded){api?.publish?.();return;}api?.continue?.();}catch(error){console.error('Không thể xử lý kết quả trận Hồn Việt.',error);}return;}
    if(action==='back'){try{if(embedded)parent.postMessage({source:'hon-viet-battle',type:'battle-nav',payload:{sessionId:api?.sessionId?.()||'',target:'campaign'}},'*');else if(typeof nav==='function')nav('campaign');}catch(error){console.error('Không thể quay lại Chinh Chiến.',error);}}
  };
  document.addEventListener('pointerup',act,true);document.addEventListener('click',act,true);document.addEventListener('touchend',act,{capture:true,passive:false});
})();
</script>
`;
  const bodyEnd = source.lastIndexOf('</body>');
  if (bodyEnd < 0) throw new Error('M0/P0 battle body end not found');
  return source.slice(0, bodyEnd) + owner + source.slice(bodyEnd);
}

function patchBackgroundOwnership(source) {
  // Keep one canvas owner for the battlefield. The DOM is transparent so a
  // previous stage cannot remain visible through a second background layer.
  const backgroundStart = source.indexOf('function drawBackground(context,time) {');
  const backgroundEnd = source.indexOf('\n  function drawWeapon', backgroundStart);
  if (backgroundStart < 0 || backgroundEnd < 0) throw new Error('M0/P0 background renderer boundary not found');
  const renderer = `function drawBackground(context,time) {
    const source=VIETNAM_HORIZON;
    if(source.complete&&source.naturalWidth>1){
      const sw=source.naturalWidth,sh=source.naturalHeight;
      // The stage pack is portrait (941x1672). On a portrait phone, fit the
      // complete source height into the fixed world height so the landmark is
      // not cropped into a floor-only slice. Desktop keeps a width-fit crop.
      const portrait=view.height>view.width;
      const targetH=portrait?WORLD.height:WORLD.width*sh/sw;
      const targetW=portrait?WORLD.height*sw/sh:WORLD.width;
      const dx=(WORLD.width-targetW)/2,dy=(WORLD.height-targetH)/2;
      context.save();
      context.globalCompositeOperation='source-over';
      context.globalAlpha=1;
      context.filter='none';
      context.imageSmoothingEnabled=true;
      context.imageSmoothingQuality='high';
      context.drawImage(source,0,0,sw,sh,dx,dy,targetW,targetH);
      context.restore();
      const shade=context.createLinearGradient(0,0,0,WORLD.height);
      shade.addColorStop(0,'rgba(0,0,0,.02)');
      shade.addColorStop(.7,'rgba(0,0,0,.04)');
      shade.addColorStop(1,'rgba(0,0,0,.14)');
      context.fillStyle=shade;
      context.fillRect(0,0,WORLD.width,WORLD.height);
      return;
    }
    context.fillStyle='#081416';
    context.fillRect(0,0,WORLD.width,WORLD.height);
    const loadingShade=context.createLinearGradient(0,0,0,WORLD.height);
    loadingShade.addColorStop(0,'rgba(13,43,40,.32)');
    loadingShade.addColorStop(1,'rgba(3,10,12,.72)');
    context.fillStyle=loadingShade;
    context.fillRect(0,0,WORLD.width,WORLD.height);
  }
`;
  source = source.slice(0, backgroundStart) + renderer + source.slice(backgroundEnd);
  const css = `<style id="m0-p0-background-owner-v1">.game-viewport,#gameCanvas{background:transparent!important}.game-viewport{isolation:isolate}#gameCanvas{position:relative;z-index:1}</style>\n`;
  const bodyEnd = source.lastIndexOf('</body>');
  if (bodyEnd < 0) throw new Error('M0/P0 background body end not found');
  return source.slice(0, bodyEnd) + css + source.slice(bodyEnd);
}


function patchKnownAssetFallbacks(source) {
  // The authored result art is PNG in this package. Keep the reward model
  // pointed at files that are actually shipped so a result sheet never shows
  // broken-image tiles while the optional audio fallback is resolving.
  return source
    .replaceAll('assets/result-icons/gold-ingot.svg', 'assets/result-icons-art/gold-imagen.png')
    .replaceAll('assets/result-icons/mastery-medal.svg', 'assets/result-icons-art/mastery-imagen.png');
}

function patchIndex(source) {
  source = patchIndexIdle(source);
  return patchKnownAssetFallbacks(source);
}

const battlePath = join(out, 'battle.html');
let battle = readFileSync(battlePath, 'utf8');
battle = patchBattleIdle(battle);
battle = patchResultOverlay(battle);
battle = patchBackgroundOwnership(battle);
battle = patchKnownAssetFallbacks(battle);
writeFileSync(battlePath, battle);

const indexPath = join(out, 'index.html');
let index = readFileSync(indexPath, 'utf8');
index = patchIndex(index);
writeFileSync(indexPath, index);

console.log(`M0/P0 runtime repair applied: idle=${idle.src} (${idle.frames} frames, full-cell) · single background owner · result CTA owner`);
