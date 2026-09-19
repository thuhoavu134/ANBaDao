import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  LINH_DONG_CANONICAL_ID,
  LINH_DONG_REGISTRY,
  LINH_DONG_TIMELINE,
  buildLinhDongMarkerSequence,
  createLinhDongTimelineController
} from '../src/combat-domain/linh-dong-presentation.mjs';
import { atlasDecodedBytes, atlasDecodeScale, clipSource, createDecodedAtlasCache, downsampleDecodedAtlas } from '../src/assets/decoded-atlas-cache.mjs';
import { createAssetLoader } from '../src/assets/asset-loader.mjs';
import { createFrameClock, frameAt, frameDurationMs } from '../src/assets/frame-clock.mjs';
import { drawCanvasSprite, sourceRectForFrame } from '../src/render/canvas-sprite-renderer.mjs';

const root = process.cwd();
const path = process.env.HV_LINH_DONG_BATTLE_PATH
  ? join(root, process.env.HV_LINH_DONG_BATTLE_PATH)
  : join(root, 'dist', 'battle.html');
const indexPath = join(root, 'dist', 'index.html');
const marker = '/* TKT-0145 canonical Linh Dong combat bridge */';
const indexMarker = '/* TKT-0145 canonical Linh Dong roster bridge */';
const OPTIONAL_PATCHES = new Set([
  'impact SFX suppression',
  'authored idle motion',
  'authored attack baseline'
]);
const REQUIRED_ASSETS = Object.freeze([
  'assets/characters/linh-dong/idle-atlas.webp',
  'assets/characters/linh-dong/run-atlas.webp',
  'assets/characters/linh-dong/hit-atlas.webp',
  'assets/characters/linh-dong/fall-atlas.webp',
  'assets/characters/linh-dong/basic-atlas.webp',
  'assets/characters/linh-dong/ultimate-atlas.webp',
  'assets/characters/linh-dong/skill1_vfx-atlas.webp',
  'assets/characters/linh-dong/ultimate_vfx-atlas.webp',
  'assets/audio/sfx/linh-dong/atk.wav',
  'assets/audio/sfx/linh-dong/ult.wav'
]);

function replaceOnce(source, from, to, label) {
  source = source.replace(/\r\n/g, '\n');
  if (!source.includes(from)) {
    // Main already carries this domain branch in a slightly newer basic-action
    // shape; the main-specific insertion below has already installed it.
    if (source.includes(to)) return source;
    if (label === 'fall state' && source.includes('isBachDien(unit)')) return source;
    if (OPTIONAL_PATCHES.has(label)) return source;
    if (label === 'ultimate domain status' && source.includes('isLinhDong(actor) && action === "ultimate"')) return source;
    throw new Error(`Linh Đồng battle patch missing ${label}`);
  }
  return source.replace(from, to);
}

const registryJson = JSON.stringify(LINH_DONG_REGISTRY);
const timelineJson = JSON.stringify(LINH_DONG_TIMELINE);
const controllerSource = createLinhDongTimelineController.toString();

