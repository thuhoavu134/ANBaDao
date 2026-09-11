import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const out = join(dirname(fileURLToPath(import.meta.url)), '../docs/qa/L08-ARENA');
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on('pageerror', err => errors.push(String(err)));
page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

const origin = process.env.ARENA_QA_ORIGIN || 'http://127.0.0.1:8080';
await page.goto(origin + '/?qa=unlock-all', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(900);
await page.evaluate(() => {
  document.getElementById('__mgDiag')?.remove();
  document.getElementById('hvQaFullAccess')?.remove();
});

const hubMarks = await page.locator('#hubScreen [data-art-go="arena"]').count();
await page.locator('#hubScreen [data-art-go="arena"]').first().click({ force: true });
await page.waitForSelector('#hvArenaRoot', { timeout: 6000 });
await page.waitForTimeout(250);
const title = await page.locator('[data-arena-title]').textContent();
const tabCount = await page.locator('[data-arena-tab]').count();
await page.screenshot({ path: join(out, 'arena-season-390x844.png'), fullPage: false });

await page.locator('[data-arena-tab="pvp"]').click();
await page.waitForTimeout(200);
const pvpCards = await page.locator('[data-arena-card]').count();
const rankText = await page.locator('[data-arena-rank]').textContent();
await page.screenshot({ path: join(out, 'arena-pvp-390x844.png'), fullPage: false });

await page.locator('[data-arena-tab="pve"]').click();
await page.waitForTimeout(200);
const stageCount = await page.locator('[data-arena-stage]').count();
await page.screenshot({ path: join(out, 'arena-pve-390x844.png'), fullPage: false });

const chaptersBefore = await page.evaluate(() => Array.isArray(P.clearedChapters) ? P.clearedChapters.slice() : []);
const gemsBefore = await page.evaluate(() => Number(P.gems || 0));
const goldBefore = await page.evaluate(() => Number(P.gold || 0));
await page.evaluate(() => {
  P.season = P.season || {};
  P.season.lp = 180;
  P.season.claimed = [];
  ST.arenaTab = 'season';
  renderArena();
});
await page.waitForTimeout(200);
await page.locator('[data-arena-lp="180"]').click();
await page.waitForTimeout(250);
const gemsAfter = await page.evaluate(() => Number(P.gems || 0));
const goldAfter = await page.evaluate(() => Number(P.gold || 0));
const claimed = await page.evaluate(() => (P.season?.claimed || []).slice());

await page.evaluate(() => {
  const rival = (P.arena?.rivals && P.arena.rivals[0]) || { rank: 780, name: 'Hội Cú Đêm', team: ['ong_hang_pho'] };
  window.HonVietArena.applyWin(rival);
  ST.arenaTab = 'pvp';
  renderArena();
});
await page.waitForTimeout(250);
const rankAfter = await page.evaluate(() => Number(P.arena?.rank || 0));
const chapters = await page.evaluate(() => Array.isArray(P.clearedChapters) ? P.clearedChapters.slice() : []);
await page.locator('[data-arena-back]').click();
await page.waitForTimeout(250);
const hubAfter = await page.locator('#hubScreen [data-art-go="arena"]').count();
await page.screenshot({ path: join(out, 'hub-arena-390x844.png'), fullPage: false });

const appErrors = errors.filter(text => !/extension|favicon|Failed to load resource|net::ERR/i.test(text));
const result = {
  hubMarks,
  title,
  tabCount,
  pvpCards,
  rankText,
  stageCount,
  gemsBefore,
  gemsAfter,
  goldBefore,
  goldAfter,
  claimed,
  rankAfter,
  chapters,
  chaptersUntouched: JSON.stringify(chapters) === JSON.stringify(chaptersBefore),
  hubAfter,
  appErrors,
  pass: hubMarks === 1
    && /Võ Đài Kẻ Mất Ngủ/.test(title || '')
    && tabCount === 3
    && pvpCards === 3
    && stageCount === 8
    && gemsAfter === gemsBefore + 40
    && goldAfter === goldBefore + 800
    && Array.isArray(claimed) && claimed.includes(180)
    && rankAfter > 0 && rankAfter <= 1000
    && JSON.stringify(chapters) === JSON.stringify(chaptersBefore)
    && hubAfter === 1
    && appErrors.length === 0
};
writeFileSync(join(out, 'evidence.json'), JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
await browser.close();
if (!result.pass) process.exit(1);
