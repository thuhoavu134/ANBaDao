import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  BATTLE_WORLD,
  BATTLE_CHARACTER_SCALE,
  DESKTOP_FORMATION,
  HERO_VISUAL_SCALE,
  HERO_VISUAL_HORIZONTAL_SCALE,
  HERO_VISUAL_OFFSET_X,
  PORTRAIT_FORMATION,
  applyBattleFormationScale,
  battleCharacterHorizontalScaleForViewport,
  battleCharacterScaleForViewport,
  battleCharacterVisualOffsetXForViewport,
  battleFormationForViewport,
  battleWorldCropForViewport,
  heroVisualScale
} from '../scripts/battle-formation-scale-v1.mjs';

const build=fs.readFileSync(new URL('../scripts/build-static.mjs',import.meta.url),'utf8');

const mobileStages=[
  {screen:'390x844',width:390,height:739},
  {screen:'393x852',width:393,height:747},
  {screen:'430x932',width:430,height:827}
];

function flatten(formation){return [...formation.player,...formation.enemy];}
function approx(actual,expected,tolerance=1e-6,message=''){
  assert.ok(Math.abs(actual-expected)<=tolerance,message||`${actual} ~= ${expected}`);
}

test('portrait formation stays inside the actual cover-cropped world at all target phones',()=>{
  for(const viewport of mobileStages){
    const crop=battleWorldCropForViewport(viewport.width,viewport.height);
    const formation=battleFormationForViewport(viewport.width,viewport.height);
    assert.ok(crop.width<PORTRAIT_FORMATION.compactCropWidth,`${viewport.screen} must select compact formation from world crop`);
    for(const [index,point] of flatten(formation).entries()){
      assert.ok(point.x>=crop.left&&point.x<=crop.right,`${viewport.screen} slot ${index+1} x must stay in crop`);
      assert.ok(point.y>=crop.top&&point.y<=crop.bottom,`${viewport.screen} slot ${index+1} y must stay in crop`);
    }
    approx(formation.player[3].x-crop.left,PORTRAIT_FORMATION.edgeInset);
    approx(crop.right-formation.enemy[3].x,PORTRAIT_FORMATION.edgeInset);
  }
});

test('portrait formation has six unique slots per side, compact rows and mirrored columns',()=>{
  const formation=battleFormationForViewport(390,739);
  for(const team of ['player','enemy']){
    assert.equal(new Set(formation[team].map(p=>`${p.x.toFixed(3)}:${p.y}`)).size,6);
    const front=formation[team].slice(0,3),back=formation[team].slice(3);
    assert.deepEqual(front.map((p,i)=>p.y-(i?front[i-1].y:front[0].y)),[0,195,195]);
    assert.deepEqual(back.map((p,i)=>p.y-(i?back[i-1].y:back[0].y)),[0,195,195]);
    for(let row=0;row<3;row++)approx(Math.abs(front[row].x-back[row].x),PORTRAIT_FORMATION.columnGap);
  }
  assert.deepEqual(PORTRAIT_FORMATION.rows,[285,480,675]);
  assert.equal(PORTRAIT_FORMATION.columnGap,114);
  // Final live 430x932 bounds showed 0-6px same-row clearance and Linh Dong clipping.
  // Keep the reference-fit vertical spread, add 6 world px between columns and 10 world px
  // of rear-edge clearance while mobile character scale is normalized from live alpha bounds.
  assert.equal(PORTRAIT_FORMATION.edgeInset,63);
  assert.equal(PORTRAIT_FORMATION.frontlineYOffset,22);
  assert.equal(PORTRAIT_FORMATION.edgeInset+PORTRAIT_FORMATION.columnGap,177);
  assert.equal(PORTRAIT_FORMATION.rows[1]-PORTRAIT_FORMATION.rows[0],195);
  assert.equal(PORTRAIT_FORMATION.rows[2]-PORTRAIT_FORMATION.rows[1],195);
  for(let i=0;i<6;i++){
    approx(formation.player[i].x+formation.enemy[i].x,BATTLE_WORLD.width);
    if(i<3){
      const baseY=PORTRAIT_FORMATION.rows[i];
      approx((formation.player[i].y+formation.enemy[i].y)/2,baseY);
      approx(baseY-formation.player[i].y,PORTRAIT_FORMATION.frontlineYOffset);
      approx(formation.enemy[i].y-baseY,PORTRAIT_FORMATION.frontlineYOffset);
    }else{
      assert.equal(formation.player[i].y,formation.enemy[i].y);
    }
  }
});

