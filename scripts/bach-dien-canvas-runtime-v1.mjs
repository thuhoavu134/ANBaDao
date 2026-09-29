import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  BACH_DIEN_CANONICAL_ID,
  BACH_DIEN_REGISTRY,
  BACH_DIEN_TIMELINE,
  createBachDienTimelineController
} from '../src/combat-domain/bach-dien-presentation.mjs';
import bachDienMeta from '../assets/characters/bach-dien/runtime-meta.json' with { type: 'json' };
import { patchBachDienImpactOwner } from '../src/combat-domain/bach-dien-impact-owner.mjs';

const root = process.cwd();
const path = process.env.HV_BACH_DIEN_BATTLE_PATH
  ? join(root, process.env.HV_BACH_DIEN_BATTLE_PATH)
  : join(root, 'dist', 'battle.html');
const indexPath = join(root, 'dist', 'index.html');
const marker = '/* TKT-0154 Bạch Diện Canvas Sprite Runtime */';
const REQUIRED_ASSETS = Object.freeze([
  'assets/characters/bach-dien/idle-atlas.webp',
  'assets/characters/bach-dien/run-atlas.webp',
  'assets/characters/bach-dien/hit-atlas.webp',
  'assets/characters/bach-dien/fall-atlas.webp',
  'assets/characters/bach-dien/basic-atlas.webp',
  'assets/characters/bach-dien/ultimate-atlas.webp',
  'assets/characters/bach-dien/skill1_vfx-atlas.webp',
  'assets/characters/bach-dien/ultimate_vfx-atlas.webp',
  'assets/audio/sfx/bach-dien/atk.wav',
  'assets/audio/sfx/bach-dien/ult.wav'
]);

function replaceOnce(source, from, to, label, optional = false) {
  if (!source.includes(from)) {
    if (optional) return source;
    throw new Error(`Bạch Diện battle patch missing ${label}`);
  }
  return source.replace(from, to);
}

const clips = Object.fromEntries(Object.entries(bachDienMeta.clips).map(([key, clip]) => [key, {
  file: clip.file,
  frames: clip.frames,
  cols: clip.cols,
  rows: clip.rows,
  w: clip.cellW,
  h: clip.cellH,
  cellW: clip.cellW,
  cellH: clip.cellH,
  ms: clip.ms,
  fps: clip.fps,
  loop: !!clip.loop,
  durationMs: clip.durationMs,
  pivot: clip.pivot,
  registration: clip.registration,
  kind: clip.kind,
  blendMode: clip.blendMode,
  decodedBytes: clip.decodedBytes
}]));
clips.hit = clips.hurt;
clips.fall = clips.defeated;
clips.atkVfx = clips.skill1Vfx;
clips.attack = { ...clips.attack, ms: 22.667, fps: 44.1176470588, durationMs: 680 };

