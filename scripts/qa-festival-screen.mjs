import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const out = join(dirname(fileURLToPath(import.meta.url)), '../docs/qa/L08-FESTIVAL');
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on('pageerror', err => errors.push(String(err)));
page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

const origin = process.env.FESTIVAL_QA_ORIGIN || 'http://127.0.0.1:8080';
await page.goto(origin + '/', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(900);
await page.evaluate(() => {
  document.getElementById('__mgDiag')?.remove();
  document.getElementById('hvQaFullAccess')?.remove();
  try { localStorage.removeItem('mong_gioi_save_v1'); } catch (_) {}
});
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForTimeout(900);
await page.evaluate(() => {
  document.getElementById('__mgDiag')?.remove();
  document.getElementById('hvQaFullAccess')?.remove();
});

const hubBtn = page.locator('#hubScreen [data-art-go="festival"]').first();
const hubMarks = await page.locator('#hubScreen [data-art-go="festival"]').count();
const hubLocked = await hubBtn.evaluate(el => el.classList.contains('is-locked') || el.classList.contains('locked'));
await page.screenshot({ path: join(out, 'hub-festival-390x844.png'), fullPage: false });
await hubBtn.click();
await page.waitForSelector('#hvFestivalRoot', { timeout: 6000 });
await page.waitForTimeout(250);
const title = await page.locator('[data-fest-title]').textContent();
const themeCount = await page.locator('[data-fest-theme]').count();
const wheelCells = await page.locator('[data-fest-cell]').count();
await page.screenshot({ path: join(out, 'festival-idle-390x844.png'), fullPage: false });

const goldBefore = await page.evaluate(() => Number(P.gold || 0));
const gemsBefore = await page.evaluate(() => Number(P.gems || 0));
const chaptersBefore = await page.evaluate(() => Array.isArray(P.clearedChapters) ? P.clearedChapters.slice() : []);
await page.locator('[data-fest-release]').click();
await page.waitForTimeout(250);
const goldAfterFree = await page.evaluate(() => Number(P.gold || 0));
const countAfterFree = await page.evaluate(() => Number(P.hoadang?.count || 0));
await page.screenshot({ path: join(out, 'festival-lantern-390x844.png'), fullPage: false });

await page.locator('[data-fest-theme="duyenpho"]').click();
await page.waitForTimeout(150);
const selected = await page.evaluate(() => P.hoadang?.theme);

await page.evaluate(() => {
  P.hoadang = P.hoadang || {};
  P.hoadang.theme = 'khailo';
  P.hoadang.themesUsed = ['ankhang', 'duyenpho'];
  P.hoadang.marks = 2;
  P.hoadang.claimedMarks = [];
  P.hoadang.setClaimed = false;
  P.hoadang.count = 1;
  window.HonVietFestival.release();
});
await page.waitForTimeout(250);
const marksAfter = await page.evaluate(() => Number(P.hoadang?.marks || 0));
const claimed = await page.evaluate(() => (P.hoadang?.claimedMarks || []).slice());
const gemsAfter = await page.evaluate(() => Number(P.gems || 0));
const goldAfterSet = await page.evaluate(() => Number(P.gold || 0));
await page.screenshot({ path: join(out, 'festival-mark-390x844.png'), fullPage: false });

await page.locator('[data-fest-spin]').scrollIntoViewIfNeeded();
await page.waitForTimeout(200);
await page.screenshot({ path: join(out, 'festival-wheel-390x844.png'), fullPage: false });
await page.screenshot({ path: join(out, 'festival-full-390.png'), fullPage: true });

const chapters = await page.evaluate(() => Array.isArray(P.clearedChapters) ? P.clearedChapters.slice() : []);
await page.locator('[data-fest-back]').click();
await page.waitForTimeout(250);
const hubAfter = await page.locator('#hubScreen [data-art-go="festival"]').count();

const appErrors = errors.filter(text => !/extension|favicon|Failed to load resource|net::ERR/i.test(text));
const result = {
  hubMarks,
  hubLocked,
  title,
  themeCount,
  wheelCells,
  goldBefore,
  goldAfterFree,
  countAfterFree,
  selected,
  marksAfter,
  claimed,
  gemsBefore,
  gemsAfter,
  goldAfterSet,
  chapters,
  chaptersUntouched: JSON.stringify(chapters) === JSON.stringify(chaptersBefore),
  hubAfter,
  appErrors,
  pass: hubMarks === 1
    && hubLocked === false
    && /Tam Nguyện Sông Mơ/.test(title || '')
    && themeCount === 3
    && wheelCells === 20
    && countAfterFree === 1
    && goldAfterFree >= goldBefore
    && selected === 'duyenpho'
    && marksAfter === 3
    && Array.isArray(claimed) && claimed.includes(3)
    && gemsAfter >= gemsBefore + 20
    && JSON.stringify(chapters) === JSON.stringify(chaptersBefore)
    && hubAfter === 1
    && appErrors.length === 0
};
writeFileSync(join(out, 'evidence.json'), JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
await browser.close();
if (!result.pass) process.exit(1);
