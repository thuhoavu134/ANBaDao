import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const out = join(dirname(fileURLToPath(import.meta.url)), '../docs/qa/L08-SUMMON');
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on('pageerror', err => errors.push(String(err)));
page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

const origin = process.env.SUMMON_QA_ORIGIN || 'http://127.0.0.1:8080';
await page.goto(origin + '/?qa=unlock-all', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(900);
await page.evaluate(() => {
  document.getElementById('__mgDiag')?.remove();
  document.getElementById('hvQaFullAccess')?.remove();
});

const hubMarks = await page.locator('#hubScreen [data-art-go="summon"]').count();
await page.locator('#hubScreen [data-art-go="summon"]').first().click({ force: true });
await page.waitForSelector('#hvSummonRoot', { timeout: 6000 });
await page.waitForTimeout(250);
const title = await page.locator('[data-summon-title]').textContent();
const pity = await page.locator('[data-summon-pity]').textContent();
const lockCount = await page.locator('[data-summon-lock]').count();
const pickCount = await page.locator('[data-summon-pick]').count();
await page.screenshot({ path: join(out, 'summon-idle-390x844.png'), fullPage: false });

const gemsBefore = await page.evaluate(() => Number(P.gems || 0));
const chaptersBefore = await page.evaluate(() => Array.isArray(P.clearedChapters) ? P.clearedChapters.slice() : []);
const pityBefore = await page.evaluate(() => Number(P.pity || 0));
await page.locator('[data-summon-pull="1"]').click({ force: true });
await page.waitForTimeout(250);
const gemsAfterClick = await page.evaluate(() => Number(P.gems || 0));
const pityAfterClick = await page.evaluate(() => Number(P.pity || 0));
const cardCount = await page.locator('[data-summon-card]').count();

await page.evaluate(() => {
  P.economy = P.economy || {};
  P.economy.spark = 120;
  renderSummon();
});
await page.waitForTimeout(200);
const pickEnabled = await page.locator('[data-summon-pick]:not([disabled])').count();
const firstPick = page.locator('[data-summon-pick]').first();
let sparkAfter = null;
if (await firstPick.count()) {
  await firstPick.click({ force: true });
  await page.waitForTimeout(250);
  sparkAfter = await page.evaluate(() => Number(P.economy?.spark || 0));
}
const chapters = await page.evaluate(() => Array.isArray(P.clearedChapters) ? P.clearedChapters.slice() : []);
await page.locator('[data-summon-back]').click();
await page.waitForTimeout(250);
const hubAfter = await page.locator('#hubScreen [data-art-go="summon"]').count();
await page.screenshot({ path: join(out, 'hub-summon-390x844.png'), fullPage: false });

const appErrors = errors.filter(text => !/extension|favicon|Failed to load resource|net::ERR/i.test(text));
const lockedLive = lockCount >= 1;
const result = {
  hubMarks,
  title,
  pity,
  lockCount,
  pickCount,
  gemsBefore,
  gemsAfterClick,
  pityBefore,
  pityAfterClick,
  cardCount,
  pickEnabled,
  sparkAfter,
  chapters,
  chaptersUntouched: JSON.stringify(chapters) === JSON.stringify(chaptersBefore),
  hubAfter,
  appErrors,
  pass: hubMarks === 1
    && /Vòng Chiêu Mộ/.test(title || '')
    && Number(pity) >= 0
    && pickCount >= 1
    && (lockedLive
      ? (gemsAfterClick === gemsBefore && pityAfterClick === pityBefore && cardCount === 0)
      : (gemsAfterClick === gemsBefore - 80 && cardCount === 1))
    && pickEnabled >= 1
    && sparkAfter === 0
    && JSON.stringify(chapters) === JSON.stringify(chaptersBefore)
    && hubAfter === 1
    && appErrors.length === 0
};
writeFileSync(join(out, 'evidence.json'), JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
await browser.close();
if (!result.pass) process.exit(1);