const runtime = `${marker}
const BACH_DIEN_CANONICAL_ID=${JSON.stringify(BACH_DIEN_CANONICAL_ID)};
const BACH_DIEN_REGISTRY=Object.freeze(${JSON.stringify(BACH_DIEN_REGISTRY)});
const BACH_DIEN_TIMELINE=Object.freeze(${JSON.stringify(BACH_DIEN_TIMELINE)});
const BACH_DIEN_CLIPS=Object.freeze(${JSON.stringify(clips)});
const BACH_DIEN_ASSET_BASE="assets/characters/bach-dien/";
const createBachDienTimelineController=${createBachDienTimelineController.toString()};
const BACH_DIEN_LOADER=typeof LINH_DONG_LOADER!=='undefined'?LINH_DONG_LOADER:createAssetLoader({maxBytes:128*1024*1024,maxLoading:2});
function normalizeBachDienHeroId(value){
  const raw=String(value??'').trim();
  return /^(?:bach_dien|bach-dien|hero_splus_bach_dien)$/i.test(raw)?BACH_DIEN_CANONICAL_ID:raw;
}
function normalizeBachDienAction(value){
  const token=String(value??'').trim().toLowerCase();
  if(['atk','basic','normal','skill','skill1'].includes(token))return 'atk';
  if(['ultimate','ult'].includes(token))return 'ultimate';
  return null;
}
function bachDienLegacyAction(value){return normalizeBachDienAction(value)==='atk'?'basic':normalizeBachDienAction(value);}
function isBachDien(unit){return !!unit&&[unit.sourceId,unit.sourceHeroId,unit.id].some(value=>normalizeBachDienHeroId(value)===BACH_DIEN_CANONICAL_ID);}
function bachDienActionMs(key){
  const normalized=key==='atk'||key==='basic'||key==='normal'||key==='skill'||key==='skill1'?'attack':key==='ultimate'||key==='ult'?'ultimate':key==='hurt'||key==='hit'?'hurt':key==='fall'||key==='defeated'?'defeated':key;
  return Number(BACH_DIEN_CLIPS[normalized]?.durationMs)||3133.333;
}
function setBachDienState(unit,nextState,duration=800,startedAt=performance.now()){
  if(!unit)return;
  const stateName=nextState==='skill1'?'attack':nextState==='hurt'?'hurt':nextState||'idle';
  unit.state=stateName;unit.stateStarted=startedAt;unit.stateDuration=Math.max(1,Number(duration)||800);
}
function clipForBachDien(key){
  const clip=BACH_DIEN_CLIPS[key];
  if(!clip)return null;
  const cellW=clip.cellW||clip.w,cellH=clip.cellH||clip.h,cols=clip.cols,frames=clip.frames;
  const rows=clip.rows||Math.ceil(frames/cols);
  return {file:clip.file,src:BACH_DIEN_ASSET_BASE+clip.file,frames,cols,rows,cellW,cellH,w:cellW,h:cellH,ms:clip.ms,fps:clip.fps,loop:!!clip.loop,durationMs:clip.durationMs,registration:clip.registration,pivot:clip.pivot||{x:cellW/2,y:cellH},decodedBytes:clip.decodedBytes||cols*cellW*rows*cellH*4,atlasWidth:cols*cellW,atlasHeight:rows*cellH,blendMode:clip.blendMode||'source-over',kind:clip.kind};
}
function bachDienImage(key){
  const clip=clipForBachDien(key);
  if(!clip)return null;
  return BACH_DIEN_LOADER.ensure(clip,{priority:'visible',scope:'battle'}).image;
}
function bachDienFrame(key,elapsed,loop=false){
  const clip=BACH_DIEN_CLIPS[key]||BACH_DIEN_CLIPS.idle;
  return frameAt({frames:clip.frames,ms:clip.ms,fps:clip.fps,loop:!!loop},elapsed);
}
function drawBachDienAtlas(context,key,frame,x,y,width,height,options={}){
  const clip=clipForBachDien(key),image=bachDienImage(key);
  if(!clip||!image?.complete||image.naturalWidth<2)return false;
  return drawCanvasSprite(context,{image,clip,frame,x,y,width,height,flip:!!options.flip,alpha:options.alpha??1,blendMode:options.blend||clip.blendMode||'source-over',baseline:options.baseline??64});
}
function drawBachDienHero(context,unit,time){
  if(!isBachDien(unit))return false;
  let key='idle',loop=true;
  if(unit.hp<=0){key='defeated';loop=false;}
  else if(unit.state==='hurt'||unit.state==='hit'){key='hurt';loop=false;}
  else if(unit.state==='run'){key='run';loop=true;}
  else if(unit.state==='attack'||unit.state==='skill1'){key='attack';loop=false;}
  else if(unit.state==='ultimate'){key='ultimate';loop=false;}
  if(key==='idle') bachDienImage('idle');
  const actionClock=unit._bachDienAction?.clock;
  const elapsed=actionClock&&['attack','ultimate'].includes(key)?actionClock.elapsedMs():key==='idle'?time:Math.max(0,time-(unit.stateStarted||time));
  const frame=bachDienFrame(key,elapsed,loop);
  context.save();context.shadowColor='rgba(180,40,50,.28)';context.shadowBlur=['attack','ultimate'].includes(key)?14:5;
  const drawn=drawBachDienAtlas(context,key,frame,0,0,477,440,{baseline:64,flip:unit.team===TEAM_ENEMY}) || (key!=='idle' && drawBachDienAtlas(context,'idle',bachDienFrame('idle',time,true),0,0,477,440,{baseline:64,flip:unit.team===TEAM_ENEMY}));context.restore();return !!drawn;
}
let bachDienFx=null;
function beginBachDienAction(actor,action,target,battleId){
  const normalized=normalizeBachDienAction(action),timeline=BACH_DIEN_TIMELINE[normalized];
  if(!normalized||!timeline)throw new Error('Missing Bạch Diện timeline for '+action);
  bachDienImage(normalized==='ultimate'?'ultimate':'attack');
  bachDienImage(normalized==='ultimate'?'ultimateVfx':'atkVfx');
  const info={action:normalized,actorId:actor.id,targetId:target?.id||null,battleId,startedAt:performance.now(),releasePlayed:false,impactResolved:false,clock:null};
  info.clock=createBachDienTimelineController(normalized,{timeline,onMarker:marker=>{info.lastMarker=marker.type;}});
  info.clock.advance(0);actor._bachDienAction=info;setBachDienState(actor,normalized==='ultimate'?'ultimate':'attack',timeline.character.durationMs,info.startedAt);return info;
}
async function waitBachDienMarker(info,markerType,battleId){
  if(!info)return false;
  const timeline=BACH_DIEN_TIMELINE[info.action];
  const targetMs=markerType==='release'?timeline.releaseMs:markerType==='impact'?timeline.impactMs:timeline.recoveryEndMs;
  while(state.battleId===battleId){
    const elapsed=info.clock.advance(performance.now()-info.startedAt);
    const remaining=targetMs-elapsed;
    if(remaining<=0){info.clock.advance(targetMs);return true;}
    if(!await sleepVisualMilliseconds(Math.min(remaining,40),battleId))return false;
  }
  return false;
}
function emitBachDienRelease(info){
  if(!info||info.releasePlayed)return false;
  info.releasePlayed=true;info.clock.advance(BACH_DIEN_TIMELINE[info.action].releaseMs);startBachDienFx(info.action,getUnit(info.actorId),getUnit(info.targetId),info);playBachDienSfx(info.action,info);return true;
}
function finishBachDienAction(info){
  if(!info)return;
  info.clock.advance(BACH_DIEN_TIMELINE[info.action].recoveryEndMs);
  if(bachDienFx?.actorId===info.actorId)bachDienFx=null;
  const actor=getUnit(info.actorId);if(actor?._bachDienAction===info)delete actor._bachDienAction;
  const atk=clipForBachDien(info.action==='ultimate'?'ultimate':'attack');
  const vfx=clipForBachDien(info.action==='ultimate'?'ultimateVfx':'atkVfx');
  if(atk?.src)BACH_DIEN_LOADER.release(atk.src);
  if(vfx?.src)BACH_DIEN_LOADER.release(vfx.src);
}
function playBachDienSfx(action,info){
  const normalized=normalizeBachDienAction(action);if(!normalized||info?.sfxPlayed||!state.sound)return false;
  if(info)info.sfxPlayed=true;
  try{
    window.HonVietSfx?.play(normalized==='ultimate'?'bach-dien-ult':'bach-dien-atk',{group:'combat'});
    document.documentElement.dataset.bachDienSfx=normalized;return true;
  }catch(_){return false;}
}
function startBachDienFx(action,actor,target=null,info=null){
  const normalized=normalizeBachDienAction(action);if(!normalized||!actor)return false;
  const timeline=BACH_DIEN_TIMELINE[normalized];
  bachDienFx={action:normalized,kind:normalized==='ultimate'?'ultimateVfx':'atkVfx',actorId:actor.id,targetId:target?.id||null,clock:info?.clock||createBachDienTimelineController(normalized,{timeline}),startedAt:info?.startedAt||performance.now(),releaseMs:timeline.releaseMs,recoveryEndMs:timeline.recoveryEndMs};
  return true;
}
function drawBachDienFx(context,time){
  const fx=bachDienFx;if(!fx)return;
  const elapsed=fx.clock.advance(Math.max(0,performance.now()-fx.startedAt));
  if(elapsed>=fx.recoveryEndMs){bachDienFx=null;return;}
  const actor=getUnit(fx.actorId);if(!actor)return;
  const clip=BACH_DIEN_CLIPS[fx.kind];
  const sourceVfxDuration=Math.max(1,Number(clip?.durationMs)||Math.max(1,fx.recoveryEndMs-fx.releaseMs));
  // Skill 1 uses a dedicated short visual window. Ultimate keeps the shared
  // VFX clock. Gameplay impact/recovery markers remain unchanged.
  const vfxDuration=fx.kind==='atkVfx'?Math.min(560,Math.max(1,fx.recoveryEndMs-fx.releaseMs)):combatVfxMs(sourceVfxDuration);
  const vfxElapsed=Math.max(0,elapsed-fx.releaseMs);
  if(vfxElapsed>=vfxDuration){bachDienFx=null;return;}
  const target=getUnit(fx.targetId),sourceElapsed=(vfxElapsed/vfxDuration)*sourceVfxDuration,frame=bachDienFrame(fx.kind,sourceElapsed,false),p=Math.max(0,Math.min(1,vfxElapsed/vfxDuration));
  if(fx.kind==='atkVfx'){
    const foe=target||units.find(unit=>unit.team!==actor.team&&unit.hp>0);if(!foe)return;
    const travel=Math.min(1,p*1.35),x=actor.x+(foe.x-actor.x)*travel,y=actor.y-70+(foe.y-actor.y)*travel;
    drawBachDienAtlas(context,fx.kind,frame,x,y,360,202,{baseline:101,flip:actor.team===TEAM_ENEMY,blend:'source-over',alpha:.94});
  }else{
    const enemyTeam=actor.team===TEAM_PLAYER?TEAM_ENEMY:TEAM_PLAYER,slots=units.filter(unit=>unit.team===enemyTeam&&unit.hp>0);
    const cx=slots.length?slots.reduce((sum,unit)=>sum+unit.x,0)/slots.length:(actor.team===TEAM_PLAYER?WORLD.width*.72:WORLD.width*.28);
    const cy=slots.length?slots.reduce((sum,unit)=>sum+unit.y,0)/slots.length:WORLD.height*.52;
    drawBachDienAtlas(context,fx.kind,frame,cx,cy,720,405,{baseline:202,blend:'source-over',alpha:.96});
  }
}
window.drawBachDienHero=drawBachDienHero;window.drawBachDienFx=drawBachDienFx;window.isBachDien=isBachDien;window.startBachDienFx=startBachDienFx;window.playBachDienSfx=playBachDienSfx;window.beginBachDienAction=beginBachDienAction;window.waitBachDienMarker=waitBachDienMarker;window.emitBachDienRelease=emitBachDienRelease;window.finishBachDienAction=finishBachDienAction;window.normalizeBachDienAction=normalizeBachDienAction;window.bachDienActionMs=bachDienActionMs;
window.__HV_BACH_DIEN_QA={
  registry:BACH_DIEN_REGISTRY,
  timeline:action=>BACH_DIEN_TIMELINE[normalizeBachDienAction(action)],
  inspect:()=>BACH_DIEN_LOADER.inspect(),
  snapshot:()=>units.filter(isBachDien).map(unit=>({id:unit.id,sourceId:normalizeBachDienHeroId(unit.sourceId),state:unit.state,action:unit._bachDienAction?.action||null,elapsedMs:unit._bachDienAction?.clock?.elapsedMs?.()||0})),
  force:async(action='atk')=>{const actor=units.find(unit=>isBachDien(unit)&&unit.hp>0),target=units.find(unit=>actor&&unit.team!==actor.team&&unit.hp>0);if(!actor||!target)return false;state.mode='battle';state.currentId=actor.id;state.locked=false;return performAction(actor,bachDienLegacyAction(action),target);}
};
`;

