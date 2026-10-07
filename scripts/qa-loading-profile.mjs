import {startBrowser} from './qa-battle-readiness-browser.mjs';
const b=await startBrowser();const report={revision:process.env.GITHUB_SHA,runs:[]};
try{for(const width of [390,1280]){
 const p=await b.page(width,844,1),r={width,stages:[]};report.runs.push(r);
 const metric=async(label)=>{const m=await p.evaluate(`({label:${JSON.stringify(label)},time:performance.now(),long:window.__loadLong||[],resources:performance.getEntriesByType('resource').map(x=>({url:new URL(x.name).pathname,bytes:x.encodedBodySize,duration:x.duration,type:x.initiatorType})).sort((a,b)=>b.bytes-a.bytes).slice(0,20)})`);r.stages.push(m);};
 try{
 await p.send('Page.addScriptToEvaluateOnNewDocument',{source:"window.__loadLong=[];new PerformanceObserver(l=>__loadLong.push(...l.getEntries().map(x=>({at:x.startTime,ms:x.duration})))).observe({type:'longtask',buffered:true});"});
 await p.send('Network.setCacheDisabled',{cacheDisabled:true});
 await p.send('Page.navigate',{url:b.origin+'/'});
 await p.wait('!!document.getElementById("hvLoginContinue")',60000);await metric('login');
 await p.click('#hvLoginContinue');await p.wait('document.getElementById("hvLoginRoot").hidden',60000);await metric('hub');console.log('LOAD_HUB_IMAGE:'+width+':'+(await p.send('Page.captureScreenshot',{format:'jpeg',quality:65})).data);
 await p.click('#hubScreen [data-art-go="campaign"]');
 await p.wait('!!document.querySelector("[data-hv-afk-challenge]")',60000);
 await p.click('[data-hv-afk-challenge]');await p.wait('!document.querySelector(".cs-prepare").hidden');await metric('prepare');
 const began=Date.now();await p.click('[data-scene-action="launch"]');
 const f='document.getElementById("hvBattleFrame").contentWindow';
 await p.wait(f+'.__HON_VIET__?.getState().actionCount>=2',90000);r.firstTwoActionsMs=Date.now()-began;
 r.battle=await p.evaluate('(()=>{const w='+f+';return {time:w.performance.now(),long:w.__loadLong,assets:w.__HV_BATTLE_ASSET_QA?.events(),resources:w.performance.getEntriesByType("resource").map(x=>({url:new URL(x.name).pathname,bytes:x.encodedBodySize,duration:x.duration,type:x.initiatorType})).sort((a,b)=>b.bytes-a.bytes).slice(0,25)}})()');
 console.log('LOAD_BATTLE_IMAGE:'+width+':'+(await p.send('Page.captureScreenshot',{format:'jpeg',quality:65})).data);
 r.assetErrors=p.events.filter(e=>e.method==='Network.responseReceived'&&e.params.response.status>=400&&new URL(e.params.response.url).pathname.startsWith('/assets/')).map(e=>e.params.response.url);
 if(r.assetErrors.length)throw new Error('Missing assets '+r.assetErrors.join(','));
 r.errors=p.events.filter(e=>e.method==='Runtime.exceptionThrown').map(e=>e.params.exceptionDetails.text);
 }catch(e){r.error=String(e.stack||e)}finally{await p.close()}
}}finally{await b.close();console.log('LOADING_PROFILE:'+JSON.stringify(report));}
if(report.runs.some(r=>r.error||r.errors?.length))process.exitCode=1;
