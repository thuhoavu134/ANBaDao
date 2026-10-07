import {readFileSync,writeFileSync} from 'node:fs';
import {startBrowser} from './qa-battle-readiness-browser.mjs';
// Read-only visibility into the production farm clock. No animation/gameplay overrides.
const hostPath='dist/index.html',original=readFileSync(hostPath,'utf8');
writeFileSync(hostPath,original.replace('function sceneTick(time) {',`window.__qaFarm=()=>({time:sceneState.farmTime,sample:sampleCampaignFarm(sceneState.farmTime,savedSceneSquad(),false,farmAttackSpecs,sceneState.world||campaignWorldForChapter(0))});\nfunction sceneTick(time) {`));
const report={revision:process.env.GITHUB_SHA,runs:[]},pause=ms=>new Promise(r=>setTimeout(r,ms));
const instrument=`window.__media={plays:[],pcm:[],draws:[]};
let sfx;Object.defineProperty(window,'HonVietSfx',{configurable:true,get:()=>sfx,set:bus=>{sfx=bus;const play=bus.play;bus.play=function(event,options){const s=window.__HON_VIET__?.getState?.(),u=window.__HON_VIET__?.getUnits?.().find(u=>u.id===s?.currentId);const row={event,at:performance.now(),actor:s?.currentId,team:u?.team,options:{actionId:options?.actionId,cue:options?.cue},context:window.HonVietAudio?.context?.()?.state};__media.plays.push(row);const result=play.call(this,event,options);Promise.resolve(result).then(ok=>{row.ok=ok;row.end=performance.now()});return result;};}});
const start=AudioBufferSourceNode.prototype.start;AudioBufferSourceNode.prototype.start=function(...args){const r=start.apply(this,args);const data=this.buffer?.getChannelData(0);let peak=0;if(data)for(let i=0;i<data.length;i+=100)peak=Math.max(peak,Math.abs(data[i]));__media.pcm.push({at:performance.now(),state:this.context.state,peak,duration:this.buffer?.duration});return r;};
const draw=CanvasRenderingContext2D.prototype.drawImage;CanvasRenderingContext2D.prototype.drawImage=function(im,...args){const src=im?.src||'';if(src.includes('campaign-vfx-v1')){const farm=window.__qaFarm?.();__media.draws.push({src,time:farm?.time});}return draw.call(this,im,...args);};`;
try{for(const profile of ['desktop','iphone']){
 const browser=await startBrowser(),page=await browser.page(profile==='desktop'?1280:390,profile==='desktop'?800:844,1),run={profile};report.runs.push(run);
 try{
  await page.send('Page.addScriptToEvaluateOnNewDocument',{source:instrument});
  if(profile==='iphone')await page.send('Network.setUserAgentOverride',{userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1',platform:'iPhone'});
  await page.send('Emulation.setCPUThrottlingRate',{rate:4});
  await page.send('Page.navigate',{url:browser.origin+'/'});
  await page.wait('!!document.getElementById("hvLoginContinue")',40000);await page.click('#hvLoginContinue');await page.wait('document.getElementById("hvLoginRoot").hidden');
  await page.click('#hubScreen [data-art-go="campaign"]');await page.wait('!!window.__qaFarm&&!document.getElementById("hvCampaignScene").hidden');
  await page.wait('__qaFarm().time>18500',65000);
  run.afk=await page.evaluate('({farm:__qaFarm(),draws:__media.draws})');
  console.log('FIRST_MEDIA_IMAGE:'+profile+':afk:'+(await page.send('Page.captureScreenshot',{format:'jpeg',quality:65})).data);
  await page.click('#hvCampaignScene [data-hv-afk-challenge]');await page.wait('!!document.querySelector("[data-scene-action=launch]")');await page.click('#hvCampaignScene [data-scene-action=launch]');
  const samples=[],begin=Date.now();
  while(Date.now()-begin<110000){
   try{const s=await page.evaluate(`(()=>{const w=document.getElementById('hvBattleFrame')?.contentWindow?.__HON_VIET__?document.getElementById('hvBattleFrame').contentWindow:window;const api=w.__HON_VIET__;if(!api)return null;const st=api.getState();return {mode:st.mode,count:st.actionCount,current:st.currentId,units:api.getUnits().map(u=>({id:u.id,team:u.team})),media:w.__media,host:__media,timing:w.HonVietSfx?.timingEvents?.(),cues:w.__HV_AUTHORED_AUDIO_QA?.events?.(),ready:w.__HV_BATTLE_ASSET_QA?.events?.()}})()`);if(s){samples.push({count:s.count,current:s.current,mode:s.mode});run.battle=s;if(s.count>=10||s.mode==='result')break;}}catch{}
   await pause(120);
  }
  run.samples=samples.filter((s,i)=>i===0||s.current!==samples[i-1].current||s.count!==samples[i-1].count);
  console.log('FIRST_MEDIA_IMAGE:'+profile+':battle:'+(await page.send('Page.captureScreenshot',{format:'jpeg',quality:65})).data);
  run.exceptions=page.events.filter(e=>e.method==='Runtime.exceptionThrown').map(e=>e.params.exceptionDetails.text);
  run.assetErrors=page.events.filter(e=>e.method==='Network.responseReceived'&&e.params.response.status>=400&&e.params.response.url.includes('/assets/')).map(e=>e.params.response.url);
 }catch(e){run.error=String(e.stack||e);}finally{await page.close();await browser.close();}
}}finally{writeFileSync(hostPath,original);console.log('FIRST_MEDIA_REPORT:'+JSON.stringify(report));}
