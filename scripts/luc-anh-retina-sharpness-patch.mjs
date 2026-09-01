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

// Targeted Luc Anh atlas renderer: high-quality sampling + integer destination rect.
// This removes sub-pixel softening and avoids leaking smoothing state to other canvas draws.
mustReplace(
  'function drawLucAnhAtlas(context,key,frame,x,y,width,height,options={}){const m=LUC_ANH_META[key],image=LUC_ANH_IMAGES[key];if(!m||!image?.complete||image.naturalWidth<2)return false;const sx=(frame%LUC_ANH_COLS)*m.w,sy=Math.floor(frame/LUC_ANH_COLS)*m.h;context.save();context.translate(x,y);if(options.flip)context.scale(-1,1);context.globalAlpha=options.alpha??1;if(options.screen)context.globalCompositeOperation="screen";context.drawImage(image,sx,sy,m.w,m.h,-width*.5,-height+(options.baseline??46),width,height);context.restore();return true;}',
  'function drawLucAnhAtlas(context,key,frame,x,y,width,height,options={}){const m=LUC_ANH_META[key],image=LUC_ANH_IMAGES[key];if(!m||!image?.complete||image.naturalWidth<2)return false;const sx=(frame%LUC_ANH_COLS)*m.w,sy=Math.floor(frame/LUC_ANH_COLS)*m.h,dw=Math.round(width),dh=Math.round(height),dx=Math.round(-dw*.5),dy=Math.round(-dh+(options.baseline??46));context.save();context.imageSmoothingEnabled=true;context.imageSmoothingQuality="high";context.translate(Math.round(x),Math.round(y));if(options.flip)context.scale(-1,1);context.globalAlpha=options.alpha??1;if(options.screen)context.globalCompositeOperation="screen";context.drawImage(image,sx,sy,m.w,m.h,dx,dy,dw,dh);context.restore();return true;}',
  'Luc Anh atlas draw sharpener'
);

// Current Luc Anh source cells are 240x240. The prior 500x500 draw was too aggressive on mobile
// and amplified blur. 430 keeps Golden-scale presence while reducing unsafe upscaling.
replaceIfPresent(
  'drawLucAnhAtlas(context,key,frame,0,0,500,500,{baseline:72,flip:unit.team===TEAM_ENEMY});',
  'drawLucAnhAtlas(context,key,frame,0,0,430,430,{baseline:62,flip:unit.team===TEAM_ENEMY});'
);

writeFileSync(battlePath, s);
console.log('Luc Anh Retina sharpness patch applied: DPR3 canvas, high-quality atlas sampling, balanced 430px battle draw');
