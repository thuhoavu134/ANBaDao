import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, join } from 'node:path';

export const DINH_LOI_MOBILE_SCALE=0.5;
export const BATTLE_FALLBACK_MOBILE_SOURCES=Object.freeze([
  'assets/battle-runtime/embedded-03.webp','assets/battle-runtime/embedded-04.webp',
  'assets/battle-runtime/embedded-05.webp','assets/battle-runtime/embedded-06.webp',
  'assets/battle-runtime/embedded-07.webp','assets/battle-runtime/embedded-08.webp',
  'assets/battle-runtime/embedded-09.webp','assets/battle-runtime/embedded-10.webp'
]);
export const ONG_PHO_MOBILE_SOURCES=Object.freeze([
  'assets/battle-runtime/embedded-11.png','assets/battle-runtime/embedded-12.png',
  'assets/battle-runtime/embedded-13.png','assets/battle-runtime/embedded-14.png',
  'assets/battle-runtime/embedded-15.png','assets/characters/ong-pho/ultimate-sheet-64-alpha-clean-v310.png'
]);
export const DINH_LOI_MOBILE_SOURCES=Object.freeze([
  'assets/characters/dinh-loi/idle-atlas.png','assets/characters/dinh-loi/run-atlas.png',
  'assets/characters/dinh-loi/hit-atlas.png','assets/characters/dinh-loi/fall-atlas.png',
  'assets/characters/dinh-loi/basic-cast-atlas.png','assets/characters/dinh-loi/basic-projectile-atlas.png',
  'assets/characters/dinh-loi/basic-impact-atlas.png','assets/characters/dinh-loi/skill1-cast-atlas.png',
  'assets/characters/dinh-loi/skill1-wave-atlas.png','assets/characters/dinh-loi/skill1-impact-atlas.png',
  'assets/characters/dinh-loi/skill1-shield-atlas.png','assets/characters/dinh-loi/ultimate-cast-atlas.png',
  'assets/characters/dinh-loi/ultimate-vfx-atlas.png','assets/characters/dinh-loi/ultimate-impact-atlas.png'
]);

