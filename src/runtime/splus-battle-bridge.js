// Injected into the existing battle closure by the source build owner.
// This bridge uses advanceTurn/sleep/render; it does not own a second clock.
let splusEngine = null;
let splusPresentation = null;
let splusSkillUI=null;
let splusRuntimeDisabled=false;
function splusReset(){
  for(const info of coNuongActive)info.abort.abort();coNuongActive.clear();
  coNuongImpacts.length=0;coNuongMotion.clear();
  try{splusSkillUI?.destroy();}catch(error){console.warn('S+ optional UI cleanup skipped; battle continues.',error);}
  splusSkillUI=null;splusEngine=null;splusPresentation=null;splusRuntimeDisabled=false;
  document.getElementById('splus-battle-skills')?.remove();
  document.getElementById('splus-status-panel')?.remove();
  document.body.classList.remove('splus-battle');
}
function splusSkillOptions(actor){
  const actorId=actor.id;
  const allowed=(current,combat,action)=>!!current&&!!combat&&state.mode==='battle'&&state.currentId===actorId&&!state.locked&&!state.auto&&combat.canUse(current,action);
  return {getState:()=>{
    const current=getUnit(actorId),combat=splusCombat();
    return {energy:current?.energy||0,cooldowns:Object.fromEntries(['skill','ultimate'].map(a=>[a,Math.max(0,(current?.splus?.cooldowns?.[a]||0)-(combat?.round||0))])),canUse:Object.fromEntries(['skill','ultimate'].map(a=>[a,allowed(current,combat,a)]))};
  },cast:action=>{if(allowed(getUnit(actorId),splusCombat(),action))chooseAction(action);}};
}
function splusInspectAction(action,button){
  if(!splusCombat()||action==='basic')return chooseAction(action);
  const actor=getUnit(state.currentId);if(actor)splusSkillUI?.open(actor.sourceId,action,button,splusSkillOptions(actor));
}
function splusTargetTeam(actor,candidates,fallback){
  if(!splusCombat())return fallback;
  const teams=new Set((candidates||[]).filter(Boolean).map(unit=>unit.team));
  return teams.size===1?[...teams][0]:fallback;
}
function splusSkillBar(){
  const host=document.querySelector('.action-zone');
  if(!host||typeof globalThis.createSplusSkillUI!=='function'||!globalThis.SPLUS42?.profiles)return false;
  if(!splusSkillUI)splusSkillUI=globalThis.createSplusSkillUI(globalThis.SPLUS42.profiles);
  const actor=getUnit(state.currentId);let strip=document.getElementById('splus-battle-skills');
  if(!strip){strip=document.createElement('div');strip.id='splus-battle-skills';strip.className='splus-skill-strip';host.prepend(strip);}
  if(actor&&strip.dataset.actorId!==actor.id){
    strip.dataset.actorId=actor.id;
    const slots=typeof isLinhDong==='function'&&isLinhDong(actor)?['passive','ultimate']:['passive','skill','ultimate'];
    strip.replaceChildren(...slots.map(slot=>splusSkillUI.button(actor.sourceId,slot,splusSkillOptions(actor))).filter(Boolean));
  }
  splusSkillUI.refresh();return true;
}
function splusFloater(target,amount,healing=false,critical=false) {
  if(!(amount>0))return;
  // Damage is emitted at the engine's actual impact, including a single HP.
  // Only healing may coalesce; batching damage loses multi-contact feedback.
  if(splusPresentation&&healing){const id=target.id+':heal',previous=splusPresentation.get(id);splusPresentation.set(id,{target,amount:amount+(previous?.amount||0),healing:true,critical:false});return;}
  addFloater(target,`${!healing&&critical?'BẠO KÍCH ':''}${healing?'+':'−'}${amount}`,healing?'#8fe7bd':critical?'#9e2345':'#ffd34b',critical);
}
function flushSplusPresentation(){
  const batch=splusPresentation;if(!batch?.size)return;
  const hits=[...batch.values()];batch.clear();splusPresentation=null;
  try{for(const hit of hits)splusFloater(hit.target,hit.amount,hit.healing,hit.critical);}
  finally{splusPresentation=batch;}
}
function splusOwnsActor(actor){
  return !!actor&&actor.kitVersion==='splus42-v2';
}
function splusActive() {
  const catalog=globalThis.SPLUS42?.catalog;
  return !splusRuntimeDisabled&&Array.isArray(catalog)&&HEROES.some(h=>catalog.some(c=>c.id===h.sourceId));
}
function splusCombat() {
  if (!splusActive() || !units.length) return null;
  if (!splusEngine) {
    try{
      const engine=globalThis.SPLUS42.create({units, mutate:true, rng:site => __hvRuleRandom3qAdapter(site), onEvent:splusEvent});
      engine.start();
      splusEngine=engine;
    }catch(error){
      splusRuntimeDisabled=true;
      splusEngine=null;
      console.warn('S+ runtime bootstrap failed; falling back to core combat for this battle.',error);
      return null;
    }
  }
  return splusEngine;
}
function splusHeroConfig(raw, index) {
  if(raw&&/^(?:co_nuong|co-nuong)$/i.test(raw.sourceId||raw.id||''))raw={...raw,sourceId:'hero_splus_co_nuong'};
  const h=normalizeConfiguredHero(raw,index),kit=globalThis.SPLUS42.catalog.find(c=>c.id===h.sourceId);
  if(!kit)return h;
  return {...h,name:kit.name,title:kit.elementName,initial:String(kit.number),archetype:kit.role,roleClass:kit.role,kitVersion:'splus42-v2',skillKit:null,passive:kit.passive.description,passiveIds:[kit.passive.id],basicId:kit.actions.basic.id,basicName:kit.actions.basic.name,basicDetail:kit.actions.basic.description,basicKind:'damage',skillName:kit.actions.skill.name,skillDetail:kit.actions.skill.description,skillKind:['healer','support'].includes(kit.role)?'heal':'damage',ultimateId:kit.actions.ultimate.id,ultimateName:kit.actions.ultimate.name,ultimateDetail:kit.actions.ultimate.description,ultimateKind:'aoe',visualId:kit.id,visualSource:kit.key==='linh_dong'?'linh-dong-authored':kit.key==='bach_dien'?'bach-dien-authored':kit.key==='co_nuong'?'co-nuong-authored':'splus-pending-art'};
}
function splusEvent(event) {
  // Persistent parasite art is derived from the combat HUD status, never a timed burst.
  const t=getUnit(event.targetId),a=getUnit(event.sourceId);
  if(t&&event.type==='damage'&&!event.legacyImpact){splusFloater(t,event.amount,false,event.critical);t.hpTween=null;const rec=intelUnit(t);if(rec)rec.damageTaken+=event.amount;const ar=intelUnit(a);if(ar)ar.damage+=event.amount;if(typeof isLinhDong==='function'&&isLinhDong(t)&&t.hp>0&&typeof linhDongActionMs==='function'){const hurtMs=linhDongActionMs('hurt');setUnitState(t,'hurt',hurtMs);setTimeout(()=>{ if(t.hp>0&&t.state==='hurt') setUnitState(t,'idle',800); }, hurtMs);}else if(typeof isBachDien==='function'&&isBachDien(t)&&t.hp>0&&typeof bachDienActionMs==='function'){const hurtMs=bachDienActionMs('hurt');setUnitState(t,'hurt',hurtMs);setTimeout(()=>{ if(t.hp>0&&t.state==='hurt') setUnitState(t,'idle',800); }, hurtMs);}}
  if(t?.sourceId==='hero_splus_co_nuong'&&event.type==='damage'&&t.hp>0)coNuongMotion.set(t.id,{kind:'hit',start:performance.now(),duration:850});
  if(t?.sourceId==='hero_splus_co_nuong'&&event.type==='death')coNuongMotion.set(t.id,{kind:'fall-die',start:performance.now(),duration:4000});
  if(t&&event.type==='heal'&&!event.legacyImpact){splusFloater(t,event.amount,true);t.hpTween=null;const ar=intelUnit(a);if(ar)ar.healing+=event.amount;}
  // Owner 2026-10-25: a shielded hit must show what the shield ate (teal, shield mark), never 'nothing happened'.
  if(t&&event.type==='shieldAbsorb'&&!event.legacyImpact&&event.amount>0)addFloater(t,`\u{1F6E1} −${event.amount}`,'#7de3d0',false);
  if(t&&event.type==='death'&&!event.legacyImpact)markDefeated(t);
  if(t&&event.type==='resurrect'){t.defeatedAt=0;t.displayHp=t.hp;setUnitState(t,'idle',800);}
  if(event.type==='extraTurn')state.queue.unshift(event.sourceId);
  if(event.type==='actionDelay'){
    const at=state.queue.indexOf(event.targetId);
    if(at>=0){state.queue.splice(at,1);state.queue.splice(Math.min(state.queue.length,at+Math.ceil(state.queue.length*event.fraction)),0,event.targetId);}
  }
  if(t&&event.type==='airborne')t.splusAirborneUntil=performance.now()+event.seconds*1000;
  if(event.type==='displacement'||event.type==='swap'){
    const compact=innerWidth<600||(innerHeight>innerWidth&&innerWidth<=1180);
    let positions=POSITIONS;
    if(compact&&typeof battleFormationForViewport==='function'){
      const rect=typeof battleViewportSize==='function'?battleViewportSize():{width:innerWidth,height:innerHeight};
      positions=battleFormationForViewport(rect.width,rect.height);
    }else if(compact&&typeof mobileFormationForViewport==='function'){
      positions=mobileFormationForViewport();
    }
    for(const u of units){const p=positions[u.team][u.slot];u.baseX=p.x;u.baseY=p.y;u.x=p.x;u.y=p.y;u.homeAnchorId=`${u.team}:slot-${u.slot}`;u.homeAnchor={x:p.x,y:p.y};}
  }
}
function splusStateView() {
  try{
    const e=splusCombat();if(!e)return false;
    splusSkillBar();
    document.body.classList.add('splus-battle');
    // The seals HUD (Ấn ký trận đấu) is a QA view: production battles keep
    // only the skill strip, never the status panel below the battlefield.
    if(!new URLSearchParams(location.search).has('qaSplus42')){
      document.getElementById('splus-status-panel')?.remove();
      return true;
    }
    let panel=document.getElementById('splus-status-panel');
    if(!panel){panel=document.createElement('section');panel.id='splus-status-panel';panel.setAttribute('aria-label','Trạng thái 42 tướng S+');document.body.append(panel);}
    const heading=document.createElement('h2');heading.textContent=`Ấn ký trận đấu · Hiệp ${state.round||1}`;
    const grid=document.createElement('div');grid.className='splus-status-grid';
    for(const u of units){
      const card=document.createElement('article');card.dataset.heroId=u.sourceId;card.dataset.team=u.team;
      const name=document.createElement('strong');name.textContent=`${u.name} · ${u.team===TEAM_PLAYER?'Ta':'Địch'} · Ô ${u.slot+1}`;
      const health=document.createElement('p');health.textContent=`HP ${Math.round(u.hp)}/${u.maxHp} · Nộ ${Math.round(u.energy)} · Khiên ${Math.round(u.shield)}`;
      const list=document.createElement('ul');
      for(const status of e.hud(u)){
        const li=document.createElement('li');li.dataset.iconId=status.iconId||'';li.dataset.effect=status.type;li.dataset.sourceId=status.sourceId||'';li.dataset.polarity=status.polarity;
        const source=getUnit(status.sourceId);li.textContent=`${status.name} · ${globalThis.SPLUS42.labels[status.type]||status.type}${status.stacks>1?` ×${status.stacks}`:''}${status.charges!=null?` · ${status.charges} lần`:''} · ${status.remainingRounds==null?'Duy trì':`${status.remainingRounds} hiệp`} · ${source?.name||'Nguồn không còn'}`;list.append(li);
      }
      if(!list.childElementCount){const li=document.createElement('li');li.textContent=u.hp>0?'Chưa có ấn ký':'Đã gục ngã';list.append(li);}
      card.append(name,health,list);grid.append(card);
    }
    panel.replaceChildren(heading,grid);
    {
      const details=document.createElement('details'),summary=document.createElement('summary'),pre=document.createElement('pre');summary.textContent='Evidence trận S+ (QA)';pre.id='splus-evidence';
      const actions=e.events.filter(x=>x.type==='action');
      pre.textContent=JSON.stringify({schema:e.schema,mode:state.mode,round:e.round,actionCount:actions.length,eventCount:e.events.length,actionsByHero:actions.reduce((a,x)=>{const id=getUnit(x.sourceId)?.sourceId;a[id]??=[];if(!a[id].includes(x.action))a[id].push(x.action);return a;},{}),uniqueSlots:new Set(units.filter(u=>u.hp>0).map(u=>`${u.team}:${u.slot}`)).size,alive:units.filter(u=>u.hp>0).length,finite:units.every(u=>Number.isFinite(u.hp)&&Number.isFinite(u.energy)),statuses:units.map(u=>({id:u.id,heroId:u.sourceId,hp:u.hp,rage:u.energy,marks:e.hud(u)})),events:e.events.slice(-60)},null,2);details.append(summary,pre);panel.append(details);
    }
    return true;
  }catch(error){
    console.warn('S+ optional HUD failed; battle bootstrap continues without it.',error);
    return false;
  }
}
// Cổ Nương authored atlas player. Decode once; fixed foot registration prevents frame jitter.
const coNuongImages=new Map(),coNuongMotion=new Map(),coNuongImpacts=[],coNuongActive=new Set();
const coNuongClips=Object.freeze({
  idle:['assets/characters/co-nuong/idle.webp',30,8,480,440,100,224,432],
  basic:['assets/characters/co-nuong/basic.webp',18,6,480,440,720/18,215,431],
  ultimate:['assets/characters/co-nuong/ultimate.webp',18,6,480,440,2000/18,228,428],
  run:['assets/characters/co-nuong/run.webp',18,6,480,440,4000/18,156,423],
  hit:['assets/characters/co-nuong/hit.webp',18,6,480,440,4000/18,223,424],
  'fall-die':['assets/characters/co-nuong/fall-die.webp',18,6,480,440,4000/18,278,418],
  'vfx-basic':['assets/vfx/co-nuong/vfx-basic.webp',48,8,212,162,60,106,81],
  'vfx-ultimate':['assets/vfx/co-nuong/vfx-ultimate.webp',15,5,400,420,60,200,202],
  'vfx-parasite':['assets/vfx/co-nuong/vfx-parasite-smoke.webp',15,5,224,224,60,112,112]
});
function coNuongImage(src){
  if(!coNuongImages.has(src)){const image=new Image();image.decoding='async';image.src=src;coNuongImages.set(src,image);}
  return coNuongImages.get(src);
}
function coNuongAtlas(context,kind,x,y,elapsed,scale=1,mirror=false,once=false,frameIndex=null){
  const spec=coNuongClips[kind];if(!spec)return false;
  const [src,count,cols,w,h,ms,pivot,foot]=spec,image=coNuongImage(src);
  if(!image.complete||!image.naturalWidth)return false;
  const tick=Math.max(0,Math.floor(elapsed/ms)),index=frameIndex==null?(once?Math.min(count-1,tick):tick%count):frameIndex;
  context.save();context.translate(x,y);context.scale(mirror?-scale:scale,scale);
  if(kind.startsWith('vfx-'))context.globalCompositeOperation=kind==='vfx-parasite'?'source-over':'screen';
  context.drawImage(image,(index%cols)*w,Math.floor(index/cols)*h,w,h,-pivot,-foot,w,h);context.restore();
  return true;
}
function coNuongRender(context,unit,time){
  const motion=coNuongMotion.get(unit.id),elapsed=motion?Math.max(0,time-motion.start)*(motion.speed||1):0;
  if(motion&&elapsed>=motion.duration&&motion.kind!=='fall-die')coNuongMotion.delete(unit.id);
  const kind=unit.hp<=0?'fall-die':unit.state==='run'?'run':motion&&elapsed<motion.duration?motion.kind:'idle';
  const scale=typeof battleCharacterScale==='function'&&typeof battleCharacterDepthScale==='function'?battleCharacterScale(unit)*battleCharacterDepthScale(unit):(innerWidth<600?0.25:0.34)*(0.83+(unit.y-290)/1500);
  coNuongAtlas(context,kind,unit.x,unit.y,kind==='idle'?time:elapsed,scale,unit.team===TEAM_ENEMY,kind!=='idle');
  if(unit.hp>0)drawUnitHud(context,unit,time,1);
}
// Choreography is presentation-only: three blades, two complete out/back cycles each.
// The inspected 48-cell source contains 16 headings x 3 shimmer frames.
// Cells 36..38 face right; rotate those cells to the path tangent, never cycle headings.
function coNuongBody(unit){
  if(typeof battleCharacterBody==='function')return battleCharacterBody(unit);
  const height=unit.sourceId==='hero_splus_co_nuong'?409*(innerWidth<600?.25:.34)*(.83+(unit.y-290)/1500):310*(innerWidth<600?.34:.74);
  return {centerX:unit.x,centerY:unit.y-height/2,footY:unit.y,height};
}
function coNuongSwordPose(fx,age,blade){
  const t=age/.85-blade*120;if(t<0||t>1280)return null;
  const body=coNuongBody(fx.target),caster=coNuongBody(fx.actor),dir=fx.actor.team===TEAM_ENEMY?-1:1;
  const origin=fx.origin||{x:caster.centerX+dir*caster.height*.18,y:caster.centerY+caster.height*.02};
  const near={x:body.centerX-dir*body.height*.38,y:body.centerY+(blade-1)*body.height*.14};
  const far={x:body.centerX+dir*body.height*.38,y:body.centerY-(blade-1)*body.height*.14};
  let from=origin,to=near,u=t/360;
  if(t>=360){const pass=Math.min(3,Math.floor((t-360)/200));from=pass%2?far:near;to=pass%2?near:far;u=Math.min(1,(t-360-pass*200)/200);}
  return {x:from.x+(to.x-from.x)*u,y:from.y+(to.y-from.y)*u,angle:Math.atan2(to.y-from.y,to.x-from.x),scale:body.height*.52/188,alpha:t>1160?Math.max(0,1-(t-1160)/120):1,frame:36+Math.floor(Math.max(0,t)/60)%3};
}
function drawCoNuongParasites(context,time){
  if(__hvIsSkipping())return;
  const combat=splusCombat();if(!combat)return;
  for(const target of units){
    if(target.hp<=0)continue;
    const marks=combat.hud(target).filter(mark=>mark.type==='parasite'&&getUnit(mark.sourceId)?.sourceId==='hero_splus_co_nuong');
    if(!marks.length)continue;
    const body=coNuongBody(target);
    // One cloud per victim even with multiple stacks/sources. HUD remains the stack owner.
    coNuongAtlas(context,'vfx-parasite',body.centerX,body.centerY,time,body.height/200,false,false);
  }
}
// Render AFTER all actors. Follow live target coordinates; no detached screen-space stamps.
function drawCoNuongImpactOverlay(context,time){
  drawCoNuongParasites(context,time);
  for(let i=coNuongImpacts.length-1;i>=0;i--){
    const fx=coNuongImpacts[i],age=(time-fx.start)*(fx.speed||1);
    if(__hvIsSkipping()||(fx.battleId!=null&&fx.battleId!==state.battleId)||age>=fx.duration){coNuongImpacts.splice(i,1);continue;}
    if(age<0)continue;
    if(fx.kind==='vfx-basic'){
      for(let blade=0;blade<3;blade++){
        const pose=coNuongSwordPose(fx,age,blade);if(!pose)continue;
        context.save();context.translate(pose.x,pose.y);context.rotate(pose.angle);context.globalAlpha=pose.alpha;
        coNuongAtlas(context,'vfx-basic',0,0,age,pose.scale,false,true,pose.frame);context.restore();
      }
    }else{
      const body=fx.target?coNuongBody(fx.target):null;
      // 2x atlas: fixed luminous union y=40..364 (324px), never fit each frame.
      coNuongAtlas(context,fx.kind,body?.centerX??fx.x,body?.centerY??fx.y,age,body?body.height/324:fx.scale,!!fx.mirror,true);
    }
  }
}
// Use the existing visual waiter and shared audio bus, with one speed snapshot per cast.
async function performCoNuongAction(actor,action,target,e,battleId){
  const kind=action==='ultimate'?'ultimate':'basic',speed=Math.max(1,Math.min(3,Number(state.speed)||1));
  const info={actor,battleId,speed,start:0,abort:new AbortController()};coNuongActive.add(info);
  const cue='co-nuong-'+(kind==='basic'?'atk':'ultimate');
  const current=()=>state.battleId===battleId&&!info.abort.signal.aborted;
  const wait=async at=>{
    while(current()){
      if(__hvIsSkipping())return true;
      const remaining=at-(performance.now()-info.start)*speed;
      if(remaining<=.001)return true;
      if(!await sleepVisualMilliseconds(Math.min(40,remaining/speed),battleId))return false;
    }
    return false;
  };
  const present=fn=>{const totals=new Map();splusPresentation=totals;try{return fn();}finally{flushSplusPresentation();splusPresentation=null;updateTeamCounters();splusStateView();}};
  const sound=key=>{if(state.sound&&!__hvIsSkipping())void window.HonVietSfx?.play(key,{group:'combat',signal:info.abort.signal,playbackRate:speed,maxDelayMs:120});};
  state.locked=true;state.selectedAction=action;clearTargets();updateActorHud(actor);
  const title=globalThis.SPLUS42.catalog.find(h=>h.id===actor.sourceId)?.actions[action]?.name||action;
  let cast;
  try{
    if(!__hvIsSkipping()){
      let timer;try{await Promise.race([
        Promise.all([kind,'vfx-'+kind,'vfx-parasite'].map(key=>coNuongImage(coNuongClips[key][0]).decode().catch(()=>{}))),
        new Promise(resolve=>{timer=setTimeout(resolve,2000);})
      ]);}finally{clearTimeout(timer);}
      if(!current())return;
      if(state.sound)await Promise.all([cue,...(kind==='basic'?['co-nuong-pierce']:[])].map(key=>window.HonVietSfx?.prepare(key,{signal:info.abort.signal})));
    }
    if(!current())return;
    info.start=performance.now();coNuongMotion.set(actor.id,{kind,start:info.start,duration:kind==='basic'?720:2000,speed});
    setUnitState(actor,kind==='ultimate'?'ultimate':'attack',(kind==='basic'?720:2000)/speed);
    setStatus(`${actor.name} · ${title}`);dom.phaseLabel.textContent=title;
    if(!await wait(kind==='ultimate'?1380:600))return;
    cast=e.act(actor.id,action,target?.id,{deferCoNuong:true});
    if(!cast.ok)return;
    const victims=cast.targetIds.map(id=>getUnit(id)).filter(Boolean),events=[];
    if(kind==='basic'){
      const body=coNuongBody(actor),dir=actor.team===TEAM_ENEMY?-1:1;
      if(!__hvIsSkipping())for(const victim of victims)coNuongImpacts.push({kind:'vfx-basic',battleId,actor,target:victim,origin:{x:body.centerX+dir*body.height*.18,y:body.centerY+body.height*.02},start:info.start+600/speed,duration:1292,speed});
      sound(cue);
      for(let blade=0;blade<3;blade++)for(let pass=0;pass<4;pass++)events.push({at:600+.85*(blade*120+460+pass*200),hit:blade*4+pass});
    }else{
      for(let wave=0;wave<3;wave++)for(let echo=0;echo<2;echo++){
        events.push({at:1380+wave*900+echo*300,release:true,wave,echo});
        if(!echo)events.push({at:1380+wave*900+180,hit:wave});
      }
    }
    events.sort((a,b)=>a.at-b.at);
    for(const event of events){
      if(!await wait(event.at)||!current())return;
      if(event.release){
        if(!__hvIsSkipping())for(const victim of victims.filter(u=>u.hp>0))coNuongImpacts.push({kind:'vfx-ultimate',battleId,target:victim,start:info.start+event.at/speed,duration:900,speed,mirror:actor.team===TEAM_ENEMY});

      }else{
        for(const victim of victims)present(()=>e.resolveCoNuongImpact(actor.id,cast.castId,victim.id,event.hit));
        sound(kind==='basic'?'co-nuong-pierce':cue);
      }
    }
    present(()=>e.finishCoNuongCast(actor.id,cast.castId));
    state.actionCount++;state.actionBreakdown[action]=(state.actionBreakdown[action]||0)+1;
    const rec=intelUnit(actor);if(rec){rec.actions++;if(action==='ultimate')rec.ultimates++;}addLog(`${actor.name} · ${title}`);updateActorHud(actor);
    if(!await wait(kind==='ultimate'?4500:2000)||!current())return;
    setUnitState(actor,'idle',800);state.currentId=null;state.locked=false;
    if(battleHasWinner()){if(!await waitForDefeatExit(battleId))return;if(checkBattleEnd()){splusStateView();return;}}
    void advanceTurn();
  }finally{info.abort.abort();coNuongActive.delete(info);if(coNuongMotion.get(actor.id)?.start===info.start)coNuongMotion.delete(actor.id);}
}
async function performSplusAction(actor, action, target) {
  const e=splusCombat(),battleId=state.battleId;
  if(actor.sourceId==='hero_splus_co_nuong')return performCoNuongAction(actor,action,target,e,battleId);
  const linh=typeof isLinhDong==='function'&&isLinhDong(actor);
  const bach=typeof isBachDien==='function'&&isBachDien(actor);
  if(linh){
    const normalized=typeof normalizeLinhDongAction==='function'?normalizeLinhDongAction(action):null;
    if(normalized==='atk') action='basic';
    else if(normalized==='ultimate') action='ultimate';
  }
  if(bach){
    const normalized=typeof normalizeBachDienAction==='function'?normalizeBachDienAction(action):null;
    if(normalized==='atk') action='basic';
    else if(normalized==='ultimate') action='ultimate';
  }
  state.locked=true;state.selectedAction=action;clearTargets();updateActorHud(actor);
  const title=globalThis.SPLUS42.catalog.find(h=>h.id===actor.sourceId)?.actions[action]?.name||action;
  setStatus(`${actor.name} · ${title}`);dom.phaseLabel.textContent=title;
  const presentationTrace=window.__HV_BATTLE_PHASE1_TRACE;
  const presentationId=`${battleId}:splus:${state.actionCount+1}:${actor.id}:${action}`;
  presentationTrace?.begin({actionId:presentationId,roundId:state.round,actorId:actor.id,targetIds:target?[target.id]:[],skillId:action,position:{x:actor.x,y:actor.y}});
  const linhAction=linh&&typeof beginLinhDongAction==='function'?beginLinhDongAction(actor,action,target,battleId):null;
  const bachAction=!linhAction&&bach&&typeof beginBachDienAction==='function'?beginBachDienAction(actor,action,target,battleId):null;
  let fallbackPresentation=null;
  if(linhAction){
    if(!await waitLinhDongMarker(linhAction,'release',battleId))return;
    emitLinhDongRelease(linhAction);
    presentationTrace?.marker('release',{actionId:presentationId});
    if(!await waitLinhDongMarker(linhAction,'impact',battleId))return;
  } else if(bachAction){
    if(!await waitBachDienMarker(bachAction,'release',battleId))return;
    emitBachDienRelease(bachAction);
    presentationTrace?.marker('release',{actionId:presentationId});
    if(!await waitBachDienMarker(bachAction,'impact',battleId))return;
  } else {
    const origin={x:actor.baseX,y:actor.baseY};
    const profileName=combatPresentationProfileFor(actor,action);
    const profile=COMBAT_PRESENTATION_STANDARD.profiles[profileName];
    const destination=approachPoint(actor,target||actor,action);
    if(profile?.movesToTarget){
      setStatus(`${actor.name} áp sát vị trí ra đòn`);
      dom.phaseLabel.textContent='Di chuyển';
      setUnitState(actor,'run',TIMING.approach);
      if(!await tweenUnit(actor,destination.x,destination.y,TIMING.approach,battleId))return;
    }else{
      actor.x=actor.baseX;actor.y=actor.baseY;
      setStatus(`${actor.name} giữ vị trí phát chiêu`);
    }
    const releaseDuration=weaponFlightDuration(actor);
    setUnitState(actor,'attack',TIMING.windup+releaseDuration);
    dom.phaseLabel.textContent=action==='ultimate'?'Tuyệt kỹ • Xuất chiêu':'Xuất chiêu';
    queueChargeEffect(actor,action);
    queueWeaponAnticipation(actor,action);
    playActionSound(actor,action);
    if(!await sleep(TIMING.windup,battleId))return;
    presentationTrace?.marker('release',{actionId:presentationId});
    if(!await launchWeaponEffect(actor,target||actor,action,battleId))return;
    fallbackPresentation={origin};
  }
  const totals=new Map();let result;splusPresentation=totals;
  presentationTrace?.marker('impact',{actionId:presentationId,targetId:target?.id||null});
  try{result=e.act(actor.id,action,target?.id);}finally{flushSplusPresentation();splusPresentation=null;}
  if(linhAction)linhAction.impactResolved=true;
  if(bachAction)bachAction.impactResolved=true;
  if(!linhAction&&!bachAction)triggerImpactPresentation(actor,target,action);
  if(result.ok){state.actionCount++;state.actionBreakdown[action]=(state.actionBreakdown[action]||0)+1;const rec=intelUnit(actor);if(rec){rec.actions++;if(action==='ultimate')rec.ultimates++;}addLog(`${actor.name} · ${title}`);}
  updateTeamCounters();splusStateView();updateActorHud(actor);
  if(linhAction){
    if(!await waitLinhDongMarker(linhAction,'recovery:end',battleId))return;
    if(typeof finishLinhDongAction==='function')finishLinhDongAction(linhAction);
  } else if(bachAction){
    if(!await waitBachDienMarker(bachAction,'recovery:end',battleId))return;
    if(typeof finishBachDienAction==='function')finishBachDienAction(bachAction);
  } else {
    const origin=fallbackPresentation?.origin||{x:actor.baseX,y:actor.baseY};
    const moved=Math.abs(actor.x-origin.x)>1||Math.abs(actor.y-origin.y)>1;
    if(actor.hp>0&&moved){
      setStatus(`${actor.name} trở lại đội hình`);
      dom.phaseLabel.textContent='Thu thế';
      setUnitState(actor,'run',TIMING.return);
      if(!await tweenUnit(actor,origin.x,origin.y,TIMING.return,battleId))return;
    }else{
      actor.x=origin.x;actor.y=origin.y;
    }
    if(!await sleep(TIMING.turnRest,battleId))return;
  }
  setUnitState(actor,'idle',800);state.currentId=null;state.locked=false;
  presentationTrace?.marker('recovery',{actionId:presentationId,position:{x:actor.x,y:actor.y}});
  presentationTrace?.complete({actionId:presentationId,position:{x:actor.x,y:actor.y}});
  if(battleHasWinner()){if(!await waitForDefeatExit(battleId))return;if(checkBattleEnd()){splusStateView();return;}}
  void advanceTurn();
}
function drawSplusToken(context, unit, time) {
  if(unit.sourceId==='hero_splus_co_nuong'){coNuongRender(context,unit,time);return;}
  if(typeof isLinhDong==='function'&&isLinhDong(unit)&&typeof drawLinhDongHero==='function'){
    const lift=unit.splusAirborneUntil>time?Math.sin((1-(unit.splusAirborneUntil-time)/1000)*Math.PI)*40:0;
    const depthScale=0.83+(unit.y-290)/1500;
    const identityScale=(innerWidth<600?0.52:0.74);
    context.save();context.translate(unit.x,unit.y-lift);context.scale(depthScale*identityScale,depthScale*identityScale);
    if(unit.team===TEAM_ENEMY)context.scale(-1,1);
    drawLinhDongHero(context,unit,time);context.restore();
    if(unit.hp>0)drawUnitHud(context,unit,time,1);
    return;
  }
  if(typeof isBachDien==='function'&&isBachDien(unit)&&typeof drawBachDienHero==='function'){
    const lift=unit.splusAirborneUntil>time?Math.sin((1-(unit.splusAirborneUntil-time)/1000)*Math.PI)*40:0;
    const depthScale=0.83+(unit.y-290)/1500;
    const identityScale=(innerWidth<600?0.52:0.74);
    context.save();context.translate(unit.x,unit.y-lift);context.scale(depthScale*identityScale,depthScale*identityScale);
    if(unit.team===TEAM_ENEMY)context.scale(-1,1);
    drawBachDienHero(context,unit,time);context.restore();
    if(unit.hp>0)drawUnitHud(context,unit,time,1);
    return;
  }
  if(unit.hp<=0)return;
  const lift=unit.splusAirborneUntil>time?Math.sin((1-(unit.splusAirborneUntil-time)/1000)*Math.PI)*40:0;
  context.save();context.translate(unit.x,unit.y-lift);context.fillStyle='#16252d';context.strokeStyle=unit.color;context.lineWidth=3;
  context.beginPath();context.roundRect(-57,-130,114,126,16);context.fill();context.stroke();
  context.textAlign='center';context.fillStyle=unit.color;context.font='bold 32px sans-serif';context.fillText(unit.initial,0,-81);
  context.fillStyle='#fff1d5';context.font='bold 15px sans-serif';context.fillText(unit.name,0,-48);context.font='11px sans-serif';context.fillStyle='#aec4ce';context.fillText('S+ · Đang thử cơ chế',0,-24);context.restore();
  drawUnitHud(context,unit,time,1);
}




