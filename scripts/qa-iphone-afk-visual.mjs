// Final generated Canvas renderer + shipped RGBA assets. AFK render fixture has
// a fixed squad/clock; it does not certify host routing, rewards or physical Safari.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import vm from 'node:vm';
import {rawRenderHook,renderDeclaration} from './qa-render-source.mjs';
import {startBrowser} from './qa-battle-readiness-browser.mjs';
import {createCampaignResourcePackCache,campaignResourceKey} from '../src/assets/campaign-resource-pack-cache.mjs';
const original=readFileSync('scripts/qa-battle-formation-scale.mjs','utf8');
let hook=rawRenderHook(original);
hook=hook.replace(/  const wanted=src=>[^\n]+;/,String.raw`  const wanted=src=>/assets\/(?:characters\/(?:linh-dong|bach-dien|dinh-loi|luc-anh|thay-mo)\/[^?#]*idle[^?#]*\.(?:webp|png)|characters\/battle-persistent-v1\/(?:luc-idle|dinh-idle)\/[^?#]*\.(?:webp|png)|battle-runtime\/embedded-(?:0[3-9]|10|12)\.(?:webp|png))/i.test(src);`)
 .replace("const want=isSpecial(u,'linh_dong')?'linh-dong':isSpecial(u,'bach_dien')?'bach-dien':'embedded-';","const known=['linh_dong','bach_dien','dinh_loi','luc_anh','thay_mo'].find(id=>isSpecial(u,id));const want=known==='luc_anh'?'luc-idle':known==='dinh_loi'?'dinh-idle':known?known.replace('_','-'):isSpecial(u,'ong_hang_pho')?'embedded-12':'embedded-';");
