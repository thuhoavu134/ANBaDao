import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export const BATTLE_WORLD = Object.freeze({ width: 1600, height: 870 });
export const DESKTOP_FORMATION = Object.freeze({
  player: Object.freeze([
    Object.freeze({ x:535,y:340 }),Object.freeze({ x:535,y:520 }),Object.freeze({ x:535,y:700 }),
    Object.freeze({ x:365,y:340 }),Object.freeze({ x:365,y:520 }),Object.freeze({ x:365,y:700 })
  ]),
  enemy: Object.freeze([
    Object.freeze({ x:1065,y:340 }),Object.freeze({ x:1065,y:520 }),Object.freeze({ x:1065,y:700 }),
    Object.freeze({ x:1235,y:340 }),Object.freeze({ x:1235,y:520 }),Object.freeze({ x:1235,y:700 })
  ])
});
// Approved legacy portrait anchors from the stable iPhone layout.
// Keep this geometry under the current viewport-aware owner; do not revive MOBILE_POSITIONS.
export const PORTRAIT_FORMATION = Object.freeze({
  rows: Object.freeze([340,520,700]),
  frontOffsetX: 80,
  backOffsetX: 170,
  compactCropWidth: 1200
});
export const BATTLE_CHARACTER_SCALE = Object.freeze({ portrait:0.52, desktop:0.74 });
// Match the standing body of Ông Phở (310 world px) and Đình Lôi (~300),
// measured from real first-frame alpha at their production draw sizes. The
// registered S+ bodies are 335/395 px; cell size or silhouette diagonal is not
// a measure of character stature (Linh Đồng includes wide stray particles).
export const BATTLE_HERO_BODY_HEIGHT = 310;
export const HERO_VISUAL_SCALE = Object.freeze({
  default:1,
  luc_anh:BATTLE_HERO_BODY_HEIGHT/(330*199/240),
  thay_mo:BATTLE_HERO_BODY_HEIGHT/(348*250/264),
  hero_splus_linh_dong:BATTLE_HERO_BODY_HEIGHT/335,
  hero_splus_bach_dien:BATTLE_HERO_BODY_HEIGHT/395
});
// Retain the existing compact horizontal/position calibration. The body-height
// correction above scales both axes and applies to every registered clip.
export const HERO_VISUAL_HORIZONTAL_SCALE = Object.freeze({
  default:1,
  hero_splus_linh_dong:0.9210526316
});
export const HERO_VISUAL_OFFSET_X = Object.freeze({
  default:0,
  hero_splus_linh_dong:4.25
});

