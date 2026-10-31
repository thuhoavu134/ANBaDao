// Real-host result-screen probe for typography + reward-icon work.
// No gameplay is mocked: login -> campaign scene -> real prepare -> real launch ->
// real battle -> instant skip, then the real #integratedResultV6 overlay is read.
// Fixtures only move the save's stage pointer / squad size; combat, rewards and
// amounts stay the production ones.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = resolve('C:/lt/wt-result-icons');
const OUT = join(ROOT, 'docs/qa/result-type-icons');
mkdirSync(OUT, { recursive: true });
const { startBrowser } = await import(pathToFileURL(join(ROOT, 'scripts/qa-battle-readiness-browser.mjs')).href);

const tag = process.argv[2] || 'baseline';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const DPR = Number(process.env.QA_DPR || 2);

const PROBE = `(()=>{
  const doc=document.getElementById('hvBattleFrame')?.contentDocument||document;
  const root=doc.getElementById('integratedResultV6');
  if(!root)return {missing:true,href:doc.location?doc.location.href:null};
  const box=el=>{if(!el)return null;const r=el.getBoundingClientRect();const cs=getComputedStyle(el);
    const o={x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height),
      display:cs.display,opacity:cs.opacity,z:cs.zIndex,visibility:cs.visibility,font:cs.fontFamily,
      fontSize:cs.fontSize};
    if(el.tagName==='IMG'){o.src=el.getAttribute('src');o.natural=[el.naturalWidth,el.naturalHeight];}
    return o;};
  const loot=[...root.querySelectorAll('.irv-loot')].map(el=>{
    const img=el.querySelector('img'),r=el.getBoundingClientRect();
    const ib=img?img.getBoundingClientRect():null;
    return {id:el.dataset.rewardId||null,text:(el.textContent||'').replace(/\\s+/g,' ').trim(),
      icon:img?img.getAttribute('src'):null,natural:img?[img.naturalWidth,img.naturalHeight]:null,
      tile:[Math.round(r.width),Math.round(r.height)],
      imgBox:ib?[Math.round(ib.width),Math.round(ib.height)]:null,
      imgOk:img?!!(img.complete&&img.naturalWidth>0):null};
  });
  const tips=[...root.querySelectorAll('.irv-tip')].map(el=>{
    const img=el.querySelector('img');
    return {text:(el.textContent||'').trim(),icon:img?img.getAttribute('src'):null,
      ok:img?!!(img.complete&&img.naturalWidth>0):null};
  });
  const over=[...root.querySelectorAll('*')].filter(el=>{const r=el.getBoundingClientRect();
    return r.width>0&&(r.right>innerWidth+1.5||r.left<-1.5);}).slice(0,8)
    .map(el=>({tag:el.tagName,cls:String(el.className).slice(0,44),
      rect:[Math.round(el.getBoundingClientRect().left),Math.round(el.getBoundingClientRect().right)]}));
  const imgs=[...root.querySelectorAll('img')].map(i=>({src:(i.getAttribute('src')||'').split('/').pop(),
    ok:i.complete&&i.naturalWidth>0,natural:[i.naturalWidth,i.naturalHeight]}));
  return {phase:root?root.className:null,viewport:[innerWidth,innerHeight],dpr:devicePixelRatio,
    word:box(root.querySelector('.irv-word')),title:box(root.querySelector('.irv-title')),
    stage:box(root.querySelector('.irv-stage')),card:box(root.querySelector('.irv-card')),
    hero:box(root.querySelector('.irv-hero-wrap')),
    result:box(root.querySelector('.irv-result')),
    resultHead:root.querySelector('.irv-result h1')?.textContent||null,
    resultMeta:root.querySelector('.irv-result p')?.textContent||null,
    rewards:box(root.querySelector('.irv-rewards')),
    rewardHead:root.querySelector('.irv-rewards h2')?.textContent||null,
    note:root.querySelector('.irv-reward-note')?.textContent||null,
    actions:box(root.querySelector('.irv-actions')),
    buttons:[...root.querySelectorAll('.irv-btn')].map(b=>({label:b.textContent.trim(),box:box(b)})),
    loot,tips,overflow:over,scrollW:doc.documentElement.scrollWidth,imgs};
})()`;

async function shot(page, file) {
  for (let i = 0; i < 3; i++) {
    try { await page.screenshot(file); return true; } catch { await sleep(2500); }
  }
  return false;
}

