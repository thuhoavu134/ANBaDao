// Close the coverage gap: chapter-final victory (gold + gems + shards tiles) on the REAL result screen.
import { join, resolve } from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const ROOT = resolve('C:/lt/wt-result-icons');
const OUT = join(ROOT, 'docs/qa/result-type-icons');
mkdirSync(OUT, { recursive: true });
const { startBrowser } = await import(pathToFileURL(join(ROOT, 'scripts/qa-battle-readiness-browser.mjs')).href);
const sleep = ms => new Promise(r => setTimeout(r, ms));

const browser = await startBrowser();
const p = await browser.page(375, 812, 2);
const out = { when: new Date().toISOString() };
try {
  await p.send('Page.navigate', { url: browser.origin + '/' });
  await p.wait('!!document.getElementById("hvLoginContinue")', 20000);
  await p.click('#hvLoginContinue');
  await p.wait('document.getElementById("hvLoginRoot").hidden===true', 20000);
  await p.wait('!!document.querySelector("#hubScreen [data-art-go=\\"campaign\\"]")', 20000);

  // Fixture: last mission of the last chapter, levelled squad so the run is a real win.
  out.fixture = await p.evaluate(`(()=>{const ch=5;
    const seq=chapterBattleSequence(ch).length;
    P.clearedChapters=[...Array(ch).keys()];P.unlockedChapters=[...Array(ch+1).keys()];
    P.campaignStages=P.campaignStages||{};P.campaignStages[ch]=seq-1;
    for(const s of P.squad){const h=P.heroes&&P.heroes[s.id];if(h){h.level=140;h.stars=6;h.owned=true;}}
    try{persist();}catch(e){return 'persist:'+e.message;}
    return {chapter:ch,sequence:seq,stageIndex:seq-1};})()`);

  await p.click('#hubScreen [data-art-go="campaign"]');
  await p.wait('!document.getElementById("hvCampaignScene").hidden', 20000);
  await p.wait('!!document.querySelector("#hvCampaignScene .cs-primary.cs-challenge")', 20000);
  out.stageLabel = await p.evaluate('(document.querySelector("#hvCampaignScene .cs-stage-pill")?.textContent||"").trim()');
  await p.click('#hvCampaignScene .cs-primary.cs-challenge');
  await p.wait('!!document.querySelector(".cs-prepare") && !document.querySelector(".cs-prepare").hidden', 25000);
  await p.click('[data-scene-action="launch"]');

  const f = '(document.getElementById("hvBattleFrame")?.contentWindow?.__HON_VIET__?document.getElementById("hvBattleFrame").contentWindow:window)';
  await p.wait(f + '.__HON_VIET__?.getState().mode==="battle"', 90000);
  await p.wait(f + '.__HON_VIET__.getState().actionCount>=1', 120000);
  const skip = await p.evaluate('(()=>{const fr=document.getElementById("hvBattleFrame"),d=fr?.contentDocument||document,b=d.querySelector("#embeddedSkipButton");const r=fr?fr.getBoundingClientRect():{x:0,y:0},q=b.getBoundingClientRect();return {x:r.x+q.x+q.width/2,y:r.y+q.y+q.height/2};})()');
  await p.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: skip.x, y: skip.y, button: 'left', clickCount: 1 });
  await p.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: skip.x, y: skip.y, button: 'left', clickCount: 1 });
  await p.wait(f + '.__HON_VIET__.getState().mode==="result"', 60000);
  await p.wait(f + '.querySelector("#integratedResultV6.show")', 30000);
  await sleep(1100);

  const st = await p.evaluate(f + '.__HON_VIET__.getState()');
  out.winner = st.result;
  out.probe = await p.evaluate(`(()=>{const d=document.getElementById('hvBattleFrame').contentDocument;
    const root=d.getElementById('integratedResultV6');
    const loot=[...root.querySelectorAll('.irv-loot')].map(el=>{const img=el.querySelector('img');
      return {id:el.dataset.rewardId,text:(el.textContent||'').replace(/\\s+/g,' ').trim(),
        icon:img?img.getAttribute('src'):null,natural:img?[img.naturalWidth,img.naturalHeight]:null,
        ok:img?!!(img.complete&&img.naturalWidth>0):null};});
    return {rewardHead:root.querySelector('.irv-rewards h2')?.textContent||null,
      note:root.querySelector('.irv-reward-note')?.textContent||null,loot,
      broken:[...root.querySelectorAll('img')].filter(i=>i.complete&&!i.naturalWidth).map(i=>i.getAttribute('src'))};})()`);
  out.consoleErrors = p.events.filter(e => e.method === 'Runtime.exceptionThrown')
    .map(e => e.params.exceptionDetails.exception?.description || e.params.exceptionDetails.text);
  out.assetErrors = p.events.filter(e => e.method === 'Runtime.responseReceived' || e.method === 'Network.responseReceived')
    .filter(e => e.params.response && e.params.response.status >= 400 && /\/assets\//.test(e.params.response.url || ''))
    .map(e => e.params.response.url);

  const file = join(OUT, 'final-chapter-victory-375.png');
  await p.screenshot(file);
  out.screenshot = file;
  out.ok = !out.consoleErrors.length && !out.assetErrors.length;
} catch (e) {
  out.ok = false;
  out.error = String(e.stack || e).split('\n').slice(0, 2).join(' | ');
  try { await p.screenshot(join(OUT, 'final-chapter-victory-375-FAIL.png')); } catch { /* ignore */ }
} finally {
  writeFileSync(join(OUT, 'chapter-final.json'), JSON.stringify(out, null, 2) + '\n');
  console.log(JSON.stringify({ ok: out.ok, winner: out.winner, stage: out.stageLabel, fixture: out.fixture,
    loot: (out.probe && out.probe.loot || []).map(l => [l.id, (l.icon || '').split('/').pop(), l.text.slice(0, 22)]),
    broken: out.probe && out.probe.broken, err: out.error || null }));
  await browser.close();
}
