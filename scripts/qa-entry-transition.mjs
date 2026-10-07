import assert from 'node:assert/strict';
import {startBrowser} from './qa-battle-readiness-browser.mjs';
const b=await startBrowser(),report={revision:process.env.GITHUB_SHA,runs:[]};
const probe=`(()=>{const visible=e=>!!e&&!e.hidden&&getComputedStyle(e).display!=='none'&&getComputedStyle(e).visibility!=='hidden'&&e.getBoundingClientRect().height>0;const f=document.getElementById('hvBattleFrame'),w=f?.contentWindow?.__HON_VIET__?f.contentWindow:window;const intro=w.document.getElementById('introPanel'),loader=document.getElementById('hvBattleLoading'),rect=loader?.getBoundingClientRect();return {path:location.pathname,mode:w.__HON_VIET__?.getState().mode,actions:w.__HON_VIET__?.getState().actionCount||0,intro:!!intro&&!intro.hidden&&w.getComputedStyle(intro).display!=='none'&&w.getComputedStyle(intro).visibility!=='hidden'&&intro.getBoundingClientRect().height>0,fullscreenLoader:visible(loader)&&rect.height>innerHeight*.7,loaderText:visible(loader)?loader.textContent:'',frames:w.__entryFrames||[]};})()`;
try{for(const [name,width,height,ipad] of [['desktop',1280,800,false],['ipad',1024,1366,true]]){
 const p=await b.page(width,height,1),r={name,samples:[],errors:[]};report.runs.push(r);
 try{
 if(ipad){await p.send('Emulation.setUserAgentOverride',{userAgent:'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 Version/18.5 Safari/605.1.15',platform:'MacIntel'});await p.send('Page.addScriptToEvaluateOnNewDocument',{source:"Object.defineProperty(navigator,'maxTouchPoints',{get:()=>5});"});}
 await p.send('Emulation.setCPUThrottlingRate',{rate:4});
 await p.send('Page.addScriptToEvaluateOnNewDocument',{source:"window.__entryFrames=[];let until=performance.now()+20000;function sample(){const e=document.getElementById('introPanel');if(e){let s=getComputedStyle(e);if(!e.hidden&&s.display!=='none'&&s.visibility!=='hidden'&&e.getBoundingClientRect().height>0)__entryFrames.push({at:performance.now(),intro:true});}if(performance.now()<until)requestAnimationFrame(sample)}requestAnimationFrame(sample);"});
 await p.send('Page.navigate',{url:b.origin+'/'});
 await p.wait('!!document.getElementById("hvLoginContinue")',60000);await p.click('#hvLoginContinue');await p.wait('document.getElementById("hvLoginRoot").hidden');
 await p.click('#hubScreen [data-art-go="campaign"]');await p.wait('!!document.querySelector("[data-hv-afk-challenge]")');
 await p.click('[data-hv-afk-challenge]');await p.wait('!document.querySelector(".cs-prepare").hidden');
 await p.click('[data-scene-action="launch"]');
 const shots=new Set(),start=Date.now();
 while(Date.now()-start<90000){
  try{const s=await p.evaluate(probe);r.samples.push({ms:Date.now()-start,...s});
   const key=s.fullscreenLoader?'fullscreen-loader':s.intro?'legacy-intro':s.mode==='battle'?'battle':'transition';
   if(!shots.has(key)){shots.add(key);console.log('ENTRY_IMAGE:'+name+':'+key+':'+(await p.send('Page.captureScreenshot',{format:'jpeg',quality:65})).data);}
   if(s.actions>=2)break;
  }catch{}
  await new Promise(r=>setTimeout(r,60));
 }
 r.progressed=r.samples.some(s=>s.actions>=2);
 r.introSeen=r.samples.some(s=>s.intro||s.frames.some(f=>f.intro));
 r.fullscreenLoaderSeen=r.samples.some(s=>s.fullscreenLoader);
 r.exceptions=p.events.filter(e=>e.method==='Runtime.exceptionThrown').map(e=>e.params.exceptionDetails.text);
 assert.ok(r.progressed,'autostart must progress');
 assert.equal(r.introSeen,false,'legacy intro must never paint in automatic battle entry');
 assert.equal(r.fullscreenLoaderSeen,false,'no fullscreen loading interstitial');
 assert.equal(r.exceptions.length,0,'no runtime errors');
 }catch(e){r.error=String(e.stack||e)}finally{await p.close()}
}}finally{await b.close();console.log('ENTRY_TRANSITION_REPORT:'+JSON.stringify(report));}
if(report.runs.some(r=>r.error))process.exitCode=1;