export function battleWorldCropForViewport(width,height){
  const w=Math.max(1,Number(width)||BATTLE_WORLD.width);
  const h=Math.max(1,Number(height)||BATTLE_WORLD.height);
  const scale=Math.max(w/BATTLE_WORLD.width,h/BATTLE_WORLD.height);
  const offsetX=(w-BATTLE_WORLD.width*scale)/2;
  const offsetY=(h-BATTLE_WORLD.height*scale)/2;
  const left=-offsetX/scale,right=(w-offsetX)/scale,top=-offsetY/scale,bottom=(h-offsetY)/scale;
  return {left,right,top,bottom,width:right-left,height:bottom-top,scale,offsetX,offsetY};
}
export function battleUsesCompactFormation(width,height){
  return battleWorldCropForViewport(width,height).width<PORTRAIT_FORMATION.compactCropWidth;
}
export function battleFormationForViewport(width,height){
  if(!battleUsesCompactFormation(width,height)) return DESKTOP_FORMATION;
  const [row1,row2,row3]=PORTRAIT_FORMATION.rows;
  const centerX=BATTLE_WORLD.width/2;
  const leftFront=centerX-PORTRAIT_FORMATION.frontOffsetX;
  const leftBack=centerX-PORTRAIT_FORMATION.backOffsetX;
  const rightFront=centerX+PORTRAIT_FORMATION.frontOffsetX;
  const rightBack=centerX+PORTRAIT_FORMATION.backOffsetX;
  return {
    player:[
      {x:leftFront,y:row1},{x:leftFront,y:row2},{x:leftFront,y:row3},
      {x:leftBack,y:row1},{x:leftBack,y:row2},{x:leftBack,y:row3}
    ],
    enemy:[
      {x:rightFront,y:row1},{x:rightFront,y:row2},{x:rightFront,y:row3},
      {x:rightBack,y:row1},{x:rightBack,y:row2},{x:rightBack,y:row3}
    ]
  };
}
export function canonicalBattleHeroId(value){
  const raw=String(value??'').trim().toLowerCase();
  if(/^(?:linh_dong|linh-dong|hero_splus_linh_dong)$/.test(raw)) return 'hero_splus_linh_dong';
  if(/^(?:bach_dien|bach-dien|hero_splus_bach_dien)$/.test(raw)) return 'hero_splus_bach_dien';
  return raw;
}
export function heroVisualScale(unitOrId){
  return HERO_VISUAL_SCALE[battleHeroVisualId(unitOrId)]??HERO_VISUAL_SCALE.default;
}
export function battleHeroVisualId(unitOrId){
  const ids=typeof unitOrId==='object'&&unitOrId
    ? [unitOrId.sourceId,unitOrId.sourceHeroId,unitOrId.id] : [unitOrId];
  const normalized=ids.filter(Boolean).map(canonicalBattleHeroId);
  return normalized.find(id=>Object.prototype.hasOwnProperty.call(HERO_VISUAL_SCALE,id))||normalized[0]||'';
}
export function battleCharacterDepthScale(unit){
  // Approach/ultimate movement changes y. Keep the authored actor's size tied
  // to its formation slot throughout the animation, including the return.
  const anchor=[unit?.baseY,unit?.homeAnchor?.y,unit?.y].find(y=>y!=null&&Number.isFinite(Number(y)));
  return 0.83+(Number(anchor??290)-290)/1500;
}
export function battleCharacterScaleForViewport(unitOrId,width,height){
  const base=battleUsesCompactFormation(width,height)?BATTLE_CHARACTER_SCALE.portrait:BATTLE_CHARACTER_SCALE.desktop;
  return base*heroVisualScale(unitOrId);
}
export function battleCharacterHorizontalScaleForViewport(unitOrId,width,height){
  if(!battleUsesCompactFormation(width,height))return 1;
  return HERO_VISUAL_HORIZONTAL_SCALE[battleHeroVisualId(unitOrId)]??HERO_VISUAL_HORIZONTAL_SCALE.default;
}
export function battleCharacterVisualOffsetXForViewport(unitOrId,team,width,height){
  if(!battleUsesCompactFormation(width,height))return 0;
  const amount=HERO_VISUAL_OFFSET_X[battleHeroVisualId(unitOrId)]??HERO_VISUAL_OFFSET_X.default;
  return team==='enemy'?-amount:amount;
}

