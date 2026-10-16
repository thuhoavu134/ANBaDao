// Injected in the production battle closure. Uses its scheduler, cache and HUD owners.
// The authored ultimate keeps its 4.0s nine-phase timeline; the two vanish
// phases hide the whole body instead of holding a frame.
const TICH_DAO_BASE='assets/characters/tich-dao/';
const tichDaoActive=new Set();
// Register the authored extra in the existing manual skill dialog owner.
if(globalThis.SPLUS42?.profiles){
 const hero=globalThis.SPLUS42.catalog.find(h=>h.id==='hero_splus_tich_dao');
 if(hero&&!globalThis.SPLUS42.profiles.profiles.some(h=>h.id===hero.id))globalThis.SPLUS42.profiles.profiles.push({...hero,skills:Object.fromEntries(['passive','ultimate'].map(slot=>{const skill=slot==='passive'?hero.passive:hero.actions[slot];return [slot,{...skill,slot,shortName:skill.name,effects:skill.effects||[],target:skill.target||'Bản thân'}];}))});
}
function isTichDao(u){return !!u&&[u.sourceId,u.sourceHeroId,u.id].some(x=>/^(?:hero_splus_)?tich[_-]dao$/i.test(String(x)));}
function tichDaoClip(key){const c=TICH_DAO_META.clips[key],rows=c.rows??Math.ceil(c.frames/c.cols);return {...c,src:TICH_DAO_BASE+c.file,rows,decodedBytes:c.cols*c.cellW*rows*c.cellH*4};}
function tichDaoImage(key,priority='visible'){return BACH_DIEN_LOADER.ensure(tichDaoClip(key),{scope:'battle',priority}).image;}
function tichDaoPaint(ctx,key,frame,x,y,w,h){const c=TICH_DAO_META.clips[key],img=tichDaoImage(key);if(!img||img.complete===false||img.naturalWidth===0)return false;
 // Atk/ultimate/hit/run/fall cells carry a smaller body than idle — scale the
 // cell back to idle height, anchored bottom-center so feet stay planted.
 const k=(c.content&&c.content.scale)||1,dw=w*k,dh=h*k;
 ctx.save();ctx.drawImage(img,(frame%c.cols)*c.cellW,Math.floor(frame/c.cols)*c.cellH,c.cellW,c.cellH,(x+w/2)-dw/2,(y+h)-dh,dw,dh);ctx.restore();return true;}
