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
function tichDaoPaint(ctx,key,frame,x,y,w,h){const c=TICH_DAO_META.clips[key],img=tichDaoImage(key);if(!img||img.complete===false||img.naturalWidth===0)return false;ctx.save();ctx.drawImage(img,(frame%c.cols)*c.cellW,Math.floor(frame/c.cols)*c.cellH,c.cellW,c.cellH,x,y,w,h);ctx.restore();return true;}
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
function drawTichDaoHero(ctx,u,time){
 if(!isTichDao(u))return false;
 const info=u._tichDaoAction,active=info&&info.battleId===state.battleId;
 let key='idle',elapsed=time,loop=true,frame=0,nextPage=null,hidden=false;
 if(u.hp<=0){key='fall-die';elapsed=Math.max(0,time-u.defeatedAt)*TICH_DAO_META.clips['fall-die'].durationMs/(u.defeatFallDuration||tichDaoFallDuration());loop=false;}
 else if((u.state==='hurt'||u.state==='hit')&&time-u.stateStarted<TICH_DAO_META.clips.hit.durationMs){key='hit';elapsed=Math.max(0,time-u.stateStarted);loop=false;}
 else if(active){key=info.action;elapsed=tichDaoElapsed(info);loop=false;}
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
 if(hidden){
  // Vanish phases draw nothing: no frame, no standing fallback, and the
  // shared visibility snapshot is left untouched so the body cannot leak.
  // The HP bar keeps its authored anchor above the empty ground.
  if(u.hp>0)drawUnitHud(ctx,u,time,1);
  return true;
 }
 ctx.save();ctx.translate(u.x,u.y);const scale=battleCharacterDepthScale(u)*battleCharacterScale(u);ctx.scale(scale*(u.team===TEAM_ENEMY?-1:1),scale);
 // Keep a canonical, unscaled body frame in the shared visibility owner.
 // Idle pages share the 480x440 battle cell grid, so they use the same
 // bottom-center registration as every other authored clip of this pack.
 const paintBody=copy=>tichDaoPaint(copy,key,frame,-240,-440,480,440)||(u.hp>0&&tichDaoPaint(copy,'standing',0,-240,-440,480,440));
 const drawn=__hvHeroVisibility.finish(ctx,'tich-dao',u,time,paintBody(ctx),paintBody);
 ctx.restore();if(nextPage)tichDaoImage(nextPage,'prefetch');if(u.hp>0)drawUnitHud(ctx,u,time,1);return drawn;
}
async function beginTichDaoAction(actor,action,target,battleId){
 const normalized=action==='ultimate'?'ultimate':'basic';
 // Snapshot x1/x2/x3 for the whole cast so animation and damage agree.
 const speed=[1,2,3].reduce((a,b)=>Math.abs(b-state.speed)<Math.abs(a-state.speed)?b:a,1);
 const info={actor,action:normalized,battleId,speed,target,startedAt:0,abort:new AbortController(),lease:null};tichDaoActive.add(info);
 try{
  if(!__hvIsSkipping()){
   info.lease=await __hvSkipVisualAssets(()=>BACH_DIEN_LOADER.acquire([normalized,'standing'].map(tichDaoClip),{scope:'battle',owner:'tich-dao:'+actor.id,signal:info.abort.signal}),battleId);
   if(__hvIsSkipping())info.abort.abort();
  }
  if(battleId!==state.battleId){finishTichDaoAction(info);return null;}
  info.startedAt=performance.now();actor._tichDaoAction=info;
  actor.state=normalized==='ultimate'?'ultimate':'attack';actor.stateStarted=info.startedAt;
  actor.stateDuration=TICH_DAO_META.clips[normalized].durationMs/speed;
  return info;
 }catch(error){finishTichDaoAction(info);if(error.name!=='AbortError')console.error('Tích Đạo asset readiness failed',error);return null;}
}
async function waitTichDaoMarker(info,marker,battleId){
 const clip=TICH_DAO_META.clips[info.action];
 const at=typeof marker==='number'?marker:marker==='recovery:end'?clip.durationMs:marker==='release'?(clip.releaseMs??0):(clip.impactMs??clip.releaseMs??0);
 while(state.battleId===battleId){if(__hvIsSkipping()||tichDaoElapsed(info)>=at)return true;if(!await sleepVisualMilliseconds(Math.min(40,(at-tichDaoElapsed(info))/info.speed),battleId))break;}
 finishTichDaoAction(info);return false;
}
function finishTichDaoAction(info){if(!info)return;info.abort.abort();info.lease?.release();tichDaoActive.delete(info);if(info.actor._tichDaoAction===info)delete info.actor._tichDaoAction;}
function cancelTichDaoActions(){for(const info of [...tichDaoActive])finishTichDaoAction(info);}
async function resolveTichDaoCast(e,info,actor,action,target,battleId){
 if(action!=='ultimate')return e.act(actor.id,action,target?.id);
 const result=e.act(actor.id,action,target?.id,{deferTichDao:true});if(!result.ok)return result;
 const strikes=TICH_DAO_META.clips.ultimate.strikeMs;
 for(let strike=0;strike<strikes.length;strike++){
  // Each authored phase lands its own strike and shows its own floaters.
  if(!await waitTichDaoMarker(info,strikes[strike],battleId))return {ok:false};
  e.resolveTichDaoImpact(actor,result.castId,strike);
  if(splusPresentation){for(const entry of splusPresentation.values())splusFloater(entry.target,entry.amount,entry.healing,entry.critical);splusPresentation.clear();}
  updateTeamCounters();splusStateView();
 }
 e.finishTichDaoCast(actor,result.castId);return result;
}
