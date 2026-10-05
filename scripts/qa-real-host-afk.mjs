import {mkdirSync,writeFileSync} from 'node:fs';
import {startBrowser} from './qa-battle-readiness-browser.mjs';
const browser=await startBrowser(),out='evidence/real-host-afk';mkdirSync(out,{recursive:true});
const report={revision:process.env.GITHUB_SHA,scope:'Normal guest profile, real login/hub/campaign; live clock and actual canvas, no fixture squad or unlock',runs:[]};
const pause=ms=>new Promise(r=>setTimeout(r,ms));
try{for(const [width,height] of [[390,844],[430,932]]){
 const page=await browser.page(width,height,1),run={width,height};report.runs.push(run);
 try{
  await page.send('Page.addScriptToEvaluateOnNewDocument',{source:`window.__afkDraws=[];const nativeDraw=CanvasRenderingContext2D.prototype.drawImage;CanvasRenderingContext2D.prototype.drawImage=function(image,...args){const src=image?.src||'';if(/campaign-(?:atk|vfx)-v1/.test(src)){window.__afkDraws.push({src,x:args[4],y:args[5],time:performance.now()});if(window.__afkDraws.length>3000)window.__afkDraws.shift();}return nativeDraw.call(this,image,...args);};`});
  await page.send('Page.navigate',{url:browser.origin+'/'});
  await page.wait('!!document.getElementById("hvLoginContinue")');await page.click('#hvLoginContinue');
  await page.wait('document.getElementById("hvLoginRoot").hidden');
  await page.click('#hubScreen [data-art-go="campaign"]');await page.wait('!!document.querySelector("#hvCampaignScene")&&!document.querySelector("#hvCampaignScene").hidden');
  for(let i=0;i<4;i++){await pause(i===0?5000:4000);const shot=await page.send('Page.captureScreenshot',{format:'jpeg',quality:65});console.log('REAL_AFK_IMAGE:'+width+':'+i+':'+shot.data);}
  run.draws=await page.evaluate('({attacks:[...new Set(__afkDraws.filter(x=>x.src.includes("campaign-atk-v1")).map(x=>x.src.split("/campaign-atk-v1/")[1].split("/")[0]))],vfx:[...new Set(__afkDraws.filter(x=>x.src.includes("campaign-vfx-v1")).map(x=>x.src.split("/campaign-vfx-v1/")[1].split("/")[0]))],count:__afkDraws.length})');
  run.exceptions=page.events.filter(e=>e.method==='Runtime.exceptionThrown').map(e=>e.params.exceptionDetails.exception?.description||e.params.exceptionDetails.text);
  run.assetErrors=page.events.filter(e=>e.method==='Network.responseReceived'&&e.params.response.status>=400&&new URL(e.params.response.url).pathname.startsWith('/assets/')).map(e=>e.params.response.url);
  run.ok=run.draws.attacks.length>0&&run.draws.vfx.length>0&&!run.exceptions.length&&!run.assetErrors.length;
 }catch(e){run.ok=false;run.error=String(e.stack||e);}finally{await page.close();}
}}finally{await browser.close();}
report.ok=report.runs.every(r=>r.ok);writeFileSync(out+'/report.json',JSON.stringify(report,null,2));console.log('REAL_AFK_REPORT:'+JSON.stringify(report));if(!report.ok)process.exitCode=1;
