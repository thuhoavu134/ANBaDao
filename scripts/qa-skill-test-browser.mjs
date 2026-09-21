import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { startBrowser } from './qa-battle-readiness-browser.mjs';

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const HEROES = [
  ['luc-anh','Lục Ảnh','qa-luc-anh'],
  ['dinh-loi','Đình Lôi','qa-dinh-loi'],
  ['ong-pho','Ông Phở','ong-pho-gif-test']
];
const ACTIONS = ['basic','skill','ultimate'];

async function runViewport(browser,out,name,width,height,dpr) {
  const page = await browser.page(width,height,dpr);
  const run = { name,width,height,dpr,actions:[],screenshots:[],errors:[] };
  try {
    await page.send('Page.navigate',{url:browser.origin+'/skill-test.html'});
    await page.wait('window.__SKILL_TEST_QA__?.ready===true',30000);
    await page.screenshot(resolve(out,name+'-initial.png'));
    run.screenshots.push(name+'-initial.png');
    run.initial = await page.evaluate(`(()=>{
      const q=window.__SKILL_TEST_QA__, f=document.querySelector('#battleFrame'), r=f.getBoundingClientRect();
      return {ready:q.ready,selectedHero:q.selectedHero,frame:{x:r.x,y:r.y,w:r.width,h:r.height},body:{w:document.documentElement.scrollWidth,h:document.documentElement.scrollHeight,clientW:document.documentElement.clientWidth,clientH:document.documentElement.clientHeight}};
    })()`);
    if (run.initial.body.w>run.initial.body.clientW+1) throw new Error('skill-test page overflows horizontally');
    if (run.initial.frame.w<300 || run.initial.frame.h<300) throw new Error('battle iframe too small for direct testing');

    for (const [heroKey,heroName,heroId] of HEROES) {
      await page.click(`[data-hero-tab="${heroKey}"]`);
      await page.wait(`window.__SKILL_TEST_QA__.selectedHero===${JSON.stringify(heroKey)}`);
      for (const action of ACTIONS) {
        const row = { hero:heroKey,heroName,action };
        run.actions.push(row);
        await page.click(`[data-action="${action}"]`);
        await page.wait(`window.__SKILL_TEST_QA__.lastRun?.hero===${JSON.stringify(heroKey)}&&window.__SKILL_TEST_QA__.lastRun?.action===${JSON.stringify(action)}&&window.__SKILL_TEST_QA__.lastRun?.started===true`,15000);
        row.actionId = await page.evaluate('window.__SKILL_TEST_QA__.lastRun.actionId');
        await page.wait('window.__SKILL_TEST_QA__.lastRun?.impact===true',20000);
        const shot = name+'-'+heroKey+'-'+action+'-impact.png';
        await page.screenshot(resolve(out,shot));
        run.screenshots.push(shot);
        await page.wait('window.__SKILL_TEST_QA__.lastRun?.complete===true',30000);
        row.result = await page.evaluate(`(()=>{
          const q=window.__SKILL_TEST_QA__, w=document.querySelector('#battleFrame').contentWindow;
          const u=w.__HON_VIET__.getUnits().find(item=>item.id===${JSON.stringify(heroId)});
          return {lastRun:q.lastRun,status:document.querySelector('#status').dataset.phase,home:u?Math.hypot(u.x-u.baseX,u.y-u.baseY):9999,hp:u?.hp||0};
        })()`);
        row.ok = row.result.lastRun.started===true && row.result.lastRun.impact===true && row.result.lastRun.complete===true && row.result.home<=2 && row.result.hp>0;
        if (!row.ok) throw new Error(heroName+' '+action+' failed direct skill-test interaction contract');
        await sleep(180);
      }
    }

    const beforeReset = await page.evaluate('window.__SKILL_TEST_QA__.sessionIndex');
    await page.click('#resetBattle');
    await page.wait(`window.__SKILL_TEST_QA__.ready===true&&window.__SKILL_TEST_QA__.sessionIndex>${beforeReset}`,30000);
    run.afterReset = await page.evaluate('({sessionIndex:window.__SKILL_TEST_QA__.sessionIndex,resetCount:window.__SKILL_TEST_QA__.resetCount,ready:window.__SKILL_TEST_QA__.ready})');
    await page.screenshot(resolve(out,name+'-reset.png'));
    run.screenshots.push(name+'-reset.png');

    run.exceptions = page.events.filter(event=>event.method==='Runtime.exceptionThrown');
    run.httpErrors = page.events.filter(event=>event.method==='Network.responseReceived'&&event.params.response.status>=400).map(event=>({url:event.params.response.url,status:event.params.response.status}));
    run.networkFailures = page.events.filter(event=>event.method==='Network.loadingFailed').map(event=>event.params);
    run.qaErrors = await page.evaluate('window.__SKILL_TEST_QA__.errors');
    run.ok = run.actions.every(item=>item.ok) && run.afterReset.ready===true && run.afterReset.resetCount>=1 && run.exceptions.length===0 && run.httpErrors.length===0 && run.networkFailures.length===0 && run.qaErrors.length===0;
    if (!run.ok) run.errors.push('Direct skill-test browser acceptance failed.');
  } catch (error) {
    run.ok=false;
    run.errors.push(String(error.stack||error));
    run.exceptions=page.events.filter(event=>event.method==='Runtime.exceptionThrown');
    try { await page.screenshot(resolve(out,name+'-failure.png')); run.screenshots.push(name+'-failure.png'); } catch {}
  } finally {
    await page.close();
  }
  return run;
}

export async function run() {
  const out=resolve('evidence/skill-test');
  mkdirSync(out,{recursive:true});
  const browser=await startBrowser();
  const report={scope:'Direct skill-test.html controller over real generated 6v6 battle runtime; all 3 authored heroes Basic/Skill/Ultimate plus Reset. Chromium only; not physical iPhone.',revision:process.env.GITHUB_SHA||'local',runs:[],ok:false};
  try {
    for (const viewport of [['desktop',1280,800,1],['mobile',390,844,2]]) {
      report.runs.push(await runViewport(browser,out,...viewport));
      writeFileSync(resolve(out,'report.json'),JSON.stringify(report,null,2));
    }
    report.ok=report.runs.every(item=>item.ok);
    writeFileSync(resolve(out,'report.json'),JSON.stringify(report,null,2));
    console.log(JSON.stringify({ok:report.ok,runs:report.runs.map(item=>({name:item.name,ok:item.ok,actions:item.actions.map(row=>({hero:row.hero,action:row.action,ok:row.ok,actionId:row.actionId})),afterReset:item.afterReset,errors:item.errors,exceptions:item.exceptions?.length,httpErrors:item.httpErrors?.length,networkFailures:item.networkFailures?.length,qaErrors:item.qaErrors?.length}))},null,2));
    if(!report.ok) process.exitCode=1;
  } finally {
    await browser.close();
  }
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await run();
