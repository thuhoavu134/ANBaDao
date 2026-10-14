import assert from 'node:assert/strict';
import {startBrowser} from './qa-battle-readiness-browser.mjs';
const ids=['thay_mo','ky_van','linh_dong','tieu_phong','luc_anh','bach_dien'];
const browser=await startBrowser(),runs=[];
try{for(const [width,height] of [[390,844],[1280,800]]){
 const page=await browser.page(width,height,1),run={width,height};runs.push(run);
 try{
  await page.send('Network.setCacheDisabled',{cacheDisabled:true});
  await page.send('Page.addScriptToEvaluateOnNewDocument',{source:`
   window.__prepProbe={current:[],first:{},pages:{},start:0,delayed:0};
   const prop=Object.getOwnPropertyDescriptor(HTMLImageElement.prototype,'src');
   Object.defineProperty(HTMLImageElement.prototype,'src',{...prop,set(value){
    const animation=/preparation-idle-v1.*page-|characters\\/(ky-van|tieu-phong)\\/campaign\\/idle-\\d/.test(String(value));
    if(animation&&window.__prepProbe.start){__prepProbe.delayed++;const image=this;setTimeout(()=>prop.set.call(image,value),1800);}
    else prop.set.call(this,value);
   }});
   const clear=CanvasRenderingContext2D.prototype.clearRect,draw=CanvasRenderingContext2D.prototype.drawImage;
   CanvasRenderingContext2D.prototype.clearRect=function(...args){if(this.canvas.closest('.cs-battlefield'))__prepProbe.current=[];return clear.apply(this,args);};
   CanvasRenderingContext2D.prototype.drawImage=function(image,...args){
    const result=draw.call(this,image,...args);
    if(this.canvas.closest('.cs-battlefield')){
     const src=String(image.src||'').replaceAll('-','_');
     const id=${JSON.stringify(ids)}.find(id=>src.includes('/'+id+'/'));
     if(id){__prepProbe.current.push(id);__prepProbe.first[id]??=performance.now()-__prepProbe.start;
      if(src.includes('/page_')||/\\/campaign\\/idle_\\d+\\.webp$/.test(src))__prepProbe.pages[id]=true;}
    }return result;
   };`});
  await page.send('Page.navigate',{url:browser.origin+'/'});
  await page.wait('!!document.getElementById("hvLoginContinue")');await page.click('#hvLoginContinue');
  await page.wait('document.getElementById("hvLoginRoot").hidden');
  await page.evaluate(`P.squad=${JSON.stringify(ids)}.map((id,slot)=>({id,slot,row:slot<3?'front':'back'}));navTo('campaign')`);
  await page.wait('!document.getElementById("hvCampaignScene").hidden');
  await page.evaluate('window.__prepProbe.start=performance.now()');
  await page.click('#hvCampaignScene [data-hv-afk-challenge]');
  await page.wait('new Set(__prepProbe.current).size===6',15000);
  run.first=await page.evaluate('JSON.parse(JSON.stringify(__prepProbe))');
  assert.ok(Math.max(...Object.values(run.first.first))<8000,'all six bodies within 8 seconds under delayed animation');
  console.log('PREPARATION_IMAGE:'+width+':bodies:'+(await page.send('Page.captureScreenshot',{format:'jpeg',quality:70})).data);
  await page.wait('Object.keys(__prepProbe.pages).length===6',30000);
  run.animated=await page.evaluate('JSON.parse(JSON.stringify(__prepProbe))');assert.ok(run.animated.delayed>0);
  console.log('PREPARATION_IMAGE:'+width+':animated:'+(await page.send('Page.captureScreenshot',{format:'jpeg',quality:70})).data);
  // Leave through the actual back control, then reopen with the same six heroes.
  await page.click('.cs-prepare .cs-back');await page.click('#hvCampaignScene [data-hv-afk-challenge]');
  await page.wait('new Set(__prepProbe.current).size===6',15000);
  run.errors=page.events.filter(e=>e.method==='Runtime.exceptionThrown').map(e=>e.params.exceptionDetails);
  run.assetErrors=page.events.filter(e=>e.method==='Network.responseReceived'&&e.params.response.status>=400&&e.params.response.url.includes('/assets/')).map(e=>e.params.response.url);
  assert.equal(run.errors.length,0);assert.equal(run.assetErrors.length,0);run.ok=true;
 }catch(e){run.ok=false;run.error=String(e.stack||e);console.log('PREPARATION_IMAGE:'+width+':failure:'+(await page.send('Page.captureScreenshot',{format:'jpeg',quality:70})).data);}
 finally{await page.close();}
}}finally{await browser.close();}
console.log('PREPARATION_REPORT:'+JSON.stringify({revision:process.env.GITHUB_SHA,runs,physicalSafari:'NOT_RUN'}));
if(runs.some(r=>!r.ok))process.exitCode=1;