const runtime = `${marker}
const LINH_DONG_CANONICAL_ID=${JSON.stringify(LINH_DONG_CANONICAL_ID)};
const LINH_DONG_REGISTRY=Object.freeze(${registryJson});
const LINH_DONG_TIMELINE=Object.freeze(${timelineJson});
const buildLinhDongMarkerSequence=${buildLinhDongMarkerSequence.toString()};
const createLinhDongTimelineController=${controllerSource};
const LINH_DONG_CLIPS=Object.freeze({
  idle:{file:"idle-atlas.webp",frames:96,cols:8,w:480,h:440,ms:42,loop:true,durationMs:4032},
  run:{file:"run-atlas.webp",frames:96,cols:8,w:480,h:440,ms:42,loop:true,durationMs:4032},
  hit:{file:"hit-atlas.webp",frames:96,cols:8,w:480,h:440,ms:42,loop:false,durationMs:4032},
  fall:{file:"fall-atlas.webp",frames:96,cols:8,w:480,h:440,ms:42,loop:false,durationMs:4032},
  attack:{file:"basic-atlas.webp",frames:44,cols:8,w:480,h:440,ms:34,loop:false,durationMs:1496},
  ultimate:{file:"ultimate-atlas.webp",frames:60,cols:8,w:480,h:440,ms:33,loop:false,durationMs:1980},
  atkVfx:{file:"skill1_vfx-atlas.webp",frames:120,cols:10,w:440,h:248,ms:33,loop:false,durationMs:3960},
  ultimateVfx:{file:"ultimate_vfx-atlas.webp",frames:120,cols:10,w:440,h:248,ms:33,loop:false,durationMs:3960}
});
const LINH_DONG_ASSET_BASE="assets/characters/linh-dong/";
const LINH_DONG_SFX_BASE="assets/audio/sfx/linh-dong/";
const atlasDecodedBytes=${atlasDecodedBytes.toString()};
const atlasDecodeScale=${atlasDecodeScale.toString()};
const downsampleDecodedAtlas=${downsampleDecodedAtlas.toString()};
const clipSource=${clipSource.toString()};
const createDecodedAtlasCache=${createDecodedAtlasCache.toString()};
const createAssetLoader=${createAssetLoader.toString()};
const frameDurationMs=${frameDurationMs.toString()};
const frameAt=${frameAt.toString()};
const createFrameClock=${createFrameClock.toString()};
const sourceRectForFrame=${sourceRectForFrame.toString()};
const drawCanvasSprite=${drawCanvasSprite.toString()};
const LINH_DONG_LOADER=createAssetLoader({maxBytes:128*1024*1024,maxLoading:2});
const LINH_DONG_CLOCK=createFrameClock({now:()=>performance.now()});
const LINH_DONG_AUDIO=new Map();
function normalizeLinhDongHeroId(value){
  const raw=String(value??'').trim();
  return /^(?:linh_dong|linh-dong|hero_splus_linh_dong)$/i.test(raw)?LINH_DONG_CANONICAL_ID:raw;
}
function normalizeLinhDongAction(value){
  const token=String(value??'').trim().toLowerCase();
  if(['atk','basic','normal','skill','skill1'].includes(token))return 'atk';
  if(['ultimate','ult'].includes(token))return 'ultimate';
  return null;
}
function linhDongLegacyAction(value){return normalizeLinhDongAction(value)==='atk'?'basic':normalizeLinhDongAction(value);}
function isLinhDong(unit){return !!unit&&[unit.sourceId,unit.sourceHeroId,unit.id].some(value=>normalizeLinhDongHeroId(value)===LINH_DONG_CANONICAL_ID);}
function linhDongActionMs(key){
  const normalized=key==='atk'||key==='basic'||key==='normal'||key==='skill'||key==='skill1'?'attack':key==='ultimate'||key==='ult'?'ultimate':key==='hurt'||key==='hit'?'hit':key==='fall'||key==='defeated'?'fall':key;
  return Number(LINH_DONG_CLIPS[normalized]?.durationMs)||1496;
}
function setLinhDongState(unit,nextState,duration=800,startedAt=performance.now()){
  if(!unit)return;
  const stateName=nextState==='skill1'?'attack':nextState==='hurt'?'hurt':nextState||'idle';
  unit.state=stateName;unit.stateStarted=startedAt;unit.stateDuration=Math.max(1,Number(duration)||800);
}
function clipFor(key){
  const clip=LINH_DONG_CLIPS[key];
  if(!clip)return null;
  const cellW=clip.cellW||clip.w,cellH=clip.cellH||clip.h,cols=clip.cols,frames=clip.frames;
  const rows=clip.rows||Math.ceil(frames/cols);
  return {file:clip.file,src:LINH_DONG_ASSET_BASE+clip.file,frames,cols,rows,cellW,cellH,w:cellW,h:cellH,ms:clip.ms,loop:!!clip.loop,durationMs:clip.durationMs,pivot:clip.pivot||{x:cellW/2,y:cellH},decodedBytes:cols*cellW*rows*cellH*4,atlasWidth:cols*cellW,atlasHeight:rows*cellH};
}
function linhDongImage(key){
  const clip=clipFor(key);
  if(!clip)return null;
  return LINH_DONG_LOADER.ensure(clip,{priority:'visible',scope:'battle'}).image;
}
function linhDongFrame(key,elapsed,loop=false){
  const clip=LINH_DONG_CLIPS[key]||LINH_DONG_CLIPS.idle;
  return frameAt({frames:clip.frames,ms:clip.ms,loop:!!loop},elapsed);
}
function drawLinhDongAtlas(context,key,frame,x,y,width,height,options={}){
  const clip=clipFor(key),image=linhDongImage(key);
  if(!clip||!image?.complete||image.naturalWidth<2)return false;
  return drawCanvasSprite(context,{image,clip,frame,x,y,width,height,flip:!!options.flip,alpha:options.alpha??1,blendMode:options.blend||'source-over',baseline:options.baseline??64});
}
function drawLinhDongHero(context,unit,time){
  if(!isLinhDong(unit))return false;
  let key='idle',loop=true;
  if(unit.hp<=0){key='fall';loop=false;}
  else if(unit.state==='hurt'||unit.state==='hit'){key='hit';loop=false;}
  else if(unit.state==='run'){key='run';loop=true;}
  else if(unit.state==='attack'||unit.state==='skill1'){key='attack';loop=false;}
  else if(unit.state==='ultimate'){key='ultimate';loop=false;}
  const actionClock=unit._linhDongAction?.clock;
  const elapsed=actionClock&&['attack','ultimate'].includes(key)?actionClock.elapsedMs():key==='idle'?time:Math.max(0,time-(unit.stateStarted||time));
  const frame=linhDongFrame(key,elapsed,loop);
  context.save();context.shadowColor='rgba(120,150,210,.32)';context.shadowBlur=['attack','ultimate'].includes(key)?14:5;
  const drawn=drawLinhDongAtlas(context,key,frame,0,0,477,440,{baseline:64,flip:unit.team===TEAM_ENEMY}) || (key!=='idle' && drawLinhDongAtlas(context,'idle',linhDongFrame('idle',time,true),0,0,477,440,{baseline:64,flip:unit.team===TEAM_ENEMY}));context.restore();return !!drawn;
}
let linhDongFx=null;
function beginLinhDongAction(actor,action,target,battleId){
  const normalized=normalizeLinhDongAction(action),timeline=LINH_DONG_TIMELINE[normalized];
  if(!normalized||!timeline)throw new Error('Missing Linh Đồng timeline for '+action);
  linhDongImage(normalized==='ultimate'?'ultimate':'attack');
  linhDongImage(normalized==='ultimate'?'ultimateVfx':'atkVfx');
  const info={action:normalized,actorId:actor.id,targetId:target?.id||null,battleId,startedAt:performance.now(),releasePlayed:false,impactResolved:false,clock:null};
  info.clock=createLinhDongTimelineController(normalized,{timeline,onMarker:marker=>{info.lastMarker=marker.type;}});
  info.clock.advance(0);actor._linhDongAction=info;setLinhDongState(actor,normalized==='ultimate'?'ultimate':'attack',timeline.character.durationMs,info.startedAt);return info;
}
async function waitLinhDongMarker(info,markerType,battleId){
  if(!info)return false;
  const timeline=LINH_DONG_TIMELINE[info.action];
  const targetMs=markerType==='release'?timeline.releaseMs:markerType==='impact'?timeline.impactMs:timeline.recoveryEndMs;
  while(state.battleId===battleId){
    const elapsed=info.clock.advance(performance.now()-info.startedAt);
    const remaining=targetMs-elapsed;
    if(remaining<=0){info.clock.advance(targetMs);return true;}
    if(!await sleepVisualMilliseconds(Math.min(remaining,40),battleId))return false;
  }
  return false;
}
function emitLinhDongRelease(info){
  if(!info||info.releasePlayed)return false;
  info.releasePlayed=true;info.clock.advance(LINH_DONG_TIMELINE[info.action].releaseMs);startLinhDongFx(info.action,getUnit(info.actorId),getUnit(info.targetId),info);playLinhDongSfx(info.action,info);return true;
}
function finishLinhDongAction(info){
  if(!info)return;
  info.clock.advance(LINH_DONG_TIMELINE[info.action].recoveryEndMs);
  if(linhDongFx?.actorId===info.actorId)linhDongFx=null;
  const actor=getUnit(info.actorId);if(actor?._linhDongAction===info)delete actor._linhDongAction;
  const atk=clipFor(info.action==='ultimate'?'ultimate':'attack');
  const vfx=clipFor(info.action==='ultimate'?'ultimateVfx':'atkVfx');
  if(atk?.src)LINH_DONG_LOADER.release(atk.src);
  if(vfx?.src)LINH_DONG_LOADER.release(vfx.src);
}
function playLinhDongSfx(action,info){
  const normalized=normalizeLinhDongAction(action);if(!normalized||info?.sfxPlayed||!state.sound)return false;
  if(info)info.sfxPlayed=true;
  try{
    window.HonVietSfx?.play(normalized==='ultimate'?'linh-dong-ult':'linh-dong-atk',{group:'combat'});
    document.documentElement.dataset.linhDongSfx=normalized;return true;
  }catch(_){return false;}
}
function startLinhDongFx(action,actor,target=null,info=null){
  const normalized=normalizeLinhDongAction(action);if(!normalized||!actor)return false;
  const timeline=LINH_DONG_TIMELINE[normalized];
  linhDongFx={action:normalized,kind:normalized==='ultimate'?'ultimateVfx':'atkVfx',actorId:actor.id,targetId:target?.id||null,clock:info?.clock||createLinhDongTimelineController(normalized,{timeline}),startedAt:info?.startedAt||performance.now(),releaseMs:timeline.releaseMs,recoveryEndMs:timeline.recoveryEndMs};
  return true;
}
function drawLinhDongFx(context,time){
  const fx=linhDongFx;if(!fx)return;
  const elapsed=fx.clock.advance(Math.max(0,performance.now()-fx.startedAt));
  if(elapsed>=fx.recoveryEndMs){linhDongFx=null;return;}
  const actor=getUnit(fx.actorId);if(!actor)return;
  const target=getUnit(fx.targetId),vfxElapsed=Math.max(0,elapsed-fx.releaseMs),vfxDuration=Math.max(1,fx.recoveryEndMs-fx.releaseMs),frame=linhDongFrame(fx.kind,vfxElapsed,false),p=Math.max(0,Math.min(1,vfxElapsed/vfxDuration));
  if(fx.kind==='atkVfx'){
    const foe=target||units.find(unit=>unit.team!==actor.team&&unit.hp>0);if(!foe)return;
    const travel=Math.min(1,p*1.35),x=actor.x+(foe.x-actor.x)*travel,y=actor.y-70+(foe.y-actor.y)*travel;
    drawLinhDongAtlas(context,fx.kind,frame,x,y,360,202,{baseline:101,flip:actor.team===TEAM_ENEMY,blend:'source-over',alpha:.94});
  }else{
    const enemyTeam=actor.team===TEAM_PLAYER?TEAM_ENEMY:TEAM_PLAYER,slots=units.filter(unit=>unit.team===enemyTeam&&unit.hp>0);
    const cx=slots.length?slots.reduce((sum,unit)=>sum+unit.x,0)/slots.length:(actor.team===TEAM_PLAYER?WORLD.width*.72:WORLD.width*.28);
    const cy=slots.length?slots.reduce((sum,unit)=>sum+unit.y,0)/slots.length:WORLD.height*.52;
    drawLinhDongAtlas(context,fx.kind,frame,cx,cy,720,405,{baseline:202,blend:'source-over',alpha:.96});
  }
}
function applyLinhDongBasicPassive(actor,target){
  if(!actor||!target||target.hp<=0||typeof addStatus!=='function')return;
  addStatus(target,{type:'healDown',turns:2,power:.2,sourceId:actor.id,sourceHeroId:LINH_DONG_CANONICAL_ID});
  const marks=target.statuses||[],existing=marks.find(status=>status.type==='spiritMark'&&status.sourceId===actor.id);
  if(existing)existing.stacks=Math.min(3,(Number(existing.stacks)||1)+1);
  else addStatus(target,{type:'spiritMark',stacks:1,maxStacks:3,turns:3,sourceId:actor.id,sourceHeroId:LINH_DONG_CANONICAL_ID});
  const mark=(target.statuses||[]).find(status=>status.type==='spiritMark'&&status.sourceId===actor.id);
  if(mark?.stacks>=3){target.statuses=target.statuses.filter(status=>status!==mark);target.energy=Math.max(0,(target.energy||0)-15);addFloater(target,'−15 NỘ','#8bd8ff',true);}
}
function applyLinhDongUltimateStatus(actor,foes){
  if(typeof addStatus!=='function')return;
  for(const foe of foes){if(foe?.hp>0)addStatus(foe,{type:'silence',turns:1,sourceId:actor.id,sourceHeroId:LINH_DONG_CANONICAL_ID});}
}
window.drawLinhDongHero=drawLinhDongHero;window.drawLinhDongFx=drawLinhDongFx;window.isLinhDong=isLinhDong;window.startLinhDongFx=startLinhDongFx;window.playLinhDongSfx=playLinhDongSfx;
window.__HV_SPRITE_RUNTIME={inspect:()=>LINH_DONG_LOADER.inspect(),ensure:key=>linhDongImage(key),clear:()=>LINH_DONG_LOADER.clearScope('battle')};
window.__HV_LINH_DONG_QA={
  registry:LINH_DONG_REGISTRY,
  timeline:action=>LINH_DONG_TIMELINE[normalizeLinhDongAction(action)],
  snapshot:()=>units.filter(isLinhDong).map(unit=>({id:unit.id,sourceId:normalizeLinhDongHeroId(unit.sourceId),state:unit.state,action:unit._linhDongAction?.action||null,elapsedMs:unit._linhDongAction?.clock?.elapsedMs?.()||0})),
  force:async(action='atk')=>{const actor=units.find(unit=>isLinhDong(unit)&&unit.hp>0),target=units.find(unit=>actor&&unit.team!==actor.team&&unit.hp>0);if(!actor||!target)return false;state.mode='battle';state.currentId=actor.id;state.locked=false;return performAction(actor,linhDongLegacyAction(action),target);}
};
`;

