import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { LUC_ANH_BASIC_GEOMETRY as BASIC } from '../src/domain/character/luc-anh-spatial.mjs';

const p = join(process.cwd(), 'dist', 'battle.html');
let s = readFileSync(p, 'utf8');

function requiredReplace(re, to, label) {
  if (!re.test(s)) throw new Error(`Luc Anh spatial patch missing ${label}`);
  s = s.replace(re, to);
}
function optionalReplace(re, to) {
  if (re.test(s)) s = s.replace(re, to);
}

if (!s.includes('const LUC_ANH_SPATIAL=')) {
  requiredReplace(
    /function isLucAnh\(unit\)\{return !!unit&&String\(unit\.sourceId\|\|unit\.sourceHeroId\|\|unit\.id\)===LUC_ANH_ID;\}/,
    `const LUC_ANH_SPATIAL=Object.freeze({\n    footAnchor:{x:0,y:0},\n    displayHeight:330,\n    assetTrimScale:{idle:1,run:1,attack:${BASIC.scale},skill1:372/330,ultimate:372/330,hurt:1,fall:1},\n    assetBaseline:{idle:48,run:48,attack:${BASIC.baseline},skill1:54,ultimate:54,hurt:48,fall:48},\n    hitAnchor:{x:0,y:-80},\n    castAnchor:{x:72,y:-104},\n    healthBarOffset:{x:0,y:-190},\n    shadowOffset:{x:-64,y:-30},\n    buffOffsets:[{x:0,y:0},{x:0,y:-50},{x:0,y:-100}],\n    meleeReach:150,\n    attackOffset:{basic:{x:0,y:0},skill1:{x:0,y:0},ultimate:{x:0,y:0}},\n    vfxScale:{basicProjectile:1,basicImpact:1,skill1Vfx:1,ultimateVfx:1},\n    moveType:{basic:0,skill1:0,ultimate:0},\n    timing:{\n      basic:{castDelay:900,projectileTravel:760,impactVfxDuration:720},\n      skill1:{castDelay:900,settleDelay:700,vfxDuration:1650},\n      ultimate:{voiceLead:260,vfxDelay:760,impactHold:1850,vfxDuration:3200}\n    }\n  });\n  function lucAnhDisplaySize(key){return LUC_ANH_SPATIAL.displayHeight*(LUC_ANH_SPATIAL.assetTrimScale[key]||1);}\n  function lucAnhDisplayBaseline(key){return LUC_ANH_SPATIAL.assetBaseline[key]??48;}\n  function lucAnhAnchor(unit,key){const a=LUC_ANH_SPATIAL[key]||{x:0,y:0},dir=unit?.team===TEAM_ENEMY?-1:1;return {x:(unit?.x||0)+(a.x||0)*dir,y:(unit?.y||0)+(a.y||0)};}\n  function isLucAnh(unit){return !!unit&&String(unit.sourceId||unit.sourceHeroId||unit.id)===LUC_ANH_ID;}`,
    'spatial metadata anchor insertion'
  );
}

optionalReplace(
  /const lucAnhVisualSize=\(key==="attack"\|\|key==="skill1"\|\|key==="ultimate"\)\?372:330;const lucAnhBaseline=\(key==="attack"\|\|key==="skill1"\|\|key==="ultimate"\)\?54:48;drawLucAnhAtlas\(context,key,frame,0,0,lucAnhVisualSize,lucAnhVisualSize,\{baseline:lucAnhBaseline,flip:unit\.team===TEAM_ENEMY\}\);/,
  `const lucAnhVisualSize=lucAnhDisplaySize(key),lucAnhBaseline=lucAnhDisplayBaseline(key);drawLucAnhAtlas(context,key,frame,0,0,lucAnhVisualSize,lucAnhVisualSize,{baseline:lucAnhBaseline,flip:unit.team===TEAM_ENEMY});`
);
optionalReplace(
  /drawLucAnhAtlas\(context,key,frame,0,0,(?:330|500),(?:330|500),\{baseline:(?:48|72),flip:unit\.team===TEAM_ENEMY\}\);/,
  `const lucAnhVisualSize=lucAnhDisplaySize(key),lucAnhBaseline=lucAnhDisplayBaseline(key);drawLucAnhAtlas(context,key,frame,0,0,lucAnhVisualSize,lucAnhVisualSize,{baseline:lucAnhBaseline,flip:unit.team===TEAM_ENEMY});`
);
if (!s.includes('lucAnhDisplaySize(key)')) throw new Error('Luc Anh spatial patch could not normalize hero display renderer');

