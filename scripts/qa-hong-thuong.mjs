import {startBrowser} from './qa-battle-readiness-browser.mjs';
import {mkdirSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {join} from 'node:path';
const browser=await startBrowser(),runs=[],out='evidence/hong-thuong';mkdirSync(out,{recursive:true});
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function shot(page,name){const image=await page.send('Page.captureScreenshot',{format:'jpeg',quality:65});writeFileSync(out+'/'+name+'.jpg',Buffer.from(image.data,'base64'));console.log('HONG_THUONG_IMAGE:'+name+':'+image.data);}
// Screencast video cho bàn giao (ATK + ultimate trong trận thật).
async function record(page,name,ms){
 const frames=[];let cursor=0;
 await page.send('Page.startScreencast',{format:'jpeg',quality:45,everyNthFrame:8,maxWidth:900,maxHeight:600});
 const end=Date.now()+ms;
 while(Date.now()<end){
  const evs=page.events;
  for(;cursor<evs.length;cursor++){
   const e=evs[cursor];
   if(e.method==='Page.screencastFrame'){frames.push({data:e.params.data,ts:Date.now()});page.send('Page.screencastFrameAck',{sessionId:e.params.sessionId}).catch(()=>{});}
  }
  await pause(80);
 }
 try{await page.send('Page.stopScreencast');}catch{}
 // Ack any frames that arrived after the loop so later capture calls aren't throttled.
 try{const evs=page.events;for(;cursor<evs.length;cursor++){const e=evs[cursor];if(e.method==='Page.screencastFrame')page.send('Page.screencastFrameAck',{sessionId:e.params.sessionId}).catch(()=>{});}}catch{}
 if(frames.length>4){
  const dir=join(out,name+'-frames');mkdirSync(dir,{recursive:true});
  frames.forEach((f,i)=>writeFileSync(join(dir,String(i).padStart(4,'0')+'.jpg'),Buffer.from(f.data,'base64')));
  try{execFileSync('ffmpeg',['-y','-v','error','-framerate','12','-i',join(dir,'%04d.jpg'),'-vf','scale=trunc(iw/2)*2:trunc(ih/2)*2','-c:v','libx264','-pix_fmt','yuv420p',join(out,name+'.mp4')]);console.log('HONG_THUONG_VIDEO:'+name+' frames='+frames.length);}catch(e){console.log('VIDEO_FAIL:'+name+':'+String(e).slice(0,120));}
 }
 return frames.length;
}
try{for(const [width,height]of [[390,844],[1280,800]]){
 const page=await browser.page(width,height,1),run={width,height};runs.push(run);
 await page.send('Page.addScriptToEvaluateOnNewDocument',{source:`window.__qaAudio=[];const original=AudioBufferSourceNode.prototype.start;AudioBufferSourceNode.prototype.start=function(...args){const result=original.apply(this,args);let peak=0;const data=this.buffer?.getChannelData(0);if(data)for(let i=0;i<data.length;i+=Math.max(1,Math.floor(data.length/3000)))peak=Math.max(peak,Math.abs(data[i]));__qaAudio.push({at:Date.now(),state:this.context.state,duration:this.buffer?.duration,peak});return result;};`});
 try{
  await page.send('Page.addScriptToEvaluateOnNewDocument',{source:`window.__htDraws=[];const draw=CanvasRenderingContext2D.prototype.drawImage;CanvasRenderingContext2D.prototype.drawImage=function(im,...args){if((im?.src||'').includes('/hong-thuong/')){__htDraws.push({src:im.src,cell:args.slice(0,4),dest:args.slice(4),canvas:this.canvas.id,time:performance.now()});if(__htDraws.length>12000)__htDraws.shift();}return draw.call(this,im,...args);};`});
  await page.send('Page.navigate',{url:browser.origin+'/'});await page.wait('!!document.getElementById("hvLoginContinue")');await page.click('#hvLoginContinue');await page.wait('document.getElementById("hvLoginRoot").hidden');
  // Test profile only: squad có Hồng Thương, giữ renderer production thật.
  await page.evaluate(`P.heroes.hong_thuong.owned=true;P.squad=[{id:'hong_thuong',row:'front',slot:0},{id:'ong_hang_pho',row:'front',slot:1},{id:'dinh_loi',row:'front',slot:2},{id:'thay_mo',row:'back',slot:3},{id:'linh_dong',row:'back',slot:4},{id:'bach_dien',row:'back',slot:5}];navTo('heroes');`);
  await page.wait('!!document.querySelector("#hvHeroRosterV4.is-open [data-hero-id=hong_thuong]")');
  await page.evaluate(`document.querySelector('#hvHeroRosterV4 [data-hero-id="hong_thuong"]').scrollIntoView({block:'center'})`);await page.click('#hvHeroRosterV4 [data-hero-id="hong_thuong"]');
  await page.wait('__htDraws.filter(x=>x.canvas==="hongThuongDetailIdle").length>8');await pause(400);
  run.detail=await page.evaluate(`(()=>{const cv=document.getElementById('hongThuongDetailIdle'),stage=cv.parentElement,r=cv.getBoundingClientRect(),s=stage.getBoundingClientRect(),name=stage.querySelector('.hsnm')?.getBoundingClientRect();return {frames:new Set(__htDraws.filter(x=>x.canvas==='hongThuongDetailIdle').map(x=>x.src+':'+x.cell)).size,bounds:{x:r.x,y:r.y,width:r.width,height:r.height},contained:r.left>=s.left&&r.right<=s.right&&r.top>=s.top&&r.bottom<=s.bottom,titleBelow:!name||name.top>=r.bottom,posterHidden:getComputedStyle(stage.querySelector('.hsava')).display==='none'};})()`);
  await shot(page,'detail-'+width);
  await page.click('#hvHeroDetailRoot [data-hd-close]');await page.evaluate(`navTo('campaign')`);await page.wait('!!document.querySelector("#hvCampaignScene")&&!document.querySelector("#hvCampaignScene").hidden');
  await pause(14000);
  run.afk=await page.evaluate(`({squad:document.querySelector('#hvCampaignScene canvas')?.getAttribute('aria-label')||'',frames:new Set(__htDraws.filter(x=>x.src.includes('/campaign/')).map(x=>x.src+':'+x.cell)).size,clips:[...new Set(__htDraws.filter(x=>x.src.includes('/campaign/')).map(x=>x.src.split('/').pop()))]})`);await shot(page,'afk-'+width);
  await page.send('Page.navigate',{url:browser.origin+'/hong-thuong-test.html'});await page.wait('window.__SKILL_TEST_QA__?.ready');await pause(800);
  // ---- FORCED BASIC (fixture nộ/energy — cơ chế nộ do unit test chứng minh) ----
  await page.click('[data-action="basic"]');await pause(500);await shot(page,'basic-mid-'+width);
  await page.wait('window.__SKILL_TEST_QA__?.lastRun?.phase==="complete"',30000);
  run.basic=await page.evaluate(`(()=>{const r=window.__SKILL_TEST_QA__.lastRun,draws=__htDraws.filter(x=>x.src.endsWith('/basic.webp')&&x.canvas!=='hongThuongDetailIdle'&&x.canvas!=='');const rel=draws.map(x=>x.time).sort((a,b)=>a-b);const t0=rel[0]||0;const cells=[...new Set(draws.map(x=>x.cell.join(':')))];return {phase:r.phase,cells:cells.length,strokes:rel.length,timeline:r.trace?.map(x=>x.type)||[]};})()`);
  await shot(page,'basic-'+width);
  // ---- TOP-LEVEL BATTLE: forced basic + ultimate, VFX/SFX probes, video ----
  await page.evaluate(`window.name='hvBattleConfig:'+encodeURIComponent(JSON.stringify({...JSON.parse(document.getElementById('battleFrame').dataset.config),embedded:false,autoStart:true}))`);
  await page.send('Page.navigate',{url:browser.origin+'/battle.html?qaPhase01=1'});
  await page.wait('window.__HON_VIET__?.getUnits().length===12&&__htDraws.length>8');
  await page.click('#startBattle');await page.wait('__HON_VIET__.getState().mode==="battle"');await pause(400);
  await page.evaluate("(()=>{if(window.HonVietSfx&&window.HonVietSfx.unlock)try{window.HonVietSfx.unlock();}catch(e){}})()");
  await pause(250);
  run.sfxProbe=await page.evaluate("(async()=>{const s=window.HonVietSfx;if(!s)return {err:'no-bus'};const out={};try{out['hong-thuong-impact']=await s.play('hong-thuong-impact',{group:'combat'});}catch(e){out['hong-thuong-impact']=String(e).slice(0,60);}return out;})()");
  // Forced basic: draw-log cells + VFX impact at the victim.
  await page.evaluate("void(window.__htForceB=__HON_VIET__.qaForceAuthoredAction('qa-hong-thuong','basic'))");
  await page.wait("__htDraws.some(x=>x.src.endsWith('/impact.webp'))",20000).catch(()=>{});
  await page.wait("__htDraws.some(x=>x.src.endsWith('/basic.webp')&&x.canvas!=='hongThuongDetailIdle')",15000).catch(()=>{});
  await pause(400);await shot(page,'basic-battle-'+width);
  run.basicBattle=await page.evaluate(`(()=>{const draws=__htDraws.filter(x=>x.src.endsWith('/basic.webp'));const rel=draws.map(x=>x.time).sort((a,b)=>a-b);const t0=rel[0]||0;const vfx=__htDraws.filter(x=>x.src.endsWith('/impact.webp'));return {cells:new Set(draws.map(x=>x.cell.join(':'))).size,strokes:rel.length,vfx:vfx.length};})()`);
  // Forced ultimate + screencast video.
  await page.evaluate("void(window.__htForce=__HON_VIET__.qaForceAuthoredAction('qa-hong-thuong','ultimate'))");
  const videoFrames=await record(page,'ultimate-'+width,9500);
  // Read SFX telemetry immediately while the renderer is still responsive;
  // the draw-log probes below are pure history reads over __htDraws.
  const sfxExpr="(()=>{const a=window.__qaAudio||[];return {plays:a.length,audible:a.filter(x=>x.peak>0.008).length,recent:a.filter(x=>x.peak>0.008).slice(-6).map(x=>({ms:Math.round(x.duration||0),peak:Math.round(x.peak*1000)/1000,state:x.state}))};})()";
  run.sfxAfter=await page.evaluate(sfxExpr);
  run.sfxState=await page.evaluate("(()=>{const d=document.documentElement.dataset;return {state:d.sfxState||null,lastResult:d.sfxLastResult||null,active:d.sfxActive||null};})()");
  run.ultimate=await page.evaluate(`(()=>{const draws=__htDraws;const cluster=draws.filter(x=>x.src.endsWith('/ult-cluster.webp'));const prep=draws.filter(x=>x.src.endsWith('/ult-prep.webp'));const fin=draws.filter(x=>x.src.endsWith('/ult-finisher.webp'));const vfx=draws.filter(x=>x.src.endsWith('/impact.webp'));const rel=cluster.map(x=>x.time).sort((a,b)=>a-b);const gaps=[];let prev=null;for(const t of rel){if(prev!==null&&t-prev>140)gaps.push(Math.round(t-prev));prev=t;}return {prep:new Set(prep.map(x=>x.cell.join(':'))).size,clusterCells:new Set(cluster.map(x=>x.cell.join(':'))).size,clusterStrokes:rel.length,clusterGaps:gaps.slice(0,8),finisher:new Set(fin.map(x=>x.cell.join(':'))).size,vfxStrokes:vfx.length};})()`);
  await page.wait("__htDraws.some(x=>x.src.endsWith('/ult-finisher.webp'))",25000).catch(()=>{});
  await pause(400);try{await shot(page,'ultimate-'+width);}catch(e){console.log('SHOT_SKIP:'+String(e).slice(0,80));}
  run.videoFrames=videoFrames;
  run.exceptions=page.events.filter(e=>e.method==='Runtime.exceptionThrown').map(e=>e.params.exceptionDetails.exception?.description||e.params.exceptionDetails.text);
  run.assetErrors=page.events.filter(e=>e.method==='Network.responseReceived'&&e.params.response.status>=400&&new URL(e.params.response.url).pathname.startsWith('/assets/')).map(e=>e.params.response.url);
  // ---- TRẬN TỰ NHIÊN TỪ NỘ 0: Reset trận (nộ về 0), auto ON, xem chuỗi action ----
  await page.evaluate('location.reload()');
  await page.wait('window.__HON_VIET__?.getUnits().length===12');await pause(500);
  await page.click('#startBattle');await page.wait('__HON_VIET__.getState().mode==="battle"');await pause(400);
  // Top-level battles start in manual mode — turn the existing auto owner on.
  await page.evaluate("if(!__HON_VIET__.getState().auto)__HON_VIET__.toggleAuto();");
  // Ghi chuỗi action tự nhiên của qa-hong-thuong tới khi đủ 60 nộ ra ultimate.
  // Node-side polling with SHORT evaluates — one long in-page awaitPromise
  // starves the CDP connection on a busy renderer (round-8 hang).
  const natural={actions:[],ultimateSeen:false};
  {const end=Date.now()+180000;let lastN=-1;
   while(Date.now()<end){
    let snap=null;
    try{snap=await page.evaluate(`(()=>{const t=window.__HV_BATTLE_PHASE1_TRACE,a=window.__HON_VIET__;const hero=a.getUnits().find(x=>x.id==='qa-hong-thuong');if(!hero)return {gone:true};const evs=t.events().filter(e=>e.type==='action:start'&&e.actorId==='qa-hong-thuong');return {n:evs.length,actions:evs.map(e=>e.skillId||'unknown'),energy:Math.round(hero.energy||0)};})()`);}catch(e){await pause(1500);continue;}
    if(!snap||snap.gone)break;
    if(snap.n!==lastN){lastN=snap.n;natural.actions=snap.actions.map(a=>({action:a}));natural.energy=snap.energy;}
    if(snap.actions.some(a=>String(a).includes('ultimate'))){natural.ultimateSeen=true;break;}
    await pause(1500);
   }}
  run.natural=natural;
  try{await shot(page,'battle-'+width);}catch(e){console.log('SHOT_SKIP:'+String(e).slice(0,80));}
  run.videoFrames=videoFrames;
  run.ok=run.basic.phase==='complete'&&run.basicBattle&&run.basicBattle.cells>=6&&run.basicBattle.vfx>0&&run.ultimate.prep>0&&run.ultimate.clusterCells>=6&&run.ultimate.finisher>0&&run.ultimate.vfxStrokes>=6&&run.detail.frames>1&&run.detail.contained&&run.detail.titleBelow&&run.detail.posterHidden&&run.afk.frames>2&&run.afk.squad.includes('Hồng Thương')&&run.sfxProbe&&run.sfxProbe['hong-thuong-impact']===true&&run.natural.ultimateSeen&&run.natural.actions.some(a=>a.action==='basic')&&!run.exceptions.length&&!run.assetErrors.length;
 }catch(error){run.ok=false;run.error=String(error.stack||error);}finally{await page.close();}
}}finally{await browser.close();}
const report={revision:process.env.GITHUB_SHA,runs,ok:runs.every(x=>x.ok),physicalIphone:'NOT_RUN',notes:{spearClip:'ATK clip chỉ có 2 cú đâm riêng biệt — hit2/hit3 map cú đâm mạnh (đề xuất chờ duyệt)',naturalRage:'Trận tự nhiên từ nộ 0: basic ×3+ rồi ultimate khi đủ 60',fixture:'qaForceAuthoredAction ép energy=100 cho forced actions (cơ chế của hook QA sẵn có)'}};
writeFileSync(out+'/report.json',JSON.stringify(report,null,2));console.log('HONG_THUONG_REPORT:'+JSON.stringify(report));if(!report.ok)process.exitCode=1;
