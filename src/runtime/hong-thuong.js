// Injected in the production battle closure after the Tịch Dao owner. Uses the
// same scheduler, loader, audio bus, HUD lane and reset owners — no second clock.
// Ultimate plays as authored modules: prep → per-foe cluster (3 thrusts each)
// → Hồi Mã Thương finisher (reverse thrust: heroine parks on the side her
// spear points into the victim). Numbers come from HONG_THUONG_META, measured
// off the owner-supplied clips (docs/qa/hong-thuong-integration-20261016.md).
const HONG_THUONG_BASE='assets/characters/hong-thuong/';
const hongThuongActive=new Set();
if(globalThis.SPLUS42?.profiles){
 const hero=globalThis.SPLUS42.catalog.find(h=>h.id==='hero_splus_hong_thuong');
 if(hero&&!globalThis.SPLUS42.profiles.profiles.some(h=>h.id===hero.id))globalThis.SPLUS42.profiles.profiles.push({...hero,skills:Object.fromEntries(['passive','ultimate'].map(slot=>{const skill=slot==='passive'?hero.passive:hero.actions[slot];return [slot,{...skill,slot,shortName:skill.name,effects:skill.effects||[],target:skill.target||'Bản thân'}];}))});
}
function isHongThuong(u){return !!u&&[u.sourceId,u.sourceHeroId,u.id].some(x=>/^(?:hero_splus_)?hong[_-]thuong$/i.test(String(x)));}
// Idle pages live under idleVisual, not clips — resolve both shapes.
function hongThuongClipMeta(key){
 const iv=HONG_THUONG_META.idleVisual;
 // Standing is a frame of page zero, not a different one-row image. The
 // shared loader keys by URL, so all aliases must declare identical dimensions.
 if(key==='standing'||String(key).startsWith('idle-authored-')){
  const page=key==='standing'?0:Number(key.slice('idle-authored-'.length));
  if(!Number.isInteger(page)||page<0||page>=iv.pages)return null;
  const frames=Math.min(iv.pageFrames,iv.frames-page*iv.pageFrames);
  return {file:`idle-authored-${page}.webp`,cols:iv.cols,rows:Math.ceil(frames/iv.cols),frames,
   cellW:iv.cellW,cellH:iv.cellH,content:{...iv.content,scale:iv.contentScale||1}};
 }
 const c=HONG_THUONG_META.clips[key];
 if(c)return c;
 return null;
}
function hongThuongClip(key){const c=hongThuongClipMeta(key);if(!c)return null;const rows=c.rows??Math.ceil(c.frames/c.cols);return {...c,src:HONG_THUONG_BASE+c.file+'?v='+encodeURIComponent(HONG_THUONG_META.assetRevision||'rgba-v2-verified'),rows,decodedBytes:c.cols*c.cellW*rows*c.cellH*4};}
function hongThuongImage(key,priority='visible'){const clip=hongThuongClip(key);return clip?BACH_DIEN_LOADER.ensure(clip,{scope:'battle',priority}).image:null;}
function hongThuongPaint(ctx,u,clipKey,frame){
 const clip=hongThuongClipMeta(clipKey);
 return !!clip&&battlePaintCharacter(ctx,u,clipKey,clip,hongThuongImage(clipKey),frame);
}
function hongThuongElapsed(info){return Math.max(0,(performance.now()-info.startedAt)*info.speed);}
function hongThuongFrame(durations,elapsed,loop){
 const total=durations.reduce((a,b)=>a+b,0);let t=loop?elapsed%total:Math.min(elapsed,total-.001);
 for(let i=0;i<durations.length;i++){t-=durations[i];if(t<0)return i;}return durations.length-1;}
