import assert from 'node:assert/strict';
import {startBrowser} from './qa-battle-readiness-browser.mjs';
const browser=await startBrowser(),reports=[];
async function snap(page,label){const s=await page.send('Page.captureScreenshot',{format:'jpeg',quality:75});console.log('SUMMON_IMAGE:'+label+':'+s.data);}
async function tap(page,selector){
 await page.evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e)return;const r=e.getBoundingClientRect();if(r.top<0||r.bottom>innerHeight)e.scrollIntoView({block:'nearest'})})()`);
 await page.wait(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e)return false;const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))})()`);
 await page.click(selector);
}
try{
 for(const [label,w,h] of [['mobile',390,844],['reference',620,930],['desktop',1280,800]]){
  if(process.env.SUMMON_BEFORE&&label!=='reference')continue;
  const page=await browser.page(w,h),report={label,scenes:[]};reports.push(report);
  try{
   await page.send('Page.navigate',{url:browser.origin+'/'});
   await page.wait('!!document.getElementById("hvLoginContinue")',60000);
   await tap(page,'#hvLoginContinue');await page.wait('document.getElementById("hvLoginRoot").hidden',30000);
   await page.evaluate("P.clearedChapters=[0];navTo('summon')");
   await page.wait('document.querySelector("#hvSummonRoot.is-open")');
   await page.evaluate('new Promise(r=>setTimeout(r,4000))');
   if(process.env.SUMMON_BEFORE){await snap(page,'before-reference');continue;}
   const save=await page.evaluate('JSON.stringify({heroes:P.heroes,gems:P.gems,pity:P.pity,economy:P.economy,summonCount:P.summonCount})');
   for(let i=0;i<3;i++){
    await tap(page,`[data-scene-index="${i}"]`);
    await page.wait('[...document.querySelectorAll(".hv-sum-cast img")].length===3&&[...document.querySelectorAll(".hv-sum-cast img")].every(i=>i.complete&&i.naturalWidth>0)');
    await page.evaluate('new Promise(r=>setTimeout(r,400))');
    const info=await page.evaluate(`(()=>{const r=document.getElementById('hvSummonRoot');return {key:r.querySelector('[data-scene]').dataset.scene,overflow:r.scrollWidth>r.clientWidth+1,buttons:[...r.querySelectorAll('.hv-sum-scene-nav button,[data-summon-pull]')].map(e=>e.getBoundingClientRect().height)}})()`);
    assert.equal(info.overflow,false);
    const labels=await page.evaluate('[...document.querySelectorAll(".hv-sum-figure figcaption")].map(e=>({fits:e.scrollWidth<=e.clientWidth+1,rect:e.getBoundingClientRect().toJSON()}))');
    assert.ok(labels.every(x=>x.fits&&x.rect.x>=0&&x.rect.right<=w));assert.ok(info.buttons.every(h=>h>=44));report.scenes.push(info);
    await snap(page,label+'-scene-'+i);
   }
   await tap(page,'[data-scene-step="1"]');assert.equal(await page.evaluate('document.querySelector("[data-scene]").dataset.scene'),'hoi-tu');
   // A genuine touch swipe over the artwork, not a synthetic application handler.
   const r=await page.evaluate('document.querySelector(".hv-sum-cast").getBoundingClientRect().toJSON()');
   await page.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:r.x+r.width*.8,y:r.y+r.height*.5}]});
   await page.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:r.x+r.width*.2,y:r.y+r.height*.5}]});
   await page.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
   await page.wait('document.querySelector("[data-scene]").dataset.scene==="net-mong"');
   assert.equal(await page.evaluate('JSON.stringify({heroes:P.heroes,gems:P.gems,pity:P.pity,economy:P.economy,summonCount:P.summonCount})'),save);
   report.locked=await page.evaluate('!!document.querySelector("[data-summon-lock]")');
   if(report.locked){assert.equal(await page.evaluate('[...document.querySelectorAll("[data-summon-pull]")].every(b=>b.disabled)'),true);await tap(page,'[data-summon-pull="1"]');assert.equal(await page.evaluate('JSON.stringify({heroes:P.heroes,gems:P.gems,pity:P.pity,economy:P.economy,summonCount:P.summonCount})'),save);}
   else{
    // Only the isolated QA player's balance is prepared; production transaction runs unchanged.
    await page.evaluate('P.gems=5000;P.freePullDay=-1;renderSummon()');
    const before=await page.evaluate('({gems:P.gems,count:P.summonCount||0})');
    await tap(page,'[data-summon-pull="free"]');
    assert.equal(await page.evaluate('document.querySelectorAll("[data-summon-card]").length'),1);
    assert.equal(await page.evaluate('P.gems'),before.gems);
    await tap(page,'[data-summon-pull="1"]');
    assert.equal(await page.evaluate('P.gems'),before.gems-80);
    await tap(page,'[data-summon-pull="10"]');
    assert.equal(await page.evaluate('P.gems'),before.gems-800);
    assert.equal(await page.evaluate('P.summonCount'),before.count+12);
    assert.equal(await page.evaluate('document.querySelectorAll("[data-summon-card]").length'),10);
    await snap(page,label+'-results');
   }
   assert.equal(await page.evaluate('document.querySelectorAll("#hvSummonRoot").length'),1);
   await tap(page,'.hv-sum-spark summary');assert.equal(await page.evaluate('document.querySelector(".hv-sum-spark").open'),true);
   await page.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
   assert.equal(await page.evaluate('getComputedStyle(document.querySelector(".cast-0 img")).animationName'),'none');
   await tap(page,'[data-summon-back]');await page.wait("ST.screen==='hub'");
   await page.evaluate("navTo('summon')");await page.wait('document.querySelector("#hvSummonRoot.is-open")');
   assert.equal(await page.evaluate('document.querySelectorAll("#hvSummonRoot").length'),1);
   report.exceptions=page.events.filter(e=>e.method==='Runtime.exceptionThrown').map(e=>e.params.exceptionDetails);
   assert.deepEqual(report.exceptions,[]);report.ok=true;
  }catch(e){report.error=e.stack;await snap(page,label+'-failure');throw e;}finally{await page.close();}
 }
 const expected=browser.requestLog.filter(x=>['/favicon.ico','/api/health'].includes(x.url));
 console.log('SUMMON_STATIC_PROBES:'+JSON.stringify(expected));
 assert.deepEqual(browser.requestLog.filter(x=>!['/favicon.ico','/api/health'].includes(x.url)),[]);
}finally{console.log('SUMMON_REPORT:'+JSON.stringify({revision:process.env.GITHUB_SHA,reports}));await browser.close();}