export function patchLinhDongBattle(input) {
  if (input.includes(marker)) return input;
  let html = input;
  const legacyStart = html.indexOf('  // TKT-0139 — Linh Đồng authored RGBA atlas.');
  const legacyEnd = html.indexOf('  // v3.13: authored status icon art generated for the Hồn Việt combat HUD.');
  if (legacyStart < 0 || legacyEnd <= legacyStart) throw new Error('Linh Đồng legacy presentation block missing');
  // Main already carries the older TKT-0139 renderer. Remove that whole block
  // before installing the canonical TKT-0145 block so declarations cannot drift
  // or collide with the shared registry/clock symbols below.
  html = html.slice(0, legacyStart) + html.slice(legacyEnd);
  const legacyActionStart = html.indexOf('    } else if(usesLinhDong){');
  const legacyActionEnd = html.indexOf('    } else if(usesDinhLoi){', legacyActionStart);
  if (legacyActionStart < 0 || legacyActionEnd <= legacyActionStart) throw new Error('Linh Đồng legacy action branch missing');
  // The current main branch already has a TKT-0139 action branch. Remove it
  // before inserting the canonical marker-driven branch below.
  html = html.slice(0, legacyActionStart) + html.slice(legacyActionEnd);
  const legacyResolveStart = html.indexOf('    if(isLinhDong(actor)&&action==="skill"){');
  const legacyResolveEnd = html.indexOf('    if(isDinhLoi(actor)&&action==="skill"){', legacyResolveStart);
  if (legacyResolveStart < 0 || legacyResolveEnd <= legacyResolveStart) throw new Error('Linh Đồng legacy resolve branches missing');
  // Legacy Skill 1/Ultimate domain branches are removed as well: aliases are
  // normalized before performAction, so only canonical ATK/Ultimate resolve.
  html = html.slice(0, legacyResolveStart) + html.slice(legacyResolveEnd);
  const basicAnchor = '    if (action === "basic" && !(isVersionedSkillKit(actor) && isOngPhoCarry(actor))) {';
  if (!html.includes('    if (isLinhDong(actor) && action === "ultimate") {')) {
    const ultimateBranch = [
      '    if (isLinhDong(actor) && action === "ultimate") {',
      '      for(const foe of foes){if(foe.hp>0)applyDamage(actor,foe,multiplier,{color:"#839cff"});}',
      '      applyLinhDongUltimateStatus(actor,foes);',
      '      return;',
      '    }',
      '',
      basicAnchor
    ].join('\n');
    html = replaceOnce(html, basicAnchor, ultimateBranch, 'ultimate domain status');
  }
  html = replaceOnce(html, 'let HEROES = Core.dedupeTeamRoster(configuredHeroes);', `let HEROES = Core.dedupeTeamRoster(configuredHeroes);\n  if(new URLSearchParams(location.search).has('linhDongQa')){const qaHero=HEROES.find(hero=>hero.team===TEAM_PLAYER&&hero.slot===5)||HEROES.find(hero=>hero.team===TEAM_PLAYER);if(qaHero)Object.assign(qaHero,{sourceId:'hero_splus_linh_dong',name:'Linh Đồng',title:'Mộng thuật / Khống chế',initial:'L',he:'mong',archetype:'mystic',weapon:'staff',skillName:'Oan Linh Tỏa',skillKind:'debuff',skillMultiplier:1.05,ultimateName:'Bách Quỷ Dạ Hành',ultimateKind:'aoe',ultimateMultiplier:1.18});}`, 'QA roster hook');
  html = replaceOnce(html, 'const sourceId = String(hero?.sourceId || hero?.id || `${requestedTeam}-${requestedSlot}`);', 'const rawSourceId = String(hero?.sourceId || hero?.sourceHeroId || hero?.id || `${requestedTeam}-${requestedSlot}`);\n    const sourceId = /^(?:linh_dong|linh-dong|hero_splus_linh_dong)$/i.test(rawSourceId) ? "hero_splus_linh_dong" : rawSourceId;', 'configured hero identity');
  html = replaceOnce(html, 'function setUnitState(unit, nextState, duration = 800) {\n    // v3.00:', 'function setUnitState(unit, nextState, duration = 800) {\n    if(typeof isLinhDong===\'function\'&&isLinhDong(unit)){setLinhDongState(unit,nextState,duration);return;}\n    // v3.00:', 'state bridge');
  html = replaceOnce(html, 'const authoredFallMs=isOngPho(unit)?ONG_PHO_FALL_MS:isDinhLoi(unit)?DINH_LOI_FALL_MS:DEFEAT_FALL_MS;', 'const authoredFallMs=isOngPho(unit)?ONG_PHO_FALL_MS:isDinhLoi(unit)?DINH_LOI_FALL_MS:isLinhDong(unit)?linhDongActionMs(\'fall\'):DEFEAT_FALL_MS;', 'fall state');
  if (html.includes('    const usesLucAnh = isLucAnh(actor);\n    const usesThayMoBasicQa')) {
    html = replaceOnce(html, '    const usesLucAnh = isLucAnh(actor);\n    const usesThayMoBasicQa', '    const usesLucAnh = isLucAnh(actor);\n    const usesLinhDong = isLinhDong(actor);\n    const usesThayMoBasicQa', 'action identity');
  }
  html = replaceOnce(html, '    } else if (usesThayMoBasicQa) {', `    } else if (usesLinhDong) {\n      actor.x=actor.baseX;actor.y=actor.baseY;\n      const linhAction=beginLinhDongAction(actor,action,target,battleId);\n      setStatus(actor.name+' '+(action==='ultimate'?'khai Bách Quỷ Dạ Hành':'rung chuông Oan Linh Tỏa'));\n      dom.phaseLabel.textContent=action==='ultimate'?'Tuyệt kỹ • Bách Quỷ Dạ Hành':'ATK • Oan Linh Tỏa';\n      if(!await waitLinhDongMarker(linhAction,'release',battleId))return;\n      emitLinhDongRelease(linhAction);\n      dom.phaseLabel.textContent=action==='ultimate'?'Tuyệt kỹ • Linh quỷ xuất thế':'ATK • Âm ty';\n      if(!await waitLinhDongMarker(linhAction,'impact',battleId))return;\n      dom.phaseLabel.textContent='Va chạm • Linh Đồng';\n    } else if (usesThayMoBasicQa) {`, 'Linh Đồng action bridge');
  const resolveAnchor='    resolveAction(actor, action, target);\n    if(!usesLucAnh) triggerImpactPresentation(actor, target, action);';
  const tracedResolveAnchor="    phase1Trace?.marker('impact',{actionId:phase1ActionId,targetId:target?.id||null,position:{x:target?.x??actor.x,y:target?.y??actor.y}});\n    resolveAction(actor, action, target, phase1ActionId);\n    if(!usesLucAnh) triggerImpactPresentation(actor, target, action);";
  const resolveReplacement='    const linhImpact=usesLinhDong?actor._linhDongAction:null;\n    const resolveAtImpact=!linhImpact||!linhImpact.impactResolved;\n    if(linhImpact){linhImpact.clock.advance(LINH_DONG_TIMELINE[linhImpact.action].impactMs);linhImpact.impactResolved=true;}\n    if(resolveAtImpact) resolveAction(actor, action, target);\n    if(!usesLucAnh && !usesLinhDong) triggerImpactPresentation(actor, target, action);';
  if(html.includes(resolveAnchor)) html=replaceOnce(html,resolveAnchor,resolveReplacement,'combined VFX only and impact dedupe');
  else if(html.includes(tracedResolveAnchor)) html=replaceOnce(html,tracedResolveAnchor,"    const linhImpact=usesLinhDong?actor._linhDongAction:null;\n    const resolveAtImpact=!linhImpact||!linhImpact.impactResolved;\n    if(linhImpact){linhImpact.clock.advance(LINH_DONG_TIMELINE[linhImpact.action].impactMs);linhImpact.impactResolved=true;}\n    if(resolveAtImpact) resolveAction(actor, action, target, phase1ActionId);\n    if(!usesLucAnh && !usesLinhDong) triggerImpactPresentation(actor, target, action);",'combined VFX only and impact dedupe traced');
  else throw new Error('Linh Đồng resolve/trace anchor missing');
  html = replaceOnce(html, '    const hitStop = REDUCED_MOTION ? 0 : (action === "ultimate" ? 150 : action === "skill" ? 90 : 55);', '    const hitStop = usesLinhDong ? 0 : (REDUCED_MOTION ? 0 : (action === "ultimate" ? 150 : action === "skill" ? 90 : 55));', 'shared action clock');
  html = replaceOnce(html, '    if (usesOngPhoGif) {\n      if (usesOngPhoSkill1) {', '    if (usesLinhDong) {\n      const linhAction=actor._linhDongAction;\n      if(!await waitLinhDongMarker(linhAction,\'recovery:end\',battleId))return;\n      finishLinhDongAction(linhAction);\n    } else if (usesOngPhoGif) {\n      if (usesOngPhoSkill1) {', 'recovery boundary');
  html = replaceOnce(html, '    if (actor.hp > 0) {\n      if (usesDinhLoi) {', '    if (actor.hp > 0) {\n      if (usesLinhDong) {\n        actor.x=origin.x;actor.y=origin.y;dom.phaseLabel.textContent="Thu thế";setUnitState(actor,"idle",800);\n      } else if (usesDinhLoi) {', 'recovery state reset');
  if (html.includes('      const hurtMs = isOngPho(target) ? ONG_PHO_HIT_MS : isDinhLoi(target) ? DINH_LOI_HIT_MS : isLucAnh(target) ? LUC_ANH_META.hurt.frames*LUC_ANH_META.hurt.ms : 230;')) {
    html = replaceOnce(html, '      const hurtMs = isOngPho(target) ? ONG_PHO_HIT_MS : isDinhLoi(target) ? DINH_LOI_HIT_MS : isLucAnh(target) ? LUC_ANH_META.hurt.frames*LUC_ANH_META.hurt.ms : 230;', '      const hurtMs = isOngPho(target) ? ONG_PHO_HIT_MS : isDinhLoi(target) ? DINH_LOI_HIT_MS : isLucAnh(target) ? LUC_ANH_META.hurt.frames*LUC_ANH_META.hurt.ms : isLinhDong(target) ? linhDongActionMs(\'hit\') : 230;', 'hit clip timing');
  }
  if (html.includes('      }else if(isLucAnh(target)){\n        setTimeout(()=>{ if(target.hp>0&&target.state==="hurt") setUnitState(target,"idle",800); }, motionDuration(LUC_ANH_META.hurt.frames*LUC_ANH_META.hurt.ms));\n      }')) {
    html = replaceOnce(html, '      }else if(isLucAnh(target)){\n        setTimeout(()=>{ if(target.hp>0&&target.state==="hurt") setUnitState(target,"idle",800); }, motionDuration(LUC_ANH_META.hurt.frames*LUC_ANH_META.hurt.ms));\n      }', '      }else if(isLucAnh(target)){\n        setTimeout(()=>{ if(target.hp>0&&target.state==="hurt") setUnitState(target,"idle",800); }, motionDuration(LUC_ANH_META.hurt.frames*LUC_ANH_META.hurt.ms));\n      }else if(isLinhDong(target)){\n        setTimeout(()=>{ if(target.hp>0&&target.state==="hurt") setUnitState(target,"idle",800); }, linhDongActionMs(\'hit\'));\n      }', 'hit reset');
  }
  html = replaceOnce(html, '    tone(critical ? 105 : 135, critical ? 0.16 : 0.09, "square", 0.035);', '    if(!isLinhDong(actor)) tone(critical ? 105 : 135, critical ? 0.16 : 0.09, "square", 0.035);', 'impact SFX suppression');
  html = replaceOnce(html, '    burst(target.x, target.y, options.color || actor.accent, critical ? 25 : 15);', '    if(!isLinhDong(actor)) burst(target.x, target.y, options.color || actor.accent, critical ? 25 : 15);', 'impact VFX suppression');
  html = replaceOnce(html, '    if (action === "basic") {\n      const amount = applyDamage(actor, target, 1);', `    if (isLinhDong(actor) && action === "ultimate") {\n      for(const foe of foes){if(foe.hp>0)applyDamage(actor,foe,multiplier,{color:"#839cff"});}\n      applyLinhDongUltimateStatus(actor,foes);\n      return;\n    }\n\n    if (action === "basic") {\n      const amount = applyDamage(actor, target, 1);`, 'ultimate domain status');
  html = replaceOnce(html, '      addLog(`${actor.name} đánh ${target.name}, gây ${amount} sát thương. +${15+tempoBonus} nộ.`);\n      return;', '      addLog(`${actor.name} đánh ${target.name}, gây ${amount} sát thương. +${15+tempoBonus} nộ.`);\n      if(isLinhDong(actor)&&target?.hp>0)applyLinhDongBasicPassive(actor,target);\n      return;', 'ATK passive');
  if (html.includes('    if (drawOngPhoGifHero(context, unit) || drawDinhLoiHero(context,unit,time) || drawLucAnhHero(context,unit,time) || drawThayMoIdleQa(context, unit) || drawGeneratedHero(context, unit, time, progress)) {')) {
    html = replaceOnce(html, '    if (drawOngPhoGifHero(context, unit) || drawDinhLoiHero(context,unit,time) || drawLucAnhHero(context,unit,time) || drawThayMoIdleQa(context, unit) || drawGeneratedHero(context, unit, time, progress)) {', '    if (drawOngPhoGifHero(context, unit) || drawDinhLoiHero(context,unit,time) || drawLucAnhHero(context,unit,time) || drawLinhDongHero(context,unit,time) || drawThayMoIdleQa(context, unit) || drawGeneratedHero(context, unit, time, progress)) {', 'character renderer');
  }
  if (html.includes('    drawLucAnhFx(ctx,time);\n    drawThayMoRangedFx(ctx,time);')) {
    html = replaceOnce(html, '    drawLucAnhFx(ctx,time);\n    drawThayMoRangedFx(ctx,time);', '    drawLucAnhFx(ctx,time);\n    drawLinhDongFx(ctx,time);\n    drawThayMoRangedFx(ctx,time);', 'VFX renderer');
  }
  html = replaceOnce(html, '    const idleBob = REDUCED_MOTION ? 0 : Math.sin(time * 0.0032 + unit.phase) * 3.2;', '    const idleBob = REDUCED_MOTION || isLinhDong(unit) ? 0 : Math.sin(time * 0.0032 + unit.phase) * 3.2;', 'authored idle motion');
  html = replaceOnce(html, '    const hurtJitter = unit.state === "hurt" && !isOngPho(unit) && !isThayMoHitQa(unit) ? Math.sin(progress * Math.PI * 7) * 8 : 0;', '    const hurtJitter = unit.state === "hurt" && !isOngPho(unit) && !isLinhDong(unit) && !isThayMoHitQa(unit) ? Math.sin(progress * Math.PI * 7) * 8 : 0;', 'authored hit motion');
  html = replaceOnce(html, '    if (!isOngPho(unit)) context.rotate(lean * (unit.team === TEAM_PLAYER ? 1 : -1));', '    if (!isOngPho(unit) && !isLinhDong(unit)) context.rotate(lean * (unit.team === TEAM_PLAYER ? 1 : -1));', 'authored attack baseline');
  html = replaceOnce(html, '    if (!alive && !isOngPho(unit)) {', '    if (!alive && !isOngPho(unit) && !isLinhDong(unit)) {', 'authored fall baseline');
  const adapterAnchor = [
    '  async function __hvPerformAction3qAdapter(actor, action, target) {',
    '    if (state.locked || state.mode !== "battle" || actor.id !== state.currentId || !Core.canUseAction(actor, action)) return;'
  ].join('\n');
  const adapterReplacement = [
    runtime,
    '',
    '  async function __hvPerformAction3qAdapter(actor, action, target) {',
    '    if(isLinhDong(actor)) action=linhDongLegacyAction(action)||action;',
    '    if (state.locked || state.mode !== "battle" || actor.id !== state.currentId || !Core.canUseAction(actor, action)) return;'
  ].join('\n');
  html = replaceOnce(html, adapterAnchor, adapterReplacement, 'runtime insertion and action aliases');
  const performActionMarker = '  async function performAction(actor, action, target) {\n';
  const performActionAlias = '    if(isLinhDong(actor)) action=linhDongLegacyAction(action)||action;\n';
  if (!html.includes(performActionMarker)) throw new Error('Linh Đồng battle patch missing performAction alias');
  if (!html.includes(performActionMarker + performActionAlias)) {
    html = html.replace(performActionMarker, performActionMarker + performActionAlias);
  }
  return html;
}

