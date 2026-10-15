// Injected in the production battle closure. Uses its scheduler, cache and SFX bus.
const TIEU_PHONG_BASE='assets/characters/tieu-phong/';
const tieuPhongActive=new Set();
// Register the authored extra in the existing manual skill dialog owner.
if(globalThis.SPLUS42?.profiles){
 const hero=globalThis.SPLUS42.catalog.find(h=>h.id==='hero_splus_tieu_phong');
 if(hero&&!globalThis.SPLUS42.profiles.profiles.some(h=>h.id===hero.id))globalThis.SPLUS42.profiles.profiles.push({...hero,skills:Object.fromEntries(['passive','ultimate'].map(slot=>{const skill=slot==='passive'?hero.passive:hero.actions[slot];return [slot,{...skill,slot,shortName:skill.name,effects:skill.effects||[],target:skill.target||'Bản thân'}];}))});
}
function isTieuPhong(u){return !!u&&[u.sourceId,u.sourceHeroId,u.id].some(x=>/^(?:hero_splus_)?tieu[_-]phong$/i.test(String(x)));}
function tieuPhongClip(key){const c=TIEU_PHONG_META.clips[key],rows=c.rows??Math.ceil(c.frames/c.cols);return {...c,src:TIEU_PHONG_BASE+c.file,rows,decodedBytes:c.cols*c.cellW*rows*c.cellH*4};}
function tieuPhongImage(key,priority='visible'){return BACH_DIEN_LOADER.ensure(tieuPhongClip(key),{scope:'battle',priority}).image;}
function tieuPhongPaint(ctx,key,frame,x,y,w,h){const c=TIEU_PHONG_META.clips[key],img=tieuPhongImage(key);if(!img||img.complete===false||img.naturalWidth===0)return false;ctx.save();ctx.globalCompositeOperation=c.blendMode;ctx.drawImage(img,(frame%c.cols)*c.cellW,Math.floor(frame/c.cols)*c.cellH,c.cellW,c.cellH,x,y,w,h);ctx.restore();return true;}
function tieuPhongElapsed(info){return Math.max(0,(performance.now()-info.startedAt)*info.speed);}
function tieuPhongFrame(durations,elapsed,loop){
 const total=durations.reduce((a,b)=>a+b,0);let t=loop?elapsed%total:Math.min(elapsed,total-.001);
 for(let i=0;i<durations.length;i++){t-=durations[i];if(t<0)return i;}return durations.length-1;
}
function tieuPhongFallDuration(){return 900/Math.max(1,Math.min(3,Number(state.speed)||1));}
function drawTieuPhongHero(ctx,u,time){
 if(!isTieuPhong(u))return false;
 const info=u._tieuPhongAction,active=info&&info.battleId===state.battleId;
 let key='idle',elapsed=time,loop=true,frame=0,nextPage=null;
 if(u.hp<=0){key='fall-die';elapsed=Math.max(0,time-u.defeatedAt)*TIEU_PHONG_META.clips['fall-die'].durationMs/(u.defeatFallDuration||tieuPhongFallDuration());loop=false;}
 else if((u.state==='hurt'||u.state==='hit')&&time-u.stateStarted<TIEU_PHONG_META.clips.hit.durationMs){key='hit';elapsed=Math.max(0,time-u.stateStarted);loop=false;}
 else if(active){key=info.action;elapsed=tieuPhongElapsed(info);loop=false;}
 else if(u.state==='run'){key='run';elapsed=Math.max(0,time-u.stateStarted);}
 if(key==='idle'){
  frame=tieuPhongFrame(TIEU_PHONG_META.idleVisual.frameDurationsMs,elapsed,true);key='idle-authored-'+Math.floor(frame/TIEU_PHONG_META.idleVisual.pageFrames);frame%=TIEU_PHONG_META.idleVisual.pageFrames;
  // Paint the visible page before admitting speculative work to the shared LRU.
  nextPage='idle-authored-'+((Number(key.slice(14))+1)%TIEU_PHONG_META.idleVisual.pages);
 }else frame=tieuPhongFrame(TIEU_PHONG_META.clips[key].frameDurationsMs,elapsed,loop);
 ctx.save();ctx.translate(u.x,u.y-(active&&info.action==='ultimate'?tieuPhongLift(info):0));const scale=battleCharacterDepthScale(u)*battleCharacterScale(u);ctx.scale(scale*(u.team===TEAM_ENEMY?-1:1),scale);
 // Keep a canonical, unscaled body frame in the shared visibility owner.
 // The outer transform owns position, depth and enemy mirroring exactly once.
 // One registration for the entire authored idle loop, measured against the
 // 413px standing/action body and its ground at y=-12. Never fit per frame.
 const idleScale=413/648.5,idleW=432*idleScale,idleH=668*idleScale;
 const paintBody=copy=>key.startsWith('idle-authored-')?tieuPhongPaint(copy,key,frame,-idleW/2,-12-658*idleScale,idleW,idleH):tieuPhongPaint(copy,key,frame,-240,-440,480,440)||(u.hp>0&&tieuPhongPaint(copy,'standing',0,-240,-440,480,440));
 const drawn=__hvHeroVisibility.finish(ctx,'tieu-phong',u,time,paintBody(ctx),paintBody);
 ctx.restore();if(nextPage)tieuPhongImage(nextPage,'prefetch');if(u.hp>0)drawUnitHud(ctx,u,time,1);return drawn;
}
async function beginTieuPhongAction(actor,action,target,battleId){
 const normalized=action==='ultimate'?'ultimate':'basic';
 // Snapshot x1/x2/x3 for the whole cast so animation and the baked mix agree.
 const speed=[1,2,3].reduce((a,b)=>Math.abs(b-state.speed)<Math.abs(a-state.speed)?b:a,1);
 const info={actor,action:normalized,battleId,speed,target,startedAt:0,abort:new AbortController(),lease:null};tieuPhongActive.add(info);
 try{
  if(!__hvIsSkipping()){
   info.lease=await __hvSkipVisualAssets(()=>BACH_DIEN_LOADER.acquire([normalized,'standing','wind-'+normalized,'impact-'+normalized].map(tieuPhongClip),{scope:'battle',owner:'tieu-phong:'+actor.id,signal:info.abort.signal}),battleId);
   if(__hvIsSkipping())info.abort.abort();
   await window.HonVietSfx?.prepare('tieu-phong-'+normalized+'-x'+speed,{signal:info.abort.signal});
  }
  if(battleId!==state.battleId){finishTieuPhongAction(info);return null;}
  info.startedAt=performance.now();actor._tieuPhongAction=info;
  actor.state=normalized==='ultimate'?'ultimate':'attack';actor.stateStarted=info.startedAt;
  actor.stateDuration=TIEU_PHONG_META.clips[normalized].durationMs/speed;
  info.targets=(normalized==='ultimate'?splusCombat().targets(actor,'ultimate'):[target]).filter(Boolean).map(u=>({id:u.id,x:u.x,y:u.y,slot:u.slot}));
  const dir=actor.team===TEAM_ENEMY?-1:1;const sorted=info.targets.slice().sort((a,b)=>(a.x-b.x)*dir);
  info.groundY=sorted[0]?.y??actor.y;info.fromX=(sorted[0]?.x??actor.x)-dir*90;info.toX=(sorted.at(-1)?.x??actor.x)+dir*70;
  info.impacts=(normalized==='ultimate'?[800,1300,1800]:[216.667]).flatMap((at,wave)=>sorted.map(t=>({at:at+(normalized==='ultimate'?400:300)*((t.x-info.fromX)/(info.toX-info.fromX)),wave,targetId:t.id}))).sort((a,b)=>a.at-b.at);
  if(state.sound&&!__hvIsSkipping())void window.HonVietSfx?.play('tieu-phong-'+normalized+'-x'+speed,{group:'combat',signal:info.abort.signal});
  return info;
 }catch(error){finishTieuPhongAction(info);if(error.name!=='AbortError')console.error('Tiêu Phong asset readiness failed',error);return null;}
}
async function waitTieuPhongMarker(info,marker,battleId){
 const at=typeof marker==='number'?marker:marker==='release'?(info.action==='ultimate'?800:216.667):marker==='impact'?info.impacts[0].at:TIEU_PHONG_META.clips[info.action].durationMs;
 while(state.battleId===battleId){if(__hvIsSkipping()||tieuPhongElapsed(info)>=at)return true;if(!await sleepVisualMilliseconds(Math.min(40,(at-tieuPhongElapsed(info))/info.speed),battleId))break;}
 finishTieuPhongAction(info);return false;
}
function finishTieuPhongAction(info){if(!info)return;info.abort.abort();info.lease?.release();tieuPhongActive.delete(info);if(info.actor._tieuPhongAction===info)delete info.actor._tieuPhongAction;}
function cancelTieuPhongActions(){for(const info of [...tieuPhongActive])finishTieuPhongAction(info);}
function tieuPhongLift(info){
 const age=tieuPhongElapsed(info),actor=info.actor,target=getUnit(info.targets[0]?.id);
 const correction=target&&typeof battleHeroVisualScale==='function'?battleHeroVisualScale(target):1;
 const height=(target?battleCharacterScale(target)*battleCharacterDepthScale(target)/correction:.5)*310;
 const max=Math.max(0,actor.y-(info.groundY-height));
 const points=[[0,0],[500,1],[2200,1],[2700,0]];
 for(let i=1;i<points.length;i++){const [b,w]=points[i],[a,v]=points[i-1];if(age<=b){const p=Math.max(0,Math.min(1,(age-a)/(b-a)));return max*(v+(w-v)*p*p*(3-2*p));}}return 0;
}
function drawTieuPhongFx(ctx){
 for(const info of tieuPhongActive){
  if(!info.startedAt||info.battleId!==state.battleId||__hvIsSkipping())continue;
  const age=tieuPhongElapsed(info),starts=info.action==='ultimate'?[800,1300,1800]:[216.667];
  const scale=battleCharacterScale(info.actor)*battleCharacterDepthScale(info.actor);
  for(const at of starts){const p=(age-at)/(info.action==='ultimate'?400:300);if(p<0||p>=1)continue;const c=TIEU_PHONG_META.clips['wind-'+info.action];
   // Size both tornado attacks to the enemy body, preserving the ground anchor.
   const targetHeights=info.targets.map(t=>getUnit(t.id)).filter(Boolean).map(t=>310*battleCharacterScale(t)*battleCharacterDepthScale(t)/(typeof battleHeroVisualScale==='function'?battleHeroVisualScale(t):1));
   const h=Math.max(...targetHeights,310*scale)*1.45,w=h*c.cellW/c.cellH;
   const frame=Math.min(c.frames-1,Math.floor(p*c.frames)),x=info.fromX+(info.toX-info.fromX)*p;
   // Two offset, lighter spiral echoes broaden the ground-hugging gust while
   // the larger authored vortex stays in front and keeps the same timing.
   const echoH=h*.68,echoW=echoH*c.cellW/c.cellH,alpha=ctx.globalAlpha??1;
   ctx.save();ctx.globalAlpha=alpha*.56;
   tieuPhongPaint(ctx,'wind-'+info.action,Math.max(0,frame-2),x-w*.32-echoW/2,info.groundY-echoH,echoW,echoH);
   tieuPhongPaint(ctx,'wind-'+info.action,Math.min(c.frames-1,frame+2),x+w*.32-echoW/2,info.groundY-echoH,echoW,echoH);
   ctx.restore();tieuPhongPaint(ctx,'wind-'+info.action,frame,x-w/2,info.groundY-h,w,h);
  }
  for(const hit of info.impacts){const dt=age-hit.at;if(dt<0||dt>=150)continue;const target=getUnit(hit.targetId);if(!target)continue;const c=TIEU_PHONG_META.clips['impact-'+info.action],w=c.cellW*scale*1.45,h=c.cellH*scale*1.45;
   tieuPhongPaint(ctx,'impact-'+info.action,Math.min(c.frames-1,Math.floor(dt/150*c.frames)),target.x-w/2,target.y-h,w,h);
  }
 }
}
async function resolveTieuPhongCast(e,info,actor,action,target,battleId){
 if(action!=='ultimate')return e.act(actor.id,action,target?.id);
 const result=e.act(actor.id,action,target?.id,{deferTieuPhong:true});if(!result.ok)return result;
 for(const hit of info.impacts){
  if(!await waitTieuPhongMarker(info,hit.at,battleId))return {ok:false};
  e.resolveTieuPhongImpact(actor,result.castId,hit.wave,hit.targetId);
  // Show each pass as it contacts its own target, never aggregate all three.
  if(splusPresentation){for(const entry of splusPresentation.values())splusFloater(entry.target,entry.amount,entry.healing,entry.critical);splusPresentation.clear();}
  updateTeamCounters();splusStateView();
 }
 e.finishTieuPhongCast(actor,result.castId);return result;
}