function hongThuongFallDuration(){return HONG_THUONG_META.clips['fall-die'].durationMs/Math.max(1,Math.min(3,Number(state.speed)||1));}
// Melee presenter: park in front of the victim, glide home at the tail. The
// finisher parks on the spear side so the reverse thrust points INTO the
// victim (never stabbing outward from the wrong side).
// ── Owner 2026-10-26: lớp hiệu ứng màn hình cho tuyệt kỹ toàn sân ───────────────────────────────
// Chỉ dùng DOM + CSS transform trên canvas nên KHÔNG đổi toạ độ vẽ bên trong, không phá hit point.
const HV_SCREEN_FX_TIERS = [
  { dim: 0.34, zoom: 1.05, shake: 6, flash: 0.10, ms: 520 },
  { dim: 0.46, zoom: 1.09, shake: 12, flash: 0.18, ms: 640 },
  { dim: 0.58, zoom: 1.14, shake: 22, flash: 0.34, ms: 900 }
];
const hvScreenFx = (() => {
  let wrap = null, dim = null, vignette = null, flash = null, canvas = null, raf = 0, state = null;
  function ensure() {
    if (wrap && wrap.isConnected) return true;
    canvas = document.querySelector('canvas');
    const host = canvas && canvas.parentElement;
    if (!canvas || !host) return false;
    if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
    wrap = document.createElement('div');
    wrap.id = 'hvScreenFx';
    wrap.setAttribute('aria-hidden', 'true');
    wrap.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:5;overflow:hidden;opacity:0;transition:opacity .25s ease';
    dim = document.createElement('div');
    dim.style.cssText = 'position:absolute;inset:0;background:rgba(6,3,8,.9);opacity:0;transition:opacity .3s ease';
    vignette = document.createElement('div');
    vignette.style.cssText = 'position:absolute;inset:0;opacity:0;transition:opacity .3s ease;background:radial-gradient(ellipse at 50% 52%, rgba(0,0,0,0) 38%, rgba(0,0,0,.55) 72%, rgba(0,0,0,.86) 100%)';
    flash = document.createElement('div');
    flash.style.cssText = 'position:absolute;inset:0;background:#fff6e8;opacity:0;mix-blend-mode:screen';
    wrap.append(dim, vignette, flash);
    host.append(wrap);
    return true;
  }
  function apply(zoom) {
    if (!canvas) return;
    canvas.style.transformOrigin = '50% 54%';
    canvas.style.transform = 'scale(' + zoom.toFixed(3) + ')';
    canvas.style.transition = 'transform .38s ease-out';
  }
  function reset() {
    if (canvas) { canvas.style.transform = ''; canvas.style.transition = ''; }
    if (wrap) wrap.style.opacity = '0';
    if (dim) dim.style.opacity = '0';
    if (vignette) vignette.style.opacity = '0';
    if (flash) flash.style.opacity = '0';
  }
  function punch(tier) {
    window.__fxPunches = (window.__fxPunches || 0) + 1;
    const cfg = HV_SCREEN_FX_TIERS[Math.max(0, Math.min(HV_SCREEN_FX_TIERS.length - 1, tier | 0))];
    if (!ensure()) return;
    wrap.style.opacity = '1';
    dim.style.opacity = String(cfg.dim);
    vignette.style.opacity = '1';
    apply(cfg.zoom);
    flash.style.transition = 'none';
    flash.style.opacity = String(cfg.flash);
    void flash.offsetWidth;
    flash.style.transition = 'opacity ' + Math.round(cfg.ms * 0.55) + 'ms ease-out';
    flash.style.opacity = '0';
    if (canvas.animate) {
      const s = cfg.shake;
      canvas.animate([
        { translate: '0 0' }, { translate: s + 'px ' + (-s * 0.6) + 'px' },
        { translate: (-s * 0.8) + 'px ' + (s * 0.5) + 'px' }, { translate: (s * 0.35) + 'px 0' },
        { translate: '0 0' }
      ], { duration: 260 + s * 6, easing: 'ease-out' });
    }
    state = { until: performance.now() + cfg.ms };
  }
  function start() {
    if (!ensure()) return;
    wrap.style.opacity = '1';
    dim.style.opacity = '0.3';
    vignette.style.opacity = '1';
    apply(1.03);
  }
  function stop() {
    cancelAnimationFrame(raf);
    state = null;
    reset();
  }
  return { start, punch, stop, get active() { return !!state; } };
})();
if (typeof window !== 'undefined') window.HvScreenFx = hvScreenFx;