const RUNTIME_LAYOUT=`const PORTRAIT_FORMATION=Object.freeze({rows:Object.freeze([340,520,700]),frontOffsetX:80,backOffsetX:170,compactCropWidth:1200});
  const BATTLE_CHARACTER_SCALE=Object.freeze({portrait:0.52,desktop:0.74});
  const HERO_VISUAL_SCALE=Object.freeze(${JSON.stringify(HERO_VISUAL_SCALE)});
  const HERO_VISUAL_HORIZONTAL_SCALE=Object.freeze({default:1,hero_splus_linh_dong:0.9210526316});
  const HERO_VISUAL_OFFSET_X=Object.freeze({default:0,hero_splus_linh_dong:4.25});
  function battleWorldCropForViewport(width,height){
    const w=Math.max(1,Number(width)||WORLD.width),h=Math.max(1,Number(height)||WORLD.height);
    const scale=Math.max(w/WORLD.width,h/WORLD.height),offsetX=(w-WORLD.width*scale)/2,offsetY=(h-WORLD.height*scale)/2;
    const left=-offsetX/scale,right=(w-offsetX)/scale,top=-offsetY/scale,bottom=(h-offsetY)/scale;
    return {left,right,top,bottom,width:right-left,height:bottom-top,scale,offsetX,offsetY};
  }
  function battleUsesCompactFormation(width,height){return battleWorldCropForViewport(width,height).width<PORTRAIT_FORMATION.compactCropWidth;}
  function battleViewportSize(){
    const rect=dom.viewport?.getBoundingClientRect?.();
    return {width:Math.max(1,Number(rect?.width)||innerWidth),height:Math.max(1,Number(rect?.height)||innerHeight)};
  }
  function battleFormationForViewport(width,height){
    if(!battleUsesCompactFormation(width,height))return POSITIONS;
    const rows=PORTRAIT_FORMATION.rows,centerX=WORLD.width/2;
    const leftFront=centerX-PORTRAIT_FORMATION.frontOffsetX,leftBack=centerX-PORTRAIT_FORMATION.backOffsetX;
    const rightFront=centerX+PORTRAIT_FORMATION.frontOffsetX,rightBack=centerX+PORTRAIT_FORMATION.backOffsetX;
    return {
      player:[{x:leftFront,y:rows[0]},{x:leftFront,y:rows[1]},{x:leftFront,y:rows[2]},{x:leftBack,y:rows[0]},{x:leftBack,y:rows[1]},{x:leftBack,y:rows[2]}],
      enemy:[{x:rightFront,y:rows[0]},{x:rightFront,y:rows[1]},{x:rightFront,y:rows[2]},{x:rightBack,y:rows[0]},{x:rightBack,y:rows[1]},{x:rightBack,y:rows[2]}]
    };
  }
  function canonicalBattleHeroId(value){
    const raw=String(value??"").trim().toLowerCase();
    if(/^(?:linh_dong|linh-dong|hero_splus_linh_dong)$/.test(raw))return "hero_splus_linh_dong";
    if(/^(?:bach_dien|bach-dien|hero_splus_bach_dien)$/.test(raw))return "hero_splus_bach_dien";
    return raw;
  }
  function battleHeroVisualScale(unit){
    const id=battleHeroVisualId(unit);
    return HERO_VISUAL_SCALE[id]??HERO_VISUAL_SCALE.default;
  }
  function battleCharacterScale(unit){
    const size=(typeof view!=="undefined"&&view.width>0&&view.height>0)?view:battleViewportSize();
    const base=battleUsesCompactFormation(size.width,size.height)?BATTLE_CHARACTER_SCALE.portrait:BATTLE_CHARACTER_SCALE.desktop;
    return base*battleHeroVisualScale(unit);
  }
  function battleCharacterHorizontalScale(unit){
    const size=(typeof view!=="undefined"&&view.width>0&&view.height>0)?view:battleViewportSize();
    if(!battleUsesCompactFormation(size.width,size.height))return 1;
    const id=battleHeroVisualId(unit);
    return HERO_VISUAL_HORIZONTAL_SCALE[id]??HERO_VISUAL_HORIZONTAL_SCALE.default;
  }
  function battleCharacterVisualOffsetX(unit){
    const size=(typeof view!=="undefined"&&view.width>0&&view.height>0)?view:battleViewportSize();
    if(!battleUsesCompactFormation(size.width,size.height))return 0;
    const id=battleHeroVisualId(unit);
    const amount=HERO_VISUAL_OFFSET_X[id]??HERO_VISUAL_OFFSET_X.default;
    return unit?.team==="enemy"?-amount:amount;
  }
  ${battleHeroVisualId.toString()}
  ${battleCharacterDepthScale.toString()}
  /* hv-battle-scale-helpers-end */`;

function replaceOnce(source,replacementPattern,replacement,label){
  const matches=source.match(replacementPattern);
  if(!matches)throw new Error(`Battle layout patch missing ${label}`);
  return source.replace(replacementPattern,replacement);
}

