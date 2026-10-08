import assert from 'node:assert/strict';
import {startBrowser} from './qa-battle-readiness-browser.mjs';

const report={revision:process.env.GITHUB_SHA,runs:[],scope:'Full game, one trusted login click, then production routes/buttons without new activation. Chromium; iPhone platform path is not physical Safari.'};
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const frame='document.getElementById("hvBattleFrame").contentWindow';
const instrument=`window.__audioProbe={contexts:[],pcm:[],gestures:0};
document.addEventListener('pointerdown',e=>{if(e.isTrusted)__audioProbe.gestures++;},true);
const AC=window.AudioContext;window.AudioContext=new Proxy(AC,{construct(T,args){const c=new T(...args);__audioProbe.contexts.push(c);return c;}});
const start=AudioBufferSourceNode.prototype.start;AudioBufferSourceNode.prototype.start=function(...args){const result=start.apply(this,args);let peak=0;const samples=this.buffer?.getChannelData(0);if(samples)for(let i=0;i<samples.length;i+=Math.max(1,Math.floor(samples.length/3000)))peak=Math.max(peak,Math.abs(samples[i]));const music=window.HonVietAudio?.music?.();__audioProbe.pcm.push({at:performance.now(),state:this.context.state,peak,duration:this.buffer?.duration,music:music?.source===this?music.url:null});return result;};`;