function hongThuongSpotFor(actor,unitLike,side){
 if(!actor||!unitLike)return null;
 const dir=side==='spear'?(actor.team===TEAM_ENEMY?-1:1):(actor.x!==undefined&&actor.x!==unitLike.x?Math.sign(actor.x-unitLike.x):1);
 return {x:unitLike.x+dir*70,y:unitLike.y+8};
}
function hongThuongBodyPos(u,elapsed,key){
 const info=u._hongThuongAction;if(!info)return null;
 const lerp=(a,b,t)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
 if(key==='basic'){
  const dur=HONG_THUONG_META.clips.basic.durationMs;
  if(!info.spot)return null;
  if(elapsed<dur-220)return info.spot;
  return lerp(info.spot,info.home,Math.min(1,(elapsed-(dur-220))/220));
 }
 if(key==='ultimate'){
  // Modules: prep at home → glide to each cluster spot → finale spot → home.
  const seg=info.segments;
  if(!seg)return info.home;
  for(const s of seg){
   if(elapsed>=s.start&&elapsed<s.start+s.dur)return s.to===null?info.home:lerp(s.from,s.to,(elapsed-s.start)/s.dur);
  }
  const last=seg[seg.length-1];
  return last.to===null?info.home:last.to;
 }
 return null;
}
function drawHongThuongHero(ctx,u,time){
 if(!isHongThuong(u))return false;
 const info=u._hongThuongAction,active=info&&info.battleId===state.battleId;
 let key='idle',elapsed=time,loop=true,frame=0,nextPage=null;
 if(u.hp<=0){key='fall-die';elapsed=Math.max(0,time-u.defeatedAt)*HONG_THUONG_META.clips['fall-die'].durationMs/(u.defeatFallDuration||hongThuongFallDuration());loop=false;}
 else if((u.state==='hurt'||u.state==='hit')&&time-u.stateStarted<HONG_THUONG_META.clips.hit.durationMs){key='hit';elapsed=Math.max(0,time-u.stateStarted);loop=false;}
 else if(active){key=info.action;elapsed=hongThuongElapsed(info);loop=info.loop===true;}
 else if(u.state==='run'){key='run';elapsed=Math.max(0,time-u.stateStarted);}
 if(key==='idle'){
  frame=hongThuongFrame(HONG_THUONG_META.idleVisual.frameDurationsMs,elapsed,true);key='idle-authored-'+Math.floor(frame/HONG_THUONG_META.idleVisual.pageFrames);frame%=HONG_THUONG_META.idleVisual.pageFrames;
  nextPage='idle-authored-'+((Number(key.slice(14))+1)%HONG_THUONG_META.idleVisual.pages);
 }else if(key==='ultimate'&&active){
  // Module playback: each authored module plays its own local clock.
  const segs=info.segments||[];
  const seg=segs.find(x=>elapsed>=x.start&&elapsed<x.start+x.dur);
  const clipKey=seg?(seg.clip||'ult-prep'):'ult-prep';
  const local=seg?elapsed-seg.start:Math.max(0,Math.min(elapsed,HONG_THUONG_META.clips['ult-prep'].durationMs-1));
  frame=hongThuongFrame(HONG_THUONG_META.clips[clipKey].frameDurationsMs,local,clipKey==='run');
  key=clipKey;
 }else{
  const clipKey=key==='basic'?'basic':key;
  frame=hongThuongFrame(HONG_THUONG_META.clips[clipKey].frameDurationsMs,elapsed,loop&&clipKey!=='basic');
  key=clipKey;
 }
 const bodyPos=hongThuongBodyPos(u,elapsed,info&&info.action);
 ctx.save();ctx.translate(bodyPos?bodyPos.x:u.x,bodyPos?bodyPos.y:u.y);const scale=battleCharacterDepthScale(u)*battleCharacterScale(u);// Behind-target finisher faces back into the victim; other clips keep team facing.
 const facing=(u.team===TEAM_ENEMY?-1:1)*(key==='ult-finisher'?-1:1);ctx.scale(scale*facing,scale);
 const paintBody=copy=>{const c=hongThuongClipMeta(key);return c&&hongThuongPaint(copy,u,key,frame)||key!=='idle-authored-0'&&(u.hp>0&&hongThuongPaint(copy,u,'standing',0));};
 const drawn=__hvHeroVisibility.finish(ctx,'hong-thuong',u,time,paintBody(ctx),paintBody);
 ctx.restore();if(nextPage)hongThuongImage(nextPage,'prefetch');if(u.hp>0)drawUnitHud(ctx,u,time,1);return drawn;
}
async function beginHongThuongAction(actor,action,target,battleId,engine){
 const normalized=action==='ultimate'?'ultimate':'basic';
 const speed=[1,2,3].reduce((a,b)=>Math.abs(b-state.speed)<Math.abs(a-state.speed)?b:a,1);
 const info={actor,action:normalized,battleId,speed,target,startedAt:0,abort:new AbortController(),lease:null,home:{x:actor.x,y:actor.y},segments:null};
 hongThuongActive.add(info);
 try{
  if(!__hvIsSkipping()){
   const clips=normalized==='ultimate'
    ?['ult-prep','ult-cluster','ult-finisher','run','standing'].map(hongThuongClip)
    :[...['basic','standing'].map(hongThuongClip)];
   clips.push(hongThuongVfxClip('impact'));
   info.lease=await __hvSkipVisualAssets(()=>BACH_DIEN_LOADER.acquire(clips,{scope:'battle',owner:'hong-thuong:'+actor.id,signal:info.abort.signal}),battleId);
   if(__hvIsSkipping())info.abort.abort();
  }
  try{await window.HonVietSfx?.prepare('hong-thuong-impact',{signal:info.abort.signal});}catch(error){}
  if(battleId!==state.battleId){finishHongThuongAction(info);return null;}
  info.startedAt=performance.now();actor._hongThuongAction=info;
  window.__HV_HONG_THUONG_ACTION={actorId:actor.id,action:normalized,phase:'playing',battleId};
  const tl=HONG_THUONG_META.ultimateTimeline;
  info.impactMs=normalized==='basic'?(tl.hitMsBasic?.[0]??384):tl.prepMs+(tl.clusterHitsAt?.[0]??96);
  info.actionTotalMs=normalized==='basic'
   ?HONG_THUONG_META.clips.basic.durationMs
   :tl.prepMs+6*(tl.clusterMs+140)+260+tl.finisherMs+420; // provisional — resolve() overrides with the real segment plan
  actor.state=normalized==='ultimate'?'ultimate':'attack';actor.stateStarted=info.startedAt;
  actor.stateDuration=(normalized==='ultimate'
   ?tl.prepMs+tl.clusterMs*6+tl.finisherMs+600
   :HONG_THUONG_META.clips.basic.durationMs)/speed;
  return info;
 }catch(error){finishHongThuongAction(info);if(error.name!=='AbortError'){console.error('Hồng Thương asset readiness failed',error);window.__HV_HONG_THUONG_ACTION={actorId:actor.id,action:normalized,phase:'asset-error',error:String(error),battleId};if(typeof setStatus==='function')setStatus('Không tải được animation Hồng Thương — thử tải lại trận');}return null;}
}
async function waitHongThuongMarker(info,marker,battleId){
 const at=typeof marker==='number'?marker:marker==='recovery:end'?info.actionTotalMs:marker==='impact'?info.impactMs||0:0;
 while(state.battleId===battleId){if(__hvIsSkipping()||hongThuongElapsed(info)>=at)return true;if(!await sleepVisualMilliseconds(Math.min(40,(at-hongThuongElapsed(info))/info.speed),battleId))break;}
 finishHongThuongAction(info);return false;
}
function finishHongThuongAction(info){if(!info)return;info.abort.abort();info.lease?.release();hongThuongActive.delete(info);if(info.actor._hongThuongAction===info)delete info.actor._hongThuongAction;}
function cancelHongThuongActions(){for(const info of [...hongThuongActive])finishHongThuongAction(info);hongThuongVfxLive.length=0;}
/* ---- VFX mẫu 22 (tw_90_zxzy_d, owner-approved): spawn at the spear impact
   point on the victim — never at the attacker's stand tile. ---- */
