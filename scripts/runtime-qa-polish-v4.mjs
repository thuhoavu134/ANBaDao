import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const out = join(process.cwd(), 'dist');
const battlePath = join(out, 'battle.html');
const indexPath = join(out, 'index.html');

let battle = readFileSync(battlePath, 'utf8');
let index = readFileSync(indexPath, 'utf8');

// 1) Push the 3 stacked Ultimate VFX copies left until they reach the exact center line,
// while still clipping strictly to the enemy half. The source smoke mass is right-heavy,
// so the draw center must be biased toward the battlefield center.
battle = battle.replace(
  "fxCx=targetRight?WORLD.width*.75:WORLD.width*.25,rowYs=[Math.max(120,minY-95),(minY+maxY)/2,Math.min(WORLD.height-90,maxY+95)],fxW=Math.min(halfW*.96,760),fxH=Math.max(300,Math.min(390,(maxY-minY)*.72+250))",
  "fxCx=targetRight?WORLD.width*.66:WORLD.width*.34,rowYs=[Math.max(120,minY-95),(minY+maxY)/2,Math.min(WORLD.height-90,maxY+95)],fxW=Math.min(halfW*1.38,980),fxH=Math.max(320,Math.min(420,(maxY-minY)*.78+270))"
);

// 2) Victory buttons: pointerdown is the most reliable path on iOS Safari.
// Run before older click/touch handlers and debounce duplicate synthetic events.
const resultTapBridge = `<script id="qa-result-actions-v4">\n(()=>{\n let last=0;\n const act=(ev)=>{\n   const b=ev.target?.closest?.('#integratedResultV6 [data-result-action]'); if(!b)return;\n   const now=Date.now(); if(now-last<450)return; last=now;\n   ev.preventDefault(); ev.stopPropagation(); ev.stopImmediatePropagation?.();\n   b.style.transform='translateY(2px)'; setTimeout(()=>{if(b)b.style.transform='';},120);\n   const a=b.dataset.resultAction;\n   if(a==='confirm'){\n     try{if(typeof EMBEDDED!=='undefined'&&EMBEDDED){parent.postMessage({source:'hon-viet-battle',type:'battle-nav',payload:{sessionId:EMBED_CONFIG?.sessionId||'',target:'campaign'}},'*');return;}}catch(_e){}\n     try{continueFromBattleResult();}catch(_e){}\n     return;\n   }\n   if(a==='next'){\n     try{\n       if(typeof EMBEDDED!=='undefined'&&EMBEDDED){state.resultPublished=false;publishBattleResult();return;}\n       continueFromBattleResult();\n     }catch(_e){\n       try{parent.postMessage({source:'hon-viet-battle',type:'battle-nav',payload:{sessionId:EMBED_CONFIG?.sessionId||'',target:'campaign'}},'*');}catch(_e2){}\n     }\n     return;\n   }\n   if(a==='back'){try{parent.postMessage({source:'hon-viet-battle',type:'battle-nav',payload:{sessionId:EMBED_CONFIG?.sessionId||'',target:'campaign'}},'*');}catch(_e){}}\n };\n document.addEventListener('pointerdown',act,true);\n document.addEventListener('pointerup',act,true);\n document.addEventListener('click',act,true);\n document.addEventListener('touchstart',act,{capture:true,passive:false});\n document.addEventListener('touchend',act,{capture:true,passive:false});\n})();\n</script>`;
if(!battle.includes('qa-result-actions-v4')) battle = battle.replace('</body>', resultTapBridge + '\n</body>');

// Make sure no transparent overlay can eat result-button input.
const hardResultCss = `<style id="qa-result-touch-v4">\n#integratedResultV6.show,#integratedResultV6.show .irv-viewport{pointer-events:auto!important}#integratedResultV6 .irv-actions{z-index:99999!important;pointer-events:auto!important}#integratedResultV6 .irv-btn{position:relative!important;z-index:100000!important;pointer-events:auto!important;touch-action:manipulation!important;-webkit-user-select:none!important;user-select:none!important}\n</style>`;
if(!battle.includes('qa-result-touch-v4')) battle = battle.replace('</head>', hardResultCss + '\n</head>');