for(const [profile,width,height] of [['desktop',1280,800],['iphone-path',390,844]]){
 const browser=await startBrowser(),page=await browser.page(width,height,1),run={profile,routes:[],entries:[]};report.runs.push(run);
 const snap=()=>page.evaluate(`({url:location.pathname,state:HonVietAudio.context().state,unlocked:HonVietAudio.isUnlocked(),track:HonVietAudio.music()?.url,contexts:__audioProbe.contexts.length,gestures:__audioProbe.gestures,activeGesture:navigator.userActivation.isActive,pcm:__audioProbe.pcm,legacyPaused:typeof bgmPlayer==='undefined'||bgmPlayer.paused})`);
 const shot=async label=>console.log('GLOBAL_AUDIO_IMAGE:'+profile+':'+label+':'+(await page.send('Page.captureScreenshot',{format:'jpeg',quality:70})).data);
 const clickWithoutGesture=selector=>page.evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e)throw Error('Missing '+${JSON.stringify(selector)});e.click();})()`);
 try{
  await page.send('Page.addScriptToEvaluateOnNewDocument',{source:instrument});
  if(profile==='iphone-path')await page.send('Network.setUserAgentOverride',{userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1',platform:'iPhone'});
  await page.send('Page.navigate',{url:browser.origin+'/'});
  await page.wait('!!document.getElementById("hvLoginContinue")');
  run.before=await snap();assert.equal(run.before.gestures,0);assert.equal(run.before.unlocked,false);
  await page.click('#hvLoginContinue');
  await page.wait('document.getElementById("hvLoginRoot").hidden&&HonVietAudio.isUnlocked()');
  await pause(6000); // transient browser activation must expire before later screens
  assert.equal((await snap()).activeGesture,false);
  for(const [route,track] of [['hub','hub'],['heroes','hero'],['team','hub'],['shop','hub'],['daily','hub'],['campaign','challenge']]){
   await page.evaluate('navTo('+JSON.stringify(route)+')');
   await page.wait(`HonVietAudio.music()?.url.includes('bgm-${track}-')`,30000);
   const s=await snap();run.routes.push({route,...s,pcm:undefined});
   assert.equal(s.state,'running');assert.equal(s.contexts,1);assert.equal(s.gestures,1);assert.equal(s.legacyPaused,true);
   assert.ok(s.pcm.some(p=>p.music?.includes('bgm-'+track+'-')&&p.peak>0&&p.state==='running'));
  }
  run.uiSound=await page.evaluate('HonVietSfx.play("ui",{group:"ui"})');assert.equal(run.uiSound,true);
  run.voice=await page.evaluate('HonVietAudio.playVoice("assets/audio/voice-luc-anh-hero.mp3",.2)');assert.equal(run.voice,true);
  await shot('campaign');
  for(let cycle=0;cycle<2;cycle++){
   await page.evaluate('navTo("campaign")');
   await page.wait('!document.getElementById("hvCampaignScene").hidden');
   await clickWithoutGesture('#hvCampaignScene [data-hv-afk-challenge]');
   await page.wait('!document.querySelector(".cs-prepare").hidden');
   await clickWithoutGesture('[data-scene-action="launch"]');
   await page.wait(`!!${frame}.__HON_VIET__&&${frame}.__HON_VIET__.getState().actionCount>=2`,60000);
   const entry=await page.evaluate(`(()=>{const w=${frame};return {host:${'window.HonVietAudio'}.context()===w.HonVietAudio.context(),childContexts:w.__audioProbe.contexts.length,state:w.HonVietAudio.context().state,count:w.__HON_VIET__.getState().actionCount,sfx:w.HonVietSfx.timingEvents().filter(t=>t.group==='combat'),cache:__HV_HOST_ATLASES.inspect(),released:document.documentElement.dataset.battleHostImagesReleased};})()`);
   entry.audio=await snap();run.entries.push(entry);
   assert.equal(entry.host,true);assert.equal(entry.childContexts,0);assert.equal(entry.state,'running');assert.equal(entry.audio.gestures,1);assert.equal(entry.audio.contexts,1);assert.equal(entry.audio.url,'/');
   assert.equal(entry.cache.suspended,true);assert.equal(entry.cache.entries,0);
   if(profile==='iphone-path')assert.ok(Number(entry.released)>0);
   assert.ok(entry.sfx.length>0);assert.ok(entry.audio.pcm.some(p=>p.music?.includes('bgm-combat-')&&p.peak>0));
   await shot('battle-'+cycle);
   await page.evaluate(`${frame}.document.getElementById('embeddedSkipButton').click()`);
   await page.wait(`${frame}.__HON_VIET__.getState().mode==='result'`,100000);
   await page.wait("/bgm-(victory|defeat)/.test(HonVietAudio.music()?.url)",30000);
   entry.result=await snap();assert.equal(entry.result.gestures,1);assert.ok(entry.result.pcm.some(p=>/bgm-(victory|defeat)/.test(p.music)&&p.peak>0));
   await shot('result-'+cycle);
   await page.evaluate(`(()=>{const d=${frame}.document;const b=d.querySelector('[data-result-action="confirm"],[data-result-action="back"]');if(!b)throw Error('Result action missing');b.click();})()`);
   await page.wait('!document.getElementById("hvBattleOverlay").classList.contains("is-open")&&!__HV_HOST_ATLASES.suspended');
   await page.evaluate('navTo("heroes")');await page.wait("HonVietAudio.music()?.url.includes('bgm-hero-')",30000);
   entry.returned=await snap();assert.equal(entry.returned.contexts,1);assert.equal(entry.returned.gestures,1);
   assert.equal(await page.evaluate("document.documentElement.dataset.battleHostImagesReleased"),undefined);
  }
  run.errors=page.events.filter(e=>e.method==='Runtime.exceptionThrown').map(e=>e.params.exceptionDetails.exception?.description||e.params.exceptionDetails.text);
  run.assetErrors=page.events.filter(e=>e.method==='Network.responseReceived'&&e.params.response.status>=400&&e.params.response.url.includes('/assets/')).map(e=>e.params.response.url);
  assert.equal(run.errors.length+run.assetErrors.length,0);run.ok=true;
 }catch(e){run.ok=false;run.error=String(e.stack||e);run.failure=await snap().catch(()=>null);await shot('failure').catch(()=>{});}
 finally{await page.close();await browser.close();}
}
report.ok=report.runs.every(r=>r.ok);console.log('GLOBAL_AUDIO_REPORT:'+JSON.stringify(report));if(!report.ok)process.exitCode=1;