function hongThuongVfxClip(key){const c=HONG_THUONG_META.vfx.clips[key];return {...c,src:'assets/vfx/hong-thuong/'+c.file,decodedBytes:c.cols*c.cellW*Math.ceil(c.frames/c.cols)*c.cellH*4};}
function hongThuongVfxImage(key){return BACH_DIEN_LOADER.ensure(hongThuongVfxClip(key),{scope:'battle',priority:'visible'}).image;}
const hongThuongVfxLive=[];
function hongThuongSfx(info){
 if(!state.sound||__hvIsSkipping())return;
 try{void window.HonVietSfx?.play('hong-thuong-impact',{group:'combat',signal:info.abort.signal,playbackRate:info.speed});}catch(error){}
}
// ── Owner 2026-10-26: hiệu ứng tràn sân vẽ bằng canvas (không thêm atlas, không tốn bộ nhớ) ────────
// Ba lớp: vòng vàng dưới mục tiêu → cột lửa + tàn lửa → vệt chém lưỡi liềm khi kết liễu.
const hvUltFx = { rings: [], waves: [], embers: [], startedAt: 0, battleId: null, tier: 0, stage: 0 };

if (typeof window !== 'undefined') window.HvUltFx = hvUltFx; // QA
function hvUltFxReset() { hvUltFx.rings.length = 0; hvUltFx.waves.length = 0; hvUltFx.embers.length = 0; hvUltFx.startedAt = 0; hvUltFx.battleId = null; hvUltFx.tier = 0; }

