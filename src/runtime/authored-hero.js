// Shared battle presentation for every hero described by assets/characters/<slug>/hero.json.
// Injected once into the battle closure by scripts/authored-hero-install.mjs together with
// AUTHORED_HEROES (sourceId -> descriptor). The combat domain alone decides damage/statuses;
// this file only schedules animation, VFX and SFX on the engine's markers.
//
// Lessons baked in (do not regress):
//  * Atlases go through the battle-wide cache (window.__HV_NATIVE_ATLAS_CACHE) with its decoded
//    byte budget. A private 3-page LRU re-created Image objects every frame and made heroes vanish.
//  * Every SFX cue of every authored hero on the field is decoded once per battle before it can
//    be needed; play() then never waits on the network, so maxDelayMs cannot expire the cue.
//  * Clip pages needed by an action are decoded before the engine resolves the action.
// var + function declarations only: earlier battle code may call these hooks (reset, config,
// draw) before this block runs, and a const would throw from its temporal dead zone.
var authoredMotions=new Map(),authoredActions=new Set(),authoredBursts=[],authoredWarmBattles=new Set();
function isAuthoredHero(u){return !!(u&&AUTHORED_HEROES&&AUTHORED_HEROES[u.sourceId]);}
function authoredDef(u){return u&&AUTHORED_HEROES&&AUTHORED_HEROES[u.sourceId]||null;}
function authoredSpeed(){return Math.max(1,Math.min(3,Number(state.speed)||1));}
function authoredCache(){return window.__HV_NATIVE_ATLAS_CACHE||null;}
function authoredPage(def,key,index){
 const c=def.clips[key],p=c&&c.pages[index];if(!p)return null;
 const cache=authoredCache();
 if(!cache){let im=authoredPage.fallback.get(p.src);if(!im){im=new Image();im.decoding='async';im.src=p.src;authoredPage.fallback.set(p.src,im);}return im;}
 return cache.ensure('authored:'+p.src,{src:p.src,cols:p.cols,rows:p.rows,cellW:c.cellW,cellH:c.cellH,atlasWidth:p.atlasWidth,atlasHeight:p.atlasHeight});
}
authoredPage.fallback=new Map();
function authoredReady(im){return !!(im&&im.complete&&im.naturalWidth);}
function authoredSprite(ctx,def,key,frame,x,y,scale,mirror,opts={}){
 const c=def.clips[key];if(!c)return false;
 frame=Math.max(0,Math.min(c.frames-1,Math.floor(frame)));
 const pageIndex=Math.floor(frame/c.pageFrames),page=c.pages[pageIndex],local=frame-pageIndex*c.pageFrames;
 if(c.pages.length>1)authoredPage(def,key,(pageIndex+1)%c.pages.length);
 const image=authoredPage(def,key,pageIndex);if(!authoredReady(image))return false;
 ctx.save();ctx.translate(x,y);if(opts.rotate)ctx.rotate(opts.rotate);ctx.scale(mirror?-scale:scale,scale);
 if(c.blend)ctx.globalCompositeOperation=c.blend;if(opts.alpha!=null)ctx.globalAlpha*=opts.alpha;
 ctx.drawImage(image,local%page.cols*c.cellW,Math.floor(local/page.cols)*c.cellH,c.cellW,c.cellH,-c.pivot,-c.foot,c.cellW,c.cellH);
 ctx.restore();return true;
}
function authoredScale(u){return typeof battleCharacterScale==='function'&&typeof battleCharacterDepthScale==='function'?battleCharacterScale(u)*battleCharacterDepthScale(u):(innerWidth<600?.34:.74)*(.83+((u.baseY??u.homeAnchor?.y??u.y)-290)/1500);}
function authoredBodyHeight(u){
 try{if(typeof battleCharacterBody==='function'){const b=battleCharacterBody(u);if(b&&b.height>0)return b.height;}}catch(_){}
 const d=authoredDef(u);return d?d.clips.idle.body*authoredScale(u):120*authoredScale(u);
}
function authoredFacing(u){return u.team===TEAM_ENEMY?-1:1;}
// Decode everything the side can need before it is needed: idle/hit/fall pages and all SFX cues.
function warmAuthoredBattle(){
 const battleId=state.battleId;if(authoredWarmBattles.has(battleId))return;authoredWarmBattles.add(battleId);
 const defs=[...new Set(units.filter(isAuthoredHero).map(u=>u.sourceId))].map(id=>AUTHORED_HEROES[id]);
 for(const d of defs)authoredPage(d,'idle',0);
 const cues=[...new Set(defs.flatMap(d=>d.sfxCues))];
 for(const cue of cues)void window.HonVietSfx?.prepare?.(cue,{timeoutMs:8000});
 window.__HV_AUTHORED_WARM={battleId,heroes:defs.map(d=>d.id),cues};
}
async function awaitAuthoredClips(def,keys,battleId,timeoutMs=4000){
 const started=performance.now();
 while(state.battleId===battleId){
  let ready=true;
  for(const key of keys){const c=def.clips[key];if(!c)continue;for(let i=0;i<Math.min(2,c.pages.length);i++)if(!authoredReady(authoredPage(def,key,i)))ready=false;}
  if(ready)return true;
  if(performance.now()-started>timeoutMs){window.__HV_AUTHORED_LAST_TIMEOUT={hero:def.id,keys,at:Date.now()};return true;}
  await new Promise(r=>setTimeout(r,40));
 }
 return false;
}
function authoredPlay(cue,signal,speed){
 if(!cue||!state.sound||__hvIsSkipping())return;
 void window.HonVietSfx?.play(cue,{group:'combat',signal,playbackRate:speed,maxDelayMs:600});
}
function authoredHeroFallMs(u){const d=authoredDef(u),c=d?.clips['fall-die'];return c?c.durationMs/Math.max(1,Number(d.battle.reactions?.tempo)||2):1600;}
function authoredBodyFrame(def,m,elapsed){
 const c=def.clips[m.kind]||def.clips.idle;
 const progress=elapsed/(c.durationMs||1);
 return Math.min(c.frames-1,Math.floor(progress*c.frames));
}
function drawAuthoredHero(ctx,u,time){
 warmAuthoredBattle();
 const def=authoredDef(u);
 let m=authoredMotions.get(u.id),elapsed=m?(time-m.start)*m.speed:0;
 if(m&&elapsed>=m.duration&&m.kind!=='fall-die'){authoredMotions.delete(u.id);m=null;}
 if(u.hp<=0&&m?.kind!=='fall-die')return;
 const idle=def.clips.idle,scale=authoredScale(u),mirror=u.team===TEAM_ENEMY;
 const kind=m?m.kind:'idle';
 const frame=m?authoredBodyFrame(def,m,elapsed):Math.floor(time*idle.frames/idle.durationMs)%idle.frames;
 let painted=authoredSprite(ctx,def,def.clips[kind]?kind:'idle',frame,u.x,u.y,scale,mirror);
 // While an action page is still decoding keep the idle pose instead of an empty slot.
 if(!painted&&kind!=='idle')painted=authoredSprite(ctx,def,'idle',Math.floor(time*idle.frames/idle.durationMs)%idle.frames,u.x,u.y,scale,mirror);
 // No opaque portrait fallback (it rendered as a white card on iPhone). While the idle page
 // is still decoding the slot shows only its HUD; pages are small enough to arrive in <1 s.
 if(!painted)window.__HV_AUTHORED_UNPAINTED=(window.__HV_AUTHORED_UNPAINTED||0)+1;
 if(u.hp>0)drawUnitHud(ctx,u,time,1);
}
function authoredHeroEvent(event){
 if(!authoredBursts)return;
 const target=getUnit(event.targetId),source=getUnit(event.sourceId);
 for(const def of new Set([authoredDef(source),authoredDef(target)].filter(Boolean))){
  const spec=def.battle.events?.[event.type];
  if(spec&&target){authoredBursts.push({def,spec,target,start:performance.now(),speed:authoredSpeed(),battleId:state.battleId});authoredPlay(spec.sfx,null,authoredSpeed());}
 }
 if(!isAuthoredHero(target))return;
 const def=authoredDef(target),tempo=Math.max(1,Number(def.battle.reactions?.tempo)||2),speed=authoredSpeed()*tempo;
 if(event.type==='death')authoredMotions.set(target.id,{kind:'fall-die',start:performance.now(),speed,duration:def.clips['fall-die']?.durationMs||1});
 else if(event.type==='damage'&&target.hp>0&&!authoredMotions.has(target.id)){
  authoredMotions.set(target.id,{kind:'hit',start:performance.now(),speed,duration:def.clips.hit?.durationMs||1});
  // The reaction clip is a motion, not a cue: play the hero's own hit sound once per reaction.
  if(def.battle.reactions?.hitCue)authoredPlay(def.battle.reactions.hitCue,null,speed);
 }
}
// hero.json hitTargets: 'sequential' = hit i lands on target i only (chained projectiles);
// 'rows' = targets split front row then back row, spec.waves hits per row; default = every target every hit.
function authoredHitPlan(spec,targetIds){
 const n=spec.hits.length,mode=spec.hitTargets;
 if(mode==='sequential')return spec.hits.map((_,i)=>({targets:targetIds[i]?[targetIds[i]]:[],index:0}));
 // 'slotOrder': swords fall one by one in spec.order (formation slots), repeated spec.waves times;
 // occupied slots are packed first so no beat is spent on an empty slot.
 if(mode==='slotOrder'){
  const waves=Math.max(1,Number(spec.waves)||1),order=spec.order||[0,1,2,5,4,3],units=targetIds.map(getUnit).filter(Boolean),steps=[];
  for(let w=0;w<waves;w++)for(const slot of order){const u=units.find(x=>x.slot===slot);if(u)steps.push({targets:[u.id],index:w});}
  return spec.hits.map((_,i)=>steps[i]||{targets:[],index:0});
 }
 if(mode==='rows'){
  const waves=Math.max(1,Number(spec.waves)||1),units=targetIds.map(getUnit).filter(Boolean);
  const groups=[units.filter(u=>u.slot<3),units.filter(u=>u.slot>=3)].filter(g=>g.length).map(g=>g.map(u=>u.id));
  return spec.hits.map((_,i)=>({targets:groups[Math.floor(i/waves)]||[],index:i%waves}));
 }
 return spec.hits.map((_,i)=>({targets:targetIds.slice(),index:i}));
}
function drawAuthoredVfxClip(ctx,def,key,age,x,y,heightPx,opts={}){
 const c=def.clips[key];if(!c)return;
 const frame=c.frames<=1?0:Math.min(c.frames-1,Math.floor(age/(c.frameMs||60)));
 authoredSprite(ctx,def,key,frame,x,y,heightPx/c.cellH,!!opts.mirror,opts);
}
function drawAuthoredHeroVfx(ctx,time){
 for(let i=authoredBursts.length-1;i>=0;i--){
  const b=authoredBursts[i],c=b.def.clips[b.spec.vfx],age=(time-b.start)*b.speed;
  if(b.battleId!==state.battleId||!c||age>c.frames*(c.frameMs||60)){authoredBursts.splice(i,1);continue;}
  const h=authoredBodyHeight(b.target);drawAuthoredVfxClip(ctx,b.def,b.spec.vfx,age,b.target.x,b.target.y-h*.5,h*(b.spec.scale||1));
 }
 for(const info of authoredActions){
  const age=(time-info.start)*info.speed;if(info.battleId!==state.battleId)continue;
  const def=info.def,spec=info.spec,u=info.actor,victims=info.targets.map(getUnit).filter(Boolean);
  if(spec.projectile?.passes&&victims[0]){const pr=spec.projectile,t=victims[0],bh=authoredBodyHeight(u),th=authoredBodyHeight(t),f=authoredFacing(u);
   const D=Math.max(bh,Math.hypot(t.x-u.x,t.y-u.y))*(Number(pr.reach)||1),O=D*(Number(pr.overshoot)||.45),ang=(Number(pr.angle)||45)*Math.PI/180;
   const cx=t.x,cy=t.y-th*.5,ux=-f*Math.cos(ang),uy=-Math.sin(ang),P=[cx+ux*D,cy+uy*D],Q=[cx-ux*O,cy-uy*O],F=Number(pr.flight)||300;
   for(let i=0;i<Math.min(Number(pr.passes),spec.hits.length);i++){const down=i%2===0,A=down?P:Q,B=down?Q:P,cross=(down?D:O)/(D+O),from=spec.hits[i]-F*cross,p=(age-from)/F;if(p<0||p>1)continue;
    const x=A[0]+(B[0]-A[0])*p,y=A[1]+(B[1]-A[1])*p,dx=B[0]-A[0],dy=B[1]-A[1],mirror=dx<0,angle=Math.atan2(dy,Math.abs(dx))*(mirror?-1:1);
    const c=def.clips[pr.vfx],frames=pr.frames||[0,(c?.frames||1)-1],fr=Math.round(frames[0]+(frames[1]-frames[0])*p);
    drawAuthoredVfxClip(ctx,def,pr.vfx,fr*(c?.frameMs||60),x,y,bh*(pr.scale||1),{mirror,rotate:angle});}
 }
 const flights=spec.projectile&&!spec.projectile.passes?(spec.projectile.perTarget&&info.plan?spec.hits.map((h,i)=>({t:getUnit(info.plan[i].targets[0]),from:h-(Number(spec.projectile.flight)||400),to:h})):[{t:victims[0],from:spec.release,to:spec.hits[0]}]):[];
  for(const fl of flights)if(fl.t&&age>=fl.from&&age<=fl.to){
   const t=fl.t,p=Math.max(0,Math.min(1,(age-fl.from)/Math.max(1,fl.to-fl.from)));
   const bh=authoredBodyHeight(u),th=authoredBodyHeight(t),f=authoredFacing(u);
   const sx=u.x+f*bh*spec.projectile.from[0],sy=u.y-bh*spec.projectile.from[1],ex=t.x,ey=t.y-th*.5;
   const x=sx+(ex-sx)*p,y=sy+(ey-sy)*p-bh*.25*4*p*(1-p),dx=ex-sx,dy=ey-sy;
   const mirror=dx<0,angle=Math.atan2(dy,Math.abs(dx))*(mirror?-1:1);
   drawAuthoredVfxClip(ctx,def,spec.projectile.vfx,0,x,y,bh*(spec.projectile.scale||1),{mirror,rotate:angle});
  }
  if(spec.area?.drop?.center&&victims.length){const a=spec.area,c=def.clips[a.vfx],fm=c?.frameMs||60,dms=Number(a.drop.ms)||380,ff=a.drop.fallFrames||[0,0],land=Number(a.drop.landFrame)||0,local=age-spec.hits[0];
   if(c&&local>=-dms&&local<=(c.frames-land)*fm){const h=Math.max(...victims.map(authoredBodyHeight)),size=h*(a.scale||1),cx=victims.reduce((v,t)=>v+t.x,0)/victims.length,gy=victims.reduce((v,t)=>v+t.y,0)/victims.length-h*.5;
    if(local<0){const q=1+local/dms,fy=-size*.8+(gy+size*.8)*q*q;drawAuthoredVfxClip(ctx,def,a.vfx,(ff[0]+(ff[1]-ff[0])*q)*fm,cx,fy,size);}
    else drawAuthoredVfxClip(ctx,def,a.vfx,land*fm+local,cx,gy,size);}
  }
  else if(spec.area?.drop&&info.plan){const a=spec.area,c=def.clips[a.vfx],fm=c?.frameMs||60,dms=Number(a.drop.ms)||380,ff=a.drop.fallFrames||[0,0],land=Number(a.drop.landFrame)||0;
   for(let i=0;i<spec.hits.length;i++){const local=age-spec.hits[i];if(!c||local<-dms||local>(c.frames-land)*fm)continue;
    for(const id of info.plan[i].targets){const t=getUnit(id);if(!t)continue;const h=authoredBodyHeight(t),size=h*(a.scale||1),gy=t.y-h*.5;
     if(local<0){const q=1+local/dms,fy=-size*.6+(gy+size*.6)*q*q;drawAuthoredVfxClip(ctx,def,a.vfx,(ff[0]+(ff[1]-ff[0])*q)*fm,t.x,fy,size);}
     else drawAuthoredVfxClip(ctx,def,a.vfx,land*fm+local,t.x,gy,size);}}
  }
  else if(spec.area&&age>=spec.release&&age<=spec.vfxEnd)for(const t of victims){
   if(t.hp<=0)continue;const h=authoredBodyHeight(t);drawAuthoredVfxClip(ctx,def,spec.area.vfx,age-spec.release,t.x,t.y-h*.5,h*(spec.area.scale||1),{mirror:u.team===TEAM_ENEMY});
  }
  if(spec.impact)for(const hit of spec.hits){
   const local=age-hit,c=def.clips[spec.impact.vfx];if(!c||local<0||local>c.frames*(c.frameMs||60))continue;
   const hitIdx=spec.hits.indexOf(hit),onto=info.plan&&spec.hitTargets?info.plan[hitIdx].targets.map(getUnit).filter(Boolean):victims;
   for(const t of onto){const h=authoredBodyHeight(t);drawAuthoredVfxClip(ctx,def,spec.impact.vfx,local,t.x,t.y-h*.5,h*(spec.impact.scale||1));}
  }
 }
}
// QA probe (read-only): which authored action is in flight and at which step.
window.__HV_AUTHORED_QA=()=>({battleId:state.battleId,locked:state.locked,currentId:state.currentId,warm:window.__HV_AUTHORED_WARM||null,
 actions:[...authoredActions].map(i=>({actor:i.actor.id,kind:i.kind,stage:i.stage,age:i.start?Math.round((performance.now()-i.start)*i.speed):0,targets:i.targets})),
 pending:authoredPending.map(i=>({actor:i.actor.id,kind:i.kind,stage:i.stage})),log:authoredLog.slice(-12)});
