import assert from 'node:assert/strict';
import {startBrowser} from './qa-battle-readiness-browser.mjs';
const browser=await startBrowser(),runs=[];
try{
 for(const [width,height] of [[390,844],[1280,800]]){
  const page=await browser.page(width,height,1);
  try{
   await page.send('Page.addScriptToEvaluateOnNewDocument',{source:`
    window.__resultDraws=[];
    const draw=CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage=function(image,...args){
     if(this.canvas.matches?.('#integratedResultV6 canvas.irv-hero')){
      window.__resultDraws.push({src:image.src,role:this.canvas.className});
     }
     return draw.call(this,image,...args);
    };`});
   await page.send('Page.navigate',{url:browser.origin+'/battle.html?qaPhase01=1'});
   await page.wait('!!window.__HON_VIET__ && !!window.__HV_RESULT_MOTION_QA');
   for(const [slug,name] of [['tieu-phong','Tiêu Phong'],['ky-van','Kỷ Vân']]){
    const id=slug.replaceAll('-','_');
    const snap={player:[{id:'actor-1',sourceId:'hero_splus_'+id,name,archetype:'mystic',damage:559,kills:0,hp:100,maxHp:100,alive:true,slot:0}],enemy:[],rewards:[]};
    await page.evaluate('__HON_VIET__.qaShowResult(true);window.__hideIntegratedResultV6();window.__resultDraws=[];window.__showIntegratedResultV6(true,'+JSON.stringify(snap)+')');
    await page.wait('__HV_RESULT_MOTION_QA.state().phase==="idle" && __HV_RESULT_MOTION_QA.state().idleFrames>4',15000);
    await page.wait(`new Set(__resultDraws.filter(d=>d.role.includes('idle')&&d.src.includes('/${slug}/idle-')).map(d=>d.src)).size===6`,15000);
    const victory=await page.evaluate('__HV_RESULT_MOTION_QA.state()');
    assert.equal(victory.hero,id);assert.equal(victory.generic,false);
    const draws=await page.evaluate('__resultDraws');
    assert.ok(draws.some(d=>d.src.endsWith('/'+slug+'/run.webp')));
    assert.ok(draws.every(d=>d.src.includes('/'+slug+'/')),'never paint generic or another hero');
    const shot=await page.send('Page.captureScreenshot',{format:'jpeg',quality:70});
    console.log('NEW_HERO_RESULT_IMAGE:'+slug+'-'+width+':'+shot.data);
    await page.click('#integratedResultV6 [data-result-action="confirm"]');
    await page.wait('!document.getElementById("integratedResultV6").classList.contains("show")');
    await page.evaluate('__HON_VIET__.qaShowResult(false);window.__hideIntegratedResultV6();window.__resultDraws=[];window.__showIntegratedResultV6(false,'+JSON.stringify(snap)+')');
    await page.wait('__HV_RESULT_MOTION_QA.state().phase==="fall-hold"',15000);
    const fall=await page.evaluate('__HV_RESULT_MOTION_QA.state()');
    assert.equal(fall.hero,id);assert.equal(fall.generic,false);
    assert.equal(fall.lastFallFrame,fall.expectedFallLast);assert.equal(fall.fallCycles,1);
    const fallDraws=await page.evaluate('__resultDraws');
    assert.ok(fallDraws.length>0&&fallDraws.every(d=>d.src.endsWith('/'+slug+'/fall-die.webp')));
    await page.click('#integratedResultV6 [data-result-action="confirm"]');
    await page.wait('!document.getElementById("integratedResultV6").classList.contains("show")');
    runs.push({slug,width,victory,fall,allSixIdlePages:true,wrongHeroDraws:0,confirm:true});
   }
   assert.equal(page.events.filter(e=>e.method==='Runtime.exceptionThrown').length,0);
   assert.equal(page.events.filter(e=>e.method==='Network.responseReceived'&&e.params.response.status>=400&&e.params.response.url.includes('/assets/')).length,0);
  }finally{await page.close();}
 }
}finally{await browser.close();}
console.log('NEW_HERO_RESULT_REPORT:'+JSON.stringify({runs,exceptions:0,assetErrors:0,physicalIOS:'NOT_RUN'}));