export function applyBattleFormationScale(source){
  if(source.includes('/* hv-patch:battle-formation-scale-v1 */'))return source;
  let s=source;
  s=replaceOnce(
    s,
    /  const MOBILE_POSITIONS = Object\.freeze\(\{[\s\S]*?\n  \}\);/,
    `  /* hv-patch:battle-formation-scale-v1 */\n  ${RUNTIME_LAYOUT}`,
    'mobile formation block'
  );
  // Historical build patches changed the breakpoint helper more than once.
  // Replace the final position owner itself and drop the optional stale helper.
  s=s.replace(/    const battleCompactViewport = [^;\n]+;\n(?=    const position = )/,'');
  s=replaceOnce(
    s,
    /    const position = [^;\n]*MOBILE_POSITIONS[^;\n]*POSITIONS[^;\n]*\[hero\.team\]\[hero\.slot\];/,
    `    const battleViewport=battleViewportSize();\n    const position=battleFormationForViewport(battleViewport.width,battleViewport.height)[hero.team][hero.slot];`,
    'formation selector'
  );
  s=replaceOnce(
    s,
    /    const sourceSeed = Array\.from\(String\(unit\.sourceId \|\| unit\.id \|\| ""\)\)\.reduce\(\(acc, ch\) => \(\(acc \* 33\) \^ ch\.charCodeAt\(0\)\) >>> 0, 5381\);\n    const importedIdentity = Boolean\(unit\.visualSource && unit\.visualSource !== "hon-viet"\);\n/,
    '',
    'legacy random identity scale inputs'
  );
  s=replaceOnce(
    s,
    /    const identityScale = \(innerWidth < 600 \? 0\.(?:52|57) : 0\.74\) \* \(importedIdentity \? \(0\.94 \+ \(sourceSeed % 13\) \/ 100\) : 1\);/,
    '    const identityScale = battleCharacterScale(unit);',
    'generic character scale'
  );
  const splus='const identityScale=(innerWidth<600?0.52:0.74);';
  const count=s.split(splus).length-1;
  if(count!==2)throw new Error(`Battle layout patch expected 2 S+ scale owners, found ${count}`);
  s=s.split(splus).join('const identityScale=battleCharacterScale(unit);');
  const visualTranslate='context.translate(unit.x + hurtJitter + dodgeRecoilX, unit.y + idleBob + runBob);';
  const visualTranslateCount=s.split(visualTranslate).length-1;
  if(visualTranslateCount<1)throw new Error('Battle layout patch missing character presentation translate owner');
  s=s.split(visualTranslate).join('context.translate(unit.x + hurtJitter + dodgeRecoilX + battleCharacterVisualOffsetX(unit), unit.y + idleBob + runBob);');
  const visualScale='context.scale(depthScale * identityScale, depthScale * identityScale);';
  const visualScaleCount=s.split(visualScale).length-1;
  if(visualScaleCount<1)throw new Error('Battle layout patch missing character presentation scale owner');
  s=s.split(visualScale).join('context.scale(depthScale * identityScale * battleCharacterHorizontalScale(unit), depthScale * identityScale);');
  // S+ uses compact source formatting and previously missed both corrections.
  s=s.split('context.translate(unit.x,unit.y-lift);context.scale(depthScale*identityScale,depthScale*identityScale);')
    .join('context.translate(unit.x+battleCharacterVisualOffsetX(unit),unit.y-lift);context.scale(depthScale*identityScale*battleCharacterHorizontalScale(unit),depthScale*identityScale);');
  s=s.replace(/const depthScale\s*=\s*0\.83\s*\+\s*\(unit\.y\s*-\s*290\)\s*\/\s*1500;/g,
    'const depthScale = battleCharacterDepthScale(unit);');
  // The canonical Linh Đồng/Bạch Diện blitters already mirror their sprites.
  // Keep mirroring in the generic owner only for the other renderers.
  s=s.replace('if (unit.team === TEAM_ENEMY) context.scale(-1, 1);',
    'if (unit.team === TEAM_ENEMY && !(typeof isLinhDong === "function" && isLinhDong(unit)) && !(typeof isBachDien === "function" && isBachDien(unit))) context.scale(-1, 1);');
  s=s.replace(/if\(unit\.team===TEAM_ENEMY\)context\.scale\(-1,1\);\s*(?=draw(?:LinhDong|BachDien)Hero\(context,unit,time\))/g,'');
  if(/innerWidth\s*<\s*600\s*\?\s*0\.(?:52|57)\s*:\s*0\.74/.test(s))throw new Error('Battle layout patch left a stale mobile character scale owner');
  return s;
}

const root=process.cwd();
const path=join(root,'dist','battle.html');
if(process.env.HV_SKIP_BATTLE_FORMATION_SCALE_PATCH!=='1'&&existsSync(path)){
  const source=readFileSync(path,'utf8');
  const patched=applyBattleFormationScale(source);
  writeFileSync(path,patched);
  console.log('Battle formation + visual scale v1 applied: approved legacy portrait anchors, single scale owner');
}
