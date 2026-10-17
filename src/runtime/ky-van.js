// Injected in the production battle closure. Uses its scheduler, cache and SFX bus.
const KY_VAN_BASE='assets/characters/ky-van/';
const kyVanActive=new Set();
function isKyVan(u){return !!u&&[u.sourceId,u.sourceHeroId,u.id].some(x=>/^(?:hero_splus_)?ky[_-]van$/i.test(String(x)));}
function kyVanClip(key){const c=KY_VAN_META.clips[key],rows=c.rows??Math.ceil(c.frames/c.cols);return {...c,src:KY_VAN_BASE+c.file,rows,decodedBytes:c.cols*c.cellW*rows*c.cellH*4};}
function kyVanImage(key,priority='visible'){return BACH_DIEN_LOADER.ensure(kyVanClip(key),{scope:'battle',priority}).image;}
function kyVanPaint(ctx,key,frame,x,y,w,h,cropHeight){const c=KY_VAN_META.clips[key],sourceHeight=cropHeight??c.cellH;if(sourceHeight<=0)return false;const img=kyVanImage(key);if(!img||img.complete===false||img.naturalWidth===0)return false;ctx.save();ctx.globalCompositeOperation=c.blendMode;ctx.drawImage(img,(frame%c.cols)*c.cellW,Math.floor(frame/c.cols)*c.cellH,c.cellW,sourceHeight,x,y,w,h*sourceHeight/c.cellH);ctx.restore();return true;}
function kyVanLightningPlan(targets){
 // Front column, then paired rows from top to bottom, then back column.
 // Slot order is identical for both teams and independent of the units array.
 const order=[0,3,1,4,2,5],rank=t=>{const i=order.indexOf(t.slot);return i<0?order.length:i;};
 const sorted=[...new Map(targets.map(t=>[t.id,t])).values()].sort((a,b)=>rank(a)-rank(b)||String(a.id).localeCompare(String(b.id)));
 const front=sorted.filter(t=>t.slot>=0&&t.slot<3).sort((a,b)=>a.slot-b.slot);
 const back=sorted.filter(t=>t.slot>=3&&t.slot<6).sort((a,b)=>a.slot-b.slot);
 return [...front.map((target,i)=>({target,at:1730+i*75})),...sorted.map((target,i)=>({target,at:2180+i*55})),...back.map((target,i)=>({target,at:2860+i*75}))];
}
function kyVanLightningFrame(elapsed,contactDelay){
 const clip=KY_VAN_META.clips.bolt,contact=clip.strike.contactFrame;
 const end=contactDelay+(clip.frames-contact)*clip.ms;
 if(elapsed<0||elapsed>=end)return null;
 // Reveal one contact pose before impact: the source's earlier frames flicker
 // in length, so playing them in order would touch the ground prematurely.
 // After contact, retain the source's 60ms tail without wrapping its frames.
 return Math.min(clip.frames-1,contact+Math.floor(Math.max(0,elapsed-contactDelay)/clip.ms));
}
function kyVanLightningColumn(ctx,frame,target,reveal=1,offsetX=0,heightFactor=1){
 const body=target.body||battleCharacterBody(target),clip=KY_VAN_META.clips.bolt;
 const height=Math.max(320,body.height*2.25)*heightFactor,scale=height/clip.cellH;
 // One existing gold/white branching sprite stands above each target. The
 // source is cropped downward at fixed pixel density until the hit marker;
 // ground sparks appear only at contact. No actor travel or rotated fan.
 const cropHeight=reveal<1?clip.strike.anchorY*Math.max(0,reveal):clip.cellH;
 return kyVanPaint(ctx,'bolt',frame,body.centerX+offsetX-clip.strike.anchorX*scale,body.footY-clip.strike.anchorY*scale,clip.cellW*scale,height,cropHeight);
}
function kyVanUltimateLightning(ctx,frame,target,reveal){
 const body=target.body||battleCharacterBody(target),spread=Math.max(18,Math.min(36,body.height*.14));
 // Uneven heads and gaps break up the repeated parallel silhouette. Scale
 // each whole sprite uniformly around its foot contact, not by stretching.
 // Rotate the height order by formation row; keep it stable across frames.
 const heights=[.78,1,.90],row=Number.isInteger(target.slot)&&target.slot>=0?target.slot%3:0;
 for(const [i,offsetX]of [-spread,0,spread*.75].entries())kyVanLightningColumn(ctx,frame,target,reveal,offsetX,heights[(i+row)%3]);
}
function kyVanLightningImpact(ctx,elapsed,target){
 const clip=KY_VAN_META.clips.impact;if(elapsed<0||elapsed>=clip.durationMs)return;
 const body=target.body||battleCharacterBody(target);
 kyVanPaint(ctx,'impact',Math.min(clip.frames-1,Math.floor(elapsed/clip.ms)),body.centerX-100,body.centerY-105,200,210);
}
function kyVanElapsed(info){return Math.max(0,(performance.now()-info.startedAt)*info.speed);}
function kyVanFrame(durations,elapsed,loop){
 const total=durations.reduce((a,b)=>a+b,0);let t=loop?elapsed%total:Math.min(elapsed,total-.001);
 for(let i=0;i<durations.length;i++){t-=durations[i];if(t<0)return i;}return durations.length-1;
}
function kyVanFallDuration(){return 900/Math.max(1,Math.min(3,Number(state.speed)||1));}
function drawKyVanHero(ctx,u,time){
 if(!isKyVan(u))return false;
 const info=u._kyVanAction,active=info&&info.battleId===state.battleId;
 let key='idle',elapsed=time,loop=true,frame=0,nextPage=null;
 if(u.hp<=0){key='fall-die';elapsed=Math.max(0,time-u.defeatedAt)*KY_VAN_META.clips['fall-die'].durationMs/(u.defeatFallDuration||kyVanFallDuration());loop=false;}
 else if((u.state==='hurt'||u.state==='hit')&&time-u.stateStarted<KY_VAN_META.clips.hit.durationMs){key='hit';elapsed=Math.max(0,time-u.stateStarted);loop=false;}
 else if(active){key=info.action;elapsed=kyVanElapsed(info);loop=false;}
 else if(u.state==='run'){key='run';elapsed=Math.max(0,time-u.stateStarted);}
 if(key==='idle'){
  frame=kyVanFrame(KY_VAN_META.idleVisual.frameDurationsMs,elapsed,true);key='idle-authored-'+Math.floor(frame/KY_VAN_META.idleVisual.pageFrames);frame%=KY_VAN_META.idleVisual.pageFrames;
  // Paint the visible page before admitting speculative work to the shared LRU.
  nextPage='idle-authored-'+((Number(key.slice(14))+1)%KY_VAN_META.idleVisual.pages);
 }else frame=kyVanFrame(KY_VAN_META.clips[key].frameDurationsMs,elapsed,loop);
 ctx.save();ctx.translate(u.x,u.y);const scale=battleCharacterDepthScale(u)*battleCharacterScale(u);ctx.scale(scale*(u.team===TEAM_ENEMY?-1:1),scale);
 // Keep a canonical, unscaled body frame in the shared visibility owner.
 // The outer transform owns position, depth and enemy mirroring exactly once.
 // Clip registration is data-driven and fixed for the whole animation.
 const paintBody=copy=>battlePaintCharacter(copy,u,key,KY_VAN_META.clips[key],kyVanImage(key),frame)||(u.hp>0&&battlePaintCharacter(copy,u,'standing',KY_VAN_META.clips.standing,kyVanImage('standing'),0));
 const drawn=__hvHeroVisibility.finish(ctx,'ky-van',u,time,paintBody(ctx),paintBody);
 ctx.restore();if(nextPage)kyVanImage(nextPage,'prefetch');if(u.hp>0)drawUnitHud(ctx,u,time,1);return drawn;
}
async function beginKyVanAction(actor,action,target,battleId){
 const normalized=action==='ultimate'?'ultimate':'basic';
 // Snapshot x1/x2/x3 for the whole cast so animation and the baked mix agree.
 const speed=[1,2,3].reduce((a,b)=>Math.abs(b-state.speed)<Math.abs(a-state.speed)?b:a,1);
 const info={actor,action:normalized,battleId,speed,target,startedAt:0,abort:new AbortController(),lease:null};kyVanActive.add(info);
 try{
  if(!__hvIsSkipping()){
   info.lease=await __hvSkipVisualAssets(()=>BACH_DIEN_LOADER.acquire([normalized,'standing','bolt','impact'].map(kyVanClip),{scope:'battle',owner:'ky-van:'+actor.id,signal:info.abort.signal}),battleId);
   if(__hvIsSkipping())info.abort.abort();
   await window.HonVietSfx?.prepare('ky-van-'+normalized+'-x'+speed,{signal:info.abort.signal});
  }
  if(battleId!==state.battleId){finishKyVanAction(info);return null;}
  info.startedAt=performance.now();actor._kyVanAction=info;
  actor.state=normalized==='ultimate'?'ultimate':'attack';actor.stateStarted=info.startedAt;
  actor.stateDuration=KY_VAN_META.clips[normalized].durationMs/speed;
  info.targets=units.filter(u=>u.team!==actor.team&&u.hp>0).map(u=>({id:u.id,x:u.x,y:u.y,slot:u.slot,body:battleCharacterBody(u)}));
  if(normalized==='ultimate')info.lightningStrikes=kyVanLightningPlan(info.targets);
  if(state.sound&&!__hvIsSkipping())void window.HonVietSfx?.play('ky-van-'+normalized+'-x'+speed,{group:'combat',signal:info.abort.signal});
  return info;
 }catch(error){finishKyVanAction(info);if(error.name!=='AbortError')console.error('Kỷ Vân asset readiness failed',error);return null;}
}
async function waitKyVanMarker(info,marker,battleId){
 const at=marker==='release'?(info.action==='ultimate'?1730:650):marker==='impact'?(info.action==='ultimate'?2240:1050):KY_VAN_META.clips[info.action].durationMs;
 while(state.battleId===battleId){if(__hvIsSkipping()||kyVanElapsed(info)>=at)return true;if(!await sleepVisualMilliseconds(Math.min(40,(at-kyVanElapsed(info))/info.speed),battleId))break;}
 finishKyVanAction(info);return false;
}
function finishKyVanAction(info){if(!info)return;info.abort.abort();info.lease?.release();kyVanActive.delete(info);if(info.actor._kyVanAction===info)delete info.actor._kyVanAction;}
function cancelKyVanActions(){for(const info of [...kyVanActive])finishKyVanAction(info);}
function drawKyVanFx(ctx){
 for(const info of kyVanActive){
  if(info.battleId!==state.battleId){finishKyVanAction(info);continue;}if(!info.startedAt||__hvIsSkipping())continue;
  const age=kyVanElapsed(info);
  if(age>=KY_VAN_META.clips[info.action].durationMs)continue;
  if(info.action==='basic'){
   const t=info.target;if(!t)continue;
   const frame=kyVanLightningFrame(age-650,400);
   if(frame!==null)kyVanLightningColumn(ctx,frame,t,(age-650)/400);
   kyVanLightningImpact(ctx,age-1050,t);
  }else{
   // A later wave replaces the earlier triple group at that position. These
   // visual columns share one impact and never resolve combat damage.
   const latest=new Map();
   for(const strike of info.lightningStrikes)if(age>=strike.at)latest.set(strike.target.id,strike);
   for(const {target,at} of latest.values()){
    const frame=kyVanLightningFrame(age-at,60);
    if(frame!==null)kyVanUltimateLightning(ctx,frame,target,(age-at)/60);
    kyVanLightningImpact(ctx,age-at-60,target);
   }
  }
 }
}

