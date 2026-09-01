import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const battlePath = join(process.cwd(), 'dist', 'battle.html');
let s = readFileSync(battlePath, 'utf8');

function mustReplace(from, to, label) {
  if (!s.includes(from)) throw new Error(`Luc Anh retina patch missing ${label}`);
  s = s.replace(from, to);
}

function replaceIfPresent(from, to) {
  if (s.includes(from)) s = s.replace(from, to);
}

// iPhone/iPad Pro can be DPR=3. The old cap=2 made Safari upscale the final canvas again,
// which visibly softened character sprites even when the source atlas was clean.
mustReplace(
  'const dpr = Math.min(devicePixelRatio || 1, 2);',
  'const dpr = Math.min(devicePixelRatio || 1, 3);',
  'battle canvas DPR cap'
);

// Keep the whole battlefield canvas in high-quality sampling mode after every transform reset.
mustReplace(
  'ctx.setTransform(sx, 0, 0, sy, tx, ty);\n    ctx.clearRect(-100, -100, WORLD.width + 200, WORLD.height + 200);',
  'ctx.setTransform(sx, 0, 0, sy, tx, ty);\n    ctx.imageSmoothingEnabled = true;\n    ctx.imageSmoothingQuality = "high";\n    ctx.clearRect(-100, -100, WORLD.width + 200, WORLD.height + 200);',
  'render smoothing quality'
);

// Runtime upscale cache for Lục Ảnh.
// This keeps every original frame and every timing value. It only creates a larger in-memory atlas
// before drawing, so battle rendering scales down from a larger cached texture instead of scaling
// directly from the small source cells on every frame. No frame is removed or skipped.
mustReplace(
  'function drawLucAnhAtlas(context,key,frame,x,y,width,height,options={}){const m=LUC_ANH_META[key],image=LUC_ANH_IMAGES[key];if(!m||!image?.complete||image.naturalWidth<2)return false;const sx=(frame%LUC_ANH_COLS)*m.w,sy=Math.floor(frame/LUC_ANH_COLS)*m.h;context.save();context.translate(x,y);if(options.flip)context.scale(-1,1);context.globalAlpha=options.alpha??1;if(options.screen)context.globalCompositeOperation="screen";context.drawImage(image,sx,sy,m.w,m.h,-width*.5,-height+(options.baseline??46),width,height);context.restore();return true;}',
  `const LUC_ANH_RUNTIME_UPSCALE=Object.freeze({character:3,vfx:2,maxCanvasSide:8192});
  function lucAnhImageReady(image){return !!image&&((image.naturalWidth||image.width||0)>1)&&((image.naturalHeight||image.height||0)>1);}
  function lucAnhUpscaleFactorFor(key,m){
    const isVfx=String(key).toLowerCase().includes('vfx')||String(key).toLowerCase().includes('projectile')||String(key).toLowerCase().includes('impact');
    const wanted=isVfx?LUC_ANH_RUNTIME_UPSCALE.vfx:LUC_ANH_RUNTIME_UPSCALE.character;
    const cols=LUC_ANH_COLS,rows=Math.ceil((Number(m.frames)||1)/cols),maxSide=LUC_ANH_RUNTIME_UPSCALE.maxCanvasSide;
    return Math.max(1,Math.min(wanted,Math.floor(maxSide/(cols*m.w)),Math.floor(maxSide/(rows*m.h))));
  }
  function buildLucAnhUpscaledAtlas(key){
    const m=LUC_ANH_META[key],image=LUC_ANH_IMAGES[key];
    if(!m||!lucAnhImageReady(image)||image.__lucAnhUpscaled)return;
    const factor=lucAnhUpscaleFactorFor(key,m);
    if(factor<=1){image.__lucAnhUpscaled=1;return;}
    const cols=LUC_ANH_COLS,rows=Math.ceil(m.frames/cols),cw=m.w*factor,ch=m.h*factor;
    const atlas=document.createElement('canvas');
    atlas.width=cols*cw;atlas.height=rows*ch;
    atlas.__lucAnhUpscaled=factor;
    const g=atlas.getContext('2d',{alpha:true});
    if(!g)return;
    g.imageSmoothingEnabled=true;
    g.imageSmoothingQuality='high';
    for(let f=0;f<m.frames;f++){
      const sx=(f%cols)*m.w,sy=Math.floor(f/cols)*m.h,dx=(f%cols)*cw,dy=Math.floor(f/cols)*ch;
      g.clearRect(dx,dy,cw,ch);
      g.drawImage(image,sx,sy,m.w,m.h,dx,dy,cw,ch);
    }
    LUC_ANH_IMAGES[key]=atlas;
  }
  function prepareLucAnhUpscaleAtlases(){
    Object.keys(LUC_ANH_IMAGES).forEach(key=>{
      const image=LUC_ANH_IMAGES[key];
      if(lucAnhImageReady(image))buildLucAnhUpscaledAtlas(key);
      else image?.addEventListener?.('load',()=>buildLucAnhUpscaledAtlas(key),{once:true});
    });
  }
  prepareLucAnhUpscaleAtlases();
  function drawLucAnhAtlas(context,key,frame,x,y,width,height,options={}){const m=LUC_ANH_META[key],image=LUC_ANH_IMAGES[key];if(!m||!lucAnhImageReady(image))return false;const factor=image.__lucAnhUpscaled||1,sw=m.w*factor,sh=m.h*factor,sx=(frame%LUC_ANH_COLS)*sw,sy=Math.floor(frame/LUC_ANH_COLS)*sh,dw=Math.round(width),dh=Math.round(height),dx=Math.round(-dw*.5),dy=Math.round(-dh+(options.baseline??46));context.save();context.imageSmoothingEnabled=true;context.imageSmoothingQuality="high";context.translate(Math.round(x),Math.round(y));if(options.flip)context.scale(-1,1);context.globalAlpha=options.alpha??1;if(options.screen)context.globalCompositeOperation="screen";context.drawImage(image,sx,sy,sw,sh,dx,dy,dw,dh);context.restore();return true;}`,
  'Luc Anh runtime upscale cache and atlas draw sharpener'
);

// Keep the Golden Character battle presence from the existing Lục Ảnh patch.
// Do not shrink to hide blur; render from the upscaled cache instead.
replaceIfPresent(
  'drawLucAnhAtlas(context,key,frame,0,0,330,330,{baseline:48,flip:unit.team===TEAM_ENEMY});',
  'drawLucAnhAtlas(context,key,frame,0,0,500,500,{baseline:72,flip:unit.team===TEAM_ENEMY});'
);
replaceIfPresent(
  'drawLucAnhAtlas(context,key,frame,0,0,430,430,{baseline:62,flip:unit.team===TEAM_ENEMY});',
  'drawLucAnhAtlas(context,key,frame,0,0,500,500,{baseline:72,flip:unit.team===TEAM_ENEMY});'
);

writeFileSync(battlePath, s);
console.log('Luc Anh runtime upscale cache applied: all frames preserved, character atlases 3x, VFX atlases 2x, DPR3 canvas');