export function patchBachDienBattle(input) {
  if (input.includes(marker)) return input;
  let html = input;
  html = replaceOnce(html, `  async function __hvPerformAction3qAdapter(actor, action, target) {
    if(isLinhDong(actor)) action=linhDongLegacyAction(action)||action;
    if (state.locked || state.mode !== "battle" || actor.id !== state.currentId || !Core.canUseAction(actor, action)) return;`, `${runtime}

  async function __hvPerformAction3qAdapter(actor, action, target) {
    if(isLinhDong(actor)) action=linhDongLegacyAction(action)||action;
    if(isBachDien(actor)) action=bachDienLegacyAction(action)||action;
    if (state.locked || state.mode !== "battle" || actor.id !== state.currentId || !Core.canUseAction(actor, action)) return;`, 'runtime insertion');
  html = replaceOnce(html, '    if(isLinhDong(actor)) action=linhDongLegacyAction(action)||action;\n    if(actor?.kitVersion===\'splus42-v2\'&&splusCombat()){', '    if(isLinhDong(actor)) action=linhDongLegacyAction(action)||action;\n    if(isBachDien(actor)) action=bachDienLegacyAction(action)||action;\n    if(actor?.kitVersion===\'splus42-v2\'&&splusCombat()){', 'performAction alias');
  html = replaceOnce(html, '    if (drawOngPhoGifHero(context, unit) || drawDinhLoiHero(context,unit,time) || drawLucAnhHero(context,unit,time) || drawLinhDongHero(context,unit,time) || drawThayMoIdleQa(context, unit) || drawGeneratedHero(context, unit, time, progress)) {', '    if (drawOngPhoGifHero(context, unit) || drawDinhLoiHero(context,unit,time) || drawLucAnhHero(context,unit,time) || drawLinhDongHero(context,unit,time) || drawBachDienHero(context,unit,time) || drawThayMoIdleQa(context, unit) || drawGeneratedHero(context, unit, time, progress)) {', 'character renderer');
  html = replaceOnce(html, '    drawLucAnhFx(ctx,time);\n    drawLinhDongFx(ctx,time);\n    drawThayMoRangedFx(ctx,time);', '    drawLucAnhFx(ctx,time);\n    drawLinhDongFx(ctx,time);\n    drawBachDienFx(ctx,time);\n    drawThayMoRangedFx(ctx,time);', 'VFX renderer');
  html = replaceOnce(html, '    const usesLucAnh = isLucAnh(actor);\n    const usesLinhDong = isLinhDong(actor);\n    const usesThayMoBasicQa', '    const usesLucAnh = isLucAnh(actor);\n    const usesLinhDong = isLinhDong(actor);\n    const usesBachDien = isBachDien(actor);\n    const usesThayMoBasicQa', 'action identity');
  html = replaceOnce(html, '    } else if (usesLinhDong) {\n      actor.x=actor.baseX;actor.y=actor.baseY;\n      const linhAction=beginLinhDongAction(actor,action,target,battleId);', '    } else if (usesBachDien) {\n      actor.x=actor.baseX;actor.y=actor.baseY;\n      const bachAction=beginBachDienAction(actor,action,target,battleId);\n      setStatus(actor.name+\' \'+(action===\'ultimate\'?\'khai Ly Hồn Đoạt Phách\':\'vung Huyễn Diện Trảm\'));\n      dom.phaseLabel.textContent=action===\'ultimate\'?\'Tuyệt kỹ • Ly Hồn Đoạt Phách\':\'ATK • Huyễn Diện Trảm\';\n      if(!await waitBachDienMarker(bachAction,\'release\',battleId))return;\n      emitBachDienRelease(bachAction);\n      if(!await waitBachDienMarker(bachAction,\'impact\',battleId))return;\n      dom.phaseLabel.textContent=\'Va chạm • Bạch Diện\';\n    } else if (usesLinhDong) {\n      actor.x=actor.baseX;actor.y=actor.baseY;\n      const linhAction=beginLinhDongAction(actor,action,target,battleId);', 'action bridge');
  html=patchBachDienImpactOwner(html);
  html = replaceOnce(html, '    const hitStop = usesLinhDong ? 0 : (REDUCED_MOTION ? 0 : (action === "ultimate" ? 150 : action === "skill" ? 90 : 55));', '    const hitStop = usesLinhDong || usesBachDien ? 0 : (REDUCED_MOTION ? 0 : (action === "ultimate" ? 150 : action === "skill" ? 90 : 55));', 'shared action clock');
  html = replaceOnce(html, '    if (usesLinhDong) {\n      const linhAction=actor._linhDongAction;\n      if(!await waitLinhDongMarker(linhAction,\'recovery:end\',battleId))return;\n      finishLinhDongAction(linhAction);\n    } else if (usesOngPhoGif) {', '    if (usesLinhDong) {\n      const linhAction=actor._linhDongAction;\n      if(!await waitLinhDongMarker(linhAction,\'recovery:end\',battleId))return;\n      finishLinhDongAction(linhAction);\n    } else if (usesBachDien) {\n      const bachAction=actor._bachDienAction;\n      if(!await waitBachDienMarker(bachAction,\'recovery:end\',battleId))return;\n      finishBachDienAction(bachAction);\n    } else if (usesOngPhoGif) {', 'recovery boundary');
  html = replaceOnce(html, '      if (usesLinhDong) {\n        actor.x=origin.x;actor.y=origin.y;dom.phaseLabel.textContent="Thu thế";setUnitState(actor,"idle",800);\n      } else if (usesDinhLoi) {', '      if (usesLinhDong) {\n        actor.x=origin.x;actor.y=origin.y;dom.phaseLabel.textContent="Thu thế";setUnitState(actor,"idle",800);\n      } else if (usesBachDien) {\n        actor.x=origin.x;actor.y=origin.y;dom.phaseLabel.textContent="Thu thế";setUnitState(actor,"idle",800);\n      } else if (usesDinhLoi) {', 'recovery state reset');
  html = replaceOnce(html, '    if(typeof isLinhDong===\'function\'&&isLinhDong(unit)){setLinhDongState(unit,nextState,duration);return;}', '    if(typeof isLinhDong===\'function\'&&isLinhDong(unit)){setLinhDongState(unit,nextState,duration);return;}\n    if(typeof isBachDien===\'function\'&&isBachDien(unit)){setBachDienState(unit,nextState,duration);return;}', 'state bridge');
  html = replaceOnce(html, 'const authoredFallMs=isOngPho(unit)?ONG_PHO_FALL_MS:isDinhLoi(unit)?DINH_LOI_FALL_MS:isLinhDong(unit)?linhDongActionMs(\'fall\'):DEFEAT_FALL_MS;', 'const authoredFallMs=isOngPho(unit)?ONG_PHO_FALL_MS:isDinhLoi(unit)?DINH_LOI_FALL_MS:isLinhDong(unit)?linhDongActionMs(\'fall\'):isBachDien(unit)?bachDienActionMs(\'fall\'):DEFEAT_FALL_MS;', 'fall state');
  html = replaceOnce(html, '      const hurtMs = isOngPho(target) ? ONG_PHO_HIT_MS : isDinhLoi(target) ? DINH_LOI_HIT_MS : isLucAnh(target) ? LUC_ANH_META.hurt.frames*LUC_ANH_META.hurt.ms : isLinhDong(target) ? linhDongActionMs(\'hurt\') : 230;', '      const hurtMs = isOngPho(target) ? ONG_PHO_HIT_MS : isDinhLoi(target) ? DINH_LOI_HIT_MS : isLucAnh(target) ? LUC_ANH_META.hurt.frames*LUC_ANH_META.hurt.ms : isLinhDong(target) ? linhDongActionMs(\'hurt\') : isBachDien(target) ? bachDienActionMs(\'hurt\') : 230;', 'hit clip timing');
  html = replaceOnce(html, '      }else if(isLinhDong(target)){\n        setTimeout(()=>{ if(target.hp>0&&target.state==="hurt") setUnitState(target,"idle",800); }, linhDongActionMs(\'hit\'));\n      }', '      }else if(isLinhDong(target)){\n        setTimeout(()=>{ if(target.hp>0&&target.state==="hurt") setUnitState(target,"idle",800); }, linhDongActionMs(\'hit\'));\n      }else if(isBachDien(target)){\n        setTimeout(()=>{ if(target.hp>0&&target.state==="hurt") setUnitState(target,"idle",800); }, bachDienActionMs(\'hurt\'));\n      }', 'hit reset');
  html = replaceOnce(html, '    if(!isLinhDong(actor)) tone(critical ? 105 : 135, critical ? 0.16 : 0.09, "square", 0.035);', '    if(!isLinhDong(actor)&&!isBachDien(actor)) tone(critical ? 105 : 135, critical ? 0.16 : 0.09, "square", 0.035);', 'impact SFX suppression', true);
  html = replaceOnce(html, '    if(!isLinhDong(actor)) burst(target.x, target.y, options.color || actor.accent, critical ? 25 : 15);', '    if(!isLinhDong(actor)&&!isBachDien(actor)) burst(target.x, target.y, options.color || actor.accent, critical ? 25 : 15);', 'impact VFX suppression');
  html = replaceOnce(html, '    const idleBob = REDUCED_MOTION || isLucAnh(unit) || isLinhDong(unit) ? 0 : Math.sin(time * 0.0032 + unit.phase) * 3.2;', '    const idleBob = REDUCED_MOTION || isLucAnh(unit) || isLinhDong(unit) || isBachDien(unit) ? 0 : Math.sin(time * 0.0032 + unit.phase) * 3.2;', 'authored idle motion');
  html = replaceOnce(html, '    const hurtJitter = unit.state === "hurt" && !isOngPho(unit) && !isLinhDong(unit) && !isThayMoHitQa(unit) ? Math.sin(progress * Math.PI * 7) * 8 : 0;', '    const hurtJitter = unit.state === "hurt" && !isOngPho(unit) && !isLinhDong(unit) && !isBachDien(unit) && !isThayMoHitQa(unit) ? Math.sin(progress * Math.PI * 7) * 8 : 0;', 'authored hit motion');
  html = replaceOnce(html, '    if (!isOngPho(unit) && !isLucAnh(unit) && !isLinhDong(unit)) context.rotate(lean * (unit.team === TEAM_PLAYER ? 1 : -1));', '    if (!isOngPho(unit) && !isLucAnh(unit) && !isLinhDong(unit) && !isBachDien(unit)) context.rotate(lean * (unit.team === TEAM_PLAYER ? 1 : -1));', 'authored attack baseline');
  html = replaceOnce(html, '    if (!alive && !isOngPho(unit) && !isLinhDong(unit)) {', '    if (!alive && !isOngPho(unit) && !isLinhDong(unit) && !isBachDien(unit)) {', 'authored fall baseline');
  html = replaceOnce(html, 'const sourceId = /^(?:linh_dong|linh-dong|hero_splus_linh_dong)$/i.test(rawSourceId) ? "hero_splus_linh_dong" : rawSourceId;', 'const sourceId = /^(?:linh_dong|linh-dong|hero_splus_linh_dong)$/i.test(rawSourceId) ? "hero_splus_linh_dong" : /^(?:bach_dien|bach-dien|hero_splus_bach_dien)$/i.test(rawSourceId) ? "hero_splus_bach_dien" : rawSourceId;', 'configured hero identity');
  html = replaceOnce(html, '  if(new URLSearchParams(location.search).has(\'linhDongQa\')){const qaHero=HEROES.find(hero=>hero.team===TEAM_PLAYER&&hero.slot===5)||HEROES.find(hero=>hero.team===TEAM_PLAYER);if(qaHero)Object.assign(qaHero,{sourceId:\'hero_splus_linh_dong\',name:\'Linh Đồng\',title:\'Mộng thuật / Khống chế\',initial:\'L\',he:\'mong\',archetype:\'mystic\',weapon:\'staff\',skillName:\'Oan Linh Tỏa\',skillKind:\'debuff\',skillMultiplier:1.05,ultimateName:\'Bách Quỷ Dạ Hành\',ultimateKind:\'aoe\',ultimateMultiplier:1.18});}', '  if(new URLSearchParams(location.search).has(\'linhDongQa\')){const qaHero=HEROES.find(hero=>hero.team===TEAM_PLAYER&&hero.slot===5)||HEROES.find(hero=>hero.team===TEAM_PLAYER);if(qaHero)Object.assign(qaHero,{sourceId:\'hero_splus_linh_dong\',name:\'Linh Đồng\',title:\'Mộng thuật / Khống chế\',initial:\'L\',he:\'mong\',archetype:\'mystic\',weapon:\'staff\',skillName:\'Oan Linh Tỏa\',skillKind:\'debuff\',skillMultiplier:1.05,ultimateName:\'Bách Quỷ Dạ Hành\',ultimateKind:\'aoe\',ultimateMultiplier:1.18});}\n  if(new URLSearchParams(location.search).has(\'bachDienQa\')){const qaHero=HEROES.find(hero=>hero.team===TEAM_PLAYER&&hero.slot===4)||HEROES.find(hero=>hero.team===TEAM_PLAYER);if(qaHero)Object.assign(qaHero,{sourceId:\'hero_splus_bach_dien\',name:\'Bạch Diện\',title:\'Âm Hồn / Sát thủ phép\',initial:\'B\',he:\'soul\',archetype:\'duelist\',weapon:\'fan\',skillName:\'Huyễn Diện Trảm\',skillKind:\'damage\',skillMultiplier:2.4,ultimateName:\'Ly Hồn Đoạt Phách\',ultimateKind:\'damage\',ultimateMultiplier:4.2});}', 'QA roster hook');
  return html;
}

