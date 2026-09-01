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

// Safe restore patch: keep HiDPI/Retina canvas and high-quality draw sampling,
// but do NOT create runtime atlas caches during battle initialization.
// The previous runtime cache could break battle startup on mobile Safari.
mustReplace(
  'const dpr = Math.min(devicePixelRatio || 1, 2);',
  'const dpr = Math.min(devicePixelRatio || 1, 3);',
  'battle canvas DPR cap'
);

mustReplace(
  'ctx.setTransform(sx, 0, 0, sy, tx, ty);\n    ctx.clearRect(-100, -100, WORLD.width + 200, WORLD.height + 200);',
  'ctx.setTransform(sx, 0, 0, sy, tx, ty);\n    ctx.imageSmoothingEnabled = true;\n    ctx.imageSmoothingQuality = "high";\n    ctx.clearRect(-100, -100, WORLD.width + 200, WORLD.height + 200);',
  'render smoothing quality'
);

mustReplace(
  'function drawLucAnhAtlas(context,key,frame,x,y,width,height,options={}){const m=LUC_ANH_META[key],image=LUC_ANH_IMAGES[key];if(!m||!image?.complete||image.naturalWidth<2)return false;const sx=(frame%LUC_ANH_COLS)*m.w,sy=Math.floor(frame/LUC_ANH_COLS)*m.h;context.save();context.translate(x,y);if(options.flip)context.scale(-1,1);context.globalAlpha=options.alpha??1;if(options.screen)context.globalCompositeOperation="screen";context.drawImage(image,sx,sy,m.w,m.h,-width*.5,-height+(options.baseline??46),width,height);context.restore();return true;}',
  'function drawLucAnhAtlas(context,key,frame,x,y,width,height,options={}){const m=LUC_ANH_META[key],image=LUC_ANH_IMAGES[key];if(!m||!image?.complete||image.naturalWidth<2)return false;const sx=(frame%LUC_ANH_COLS)*m.w,sy=Math.floor(frame/LUC_ANH_COLS)*m.h,dw=Math.round(width),dh=Math.round(height),dx=Math.round(-dw*.5),dy=Math.round(-dh+(options.baseline??46));context.save();context.imageSmoothingEnabled=true;context.imageSmoothingQuality="high";context.translate(Math.round(x),Math.round(y));if(options.flip)context.scale(-1,1);context.globalAlpha=options.alpha??1;if(options.screen)context.globalCompositeOperation="screen";context.drawImage(image,sx,sy,m.w,m.h,dx,dy,dw,dh);context.restore();return true;}',
  'safe Luc Anh atlas draw sharpener'
);

// Preserve current Golden Character visual size, but avoid any heavy runtime preprocessing.
replaceIfPresent(
  'drawLucAnhAtlas(context,key,frame,0,0,330,330,{baseline:48,flip:unit.team===TEAM_ENEMY});',
  'drawLucAnhAtlas(context,key,frame,0,0,500,500,{baseline:72,flip:unit.team===TEAM_ENEMY});'
);
replaceIfPresent(
  'drawLucAnhAtlas(context,key,frame,0,0,430,430,{baseline:62,flip:unit.team===TEAM_ENEMY});',
  'drawLucAnhAtlas(context,key,frame,0,0,500,500,{baseline:72,flip:unit.team===TEAM_ENEMY});'
);

writeFileSync(battlePath, s);
console.log('Luc Anh safe Retina draw patch applied: DPR3 + high-quality sampling, runtime atlas cache disabled');