optionalReplace(
  /if\(key==="basicProjectile"&&target\)\{const x=actor\.x\+\(target\.x-actor\.x\)\*p,y=actor\.y-78\+\(target\.y-actor\.y\)\*p;drawLucAnhAtlas\(context,key,frame,x,y,300,206,\{baseline:103,flip:actor\.team===TEAM_ENEMY,alpha:\.98\}\);\}/,
  `if(key==="basicProjectile"&&target){const from=lucAnhAnchor(actor,"castAnchor"),to=lucAnhAnchor(target,"hitAnchor"),x=from.x+(to.x-from.x)*p,y=from.y+(to.y-from.y)*p,sc=LUC_ANH_SPATIAL.vfxScale.basicProjectile;drawLucAnhAtlas(context,key,frame,x,y,300*sc,206*sc,{baseline:103,flip:actor.team===TEAM_ENEMY,alpha:.98});}`
);
optionalReplace(
  /else if\(key==="basicImpact"&&target\)\{drawLucAnhAtlas\(context,key,frame,target\.x,target\.y,350,241,\{baseline:120,screen:true,alpha:\.96\}\);\}/,
  `else if(key==="basicImpact"&&target){const hit=lucAnhAnchor(target,"hitAnchor"),sc=LUC_ANH_SPATIAL.vfxScale.basicImpact;drawLucAnhAtlas(context,key,frame,hit.x,hit.y,350*sc,241*sc,{baseline:120,screen:true,alpha:.96});}`
);
optionalReplace(
  /else if\(key==="skill1Vfx"\)\{const enemyTeam=actor\.team===TEAM_PLAYER\?TEAM_ENEMY:TEAM_PLAYER;units\.filter\(u=>u\.team===enemyTeam\)\.forEach\(u=>drawLucAnhAtlas\(context,key,frame,u\.x,u\.y,250,172,\{baseline:86,screen:true,alpha:\.92\}\)\);\}/,
  `else if(key==="skill1Vfx"){const enemyTeam=actor.team===TEAM_PLAYER?TEAM_ENEMY:TEAM_PLAYER,sc=LUC_ANH_SPATIAL.vfxScale.skill1Vfx;units.filter(u=>u.team===enemyTeam).forEach(u=>{const hit=lucAnhAnchor(u,"hitAnchor");drawLucAnhAtlas(context,key,frame,hit.x,hit.y,250*sc,172*sc,{baseline:86,screen:true,alpha:.92});});}`
);

if (!s.includes('for(const rowY of rowYs){drawLucAnhAtlas(context,key,frame,fxCx,rowY')) {
  const legacyUltimate = /else if\(key==="ultimateVfx"\)\{const enemyTeam=actor\.team===TEAM_PLAYER\?TEAM_ENEMY:TEAM_PLAYER,slots=units\.filter\(u=>u\.team===enemyTeam\),cx=slots\.length\?slots\.reduce\(\(a,u\)=>a\+u\.x,0\)\/slots\.length:\(actor\.team===TEAM_PLAYER\?WORLD\.width\*\.72:WORLD\.width\*\.28\),cy=slots\.length\?slots\.reduce\(\(a,u\)=>a\+u\.y,0\)\/slots\.length:WORLD\.height\*\.52;drawLucAnhAtlas\(context,key,frame,cx,cy,700,482,\{baseline:241,alpha:1\}\);\}/;
  optionalReplace(legacyUltimate, `else if(key==="ultimateVfx"){const enemyTeam=actor.team===TEAM_PLAYER?TEAM_ENEMY:TEAM_PLAYER,slots=units.filter(u=>u.team===enemyTeam),cx=slots.length?slots.reduce((a,u)=>a+u.x,0)/slots.length:(actor.team===TEAM_PLAYER?WORLD.width*.72:WORLD.width*.28),cy=slots.length?slots.reduce((a,u)=>a+u.y,0)/slots.length:WORLD.height*.52,sc=LUC_ANH_SPATIAL.vfxScale.ultimateVfx;drawLucAnhAtlas(context,key,frame,cx,cy,700*sc,482*sc,{baseline:241,alpha:1});}`);
}

if (!s.includes('window.__HV_LUC_ANH_SPATIAL')) {
  s = s.replace('function lucAnhAnchor(unit,key){', 'window.__HV_LUC_ANH_SPATIAL=LUC_ANH_SPATIAL;\n  function lucAnhAnchor(unit,key){');
}

writeFileSync(p, s);
console.log('Luc Anh migrated to anchor-based spatial pipeline with authored timing metadata');
