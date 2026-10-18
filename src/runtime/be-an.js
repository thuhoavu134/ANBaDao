// Injected in the existing battle closure. Domain alone owns damage and statuses.
const beAnImages=new Map(),beAnMotions=new Map(),beAnActions=new Set(),beAnBursts=[];
const beAnAtlasRatio=key=>{const c=BE_AN_META.clips[key];return c&&c.body?160/c.body:1;};
const isBeAn=u=>u?.sourceId==='hero_splus_be_an';
function beAnImage(src){
 let im=beAnImages.get(src);if(!im){im=new Image();im.decoding='async';im.src=src;beAnImages.set(src,im);}
 // High-resolution atlases: keep at most three live pages to bound decoded texture residency.
 beAnImages.delete(src);beAnImages.set(src,im);
 while(beAnImages.size>3){const first=beAnImages.keys().next().value;beAnImages.delete(first);}
 return im;
}
function beAnSprite(ctx,key,frame,x,y,scale=1,mirror=false){
 const c=BE_AN_META.clips[key];if(!c)return false;
 frame=Math.max(0,Math.min(c.frames-1,Math.floor(frame)));
 const page=c.pages[Math.floor(frame/c.pageFrames)],local=frame%c.pageFrames;
 const next=c.pages[(Math.floor(frame/c.pageFrames)+1)%c.pages.length];beAnImage('assets/characters/be-an/'+next.file);
 const image=beAnImage('assets/characters/be-an/'+page.file);
 if(!image.complete||!image.naturalWidth)return false;
 ctx.save();ctx.translate(x,y);const drawScale=scale*beAnAtlasRatio(key);ctx.scale(mirror?-drawScale:drawScale,drawScale);
 if(c.blend)ctx.globalCompositeOperation=c.blend;
 ctx.drawImage(image,local%page.cols*c.cellW,Math.floor(local/page.cols)*c.cellH,c.cellW,c.cellH,-c.pivot,-c.foot,c.cellW,c.cellH);ctx.restore();return true;
}
function beAnScale(u){return typeof battleCharacterScale==='function'&&typeof battleCharacterDepthScale==='function'?battleCharacterScale(u)*battleCharacterDepthScale(u):(310/160)*(innerWidth<600?.34:.74)*(.83+(u.y-290)/1500);}
function beAnBodyFrame(m,elapsed){
 if(m.kind==='ultimate'){
  if(elapsed<3200)return elapsed*.024;
  if(elapsed<5700)return 84; // empty throwing hand while the separate seal acts
  return Math.max(0,76-(elapsed-5700)*.08); // authored return arc, then idle
 }
 return Math.min(95,elapsed*.024);
}
function drawBeAnHero(ctx,u,time){
 let m=beAnMotions.get(u.id),elapsed=m?(time-m.start)*m.speed:time;
 if(m&&elapsed>=m.duration&&m.kind!=='fall-die'){m.abort?.abort();beAnMotions.delete(u.id);m=null;elapsed=time;}
 const kind=m?.kind||'idle',frame=m?beAnBodyFrame(m,elapsed):Math.floor(time*.024)%96,scale=beAnScale(u);
 if(u.hp<=0&&kind!=='fall-die')return;
 const painted=beAnSprite(ctx,kind,frame,u.x,u.y,scale,u.team===TEAM_ENEMY);
 if(!painted&&u.hp>0){const backup=beAnImage('assets/characters/be-an/avatar.webp');if(backup.complete&&backup.naturalWidth){ctx.save();ctx.translate(u.x,u.y);const idle=BE_AN_META.clips.idle,r=beAnAtlasRatio('idle');ctx.scale(u.team===TEAM_ENEMY?-scale*r:scale*r,scale*r);ctx.drawImage(backup,-idle.pivot,-idle.foot,idle.cellW,idle.cellH);ctx.restore();}}
 if(u.hp>0){
  if(u.shield>0)beAnSprite(ctx,'shield',Math.floor(time/60)%25,u.x,u.y+5,scale*.9,false);
  drawUnitHud(ctx,u,time,1);
 }
}
function beAnEvent(event){
 if(event.type==='sealCounter'){
  const actor=getUnit(event.sourceId),target=getUnit(event.targetId);
  if(actor&&target)beAnBursts.push({target,actor,start:performance.now(),speed:Math.max(1,Number(state.speed)||1),battleId:state.battleId});
 }
 const u=getUnit(event.targetId);if(!isBeAn(u))return;
 const speed=Math.max(1,Math.min(3,Number(state.speed)||1)),start=performance.now();
 if(event.type==='sealRescue'){
  const abort=new AbortController();beAnMotions.set(u.id,{kind:'special',start,speed,duration:4000,abort});
  if(state.sound&&!__hvIsSkipping())void window.HonVietSfx?.play('be-an-special',{group:'combat',signal:abort.signal,playbackRate:speed,maxDelayMs:150});
 }else if(event.type==='death')beAnMotions.set(u.id,{kind:'fall-die',start,speed,duration:4000});
 else if(event.type==='damage'&&u.hp>0&&!beAnMotions.has(u.id))beAnMotions.set(u.id,{kind:'hit',start,speed,duration:4000});
}
function drawBeAnVfx(ctx,time){
 for(let i=beAnBursts.length-1;i>=0;i--){const b=beAnBursts[i],age=(time-b.start)*b.speed;if(age>450||b.battleId!==state.battleId){beAnBursts.splice(i,1);continue;}beAnSprite(ctx,'vfx-basic',30+age*.06,b.target.x,b.target.y,beAnScale(b.actor),b.actor.team===TEAM_ENEMY);}

 for(const info of beAnActions){
  const age=(time-info.start)*info.speed;if(info.battleId!==state.battleId||age<info.release||age>info.vfxEnd)continue;
  const victims=info.targets.map(getUnit).filter(Boolean);if(!victims.length)continue;
  const u=info.actor,mirror=u.team===TEAM_ENEMY,scale=beAnScale(u);
  if(info.kind==='basic'){
   const target=victims[0],p=Math.max(0,Math.min(1,(age-info.release)/310));
   // World-space throw anchor: begins by the casting hand and finishes on target.
   // Do not add a second static offset at impact (the old +100*scale missed).
   const handX=u.x+(mirror?-1:1)*36*scale,handY=u.y-75*scale;
   const x=handX+(target.x-handX)*p;
   const y=handY+(target.y-handY)*p-32*scale*4*p*(1-p);
   beAnSprite(ctx,'vfx-basic',(age-info.release)/1500*144,x,y,scale*1.25,mirror);
  }else{
   const t=age-info.release,wave=Math.min(2,Math.floor(t/800)),local=t-wave*800;
   // Each living target gets an independent seal anchored to its formation slot.
   // Reuse the authored rise/contact/rebound source section for all three hits.
   const frame=wave===0?local/800*112:60+local/800*52;
   for(const target of victims){
    if(target.hp<=0)continue;
    const targetScale=beAnScale(target),giantScale=Math.min(scale*1.45,targetScale*1.12);
    const x=target.x-(mirror?-1:1)*55*giantScale;
    beAnSprite(ctx,'vfx-ultimate',frame,x,target.y,giantScale,mirror);
   }
  }
 }
}
function cancelBeAn(){for(const i of beAnActions)i.abort.abort();beAnActions.clear();for(const m of beAnMotions.values())m.abort?.abort();beAnMotions.clear();beAnBursts.length=0;beAnImages.clear();}
async function performBeAnAction(actor,action,target,e,battleId){
 const kind=action==='ultimate'?'ultimate':'basic',speed=Math.max(1,Math.min(3,Number(state.speed)||1));
 const info={actor,kind,battleId,speed,start:0,release:BE_AN_META.timeline[kind].release,vfxEnd:BE_AN_META.timeline[kind].vfxEnd,targets:[],abort:new AbortController()};
 const current=()=>state.battleId===battleId&&!info.abort.signal.aborted;
 const wait=async at=>{while(current()){if(__hvIsSkipping())return true;const left=at-(performance.now()-info.start)*speed;if(left<=0)return true;if(!await sleepVisualMilliseconds(Math.min(40,left/speed),battleId))return false;}return false;};
 const cue='be-an-'+kind,trace=window.__HV_BATTLE_PHASE1_TRACE,presentationId=battleId+':be-an:'+state.actionCount+':'+actor.id;

 state.locked=true;state.selectedAction=action;clearTargets();updateActorHud(actor);
 const before=Number(intelUnit(actor)?.damage)||0;let cast,completed=false;
 try{
  const clips=[BE_AN_META.clips[kind],BE_AN_META.clips['vfx-'+kind]];
  await Promise.all(clips.flatMap(c=>c.pages.slice(0,2).map(p=>beAnImage('assets/characters/be-an/'+p.file).decode().catch(()=>{}))));
  if(state.sound)await window.HonVietSfx?.prepare(cue,{signal:info.abort.signal});
  if(!current())return;
  cast=e.act(actor.id,kind,target?.id,{deferBeAn:true});if(!cast.ok)return;
  info.targets=cast.targetIds;trace?.begin({actionId:presentationId,roundId:state.round,actorId:actor.id,targetIds:info.targets,skillId:kind,position:{x:actor.x,y:actor.y}});info.start=performance.now();beAnActions.add(info);
  const duration=BE_AN_META.timeline[kind].recovery;beAnMotions.set(actor.id,{kind,start:info.start,speed,duration});
  setUnitState(actor,kind==='basic'?'attack':'ultimate',duration/speed);
  const title=globalThis.SPLUS42.catalog.find(h=>h.id===actor.sourceId)?.actions[kind]?.name;
  setStatus(actor.name+' · '+title);dom.phaseLabel.textContent=title;
  if(!await wait(info.release))return;
  trace?.marker('release',{actionId:presentationId});
  // Basic audio follows the same compression as the supplied two-contact movie.
  if(state.sound&&!__hvIsSkipping())void window.HonVietSfx?.play(cue,{group:'combat',signal:info.abort.signal,playbackRate:speed,maxDelayMs:120});
  const hits=BE_AN_META.timeline[kind].hits;
  for(let hit=0;hit<hits.length;hit++){
   if(!await wait(hits[hit]))return;
   trace?.marker('impact',{actionId:presentationId,hit});
   for(const id of info.targets)e.resolveBeAnImpact(actor.id,cast.castId,id,hit);
   updateTeamCounters();splusStateView();
  }
  e.finishBeAnCast(actor.id,cast.castId);state.actionCount++;state.actionBreakdown[kind]=(state.actionBreakdown[kind]||0)+1;
  const record=intelUnit(actor);if(record){record.actions++;if(kind==='ultimate')record.ultimates++;}
  addLog(actor.name+' · '+title);
  if(!await wait(duration))return;
  if(typeof showActionTotal==='function')showActionTotal(Math.max(0,(Number(intelUnit(actor)?.damage)||0)-before));
  setUnitState(actor, 'idle', 800);state.currentId=null;state.locked=false;
  if(battleHasWinner()){if(!await waitForDefeatExit(battleId))return;if(checkBattleEnd()){splusStateView();return;}}
  trace?.marker('recovery',{actionId:presentationId,position:{x:actor.x,y:actor.y}});trace?.complete({actionId:presentationId,position:{x:actor.x,y:actor.y}});
  completed=true;void advanceTurn();
 }finally{info.abort.abort();beAnActions.delete(info);if(beAnMotions.get(actor.id)?.start===info.start)beAnMotions.delete(actor.id);if(!completed&&state.battleId===battleId){state.currentId=null;state.locked=false;if(!battleHasWinner())void advanceTurn();}}
}

async function waitBeAnReactions(battleId){
 while(state.battleId===battleId&&!__hvIsSkipping()){
  const pending=[...beAnMotions.values()].filter(m=>m.kind==='special'&&(performance.now()-m.start)*m.speed<m.duration);
  if(!pending.length)return true;if(!await sleepVisualMilliseconds(40,battleId))return false;
 }return state.battleId===battleId;
}
