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
// Owner 2026-10-26: KHÔNG rung màn hình, KHÔNG flash (nhìn đau mắt) — chỉ tối sân + vignette + zoom nhẹ.
const HV_SCREEN_FX_TIERS = [
  { dim: 0.38, zoom: 1.04, ms: 520 },
  { dim: 0.48, zoom: 1.06, ms: 640 },
  { dim: 0.58, zoom: 1.09, ms: 900 }
];
const hvScreenFx = (() => {
  let wrap = null, dim = null, vignette = null, flash = null, canvas = null, raf = 0, state = null, lastSpots = null;
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
  // Owner 2026-10-26: chỉ tối XUNG QUANH. Vùng Hồng Thương và vùng đội địch phải sáng
  // để còn nhìn thấy diễn hoạt + VFX. Dùng mask đục 2 lỗ tròn tại hai vùng đó.
  function cutLights(spots) {
    if (!dim || !spots) return;
    const cv = canvas || document.querySelector('canvas');
    if (!cv) return;
    const kx = cv.clientWidth / Math.max(1, cv.width), ky = cv.clientHeight / Math.max(1, cv.height);
    const px = (u) => '(' + Math.round((u.x || 0) * kx) + 'px ' + Math.round((u.y || 0) * ky) + 'px)';
    const hero = spots.hero, foes = spots.foes || [];
    const layers = ['linear-gradient(#000,#000)'];
    const comps = [];
    if (hero) { layers.push('radial-gradient(circle 150px at ' + px(hero) + ', transparent 0%, transparent 62%, #000 100%)'); comps.push('subtract'); }
    if (foes.length) {
      const cx = foes.reduce((t, f) => t + (f.x || 0), 0) / foes.length;
      const cy = foes.reduce((t, f) => t + (f.y || 0), 0) / foes.length;
      const spreadX = Math.max(...foes.map(f => Math.abs((f.x || 0) - cx))) + 110;
      const spreadY = Math.max(...foes.map(f => Math.abs((f.y || 0) - cy))) + 130;
      const r = Math.max(150, Math.round(Math.max(spreadX, spreadY * 0.9)));
      layers.push('radial-gradient(ellipse ' + r + 'px ' + Math.round(r * 0.75) + 'px at ' + px({ x: cx, y: cy }) + ', transparent 0%, transparent 66%, #000 100%)');
      comps.push('subtract');
    }
    if (!comps.length) {
      dim.style.webkitMaskImage = '';
      dim.style.maskImage = '';
      dim.style.maskComposite = '';
      dim.style.webkitMaskComposite = '';
      return;
    }
    const mask = layers.join(', ');
    dim.style.webkitMaskImage = mask;
    dim.style.maskImage = mask;
    dim.style.webkitMaskComposite = comps.map(() => 'source-out').join(', ');
    dim.style.maskComposite = comps.join(', ');
  }

  function punch(tier, spots) {
    window.__fxPunches = (window.__fxPunches || 0) + 1;
    const cfg = HV_SCREEN_FX_TIERS[Math.max(0, Math.min(HV_SCREEN_FX_TIERS.length - 1, tier | 0))];
    if (!ensure()) return;
    if (spots) lastSpots = spots;
    cutLights(lastSpots);
    wrap.style.opacity = '1';
    dim.style.opacity = String(cfg.dim);
    vignette.style.opacity = '1';
    apply(cfg.zoom);
    state = { until: performance.now() + cfg.ms };
  }
  function start() {
    if (!ensure()) return;
    cutLights(lastSpots);
    wrap.style.opacity = '1';
    dim.style.opacity = '0.3';
    vignette.style.opacity = '1';
    apply(1.03);
  }
  function stop() {
    cancelAnimationFrame(raf);
    if (dim) { dim.style.maskImage = ''; dim.style.webkitMaskImage = ''; dim.style.maskComposite = ''; dim.style.webkitMaskComposite = ''; }
    lastSpots = null;
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
  // QA (?qaUlti=1): ghi lại vị trí thân thực tế đang vẽ
  if(typeof window!=='undefined'&&typeof location!=='undefined'&&/qaUlti=1/.test(String(location.search||''))){
   try{window.__BODY_CALLS=(window.__BODY_CALLS||0)+1;const _s=info.segments;let _r=null;
    if(!_s)_r=info.home;else{for(const _g of _s){if(elapsed>=_g.start&&elapsed<_g.start+_g.dur){_r=_g.to===null?info.home:lerp(_g.from,_g.to,(elapsed-_g.start)/_g.dur);break;}}
     if(!_r){const _l=_s[_s.length-1];_r=_l.to===null?info.home:_l.to;}}
    window.__BODY_LAST={t:Math.round(elapsed),x:_r?Math.round(_r.x):null,y:_r?Math.round(_r.y):null,segs:_s?_s.length:0};
   }catch(_){}
  }
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
 const facing=(u.team===TEAM_ENEMY?-1:1)*(key==='ult-finisher'?-1:1);
 // Owner 2026-10-26: lúc ở trên cao thì chếch người xuống theo hướng địch.
 let tilt=0;
 if(active&&info.action==='ultimate'&&info.ultHover&&key==='ult-cluster'){
  const segsN=info.segments||[];const segN=segsN.find(x=>elapsed>=x.start&&elapsed<x.start+x.dur);
  // Owner 2026-10-26: phải chếch XUỐNG 45 độ (bản trước nghiêng ngược lên).
  if(segN&&segN.from&&segN.from.y<=info.ultHover.y+1)tilt=(Math.PI/4)*facing;
 }
 ctx.scale(scale*facing,scale);
 if(tilt)ctx.rotate(tilt);
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

function spawnHongThuongVfx(x,y,info,target,spread){hongThuongVfxImage('impact');
 const body=target?battleCharacterBody(target):null;
 const centerX=body?body.centerX:x,centerY=body?body.centerY:y;
 const s=spread||null;
 hongThuongVfxLive.push({x:centerX+(s?s.dx:0),y:centerY+(s?s.dy:0),speed:info?.speed||state.speed||1,
  startedAt:performance.now()+(s?s.delay||0:0),battleId:state.battleId});}
// Owner 2026-10-26: mỗi địch nhận 4 lớp VFX xen kẽ nhau (lệch vị trí + lệch nhịp) cho dày mắt.
function spawnHongThuongVfxQuad(x,y,info,target){
 const quad=[{dx:-14,dy:6,delay:0},{dx:12,dy:-4,delay:90},{dx:-4,dy:-14,delay:180},{dx:6,dy:14,delay:270}];
 for(const q of quad)spawnHongThuongVfx(x,y,info,target,q);
}

function drawHongThuongVfx(context,time){

 const clip=HONG_THUONG_META.vfx.clips.impact;
 for(let i=hongThuongVfxLive.length-1;i>=0;i--){
  const v=hongThuongVfxLive[i],elapsed=(time-v.startedAt)*v.speed,ms=clip.frames/clip.fps*1000;
  if(elapsed<0)continue;
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
 // Owner 2026-10-26: diễn hoạt mới — bay lên trên đội địch rồi chọc 4 lần xuống TOÀN BỘ địch.
 // Không rung màn hình, không flash, không vẽ hiệu ứng bằng canvas: mọi VFX là sprite thật
 // nhân lên ở từng địch nên sân dày hiệu ứng.
 const livingFoes=()=>e.targets(actor.id,'ultimate').filter(Boolean)
   .map(v=>getUnit(v.id)).filter(u=>u&&u.hp>0);
 // Owner 2026-10-26 (chốt lại): cô ấy ĐỨNG YÊN tại một điểm trước vị trí số 2 của đội địch.
 // Mỗi nhịp: bay lên cao -> giữ trên cao, chếch người xuống, đánh -> VFX nổi trên đầu TOÀN BỘ địch
 // -> hạ xuống đúng điểm đó. Lặp lại y hệt 4 lần (không nhảy sang từng người).
 const seg=[];let cursor=0;const waves=[];
 seg.push({start:0,dur:tl.prepMs,from:info.home,to:info.home,clip:'ult-prep'});
 cursor=tl.prepMs;
 const first=livingFoes();
 if(!first.length){
  seg.push({start:cursor,dur:420,from:info.home,to:info.home,clip:'run'});
  info.segments=seg;info.actionTotalMs=cursor+420;
 }else{
  const bySlot=a=>a.slice().sort((x,y)=>(x.slot??0)-(y.slot??0));
  const sorted=bySlot(first);
  // "vị trí số 2" = địch ở slot thứ 2 của đội hình (fallback: con đầu tiên)
  const anchor=sorted[Math.min(1,sorted.length-1)];
  const firstBody=(typeof battleCharacterBody==='function'&&battleCharacterBody(anchor))?battleCharacterBody(anchor):null;
  // battleCharacterBody có thể trả bodyH rất nhỏ với unit không có art -> phải có sàn, nếu không
  // điểm bay lên trùng luôn điểm đứng (đo được: hover.y == ground.y).
  const bodyH=Math.max(96,(firstBody&&firstBody.bodyH)||160);
  const dir=actor.team===TEAM_ENEMY?1:-1; // đứng về phía đội mình so với địch
  // Đứng TRƯỚC mặt địch (xa hơn) và bay lên CAO HẲN trên đầu cả đội (owner: phải thấy rõ là bay lên).
  // Owner 2026-10-26: gần hơn + thấp hơn bản trước (bay 2.85 thân và cách 96px bị chê là quá xa/cao).
  const ground={x:anchor.x+dir*Math.max(54,bodyH*0.5),y:anchor.y+bodyH*0.22};
  const hover={x:ground.x,y:ground.y-bodyH*1.55};
  // đi tới điểm đứng trước mặt địch
  seg.push({start:cursor,dur:320,from:info.home,to:ground,clip:'run'});cursor+=320;
  // Owner 2026-10-26: 3 đợt, mỗi đợt 3 lần đánh, nhịp chậm hơn cho "đã tai".
  const WAVES=3,STRIKES=3,STRIKE_MS=460,HOVER_MS=STRIKES*STRIKE_MS;
  for(let w=0;w<WAVES;w++){
    seg.push({start:cursor,dur:240,from:ground,to:hover,clip:'run'});cursor+=240;
    const hoverStart=cursor;
    seg.push({start:hoverStart,dur:HOVER_MS,from:hover,to:hover,clip:'ult-cluster'});cursor+=HOVER_MS;
    for(let k=0;k<STRIKES;k++)waves.push({at:hoverStart+Math.round(STRIKE_MS*(k+0.45)),wave:w*STRIKES+k,spot:hover});
    seg.push({start:cursor,dur:240,from:hover,to:ground,clip:'run'});cursor+=240;
  }
  seg.push({start:cursor,dur:420,from:ground,to:info.home,clip:'run'});cursor+=420;
  info.segments=seg;info.actionTotalMs=cursor;
  info.ultGround=ground;info.ultHover=hover;
  if(typeof window!=='undefined'&&typeof location!=='undefined'&&/qaUlti=1/.test(String(location.search||''))){
   window.__ULT_SEG=seg.map(x=>({start:x.start,dur:x.dur,clip:x.clip,fx:Math.round(x.from.x),fy:Math.round(x.from.y),tx:Math.round(x.to.x),ty:Math.round(x.to.y)}));
   window.__ULT_HOVER={x:Math.round(hover.x),y:Math.round(hover.y),groundY:Math.round(ground.y)};
  }
 }
 info.actionTotalMs=Math.max(info.actionTotalMs||0,cursor);
 if(!await hitAt(tl.prepMs))return {ok:false};
 info.clip='ult-cluster';
 for(const w of waves){
  if(!await hitAt(w.at))return {ok:false};
  const foes=livingFoes();
  // vị trí sáng: chỗ cô ấy đang đứng/bay và cả cụm địch
  try{hvScreenFx.punch(Math.min(2,Math.floor(w.wave/3)),{hero:w.spot,foes:livingFoes()});}catch(_){}
  // Mỗi nhịp: toàn bộ địch còn sống ăn đòn (chỉ số nhịp 0..3)
  for(const f of foes){e.resolveHongThuongHit(actor.id,result.castId,f.id,w.wave);}
  // VFX nổi TRÊN ĐẦU từng địch -> cả sân dày hiệu ứng
  for(const f of foes){
   const u=getUnit(f.id);
   if(u)spawnHongThuongVfxQuad(u.x,u.y-60,info,u);
  }
  hongThuongSfx(info);flush();
 }
 try{hvScreenFx.punch(2);}catch(_){}
 if(!await hitAt(info.actionTotalMs))return {ok:false};
 e.finishHongThuongCast(actor.id,result.castId);flush();
 try{hvScreenFx.stop();hvUltFxReset();}catch(_){}
 return result;
}