// Give the isolated static fixture an explicit icon; Chromium otherwise requests
// an unrelated /favicon.ico absent from the game asset contract.
hook+=`document.addEventListener('DOMContentLoaded',()=>{const icon=document.createElement('link');icon.rel='icon';icon.href='data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\"/>';document.head.append(icon);});`;
const html=readFileSync('dist/index.html','utf8');
const declaration=name=>renderDeclaration(html,name);
const start=html.indexOf('const sceneState ='),end=html.indexOf('function sceneTick(',start);
if(start<0||end<start)throw Error('Generated campaign renderer boundary');
const squad=['hero_splus_linh_dong','hero_splus_bach_dien','ong_hang_pho','luc_anh','dinh_loi','thay_mo'].map((id,slot)=>({id,slot,row:slot<3?'front':'back'}));
const bootstrap=`const __HV_CAMPAIGN_LOW_MEMORY=true;const campaignResourceKey=${campaignResourceKey.toString()};const createCampaignResourcePackCache=${createCampaignResourcePackCache.toString()};${declaration('LUC_ANH_IDLE_1080')}${declaration('AFK_THAY_MO_IDLE_DURATIONS')}`;
const fixture=`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;background:#263b26}#scene{height:100vh;background:url('/assets/ui/campaign/forest-map-v1.webp') center/cover}canvas{width:100%;height:100%}</style><div id="scene"><canvas></canvas></div><script>${bootstrap}${html.slice(start,end)}
savedSceneSquad=()=>${JSON.stringify(squad)};syncCampaignMap=()=>{};
sceneState.root=document.querySelector('#scene');sceneState.canvas=document.querySelector('canvas');sceneState.width=innerWidth;sceneState.height=innerHeight;sceneState.canvas.width=innerWidth*devicePixelRatio;sceneState.canvas.height=innerHeight*devicePixelRatio;sceneState.active=true;sceneState.world=campaignWorldForChapter(1);
portraitSrc=id=>{throw Error('Portrait fallback for registered hero '+id);};
const paints=[];const native=CanvasRenderingContext2D.prototype.drawImage;CanvasRenderingContext2D.prototype.drawImage=function(image,...args){paints.push({src:image.src,args,flip:this.getTransform().a<0});return native.call(this,image,...args);};
window.__afkProbe={draw(t){paints.length=0;sceneState.farmTime=t;drawScene(t);const farm=sampleCampaignFarm(t,savedSceneSquad(),false,farmAttackSpecs,sceneState.world);return {paints:paints.slice(),cache:sceneResourceCache.inspect(),phase:farm.phase,poses:farm.actors.map(a=>({id:a.id,home:homePartyPose(a,innerWidth,innerHeight,farm),pose:campaignFarmActorPose(a,innerWidth,innerHeight,farm)}))};}};__afkProbe.draw(7200);
</script>`;
new vm.Script(fixture.match(/<script>([\s\S]*)<\/script>/)[1]);
writeFileSync('dist/qa-afk-visual.html',fixture);
mkdirSync('evidence/iphone-afk',{recursive:true});
const browser=await startBrowser(),report={revision:process.env.GITHUB_SHA||'local',scope:'Responsive Chromium; actual generated battle and isolated final AFK render owner, canonical assets; no physical Safari/host flow claim',runs:[]};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
try{
 for(const [w,h]of [[390,844],[393,852],[430,932],[1280,800]]){
  const page=await browser.page(w,h,w<600?2:1),run={width:w,height:h};report.runs.push(run);
  try{
   await page.send('Page.addScriptToEvaluateOnNewDocument',{source:hook});
   await page.send('Page.navigate',{url:browser.origin+'/battle.html?linhDongQa=1&bachDienQa=1&qaPhase01=1'});
   await page.wait('!!window.__HV_LAYOUT_MEASURE&&!!window.__HON_VIET__');await sleep(1800);
   if(await page.evaluate('!!document.querySelector("#startBattle")&&!document.querySelector("#startBattle").disabled')){
    await page.click('#startBattle');await page.wait('__HON_VIET__.getState().mode==="battle"');
    if(await page.evaluate('__HON_VIET__.getState().auto'))await page.evaluate('__HON_VIET__.toggleAuto()');
    await page.wait('__HON_VIET__.getUnits().every(u=>Math.abs(Number(u.x)-Number(u.baseX))<1&&Math.abs(Number(u.y)-Number(u.baseY))<1)');
   }
   await sleep(450);
   run.layout=await page.evaluate('__HV_LAYOUT_MEASURE()');
   const units=run.layout.units;run.clipped=units.filter(u=>Object.values(u.edge).some(x=>x<-1)).map(u=>u.id);
   run.opposingOverlap=units.filter(a=>units.some(b=>a.team!==b.team&&Math.min(a.bounds.right,b.bounds.right)>Math.max(a.bounds.left,b.bounds.left)&&Math.min(a.bounds.bottom,b.bounds.bottom)>Math.max(a.bounds.top,b.bounds.top))).map(u=>u.id);
   await page.screenshot('evidence/iphone-afk/battle-'+w+'.png');if(w===390){const image=await page.send('Page.captureScreenshot',{format:'jpeg',quality:55});console.log('HV_VISUAL_BATTLE_390='+image.data);}
   if(w<600){
    await page.send('Page.navigate',{url:browser.origin+'/qa-afk-visual.html'});await page.wait('!!window.__afkProbe');
    const seen=new Set(),vfx=new Set();let moved=false,peak=0;
    for(const time of [7200,7500,8200,9200,11200,14200,16000]){
     let sample;for(let n=0;n<14;n++){sample=await page.evaluate('__afkProbe.draw('+time+')');await sleep(100);}
     for(const paint of sample.paints){if(/campaign-atk-v1/.test(paint.src))seen.add(paint.src.split('/campaign-atk-v1/')[1].split('/')[0]);if(/campaign-vfx-v1/.test(paint.src))vfx.add(paint.src.split('/campaign-vfx-v1/')[1].split('/')[0]);}
     moved ||= sample.poses.some(p=>Math.hypot(p.home.x-p.pose.x,p.home.y-p.pose.y)>10);
     peak=Math.max(peak,sample.cache.bytes+sample.cache.reservedBytes);
     if(time===7500){await page.screenshot('evidence/iphone-afk/afk-'+w+'.png');if(w===390){const image=await page.send('Page.captureScreenshot',{format:'jpeg',quality:55});console.log('HV_VISUAL_AFk_390='+image.data);}}
    }
    run.afk={attacks:[...seen],vfx:[...vfx],moved,peak};
   }
   run.exceptions=page.events.filter(e=>e.method==='Runtime.exceptionThrown').map(e=>e.params.exceptionDetails.exception?.description||e.params.exceptionDetails.text);
   run.httpErrors=page.events.filter(e=>e.method==='Network.responseReceived'&&e.params.response.status>=400).map(e=>e.params.response.url);
   run.ok=units.length===12&&!run.clipped.length&&!run.opposingOverlap.length&&!run.exceptions.length&&!run.httpErrors.length&&(!run.afk||(run.afk.attacks.length===6&&run.afk.vfx.length>=4&&run.afk.moved&&run.afk.peak<=64*1024*1024));
  }catch(e){run.ok=false;run.error=String(e.stack||e);}finally{await page.close();}
 }
}finally{await browser.close();}
report.ok=report.runs.every(r=>r.ok);writeFileSync('evidence/iphone-afk/report.json',JSON.stringify(report,null,2));console.log('HV_IPHONE_AFK_REPORT='+JSON.stringify(report));if(!report.ok)process.exitCode=1;