async function runCase(browser, { result, width, height, chapter, stage, squad, level, stars }) {
  const run = { result, width, height, dpr: DPR, chapter, stage, squad, level, stars };
  const p = await browser.page(width, height, DPR);
  try {
    await p.send('Page.navigate', { url: browser.origin + '/' });
    await p.wait('!!document.getElementById("hvLoginContinue")', 20000);
    await p.click('#hvLoginContinue');
    await p.wait('document.getElementById("hvLoginRoot").hidden===true', 20000);
    await p.wait('!!document.querySelector("#hubScreen [data-art-go=\\"campaign\\"]")', 20000);

    // Fixture: stage pointer + squad size only.
    run.fixture = await p.evaluate(`(()=>{
      if(typeof P==='undefined'||!P)return 'no-P';
      P.clearedChapters=[...Array(${chapter}).keys()];
      P.unlockedChapters=[...Array(${chapter + 1}).keys()];
      P.campaignStages=P.campaignStages||{};
      P.campaignStages[${chapter}]=${stage};
      if(${squad}>0)P.squad=(P.squad||[]).slice(0,${squad});
      const lv=${level},st=${stars};
      for(const s of P.squad){const h=P.heroes&&P.heroes[s.id];if(h){h.level=lv;h.stars=st;h.owned=true;}}
      try{persist();}catch(e){return 'persist-fail:'+e.message;}
      return {cleared:P.clearedChapters.length,squad:P.squad.length,chapters:DATA.chapters.length};
    })()`);

    await p.click('#hubScreen [data-art-go="campaign"]');
    await p.wait('!document.getElementById("hvCampaignScene").hidden', 20000);
    await p.wait('!!document.querySelector("#hvCampaignScene .cs-primary.cs-challenge")', 20000);
    run.stageLabel = await p.evaluate('(document.querySelector("#hvCampaignScene .cs-stage-pill")?.textContent||"").trim()');
    await p.click('#hvCampaignScene .cs-primary.cs-challenge');
    await p.wait('!!document.querySelector(".cs-prepare") && !document.querySelector(".cs-prepare").hidden', 25000);
    await p.wait('!!document.querySelector("[data-scene-action=\\"launch\\"]")', 20000);
    await p.click('[data-scene-action="launch"]');

    const f = '(document.getElementById("hvBattleFrame")?.contentWindow?.__HON_VIET__?document.getElementById("hvBattleFrame").contentWindow:window)';
    await p.wait(f + '.__HON_VIET__?.getState().mode==="battle"', 90000);
    await p.wait(f + '.__HON_VIET__.getState().actionCount>=1', 120000);

    const skip = await p.evaluate('(()=>{const f=document.getElementById("hvBattleFrame"),d=f?.contentDocument||document,b=d.querySelector("#embeddedSkipButton");if(!b)return null;const r=f?f.getBoundingClientRect():{x:0,y:0},q=b.getBoundingClientRect();return {x:r.x+q.x+q.width/2,y:r.y+q.y+q.height/2,w:q.width,h:q.height};})()');
    run.skipButton = skip;
    if (!skip?.w) throw new Error('skip button not visible');
    await p.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: skip.x, y: skip.y, button: 'left', clickCount: 1 });
    await p.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: skip.x, y: skip.y, button: 'left', clickCount: 1 });

    await p.wait(f + '.__HON_VIET__.getState().mode==="result"', 60000);
    await p.wait(f + '.document.querySelector("#integratedResultV6.show")', 30000);
    await sleep(1200);

    const state = await p.evaluate(f + '.__HON_VIET__.getState()');
    run.winner = state.result;
    run.rounds = state.round;
    run.actions = state.actionCount;
    run.probe = await p.evaluate(PROBE);
    run.consoleErrors = p.events.filter(e => e.method === 'Runtime.exceptionThrown')
      .map(e => e.params.exceptionDetails.exception?.description || e.params.exceptionDetails.text);
    // Only real asset 404s matter here; /api/health has no server in a static dist.
    run.assetErrors = p.events.filter(e => e.method === 'Network.responseReceived' && e.params.response.status >= 400 && /\/assets\//.test(e.params.response.url))
      .map(e => e.params.response.url);

    run.screenshot = join(OUT, `${tag}-${result}-${width}.png`);
    run.shotOk = await shot(p, run.screenshot);

    run.beforeConfirm = await p.evaluate('({gold:(typeof P!=="undefined"&&P)?P.gold:null,gems:(typeof P!=="undefined"&&P)?P.gems:null,url:location.href})');
    await p.evaluate(`(()=>{const f=document.getElementById('hvBattleFrame');const d=f&&f.contentWindow&&f.contentWindow.__HON_VIET__?f.contentWindow.document:document;const b=d.querySelector('#integratedResultV6 [data-result-action="confirm"]');if(!b)return 'no-button';b.click();return 'clicked';})()`);
    await sleep(2000);
    run.afterConfirm = await p.evaluate(`(()=>{
      const bf=document.getElementById('hvBattleFrame');
      const d=bf?bf.contentDocument:document;
      return {url:location.href,resultVisible:!!d.querySelector('#integratedResultV6.show'),
        frameAlive:!!bf, overlayOpen:!!document.getElementById('hvBattleOverlay')?.classList.contains('is-open'),
        gold:(typeof P!=='undefined'&&P)?P.gold:null,stage:(typeof ST!=='undefined')?[ST.chapterIdx,ST.campaignBattleIndex]:null};})()`);
    await shot(p, join(OUT, `${tag}-${result}-${width}-after-confirm.png`));
    run.ok = !run.consoleErrors.length && !run.assetErrors.length && run.shotOk;
  } catch (error) {
    run.ok = false;
    run.error = String(error.stack || error).split('\n').slice(0, 2).join(' | ');
    await shot(p, join(OUT, `${tag}-${result}-${width}-FAIL.png`));
  } finally {
    await p.close();
  }
  return run;
}

const caseList = [
  { result: 'victory', chapter: 5, stage: 1, squad: 6, level: 120, stars: 6 }, // Ải 6–2, the owner's screenshot stage
  { result: 'defeat', chapter: 5, stage: 1, squad: 6, level: 1, stars: 1 },    // same encounter, default squad
];

const browser = await startBrowser();
const report = { tag, when: new Date().toISOString(), dpr: DPR, runs: [] };
try {
  for (const c of caseList) {
    for (const [width, height] of [[375, 812], [430, 932]]) {
      report.runs.push(await runCase(browser, { ...c, width, height }));
    }
  }
} finally {
  report.ok = report.runs.every(r => r.ok);
  writeFileSync(join(OUT, `result-${tag}.json`), JSON.stringify(report, null, 2) + '\n');
  console.log('RESULT_REPORT:' + JSON.stringify(report.runs.map(r => ({
    result: r.result, width: r.width, ok: r.ok, winner: r.winner, stage: r.stageLabel,
    err: r.error || null
  }))));
  await browser.close();
}
if (!report.ok) process.exitCode = 1;
