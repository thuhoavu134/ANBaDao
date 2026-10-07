import {startBrowser} from './qa-battle-readiness-browser.mjs';
const browser=await startBrowser(),report={revision:process.env.GITHUB_SHA,runs:[]};
try{for(const [width,height]of [[390,844],[1280,800]]){
 const p=await browser.page(width,height,1),run={width,height,cycles:[]};report.runs.push(run);
 try{
 await p.send('Page.navigate',{url:browser.origin+'/'});
 await p.wait('!!document.getElementById("hvLoginContinue")');await p.click('#hvLoginContinue');await p.wait('document.getElementById("hvLoginRoot").hidden');
 for(let cycle=0;cycle<2;cycle++){
 await p.click('#hubScreen [data-art-go="campaign"]');await p.wait('!document.getElementById("hvCampaignScene").hidden');
 await p.click('#hvCampaignScene [data-hv-afk-challenge]');await p.wait('!document.querySelector(".cs-prepare").hidden');await p.click('[data-scene-action="launch"]');
 const f='document.getElementById("hvBattleFrame").contentWindow';
 await p.wait(f+'.__HON_VIET__?.getState().mode==="battle"',45000);
 await p.wait(f+'.__HON_VIET__.getState().actionCount>=1',60000);
 const before=await p.evaluate(f+'.__HON_VIET__.getState()');
 if(before.instantSkip!=null)throw Error('Skip persisted into new battle');
 const rect=await p.evaluate('(()=>{const f=document.getElementById("hvBattleFrame"),r=f.getBoundingClientRect(),b=f.contentDocument.querySelector("#embeddedSkipButton").getBoundingClientRect();return {x:r.x+b.x+b.width/2,y:r.y+b.y+b.height/2,w:b.width,h:b.height}})()');
 if(!rect.w||!rect.h)throw Error('Skip not visible');
 const began=Date.now();
 await p.send('Input.dispatchMouseEvent',{type:'mousePressed',x:rect.x,y:rect.y,button:'left',clickCount:1});
 await p.send('Input.dispatchMouseEvent',{type:'mouseReleased',x:rect.x,y:rect.y,button:'left',clickCount:1});
 await p.wait(f+'.__HON_VIET__.getState().mode==="result"',8000);
 await p.wait(f+'.document.querySelector("#integratedResultV6.show")',8000);
 const elapsedMs=Date.now()-began,result=await p.evaluate(f+'.__HON_VIET__.getState()');
 if(elapsedMs>5000||!['player','enemy'].includes(result.result)||result.sound!==before.sound||result.instantSkip!=null)throw Error('Result/reset contract failed: '+elapsedMs);
 run.cycles.push({cycle,elapsedMs,winner:result.result,actions:result.actionCount,round:result.round});
 const image=await p.send('Page.captureScreenshot',{format:'jpeg',quality:65});console.log('SKIP_IMAGE:'+width+':'+cycle+':'+image.data);
 await p.evaluate(f+'.document.querySelector("#integratedResultV6 [data-result-action=confirm],#integratedResultV6 [data-result-action=back]").click()');
 await p.wait('!document.getElementById("hvBattleOverlay").classList.contains("is-open")',15000);
 }
 run.exceptions=p.events.filter(e=>e.method==='Runtime.exceptionThrown').map(e=>e.params.exceptionDetails.exception?.description||e.params.exceptionDetails.text);
 run.assetErrors=p.events.filter(e=>e.method==='Network.responseReceived'&&e.params.response.status>=400&&new URL(e.params.response.url).pathname.startsWith('/assets/')).map(e=>e.params.response.url);
 run.ok=!run.exceptions.length&&!run.assetErrors.length;
 }catch(e){run.ok=false;run.error=String(e.stack||e);run.exceptions=p.events.filter(e=>e.method==='Runtime.exceptionThrown');}finally{await p.close();}
}}finally{await browser.close();}
report.ok=report.runs.every(r=>r.ok);console.log('SKIP_HOST_REPORT:'+JSON.stringify(report));if(!report.ok)process.exitCode=1;