test('portrait opposing frontline gains symmetric combat-lane separation without changing locked horizontal geometry',()=>{
  for(const viewport of mobileStages){
    const formation=battleFormationForViewport(viewport.width,viewport.height);
    for(let row=0;row<3;row++){
      const playerFront=formation.player[row],enemyFront=formation.enemy[row];
      const baselineDistance=Math.abs(enemyFront.x-playerFront.x);
      const currentDistance=Math.hypot(enemyFront.x-playerFront.x,enemyFront.y-playerFront.y);
      assert.equal(Math.abs(enemyFront.y-playerFront.y),PORTRAIT_FORMATION.frontlineYOffset*2);
      assert.ok(currentDistance>baselineDistance,viewport.screen+` row ${row+1} opposing frontline distance must increase over the vertically-coincident baseline`);
      approx(Math.abs(formation.player[row].x-formation.player[row+3].x),PORTRAIT_FORMATION.columnGap);
      approx(Math.abs(formation.enemy[row].x-formation.enemy[row+3].x),PORTRAIT_FORMATION.columnGap);
      assert.equal(formation.player[row+3].y,PORTRAIT_FORMATION.rows[row]);
      assert.equal(formation.enemy[row+3].y,PORTRAIT_FORMATION.rows[row]);
    }
  }
});

test('desktop formation and global desktop scale are unchanged',()=>{
  const formation=battleFormationForViewport(1280,528);
  assert.equal(formation,DESKTOP_FORMATION);
  assert.deepEqual(DESKTOP_FORMATION,{
    player:[{x:535,y:340},{x:535,y:520},{x:535,y:700},{x:365,y:340},{x:365,y:520},{x:365,y:700}],
    enemy:[{x:1065,y:340},{x:1065,y:520},{x:1065,y:700},{x:1235,y:340},{x:1235,y:520},{x:1235,y:700}]
  });
  assert.equal(BATTLE_CHARACTER_SCALE.desktop,0.74);
  assert.equal(battleCharacterScaleForViewport('dinh_loi',1280,528),0.74);
});

