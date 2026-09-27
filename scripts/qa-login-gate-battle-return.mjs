// QA evidence: full-page battle return must not freeze the hub.
// Exact user flow: campaign -> Xuất chiến (iPhone UA) -> battle.html ->
// defeat-result tip "Tăng cấp tướng" (battle-nav heroes) ->
// index.html?hvBattleReturn=1 -> gate visible above roster -> continue ->
// player lands on the routed screen and can navigate.
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { startBrowser } from './qa-battle-readiness-browser.mjs';

const browser = await startBrowser();
const out = resolve('evidence/login-gate-battle-return');
mkdirSync(out, { recursive: true });
const report = {
  revision: process.env.GITHUB_SHA || 'local',
  scope: 'Full-page battle return + login gate stacking. Desktop embedded abort is covered by static tests; not physical WebKit.',
  checks: [], errors: []
};
const sleep = ms => new Promise(r => setTimeout(r, ms));
const screenshot = async (page, path) => {
  // Evidence aid only; a headless capture timeout is not a functional failure.
  try { await page.screenshot(path); } catch (e) { report.errors.push('screenshot skipped: ' + e.message); }
};
const check = (name, ok, detail = '') => {
  report.checks.push({ name, ok, detail });
  if (!ok) report.errors.push(name + (detail ? ': ' + detail : ''));
};
try {
  const page = await browser.page(390, 844, 3);
  await page.send('Emulation.setUserAgentOverride', {
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1',
    platform: 'iPhone', mobile: true
  });
  await page.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await page.send('Page.navigate', { url: browser.origin + '/' });
  await page.wait('!!window.__HV_HOST_ATLASES && !!document.getElementById("hvLoginContinue")', 30000);
  await page.click('#hvLoginContinue');
  await page.wait('document.getElementById("hvLoginRoot").hidden');
  await page.click('#hubScreen [data-art-go="campaign"]');
  await page.wait('document.querySelector("[data-scene-action=prepare]") && !document.getElementById("hvCampaignScene").hidden');
  await page.click('#hvCampaignScene [data-hv-afk-challenge]');
  await page.wait('document.querySelector(\'[data-scene-action="launch"]\')', 15000);
  await page.click('#hvCampaignScene [data-scene-action="launch"]');
  await page.wait(`location.pathname.endsWith('battle.html')`, 25000);
  await page.wait(`document.body.classList.contains('embedded-battle')`, 45000);
  await page.evaluate(`postToHonVietHost('battle-nav', { sessionId: new URLSearchParams(location.search).get('session') || '', target: 'heroes' })`);
  await page.wait(`location.pathname.endsWith('index.html')`, 20000);
  await page.wait(`!!window.__HV_HOST_ATLASES`, 30000);
  await sleep(3000);

  const stackState = await page.evaluate(`(() => {
    const gate = document.getElementById('hvLoginRoot');
    const roster = document.getElementById('hvHeroRosterV4');
    return {
      gateOpen: !!(gate && !gate.hidden && gate.classList.contains('is-open')),
      gateZ: gate ? Number(getComputedStyle(gate).zIndex) : null,
      rosterZ: roster ? Number(getComputedStyle(roster).zIndex) : null,
      screen: (typeof ST !== 'undefined') ? ST.screen : '?'
    };
  })()`);
  check('gate re-opens on return boot (existing per-boot flow)', stackState.gateOpen, JSON.stringify(stackState));
  check('gate renders above the V4 roster', stackState.gateZ > stackState.rosterZ, JSON.stringify(stackState));
  await screenshot(page, resolve(out, '1-gate-topmost-after-return.png'));

  // Pass the gate exactly like a player: continue as guest.
  await page.evaluate(`(() => { const b = document.getElementById('hvLoginContinue'); if (b) b.click(); })()`);
  await page.wait(`document.getElementById("hvLoginRoot").hidden`, 20000);
  await sleep(1500);

  const afterEnter = await page.evaluate(`(() => ({
    screen: (typeof ST !== 'undefined') ? ST.screen : '?',
    rosterOpen: !!document.getElementById('hvHeroRosterV4')?.classList.contains('is-open'),
    gateOpen: !!document.getElementById('hvLoginRoot')?.classList.contains('is-open')
  }))()`);
  check('routed destination survives gate entry (heroes, not hub)', afterEnter.screen === 'heroes', JSON.stringify(afterEnter));
  check('roster is open and gate closed after entry', afterEnter.rosterOpen === true && afterEnter.gateOpen === false, JSON.stringify(afterEnter));

  // Navigation works again: tap the roster dock "Thành Chính" and observe the route.
  await page.click('#hvHeroRosterV4 .v4-dock button');
  await sleep(1200);
  const afterNav = await page.evaluate(`(typeof ST !== 'undefined') ? ST.screen : '?'`);
  check('dock navigation works after gate entry', afterNav === 'hub', 'ST.screen=' + afterNav);
  await screenshot(page, resolve(out, '2-navigable-after-entry.png'));
} catch (e) {
  report.errors.push('FATAL: ' + e.message);
} finally {
  await browser.close();
}
writeFileSync(resolve(out, 'report.json'), JSON.stringify(report, null, 2));
if (report.errors.length) {
  console.error(JSON.stringify(report, null, 2));
  process.exitCode = 1;
} else {
  console.log('login-gate battle-return QA: ' + report.checks.length + '/' + report.checks.length + ' PASS');
}