export function dinhLoiMobileVariantPath(src){
  const ext=extname(src);
  return join(dirname(src),'mobile-v1',basename(src,ext)+'.webp').replaceAll('\\','/');
}
function replaceOne(input,from,to,label){
  if(input.split(from).length!==2)throw new Error('Battle mobile patch missing/ambiguous '+label);
  return input.replace(from,()=>to);
}
export function patchBattleMobilePressure(input,variants={}){
  if(input.includes('/* HV_BATTLE_MOBILE_PRESSURE_V1 */'))return input;
  let html=input;
  html=replaceOne(html,'const view = { width: 1, height: 1, scale: 1, offsetX: 0, offsetY: 0, dpr: 1 };',`/* HV_BATTLE_MOBILE_PRESSURE_V1 */
  const __HV_BATTLE_LOW_MEMORY=(()=>{try{const n=navigator,ua=String(n?.userAgent||''),platform=String(n?.platform||''),touch=Number(n?.maxTouchPoints||0),memory=Number(n?.deviceMemory||0);return /iPad|iPhone|iPod/i.test(ua)||(platform==='MacIntel'&&touch>1)||(memory>0&&memory<=4);}catch(_){return false;}})();
  const view = { width: 1, height: 1, scale: 1, offsetX: 0, offsetY: 0, dpr: 1 };`,'low-memory profile');
  html=replaceOne(html,'const ambientFireflies = Array.from({ length: 24 }, (_, index) => ({','const ambientFireflies = Array.from({ length: __HV_BATTLE_LOW_MEMORY ? 10 : 24 }, (_, index) => ({','ambient particles');
  html=replaceOne(html,'const dpr = Math.min(devicePixelRatio || 1, 2);','const dpr = Math.min(devicePixelRatio || 1, __HV_BATTLE_LOW_MEMORY ? 1.5 : 2);','canvas dpr');
  html=replaceOne(html,'let lastFrame = performance.now();','let lastFrame = performance.now();\n  let __hvBattlePaintAt = lastFrame;','battle paint clock');
  html=replaceOne(html,'function render(time) {\n    resizeCanvas();',`function render(time) {
    if(__HV_BATTLE_LOW_MEMORY&&time-__hvBattlePaintAt<1000/30){requestAnimationFrame(render);return;}
    __hvBattlePaintAt=time;
    resizeCanvas();`,'render throttle');

  const mapping=JSON.stringify(variants);
  const fallbackHeroOld=`const HERO_ATLAS_SOURCES = Object.freeze({
    [TEAM_PLAYER]: "assets/battle-runtime/embedded-03.webp",
    [TEAM_ENEMY]: "assets/battle-runtime/embedded-04.webp"
  });`;
  const fallbackHeroNew=`const __HV_BATTLE_MOBILE_ATLASES=${mapping};
  const __hvBattleFallbackSrc=src=>__HV_BATTLE_LOW_MEMORY?(__HV_BATTLE_MOBILE_ATLASES[src]?.src||src):src;
  const HERO_ATLAS_SOURCES = Object.freeze({
    [TEAM_PLAYER]: __hvBattleFallbackSrc("assets/battle-runtime/embedded-03.webp"),
    [TEAM_ENEMY]: __hvBattleFallbackSrc("assets/battle-runtime/embedded-04.webp")
  });`;
  html=replaceOne(html,fallbackHeroOld,fallbackHeroNew,'fallback hero atlases');
  const fallbackPoseOld=`const POSE_ATLAS_SOURCES = Object.freeze({
    guardian: "assets/battle-runtime/embedded-05.webp",
    ranger: "assets/battle-runtime/embedded-06.webp",
    healer: "assets/battle-runtime/embedded-07.webp",
    striker: "assets/battle-runtime/embedded-08.webp",
    duelist: "assets/battle-runtime/embedded-09.webp",
    mystic: "assets/battle-runtime/embedded-10.webp"
  });`;
  const fallbackPoseNew=`const POSE_ATLAS_SOURCES = Object.freeze({
    guardian: __hvBattleFallbackSrc("assets/battle-runtime/embedded-05.webp"),
    ranger: __hvBattleFallbackSrc("assets/battle-runtime/embedded-06.webp"),
    healer: __hvBattleFallbackSrc("assets/battle-runtime/embedded-07.webp"),
    striker: __hvBattleFallbackSrc("assets/battle-runtime/embedded-08.webp"),
    duelist: __hvBattleFallbackSrc("assets/battle-runtime/embedded-09.webp"),
    mystic: __hvBattleFallbackSrc("assets/battle-runtime/embedded-10.webp")
  });`;
  html=replaceOne(html,fallbackPoseOld,fallbackPoseNew,'fallback pose atlases');
  const eagerHeroAtlases=`const HERO_ATLASES = Object.fromEntries(Object.entries(HERO_ATLAS_SOURCES).map(([team, source]) => {
    const image = new Image();
    image.decoding = "async";
    image.src = source;
    return [team, image];
  }));`;
  const lazyHeroAtlases=`const __HV_FALLBACK_IMAGES=new Map();
  function __hvFallbackImage(source){let image=__HV_FALLBACK_IMAGES.get(source);if(image)return image;image=new Image();image.decoding="async";image.src=source;__HV_FALLBACK_IMAGES.set(source,image);return image;}
  function __hvFallbackProxy(sources){return new Proxy({},{
    get(_target,key){const source=sources[key];return source?__hvFallbackImage(source):undefined;},
    ownKeys(){return Reflect.ownKeys(sources);},
    getOwnPropertyDescriptor(){return {enumerable:true,configurable:true};}
  });}
  const HERO_ATLASES=__hvFallbackProxy(HERO_ATLAS_SOURCES);`;
  html=replaceOne(html,eagerHeroAtlases,lazyHeroAtlases,'lazy fallback hero images');
  const eagerPoseAtlases=`const POSE_ATLASES = Object.fromEntries(Object.entries(POSE_ATLAS_SOURCES).map(([archetype, source]) => {
    const image = new Image();
    image.decoding = "async";
    image.src = source;
    return [archetype, image];
  }));`;
  const lazyPoseAtlases=`const POSE_ATLASES=__hvFallbackProxy(POSE_ATLAS_SOURCES);
  window.__HV_FALLBACK_CLEAR=()=>{for(const image of __HV_FALLBACK_IMAGES.values()){try{image.onload=null;image.onerror=null;image.removeAttribute("src")}catch(_){}}__HV_FALLBACK_IMAGES.clear();};
  window.addEventListener("pagehide",()=>window.__HV_FALLBACK_CLEAR?.(),{once:true});`;
  html=replaceOne(html,eagerPoseAtlases,lazyPoseAtlases,'lazy fallback pose images');
  const ongSourcesOld=`const ONG_PHO_ATTACK_SOURCE = "assets/battle-runtime/embedded-11.png";
  const ONG_PHO_IDLE_SOURCE = "assets/battle-runtime/embedded-12.png";
  const ONG_PHO_HIT_SOURCE = "assets/battle-runtime/embedded-13.png";
  const ONG_PHO_FALL_SOURCE = "assets/battle-runtime/embedded-14.png";
  const ONG_PHO_SKILL1_SOURCE = "assets/battle-runtime/embedded-15.png";
  const ONG_PHO_ULTIMATE_SOURCE = "assets/characters/ong-pho/ultimate-sheet-64-alpha-clean-v310.png";
  `;
  const ongSourcesNew=`const __HV_ONG_PHO_CELL_SCALE=__HV_BATTLE_LOW_MEMORY?.5:1;
  const ONG_PHO_ATTACK_SOURCE = __hvBattleFallbackSrc("assets/battle-runtime/embedded-11.png");
  const ONG_PHO_IDLE_SOURCE = __hvBattleFallbackSrc("assets/battle-runtime/embedded-12.png");
  const ONG_PHO_HIT_SOURCE = __hvBattleFallbackSrc("assets/battle-runtime/embedded-13.png");
  const ONG_PHO_FALL_SOURCE = __hvBattleFallbackSrc("assets/battle-runtime/embedded-14.png");
  const ONG_PHO_SKILL1_SOURCE = __hvBattleFallbackSrc("assets/battle-runtime/embedded-15.png");
  const ONG_PHO_ULTIMATE_SOURCE = __hvBattleFallbackSrc("assets/characters/ong-pho/ultimate-sheet-64-alpha-clean-v310.png");
  `;
  html=replaceOne(html,ongSourcesOld,ongSourcesNew,'Ong Pho mobile sources');
  const ongCell='const cellW=240, cellH=135';
  if(html.split(ongCell).length!==4)throw new Error('Battle mobile patch expected three Ong Pho cell declarations');
  html=html.replaceAll(ongCell,'const cellW=240*__HV_ONG_PHO_CELL_SCALE, cellH=135*__HV_ONG_PHO_CELL_SCALE');
  html=replaceOne(html,'const DINH_LOI_ID="dinh_loi", DINH_LOI_FRAMES=64, DINH_LOI_COLS=8, DINH_LOI_CELL_W=480, DINH_LOI_CELL_H=270;',`const __HV_DINH_LOI_MOBILE_ATLASES=${mapping};
  const DINH_LOI_ID="dinh_loi", DINH_LOI_FRAMES=64, DINH_LOI_COLS=8, DINH_LOI_CELL_W=__HV_BATTLE_LOW_MEMORY?240:480, DINH_LOI_CELL_H=__HV_BATTLE_LOW_MEMORY?135:270;`,'Dinh Loi cells');
  html=replaceOne(html,"const DINH_LOI_CLIPS=Object.fromEntries(Object.entries(DINH_LOI_ASSET_NAMES).map(([key,file])=>{const portrait=key==='ultimateVfx'||key==='ultimateImpact';const cellW=portrait?270:480,cellH=portrait?480:270;return [key,{src:DINH_LOI_ASSET_BASE+file,cols:8,rows:8,cellW,cellH,atlasWidth:cellW*8,atlasHeight:cellH*8}]}));",`const DINH_LOI_CLIPS=Object.fromEntries(Object.entries(DINH_LOI_ASSET_NAMES).map(([key,file])=>{const portrait=key==='ultimateVfx'||key==='ultimateImpact';const source=DINH_LOI_ASSET_BASE+file,mobile=__HV_BATTLE_LOW_MEMORY?__HV_DINH_LOI_MOBILE_ATLASES[source]:null;const cellW=mobile?(portrait?135:240):(portrait?270:480),cellH=mobile?(portrait?240:135):(portrait?480:270);return [key,{src:mobile?.src||source,cols:8,rows:8,cellW,cellH,atlasWidth:mobile?.width||cellW*8,atlasHeight:mobile?.height||cellH*8}]}));`,'Dinh Loi clips');
  const oldShield=`function drawDinhLoiPersistentShields(context,time){
    const image=DINH_LOI_IMAGES.skill1Shield;if(!image?.complete||image.naturalWidth<2)return;const frame=dinhLoiFrame(time,true);
    for(const unit of living(TEAM_PLAYER).concat(living(TEAM_ENEMY))){if(!(unit.statuses||[]).some(s=>s.type==="guard"&&s.sourceHeroId===DINH_LOI_ID))continue;drawDinhLoiAtlasFrame(context,image,frame,unit.x,unit.y,330,186,{baseline:93,screen:true,alpha:.82});}
  }`;
  const newShield=`function drawDinhLoiPersistentShields(context,time){
    const guarded=living(TEAM_PLAYER).concat(living(TEAM_ENEMY)).filter(unit=>(unit.statuses||[]).some(s=>s.type==="guard"&&s.sourceHeroId===DINH_LOI_ID));
    if(!guarded.length)return;
    const image=DINH_LOI_IMAGES.skill1Shield;if(!image?.complete||image.naturalWidth<2)return;const frame=dinhLoiFrame(time,true);
    for(const unit of guarded)drawDinhLoiAtlasFrame(context,image,frame,unit.x,unit.y,330,186,{baseline:93,screen:true,alpha:.82});
  }`;
  html=replaceOne(html,oldShield,newShield,'lazy Dinh Loi shield');
  html=replaceOne(html,'const poseAtlas = sameAppearanceBefore ? null : POSE_ATLASES[unit.archetype];','const poseAtlas = sameAppearanceBefore || (__HV_BATTLE_LOW_MEMORY&&unit.state!=="run"&&unit.state!=="attack") ? null : POSE_ATLASES[unit.archetype];','mobile generic pose admission');
  html=replaceOne(html,
    'dom.canvas.dataset.poseAtlases = Object.values(POSE_ATLASES).filter((image) => image.complete && image.naturalWidth > 1).length.toString();',
    'dom.canvas.dataset.poseAtlases = Object.values(POSE_ATLAS_SOURCES).filter((source) => { const image=__HV_FALLBACK_IMAGES.get(source); return image?.complete && image.naturalWidth > 1; }).length.toString();',
    'non-loading pose telemetry');
  html=replaceOne(html,
    'getPoseAtlasStatus: () => Object.fromEntries(Object.entries(POSE_ATLASES).map(([key, image]) => [key, Boolean(image.complete && image.naturalWidth > 1)])),',
    'getPoseAtlasStatus: () => Object.fromEntries(Object.entries(POSE_ATLAS_SOURCES).map(([key, source]) => { const image=__HV_FALLBACK_IMAGES.get(source); return [key, Boolean(image?.complete && image.naturalWidth > 1)]; })),',
    'non-loading pose QA');
  return html;
}

