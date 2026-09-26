import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { startBrowser } from './qa-battle-readiness-browser.mjs';

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const HEROES = [
  ['luc-anh','Lục Ảnh','qa-luc-anh'],
  ['dinh-loi','Đình Lôi','qa-dinh-loi'],
  ['ong-pho','Ông Phở','ong-pho-gif-test'],
  ['thay-mo','Thầy Mo','qa-thay-mo'],
  ['linh-dong','Linh Đồng','qa-linh-dong'],
  ['bach-dien','Bạch Diện','qa-bach-dien']
];
const ACTIONS = ['basic','skill','ultimate'];
const TIMING_LIMIT_MS = 50;
const EXPECTED_EVENT = {
  'linh-dong': action => action === 'ultimate' ? 'linh-dong-ult' : 'linh-dong-atk',
  'bach-dien': action => action === 'ultimate' ? 'bach-dien-ult' : 'bach-dien-atk'
};
function timingContract(row) {
  const evidence = row.result?.evidence;
  const all = Array.isArray(evidence?.audioTiming) ? evidence.audioTiming : [];
  const scoped = all.filter(item => item?.group === 'combat' && (
    item.actionId === row.actionId || String(item.actionId || '').startsWith(row.actionId + ':')
  ));
  const keys = scoped.map(item => [item.actionId,item.event,item.cue].join('|'));
  const duplicates = keys.filter((key,index) => keys.indexOf(key) !== index);
  const expectedEvent = EXPECTED_EVENT[row.hero]?.(row.canonicalAction) || (row.canonicalAction === 'ultimate' ? 'ultimate' : row.canonicalAction === 'skill' ? 'skill' : 'basic');
  const expectedCuePrefix = row.hero === 'ong-pho' ? 'contact:' : 'release:';
  const bad = scoped.filter(item =>
    item.event !== expectedEvent ||
    !String(item.cue || '').startsWith(expectedCuePrefix) ||
    !Number.isFinite(Number(item.cuePerformanceMs)) ||
    !Number.isFinite(Number(item.decodedReadyPerformanceMs)) ||
    !Number.isFinite(Number(item.signedCueOffsetMs)) ||
    Math.abs(Number(item.signedCueOffsetMs)) > TIMING_LIMIT_MS ||
    (row.hero === 'ong-pho' ? item.sampleCue !== 'dominant' : item.sampleCue !== 'onset')
  );
  const voice = Array.isArray(evidence?.audio) ? evidence.audio.filter(item => String(item.kind || '').startsWith('voice') && item.played === true) : [];
  const voiceOk = row.hero !== 'luc-anh' || row.canonicalAction !== 'ultimate' || voice.length > 0;
  return {
    ok: scoped.length > 0 && duplicates.length === 0 && bad.length === 0 && voiceOk,
    limitMs: TIMING_LIMIT_MS,
    expectedEvent,
    expectedCuePrefix,
    count: scoped.length,
    duplicates,
    bad,
    voiceOk,
    voice,
    cues: scoped.map(item => ({
      actionId:item.actionId,event:item.event,cue:item.cue,sampleCue:item.sampleCue,
      cuePerformanceMs:item.cuePerformanceMs,decodedReadyPerformanceMs:item.decodedReadyPerformanceMs,
      audibleLeadInMs:item.audibleLeadInMs,dominantCueMs:item.dominantCueMs,
      sourceScheduledPerformanceMs:item.sourceScheduledPerformanceMs,
      expectedAudiblePerformanceMs:item.expectedAudiblePerformanceMs,
      expectedCuePerformanceMs:item.expectedCuePerformanceMs,
      signedCueOffsetMs:item.signedCueOffsetMs
    }))
  };
}