// 3) Production must not keep the old blue/red QA status test alive because of a stale ?qa= URL.
const qaOld = `const qaParam = new URLSearchParams(location.search).get("qa") || "";\n    const roster12Mode = qaParam === "roster12";\n    const qaMode = window.__HV_QA__ === true || qaParam === "1" || qaParam === "status-icons" || roster12Mode;\n    const statusIconQa = qaParam === "status-icons";`;
const qaNew = `const allowQa = window.__HV_QA__ === true || location.hostname === "localhost" || location.hostname === "127.0.0.1";\n    const qaParam = allowQa ? (new URLSearchParams(location.search).get("qa") || "") : "";\n    const roster12Mode = allowQa && qaParam === "roster12";\n    const qaMode = allowQa && (window.__HV_QA__ === true || qaParam === "1" || qaParam === "status-icons" || roster12Mode);\n    const statusIconQa = allowQa && qaParam === "status-icons";`;
if(index.includes(qaOld)) index = index.replace(qaOld, qaNew);

// Accept the battle frame's result messages on Safari while retaining a frame/window guard.
const sourceGuard = '    if (!activeBattle || event.source !== frame.contentWindow) return;\n    const message = event.data;';
const sourceGuardReplacement = [
  '    const message = event.data;',
  '    if (event.source && event.source !== frame.contentWindow && event.source !== window) return;',
  '    if (!activeBattle) {',
  '      if (message.type === "battle-nav") {',
  '        const target = ["hub","heroes","team","daily","campaign","summon","forge"].includes(message.payload?.target) ? message.payload.target : "hub";',
  '        try { closeOverlay(); } catch (_e) {}',
  '        try { if (typeof navTo === "function") navTo(target); } catch (_e) {}',
  '      }',
  '      return;',
  '    }'
].join('\n');
if (index.includes(sourceGuard)) index = index.replace(sourceGuard, sourceGuardReplacement);

const resultMessageLine = 'if (message.type === "battle-result") finishIntegratedBattle(message.payload || {});';
const resultMessageReplacement = [
  'if (message.type === "battle-result") {',
  '  try { finishIntegratedBattle(message.payload || {}); }',
  '  catch (error) {',
  '    console.error("Không thể đóng kết quả trận Hồn Việt.", error);',
  '    try { closeOverlay(); } catch (_e) {}',
  '    try { if (typeof navTo === "function") navTo("campaign"); } catch (_e) {}',
  '  }',
  '}'
].join('\n');
if (index.includes(resultMessageLine)) index = index.replace(resultMessageLine, resultMessageReplacement);

// 4) Hero-detail idle: the source cell is only 240px, so avoid enlarging it more than necessary.
// Use a 260 CSS-px display, DPR3 backing store, integer source/destination coords and a mild
// contrast/saturation recovery filter. This cannot invent lost 1080p detail, but is visibly crisper
// than stretching the 240px cell to 280+ CSS pixels.
index = index.replace(/function startLucAnhDetailIdle\(\)\{[\s\S]*?\}\s*(?=function|const |let |var )/, `function startLucAnhDetailIdle(){\n  cancelAnimationFrame(_lucDetailRaf);\n  const cv=document.getElementById('lucAnhDetailIdle');if(!cv)return;\n  const css=260,dpr=Math.min(3,window.devicePixelRatio||1);\n  cv.style.width=css+'px';cv.style.height=css+'px';\n  cv.style.filter='contrast(1.14) saturate(1.06)';\n  cv.width=Math.round(css*dpr);cv.height=Math.round(css*dpr);\n  const c=cv.getContext('2d'),a=LUC_ANH_ANIMS.idle,im=LUC_ANH_IMAGES.idle,start=performance.now();\n  function tick(){\n    if(!cv.isConnected)return;\n    c.setTransform(dpr,0,0,dpr,0,0);c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';\n    c.clearRect(0,0,css,css);\n    if(im.complete&&im.naturalWidth>1){const f=lucFrame(a,start,true),sx=Math.round((f%a.cols)*a.w),sy=Math.round(Math.floor(f/a.cols)*a.h);c.drawImage(im,sx,sy,a.w,a.h,0,0,css,css);}\n    _lucDetailRaf=requestAnimationFrame(tick);\n  }\n  tick();\n}\n`);

writeFileSync(battlePath, battle);
writeFileSync(indexPath, index);
console.log('Runtime QA polish v4 applied: center-reaching triple ultimate, reliable victory taps, production QA disabled, sharper Luc Anh detail idle');