function tichDaoElapsed(info){return Math.max(0,(performance.now()-info.startedAt)*info.speed);}
function tichDaoFrame(durations,elapsed,loop){
 const total=durations.reduce((a,b)=>a+b,0);let t=loop?elapsed%total:Math.min(elapsed,total-.001);
 for(let i=0;i<durations.length;i++){t-=durations[i];if(t<0)return i;}return durations.length-1;
}
function tichDaoFallDuration(){return 900/Math.max(1,Math.min(3,Number(state.speed)||1));}
function tichDaoPhaseAt(elapsed){
 for(const phase of TICH_DAO_META.ultimateTimeline.phases)if(elapsed>=phase.startMs&&elapsed<phase.endMs)return phase;
 return null;
}
// Sát thủ di chuyển: ẩn tại chỗ → hiện TRƯỚC MẶT địch hàng sau → chém → về nhà.
function __tdSetSpot(info,spot){if(info)info.spot=spot;}
function tichDaoSpotFor(actor,unitLike){
 if(!actor||!unitLike)return null;
 const dir=(actor.x!==undefined&&actor.x!==unitLike.x)?Math.sign(actor.x-unitLike.x):1;
 return {x:unitLike.x+dir*70,y:unitLike.y+8};
}
function tichDaoBodyPos(u,elapsed,key){
 const info=u._tichDaoAction;if(!info||!info.spot)return null;
 const home={x:u.x,y:u.y},spot=info.spot,lerp=(a,b,t)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
 if(key==='ultimate'){
  const phase=tichDaoPhaseAt(elapsed);if(!phase)return null;
  const id=phase.id,pr=Math.max(0,Math.min(1,(elapsed-phase.startMs)/Math.max(1,phase.endMs-phase.startMs)));
  if(id==='phase-02-dash-out')return lerp(home,spot,Math.min(1,pr*1.15));
  if(id==='phase-04-reappear-strike-1'||id==='phase-06-reappear-combo'||id==='phase-08-final-strike'||id==='phase-07-settle')return spot;
  if(id==='phase-09-recovery')return lerp(spot,home,pr);
  return null; // windup + vanish gaps: đứng/ẩn tại nhà
 }
 if(key==='basic'){
  const c=TICH_DAO_META.clips.basic,dur=c.durationMs||900,rel=c.releaseMs||300;
  if(elapsed<rel-60)return null;
  if(elapsed<dur-220)return spot;
  return lerp(spot,home,(elapsed-(dur-220))/220);
 }
 return null;
}
function drawTichDaoHero(ctx,u,time){
 if(!isTichDao(u))return false;
 const info=u._tichDaoAction,active=info&&info.battleId===state.battleId;
 let key='idle',elapsed=time,loop=true,frame=0,nextPage=null,hidden=false;
 if(u.hp<=0){key='fall-die';elapsed=Math.max(0,time-u.defeatedAt)*TICH_DAO_META.clips['fall-die'].durationMs/(u.defeatFallDuration||tichDaoFallDuration());loop=false;}
 else if((u.state==='hurt'||u.state==='hit')&&time-u.stateStarted<TICH_DAO_META.clips.hit.durationMs){key='hit';elapsed=Math.max(0,time-u.stateStarted);loop=false;}
 else if(active){key=info.action;elapsed=tichDaoElapsed(info);if(info.rainDelay&&elapsed>=3150)elapsed-=Math.min(elapsed-3150,info.rainDelay);loop=false;}
 else if(u.state==='run'){key='run';elapsed=Math.max(0,time-u.stateStarted);}
 if(key==='idle'){
  frame=tichDaoFrame(TICH_DAO_META.idleVisual.frameDurationsMs,elapsed,true);key='idle-authored-'+Math.floor(frame/TICH_DAO_META.idleVisual.pageFrames);frame%=TICH_DAO_META.idleVisual.pageFrames;
  // Paint the visible page before admitting speculative work to the shared LRU.
  nextPage='idle-authored-'+((Number(key.slice(14))+1)%TICH_DAO_META.idleVisual.pages);
 }else if(key==='ultimate'&&active){
  const phase=tichDaoPhaseAt(elapsed);
  if(phase){
   const cells=phase.cells,progress=(elapsed-phase.startMs)/Math.max(1,phase.endMs-phase.startMs);
   frame=cells.length?cells[Math.min(cells.length-1,Math.floor(progress*cells.length))]:0;
   hidden=!phase.visible;
  }else hidden=true;
 }else frame=tichDaoFrame(TICH_DAO_META.clips[key].frameDurationsMs,elapsed,loop);
 const bodyPos=tichDaoBodyPos(u,elapsed,key);
 if(hidden){
  // Vanish phases draw nothing: no frame, no standing fallback, and the
  // shared visibility snapshot is left untouched so the body cannot leak.
  // The HP bar keeps its authored anchor above the empty ground.
  if(u.hp>0)drawUnitHud(ctx,u,time,1);
  return true;
 }
 ctx.save();ctx.translate(bodyPos?bodyPos.x:u.x,bodyPos?bodyPos.y:u.y);const scale=battleCharacterDepthScale(u)*battleCharacterScale(u);ctx.scale(scale*(u.team===TEAM_ENEMY?-1:1),scale);
 // Keep a canonical, unscaled body frame in the shared visibility owner.
 // Idle pages share the 480x440 battle cell grid, so they use the same
 // bottom-center registration as every other authored clip of this pack.
 const paintBody=copy=>tichDaoPaint(copy,key,frame,-240,-440,480,440)||(u.hp>0&&tichDaoPaint(copy,'standing',0,-240,-440,480,440));
 const drawn=__hvHeroVisibility.finish(ctx,'tich-dao',u,time,paintBody(ctx),paintBody);
 ctx.restore();if(nextPage)tichDaoImage(nextPage,'prefetch');if(u.hp>0)drawUnitHud(ctx,u,time,1);return drawn;
}
async function beginTichDaoAction(actor,action,target,battleId,engine){
 const normalized=action==='ultimate'?'ultimate':'basic';
 // Snapshot x1/x2/x3 for the whole cast so animation and damage agree.
 const speed=[1,2,3].reduce((a,b)=>Math.abs(b-state.speed)<Math.abs(a-state.speed)?b:a,1);
 const info={actor,action:normalized,battleId,speed,target,startedAt:0,abort:new AbortController(),lease:null};tichDaoActive.add(info);
 try{
  if(!__hvIsSkipping()){
   info.lease=await __hvSkipVisualAssets(()=>BACH_DIEN_LOADER.acquire([...[normalized,'standing'].map(tichDaoClip),...Object.keys(TICH_DAO_META.vfx.clips).map(tichDaoVfxClip)],{scope:'battle',owner:'tich-dao:'+actor.id,signal:info.abort.signal}),battleId);
   if(__hvIsSkipping())info.abort.abort();
  }
  try{
   const cues=(normalized==='ultimate'?['blink','slash','sword-rain','execute-impact']:['blink','slash']).map(key=>'tich-dao-'+key);
   for(const cue of cues)await window.HonVietSfx?.prepare(cue,{signal:info.abort.signal});
  }catch(error){}
  if(battleId!==state.battleId){finishTichDaoAction(info);return null;}
  // Resolve the visual destination before phase-02, without spending rage
  // or resolving damage ahead of the shared impact marker.
  const opening=engine?.tichDaoOpeningTarget(actor.id,normalized);
  info.spot=tichDaoSpotFor(actor,opening?getUnit(opening.id):target);
  info.startedAt=performance.now();actor._tichDaoAction=info;
  actor.state=normalized==='ultimate'?'ultimate':'attack';actor.stateStarted=info.startedAt;
  actor.stateDuration=TICH_DAO_META.clips[normalized].durationMs/speed;
  return info;
 }catch(error){finishTichDaoAction(info);if(error.name!=='AbortError')console.error('Tịch Dao asset readiness failed',error);return null;}
}
async function waitTichDaoMarker(info,marker,battleId){
 const clip=TICH_DAO_META.clips[info.action];
 const at=typeof marker==='number'?marker:marker==='recovery:end'?clip.durationMs+(info.rainDelay||0):marker==='release'?(clip.releaseMs??0):(clip.impactMs??clip.releaseMs??0);
 while(state.battleId===battleId){if(__hvIsSkipping()||tichDaoElapsed(info)>=at)return true;if(!await sleepVisualMilliseconds(Math.min(40,(at-tichDaoElapsed(info))/info.speed),battleId))break;}
 finishTichDaoAction(info);return false;
}
function finishTichDaoAction(info){if(!info)return;info.abort.abort();info.lease?.release();tichDaoActive.delete(info);if(info.actor._tichDaoAction===info)delete info.actor._tichDaoAction;}
function cancelTichDaoActions(){for(const info of [...tichDaoActive])finishTichDaoAction(info);tichDaoVfxLive.length=0;}
/* ---- VFX Cổ Mộ overlays: grid atlases under assets/vfx/tich-dao/ ---- */
function tichDaoVfxClip(key){const c=TICH_DAO_META.vfx.clips[key];return {...c,src:'assets/vfx/tich-dao/'+c.file,decodedBytes:c.cols*c.cellW*Math.ceil(c.frames/c.cols)*c.cellH*4};}
function tichDaoVfxImage(key){return BACH_DIEN_LOADER.ensure(tichDaoVfxClip(key),{scope:'battle',priority:'visible'}).image;}
const tichDaoVfxLive=[];
function tichDaoSfx(cue,info){
 if(!state.sound||__hvIsSkipping())return;
 try{void window.HonVietSfx?.play(cue,{group:'combat',signal:info.abort.signal,playbackRate:info.speed});}catch(error){}
}
function spawnTichDaoVfx(key,x,y,info,target){if(!TICH_DAO_META.vfx?.clips?.[key])return;tichDaoVfxImage(key);const waistY=target?target.y-310*battleCharacterDepthScale(target)*battleCharacterScale(target)/(typeof battleHeroVisualScale==='function'?battleHeroVisualScale(target):1)*.5:y;
 tichDaoVfxLive.push({key,x,y,waistY,speed:info?.speed||state.speed||1,startedAt:performance.now(),battleId:state.battleId});}