// Một đợt đánh: vòng vàng dưới chân mục tiêu + sóng lửa lan ra + tàn lửa bay lên. tier 0..2 càng cao càng lớn.
function hvUltFxWave(x, y, tier) {
  let t = Math.max(0, Math.min(2, tier | 0));
  const now = performance.now();
  hvUltFx.battleId = state.battleId;
  hvUltFx.tier = Math.max(hvUltFx.tier, t);
  // Owner 2026-10-26: càng về sau càng mạnh (tăng theo tiến trình cả đợt, không chỉ theo nhịp).
  const boost = Math.min(1.2, hvUltFx.stage * 0.22);
  t = Math.max(0, Math.min(2, t + (hvUltFx.stage >= 4 ? 1 : 0)));
  hvUltFx.rings.push({ x, y, startedAt: now, scale: (1 + t * 0.45) * (1 + boost), life: 600 + t * 220 });
  hvUltFx.waves.push({ x, y, startedAt: now, scale: (1 + t * 0.6) * (1 + boost), life: 520 + t * 260, tier: t });
  const count = Math.round((10 + t * 10) * (1 + boost));
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2, r = 12 + Math.random() * 46;
    hvUltFx.embers.push({
      x: x + Math.cos(a) * r, y: y + Math.sin(a) * r * 0.5,
      vx: (Math.random() - 0.5) * 0.05, vy: -0.06 - Math.random() * 0.09,
      startedAt: now, life: 620 + Math.random() * 520, size: 1.6 + Math.random() * 2.6 + t
    });
  }
}

function unit0X(v){const u=getUnit(v&&v.id);return u?u.x:(v&&v.x)||0;}
function unit0Y(v){const u=getUnit(v&&v.id);return u?(u.y-60):((v&&v.y)||0)-60;}
function hvUltFxCrescent(x, y, tier) {
  hvUltFx.waves.push({ x, y, startedAt: performance.now(), scale: 2.1, life: 460, tier: 2, crescent: true });
  hvUltFx.battleId = state.battleId;
}

