import {startBrowser} from './qa-battle-readiness-browser.mjs';
const b=await startBrowser(),report={revision:process.env.GITHUB_SHA,runs:[]};
try{for(const partial of [false,true]){
 const p=await b.page(390,844,1),r={partial,events:[]};report.runs.push(r);
 try{
 await p.send('Page.navigate',{url:b.origin+'/'});
 await p.wait('!!document.getElementById("hvLoginContinue")');await p.click('#hvLoginContinue');await p.wait('document.getElementById("hvLoginRoot").hidden');
 await p.click('#hubScreen [data-art-go="campaign"]');await p.wait('!document.getElementById("hvCampaignScene").hidden');
 await p.click('#hvCampaignScene [data-hv-afk-challenge]');await p.wait('!document.querySelector(".cs-prepare").hidden');
 if(partial)for(const slot of [2,4,5]){const sel='[data-scene-slot="'+slot+'"]:not(.is-empty)';if(await p.evaluate('!!document.querySelector('+JSON.stringify(sel)+')'))await p.click(sel);}
 r.preparation=await p.evaluate('({squad:P.squad,slots:[...document.querySelectorAll("[data-scene-slot]")].map(e=>({slot:e.dataset.sceneSlot,label:e.getAttribute("aria-label"),empty:e.classList.contains("is-empty"),background:getComputedStyle(e).backgroundColor}))})');
 const shot=await p.send('Page.captureScreenshot',{format:'jpeg',quality:65});console.log('PREP_IMAGE:'+partial+':'+shot.data);
 await p.click('[data-scene-action="launch"]');
 const f='document.getElementById("hvBattleFrame").contentWindow';
 await p.wait(f+'.__HON_VIET__?.getState().mode==="battle"',45000);
 const began=Date.now();let prev='';
 while(Date.now()-began<90000){
 const snap=await p.evaluate('(()=>{const w='+f+',s=w.__HON_VIET__.getState();return {mode:s.mode,round:s.round,count:s.actionCount,current:s.currentId,action:s.selectedAction,queue:s.queue,phase:w.document.querySelector("#phaseLabel")?.textContent,log:w.document.querySelector("#battleLog")?.textContent,units:w.__HON_VIET__.getUnits().map(u=>({id:u.id,name:u.name,source:u.sourceId,team:u.team,slot:u.slot,accuracy:u.accuracy,evasion:u.evasion,atk:u.atk,def:u.def,hp:u.hp,displayHp:u.displayHp,maxHp:u.maxHp,shield:u.shield,energy:u.energy,kit:u.kitVersion,action:u.state,statuses:u.statuses?.map(s=>({type:s.type,shieldRemaining:s.shieldRemaining}))}))}})()');
 const key=JSON.stringify({...snap,units:snap.units.map(u=>({...u,displayHp:undefined,action:undefined}))});
 if(key!==prev){r.events.push({ms:Date.now()-began,...snap});prev=key;}
 if(snap.round>=2||snap.mode==='result')break;
 await new Promise(r=>setTimeout(r,50));
 }
 r.exceptions=p.events.filter(e=>e.method==='Runtime.exceptionThrown').map(e=>e.params.exceptionDetails.exception?.description||e.params.exceptionDetails.text);
 }catch(e){r.error=String(e.stack||e);}finally{await p.close();}
}}finally{console.log('OWNER_COMBAT_TRACE:'+JSON.stringify(report));await b.close();}
