import {startBrowser} from './qa-battle-readiness-browser.mjs';
import {mkdirSync,writeFileSync} from 'node:fs';
const browser=await startBrowser(),runs=[],out='evidence/ky-van-fixes';mkdirSync(out,{recursive:true});
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function shot(page,name){const image=await page.send('Page.captureScreenshot',{format:'jpeg',quality:65});writeFileSync(out+'/'+name+'.jpg',Buffer.from(image.data,'base64'));console.log('KY_VAN_IMAGE:'+name+':'+image.data);}
try{for(const [width,height]of [[390,844],[1280,800]]){
 const page=await browser.page(width,height,1),run={width,height};runs.push(run);
 try{
  await page.send('Page.addScriptToEvaluateOnNewDocument',{source:`window.__kyDraws=[];const draw=CanvasRenderingContext2D.prototype.drawImage;CanvasRenderingContext2D.prototype.drawImage=function(im,...args){if((im?.src||'').includes('/ky-van/')){__kyDraws.push({src:im.src,cell:args.slice(0,4),dest:args.slice(4),canvas:this.canvas.id,time:performance.now()});if(__kyDraws.length>5000)__kyDraws.shift();}return draw.call(this,im,...args);};`});
  await page.send('Page.navigate',{url:browser.origin+'/'});await page.wait('!!document.getElementById("hvLoginContinue")');await page.click('#hvLoginContinue');await page.wait('document.getElementById("hvLoginRoot").hidden');
  // Màn tải hvBoot (src/ui/boot-loader.js, z-index tối đa) phủ toàn màn tới khi nạp xong asset tướng; chờ như người chơi thật trước khi bấm.
  await page.wait('window.HV_BOOT_DONE===true&&!document.getElementById("hvBoot")',120000);
  // Test profile only: preserve the real six-person flow and all production renderers.
  await page.evaluate(`P.heroes.ky_van.owned=true;P.squad=[{id:'ky_van',row:'front',slot:0},{id:'ong_hang_pho',row:'front',slot:1},{id:'dinh_loi',row:'front',slot:2},{id:'thay_mo',row:'back',slot:3},{id:'linh_dong',row:'back',slot:4},{id:'bach_dien',row:'back',slot:5}];navTo('heroes');`);
  await page.wait('!!document.querySelector("#hvHeroRosterV4.is-open [data-hero-id=ky_van]")');
  await page.evaluate(`document.querySelector('#hvHeroRosterV4 [data-hero-id="ky_van"]').scrollIntoView({block:'center'})`);await page.click('#hvHeroRosterV4 [data-hero-id="ky_van"]');
  await page.wait('__kyDraws.filter(x=>x.canvas==="kyVanDetailIdle").length>8');await pause(400);
  run.detail=await page.evaluate(`(()=>{const cv=document.getElementById('kyVanDetailIdle'),stage=cv.parentElement,r=cv.getBoundingClientRect(),s=stage.getBoundingClientRect();const nEl=stage.querySelector('.hsnm'),nCs=nEl&&getComputedStyle(nEl),nVis=!!nEl&&nCs.display!=='none'&&nCs.visibility!=='hidden'&&nEl.getBoundingClientRect().height>0,nr=nVis?nEl.getBoundingClientRect():null;return {frames:new Set(__kyDraws.filter(x=>x.canvas==='kyVanDetailIdle').map(x=>x.src+':'+x.cell)).size,bounds:{x:r.x,y:r.y,width:r.width,height:r.height},contained:r.left>=s.left&&r.right<=s.right&&r.top>=s.top&&r.bottom<=s.bottom,nameVisible:nVis,titleBelow:!nr||nr.top>=r.bottom,posterHidden:getComputedStyle(stage.querySelector('.hsava')).display==='none'};})()`);
  await shot(page,'detail-'+width);
  await page.click('#hvHeroDetailRoot [data-hd-close]');await page.evaluate(`navTo('campaign')`);await page.wait('!!document.querySelector("#hvCampaignScene")&&!document.querySelector("#hvCampaignScene").hidden');
  await pause(14000);
  run.afk=await page.evaluate(`({squad:document.querySelector('#hvCampaignScene canvas')?.getAttribute('aria-label')||'',frames:new Set(__kyDraws.filter(x=>x.src.includes('/campaign/')).map(x=>x.src+':'+x.cell)).size,clips:[...new Set(__kyDraws.filter(x=>x.src.includes('/campaign/')).map(x=>x.src.split('/').pop()))]})`);await shot(page,'afk-'+width);
  await page.send('Page.navigate',{url:browser.origin+'/ky-van-test.html'});await page.wait('window.__SKILL_TEST_QA__?.ready');await pause(800);
  await page.click('[data-action="ultimate"]');await page.wait('window.__SKILL_TEST_QA__?.lastRun?.phase==="complete"',30000);
  run.ultimate=await page.evaluate('window.__SKILL_TEST_QA__.lastRun');
  await page.evaluate(`window.name='hvBattleConfig:'+encodeURIComponent(JSON.stringify({...JSON.parse(document.getElementById('battleFrame').dataset.config),embedded:false}))`);
  await page.send('Page.navigate',{url:browser.origin+'/battle.html?qaPhase01=1'});
  await page.wait('window.__HON_VIET__?.getUnits().length===12&&__kyDraws.length>8');
  await page.click('#startBattle');await page.wait('__HON_VIET__.getState().mode==="battle"');await pause(400);
  run.battle=await page.evaluate(`(()=>{const canvas=document.querySelector('canvas'),r=canvas.getBoundingClientRect();return {width:r.width,height:r.height,display:getComputedStyle(canvas).display,draws:__kyDraws.length};})()`);
  await shot(page,'battle-'+width);
  run.exceptions=page.events.filter(e=>e.method==='Runtime.exceptionThrown').map(e=>e.params.exceptionDetails.exception?.description||e.params.exceptionDetails.text);
  run.assetErrors=page.events.filter(e=>e.method==='Network.responseReceived'&&e.params.response.status>=400&&new URL(e.params.response.url).pathname.startsWith('/assets/')).map(e=>e.params.response.url);
  run.ok=run.battle.width>0&&run.battle.height>0&&run.battle.display!=='none'&&run.detail.frames>1&&run.detail.contained&&run.detail.titleBelow&&run.detail.posterHidden&&run.afk.frames>2&&run.afk.squad.includes('Kỷ Vân')&&!run.exceptions.length&&!run.assetErrors.length;
 }catch(error){run.ok=false;run.error=String(error.stack||error);}finally{await page.close();}
}}finally{await browser.close();}
const report={revision:process.env.GITHUB_SHA,runs,ok:runs.every(x=>x.ok),physicalIphone:'NOT_RUN'};writeFileSync(out+'/report.json',JSON.stringify(report,null,2));console.log('KY_VAN_REPORT:'+JSON.stringify(report));if(!report.ok)process.exitCode=1;
