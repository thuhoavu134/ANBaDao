// Production shell -> guest -> Chinh Chien -> formation -> iframe.
// All roster changes use visible controls in a fresh local guest save.
import { startBrowser } from './qa-battle-readiness-browser.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve, join } from 'node:path';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const out=resolve('evidence/host');mkdirSync(out,{recursive:true});
const report={revision:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),scope:'Actual shell/iframe with UI-only local guest setup; no API, roster or media mocks; not physical iOS',steps:[],battles:[],errors:[]};
const browser=await startBrowser(),page=await browser.page(390,844,2);
const take=async name=>{await page.screenshot(join(out,name+'.png'));report.steps.push({step:name,at:Date.now(),screenshot:name+'.png'});};
async function click(selector,inFrame=false){
  const p=await page.evaluate(`(()=>{const frame=document.getElementById('hvBattleFrame');const doc=${inFrame?'frame?.contentDocument':'document'};const el=doc?.querySelector(${JSON.stringify(selector)});if(!el)return null;el.scrollIntoView({block:'center',inline:'center'});const r=el.getBoundingClientRect(),f=${inFrame?'frame.getBoundingClientRect()':'{x:0,y:0}'};return {x:f.x+r.x+r.width/2,y:f.y+r.y+r.height/2,w:r.width,h:r.height,disabled:el.disabled};})()`);
  if(!p||!p.w||!p.h||p.disabled)throw new Error('Host control unavailable: '+selector);
  await page.send('Input.dispatchMouseEvent',{type:'mousePressed',x:p.x,y:p.y,button:'left',clickCount:1});
  await page.send('Input.dispatchMouseEvent',{type:'mouseReleased',x:p.x,y:p.y,button:'left',clickCount:1});
  await sleep(180);
}
const stateExpression=`(()=>{const w=document.getElementById('hvBattleFrame')?.contentWindow;if(!w?.__HON_VIET__)return null;const s=w.__HON_VIET__.getState();return {state:{mode:s.mode,battleId:s.battleId,round:s.round,actionCount:s.actionCount,currentId:s.currentId,auto:s.auto,speed:s.speed,sound:s.sound},units:w.__HON_VIET__.getUnits(),paints:w.__HV_BATTLE_ASSET_QA?.paints(),cache:w.__HV_BATTLE_ASSET_QA?.inspect(),events:w.__HV_BATTLE_ASSET_QA?.events(),parentDataset:{...document.documentElement.dataset},parentAudio:window.__qaAudio||[],frameAudio:w.__qaAudio||[],frameUrl:w.location.href};})()`;
try{
  await page.send('Page.addScriptToEvaluateOnNewDocument',{source:`window.__qaAudio=[];const original=AudioBufferSourceNode.prototype.start;AudioBufferSourceNode.prototype.start=function(...args){const result=original.apply(this,args);let peak=0;const data=this.buffer?.getChannelData(0);if(data)for(let i=0;i<data.length;i+=Math.max(1,Math.floor(data.length/3000)))peak=Math.max(peak,Math.abs(data[i]));__qaAudio.push({at:Date.now(),state:this.context.state,duration:this.buffer?.duration,peak});return result;};`});
  await page.send('Page.navigate',{url:browser.origin+'/'});
  await page.wait('!!document.querySelector("#hvLoginContinue")',30000);await take('login');
  await click('#hvLoginContinue');
  await page.wait('document.querySelector("#hvLoginRoot")?.hidden === true',20000);await take('hub');
  for(let pass=1;pass<=2;pass++){
    await click('#hubScreen [data-art-go="campaign"]');
    await page.wait('!!document.querySelector("#hvCampaignScene [data-hv-afk-challenge]")');await take('campaign-'+pass);
    await click('#hvCampaignScene [data-hv-afk-challenge]');
    await page.wait('document.querySelector("#hvCampaignScene .cs-prepare")?.hidden === false');
    if(pass===1){
      for(const id of ['linh_dong','bach_dien']){
        const deployed=await page.evaluate(`Array.from(document.querySelectorAll('#hvCampaignScene [data-scene-hero].is-deployed'),el=>el.dataset.sceneHero)`);
        if(!deployed.includes(id)){
          if(deployed.length>=6)await click('#hvCampaignScene [data-scene-hero="'+deployed.find(x=>!['linh_dong','bach_dien'].includes(x))+'"]');
          await click('#hvCampaignScene [data-scene-hero="'+id+'"]');
        }
      }
      for(const id of ['ong_hang_pho','dinh_loi','thay_mo','lac_yen','cung_thu_tre','co_dao_ganh_hoi']){
        const deployed=await page.evaluate(`Array.from(document.querySelectorAll('#hvCampaignScene [data-scene-hero].is-deployed'),el=>el.dataset.sceneHero)`);
        if(deployed.length>=6)break;
        if(!deployed.includes(id))await click('#hvCampaignScene [data-scene-hero="'+id+'"]');
      }
    }
    await take('formation-'+pass);
    await click('#hvCampaignScene [data-scene-action="launch"]');
    await page.wait('document.getElementById("hvBattleFrame")?.contentWindow?.__HON_VIET__?.getState().mode === "battle"',45000);
    await take('battle-'+pass+'-start');
    const battle={pass,samples:[],startedAt:Date.now()};report.battles.push(battle);
    await click('#embeddedSpeedBadge',true);await click('#embeddedSpeedBadge',true);
    const wanted=['linh-dong:atkVfx','bach-dien:atkVfx'];
    while(Date.now()-battle.startedAt<75000){
      const sample=await page.evaluate(stateExpression);if(!sample)throw new Error('Battle iframe lost');
      battle.samples.push({at:Date.now(),...sample});
      if(sample.events?.some(e=>e.type==='assets:failed'))throw new Error('Host action asset load failure');
      if(wanted.every(key=>(sample.paints?.[key]||0)>0)&&sample.state.actionCount>=3&&sample.events?.some(e=>e.type==='sfx:played'))break;
      if(sample.state.mode!=='battle')break;
      await sleep(300);
    }
    battle.final=await page.evaluate(stateExpression);await take('battle-'+pass+'-effects');
    battle.ok=wanted.every(key=>(battle.final.paints?.[key]||0)>0)&&battle.final.state.actionCount>=3&&battle.final.parentAudio.some(e=>e.state==='running'&&e.peak>0)&&battle.final.events?.some(e=>e.type==='sfx:played');
    if(!battle.ok)throw new Error('Host battle '+pass+' missing action/VFX/shared-audio coverage');
    await click('[data-ref-nav="hub"]',true);
    await page.wait('!document.getElementById("hvBattleOverlay")?.classList.contains("is-open")',10000);
    await take('return-hub-'+pass);
  }

  // Exercise the top-level return transport used when a nested iframe cannot host
  // battle.html (notably the Safari/Grok fallback). This is a synthetic handoff
  // event only; the two combat sessions above remain real browser battles.
  const fallbackSeed=await page.evaluate(`(()=>{const idx=0,stageIndex=Math.max(0,Math.floor(Number(P.campaignStages?.[idx]||0)));const sessionId='qa-top-return-'+Date.now().toString(36);sessionStorage.setItem('hvBattleHostLease',JSON.stringify({sessionId,battleId:'qa-fallback',mode:'campaign',chapterIdx:idx,campaignBattleIndex:stageIndex}));sessionStorage.setItem('hvBattleHostEvent',JSON.stringify({source:'hon-viet-battle',type:'battle-result',payload:{sessionId,battleId:'qa-fallback',win:true,winner:'player',round:3,actionCount:6,units:[],rewards:[]}}));return {idx,stageIndex,sessionId};})()`);
  await page.send('Page.navigate',{url:browser.origin+'/?hvBattleReturn=1'});
  await page.wait(`typeof P!=='undefined'&&Number(P.campaignStages?.[${fallbackSeed.idx}]||0)===${fallbackSeed.stageIndex+1}&&typeof ST!=='undefined'&&ST.mode==='campaign'`,30000);
  await take('top-return-auto-next');
  report.fallback=await page.evaluate(`(()=>({stage:Number(P.campaignStages?.[${fallbackSeed.idx}]||0),mode:ST.mode,screen:document.querySelector('.screen.active')?.id||'',battleActive:Boolean(window.HonVietMetaBridge?.isActive?.()),url:location.href}))()`);
  report.fallback={...fallbackSeed,...report.fallback,ok:report.fallback.stage===fallbackSeed.stageIndex+1&&report.fallback.mode==='campaign'};
  if(!report.fallback.ok)throw new Error('Top-level battle return did not resume the next campaign encounter');

  report.exceptions=page.events.filter(e=>e.method==='Runtime.exceptionThrown');
  report.httpErrors=page.events.filter(e=>e.method==='Network.responseReceived'&&e.params.response.status>=400).map(e=>({url:e.params.response.url,status:e.params.response.status}));
  report.criticalHttpErrors=report.httpErrors.filter(e=>!e.url.endsWith('/favicon.ico')&&!new URL(e.url).pathname.startsWith('/api/'));
  report.ok=report.battles.length===2&&report.battles.every(b=>b.ok)&&report.fallback?.ok===true&&report.exceptions.length===0&&report.criticalHttpErrors.length===0;
}catch(error){report.ok=false;report.errors.push(String(error.stack||error));try{await take('failure');report.failure=await page.evaluate(`({url:location.href,text:document.body.innerText.slice(0,2500),buttons:Array.from(document.querySelectorAll('button'),b=>({id:b.id,text:b.textContent,hidden:!b.getClientRects().length})).filter(b=>!b.hidden).slice(-30)})`);}catch{}report.exceptions=page.events.filter(e=>e.method==='Runtime.exceptionThrown');}
finally{writeFileSync(join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({ok:report.ok,steps:report.steps.map(s=>s.step),battles:report.battles.map(b=>({pass:b.pass,ok:b.ok,state:b.final?.state})),fallback:report.fallback,errors:report.errors},null,2));await page.close();await browser.close();}
if(!report.ok)process.exitCode=1;