test('measured special-hero corrections use rendered visible bounds, not atlas canvas size',()=>{
  const diagonal=(width,height)=>Math.hypot(width,height);
  const normalTarget=121.4*(BATTLE_CHARACTER_SCALE.portrait/0.57);
  // Live Canvas alpha bounds captured before the final correction.
  const linhBefore={width:128.6,height:102,override:0.719,globalScale:0.57};
  const bachBefore={width:100.8,height:156.2,override:0.828,globalScale:0.57};
  const portraitRatio=BATTLE_CHARACTER_SCALE.portrait/linhBefore.globalScale;
  const linhRatio=portraitRatio*(HERO_VISUAL_SCALE.hero_splus_linh_dong/linhBefore.override);
  const predictedLinh=diagonal(
    linhBefore.width*linhRatio*HERO_VISUAL_HORIZONTAL_SCALE.hero_splus_linh_dong,
    linhBefore.height*linhRatio
  );
  const predictedBach=diagonal(
    bachBefore.width*(BATTLE_CHARACTER_SCALE.portrait/bachBefore.globalScale)*(HERO_VISUAL_SCALE.hero_splus_bach_dien/bachBefore.override),
    bachBefore.height*(BATTLE_CHARACTER_SCALE.portrait/bachBefore.globalScale)*(HERO_VISUAL_SCALE.hero_splus_bach_dien/bachBefore.override)
  );
  assert.ok(predictedLinh/normalTarget>1.00&&predictedLinh/normalTarget<1.06,'Linh Dong should keep adult-scale visual presence without the wide-idle crop');
  assert.ok(predictedBach/normalTarget>1.10&&predictedBach/normalTarget<1.16,'Bach Dien should recover visual presence without returning to the oversized baseline');

  // Project the exact previously measured 390/393/430 alpha bounds through the
  // final mobile geometry. This preserves the requested 0.57 height, uses a
  // 0.525-equivalent horizontal scale, and nudges only Linh Dong 4.25 world px inward.
  const measured=[
    {screen:'390x844',width:390,height:739,linhLeft:-14.126339030687177,linhRightClear:291.191662755533,frontLeft:93.65046310923367},
    {screen:'393x852',width:393,height:747,linhLeft:-14.279283833107314,linhRightClear:292.5935362982068,frontLeft:94.66424765425349},
    {screen:'430x932',width:430,height:827,linhLeft:-19.3192016530831,linhRightClear:319.42565244536473,frontLeft:104.8022748992665}
  ];
  const oldEdge=48,oldGap=108,oldGlobal=0.57,oldLinh=0.50;
  const xRatio=(BATTLE_CHARACTER_SCALE.portrait*HERO_VISUAL_SCALE.hero_splus_linh_dong*HERO_VISUAL_HORIZONTAL_SCALE.hero_splus_linh_dong)/(oldGlobal*oldLinh);
  const normalRatio=BATTLE_CHARACTER_SCALE.portrait/oldGlobal;
  for(const row of measured){
    const worldScale=row.height/BATTLE_WORLD.height;
    const oldBack=oldEdge*worldScale,newBack=PORTRAIT_FORMATION.edgeInset*worldScale;
    const oldFront=(oldEdge+oldGap)*worldScale,newFront=(PORTRAIT_FORMATION.edgeInset+PORTRAIT_FORMATION.columnGap)*worldScale;
    const inward=battleCharacterVisualOffsetXForViewport('hero_splus_linh_dong','player',row.width,row.height)*worldScale;
    const currentLeft=newBack+inward+(row.linhLeft-oldBack)*xRatio;
    const oldRight=row.width-row.linhRightClear;
    const currentRight=newBack+inward+(oldRight-oldBack)*xRatio;
    const currentFrontLeft=newFront+(row.frontLeft-oldFront)*normalRatio;
    assert.ok(currentLeft>1.5,`${row.screen} Linh Dong visible alpha must clear the left crop with safety margin, got ${currentLeft}`);
    assert.ok(currentFrontLeft-currentRight>1.5,`${row.screen} Linh Dong must keep >1.5px alpha-box clearance from the front-column hero`);
  }

  assert.deepEqual(Object.keys(HERO_VISUAL_SCALE).sort(),['default','hero_splus_bach_dien','hero_splus_linh_dong']);
  assert.equal(heroVisualScale('linh_dong'),0.57);
  assert.equal(heroVisualScale('hero_splus_bach_dien'),0.61);
  assert.equal(heroVisualScale('dinh_loi'),1);
  assert.equal(BATTLE_CHARACTER_SCALE.portrait,0.52);
  assert.ok(Math.abs(HERO_VISUAL_HORIZONTAL_SCALE.hero_splus_linh_dong-(0.525/0.57))<1e-9);
  assert.equal(HERO_VISUAL_OFFSET_X.hero_splus_linh_dong,4.25);
  assert.ok(Math.abs(
    battleCharacterScaleForViewport('hero_splus_linh_dong',390,739)*
      battleCharacterHorizontalScaleForViewport('hero_splus_linh_dong',390,739) -
    BATTLE_CHARACTER_SCALE.portrait*0.525
  )<1e-9);
  assert.equal(battleCharacterHorizontalScaleForViewport('hero_splus_linh_dong',1280,800),1);
  assert.equal(battleCharacterVisualOffsetXForViewport('hero_splus_linh_dong','player',390,739),4.25);
  assert.equal(battleCharacterVisualOffsetXForViewport('hero_splus_linh_dong','enemy',390,739),-4.25);
  assert.equal(battleCharacterVisualOffsetXForViewport('hero_splus_linh_dong','player',1280,800),0);
});

