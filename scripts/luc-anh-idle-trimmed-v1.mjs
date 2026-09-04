import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { LUC_ANH_IDLE_TRIMMED as TRIMMED } from '../src/domain/character/luc-anh-idle-trimmed.mjs';

const root = process.cwd();
const trimmedFrames = JSON.stringify(TRIMMED.frameData);
const trimmedSrc = TRIMMED.src;
const trimmedFile = trimmedSrc.split('/').pop();

function replaceOnce(source, expression, replacement, label) {
  const matches = source.match(expression) || [];
  if (matches.length !== 1) throw new Error(`Lục Ảnh trimmed patch expected one ${label}, found ${matches.length}`);
  return source.replace(expression, replacement);
}

function insertAfterLine(source, expression, addition, label) {
  const matches = source.match(expression) || [];
  if (matches.length !== 1) throw new Error(`Lục Ảnh trimmed patch expected one ${label}, found ${matches.length}`);
  return source.replace(expression, (line) => `${line}${addition}`);
}

function patchBattle() {
  const path = join(root, 'dist', 'battle.html');
  let source = readFileSync(path, 'utf8');
  source = replaceOnce(
    source,
    /idle:\{file:"idle(?:-1080)?-atlas\.webp",frames:\d+,w:\d+,h:\d+,ms:\d+,loop:true\}/g,
    `idle:{file:"${trimmedFile}",frames:${TRIMMED.frames},w:${TRIMMED.sourceW},h:${TRIMMED.sourceH},ms:${TRIMMED.ms},loop:true,trimmed:true}`,
    'battle idle metadata'
  );

  if (!source.includes('LUC_ANH_IDLE_TRIMMED_FRAMES')) {
    source = insertAfterLine(
      source,
      /const LUC_ANH_IMAGES=.*?;\n/g,
      `  const LUC_ANH_IDLE_TRIMMED_FRAMES=Object.freeze(${trimmedFrames});\n  const LUC_ANH_IDLE_FALLBACK_IMAGE=new Image();LUC_ANH_IDLE_FALLBACK_IMAGE.decoding="async";LUC_ANH_IDLE_FALLBACK_IMAGE.src=LUC_ANH_ASSET_BASE+"idle-1080-atlas.webp";\n`,
      'battle image registry'
    );
  }

  const start = source.indexOf('function drawLucAnhAtlas(');
  const end = source.indexOf('function drawLucAnhHero', start);
  if (start < 0 || end < 0) throw new Error('Lục Ảnh trimmed patch missing battle atlas renderer boundary');
  const renderer = `function drawLucAnhAtlas(context,key,frame,x,y,width,height,options={}){\n    const m=LUC_ANH_META[key],image=LUC_ANH_IMAGES[key],trim=key==="idle"?LUC_ANH_IDLE_TRIMMED_FRAMES[frame]:null,preferredReady=!!image?.complete&&image.naturalWidth>1,sourceImage=preferredReady?image:(key==="idle"?LUC_ANH_IDLE_FALLBACK_IMAGE:null),useTrimmed=preferredReady&&!!trim;\n    if(!m||!sourceImage?.complete||sourceImage.naturalWidth<2)return false;\n    const sx=useTrimmed?trim[0]:(frame%LUC_ANH_COLS)*m.w,sy=useTrimmed?trim[1]:Math.floor(frame/LUC_ANH_COLS)*m.h,sw=useTrimmed?trim[2]:m.w,sh=useTrimmed?trim[3]:m.h,ox=useTrimmed?trim[4]:0,oy=useTrimmed?trim[5]:0;\n    const dw=useTrimmed?width*(sw/m.w):width,dh=useTrimmed?height*(sh/m.h):height,dx=-width*.5+(useTrimmed?width*(ox/m.w):0),dy=-height+(options.baseline??46)+(useTrimmed?height*(oy/m.h):0);\n    context.save();context.imageSmoothingEnabled=true;context.imageSmoothingQuality="high";context.translate(Math.round(x),Math.round(y));if(options.flip)context.scale(-1,1);context.globalAlpha=options.alpha??1;if(options.screen)context.globalCompositeOperation="screen";context.drawImage(sourceImage,sx,sy,sw,sh,Math.round(dx),Math.round(dy),Math.round(dw),Math.round(dh));context.restore();return true;}\n`;
  source = source.slice(0, start) + renderer + source.slice(end);
  writeFileSync(path, source);
}