var authoredPending=[],authoredLog=[];
function authoredTrace(info,stage){info.stage=stage;authoredLog.push(info.actor.id+':'+info.kind+':'+stage);if(authoredLog.length>60)authoredLog.splice(0,20);}
// Explicitly consume a turn the S+ engine says cannot act (hard control). Never leave the
// scheduler locked: that was the "battle freezes when a new hero joins" symptom.
async function authoredSkipTurn(actor){
 const battleId=state.battleId;actor._talentSkillActive=false;
 state.currentId=null;state.selectedAction=null;state.locked=true;updateTurnOrder();updateActorHud(null);
 addLog(actor.name+' bị khống chế, mất lượt.');if(typeof addFloater==='function')addFloater(actor,'MẤT LƯỢT','#ffd36e',true);
 if(checkBattleEnd())return;if(await sleep(TIMING.turnRest,battleId))void advanceTurn();
}
function cancelAuthoredHeroes(){if(!authoredActions)return;for(const i of authoredActions)i.abort.abort();authoredActions.clear();authoredMotions.clear();authoredBursts.length=0;}
async function performAuthoredAction(actor,action,target,e,battleId){
 const def=authoredDef(actor),kind=action==='ultimate'?'ultimate':'basic',spec=def.battle.actions[kind];
 const speed=authoredSpeed()*(Number(def.battle.tempo?.[kind])||1);
 const info={actor,def,spec,kind,battleId,speed,start:0,targets:[],abort:new AbortController()};
 const current=()=>state.battleId===battleId&&!info.abort.signal.aborted;
 const wait=async at=>{while(current()){if(__hvIsSkipping())return true;const left=at-(performance.now()-info.start)*speed;if(left<=0)return true;if(!await sleepVisualMilliseconds(Math.min(40,left/speed),battleId))return false;}return false;};
 const trace=window.__HV_BATTLE_PHASE1_TRACE,presentationId=battleId+':'+def.slug+':'+state.actionCount+':'+actor.id;
 state.locked=true;state.selectedAction=action;clearTargets();updateActorHud(actor);
 const before=Number(intelUnit(actor)?.damage)||0;let cast,completed=false;
 try{
  authoredPending.push(info);authoredTrace(info,'decode');
  const vfxKeys=[spec.projectile?.vfx,spec.impact?.vfx,spec.area?.vfx].filter(Boolean);
  if(!await awaitAuthoredClips(def,[spec.clip,...vfxKeys],battleId))return;
  authoredTrace(info,'sfx');
  if(state.sound)await Promise.all((spec.sfx||[]).map(s=>window.HonVietSfx?.prepare?.(s.cue,{signal:info.abort.signal,timeoutMs:3000})));
  if(!current())return;
  authoredTrace(info,'act');
  cast=e.act(actor.id,kind,target?.id,{deferAuthored:true});if(!cast.ok){authoredTrace(info,'act-failed:'+(cast.reason||''));return;}
  info.targets=cast.targetIds;info.plan=authoredHitPlan(spec,info.targets);trace?.begin({actionId:presentationId,roundId:state.round,actorId:actor.id,targetIds:info.targets,skillId:kind,position:{x:actor.x,y:actor.y}});
  info.start=performance.now();authoredActions.add(info);
  const duration=spec.recovery;authoredMotions.set(actor.id,{kind:spec.clip,start:info.start,speed,duration});
  setUnitState(actor,kind==='basic'?'attack':'ultimate',duration/speed);
  const title=(globalThis.SPLUS42?.catalog||[]).find(h=>h.id===actor.sourceId)?.actions?.[kind]?.name||kind;
  setStatus(actor.name+' · '+title);dom.phaseLabel.textContent=title;
  const releaseCues=(spec.sfx||[]).filter(s=>s.at==='release'),hitCues=(spec.sfx||[]).filter(s=>s.at==='hit');
  const lead=Math.max(0,...releaseCues.map(s=>Number(s.lead)||0));
  if(!await wait(Math.max(0,spec.release-lead)))return;
  for(const s of releaseCues)authoredPlay(s.cue,info.abort.signal,speed);
  if(!await wait(spec.release))return;
  trace?.marker('release',{actionId:presentationId});authoredTrace(info,'release');
  for(let hit=0;hit<spec.hits.length;hit++){
   const cuesHere=hitCues.filter(s=>s.hit==null||Number(s.hit)===hit),early=cuesHere.filter(s=>Number(s.lead)>0).sort((a,b)=>Number(b.lead)-Number(a.lead));
   for(const s of early){if(!await wait(Math.max(0,spec.hits[hit]-Number(s.lead))))return;authoredPlay(s.cue,info.abort.signal,speed);}
   if(!await wait(spec.hits[hit]))return;
   trace?.marker('impact',{actionId:presentationId,hit});
   if(info.plan&&spec.hitTargets&&!info.plan[hit].targets.length)continue;
   for(const s of cuesHere)if(!(Number(s.lead)>0))authoredPlay(s.cue,info.abort.signal,speed);
   // hero.json impact.shake (px): short canvas jolt so a heavy hit lands with weight.
   const jolt=Number(spec.impact?.shake||spec.area?.shake)||0,cv=jolt&&!(typeof REDUCED_MOTION!=='undefined'&&REDUCED_MOTION)?document.querySelector('canvas'):null;
   if(cv?.animate)cv.animate([{transform:'translate(0,0)'},{transform:`translate(${jolt}px,${-jolt*.6}px)`},{transform:`translate(${-jolt*.8}px,${jolt*.5}px)`},{transform:`translate(${jolt*.4}px,0)`},{transform:'translate(0,0)'}],{duration:190,easing:'ease-out'});
   const step=info.plan[hit];for(const id of step.targets)e.resolveAuthoredImpact(actor.id,cast.castId,id,step.index);
   updateTeamCounters();splusStateView();
  }
  e.finishAuthoredCast(actor.id,cast.castId);state.actionCount++;state.actionBreakdown[kind]=(state.actionBreakdown[kind]||0)+1;
  const record=intelUnit(actor);if(record){record.actions++;if(kind==='ultimate')record.ultimates++;}
  addLog(actor.name+' · '+title);
  authoredTrace(info,'recovery');
  if(!await wait(duration))return;
  if(typeof showActionTotal==='function')showActionTotal(Math.max(0,(Number(intelUnit(actor)?.damage)||0)-before));
  // Own action total above; keep the spaced form so action-damage-total-v1 only owns legacy/Co Nuong.
  setUnitState(actor, 'idle', 800);state.currentId=null;state.locked=false;
  if(battleHasWinner()){if(!await waitForDefeatExit(battleId))return;if(checkBattleEnd()){splusStateView();return;}}
  trace?.marker('recovery',{actionId:presentationId,position:{x:actor.x,y:actor.y}});trace?.complete({actionId:presentationId,position:{x:actor.x,y:actor.y}});
  completed=true;authoredTrace(info,'done');void advanceTurn();
 }finally{
  if(!completed)authoredTrace(info,'aborted');
  authoredPending.splice(authoredPending.indexOf(info)>>>0,1);
  info.abort.abort();authoredActions.delete(info);
  if(authoredMotions.get(actor.id)?.start===info.start)authoredMotions.delete(actor.id);
  if(cast?.ok&&!completed)e.finishAuthoredCast?.(actor.id,cast.castId);
  if(!completed&&state.battleId===battleId){state.currentId=null;state.locked=false;if(!battleHasWinner())void advanceTurn();}
 }
}
