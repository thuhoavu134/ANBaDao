import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { startBrowser } from './qa-battle-readiness-browser.mjs';

const browser=await startBrowser();
const out=resolve(process.env.HV_ENTRY_EVIDENCE_DIR||'evidence/formation-entry');
mkdirSync(out,{recursive:true});
const report={revision:process.env.GITHUB_SHA||'local',scope:'P0 transport + re-entry: guest -> campaign -> battle -> >=2 actions -> return -> second battle -> >=2 actions. Chromium desktop and emulated iPhone code path; not physical WebKit.',runs:[]};
const readyExpr="(()=>{const frame=document.getElementById('hvBattleFrame');const iframeApi=frame?.contentWindow?.__HON_VIET__;const directApi=window.__HON_VIET__;const api=iframeApi||directApi;return !!api&&api.getState().mode==='battle';})()";
const actionExpr="(()=>{const frame=document.getElementById('hvBattleFrame');const api=frame?.contentWindow?.__HON_VIET__||window.__HON_VIET__;return !!api&&api.getState().actionCount>=2;})()";
const snapshotExpr="(()=>{const frame=document.getElementById('hvBattleFrame');const iframeApi=frame?.contentWindow?.__HON_VIET__;const directApi=window.__HON_VIET__;const api=iframeApi||directApi;if(!api)return null;return {transport:location.pathname.endsWith('/battle.html')?'top-level':(iframeApi?'iframe':'host'),href:location.href,state:api.getState(),units:api.getUnits().map(u=>({id:u.id,sourceId:u.sourceId||u.sourceHeroId||null,team:u.team,slot:u.slot,baseX:u.baseX,baseY:u.baseY,x:u.x,y:u.y,hp:u.hp}))};})()";

async function ensureHost(page){
  await page.wait('!!document.getElementById("hvLoginContinue")',30000);
  const loggedIn=await page.evaluate('document.getElementById("hvLoginRoot")?.hidden===true');
  if(!loggedIn){
    await page.click('#hvLoginContinue');
    await page.wait('document.getElementById("hvLoginRoot").hidden',15000);
  }
  await page.wait('!!document.querySelector("#hubScreen [data-art-go=campaign]")',10000);
}

async function launchBattle(page,run,name,cycle){
  await ensureHost(page);
  await page.click('#hubScreen [data-art-go="campaign"]');
  await page.wait('document.querySelector("[data-scene-action=prepare]") && !document.getElementById("hvCampaignScene").hidden',15000);
  await page.click('#hvCampaignScene [data-hv-afk-challenge]');
  await page.wait('!document.querySelector(".cs-prepare").hidden',15000);
  const prep=name+'-'+cycle+'-prepare.png';await page.screenshot(join(out,prep));run.screenshots.push(prep);
  await page.click('[data-scene-action="launch"]');
  await page.wait(readyExpr,45000);
  await page.wait(actionExpr,60000);
  const snapshot=await page.evaluate(snapshotExpr);
  const shot=name+'-'+cycle+'-battle.png';await page.screenshot(join(out,shot));run.screenshots.push(shot);
  return snapshot;
}

async function returnFromBattle(page,snapshot){
  if(snapshot?.transport==='top-level'){
    await page.click('#exitBattleButton');
    await page.wait("location.pathname.endsWith('/index.html') || location.pathname==='/'",30000);
    await ensureHost(page);
    return;
  }
  await page.click('#hvHubBackChip');
  await page.wait('!document.getElementById("hvBattleOverlay").classList.contains("is-open")',30000);
  await ensureHost(page);
}

function inspectEntry(snapshot){
  const units=snapshot?.units||[],player=units.filter(u=>u.team==='player'),enemy=units.filter(u=>u.team==='enemy');
  const unique=team=>new Set(team.map(u=>Number(u.baseX).toFixed(3)+':'+Number(u.baseY).toFixed(3))).size===team.length;
  const finite=units.every(u=>Number.isFinite(Number(u.baseX))&&Number.isFinite(Number(u.baseY)));
  return {
    snapshot,
    roster:{total:units.length,player:player.length,enemy:enemy.length},
    ok:snapshot?.state?.mode==='battle'&&snapshot.state.actionCount>=2&&units.length>0&&unique(player)&&unique(enemy)&&finite
  };
}

try{
  for(const [name,width,height,dpr,iphone] of [['desktop',1280,800,1,false],['iphone-390',390,844,3,true]]){
    const page=await browser.page(width,height,dpr);
    const run={name,width,height,dpr,iphone,entries:[],errors:[],screenshots:[]};report.runs.push(run);
    try{
      if(iphone)await page.send('Emulation.setUserAgentOverride',{userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1',platform:'iPhone'});
      await page.send('Page.navigate',{url:browser.origin+'/'});
      for(let cycle=1;cycle<=2;cycle++){
        const entry=inspectEntry(await launchBattle(page,run,name,cycle));
        entry.cycle=cycle;
        run.entries.push(entry);
        if(!entry.ok)throw new Error('P0 entry '+cycle+' failed: battle must run for >=2 actions with unique finite anchors.');
        if(cycle===1){
          await returnFromBattle(page,entry.snapshot);
          const returned=name+'-'+cycle+'-returned.png';await page.screenshot(join(out,returned));run.screenshots.push(returned);
        }
      }
      run.exceptions=page.events.filter(e=>e.method==='Runtime.exceptionThrown').map(e=>e.params.exceptionDetails?.exception?.description||e.params.exceptionDetails?.text||'runtime exception');
      run.assetErrors=page.events.filter(e=>e.method==='Network.responseReceived'&&e.params.response.status>=400&&new URL(e.params.response.url).pathname.startsWith('/assets/')).map(e=>({url:e.params.response.url,status:e.params.response.status}));
      run.ok=run.entries.length===2&&run.entries.every(entry=>entry.ok)&&!run.exceptions.length&&!run.assetErrors.length;
      if(!run.ok)run.errors.push('P0 re-entry acceptance failed: both launches must progress >=2 actions with no runtime/asset errors.');
    }catch(error){
      run.ok=false;run.errors.push(String(error.stack||error));
      run.exceptions=page.events.filter(e=>e.method==='Runtime.exceptionThrown').map(e=>e.params.exceptionDetails?.exception?.description||e.params.exceptionDetails?.text||'runtime exception');
      try{await page.screenshot(join(out,name+'-failure.png'));}catch{}
    }finally{await page.close();}
  }
}finally{
  report.ok=report.runs.length===2&&report.runs.every(r=>r.ok);
  writeFileSync(join(out,'report.json'),JSON.stringify(report,null,2));
  console.log('FORMATION_ENTRY_REPORT '+JSON.stringify(report));
  await browser.close();
}
if(!report.ok)process.exitCode=1;
