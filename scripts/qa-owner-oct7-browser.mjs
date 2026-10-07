import {mkdirSync,writeFileSync} from 'node:fs';
import {startBrowser} from './qa-battle-readiness-browser.mjs';
const browser=await startBrowser(),out='evidence/owner-oct7';mkdirSync(out,{recursive:true});
const report={revision:process.env.GITHUB_SHA,runs:[],scope:'Full generated game: real roster dock click; authored result renderer/real atlases with explicit QA snapshot, not physical Safari'};
try{for(const [w,h]of [[390,844],[430,932],[1280,800]]){
 const p=await browser.page(w,h,1),run={w,h};report.runs.push(run);
 try{
  await p.send('Page.navigate',{url:browser.origin+'/'});
  await p.wait('!!document.getElementById("hvLoginContinue")');await p.click('#hvLoginContinue');await p.wait('document.getElementById("hvLoginRoot").hidden');
  await p.click('#hubScreen [data-art-go="heroes"]');await p.wait('document.querySelector("#hvHeroRosterV4")?.classList.contains("is-open")');
  await p.click('#hvHeroRosterV4 [data-roster-nav="team"]');
  await p.wait('!document.querySelector("#hvGearRoot").hidden&&document.querySelector("#hvHeroRosterV4").hidden');
  run.assist=await p.evaluate('({screen:ST.screen,rosterHidden:document.querySelector("#hvHeroRosterV4").hidden,gearOpen:!document.querySelector("#hvGearRoot").hidden,formationHidden:document.querySelector("#hvTeamRoot").hidden,topIsGear:!!document.elementFromPoint(innerWidth/2,innerHeight/2)?.closest("#hvGearRoot")})');
  let image=await p.send('Page.captureScreenshot',{format:'jpeg',quality:65});console.log('OCT7_IMAGE:assist:'+w+':'+image.data);
  await p.send('Page.navigate',{url:browser.origin+'/battle.html?linhDongQa=1&bachDienQa=1'});
  await p.wait('!!window.__showIntegratedResultV6&&!!window.__HV_RESULT_MOTION_QA');
  const snap={player:[{id:'linh_dong',sourceId:'hero_splus_linh_dong',name:'Linh Đồng',damage:9999,kills:3,hp:100,maxHp:100,alive:true,slot:0}],enemy:[],rewards:[]};
  await p.evaluate('window.__showIntegratedResultV6(true,'+JSON.stringify(snap)+')');
  await p.wait('__HV_RESULT_MOTION_QA.state().runFrames>=3');
  run.first=await p.evaluate('({motion:__HV_RESULT_MOTION_QA.state(),x:document.querySelector("#integratedResultV6 .irv-hero.run").getBoundingClientRect().x})');
  await new Promise(r=>setTimeout(r,1100));
  run.middle=await p.evaluate('({motion:__HV_RESULT_MOTION_QA.state(),x:document.querySelector("#integratedResultV6 .irv-hero.run").getBoundingClientRect().x})');
  image=await p.send('Page.captureScreenshot',{format:'jpeg',quality:65});console.log('OCT7_IMAGE:result-run:'+w+':'+image.data);
  await p.wait('__HV_RESULT_MOTION_QA.state().phase==="idle"&&__HV_RESULT_MOTION_QA.state().idleFrames>=3',15000);
  run.idle=await p.evaluate('__HV_RESULT_MOTION_QA.state()');
  image=await p.send('Page.captureScreenshot',{format:'jpeg',quality:65});console.log('OCT7_IMAGE:result-idle:'+w+':'+image.data);
  run.errors=p.events.filter(e=>e.method==='Runtime.exceptionThrown').map(e=>e.params.exceptionDetails.exception?.description||e.params.exceptionDetails.text);
  run.assetErrors=p.events.filter(e=>e.method==='Network.responseReceived'&&e.params.response.status>=400&&new URL(e.params.response.url).pathname.startsWith('/assets/')).map(e=>e.params.response.url);
  run.ok=run.assist.screen==='team'&&run.assist.rosterHidden&&run.assist.gearOpen&&run.assist.formationHidden&&run.assist.topIsGear&&run.middle.x>run.first.x&&run.idle.phase==='idle'&&!run.errors.length&&!run.assetErrors.length;
 }catch(e){run.ok=false;run.error=String(e.stack||e);}finally{await p.close();}
}}finally{await browser.close();}
report.ok=report.runs.every(r=>r.ok);writeFileSync(out+'/report.json',JSON.stringify(report,null,2));console.log('OCT7_REPORT:'+JSON.stringify(report));if(!report.ok)process.exitCode=1;

