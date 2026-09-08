// Injected into the existing battle closure by the source build owner.
// This bridge uses advanceTurn/sleep/render; it does not own a second clock.
let splusEngine = null;
let splusPresentation = null;
let splusSkillUI=null;
function splusReset(){
  splusSkillUI?.destroy();splusSkillUI=null;splusEngine=null;splusPresentation=null;
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
function splusSkillBar(){
  if(!splusSkillUI)splusSkillUI=globalThis.createSplusSkillUI(globalThis.SPLUS42.profiles);
  const actor=getUnit(state.currentId);let strip=document.getElementById('splus-battle-skills');
  if(!strip){strip=document.createElement('div');strip.id='splus-battle-skills';strip.className='splus-skill-strip';document.querySelector('.action-zone').prepend(strip);}
  if(actor&&strip.dataset.actorId!==actor.id){strip.dataset.actorId=actor.id;strip.replaceChildren(...['passive','skill','ultimate'].map(slot=>splusSkillUI.button(actor.sourceId,slot,splusSkillOptions(actor))));}
  splusSkillUI.refresh();
}
function splusFloater(target,amount,healing=false,critical=false) {
  if(!(amount>0))return;
  if(splusPresentation){const id=target.id+':'+healing,previous=splusPresentation.get(id);splusPresentation.set(id,{target,amount:amount+(previous?.amount||0),healing,critical:critical||previous?.critical});return;}
  addFloater(target,`${healing?'+':'−'}${amount}`,healing?'#8fe7bd':critical?'#ffd76f':'#ff9688',critical);
}
function splusActive() { return HEROES.some(h => globalThis.SPLUS42.catalog.some(c => c.id === h.sourceId)); }
function splusCombat() {
  if (!splusActive() || !units.length) return null;
  if (!splusEngine) {
    splusEngine = globalThis.SPLUS42.create({units, mutate:true, rng:site => __hvRuleRandom3qAdapter(site), onEvent:splusEvent});
    splusEngine.start();
  }
  return splusEngine;
}
function splusHeroConfig(raw, index) {
  const h=normalizeConfiguredHero(raw,index),kit=globalThis.SPLUS42.catalog.find(c=>c.id===h.sourceId);
  if(!kit)return h;
  return {...h,name:kit.name,title:kit.elementName,initial:String(kit.number),archetype:kit.role,roleClass:kit.role,kitVersion:'splus42-v2',skillKit:null,passive:kit.passive.description,passiveIds:[kit.passive.id],basicId:kit.actions.basic.id,basicName:kit.actions.basic.name,basicDetail:kit.actions.basic.description,basicKind:'damage',skillName:kit.actions.skill.name,skillDetail:kit.actions.skill.description,skillKind:['healer','support'].includes(kit.role)?'heal':'damage',ultimateId:kit.actions.ultimate.id,ultimateName:kit.actions.ultimate.name,ultimateDetail:kit.actions.ultimate.description,ultimateKind:'aoe',visualId:kit.id,visualSource:'splus-pending-art'};
}
function splusEvent(event) {
  const t=getUnit(event.targetId),a=getUnit(event.sourceId);
  if(t&&event.type==='damage'){splusFloater(t,event.amount,false,event.critical);t.hpTween=null;const rec=intelUnit(t);if(rec)rec.damageTaken+=event.amount;const ar=intelUnit(a);if(ar)ar.damage+=event.amount;}
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
    for(const u of units){const p=(innerWidth<600?MOBILE_POSITIONS:POSITIONS)[u.team][u.slot];u.baseX=p.x;u.baseY=p.y;u.x=p.x;u.y=p.y;u.homeAnchorId=`${u.team}:slot-${u.slot}`;u.homeAnchor={x:p.x,y:p.y};}
  }
}
function splusStateView() {
  const e=splusCombat();if(!e)return;
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
    for(const s of e.hud(u)){
      const li=document.createElement('li');li.dataset.iconId=s.iconId||'';li.dataset.effect=s.type;li.dataset.sourceId=s.sourceId||'';li.dataset.polarity=s.polarity;
      const source=getUnit(s.sourceId);li.textContent=`${s.name} · ${globalThis.SPLUS42.labels[s.type]||s.type}${s.stacks>1?` ×${s.stacks}`:''}${s.charges!=null?` · ${s.charges} lần`:''} · ${s.remainingRounds==null?'Duy trì':`${s.remainingRounds} hiệp`} · ${source?.name||'Nguồn không còn'}`;list.append(li);
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
}
async function performSplusAction(actor, action, target) {
  const e=splusCombat(),battleId=state.battleId;
  state.locked=true;state.selectedAction=action;clearTargets();updateActorHud(actor);
  const title=globalThis.SPLUS42.catalog.find(h=>h.id===actor.sourceId)?.actions[action]?.name||action;
  setStatus(`${actor.name} · ${title}`);dom.phaseLabel.textContent=title;setUnitState(actor,'attack',TIMING.windup);
  if(!await sleep(TIMING.windup,battleId))return;
  const totals=new Map();let result;splusPresentation=totals;
  try{result=e.act(actor.id,action,target?.id);}finally{splusPresentation=null;}
  for(const hit of totals.values())splusFloater(hit.target,hit.amount,hit.healing,hit.critical);
  if(result.ok){state.actionCount++;state.actionBreakdown[action]=(state.actionBreakdown[action]||0)+1;const rec=intelUnit(actor);if(rec){rec.actions++;if(action==='ultimate')rec.ultimates++;}addLog(`${actor.name} · ${title}`);}
  updateTeamCounters();splusStateView();updateActorHud(actor);
  if(!await sleep(TIMING.turnRest,battleId))return;
  setUnitState(actor,'idle',800);state.currentId=null;state.locked=false;
  if(battleHasWinner()){if(!await waitForDefeatExit(battleId))return;if(checkBattleEnd()){splusStateView();return;}}
  void advanceTurn();
}
function drawSplusToken(context, unit, time) {
  if(unit.hp<=0)return;
  const lift=unit.splusAirborneUntil>time?Math.sin((1-(unit.splusAirborneUntil-time)/1000)*Math.PI)*40:0;
  context.save();context.translate(unit.x,unit.y-lift);context.fillStyle='#16252d';context.strokeStyle=unit.color;context.lineWidth=3;
  context.beginPath();context.roundRect(-57,-130,114,126,16);context.fill();context.stroke();
  context.textAlign='center';context.fillStyle=unit.color;context.font='bold 32px sans-serif';context.fillText(unit.initial,0,-81);
  context.fillStyle='#fff1d5';context.font='bold 15px sans-serif';context.fillText(unit.name,0,-48);context.font='11px sans-serif';context.fillStyle='#aec4ce';context.fillText('S+ · Đang thử cơ chế',0,-24);context.restore();
  drawUnitHud(context,unit,time,1);
}

