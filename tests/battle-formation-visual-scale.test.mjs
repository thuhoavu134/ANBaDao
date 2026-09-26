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

test('portrait formation restores the approved legacy mobile anchors and stays inside every target crop',()=>{
  const expected={
    player:[
      {x:720,y:340},{x:720,y:520},{x:720,y:700},
      {x:630,y:340},{x:630,y:520},{x:630,y:700}
    ],
    enemy:[
      {x:880,y:340},{x:880,y:520},{x:880,y:700},
      {x:970,y:340},{x:970,y:520},{x:970,y:700}
    ]
  };
  for(const viewport of mobileStages){
    const crop=battleWorldCropForViewport(viewport.width,viewport.height);
    const formation=battleFormationForViewport(viewport.width,viewport.height);
    assert.ok(crop.width<PORTRAIT_FORMATION.compactCropWidth,`${viewport.screen} must select compact formation from world crop`);
    assert.deepEqual(formation,expected,`${viewport.screen} must keep the approved old mobile formation`);
    for(const [index,point] of flatten(formation).entries()){
      assert.ok(point.x>=crop.left&&point.x<=crop.right,`${viewport.screen} slot ${index+1} x must stay in crop`);
      assert.ok(point.y>=crop.top&&point.y<=crop.bottom,`${viewport.screen} slot ${index+1} y must stay in crop`);
    }
  }
});

test('portrait formation keeps old 90px team columns, 160px opposing frontline lane and mirrored rows',()=>{
  const formation=battleFormationForViewport(390,739);
  assert.deepEqual(PORTRAIT_FORMATION.rows,[340,520,700]);
  assert.equal(PORTRAIT_FORMATION.frontOffsetX,80);
  assert.equal(PORTRAIT_FORMATION.backOffsetX,170);
  for(const team of ['player','enemy']){
    assert.equal(new Set(formation[team].map(p=>`${p.x}:${p.y}`)).size,6);
    const front=formation[team].slice(0,3),back=formation[team].slice(3);
    assert.deepEqual(front.map(p=>p.y),[340,520,700]);
    assert.deepEqual(back.map(p=>p.y),[340,520,700]);
    for(let row=0;row<3;row++)assert.equal(Math.abs(front[row].x-back[row].x),90);
  }
  for(let row=0;row<3;row++){
    assert.equal(formation.enemy[row].x-formation.player[row].x,160);
    assert.equal(formation.player[row].y,formation.enemy[row].y);
    assert.equal(formation.player[row+3].y,formation.enemy[row+3].y);
    approx(formation.player[row].x+formation.enemy[row].x,BATTLE_WORLD.width);
    approx(formation.player[row+3].x+formation.enemy[row+3].x,BATTLE_WORLD.width);
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

  // Position-only restore: retain every approved character-scale correction unchanged.
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
  assert.match(patched,/rows:Object\.freeze\(\[340,520,700\]\)/);
  assert.match(patched,/frontOffsetX:80/);
  assert.match(patched,/backOffsetX:170/);
  assert.doesNotMatch(patched,/frontlineYOffset/);
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

test('formation owner accepts the unmodified baseline 0.52 generic scale without a pre-patch scale rewrite',()=>{
  const fixture=`  const POSITIONS = Object.freeze({
    player: [ { x: 535, y: 340 } ],
    enemy: [ { x: 1065, y: 340 } ],
  });
  const MOBILE_POSITIONS = Object.freeze({
    player: [
      { x: 720, y: 340 }, { x: 720, y: 520 }, { x: 720, y: 700 },
      { x: 630, y: 340 }, { x: 630, y: 520 }, { x: 630, y: 700 },
    ],
    enemy: [
      { x: 880, y: 340 }, { x: 880, y: 520 }, { x: 880, y: 700 },
      { x: 970, y: 340 }, { x: 970, y: 520 }, { x: 970, y: 700 },
    ],
  });
    const battleCompactViewport = innerWidth < 600 || (innerHeight > innerWidth && innerWidth <= 1180);
    const position = (battleCompactViewport ? MOBILE_POSITIONS : POSITIONS)[hero.team][hero.slot];
    const sourceSeed = Array.from(String(unit.sourceId || unit.id || "")).reduce((acc, ch) => ((acc * 33) ^ ch.charCodeAt(0)) >>> 0, 5381);
    const importedIdentity = Boolean(unit.visualSource && unit.visualSource !== "hon-viet");
    const identityScale = (innerWidth < 600 ? 0.52 : 0.74) * (importedIdentity ? (0.94 + (sourceSeed % 13) / 100) : 1);
const identityScale=(innerWidth<600?0.52:0.74);
const identityScale=(innerWidth<600?0.52:0.74);
context.translate(unit.x + hurtJitter + dodgeRecoilX, unit.y + idleBob + runBob);
context.scale(depthScale * identityScale, depthScale * identityScale);`;
  const patched=applyBattleFormationScale(fixture);
  assert.equal((patched.match(/identityScale\s*=\s*battleCharacterScale\(unit\)/g)||[]).length,3);
  assert.doesNotMatch(patched,/sourceSeed|importedIdentity/);
  assert.doesNotMatch(patched,/innerWidth\s*<\s*600\s*\?\s*0\.(?:52|57)\s*:\s*0\.74/);
});

test('build applies the scoped layout owner after reference presentation but before battle payload sync',()=>{
  const refIndex=build.indexOf("await import('./combat-reference-presentation-v1.mjs');");
  const layoutIndex=build.indexOf("await import('./battle-formation-scale-v1.mjs');");
  const syncIndex=build.indexOf('let embeddedIndex = readFileSync');
  assert.ok(refIndex>=0&&layoutIndex>refIndex,'layout owner must supersede the late reference formation/scale patch');
  assert.ok(syncIndex<0||layoutIndex<syncIndex,'layout owner must run before any embedded payload sync');
});
