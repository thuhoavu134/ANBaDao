import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  DINH_LOI_MOBILE_SCALE,
  DINH_LOI_MOBILE_SOURCES,
  BATTLE_FALLBACK_MOBILE_SOURCES,
  ONG_PHO_MOBILE_SOURCES,
  LUC_ANH_MOBILE_SOURCES,
  dinhLoiMobileVariantPath,
  patchBattleMobilePressure
} from '../scripts/battle-mobile-pressure-v1.mjs';

const MiB=1024*1024;

test('eight eager fallback atlases drop from about 48 MiB decoded to about 12 MiB on mobile',()=>{
  assert.equal(BATTLE_FALLBACK_MOBILE_SOURCES.length,8);
  const full=[1536*1024,1536*1024,1536*1024,1536*1024,1536*1024,1774*887,1774*887,1536*1024].reduce((n,p)=>n+p*4,0);
  assert.ok(full/1024/1024>47 && full/1024/1024<49);
  assert.ok(full*.25/1024/1024<13);
});

test('Ong Pho authored battle sheets fall below 10 MiB decoded after mobile half-scale',()=>{
  assert.equal(ONG_PHO_MOBILE_SOURCES.length,6);
  const full=[2400*945,1920*810,1200*270,1920*675,1920*1350,1920*1080].reduce((n,p)=>n+p*4,0);
  assert.ok(full/1024/1024>38 && full/1024/1024<39);
  assert.ok(full*.25/1024/1024<10);
});

test('Luc Anh mobile derivatives quarter decoded character/VFX residency',()=>{
  assert.equal(LUC_ANH_MOBILE_SOURCES.length,11);
  const character=1920*1920*4;
  const vfx=2560*1760*4;
  assert.ok(character/4<4*MiB);
  assert.ok(vfx/4<5*MiB);
});

test('Đình Lôi mobile derivatives reduce each native 2x atlas to one-quarter decoded bytes',()=>{
  assert.equal(DINH_LOI_MOBILE_SCALE,.5);
  assert.equal(DINH_LOI_MOBILE_SOURCES.length,14);
  const desktop=3840*2160*4;
  const mobile=1920*1080*4;
  assert.equal(mobile,desktop/4);
  assert.ok(mobile<8*MiB);
  assert.equal(dinhLoiMobileVariantPath('assets/characters/dinh-loi/idle-atlas.png'),'assets/characters/dinh-loi/mobile-v1/idle-atlas.webp');
});

