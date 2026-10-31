// Debug: campaign launch path + stage fixture behaviour.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = resolve('C:/lt/wt-result-icons');
const OUT = join(ROOT, 'docs/qa/result-type-icons');
mkdirSync(OUT, { recursive: true });
const { startBrowser } = await import(pathToFileURL(join(ROOT, 'scripts/qa-battle-readiness-browser.mjs')).href);
const sleep = ms => new Promise(r => setTimeout(r, ms));

const browser = await startBrowser();
const p = await browser.page(390, 844, 3);
const out = {};
try {
  await p.send('Page.navigate', { url: browser.origin + '/' });
  await p.wait('!!document.getElementById("hvLoginContinue")', 20000);
  await p.click('#hvLoginContinue');
  await p.wait('document.getElementById("hvLoginRoot").hidden===true', 20000);
  await p.wait('!!document.querySelector("#hubScreen [data-art-go=\\"campaign\\"]")', 20000);

  out.save0 = await p.evaluate('({chapters:(typeof DATA!=="undefined")?DATA.chapters.length:null,mode:typeof ST!=="undefined"?ST.mode:null,chapterIdx:typeof ST!=="undefined"?ST.chapterIdx:null,stage:typeof ST!=="undefined"?ST.campaignBattleIndex:null,squad:(typeof P!=="undefined"&&P)?P.squad.length:null})');

  out.fixture11 = await p.evaluate(`(()=>{const ch=11;P.clearedChapters=[...Array(ch).keys()];P.unlockedChapters=[...Array(12).keys()];P.campaignStages=P.campaignStages||{};P.campaignStages[ch]=0;try{persist();}catch(e){return 'persist:'+e.message+String(e.stack||'').slice(0,300);}return {cleared:P.clearedChapters.length,unlocked:P.unlockedChapters.length};})()`);

  await p.click('#hubScreen [data-art-go="campaign"]');
  await p.wait('!document.getElementById("hvCampaignScene").hidden', 20000);
  await sleep(1200);
  out.label11 = await p.evaluate('({pill:document.querySelector("#hvCampaignScene .cs-stage-pill")?.textContent,ST:{mode:ST.mode,chapterIdx:ST.chapterIdx,stage:ST.campaignBattleIndex},cleared:P.clearedChapters.length,chapters:DATA.chapters.length})');

  await p.click('#hvCampaignScene .cs-primary.cs-challenge');
  await sleep(1200);
  out.afterChallenge = await p.evaluate(`(()=>{const pr=document.querySelector('.cs-prepare');
    return {prepare:!!pr,hidden:pr?pr.hidden:null,buttons:[...(pr?.querySelectorAll('button')||[])].map(b=>({cls:b.className,act:b.dataset.sceneAction||null,txt:(b.textContent||'').trim().slice(0,30)}))};})()`);

  const launch = await p.evaluate('!!document.querySelector("[data-scene-action=\\"launch\\"]")');
  out.launchExists = launch;
  if (launch) {
    await p.click('[data-scene-action="launch"]');
    await sleep(4000);
    out.afterLaunch = await p.evaluate(`(()=>{const f=document.getElementById('hvBattleFrame');
      const w=f?.contentWindow;return {frame:!!f,url:location.href,
        hv:!!w?.__HON_VIET__,mode:w?.__HON_VIET__?.getState?.().mode||null,
        overlay:document.getElementById('hvBattleOverlay')?.className||null,
        top:document.elementFromPoint(innerWidth/2,innerHeight/2)?.id||null};})()`);
    await p.screenshot(join(OUT, 'debug-after-launch.png'));
    // let the battle run a moment
    await sleep(6000);
    out.battle = await p.evaluate(`(()=>{const w=document.getElementById('hvBattleFrame')?.contentWindow;const s=w?.__HON_VIET__?.getState?.();return s?{mode:s.mode,actions:s.actionCount,round:s.round,skip:!!w.document.querySelector('#embeddedSkipButton')}:null;})()`);
  }
} catch (error) {
  out.error = String(error.stack || error).split('\n').slice(0, 4).join(' | ');
} finally {
  writeFileSync(join(OUT, 'debug-launch.json'), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
  await browser.close();
}
