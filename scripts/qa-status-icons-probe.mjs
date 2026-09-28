// Probe v4: real campaign battle, auto — poll statuses every 500ms AND the
// battle log DOM. If the log shows status entries (THIÊU ĐỐT / CHẢY MÁU /
// CHOÁNG / PHÁ GIÁP / Nêm Vị...) while unit.statuses stays empty, statuses
// are being stripped faster than 500ms; if the log never mentions them,
// no status-granting action happened in the window.
import { resolve } from 'node:path';
import { startBrowser } from './qa-battle-readiness-browser.mjs';

const browser = await startBrowser();
const report = { steps: [], samples: [], errors: [] };
const sleep = ms => new Promise(r => setTimeout(r, ms));
try {
  const page = await browser.page(1280, 800, 1);
  await page.send('Page.navigate', { url: browser.origin + '/' });
  await page.wait('!!window.__HV_HOST_ATLASES && !!document.getElementById("hvLoginContinue")', 30000);
  await page.click('#hvLoginContinue');
  await page.wait('document.getElementById("hvLoginRoot").hidden');
  await page.click('#hubScreen [data-art-go="campaign"]');
  await page.wait('document.querySelector("[data-scene-action=prepare]") && !document.getElementById("hvCampaignScene").hidden');
  await page.click('#hvCampaignScene [data-hv-afk-challenge]');
  await page.wait('document.querySelector(\'[data-scene-action="launch"]\')', 15000);
  await page.click('#hvCampaignScene [data-scene-action="launch"]');
  await page.wait('document.getElementById("hvBattleOverlay").classList.contains("is-open")', 25000);
  await page.wait(`(() => { const f = document.getElementById("hvBattleFrame"); const d = f && f.contentDocument; return !!(d && d.body && d.body.classList.contains('embedded-battle')); })()`, 45000);
  report.steps.push('battle booted');

  for (let i = 0; i < 90; i++) {
    try {
      report.samples.push(await page.evaluate(`(() => {
        const w = document.getElementById('hvBattleFrame').contentWindow;
        const us = w.__HON_VIET__.getUnits();
        const st = w.__HON_VIET__.getState();
        const log = w.document.querySelector('#battleLog');
        return { t: ${i}, round: st.round, total: us.reduce((a, u) => a + (u.statuses || []).length, 0), log: log ? log.textContent.slice(0, 400) : '' };
      })()`));
    } catch (e) { if (i % 10 === 0) report.errors.push('sample ' + i + ': ' + e.message.slice(0, 80)); }
    await sleep(500);
  }
  const statusLogRe = /THIÊU ĐỐT|CHẢY MÁU|CHOÁNG|PHÁ GIÁP|Nêm Vị|HỒI|TÁI SINH|BẺ TỤ NỘ/i;
  report.summary = {
    samples: report.samples.length,
    maxTotal: Math.max(0, ...report.samples.map(s => s.total)),
    logHitSamples: report.samples.filter(s => statusLogRe.test(s.log)).length,
    logHitExample: (report.samples.find(s => statusLogRe.test(s.log)) || {}).log || '',
    timeline: report.samples.map(s => s.total).join('')
  };
} catch (e) {
  report.errors.push(e.message);
} finally {
  console.log(JSON.stringify(report, null, 2));
  try { await browser.close(); } catch {}
}