function patchIndex() {
  const path = join(root, 'dist', 'index.html');
  let source = readFileSync(path, 'utf8');
  source = replaceOnce(
    source,
    /idle:\{src:'assets\/characters\/luc-anh\/idle(?:-1080)?-atlas\.webp',frames:\d+,cols:\d+,w:\d+,h:\d+,ms:\d+,loop:true\}/g,
    `idle:{src:'${trimmedSrc}',frames:${TRIMMED.frames},cols:8,w:${TRIMMED.sourceW},h:${TRIMMED.sourceH},ms:${TRIMMED.ms},loop:true,trimmed:true}`,
    'hero-detail idle metadata'
  );
  source = source.replaceAll('assets/characters/luc-anh/idle-1080-atlas.webp', trimmedSrc);

  if (!source.includes('LUC_ANH_IDLE_TRIMMED_FRAMES')) {
    source = insertAfterLine(
      source,
      /const LUC_ANH_IMAGES=.*?;\n/g,
      `const LUC_ANH_IDLE_TRIMMED_FRAMES=Object.freeze(${trimmedFrames});\nconst LUC_ANH_IDLE_FALLBACK_IMAGE=new Image();LUC_ANH_IDLE_FALLBACK_IMAGE.decoding='async';LUC_ANH_IDLE_FALLBACK_IMAGE.src='assets/characters/luc-anh/idle-1080-atlas.webp';\n`,
      'hero-detail image registry'
    );
  }

  const atlasStart = source.indexOf('function drawLucAtlasFrame(');
  const atlasEnd = source.indexOf('function drawLucAnh(c,', atlasStart);
  if (atlasStart < 0 || atlasEnd < 0) throw new Error('Lục Ảnh trimmed patch missing hero-detail atlas renderer boundary');
  const renderer = `function drawLucAtlasFrame(kind,frame,dx,dy,dw,dh,mirror=false,alpha=1){\n  const a=LUC_ANH_ANIMS[kind],preferred=LUC_ANH_IMAGES[kind],trim=kind==='idle'?LUC_ANH_IDLE_TRIMMED_FRAMES[frame]:null,preferredReady=!!preferred?.complete&&preferred.naturalWidth>1,im=preferredReady?preferred:(kind==='idle'?LUC_ANH_IDLE_FALLBACK_IMAGE:null),useTrimmed=preferredReady&&!!trim;if(!a||!im?.complete||im.naturalWidth<2)return false;\n  const sx=useTrimmed?trim[0]:(frame%a.cols)*a.w,sy=useTrimmed?trim[1]:Math.floor(frame/a.cols)*a.h,sw=useTrimmed?trim[2]:a.w,sh=useTrimmed?trim[3]:a.h,ox=useTrimmed?trim[4]:0,oy=useTrimmed?trim[5]:0,localX=dw*(ox/a.w),localY=dy+dh*(oy/a.h),drawW=dw*(sw/a.w),drawH=dh*(sh/a.h);\n  ctx.save();ctx.globalAlpha=alpha;if(mirror){ctx.translate(dx+dw,0);ctx.scale(-1,1);ctx.drawImage(im,sx,sy,sw,sh,Math.round(localX),Math.round(localY),Math.round(drawW),Math.round(drawH));}else ctx.drawImage(im,sx,sy,sw,sh,Math.round(dx+localX),Math.round(localY),Math.round(drawW),Math.round(drawH));ctx.restore();return true;}\n`;
  source = source.slice(0, atlasStart) + renderer + source.slice(atlasEnd);

  const detailStart = source.indexOf('function startLucAnhDetailIdle()');
  const detailEnd = source.indexOf('function renderHeroDetail(', detailStart);
  if (detailStart < 0 || detailEnd < 0) throw new Error('Lục Ảnh trimmed patch missing hero-detail idle boundary');
  const detail = `function startLucAnhDetailIdle(){\n  cancelAnimationFrame(_lucDetailRaf);const cv=document.getElementById('lucAnhDetailIdle');if(!cv)return;const css=260,dpr=Math.min(3,window.devicePixelRatio||1);cv.style.width=css+'px';cv.style.height=css+'px';cv.style.filter='contrast(1.14) saturate(1.06)';cv.width=Math.round(css*dpr);cv.height=Math.round(css*dpr);const c=cv.getContext('2d'),a=LUC_ANH_ANIMS.idle,preferred=LUC_ANH_IMAGES.idle,start=performance.now();\n  function tick(){if(!cv.isConnected)return;c.setTransform(dpr,0,0,dpr,0,0);c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.clearRect(0,0,css,css);const preferredReady=!!preferred?.complete&&preferred.naturalWidth>1,im=preferredReady?preferred:LUC_ANH_IDLE_FALLBACK_IMAGE;if(im?.complete&&im.naturalWidth>1){const f=lucFrame(a,start,true),trim=preferredReady?LUC_ANH_IDLE_TRIMMED_FRAMES[f]:null;if(trim){const sx=trim[0],sy=trim[1],sw=trim[2],sh=trim[3],ox=trim[4],oy=trim[5];c.drawImage(im,sx,sy,sw,sh,Math.round(css*(ox/a.w)),Math.round(css*(oy/a.h)),Math.round(css*(sw/a.w)),Math.round(css*(sh/a.h)));}else{const sx=(f%a.cols)*a.w,sy=Math.floor(f/a.cols)*a.h;c.drawImage(im,sx,sy,a.w,a.h,0,0,css,css);}}_lucDetailRaf=requestAnimationFrame(tick);}\n  tick();\n}\n\n`;
  source = source.slice(0, detailStart) + detail + source.slice(detailEnd);
  writeFileSync(path, source);
}

patchBattle();
patchIndex();
console.log(`Lục Ảnh trimmed IDLE wired: ${TRIMMED.frames} frames · ${TRIMMED.atlasW}×${TRIMMED.atlasH} atlas · fallback retained`);
