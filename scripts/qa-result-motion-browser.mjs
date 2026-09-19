import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { startBrowser } from './qa-battle-readiness-browser.mjs';

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

export async function run() {
  const out = resolve('evidence/result-motion');
  mkdirSync(out, { recursive: true });
  const browser = await startBrowser();
  const report = { scope: 'Generated result overlay with real runtime result snapshot and authored motion assets; Chromium only, not physical iPhone.', runs: [], requests: [], ok: false };
  try {
    for (const [name, width, height, dpr] of [['desktop', 1280, 800, 1], ['mobile', 390, 844, 2]]) {
      const page = await browser.page(width, height, dpr);
      const run = { name, width, height, dpr, screenshots: [], errors: [] };
      report.runs.push(run);
      try {
        await page.send('Page.navigate', { url: browser.origin + '/battle.html?linhDongQa=1&bachDienQa=1' });
        await page.wait('!!window.__HON_VIET__ && !!window.__showIntegratedResultV6 && !!window.__HV_RESULT_MOTION_QA');

        await page.evaluate('__HON_VIET__.qaShowResult(true)');
        await page.wait('__HV_RESULT_MOTION_QA.state().supported === true');
        await page.wait('__HV_RESULT_MOTION_QA.state().phase === "run" && __HV_RESULT_MOTION_QA.state().runFrames >= 3');
        run.victoryRun = await page.evaluate('__HV_RESULT_MOTION_QA.state()');
        await page.screenshot(resolve(out, name + '-victory-run.png'));
        run.screenshots.push(name + '-victory-run.png');

        await page.wait('__HV_RESULT_MOTION_QA.state().phase === "idle" && __HV_RESULT_MOTION_QA.state().idleFrames >= 3 && Number(getComputedStyle(document.querySelector("#integratedResultV6 .irv-hero.idle")).opacity) > 0.9', 10000);
        run.victoryIdle = await page.evaluate('__HV_RESULT_MOTION_QA.state()');
        run.victoryRoot = await page.evaluate(`(()=>{const r=document.getElementById('integratedResultV6');const c=r?.querySelector('.irv-hero.idle');const b=r?.querySelector('[data-result-action="confirm"]');return {classes:r?.className||'',idleOpacity:c?getComputedStyle(c).opacity:null,confirmText:b?.textContent?.trim()||'',confirmRect:b?(()=>{const x=b.getBoundingClientRect();return {w:x.width,h:x.height}})():null};})()`);
        await page.screenshot(resolve(out, name + '-victory-idle.png'));
        run.screenshots.push(name + '-victory-idle.png');

        await page.click('#integratedResultV6 [data-result-action="confirm"]');
        await page.wait('__HON_VIET__.getState().mode === "battle" && !document.getElementById("integratedResultV6").classList.contains("show")', 10000);
        run.victoryConfirm = await page.evaluate('({mode:__HON_VIET__.getState().mode,visible:document.getElementById("integratedResultV6").classList.contains("show")})');
        await page.screenshot(resolve(out, name + '-after-victory-confirm.png'));
        run.screenshots.push(name + '-after-victory-confirm.png');

        await page.evaluate('__HON_VIET__.qaShowResult(false)');
        await page.wait('__HV_RESULT_MOTION_QA.state().phase === "fall" && __HV_RESULT_MOTION_QA.state().fallFrames >= 3', 12000);
        run.defeatFall = await page.evaluate('__HV_RESULT_MOTION_QA.state()');
        await page.screenshot(resolve(out, name + '-defeat-fall.png'));
        run.screenshots.push(name + '-defeat-fall.png');

        await page.wait('__HV_RESULT_MOTION_QA.state().phase === "fall-hold"', 15000);
        const heldA = await page.evaluate('__HV_RESULT_MOTION_QA.state()');
        const expectedLast = heldA.expectedFallLast;
        await sleep(550);
        const heldB = await page.evaluate('__HV_RESULT_MOTION_QA.state()');
        run.defeatHold = { first: heldA, after550ms: heldB, expectedLast };
        run.defeatRoot = await page.evaluate(`(()=>{const r=document.getElementById('integratedResultV6');const c=r?.querySelector('.irv-hero.fall');const b=r?.querySelector('[data-result-action="confirm"]');return {classes:r?.className||'',transform:c?getComputedStyle(c).transform:null,confirmText:b?.textContent?.trim()||'',confirmRect:b?(()=>{const x=b.getBoundingClientRect();return {w:x.width,h:x.height}})():null};})()`);
        await page.screenshot(resolve(out, name + '-defeat-hold.png'));
        run.screenshots.push(name + '-defeat-hold.png');

        await page.click('#integratedResultV6 [data-result-action="confirm"]');
        await page.wait('__HON_VIET__.getState().mode === "battle" && !document.getElementById("integratedResultV6").classList.contains("show")', 10000);
        run.defeatConfirm = await page.evaluate('({mode:__HON_VIET__.getState().mode,visible:document.getElementById("integratedResultV6").classList.contains("show")})');

        // Prove the real authored Run/Idle/Fall atlases, not only the generic
        // default-roster fallback. Lục Ảnh covers the compact atlas path;
        // Linh Đồng covers the large-atlas readiness/resized path.
        run.authored = {};
        const authoredCases = [
          ['luc-anh', { id:'luc_anh', sourceId:'luc_anh', name:'Lục Ảnh', damage:9999, kills:3, hp:100, maxHp:100, alive:true, slot:0 }, 'luc_anh'],
          ['linh-dong', { id:'linh_dong', sourceId:'hero_splus_linh_dong', name:'Linh Đồng', damage:9999, kills:3, hp:100, maxHp:100, alive:true, slot:0 }, 'linh_dong']
        ];
        for (const [caseName, hero, expectedHero] of authoredCases) {
          const snapshot = { player:[hero], enemy:[], rewards:[] };
          const encoded = JSON.stringify(snapshot);
          const item = { screenshots:[] };
          run.authored[caseName] = item;

          await page.evaluate('window.__hideIntegratedResultV6?.()');
          await page.evaluate('window.__showIntegratedResultV6(true,' + encoded + ')');
          await page.wait(`(()=>{const q=__HV_RESULT_MOTION_QA.state(),c=document.querySelector("#integratedResultV6 .irv-hero.run"),root=document.querySelector("#integratedResultV6 .irv-viewport");if(q.hero!==${JSON.stringify(expectedHero)}||q.generic||q.phase!=="run"||q.runFrames<8||!c||!root)return false;const r=c.getBoundingClientRect(),rr=root.getBoundingClientRect(),overlap=Math.max(0,Math.min(r.right,rr.right)-Math.max(r.left,rr.left))/Math.max(1,r.width);return overlap>=.65&&r.bottom>rr.top&&r.top<rr.bottom;})()`, 12000);
          item.victoryRun = await page.evaluate('__HV_RESULT_MOTION_QA.state()');
          item.runRect = await page.evaluate(`(()=>{const c=document.querySelector("#integratedResultV6 .irv-hero.run"),r=c.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,opacity:getComputedStyle(c).opacity,viewport:[innerWidth,innerHeight]};})()`);
          await page.screenshot(resolve(out, name + '-' + caseName + '-victory-run.png'));
          item.screenshots.push(name + '-' + caseName + '-victory-run.png');

          await page.wait(`__HV_RESULT_MOTION_QA.state().hero===${JSON.stringify(expectedHero)} && __HV_RESULT_MOTION_QA.state().phase==="idle" && __HV_RESULT_MOTION_QA.state().idleFrames>=4`, 12000);
          item.victoryIdle = await page.evaluate('__HV_RESULT_MOTION_QA.state()');
          await page.screenshot(resolve(out, name + '-' + caseName + '-victory-idle.png'));
          item.screenshots.push(name + '-' + caseName + '-victory-idle.png');

          await page.evaluate('window.__hideIntegratedResultV6?.()');
          await page.evaluate('window.__showIntegratedResultV6(false,' + encoded + ')');
          await page.wait(`__HV_RESULT_MOTION_QA.state().hero===${JSON.stringify(expectedHero)} && !__HV_RESULT_MOTION_QA.state().generic && __HV_RESULT_MOTION_QA.state().phase==="fall" && __HV_RESULT_MOTION_QA.state().fallFrames>=5`, 12000);
          item.defeatFall = await page.evaluate('__HV_RESULT_MOTION_QA.state()');
          await page.screenshot(resolve(out, name + '-' + caseName + '-defeat-fall.png'));
          item.screenshots.push(name + '-' + caseName + '-defeat-fall.png');

          await page.wait(`__HV_RESULT_MOTION_QA.state().hero===${JSON.stringify(expectedHero)} && __HV_RESULT_MOTION_QA.state().phase==="fall-hold"`, 15000);
          const authoredHeldA = await page.evaluate('__HV_RESULT_MOTION_QA.state()');
          await sleep(550);
          const authoredHeldB = await page.evaluate('__HV_RESULT_MOTION_QA.state()');
          item.defeatHold = { first:authoredHeldA, after550ms:authoredHeldB };
          item.defeatLayout = await page.evaluate(`(()=>{const hero=document.querySelector("#integratedResultV6 .irv-hero.fall"),copy=document.querySelector("#integratedResultV6 .irv-result");if(!hero||!copy)return null;const h=hero.getBoundingClientRect(),r=copy.getBoundingClientRect();return {heroBottom:h.bottom,resultTop:r.top,gap:r.top-h.bottom,heroTop:h.top};})()`);
          await page.screenshot(resolve(out, name + '-' + caseName + '-defeat-hold.png'));
          item.screenshots.push(name + '-' + caseName + '-defeat-hold.png');
          await page.evaluate('window.__hideIntegratedResultV6?.()');

          item.ok =
            item.victoryRun.generic === false &&
            item.victoryRun.runFrames >= 8 &&
            item.runRect.right > 0 && item.runRect.left < item.runRect.viewport[0] &&
            item.victoryIdle.phase === 'idle' && item.victoryIdle.idleFrames >= 4 &&
            authoredHeldA.generic === false &&
            authoredHeldA.fallCycles === 1 &&
            authoredHeldA.lastFallFrame === authoredHeldA.expectedFallLast &&
            authoredHeldB.fallFrames === authoredHeldA.fallFrames &&
            authoredHeldB.lastFallFrame === authoredHeldA.lastFallFrame &&
            item.defeatLayout?.gap >= 4;
        }

        run.exceptions = page.events.filter(event => event.method === 'Runtime.exceptionThrown');
        run.httpErrors = page.events.filter(event => event.method === 'Network.responseReceived' && event.params.response.status >= 400).map(event => ({ url: event.params.response.url, status: event.params.response.status }));
        run.resultAssetErrors = run.httpErrors.filter(item => /result-|characters|battle-runtime/.test(item.url));
        run.ok =
          run.victoryRun.runFrames >= 3 &&
          run.victoryIdle.phase === 'idle' && run.victoryIdle.idleFrames >= 3 &&
          Number(run.victoryRoot.idleOpacity) > 0.9 &&
          run.victoryRoot.confirmRect?.w >= 44 && run.victoryRoot.confirmRect?.h >= 44 &&
          heldA.fallCycles === 1 && heldA.lastFallFrame === expectedLast &&
          heldB.fallFrames === heldA.fallFrames && heldB.lastFallFrame === heldA.lastFallFrame &&
          (heldA.generic ? run.defeatRoot.transform !== 'none' : run.defeatRoot.transform === 'none') &&
          run.defeatRoot.confirmRect?.w >= 44 && run.defeatRoot.confirmRect?.h >= 44 &&
          run.victoryConfirm.mode === 'battle' && run.defeatConfirm.mode === 'battle' &&
          Object.values(run.authored).every(item => item.ok) &&
          run.exceptions.length === 0 && run.resultAssetErrors.length === 0;
        if (!run.ok) run.errors.push('Result motion or interaction acceptance failed; inspect report and screenshots.');
      } catch (error) {
        run.ok = false;
        run.errors.push(String(error.stack || error));
        run.exceptions = page.events.filter(event => event.method === 'Runtime.exceptionThrown');
        try { await page.screenshot(resolve(out, name + '-failure.png')); run.screenshots.push(name + '-failure.png'); } catch (_error) {}
      } finally {
        await page.close();
        writeFileSync(resolve(out, 'report.json'), JSON.stringify(report, null, 2));
      }
    }
    report.requests = browser.requestLog;
    report.ok = report.runs.every(run => run.ok);
    writeFileSync(resolve(out, 'report.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify({ ok: report.ok, runs: report.runs.map(run => ({ name: run.name, ok: run.ok, victory: run.victoryIdle?.hero, defeat: run.defeatHold?.first?.hero, errors: run.errors, exceptions: run.exceptions?.length, resultAssetErrors: run.resultAssetErrors?.length })) }, null, 2));
    if (!report.ok) process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await run();