export async function buildBattleMobilePressure(root=process.cwd()){
  const {default:sharp}=await import('sharp');
  const out=join(root,'dist'),variants={};
  for(const src of [...BATTLE_FALLBACK_MOBILE_SOURCES,...ONG_PHO_MOBILE_SOURCES,...DINH_LOI_MOBILE_SOURCES]){
    const source=join(out,src);if(!existsSync(source))throw new Error('Missing mobile battle atlas: '+src);
    const meta=await sharp(source).metadata();
    const width=Math.max(1,Math.round(Number(meta.width)*DINH_LOI_MOBILE_SCALE));
    const height=Math.max(1,Math.round(Number(meta.height)*DINH_LOI_MOBILE_SCALE));
    const targetSrc=dinhLoiMobileVariantPath(src),target=join(out,targetSrc);mkdirSync(dirname(target),{recursive:true});
    await sharp(source).resize(width,height,{fit:'fill',kernel:'lanczos3'}).webp({quality:86,alphaQuality:92,effort:2}).toFile(target);
    variants[src]={src:targetSrc,width,height,scale:DINH_LOI_MOBILE_SCALE};
  }
  const battle=join(out,'battle.html');writeFileSync(battle,patchBattleMobilePressure(readFileSync(battle,'utf8'),variants));
  return variants;
}
