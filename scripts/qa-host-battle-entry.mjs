// Exercise the host/iframe lifetime with real built assets and production handlers.
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { startBrowser } from './qa-battle-readiness-browser.mjs';

const browser = await startBrowser();
const out = resolve('evidence/host-entry');
mkdirSync(out, { recursive: true });
const report = { revision: process.env.GITHUB_SHA || 'local',
  scope: 'Chromium desktop and emulated iPhone code path; not physical WebKit or total RAM', runs: [] };
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const owner = 'window.__HV_HOST_ATLASES';
const frame = 'document.getElementById("hvBattleFrame").contentWindow';
try {
  for (const [name, width, height, dpr] of [['desktop', 1280, 800, 1], ['iphone-path', 390, 844, 3]]) {
    const page = await browser.page(width, height, dpr);
    const run = { name, entries: [], errors: [] }; report.runs.push(run);
    try {
      if (name === 'iphone-path') await page.send('Emulation.setUserAgentOverride', {
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1', platform: 'iPhone'
      });
      await page.send('Page.navigate', { url: browser.origin + '/' });
      await page.wait('!!window.__HV_HOST_ATLASES && !!document.getElementById("hvLoginContinue")');
      run.boot = await page.evaluate(owner + '.inspect()');
      if (run.boot.entries !== 0) throw new Error('Host atlas eager allocation at boot');
      // Local disposable guest profile only; no production account or save is used.
      await page.click('#hvLoginContinue');
      await page.wait('document.getElementById("hvLoginRoot").hidden');
      await page.evaluate('window.__qaHostDraws=0;const __qaDraw=drawBattle;drawBattle=function(...args){window.__qaHostDraws++;return __qaDraw.apply(this,args)}');
      for (let cycle = 1; cycle <= 2; cycle++) {
        await page.evaluate('navTo("campaign")');
        await page.wait('document.querySelector("[data-scene-action=prepare]") && !document.getElementById("hvCampaignScene").hidden');
        await page.click('[data-scene-action="prepare"]');
        await page.wait('!document.querySelector(".cs-prepare").hidden');
        await page.screenshot(join(out, name + '-' + cycle + '-prepare.png'));
        const began = Date.now();
        await page.click('[data-scene-action="launch"]');
        await page.wait(owner + '.suspended && !!' + frame + '.__HON_VIET__', 45000);
        await page.wait(frame + '.__HON_VIET__.getState().actionCount >= 2', 60000);
        const entry = await page.evaluate(`({cache:${owner}.inspect(),draws:window.__qaHostDraws,
          battle:${frame}.__HON_VIET__.getState(),units:${frame}.__HON_VIET__.getUnits(),
          audio:{paused:bgmPlayer.paused,time:bgmPlayer.currentTime,src:bgmPlayer.currentSrc},
          releasedImages:document.documentElement.dataset.battleHostImagesReleased})`);
        entry.elapsedMs = Date.now() - began;
        await sleep(500);
        const laterDraws = await page.evaluate('window.__qaHostDraws');
        if (entry.cache.entries !== 0 || laterDraws !== entry.draws) throw new Error('Host atlas or legacy render active behind battle');
        if (name === 'iphone-path' && !(Number(entry.releasedImages) > 0)) throw new Error('iPhone DOM release hook did not run');
        if (entry.audio.paused || !(entry.audio.time > 0)) throw new Error('Combat BGM not playing');
        await page.screenshot(join(out, name + '-' + cycle + '-battle.png'));
        run.entries.push(entry);
        await page.click('#hvHubBackChip');
        await page.wait('!document.getElementById("hvBattleOverlay").classList.contains("is-open") && !' + owner + '.suspended');
        await page.wait('bgmPlayer.currentTime > 0 && !bgmPlayer.paused');
        entry.afterClose = await page.evaluate(`({cache:${owner}.inspect(),frameSrc:document.getElementById('hvBattleFrame').getAttribute('src'),
          released:document.documentElement.dataset.battleHostImagesReleased,audioPaused:bgmPlayer.paused})`);
        if (entry.afterClose.frameSrc !== 'about:blank' || entry.afterClose.released !== undefined) throw new Error('Close did not restore host lifecycle');
        await page.screenshot(join(out, name + '-' + cycle + '-closed.png'));
      }
      run.exceptions = page.events.filter(e => e.method === 'Runtime.exceptionThrown');
      run.assetErrors = page.events.filter(e => e.method === 'Network.responseReceived' && e.params.response.status >= 400 && new URL(e.params.response.url).pathname.startsWith('/assets/')).map(e => e.params.response);
      if (run.exceptions.length || run.assetErrors.length) throw new Error('Runtime/asset errors');
      run.ok = true;
    } catch (error) {
      run.errors.push(String(error.stack || error)); run.ok = false;
      await page.screenshot(join(out, name + '-failure.png')).catch(() => {});
    } finally { await page.close(); }
  }
} finally {
  report.ok = report.runs.length === 2 && report.runs.every(run => run.ok);
  writeFileSync(join(out, 'report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  await browser.close();
  if (!report.ok) process.exitCode = 1;
}