export function writeBachDienStaticFingerprint() {
  const files = Object.fromEntries(REQUIRED_ASSETS.map(relativePath => {
    const assetPath = join(root, 'dist', relativePath);
    if (!existsSync(assetPath)) throw new Error(`Missing Bạch Diện runtime asset: ${relativePath}`);
    const bytes = readFileSync(assetPath);
    if (bytes.length <= 32) throw new Error(`Bạch Diện runtime asset is empty or placeholder: ${relativePath}`);
    return [relativePath, {
      bytes: bytes.length,
      sha256: createHash('sha256').update(bytes).digest('hex')
    }];
  }));
  const fingerprint = {
    schema: 'hon-viet-bach-dien-static-fingerprint/v1',
    source: 'main-asset-tree',
    files
  };
  const fingerprintPath = join(root, 'dist', 'assets', 'characters', 'bach-dien', 'static-fingerprint.json');
  writeFileSync(fingerprintPath, `${JSON.stringify(fingerprint, null, 2)}\n`);
  return fingerprint;
}

if (process.env.HV_SKIP_BACH_DIEN_BUILD_PATCH !== '1' && existsSync(path)) {
  writeFileSync(path, patchBachDienBattle(readFileSync(path, 'utf8')));
  const fingerprint = writeBachDienStaticFingerprint();
  console.log(`Bạch Diện Canvas Sprite Runtime installed; ${Object.keys(fingerprint.files).length} asset fingerprints recorded`);
}
