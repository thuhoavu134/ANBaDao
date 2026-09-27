// Probe: when the Săn Boss boss attacks the player team, does ANY visual
// presentation happen? Samples every 200ms for ~45s and records:
//   - enemy/boss states (attack/skill1/ultimate/cast windows)
//   - boss x displacement vs its home position
//   - player units entering 'hurt' state (hit presentation)
//   - movement-owner events per actor (run/approach/return)
import { resolve } from 'node:path';
import { startBrowser } from './qa-battle-readiness-browser.mjs';

const browser = await startBrowser();
const report = { steps: [], samples: [], movementByActor: {}, errors: [] };
const sleep = ms => new Promise(r => setTimeout(r, ms));
try {
  const page = await browser.page(390, 844, 3);
  await page.send('Emulation.setUserAgentOverride', {
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1',
    platform: 'iPhone', mobile: true
  });
  await page.send('Page.navigate', { url: browser.origin + '/' });
  await page.wait('!!window.__HV_HOST_ATLASES && !!document.getElementById("hvLoginContinue")', 30000);
  await page.click('#hvLoginContinue');
  await page.wait('document.getElementById("hvLoginRoot").hidden');
  // Go straight to the hunt screen (iPhone full-page direct-enter path).
  await page.evaluate(`typeof navTo==='function' && navTo('hunt')`);
  await page.wait(`!!document.querySelector('[data-hunt-go]')`, 20000);
  // Selecting a contract enables the "Vào săn" button.
  await page.evaluate(`document.querySelector('[data-hunt-contract]')?.click()`);
  await sleep(300);
  const goState = await page.evaluate(`(() => {
    const b = document.querySelector('[data-hunt-go]');
    return { disabled: b?.disabled, text: b?.textContent?.trim(), screen: (typeof ST!=='undefined') ? ST.screen : '?', attempts: document.querySelector('[data-hunt-attempts]')?.textContent };
  })()`);
  report.steps.push('hunt-go: ' + JSON.stringify(goState));
  // hunt-runtime canGo requires a selected contract: attempts > 0 && !!hunt.contract.
  const contractId = await page.evaluate(`(() => {
    const c = document.querySelector('[data-hunt-contract]:not([disabled])');
    if (c) c.click();
    return c ? c.dataset.huntContract : null;
  })()`);
  report.steps.push('contract selected: ' + contractId);
  await page.wait(`!document.querySelector('[data-hunt-go]')?.disabled`, 10000);
  await page.click('[data-hunt-go]');
  try {
    await page.wait(`location.pathname.endsWith('battle.html') || document.getElementById('hvBattleOverlay')?.classList.contains('is-open')`, 20000);
  } catch (e) {
    const diag = await page.evaluate(`(() => ({
      href: location.href.slice(0, 120),
      screen: (typeof ST!=='undefined') ? ST.screen : '?',
      toast: document.getElementById('progToast')?.textContent || '',
      overlay: document.getElementById('hvBattleOverlay')?.className || 'none',
      stamina: (typeof P !== 'undefined') ? P.stamina : null
    }))()`);
    report.steps.push('post-click diag: ' + JSON.stringify(diag));
    throw e;
  }
  await page.wait(`document.body.classList.contains('embedded-battle') || !!document.getElementById('hvBattleFrame')?.contentDocument?.body?.classList?.contains('embedded-battle')`, 45000);
  report.steps.push('hunt battle booted (full-page)');

  await page.wait(`(() => { const f = document.getElementById('hvBattleFrame'); if (window.__HON_VIET__) return true; const d = f && f.contentDocument; return !!(d && d.body && d.body.classList.contains('embedded-battle')); })()`, 45000);
  const realm = await page.evaluate(`window.__HON_VIET__ ? 'top' : 'frame'`);
  report.steps.push('battle realm: ' + realm);
  if (realm === 'frame') {
    // Full-page battle: switch sampling to the top-level document context.
    report.steps.push('full-page battle context (top-level is battle.html)');
  }
  const unitIds = await page.evaluate(`window.__HON_VIET__.getUnits().map(u => u.team + ':' + u.id + ':' + u.maxHp)`);
  report.steps.push('units: ' + JSON.stringify(unitIds));

  const sample = `(() => {
    const units = window.__HON_VIET__.getUnits();
    const enemies = units.filter(u => u.team === 'enemy');
    const boss = enemies.slice().sort((a,b) => b.maxHp - a.maxHp)[0];
    const players = units.filter(u => u.team === 'player');
    return {
      t: Math.round(performance.now()),
      boss: boss ? { id: boss.id, state: boss.state, hp: boss.hp } : null,
      enemyStates: enemies.map(e => e.state).join(','),
      playerStates: players.map(p => p.id.replace('hv-player-0-','') + ':' + p.state).join(','),
      bossX: boss ? Math.round(boss.x) : null,
      round: (window.__HON_VIET__.getState?.() || {}).round
    };
  })()`;

  const N = 220; // ~44s at 200ms
  for (let i = 0; i < N; i++) {
    try { report.samples.push(await page.evaluate(sample)); } catch (e) { if (i % 20 === 0) report.errors.push('sample ' + i + ': ' + e.message); }
    await sleep(200);
  }

  report.movementByActor = await page.evaluate(`(() => {
    const events = window.__HV_SKILL_MOVEMENT_QA?.events?.() || [];
    const byActor = {};
    for (const e of events) {
      const id = e.actorId || e.unitId || 'unknown';
      byActor[id] = byActor[id] || {};
      byActor[id][e.type] = (byActor[id][e.type] || 0) + 1;
    }
    return byActor;
  })()`);

  // Summarize boss windows and player hurt hits
  const attackWindows = report.samples.filter(s => s.enemyStates && /attack|skill1|ultimate|cast/.test(s.enemyStates));
  const hurtHits = report.samples.filter(s => s.playerStates && s.playerStates.includes('hurt'));
  report.summary = {
    bossAttackStateSamples: attackWindows.length,
    bossAttackExamples: attackWindows.slice(0, 4),
    playerHurtSamples: hurtHits.length,
    playerHurtExamples: hurtHits.slice(0, 4),
    movementByActor: report.movementByActor
  };
} catch (e) {
  report.errors.push(e.message);
} finally {
  await browser.close();
}
console.log(JSON.stringify(report, null, 2));
