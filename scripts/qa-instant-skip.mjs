import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { startBrowser } from './qa-battle-readiness-browser.mjs';

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function heroes(playerHp, enemyHp) {
  const rows = [];
  for (const [team, hp, prefix] of [['player', playerHp, 'P'], ['enemy', enemyHp, 'E']]) {
    for (let slot = 0; slot < 6; slot++) {
      rows.push({
        id: `qa-${team}-${slot}`,
        sourceId: `qa-${team}-${slot}`,
        team,
        slot,
        name: `${prefix}${slot + 1}`,
        title: 'Round 15 QA',
        initial: `${prefix}${slot + 1}`,
        hp,
        atk: 1,
        def: 100000,
        speed: 120 - slot,
        accuracy: 100,
        evasion: 0,
        crit: 0,
        critRes: 100,
        critDamage: 1.35,
        level: 1,
        stars: 1,
        rarity: 1
      });
    }
  }
  return rows;
}

function configFor(testCase) {
  const playerHp = testCase.expectedWin ? 2000000 : 1800000;
  const enemyHp = testCase.expectedWin ? 1800000 : 2000000;
  return {
    embedded: true,
    referenceSimple: true,
    autoStart: true,
    sessionId: `round15-${testCase.name}`,
    battleId: `round15-${testCase.name}`,
    playerTeamName: 'Lạc Việt QA',
    enemyTeamName: 'Hắc Triều QA',
    battleTitle: 'Khiêu chiến 15 hiệp',
    chapterTitle: 'QA hiện hành',
    location: 'Sân thử 15 hiệp',
    timingScale: 1,
    objective: { type: 'challenge', maxRounds: 15 },
    rewardPreview: [
      { id: 'gold', name: 'Vàng', value: 180, rarity: 'gold' },
      { id: 'mastery', name: 'Tinh Thông / tướng', value: 4, rarity: 'jade' }
    ],
    heroes: heroes(playerHp, enemyHp)
  };
}

function hostHtml(config) {
  const safe = JSON.stringify(config).replace(/</g, '\\u003c');
  return `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>html,body,#battle{margin:0;width:100%;height:100%;border:0;background:#041211}body{overflow:hidden}</style>
<iframe id="battle" title="Round 15 battle"></iframe>
<script>
window.__messages=[];
window.addEventListener('message',event=>{if(event.data?.source==='hon-viet-battle')window.__messages.push(event.data)});
const config=${safe};
const frame=document.getElementById('battle');
frame.dataset.config=JSON.stringify(config);
frame.src='battle.html?embedded=1&qaPhase01=1&session='+encodeURIComponent(config.sessionId);
<\/script>`;
}

function expression(body) {
  return `(()=>{${body}})()`;
}