function drawHvUltFx(ctx, time) {
  if (hvUltFx.battleId !== state.battleId) return;
  const now = performance.now();
  // 1. vòng vàng dưới chân
  for (let i = hvUltFx.rings.length - 1; i >= 0; i--) {
    const r = hvUltFx.rings[i], p = (now - r.startedAt) / r.life;
    if (p >= 1) { hvUltFx.rings.splice(i, 1); continue; }
    const rad = (18 + 54 * p) * r.scale;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = 'rgba(255,206,96,' + (0.85 * (1 - p)).toFixed(3) + ')';
    ctx.lineWidth = 3 + 4 * (1 - p);
    ctx.beginPath(); ctx.ellipse(r.x, r.y, rad, rad * 0.42, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,120,50,' + (0.55 * (1 - p)).toFixed(3) + ')';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(r.x, r.y, rad * 1.18, rad * 0.5, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }
  // 2. sóng lửa / vệt chém
  for (let i = hvUltFx.waves.length - 1; i >= 0; i--) {
    const w = hvUltFx.waves[i], p = (now - w.startedAt) / w.life;
    if (p >= 1) { hvUltFx.waves.splice(i, 1); continue; }
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    if (w.crescent) {
      ctx.translate(w.x, w.y);
      ctx.rotate(-0.28);
      const grad = ctx.createLinearGradient(-90, 0, 90, 0);
      grad.addColorStop(0, 'rgba(255,150,40,0)');
      grad.addColorStop(0.45, 'rgba(255,224,150,' + (0.85 * (1 - p)).toFixed(3) + ')');
      grad.addColorStop(1, 'rgba(255,90,30,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(0, 0, 90 + 60 * p, 16 + 22 * p, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const rad = (24 + 70 * p) * w.scale;
      const alpha = 0.55 * (1 - p);
      const g2 = ctx.createRadialGradient(w.x, w.y, rad * 0.3, w.x, w.y, rad);
      g2.addColorStop(0, 'rgba(255,240,190,' + (alpha * 0.9).toFixed(3) + ')');
      g2.addColorStop(0.5, 'rgba(255,140,40,' + (alpha * 0.6).toFixed(3) + ')');
      g2.addColorStop(1, 'rgba(180,30,10,0)');
      ctx.fillStyle = g2;
      ctx.beginPath(); ctx.ellipse(w.x, w.y, rad, rad * 0.55, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }
  // 3. tàn lửa bay lên
  for (let i = hvUltFx.embers.length - 1; i >= 0; i--) {
    const e = hvUltFx.embers[i], p = (now - e.startedAt) / e.life;
    if (p >= 1) { hvUltFx.embers.splice(i, 1); continue; }
    e.x += e.vx * 16; e.y += e.vy * 16; e.vy += 0.0016;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = 'rgba(255,' + Math.round(150 + 90 * (1 - p)) + ',60,' + (0.8 * (1 - p)).toFixed(3) + ')';
    ctx.beginPath(); ctx.arc(e.x, e.y, e.size * (1 - p * 0.5), 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
}

function spawnHongThuongVfx(x,y,info,target){hongThuongVfxImage('impact');
 const body=target?battleCharacterBody(target):null;
 const centerX=body?body.centerX:x,centerY=body?body.centerY:y;
 hongThuongVfxLive.push({x:centerX,y:centerY,speed:info?.speed||state.speed||1,startedAt:performance.now(),battleId:state.battleId});}

function drawHongThuongVfx(context,time){
 try{drawHvUltFx(context,time);}catch(_){}

 const clip=HONG_THUONG_META.vfx.clips.impact;
 for(let i=hongThuongVfxLive.length-1;i>=0;i--){
  const v=hongThuongVfxLive[i],elapsed=(time-v.startedAt)*v.speed,ms=clip.frames/clip.fps*1000;
  if(elapsed>=ms||state.battleId!==v.battleId){hongThuongVfxLive.splice(i,1);continue;}
  const img=hongThuongVfxImage('impact');if(!img||img.complete===false||img.naturalWidth===0)continue;
  const frame=Math.min(clip.frames-1,Math.floor(elapsed/1000*clip.fps));
  const d=clip.display||{},dh=d.heightPx||160,w=dh*(clip.cellW/clip.cellH);
  context.save();context.globalCompositeOperation=clip.blendMode||'screen';
  context.imageSmoothingEnabled=true;context.imageSmoothingQuality='high';
  // Two co-timed layers share one event, sprite and SFX. Small separation
  // thickens the slash without replaying damage or creating a second cast.
  for(const layer of [{dx:-8,dy:5,alpha:1},{dx:8,dy:-5,alpha:.85}]){
   context.globalAlpha=layer.alpha;
   context.drawImage(img,(frame%clip.cols)*clip.cellW,Math.floor(frame/clip.cols)*clip.cellH,clip.cellW,clip.cellH,v.x-w/2+layer.dx,v.y-dh*.5+layer.dy,w,dh);
  }
  context.restore();
 }
}
/* ---- Authored playback per hit; damage resolves ONLY at the marker. ---- */
 async function resolveHongThuongCast(e,info,actor,action,target,battleId){
 const hitAt=async ms=>{if(!await waitHongThuongMarker(info,ms,battleId))return false;return state.battleId===battleId;};
 const flush=()=>{updateTeamCounters();splusStateView();};
 if(action!=='ultimate'){
  const result=e.act(actor.id,action,target?.id,{deferHongThuong:true});if(!result.ok)return result;
  const victimUnit=getUnit(target?.id)||actor;
  info.spot=hongThuongSpotFor(actor,victimUnit);
  const t=HONG_THUONG_META.ultimateTimeline.hitMsBasic||[384,816,864];
  for(let i=0;i<3;i++){
   if(!await hitAt(t[i]))return {ok:false};
   e.resolveHongThuongHit(actor.id,result.castId,victimUnit.id,i);
   if(victimUnit.hp>0)spawnHongThuongVfx(victimUnit.x,victimUnit.y-60,info,victimUnit);
   hongThuongSfx(info);flush();
  }
  if(!await hitAt(HONG_THUONG_META.clips.basic.durationMs))return {ok:false};
  e.finishHongThuongCast(actor.id,result.castId);flush();
  return result;
 }
 const result=e.act(actor.id,action,target?.id,{deferHongThuong:true});if(!result.ok)return result;
 const tl=HONG_THUONG_META.ultimateTimeline;
 // Owner 2026-10-26: tối sân + zoom khi bắt đầu tuyệt kỹ toàn sân.
 try{hvScreenFx.start();}catch(_){}

 // Read-only cast plan (engine legal-target list) — the authoritative per-hit
 // sequencing stays in the engine via struckIds as markers resolve below.
 const victims=e.targets(actor.id,'ultimate').filter(Boolean);
 // Travel and authored clips occupy disjoint intervals. Damage markers use
 // these same cluster starts, so movement cannot hide the opening thrust.
 const seg=[];let cursor=tl.prepMs,from=info.home;
 const spotOf=v=>hongThuongSpotFor(actor,getUnit(v?.id)||v);
 const clusterStarts=[];
 seg.push({start:0,dur:tl.prepMs,from:info.home,to:info.home,clip:'ult-prep'});
 for(const v of victims){
  const spot=spotOf(v);
  seg.push({start:cursor,dur:220,from,to:spot,clip:'run'});cursor+=220;
  clusterStarts.push(cursor);
  seg.push({start:cursor,dur:tl.clusterMs,from:spot,to:spot,clip:'ult-cluster'});
  cursor+=tl.clusterMs;from=spot;
 }
 info.segments=seg;
 info.actionTotalMs=cursor+260+tl.finisherMs+420;
 // Playback: prep → per-foe cluster → Hồi Mã Thương → glide home.
 if(!await hitAt(tl.prepMs))return {ok:false};
 for(const v of victims){
  const spot=spotOf(v);info.clip='ult-cluster';
  const base=clusterStarts[victims.indexOf(v)];
  for(let i=0;i<3;i++){
   const at=base+(tl.clusterHitsAt?.[i]??[96,384,672][i]);
   if(!await hitAt(at))return {ok:false};
   e.resolveHongThuongHit(actor.id,result.castId,v.id,i);
   // Owner 2026-10-26: ba đợt tăng dần — nhịp 1 nhẹ, nhịp 2 vừa, nhịp 3 nặng (flash + rung mạnh).
   try{hvScreenFx.punch(i);}catch(_){}
   try{hvUltFxWave(unit0X(v), unit0Y(v), i);}catch(_){}
   const unit=getUnit(v.id);
   if(unit&&unit.hp>0)spawnHongThuongVfx(unit.x,unit.y-60,info,unit);
   hongThuongSfx(info);flush();
  }
  if(!await hitAt(base+tl.clusterMs))return {ok:false};
  hvUltFx.stage = Math.min(6, (hvUltFx.stage || 0) + 1);
 }
 // Select after all cluster damage, matching the engine's living-target rule.
 const finaleVictim=e.nextHongThuongFinale(actor.id,result.castId);
 const finaleSpot=finaleVictim?hongThuongSpotFor(actor,getUnit(finaleVictim.id)||finaleVictim,'spear'):null;
 if(finaleSpot){
  seg.push({start:cursor,dur:260,from,to:finaleSpot,clip:'run'});cursor+=260;
  const finaleStart=cursor;
  seg.push({start:cursor,dur:tl.finisherMs,from:finaleSpot,to:finaleSpot,clip:'ult-finisher'});
  cursor+=tl.finisherMs;from=finaleSpot;
  seg.push({start:cursor,dur:420,from,to:info.home,clip:'run'});
  info.actionTotalMs=cursor+420;
  if(!await hitAt(finaleStart+tl.finisherHitAt))return {ok:false};
  const unit=getUnit(finaleVictim.id);
  e.resolveHongThuongFinale(actor.id,result.castId);
  try{hvScreenFx.punch(2);hvUltFxCrescent(unit0X(finaleVictim),unit0Y(finaleVictim),2);}catch(_){}
  if(unit)spawnHongThuongVfx(unit.x,unit.y-60,info,unit);
  hongThuongSfx(info);flush();
 }else{
  seg.push({start:cursor,dur:420,from,to:info.home,clip:'run'});
  info.actionTotalMs=cursor+420;
 }
 if(!await hitAt(info.actionTotalMs))return {ok:false};
 e.finishHongThuongCast(actor.id,result.castId);flush();
 try{hvScreenFx.stop();hvUltFxReset();}catch(_){}
 return result;
}