test('battle low-memory patch lowers canvas pressure, caps visual FPS and defers shield atlas until needed',()=>{
  const source=`const view = { width: 1, height: 1, scale: 1, offsetX: 0, offsetY: 0, dpr: 1 };
const ambientFireflies = Array.from({ length: 24 }, (_, index) => ({}));
let lastFrame = performance.now();
function resizeCanvas() {
  const rect = dom.viewport.getBoundingClientRect();
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const width = Math.max(1, Math.round(rect.width));
  const height = Math.max(1, Math.round(rect.height));
}
function burst(x, y, color, amount = 15, type = "spark") {
  const count = REDUCED_MOTION ? Math.ceil(amount / 4) : amount;
  for (let index = 0; index < count; index += 1) particles.push({x,y,color,type});
}
function drawBackground(context,time){ context.fillRect(0,0,WORLD.width,WORLD.height); }
const HERO_ATLAS_SOURCES = Object.freeze({
    [TEAM_PLAYER]: "assets/battle-runtime/embedded-03.webp",
    [TEAM_ENEMY]: "assets/battle-runtime/embedded-04.webp"
  });
const HERO_ATLASES = Object.fromEntries(Object.entries(HERO_ATLAS_SOURCES).map(([team, source]) => {
    const image = new Image();
    image.decoding = "async";
    image.src = source;
    return [team, image];
  }));
const POSE_ATLAS_SOURCES = Object.freeze({
    guardian: "assets/battle-runtime/embedded-05.webp",
    ranger: "assets/battle-runtime/embedded-06.webp",
    healer: "assets/battle-runtime/embedded-07.webp",
    striker: "assets/battle-runtime/embedded-08.webp",
    duelist: "assets/battle-runtime/embedded-09.webp",
    mystic: "assets/battle-runtime/embedded-10.webp"
  });
const POSE_ATLASES = Object.fromEntries(Object.entries(POSE_ATLAS_SOURCES).map(([archetype, source]) => {
    const image = new Image();
    image.decoding = "async";
    image.src = source;
    return [archetype, image];
  }));
const ONG_PHO_ATTACK_SOURCE = "assets/battle-runtime/embedded-11.png";
  const ONG_PHO_IDLE_SOURCE = "assets/battle-runtime/embedded-12.png";
  const ONG_PHO_HIT_SOURCE = "assets/battle-runtime/embedded-13.png";
  const ONG_PHO_FALL_SOURCE = "assets/battle-runtime/embedded-14.png";
  const ONG_PHO_SKILL1_SOURCE = "assets/battle-runtime/embedded-15.png";
  const ONG_PHO_ULTIMATE_SOURCE = "assets/characters/ong-pho/ultimate-sheet-64-alpha-clean-v310.png";
  function drawOngPhoGifHero(){
    { const cellW=240, cellH=135; }
    { const cellW=240, cellH=135; }
    const cellW=240, cellH=135;
  }
  function actorShadowOwners(){
    let key="idle",attacking=false,skill1=false,ultimate=false,strike=0;const context={};
    context.shadowBlur = (attacking || skill1 || ultimate) ? 12 : 5;
    context.shadowBlur=["attack","skill1","ultimate"].includes(key)?14:5;
    context.shadowBlur=["attack","skill1","ultimate"].includes(key)?15:5;
    context.shadowBlur=['attack','ultimate'].includes(key)?14:5;
    context.shadowBlur=['attack','ultimate'].includes(key)?14:5;
    context.shadowBlur = 8 + strike * 16;
  }
const LUC_ANH_ID="luc_anh", LUC_ANH_COLS=8, LUC_ANH_CELL_W=240, LUC_ANH_CELL_H=240;
const LUC_ANH_ASSET_BASE="assets/characters/luc-anh/";
const LUC_ANH_META=Object.freeze({
 idle:{file:"idle-atlas.webp",frames:64,w:240,h:240,ms:72,loop:true},
 attack:{file:"basic-atlas.webp",frames:64,w:240,h:240,ms:38},
 basicProjectile:{file:"basic_projectile-atlas.webp",frames:64,w:320,h:220,ms:28}
});
function lucAnhImage(key){const m=LUC_ANH_META[key];if(!m)return null;const rows=Math.ceil(m.frames/LUC_ANH_COLS);const clip={src:LUC_ANH_ASSET_BASE+m.file,cols:LUC_ANH_COLS,rows,cellW:m.w,cellH:m.h,atlasWidth:LUC_ANH_COLS*m.w,atlasHeight:rows*m.h};return BATTLE_NATIVE_ATLAS_CACHE.ensure('luc-anh:'+key,clip)}
function drawLucAnhAtlas(context,key,frame,x,y,width,height,options={}){const m=LUC_ANH_META[key],image=LUC_ANH_IMAGES[key];if(!m||!image?.complete||image.naturalWidth<2)return false;const sx=(frame%LUC_ANH_COLS)*m.w,sy=Math.floor(frame/LUC_ANH_COLS)*m.h;context.save();context.translate(x,y);if(options.flip)context.scale(-1,1);context.globalAlpha=options.alpha??1;if(options.screen)context.globalCompositeOperation="screen";context.drawImage(image,sx,sy,m.w,m.h,-width*.5,-height+(options.baseline??46),width,height);context.restore();return true;}
const DINH_LOI_ID="dinh_loi", DINH_LOI_FRAMES=64, DINH_LOI_COLS=8, DINH_LOI_CELL_W=480, DINH_LOI_CELL_H=270;
const DINH_LOI_ASSET_BASE="assets/characters/dinh-loi/";
const DINH_LOI_ASSET_NAMES=Object.freeze({idle:"idle-atlas.png",skill1Shield:"skill1-shield-atlas.png",ultimateVfx:"ultimate-vfx-atlas.png",ultimateImpact:"ultimate-impact-atlas.png"});
const DINH_LOI_CLIPS=Object.fromEntries(Object.entries(DINH_LOI_ASSET_NAMES).map(([key,file])=>{const portrait=key==='ultimateVfx'||key==='ultimateImpact';const cellW=portrait?270:480,cellH=portrait?480:270;return [key,{src:DINH_LOI_ASSET_BASE+file,cols:8,rows:8,cellW,cellH,atlasWidth:cellW*8,atlasHeight:cellH*8}]}));
function drawDinhLoiPersistentShields(context,time){
    const image=DINH_LOI_IMAGES.skill1Shield;if(!image?.complete||image.naturalWidth<2)return;const frame=dinhLoiFrame(time,true);
    for(const unit of living(TEAM_PLAYER).concat(living(TEAM_ENEMY))){if(!(unit.statuses||[]).some(s=>s.type==="guard"&&s.sourceHeroId===DINH_LOI_ID))continue;drawDinhLoiAtlasFrame(context,image,frame,unit.x,unit.y,330,186,{baseline:93,screen:true,alpha:.82});}
  }
function drawGeneratedHero(context, unit, time, progress) {
    const sameAppearanceBefore = units.some((candidate) =>
      candidate !== unit && candidate.team === unit.team && candidate.archetype === unit.archetype && candidate.slot < unit.slot
    );
    const poseAtlas = sameAppearanceBefore ? null : POSE_ATLASES[unit.archetype];
    const usePoseAtlas = Boolean(poseAtlas?.complete && poseAtlas.naturalWidth > 1);
    const atlas = usePoseAtlas ? poseAtlas : HERO_ATLASES[unit.team];
    return Boolean(atlas);
  }
function render(time) {
    resizeCanvas();
    const delta = Math.min(0.05, Math.max(0, (time - lastFrame) / 1000));
    lastFrame = time;
    updateEffects(delta);
    drawBackground(ctx,time);
    renderBattlefieldZone();
    units.forEach(unit=>drawUnit(ctx,unit,time));
    dom.canvas.dataset.projectiles = projectiles.map((effect) => effect.kind).join(",");
    dom.canvas.dataset.combatEffects = combatEffects.map((effect) => effect.kind).join(",");
    dom.canvas.dataset.activeStates = units.filter((unit)=>unit.state!=="idle").map((unit)=>unit.id+":"+unit.state).join(",");
    dom.canvas.dataset.poseAtlases = Object.values(POSE_ATLASES).filter((image) => image.complete && image.naturalWidth > 1).length.toString();
    dom.canvas.dataset.playbackRate = state.speed.toString();
    dom.canvas.dataset.cameraZoom = cameraZoom.toFixed(3);
    dom.canvas.dataset.cameraFlash = cameraFlash.toFixed(3);
    requestAnimationFrame(render);
  }
const qaApi={getPoseAtlasStatus: () => Object.fromEntries(Object.entries(POSE_ATLASES).map(([key, image]) => [key, Boolean(image.complete && image.naturalWidth > 1)])), other:true};
`;
  const patched=patchBattleMobilePressure(source,{
    'assets/battle-runtime/embedded-03.webp':{src:'assets/battle-runtime/mobile-v1/embedded-03.webp',width:768,height:512,scale:.5},
    'assets/battle-runtime/embedded-04.webp':{src:'assets/battle-runtime/mobile-v1/embedded-04.webp',width:768,height:512,scale:.5},
    'assets/battle-runtime/embedded-05.webp':{src:'assets/battle-runtime/mobile-v1/embedded-05.webp',width:768,height:512,scale:.5},
    'assets/battle-runtime/embedded-06.webp':{src:'assets/battle-runtime/mobile-v1/embedded-06.webp',width:768,height:512,scale:.5},
    'assets/battle-runtime/embedded-07.webp':{src:'assets/battle-runtime/mobile-v1/embedded-07.webp',width:768,height:512,scale:.5},
    'assets/battle-runtime/embedded-08.webp':{src:'assets/battle-runtime/mobile-v1/embedded-08.webp',width:887,height:444,scale:.5},
    'assets/battle-runtime/embedded-09.webp':{src:'assets/battle-runtime/mobile-v1/embedded-09.webp',width:887,height:444,scale:.5},
    'assets/battle-runtime/embedded-10.webp':{src:'assets/battle-runtime/mobile-v1/embedded-10.webp',width:768,height:512,scale:.5},
    'assets/battle-runtime/embedded-11.png':{src:'assets/battle-runtime/mobile-v1/embedded-11.webp',width:1200,height:473,scale:.5},
    'assets/battle-runtime/embedded-12.png':{src:'assets/battle-runtime/mobile-v1/embedded-12.webp',width:960,height:405,scale:.5},
    'assets/battle-runtime/embedded-13.png':{src:'assets/battle-runtime/mobile-v1/embedded-13.webp',width:600,height:135,scale:.5},
    'assets/battle-runtime/embedded-14.png':{src:'assets/battle-runtime/mobile-v1/embedded-14.webp',width:960,height:338,scale:.5},
    'assets/battle-runtime/embedded-15.png':{src:'assets/battle-runtime/mobile-v1/embedded-15.webp',width:960,height:675,scale:.5},
    'assets/characters/ong-pho/ultimate-sheet-64-alpha-clean-v310.png':{src:'assets/characters/ong-pho/mobile-v1/ultimate-sheet-64-alpha-clean-v310.webp',width:960,height:540,scale:.5},
    'assets/characters/luc-anh/idle-atlas.webp':{src:'assets/characters/luc-anh/mobile-v1/idle-atlas.webp',width:960,height:960,scale:.5},
    'assets/characters/luc-anh/basic-atlas.webp':{src:'assets/characters/luc-anh/mobile-v1/basic-atlas.webp',width:960,height:960,scale:.5},
    'assets/characters/luc-anh/basic_projectile-atlas.webp':{src:'assets/characters/luc-anh/mobile-v1/basic_projectile-atlas.webp',width:1280,height:880,scale:.5},
    'assets/characters/dinh-loi/idle-atlas.png':{src:'assets/characters/dinh-loi/mobile-v1/idle-atlas.webp',width:1920,height:1080,scale:.5},
    'assets/characters/dinh-loi/skill1-shield-atlas.png':{src:'assets/characters/dinh-loi/mobile-v1/skill1-shield-atlas.webp',width:1920,height:1080,scale:.5},
    'assets/characters/dinh-loi/ultimate-vfx-atlas.png':{src:'assets/characters/dinh-loi/mobile-v1/ultimate-vfx-atlas.webp',width:1080,height:1920,scale:.5},
    'assets/characters/dinh-loi/ultimate-impact-atlas.png':{src:'assets/characters/dinh-loi/mobile-v1/ultimate-impact-atlas.webp',width:1080,height:1920,scale:.5}
  });
  assert.match(patched,/__HV_BATTLE_LOW_MEMORY/);
  assert.match(patched,/__HV_BATTLE_MAX_BACKING_PIXELS=1600000/);
  assert.match(patched,/Math\.sqrt\(__HV_BATTLE_MAX_BACKING_PIXELS\/Math\.max\(1,width\*height\)\)/);
  assert.match(patched,/Math\.min\(devicePixelRatio \|\| 1,__HV_BATTLE_LOW_MEMORY\?Math\.min\(1\.5,__hvPixelDpr\):2\)/);
  assert.match(patched,/__hvBattlePaintAt/);
  assert.match(patched,/1000\/30/);
  assert.match(patched,/mobile-v1\/idle-atlas\.webp/);
  assert.match(patched,/__hvBattleFallbackSrc/);
  assert.match(patched,/mobile-v1\/embedded-03\.webp/);
  assert.match(patched,/mobile-v1\/embedded-11\.webp/);
  assert.match(patched,/__HV_ONG_PHO_CELL_SCALE/);
  assert.match(patched,/__HV_LUC_ANH_MOBILE_ATLASES/);
  assert.match(patched,/mobile-v1\/idle-atlas\.webp/);
  assert.match(patched,/const scale=mobile\?\.scale\|\|1/);
  assert.match(patched,/m\.w\*scale/);
  assert.match(patched,/__hvFallbackImage/);
  assert.doesNotMatch(patched,/Object\.fromEntries\(Object\.entries\(HERO_ATLAS_SOURCES\).*new Image/s);
  assert.match(patched,/__HV_BATTLE_LOW_MEMORY&&unit\.state!=="run"&&unit\.state!=="attack"/);
  assert.match(patched,/__HV_FALLBACK_IMAGES\.get\(source\)/);
  assert.match(patched,/Math\.min\(12,Math\.ceil\(amount\*\.45\)\)/);
  assert.match(patched,/72-particles\.length/);
  assert.match(patched,/function __hvDrawBattleBackground/);
  assert.match(patched,/__HV_BATTLE_BG_SCALE=__HV_BATTLE_LOW_MEMORY\?\.75:1/);
  assert.match(patched,/__HV_BATTLE_BG_REFRESH_MS=__HV_BATTLE_LOW_MEMORY\?250:0/);
  assert.match(patched,/__hvDrawBattleBackground\(ctx,time\)/);
  assert.match(patched,/__hvZoneHudAt/);
  assert.match(patched,/time-__hvZoneHudAt>=250/);
  assert.match(patched,/__hvTelemetryAt/);
  assert.match(patched,/time-__hvTelemetryAt>=250/);
  assert.match(patched,/context\.shadowBlur = __HV_BATTLE_LOW_MEMORY \? 0 : \(\(attacking \|\| skill1 \|\| ultimate\) \? 12 : 5\)/);
  assert.match(patched,/context\.shadowBlur=__HV_BATTLE_LOW_MEMORY\?0:\(\["attack","skill1","ultimate"\]\.includes\(key\)\?14:5\)/);
  assert.match(patched,/context\.shadowBlur = __HV_BATTLE_LOW_MEMORY \? 0 : 8 \+ strike \* 16/);

  const shield=patched.slice(patched.indexOf('function drawDinhLoiPersistentShields'),patched.indexOf('function render'));
  assert.ok(shield.indexOf('const guarded=') < shield.indexOf('DINH_LOI_IMAGES.skill1Shield'));
});

test('static pipeline applies battle mobile after final battle owners and before iframe sync',()=>{
  const build=readFileSync(new URL('../scripts/build-static.mjs',import.meta.url),'utf8');
  const result=build.indexOf("await import('./result-character-motion-v1.mjs');");
  const mobile=build.indexOf('await buildBattleMobilePressure(root);');
  const campaign=build.indexOf('await installCampaignMobileAtlases(root);');
  const sync=build.indexOf('let embeddedIndex = readFileSync');
  assert.ok(result>=0 && result<mobile && mobile<campaign && campaign<sync,{result,mobile,campaign,sync});
});
