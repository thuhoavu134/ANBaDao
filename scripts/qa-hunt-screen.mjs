import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const out = join(dirname(fileURLToPath(import.meta.url)), '../docs/qa/L08-HUNT');
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on('pageerror', err => errors.push(String(err)));
page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

const origin = process.env.HUNT_QA_ORIGIN || 'http://127.0.0.1:8080';
await page.goto(origin + '/?qa=unlock-all', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(900);
await page.evaluate(() => {
  document.getElementById('__mgDiag')?.remove();
  document.getElementById('hvQaFullAccess')?.remove();
});

const hubMarks = await page.locator('#hubScreen [data-art-go="hunt"]').count();
await page.locator('#hubScreen [data-art-go="hunt"]').first().click({ force: true });
await page.waitForSelector('#hvHuntRoot', { timeout: 6000 });
await page.waitForTimeout(250);
const title = await page.locator('[data-hunt-title]').textContent();
const boss = await page.locator('[data-hunt-boss]').textContent();
const contractCount = await page.locator('[data-hunt-contract]').count();
await page.screenshot({ path: join(out, 'hunt-idle-390x844.png'), fullPage: false });

await page.locator('[data-hunt-contract="break_core"]').click();
await page.waitForTimeout(200);
const selected = await page.evaluate(() => P.hunt?.contract);
await page.screenshot({ path: join(out, 'hunt-contract-390x844.png'), fullPage: false });

const chaptersBefore = await page.evaluate(() => Array.isArray(P.clearedChapters) ? P.clearedChapters.slice() : []);
const gemsBefore = await page.evaluate(() => Number(P.gems || 0));
const goldBefore = await page.evaluate(() => Number(P.gold || 0));
const soBefore = await page.evaluate(() => Number(P.so || 0));
await page.evaluate(() => {
  const bz = todayBoss();
  P.hunt = P.hunt || {};
  P.hunt.marks = P.hunt.marks || {};
  P.hunt.claimedMarks = P.hunt.claimedMarks || {};
  P.hunt.marks[bz.id] = 2;
  P.hunt.claimedMarks[bz.id] = [];
  P.hunt.contract = 'break_core';
  P.hunt.contractDone = false;
  window.HonVietHunt.applySettle({ dmg: 30000, killed: false, addsDown: false, hpMax: 100000 });
  renderHunt();
});
await page.waitForTimeout(250);
const gemsAfter = await page.evaluate(() => Number(P.gems || 0));
const goldAfter = await page.evaluate(() => Number(P.gold || 0));
const soAfter = await page.evaluate(() => Number(P.so || 0));
const marksAfter = await page.evaluate(() => {
  const bz = todayBoss();
  return Number((P.hunt?.marks && P.hunt.marks[bz.id]) || 0);
});
const claimed = await page.evaluate(() => {
  const bz = todayBoss();
  return (P.hunt?.claimedMarks && P.hunt.claimedMarks[bz.id]) || [];
});
const chapters = await page.evaluate(() => Array.isArray(P.clearedChapters) ? P.clearedChapters.slice() : []);
await page.screenshot({ path: join(out, 'hunt-settle-390x844.png'), fullPage: false });

await page.locator('[data-hunt-back]').click();
await page.waitForTimeout(250);
const hubAfter = await page.locator('#hubScreen [data-art-go="hunt"]').count();
await page.screenshot({ path: join(out, 'hub-hunt-390x844.png'), fullPage: false });

const goldExpect = goldBefore + Math.floor(30000 / 40) + Math.floor(Math.floor(30000 / 40) * 0.25) + 250;
const appErrors = errors.filter(text => !/extension|favicon|Failed to load resource|net::ERR/i.test(text));
const result = {
  hubMarks,
  title,
  boss,
  contractCount,
  selected,
  gemsBefore,
  gemsAfter,
  goldBefore,
  goldAfter,
  soBefore,
  soAfter,
  marksAfter,
  claimed,
  chapters,
  chaptersUntouched: JSON.stringify(chapters) === JSON.stringify(chaptersBefore),
  hubAfter,
  appErrors,
  pass: hubMarks === 1
    && /Sổ Săn Đêm/.test(title || '')
    && contractCount === 3
    && selected === 'break_core'
    && gemsAfter === gemsBefore + 5
    && goldAfter === goldExpect
    && soAfter === soBefore + 1
    && marksAfter === 3
    && Array.isArray(claimed) && claimed.includes(3)
    && JSON.stringify(chapters) === JSON.stringify(chaptersBefore)
    && hubAfter === 1
    && appErrors.length === 0
};
writeFileSync(join(out, 'evidence.json'), JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
await browser.close();
if (!result.pass) process.exit(1);