function replaceIfPresent(source, from, to) {
  return source.includes(from) ? source.replace(from, to) : source;
}

export function patchLinhDongIndex(input) {
  if (input.includes(indexMarker)) return input;
  let html = input;
  html = replaceIfPresent(
    html,
    '    const sourceId = safeText(combatant.sourceHeroId || combatant.heroId || combatant.id, combatant.uid);',
    '    const rawSourceId = safeText(combatant.sourceHeroId || combatant.heroId || combatant.id, combatant.uid);\n    const sourceId = /^(?:linh_dong|linh-dong|hero_splus_linh_dong)$/i.test(rawSourceId) ? "hero_splus_linh_dong" : rawSourceId;\n    const definitionKey = /^(?:linh_dong|linh-dong|hero_splus_linh_dong)$/i.test(rawSourceId) ? "linh_dong" : rawSourceId;',
  );
  html = replaceIfPresent(
    html,
    '    const definition = DATA.heroes?.[sourceId] || DATA.heroes?.[combatant.id] || {};',
    '    const definition = DATA.heroes?.[sourceId] || DATA.heroes?.[definitionKey] || DATA.heroes?.[rawSourceId] || DATA.heroes?.[combatant.id] || {};',
  );
  html = replaceIfPresent(
    html,
    '    const st=definition.stats||{}; const sourceId=String(id); const synthetic={side:"ally",skill:definition.skill||null,ultimate:definition.ultimate||null};',
    '    const st=definition.stats||{}; const rawSourceId=String(id); const sourceId=/^(?:linh_dong|linh-dong|hero_splus_linh_dong)$/i.test(rawSourceId) ? "hero_splus_linh_dong" : rawSourceId; const synthetic={side:"ally",skill:definition.skill||null,ultimate:definition.ultimate||null};',
  );
  return `${html}\n<script id="linh-dong-index-qa">window.__HV_LINH_DONG_INDEX_QA=Object.freeze({heroId:"hero_splus_linh_dong",aliases:["linh_dong","linh-dong","hero_splus_linh_dong"],actions:{atk:{character:"assets/characters/linh-dong/basic-atlas.webp",combinedVfx:"assets/characters/linh-dong/skill1_vfx-atlas.webp",sfx:"assets/audio/sfx/linh-dong/atk.wav"},ultimate:{character:"assets/characters/linh-dong/ultimate-atlas.webp",combinedVfx:"assets/characters/linh-dong/ultimate_vfx-atlas.webp",sfx:"assets/audio/sfx/linh-dong/ult.wav"}}});</script>\n${indexMarker}\n`;
}

