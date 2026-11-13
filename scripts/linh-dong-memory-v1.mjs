import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createAtlasImageCache } from '../src/domain/character/atlas-image-cache.mjs';

const marker = '/* TKT-0144 bounded lazy Linh Dong atlas cache */';
export function patchLinhDongMemory(input, surface) {
  if (input.includes(marker)) return input;
  let html = input;
  const replace = (from, to, label) => {
    if (!html.includes(from)) throw new Error('Linh Dong memory patch missing ' + label);
    html = html.replace(from, to);
  };
  const battle = surface === 'battle';
  const original = battle
    ? 'const LINH_DONG_IMAGES=Object.fromEntries(Object.entries(LINH_DONG_META).map(([key,m])=>{const image=new Image();image.decoding="async";image.src=LINH_DONG_ASSET_BASE+m.file;return [key,image];}));'
    : "const LINH_DONG_IMAGES=Object.fromEntries(Object.entries(LINH_DONG_ANIMS).map(([k,a])=>{const im=new Image();im.decoding='async';im.src=a.src;return [k,im];}));";
  replace(original, `${marker}\nconst LINH_DONG_CACHE=(${createAtlasImageCache.toString()})(${battle ? 'LINH_DONG_META,{base:LINH_DONG_ASSET_BASE}' : 'LINH_DONG_ANIMS'});\nconst LINH_DONG_IMAGES=LINH_DONG_CACHE.images;\nwindow.__HV_LINH_DONG_CACHE=LINH_DONG_CACHE;`, 'eager loader');
  if (battle) {
    replace('drawLinhDongAtlas(context,key,frame,0,0,477,440,{baseline:64});context.restore();return true;',
      'const drawn=drawLinhDongAtlas(context,key,frame,0,0,477,440,{baseline:64}) || (key!=="idle" && drawLinhDongAtlas(context,"idle",linhDongFrame("idle",time,true),0,0,477,440,{baseline:64}));context.restore();return !!drawn;', 'renderer fallback');
  } else {
    const begin = html.indexOf('function startLinhDongDetailIdle(){');
    const end = html.indexOf('/* ---------- KHO ĐỒ', begin);
    if (begin < 0 || end < 0) throw new Error('Linh Dong detail lifecycle marker missing');
    html = html.slice(0, begin) + `function startLinhDongDetailIdle(){
  cancelAnimationFrame(_lucDetailRaf);
  const cv=document.getElementById('linhDongDetailIdle');if(!cv)return;
  const css=270,dpr=Math.min(3,window.devicePixelRatio||1);
  cv.style.width=css+'px';cv.style.height=css+'px';cv.width=Math.round(css*dpr);cv.height=Math.round(css*dpr);
  const c=cv.getContext('2d'),a=LINH_DONG_ANIMS.idle,start=performance.now();
  if(!c)return;
  const scale=css/Math.max(a.w,a.h),dw=a.w*scale,dh=a.h*scale;
  c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
  function tick(){
    _lucDetailRaf=0;
    if(!cv.isConnected||ST.screen!=='heroDetail')return;
    if(document.hidden){_lucDetailRaf=requestAnimationFrame(tick);return;}
    c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,css,css);
    const im=LINH_DONG_IMAGES.idle;
    if(im?.complete&&im.naturalWidth>1){
      const atlasScale=Number(im.__hvAtlasScale)>0?Number(im.__hvAtlasScale):1;
      const f=lucFrame(a,start,true),sx=(f%a.cols)*a.w*atlasScale,sy=Math.floor(f/a.cols)*a.h*atlasScale;
      c.drawImage(im,sx,sy,a.w*atlasScale,a.h*atlasScale,(css-dw)/2,css-dh,dw,dh);
    }
    _lucDetailRaf=requestAnimationFrame(tick);
  }
  // renderHeroDetail runs before showScreen; wait for that route transition.
  _lucDetailRaf=requestAnimationFrame(tick);
}
` + html.slice(end);
    replace('function showScreen(name){', "function showScreen(name){ if(name!=='heroDetail')window.__HV_LINH_DONG_CACHE?.clear();", 'profile route teardown');
    replace('    frame.src = url;', '    window.__HV_LINH_DONG_CACHE?.clear();\n    try { if (typeof _bachDienIdleIm !== "undefined" && _bachDienIdleIm) { _bachDienIdleIm.onload = null; if (_bachDienIdleIm.removeAttribute) _bachDienIdleIm.removeAttribute("src"); else _bachDienIdleIm.src = ""; _bachDienIdleIm = null; } } catch (_) {}\n    try { window.__HV_CAMPAIGN_RELEASE_ATLASES?.(); } catch (_) {}\n    frame.src = url;', 'battle entry teardown');
    replace('    frame.src = "about:blank";', '    try { frame.contentWindow?.__HV_LINH_DONG_CACHE?.clear(); } catch (_) {}\n    frame.src = "about:blank";', 'battle exit teardown');
  }
  return html;
}

export function installLinhDongMemory(root) {
  for (const [file, surface] of [['index.html','host'],['battle.html','battle']]) {
    const path = join(root, 'dist', file);
    writeFileSync(path, patchLinhDongMemory(readFileSync(path, 'utf8'), surface));
  }
  console.log('TKT-0144: lazy Linh Dong atlas cache, fallback and screen cleanup installed');
}