test('final runtime patch removes stale formation breakpoints and all stacked scale owners',()=>{
  const fixture=`  const POSITIONS = Object.freeze({
    player: [ { x: 535, y: 340 } ],
    enemy: [ { x: 1065, y: 340 } ],
  });
  const MOBILE_POSITIONS = Object.freeze({
    player: [
      { x: 650, y: 340 }, { x: 650, y: 520 }, { x: 650, y: 700 },
      { x: 470, y: 340 }, { x: 470, y: 520 }, { x: 470, y: 700 },
    ],
    enemy: [
      { x: 950, y: 340 }, { x: 950, y: 520 }, { x: 950, y: 700 },
      { x: 1130, y: 340 }, { x: 1130, y: 520 }, { x: 1130, y: 700 },
    ],
  });
    const battleCompactViewport = innerWidth < 600 || (innerHeight > innerWidth && innerWidth <= 1180);
    const position = (battleCompactViewport ? MOBILE_POSITIONS : POSITIONS)[hero.team][hero.slot];
    const sourceSeed = Array.from(String(unit.sourceId || unit.id || "")).reduce((acc, ch) => ((acc * 33) ^ ch.charCodeAt(0)) >>> 0, 5381);
    const importedIdentity = Boolean(unit.visualSource && unit.visualSource !== "hon-viet");
    const identityScale = (innerWidth < 600 ? 0.57 : 0.74) * (importedIdentity ? (0.94 + (sourceSeed % 13) / 100) : 1);
const identityScale=(innerWidth<600?0.52:0.74);
const identityScale=(innerWidth<600?0.52:0.74);
context.translate(unit.x + hurtJitter + dodgeRecoilX, unit.y + idleBob + runBob);
context.scale(depthScale * identityScale, depthScale * identityScale);`;
  const patched=applyBattleFormationScale(fixture);
  assert.match(patched,/function battleFormationForViewport\(/);
  assert.match(patched,/function battleCharacterScale\(/);
  assert.match(patched,/frontlineYOffset:22/);
  assert.match(patched,/const HERO_VISUAL_SCALE=Object\.freeze\(\{default:1,hero_splus_linh_dong:0\.57,hero_splus_bach_dien:0\.61\}\)/);
  assert.match(patched,/hero_splus_linh_dong:0\.9210526316/);
  assert.match(patched,/battleCharacterVisualOffsetX\(unit\)/);
  assert.match(patched,/battleCharacterHorizontalScale\(unit\)/);
  assert.match(patched,/context\.translate\(unit\.x \+ hurtJitter \+ dodgeRecoilX \+ battleCharacterVisualOffsetX\(unit\), unit\.y \+ idleBob \+ runBob\);/);
  assert.match(patched,/context\.scale\(depthScale \* identityScale \* battleCharacterHorizontalScale\(unit\), depthScale \* identityScale\);/);
  assert.equal((patched.match(/function battleCharacterScale\(unit\)/g)||[]).length,1);
  assert.equal((patched.match(/identityScale\s*=\s*battleCharacterScale\(unit\)/g)||[]).length,3);
  assert.doesNotMatch(patched,/MOBILE_POSITIONS/);
  assert.doesNotMatch(patched,/battleCompactViewport/);
  assert.doesNotMatch(patched,/sourceSeed|importedIdentity/);
  assert.doesNotMatch(patched,/innerWidth\s*<\s*600\s*\?\s*0\.(?:52|57)\s*:\s*0\.74/);
  assert.equal(applyBattleFormationScale(patched),patched,'patch must be idempotent');
});

test('build applies the scoped layout owner after reference presentation but before battle payload sync',()=>{
  const refIndex=build.indexOf("await import('./combat-reference-presentation-v1.mjs');");
  const layoutIndex=build.indexOf("await import('./battle-formation-scale-v1.mjs');");
  const syncIndex=build.indexOf('let embeddedIndex = readFileSync');
  assert.ok(refIndex>=0&&layoutIndex>refIndex,'layout owner must supersede the late reference formation/scale patch');
  assert.ok(syncIndex<0||layoutIndex<syncIndex,'layout owner must run before any embedded payload sync');
});