export async function run() {
  const out = resolve('evidence/instant-skip');
  mkdirSync(out, { recursive: true });
  const browser = await startBrowser();
  const report = {
    scope: 'Real built battle iframe. 6v6 high-HP challenge forces the runtime to reach the 15-round cap without mocking combat functions. Chromium only.',
    revision: process.env.GITHUB_SHA || 'local',
    runs: [],
    errors: [],
    ok: false
  };
  const cases = [
    { name: 'victory-confirm-x1', speed: 1, expectedWin: true, action: 'confirm' },
    { name: 'victory-next-x2', speed: 2, expectedWin: true, action: 'next' },
    { name: 'victory-confirm-x3', speed: 3, expectedWin: true, action: 'confirm' },
    { name: 'defeat-back-x3', speed: 3, expectedWin: false, action: 'back' }
  ];
  try {
    for (const testCase of cases) {
      const config = configFor(testCase);
      writeFileSync(resolve('dist/qa-round15-host.html'), hostHtml(config));
      const page = await browser.page(testCase.expectedWin ? 390 : 1280, testCase.expectedWin ? 844 : 800, 1);
      const result = { ...testCase, screenshots: [], errors: [] };
      report.runs.push(result);
      try {
        await page.send('Page.navigate', { url: browser.origin + '/qa-round15-host.html?case=' + encodeURIComponent(testCase.name) });
        await page.wait(expression(`const f=document.querySelector('#battle');return !!f?.contentWindow?.__HON_VIET__ && f.contentWindow.__HON_VIET__.getState().mode==='battle';`), 20000);
        for (let n = 1; n < testCase.speed; n++) {
          await page.evaluate(expression(`document.querySelector('#battle').contentDocument.querySelector('#speedButton')?.click();return true;`));
        }
        await page.wait(expression(`const w=document.querySelector('#battle').contentWindow;return w.__HON_VIET__.getState().speed===${testCase.speed};`), 5000);

        await page.wait(expression(`const s=document.querySelector('#battle').contentWindow.__HON_VIET__.getState();return s.actionCount>=1 && s.mode==='battle';`),20000);
        const started = Date.now();
        await page.evaluate(expression(`const b=document.querySelector('#battle').contentDocument.querySelector('#embeddedSkipButton');b.click();b.click();return true;`));
        const samples = [];
        while (Date.now() - started < 90000) {
          const snap = await page.evaluate(expression(`
            const w=document.querySelector('#battle')?.contentWindow;
            if(!w?.__HON_VIET__)return null;
            const s=w.__HON_VIET__.getState();
            return {mode:s.mode,round:s.round,actions:s.actionCount,speed:s.speed};
          `));
          if (snap) samples.push({ at: Date.now(), ...snap });
          if (snap?.mode === 'result') break;
          await sleep(80);
        }
        result.elapsedMs=Date.now()-started;
        result.samples = samples;
        await page.wait(expression(`const w=document.querySelector('#battle').contentWindow;return w.__HON_VIET__.getState().mode==='result';`), 5000);
        await page.wait(expression(`const d=document.querySelector('#battle').contentDocument;return d.querySelector('#integratedResultV6.show') && d.querySelector('#integratedResultV6 [data-result-action="${testCase.action}"]');`), 12000);

        result.result = await page.evaluate(expression(`
          const f=document.querySelector('#battle'),w=f.contentWindow,d=f.contentDocument,s=w.__HON_VIET__.getState();
          const trace=w.__HV_BATTLE_PHASE1_TRACE?.events?.()||[];
          const actionRounds=trace.filter(e=>e.type==='action:start').map(e=>Number(e.roundId)).filter(Number.isFinite);
          const buttons=[...d.querySelectorAll('#integratedResultV6 [data-result-action]')].map(b=>({action:b.dataset.resultAction,text:b.textContent.trim(),w:b.getBoundingClientRect().width,h:b.getBoundingClientRect().height}));
          return {
            mode:s.mode,
            round:s.round,
            actionCount:s.actionCount,
            speed:s.speed,
            winner:s.result,
            objective:s.objective?{type:s.objective.type,maxRounds:s.objective.maxRounds,resolved:s.objective.resolved,winner:s.objective.winner,reason:s.objective.reason,playerHp:s.objective.playerHp,enemyHp:s.objective.enemyHp,playerRatio:s.objective.playerRatio,enemyRatio:s.objective.enemyRatio}:null,
            rewards:(s.resultSnapshot?.rewards||[]).map(x=>({id:x.id,name:x.name,value:x.value})),
            snapshotRound:s.resultSnapshot?.round,
            visible:d.querySelector('#integratedResultV6')?.classList.contains('show')||false,
            copy:d.querySelector('#integratedResultV6 .irv-copy')?.textContent?.trim()||d.querySelector('#integratedResultV6')?.innerText?.slice(0,500)||'',
            buttons,
            trace:{actions:actionRounds.length,min:actionRounds.length?Math.min(...actionRounds):null,max:actionRounds.length?Math.max(...actionRounds):null,beyond15:actionRounds.filter(x=>x>15)}
          };
        `));

        await page.screenshot(resolve(out, testCase.name + '-result.png'));
        result.screenshots.push(testCase.name + '-result.png');

        const expectedWinner = testCase.expectedWin ? 'player' : 'enemy';
        const preActionOk =
          result.elapsedMs < 5000 &&
          result.result.mode === 'result' &&
          result.result.round === 15 &&
          result.result.snapshotRound === 15 &&
          result.result.speed === testCase.speed &&
          result.result.winner === expectedWinner &&
          result.result.objective?.type === 'challenge' &&
          result.result.objective?.maxRounds === 15 &&
          result.result.objective?.resolved === true &&
          result.result.objective?.winner === expectedWinner &&
          String(result.result.objective?.reason || '').startsWith('round-limit') &&
          result.result.trace.max === 15 &&
          result.result.trace.beyond15.length === 0 &&
          result.result.visible === true &&
          result.result.buttons.every(b=>b.w>=44&&b.h>=44) &&
          (testCase.expectedWin ? result.result.rewards.length >= 1 : result.result.rewards.length === 0);

        await page.evaluate(expression(`
          const d=document.querySelector('#battle').contentDocument;
          d.querySelector('#integratedResultV6 [data-result-action="${testCase.action}"]').click();
          return true;
        `));

        if (testCase.action === 'back') {
          await page.wait(`window.__messages.some(m=>m.type==='battle-nav'&&m.payload?.target==='campaign')`, 10000);
          result.message = await page.evaluate(`window.__messages.filter(m=>m.type==='battle-nav').slice(-1)[0]`);
          result.actionOk = result.message?.payload?.target === 'campaign';
        } else {
          await page.wait(`window.__messages.some(m=>m.type==='battle-result')`, 10000);
          result.message = await page.evaluate(`window.__messages.filter(m=>m.type==='battle-result').slice(-1)[0]`);
          result.actionOk =
            result.message?.payload?.resultAction === testCase.action &&
            result.message?.payload?.round === 15 &&
            result.message?.payload?.objective?.maxRounds === 15 &&
            String(result.message?.payload?.objective?.reason || '').startsWith('round-limit') &&
            Boolean(result.message?.payload?.win) === testCase.expectedWin;
          if (testCase.expectedWin) {
            result.actionOk = result.actionOk && Array.isArray(result.message?.payload?.rewards) && result.message.payload.rewards.length >= 1;
          }
        }

        result.messageCount=await page.evaluate("window.__messages.filter(m=>m.type==='battle-result').length");
        if(testCase.action!=='back'&&result.messageCount!==1)throw Error('Duplicate or missing settlement');
        result.exceptions = page.events.filter(event => event.method === 'Runtime.exceptionThrown');
        result.httpErrors = page.events.filter(event => event.method === 'Network.responseReceived' && event.params.response.status >= 400).map(event => ({ url: event.params.response.url, status: event.params.response.status }));
        result.criticalHttpErrors = result.httpErrors.filter(item => !/favicon/i.test(item.url));
        result.ok = preActionOk && result.actionOk && result.exceptions.length === 0 && result.criticalHttpErrors.length === 0;
        if (!result.ok) result.errors.push('15-round/result acceptance failed; inspect report and screenshot.');
      } catch (error) {
        result.ok = false;
        result.errors.push(String(error.stack || error));
        result.exceptions = page.events.filter(event => event.method === 'Runtime.exceptionThrown');
        try {
          await page.screenshot(resolve(out, testCase.name + '-failure.png'));
          result.screenshots.push(testCase.name + '-failure.png');
        } catch {}
      } finally {
        await page.close();
        writeFileSync(resolve(out, 'report.json'), JSON.stringify(report, null, 2));
      }
    }
    report.requests = browser.requestLog;
    report.ok = report.runs.every(run => run.ok);
    if (!report.ok) report.errors.push('At least one round-15 flow failed.');
    writeFileSync(resolve(out, 'report.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify({
      ok: report.ok,
      runs: report.runs.map(run => ({
        name: run.name,
        elapsedMs:run.elapsedMs,
        ok: run.ok,
        round: run.result?.round,
        reason: run.result?.objective?.reason,
        traceMax: run.result?.trace?.max,
        action: run.message?.payload?.resultAction || run.message?.payload?.target,
        errors: run.errors,
        exceptions: run.exceptions?.length,
        httpErrors: run.criticalHttpErrors?.length
      }))
    }, null, 2));
    if (!report.ok) process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await run();