export function writeLinhDongStaticFingerprint() {
  const files = Object.fromEntries(REQUIRED_ASSETS.map(relativePath => {
    const assetPath = join(root, 'dist', relativePath);
    if (!existsSync(assetPath)) throw new Error(`Missing Linh Đồng runtime asset: ${relativePath}`);
    const bytes = readFileSync(assetPath);
    if (bytes.length <= 32) throw new Error(`Linh Đồng runtime asset is empty or placeholder: ${relativePath}`);
    return [relativePath, {
      bytes: bytes.length,
      sha256: createHash('sha256').update(bytes).digest('hex')
    }];
  }));
  const fingerprint = {
    schema: 'hon-viet-linh-dong-static-fingerprint/v1',
    source: 'main-asset-tree',
    files
  };
  const fingerprintPath = join(root, 'dist', 'assets', 'characters', 'linh-dong', 'static-fingerprint.json');
  writeFileSync(fingerprintPath, `${JSON.stringify(fingerprint, null, 2)}\n`);
  return fingerprint;
}

if (process.env.HV_SKIP_LINH_DONG_BUILD_PATCH !== '1' && existsSync(path)) {
  writeFileSync(path, patchLinhDongBattle(readFileSync(path, 'utf8')));
  if (existsSync(indexPath)) writeFileSync(indexPath, patchLinhDongIndex(readFileSync(indexPath, 'utf8')));
  const fingerprint = writeLinhDongStaticFingerprint();
  console.log(`Linh Đồng runtime bridge, shared clock and canonical action registry installed; ${Object.keys(fingerprint.files).length} asset fingerprints recorded`);
}
