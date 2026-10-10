// Injected in the production battle closure. Uses its scheduler, cache and SFX bus.
const KY_VAN_BASE='assets/characters/ky-van/';
const kyVanActive=new Set();
function isKyVan(u){return !!u&&[u.sourceId,u.sourceHeroId,u.id].some(x=>/^(?:hero_splus_)?ky[_-]van$/i.test(String(x)));}
function kyVanClip(key){const c=KY_VAN_META.clips[key];return {...c,src:KY_VAN_BASE+c.file,rows:Math.ceil(c.frames/c.cols),decodedBytes:c.cols*c.cellW*Math.ceil(c.frames/c.cols)*c.cellH*4};}
function kyVanImage(key){return BACH_DIEN_LOADER.ensure(kyVanClip(key),{scope:'battle',priority:'visible'}).image;}
function kyVanPaint(ctx,key,frame,x,y,w,h){const c=KY_VAN_META.clips[key],img=kyVanImage(key);if(!img||img.complete===false||img.naturalWidth===0)return false;ctx.save();ctx.globalCompositeOperation=c.blendMode;ctx.drawImage(img,(frame%c.cols)*c.cellW,Math.floor(frame/c.cols)*c.cellH,c.cellW,c.cellH,x,y,w,h);ctx.restore();return true;}
function kyVanElapsed(info){return Math.max(0,(performance.now()-info.startedAt)*info.speed);}
function kyVanFrame(durations,elapsed,loop){
 const total=durations.reduce((a,b)=>a+b,0);let t=loop?elapsed%total:Math.min(elapsed,total-.001);
 for(let i=0;i<durations.length;i++){t-=durations[i];if(t<0)return i;}return durations.length-1;
}
function kyVanFallDuration(){return 900/Math.max(1,Math.min(3,Number(state.speed)||1));}
function drawKyVanHero(ctx,u,time){
 if(!isKyVan(u))return false;
 const info=u._kyVanAction,active=info&&info.battleId===state.battleId;
 let key='idle',elapsed=time,loop=true,frame=0;
 if(u.hp<=0){key='fall-die';elapsed=Math.max(0,time-u.defeatedAt)*KY_VAN_META.clips['fall-die'].durationMs/(u.defeatFallDuration||kyVanFallDuration());loop=false;}
 else if((u.state==='hurt'||u.state==='hit')&&time-u.stateStarted<KY_VAN_META.clips.hit.durationMs){key='hit';elapsed=Math.max(0,time-u.stateStarted);loop=false;}
 else if(active){key=info.action;elapsed=kyVanElapsed(info);loop=false;}
 else if(u.state==='run'){key='run';elapsed=Math.max(0,time-u.stateStarted);}
 if(key==='idle'){
  frame=kyVanFrame(KY_VAN_META.idle.frameDurationsMs,elapsed,true);key='idle-'+Math.floor(frame/16);frame%=16;
  // Request the next page before the current page runs out. Cache remains LRU-owned.
  const next=(Number(key.slice(5))+1)%Math.ceil(KY_VAN_META.idle.frames/16);kyVanImage('idle-'+next);
 }else frame=kyVanFrame(KY_VAN_META.clips[key].frameDurationsMs,elapsed,loop);
 ctx.save();ctx.translate(u.x,u.y);const scale=battleCharacterDepthScale(u)*battleCharacterScale(u);ctx.scale(scale*(u.team===TEAM_ENEMY?-1:1),scale);
 kyVanPaint(ctx,key,frame,-240,-440,480,440)||kyVanPaint(ctx,'standing',0,-240,-440,480,440);ctx.restore();if(u.hp>0)drawUnitHud(ctx,u,time,1);return true;
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
  info.targets=units.filter(u=>u.team!==actor.team&&u.hp>0).map(u=>({id:u.id,x:u.x,y:u.y,slot:u.slot}));
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
  const age=kyVanElapsed(info),actor=info.actor;
  if(info.action==='basic'){
   const t=info.target;if(!t)continue;
   if(age>=650&&age<1050){const p=(age-650)/400;ctx.save();ctx.translate(actor.x+(t.x-actor.x)*p,actor.y-80+(t.y-actor.y)*p);ctx.rotate(actor.team===TEAM_ENEMY?Math.PI/2:-Math.PI/2);kyVanPaint(ctx,'bolt',Math.min(14,Math.floor(p*15)),-34,-82,68,165);ctx.restore();}
   if(age>=1050&&age<1650)kyVanPaint(ctx,'impact',Math.floor((age-1050)/60),t.x-67,t.y-110,135,140);
  }else{
   // Same three waves as the approved clip, with three bolts per position.
   const spots=info.targets,first=new Set([0,3,4]),last=new Set([1,2,5]);
   const clusters=[...spots.filter(t=>first.has(t.slot)).map(t=>({t,at:1730})),...spots.map((t,i)=>({t,at:2180+i*55})),...spots.filter(t=>last.has(t.slot)).map((t,i)=>({t,at:2860+i*75}))];
   for(const {t,at} of clusters){for(const [j,dx,dy] of [[0,-20,0],[1,0,6],[2,20,-3]]){const dt=age-at-j*45;if(dt>=0&&dt<900)kyVanPaint(ctx,'bolt',Math.floor(dt/60),t.x+dx-50,t.y+dy-245,101,245);}
    const dt=age-at-60;if(dt>=0&&dt<600)kyVanPaint(ctx,'impact',Math.floor(dt/60),t.x-67,t.y-110,135,140);
   }
  }
 }
}