async function runViewport(browser,out,name,width,height,dpr,targetBase) {
  const page = await browser.page(width,height,dpr);
  const run = { name,width,height,dpr,actions:[],screenshots:[],errors:[] };
  try {
    await page.send('Page.navigate',{url:targetBase+'/skill-test.html'});
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
        row.movementStart = await page.evaluate(`document.querySelector('#battleFrame').contentWindow.__HV_SKILL_MOVEMENT_QA?.events().length ?? 0`);
        await page.wait(`!document.querySelector('[data-action="${action}"]').disabled`);
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
          const movement=w.__HV_SKILL_MOVEMENT_QA?.events().slice(${row.movementStart})||[];
          return {lastRun:q.lastRun,status:document.querySelector('#status').dataset.phase,home:u?Math.hypot(u.x-u.baseX,u.y-u.baseY):9999,hp:u?.hp||0,movement,evidence:window.SkillTestEvidence?.last?.()||null};
        })()`);
        row.ok = row.result.lastRun.started===true && row.result.lastRun.impact===true && row.result.lastRun.complete===true && row.result.home<=2 && row.result.hp>0;
        row.timing = timingContract(row);
        row.timingOk = row.timing.ok;
        row.ok = row.ok && row.timingOk;
        if (heroKey==='luc-anh') {
          const snap=row.result.movement.find(event=>event.type==='approach:snap'&&event.actorId===heroId);
          row.snapApproach=!!snap;
          row.snapPosition=snap?.position||null;
          row.snapDestination=snap?.destination||null;
          row.ok = row.ok && row.snapApproach && JSON.stringify(row.snapPosition)===JSON.stringify(row.snapDestination);
        }
        if (!(row.result.lastRun.started===true && row.result.lastRun.impact===true && row.result.lastRun.complete===true && row.result.home<=2 && row.result.hp>0)) {
          throw new Error(heroName+' '+action+' failed direct skill-test interaction contract');
        }
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
    run.criticalHttpErrors = run.httpErrors.filter(item=>!item.url.includes('/favicon.ico'));
    run.networkFailures = page.events.filter(event=>event.method==='Network.loadingFailed').map(event=>event.params);
    run.criticalNetworkFailures = run.networkFailures.filter(item=>!(item.canceled===true && item.type==='Media'));
    run.qaErrors = await page.evaluate('window.__SKILL_TEST_QA__.errors');
    run.ok = run.actions.every(item=>item.ok) && run.afterReset.ready===true && run.afterReset.resetCount>=1 && run.exceptions.length===0 && run.criticalHttpErrors.length===0 && run.criticalNetworkFailures.length===0 && run.qaErrors.length===0;
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
  const targetBase=(process.env.SKILL_TEST_BASE_URL||browser.origin).replace(/\/+$/,'');
  const report={targetBase,scope:'Direct skill-test.html controller over real generated 6v6 battle runtime; six authored owners, 16 canonical actions plus Linh Đồng/Bạch Diện Skill→ATK aliases, plus Reset. Chromium only; not physical iPhone/iPad/Safari.',revision:process.env.GITHUB_SHA||'local',runs:[],ok:false};
  try {
    for (const viewport of [['desktop',1280,800,1],['mobile',390,844,2]]) {
      report.runs.push(await runViewport(browser,out,...viewport,targetBase));
      writeFileSync(resolve(out,'report.json'),JSON.stringify(report,null,2));
    }
    report.ok=report.runs.every(item=>item.ok);
    writeFileSync(resolve(out,'report.json'),JSON.stringify(report,null,2));
    console.log(JSON.stringify({ok:report.ok,runs:report.runs.map(item=>({name:item.name,ok:item.ok,actions:item.actions.map(row=>({hero:row.hero,action:row.action,ok:row.ok,timingOk:row.timingOk,actionId:row.actionId,snapApproach:row.snapApproach,maxOffsetMs:row.timing?.cues?.length?Math.max(...row.timing.cues.map(c=>Math.abs(Number(c.signedCueOffsetMs)||0))):null,timingCount:row.timing?.count||0})),afterReset:item.afterReset,errors:item.errors,exceptions:item.exceptions?.length,httpErrors:item.httpErrors?.length,criticalHttpErrors:item.criticalHttpErrors?.length,networkFailures:item.networkFailures?.length,criticalNetworkFailures:item.criticalNetworkFailures?.length,qaErrors:item.qaErrors?.length}))},null,2));
    if(!report.ok) process.exitCode=1;
  } finally {
    await browser.close();
  }
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await run();