function drawTichDaoVfx(context,time){
 for(let i=tichDaoVfxLive.length-1;i>=0;i--){
  const v=tichDaoVfxLive[i],clip=TICH_DAO_META.vfx.clips[v.key],elapsed=(time-v.startedAt)*v.speed,ms=clip.frames/clip.fps*1000;
  if(elapsed>=ms||state.battleId!==v.battleId){tichDaoVfxLive.splice(i,1);continue;}
  const img=tichDaoVfxImage(v.key);if(!img||img.complete===false||img.naturalWidth===0)continue;
  const frame=Math.min(clip.frames-1,Math.floor(elapsed/1000*clip.fps));
  // Only the flower ring is centered on the target waist; other approved FX keep their anchors.
  const d=clip.display||{},dh=d.heightPx||clip.cellH,anchor=d.headAnchor??0.78;
  const k=dh/clip.cellH,w=clip.cellW*k,h=dh;
  context.save();context.globalCompositeOperation=clip.blendMode||'source-over';context.drawImage(img,(frame%clip.cols)*clip.cellW,Math.floor(frame/clip.cols)*clip.cellH,clip.cellW,clip.cellH,v.x-w/2,d.anchor==='waist'?v.waistY-h/2:v.y-h*anchor,w,h);context.restore();
 }
}
async function resolveTichDaoCast(e,info,actor,action,target,battleId){
 if(action!=='ultimate'){
  const result=e.act(actor.id,action,target?.id);
  // Approved vortex + flower accompany the basic strike at its real victim.
  if(!result.ok)return result;
  const stamped=(result.events||[]).find(x=>x.type==='hoaAn'||x.type==='damage');
  const victim=getUnit(stamped?.targetId||target?.id);
  if(victim){
   __tdSetSpot(info,tichDaoSpotFor(actor,victim));
   spawnTichDaoVfx('vanish',victim.x,victim.y,info);
   spawnTichDaoVfx('appear',victim.x,victim.y,info,victim);

  }
  if(victim){tichDaoSfx('tich-dao-blink',info);tichDaoSfx('tich-dao-slash',info);}
  return result;
 }
 const result=e.act(actor.id,action,target?.id,{deferTichDao:true});if(!result.ok)return result;
 const spotOf=strike=>{
  if(typeof e.tichDaoStrikeTarget!=='function')return null;
  const victim=e.tichDaoStrikeTarget(actor.id,result.castId,strike);
  return victim?tichDaoSpotFor(actor,victim):null;
 };
 const strikeVfx=strike=>{
  const spot=spotOf(strike);if(!spot)return;
  __tdSetSpot(info,spot);
  const victimId=e.tichDaoStrikeTarget(actor.id,result.castId,strike)?.id;
  const victim=getUnit(victimId);
  if(victim){spawnTichDaoVfx('vanish',victim.x,victim.y,info);spawnTichDaoVfx('appear',victim.x,victim.y,info,victim);}
  tichDaoSfx('tich-dao-blink',info);tichDaoSfx('tich-dao-slash',info);
 };
 const at=async ms=>{if(!await waitTichDaoMarker(info,ms,battleId))return false;return state.battleId===battleId;};
 // Nine authored phases: vanish gap → hoa trận xuất hiện + chém (phase-04/06/08),
 // mưa kiếm kết liễu ngay sau nhịp 3, trước phase-09 recovery.
 __tdSetSpot(info,spotOf(0)); // hướng dash phase-02 về nạn nhân đầu
 if(!await at(1000)){return {ok:false};}
 {const spot=info.spot||actor;spawnTichDaoVfx('vanish',spot.x,spot.y,info);}
 if(!await at(1083)){return {ok:false};}
 strikeVfx(0);
 e.resolveTichDaoImpact(actor,result.castId,0);
 if(splusPresentation){for(const entry of splusPresentation.values())splusFloater(entry.target,entry.amount,entry.healing,entry.critical);splusPresentation.clear();}
 updateTeamCounters();splusStateView();
 if(!await at(1500)){return {ok:false};}
 {const spot=info.spot||actor;spawnTichDaoVfx('vanish',spot.x,spot.y,info);}
 if(!await at(1750)){return {ok:false};}
 strikeVfx(1);
 e.resolveTichDaoImpact(actor,result.castId,1);
 if(splusPresentation){for(const entry of splusPresentation.values())splusFloater(entry.target,entry.amount,entry.healing,entry.critical);splusPresentation.clear();}
 updateTeamCounters();splusStateView();
 if(!await at(2917)){return {ok:false};}
 strikeVfx(2);
 e.resolveTichDaoImpact(actor,result.castId,2);
 if(splusPresentation){for(const entry of splusPresentation.values())splusFloater(entry.target,entry.amount,entry.healing,entry.critical);splusPresentation.clear();}
 updateTeamCounters();splusStateView();
 // Mưa kiếm kết liễu trong phase-08 (2917-3292ms), tối đa 2 mục tiêu.
 if(!await at(3150)){return {ok:false};}
 for(let i=0;i<2;i++){
  const victim=e.nextTichDaoExecution(actor,result.castId);if(!victim)break;
  const atMs=3150+(info.rainDelay||0);info.rainDelay=(info.rainDelay||0)+600;
  actor.stateDuration=(TICH_DAO_META.clips.ultimate.durationMs+info.rainDelay)/info.speed;
  const visible=getUnit(victim.id);if(visible)spawnTichDaoVfx('rain',visible.x,visible.y,info);
  tichDaoSfx('tich-dao-sword-rain',info);
  if(!await at(atMs+250))return {ok:false};
  const ex=e.resolveTichDaoExecution(actor,result.castId,victim.id);
  if(ex.executed.length)tichDaoSfx('tich-dao-execute-impact',info);
  if(splusPresentation){for(const entry of splusPresentation.values())splusFloater(entry.target,entry.amount,entry.healing,entry.critical);splusPresentation.clear();}
  updateTeamCounters();splusStateView();
  if(!await at(atMs+600))return {ok:false};
  if(!ex.killed)break;
 }
 if(splusPresentation){for(const entry of splusPresentation.values())splusFloater(entry.target,entry.amount,entry.healing,entry.critical);splusPresentation.clear();}
 updateTeamCounters();splusStateView();
 e.finishTichDaoCast(actor,result.castId);return result;
}

