// Injected into the existing battle closure by the source build owner.
// This bridge uses advanceTurn/sleep/render; it does not own a second clock.
let splusEngine = null;
let splusPresentation = null;
let splusSkillUI=null;
let splusRuntimeDisabled=false;
function splusReset(){
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
  if(splusPresentation){const id=target.id+':'+healing,previous=splusPresentation.get(id);splusPresentation.set(id,{target,amount:amount+(previous?.amount||0),healing,critical:critical||previous?.critical});return;}
  addFloater(target,`${healing?'+':'−'}${amount}`,healing?'#8fe7bd':critical?'#ffd76f':'#ff9688',critical);
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
  const h=normalizeConfiguredHero(raw,index),kit=globalThis.SPLUS42.catalog.find(c=>c.id===h.sourceId);
  if(!kit)return h;
  return {...h,name:kit.name,title:kit.elementName,initial:String(kit.number),archetype:kit.role,roleClass:kit.role,kitVersion:'splus42-v2',skillKit:null,passive:kit.passive.description,passiveIds:[kit.passive.id],basicId:kit.actions.basic.id,basicName:kit.actions.basic.name,basicDetail:kit.actions.basic.description,basicKind:'damage',skillName:kit.actions.skill.name,skillDetail:kit.actions.skill.description,skillKind:['healer','support'].includes(kit.role)?'heal':'damage',ultimateId:kit.actions.ultimate.id,ultimateName:kit.actions.ultimate.name,ultimateDetail:kit.actions.ultimate.description,ultimateKind:'aoe',visualId:kit.id,visualSource:kit.key==='linh_dong'?'linh-dong-authored':kit.key==='bach_dien'?'bach-dien-authored':'splus-pending-art'};
}
function splusEvent(event) {
  const t=getUnit(event.targetId),a=getUnit(event.sourceId);
  if(t&&event.type==='damage'){splusFloater(t,event.amount,false,event.critical);t.hpTween=null;const rec=intelUnit(t);if(rec)rec.damageTaken+=event.amount;const ar=intelUnit(a);if(ar)ar.damage+=event.amount;if(typeof isLinhDong==='function'&&isLinhDong(t)&&t.hp>0&&typeof linhDongActionMs==='function'){const hurtMs=linhDongActionMs('hurt');setUnitState(t,'hurt',hurtMs);setTimeout(()=>{ if(t.hp>0&&t.state==='hurt') setUnitState(t,'idle',800); }, hurtMs);}else if(typeof isBachDien==='function'&&isBachDien(t)&&t.hp>0&&typeof bachDienActionMs==='function'){const hurtMs=bachDienActionMs('hurt');setUnitState(t,'hurt',hurtMs);setTimeout(()=>{ if(t.hp>0&&t.state==='hurt') setUnitState(t,'idle',800); }, hurtMs);}}
  if(t&&event.type==='heal'){splusFloater(t,event.amount,true);t.hpTween=null;const ar=intelUnit(a);if(ar)ar.healing+=event.amount;}
  if(t&&event.type==='death')markDefeated(t);
  if(t&&event.type==='resurrect'){t.defeatedAt=0;t.displayHp=t.hp;setUnitState(t,'idle',800);}
  if(event.type==='extraTurn')state.queue.unshift(event.sourceId);
  if(event.type==='actionDelay'){
    const at=state.queue.indexOf(event.targetId);
    if(at>=0){state.queue.splice(at,1);state.queue.splice(Math.min(state.queue.length,at+Math.ceil(state.queue.length*event.fraction)),0,event.targetId);}
  }
  if(t&&event.type==='airborne')t.splusAirborneUntil=performance.now()+event.seconds*1000;
  if(event.type==='displacement'||event.type==='swap'){
    const compact=innerWidth<600||(innerHeight>innerWidth&&innerWidth<=1180);
    const positions=compact&&typeof mobileFormationForViewport==='function'?mobileFormationForViewport():POSITIONS;
    for(const u of units){const p=positions[u.team][u.slot];u.baseX=p.x;u.baseY=p.y;u.x=p.x;u.y=p.y;u.homeAnchorId=`${u.team}:slot-${u.slot}`;u.homeAnchor={x:p.x,y:p.y};}
  }
}
function splusStateView() {
  try{
    const e=splusCombat();if(!e)return false;
    splusSkillBar();
    let panel=document.getElementById('splus-status-panel');
    if(!panel){panel=document.createElement('section');panel.id='splus-status-panel';panel.setAttribute('aria-label','Trạng thái 42 tướng S+');document.body.append(panel);}
    document.body.classList.add('splus-battle');
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
    if(new URLSearchParams(location.search).has('qaSplus42')){
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
async function performSplusAction(actor, action, target) {
  const e=splusCombat(),battleId=state.battleId;
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
  const linhAction=linh&&typeof beginLinhDongAction==='function'?beginLinhDongAction(actor,action,target,battleId):null;
  const bachAction=!linhAction&&bach&&typeof beginBachDienAction==='function'?beginBachDienAction(actor,action,target,battleId):null;
  if(linhAction){
    if(!await waitLinhDongMarker(linhAction,'release',battleId))return;
    emitLinhDongRelease(linhAction);
    if(!await waitLinhDongMarker(linhAction,'impact',battleId))return;
  } else if(bachAction){
    if(!await waitBachDienMarker(bachAction,'release',battleId))return;
    emitBachDienRelease(bachAction);
    if(!await waitBachDienMarker(bachAction,'impact',battleId))return;
  } else {
    setUnitState(actor,'attack',TIMING.windup);
    if(!await sleep(TIMING.windup,battleId))return;
  }
  const totals=new Map();let result;splusPresentation=totals;
  try{result=e.act(actor.id,action,target?.id);}finally{splusPresentation=null;}
  if(linhAction)linhAction.impactResolved=true;
  if(bachAction)bachAction.impactResolved=true;
  for(const hit of totals.values())splusFloater(hit.target,hit.amount,hit.healing,hit.critical);
  if(result.ok){state.actionCount++;state.actionBreakdown[action]=(state.actionBreakdown[action]||0)+1;const rec=intelUnit(actor);if(rec){rec.actions++;if(action==='ultimate')rec.ultimates++;}addLog(`${actor.name} · ${title}`);}
  updateTeamCounters();splusStateView();updateActorHud(actor);
  if(linhAction){
    if(!await waitLinhDongMarker(linhAction,'recovery:end',battleId))return;
    if(typeof finishLinhDongAction==='function')finishLinhDongAction(linhAction);
  } else if(bachAction){
    if(!await waitBachDienMarker(bachAction,'recovery:end',battleId))return;
    if(typeof finishBachDienAction==='function')finishBachDienAction(bachAction);
  } else if(!await sleep(TIMING.turnRest,battleId))return;
  setUnitState(actor,'idle',800);state.currentId=null;state.locked=false;
  if(battleHasWinner()){if(!await waitForDefeatExit(battleId))return;if(checkBattleEnd()){splusStateView();return;}}
  void advanceTurn();
}
function drawSplusToken(context, unit, time) {
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
