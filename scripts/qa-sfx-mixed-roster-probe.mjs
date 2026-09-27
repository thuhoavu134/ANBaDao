// Probe: does a mixed-roster campaign battle actually fire combat SFX?
// Reads __HON_VIET__.getState()/getUnits() inside the battle frame and counts
// HonVietSfx.play calls while auto-battle runs for ~45s (enough for ultimates).
import { resolve } from 'node:path';
import { startBrowser } from './qa-battle-readiness-browser.mjs';

const browser = await startBrowser();
const report = { steps: [], sfx: {}, errors: [] };
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
  report.steps.push('battle frame booted');

  const instrument = await page.evaluate(`(() => {
    const w = document.getElementById("hvBattleFrame").contentWindow;
    w.__sfxProbe = { sfxPlay: 0, sfxNames: {} };
    if (w.HonVietSfx && typeof w.HonVietSfx.play === 'function') {
      const base = w.HonVietSfx.play.bind(w.HonVietSfx);
      w.HonVietSfx.play = (name, ...rest) => { w.__sfxProbe.sfxPlay++; const k = String(name); w.__sfxProbe.sfxNames[k] = (w.__sfxProbe.sfxNames[k] || 0) + 1; return base(name, ...rest); };
      return 'hooked';
    }
    return 'no HonVietSfx';
  })()`);
  report.steps.push('instrument: ' + instrument);

  await sleep(45000);

  // Generic attack presentation check: sample enemy attack windows and player
  // hurt states every 200ms, plus movement-owner events per actor. The boss and
  // campaign enemies share this pipeline — if enemy attacks produce movement +
  // hurt states here, the presentation works on this build.
  const states = [];
  for (let i = 0; i < 150; i++) {
    try {
      states.push(await page.evaluate(`(() => {
        const us = window.__HON_VIET__.getUnits();
        return { e: us.filter(u => u.team === 'enemy').map(u => u.state).join(','), p: us.filter(u => u.team === 'player').map(u => u.state).join(',') };
      })()`));
    } catch (e) {}
    await sleep(200);
  }
  const enemyAttack = states.filter(x => /attack|skill1|ultimate|cast/.test(x.e));
  const playerHurt = states.filter(x => x.p.includes('hurt'));
  const movementByActor = await page.evaluate(`(() => {
    const ev = window.__HV_SKILL_MOVEMENT_QA?.events?.() || [];
    const by = {};
    for (const e of ev) { const id = e.actorId || 'unknown'; by[id] = by[id] || {}; by[id][e.type] = (by[id][e.type] || 0) + 1; }
    return by;
  })()`);
  report.presentation = { enemyAttackSamples: enemyAttack.length, enemyAttackExamples: enemyAttack.slice(0, 3), playerHurtSamples: playerHurt.length, playerHurtExamples: playerHurt.slice(0, 3), movementByActor };

  report.sfx = await page.evaluate(`(() => {
    const w = document.getElementById("hvBattleFrame").contentWindow;
    let state = {}, units = [];
    try { state = w.__HON_VIET__.getState(); } catch (e) {}
    try { units = w.__HON_VIET__.getUnits().map(u => ({ id: u.id, team: u.team, hp: u.hp, maxHp: u.maxHp, state: u.state, kit: u.kitVersion, visual: u.visualSource, energy: u.energy })); } catch (e) {}
    return { probe: w.__sfxProbe || {}, round: state.round, mode: state.mode, auto: state.auto, battleId: state.battleId, units };
  })()`);
} catch (e) {
  report.errors.push(e.message);
} finally {
  // Windows/Chrome can hold the profile dir briefly; never lose the report to close().
  console.log(JSON.stringify(report, null, 2));
  try { await browser.close(); } catch (e) {}
}
