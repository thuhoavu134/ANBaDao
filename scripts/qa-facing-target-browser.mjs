import assert from 'node:assert/strict';
import {startBrowser} from './qa-battle-readiness-browser.mjs';
const b=await startBrowser(),report={revision:process.env.GITHUB_SHA,runs:[]};
try{for(const [width,partial] of [[390,false],[390,true],[1280,false]]){
 const p=await b.page(width,844,1),r={width,partial,events:[]};report.runs.push(r);
 try{
 await p.send('Page.addScriptToEvaluateOnNewDocument',{source:'if(location.pathname.endsWith("/battle.html")){const u=new URL(location.href);u.searchParams.set("qaPhase01","1");history.replaceState(null,"",u);}'});
 r.targetChecks=[];const checked=new Map();
 await p.send('Page.navigate',{url:b.origin+'/'});
 await p.wait('!!document.getElementById("hvLoginContinue")');await p.click('#hvLoginContinue');await p.wait('document.getElementById("hvLoginRoot").hidden');
 await p.click('#hubScreen [data-art-go="campaign"]');await p.wait('!document.getElementById("hvCampaignScene").hidden');
 await p.click('#hvCampaignScene [data-hv-afk-challenge]');await p.wait('!document.querySelector(".cs-prepare").hidden');
 if(partial)for(const slot of [2,4,5]){const sel='[data-scene-slot="'+slot+'"]:not(.is-empty)';if(await p.evaluate('!!document.querySelector('+JSON.stringify(sel)+')'))await p.click(sel);}
 if(partial){
  await p.click('[data-scene-slot="2"]');
  await p.click('[data-scene-hero="co_dao_ganh_hoi"]');
  assert.equal(await p.evaluate('document.querySelector("[data-scene-slot=\\"2\\"]").classList.contains("is-empty")'),false,'empty slot remains usable');
  await p.click('[data-scene-slot="2"]');
 }
 r.preparation=await p.evaluate('({squad:P.squad,slots:[...document.querySelectorAll("[data-scene-slot]")].map(e=>({slot:e.dataset.sceneSlot,label:e.getAttribute("aria-label"),empty:e.classList.contains("is-empty"),background:getComputedStyle(e).backgroundColor}))})');
 assert.ok(r.preparation.slots.filter(s=>s.empty).every(s=>s.background==='rgba(0, 0, 0, 0)'),'empty slots must not paint gray rectangles');
 const shot=await p.send('Page.captureScreenshot',{format:'jpeg',quality:65});console.log('PREP_IMAGE:'+partial+':'+shot.data);
 await p.click('[data-scene-action="launch"]');
 const f='document.getElementById("hvBattleFrame").contentWindow';
 await p.wait(f+'.__HON_VIET__?.getState().mode==="battle"',45000);
 const began=Date.now();let prev='';
 while(Date.now()-began<90000){
 const snap=await p.evaluate('(()=>{const w='+f+',s=w.__HON_VIET__.getState();return {trace:w.__HV_BATTLE_PHASE1_TRACE?.events()||[],mode:s.mode,round:s.round,count:s.actionCount,current:s.currentId,action:s.selectedAction,queue:s.queue,phase:w.document.querySelector("#phaseLabel")?.textContent,log:w.document.querySelector("#battleLog")?.textContent,units:w.__HON_VIET__.getUnits().map(u=>({id:u.id,name:u.name,source:u.sourceId,team:u.team,slot:u.slot,accuracy:u.accuracy,evasion:u.evasion,atk:u.atk,def:u.def,hp:u.hp,displayHp:u.displayHp,maxHp:u.maxHp,shield:u.shield,energy:u.energy,kit:u.kitVersion,basicKind:w.honVietSkillKitFor?.(u.sourceId)?.actions?.basic?.kind,skillKind:u.skillKind,ultimateKind:u.ultimateKind,action:u.state,statuses:u.statuses?.map(s=>({type:s.type,shieldRemaining:s.shieldRemaining}))}))}})()');
 for(const event of snap.trace.filter(e=>e.type==='action:start')){
  if(checked.has(event.actionId))continue;
  const actor=snap.units.find(u=>u.id===event.actorId);
  const action=event.skillId,kind=action==='basic'?(actor?.basicKind||'damage'):action==='skill'?actor?.skillKind:actor?.ultimateKind;
  if(!actor||actor.kit==='splus42-v2'&&action!=='basic'||['aoe','aoeBurn','aoeDebuff','heal','healAll','guard','shield','guardAll','taunt','cleanseGuard','buff','buffAll','hasteAll','regen'].includes(kind))continue;
  const enemies=snap.units.filter(u=>u.team!==actor.team&&u.hp>0),front=enemies.filter(u=>u.slot<3);
  const row=(front.length?front:enemies).sort((a,b)=>a.slot-b.slot);
  const expected=row.find(u=>u.slot%3===actor.slot%3)||row[0];
  const check={id:event.actionId,actor:actor.id,slot:actor.slot,action,expected:expected?.id,actual:event.targetIds[0]};
  assert.equal(check.actual,check.expected,'action must face its lane: '+JSON.stringify(check));
  checked.set(event.actionId,check);r.targetChecks.push(check);
 }
 for(const event of snap.trace.filter(e=>e.type==='marker:impact')){
  const check=checked.get(event.actionId);if(check&&event.targetId){assert.equal(event.targetId,check.actual,'impact must use presentation target');check.impact=event.targetId;}
 }
 const key=JSON.stringify({...snap,units:snap.units.map(u=>({...u,displayHp:undefined,action:undefined}))});
 if(key!==prev){r.events.push({ms:Date.now()-began,...snap});prev=key;}
 if(!r.battleShot&&snap.phase==='Va chạm'&&snap.action==='skill'&&r.targetChecks.some(c=>c.actor===snap.current&&c.action===snap.action)){const shot=await p.send('Page.captureScreenshot',{format:'jpeg',quality:70});console.log('TARGET_IMAGE:'+partial+':'+shot.data);r.battleShot=true;}
 if(snap.round>=3||snap.mode==='result')break;
 await new Promise(r=>setTimeout(r,50));
 }
 const first=r.events.find(e=>e.round===1&&e.current);
 assert.ok(first,'first round started');
 const initial=r.events[0].units;
 const rage=team=>initial.filter(u=>u.team===team).reduce((n,u)=>n+u.energy,0);
 const sides=rage('enemy')>rage('player')?['enemy','player']:['player','enemy'];
 const expected=Array.from({length:6},(_,slot)=>sides.flatMap(team=>initial.filter(u=>u.team===team&&u.slot===slot).map(u=>u.id))).flat();
 const order=[];for(const e of r.events.filter(e=>e.round===1))if(e.current&&!order.includes(e.current))order.push(e.current);
 assert.deepEqual([first.current,...first.queue],expected,'initial queue follows slots and existing rage initiative');
 assert.deepEqual(order,expected,'real actions consume queue in order');
 assert.ok(r.events.some(e=>e.round===2||e.mode==='result'),'opening round completes');
 r.order={expected,actual:order};
 assert.ok(r.targetChecks.some(c=>c.action==='basic'&&c.impact),'basic impact checked');
 // A partial support roster need not cast offensive non-basic skills in two rounds.
 // Coverage is required across the suite below; every observed target stays checked.
 r.exceptions=p.events.filter(e=>e.method==='Runtime.exceptionThrown').map(e=>e.params.exceptionDetails.exception?.description||e.params.exceptionDetails.text);
 }catch(e){r.error=String(e.stack||e);}finally{await p.close();}
}}finally{console.log('FACING_TARGET_REPORT:'+JSON.stringify(report));await b.close();}
assert.ok(report.runs.some(r=>r.targetChecks.some(c=>c.action!=='basic'&&c.impact)),'suite must check actual offensive skill/ultimate impact');
if(report.runs.some(r=>r.error||r.exceptions?.length))process.exitCode=1;
