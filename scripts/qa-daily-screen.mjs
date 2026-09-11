import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const out = join(dirname(fileURLToPath(import.meta.url)), '../docs/qa/L21-DAILY');
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on('pageerror', err => errors.push(String(err)));
page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

const origin = process.env.DAILY_QA_ORIGIN || 'http://127.0.0.1:8080';
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

async function closeCeremony() {
  await page.evaluate(() => {
    const v = document.getElementById('rewardVeil');
    if (v) {
      v.classList.remove('show');
      v.setAttribute('aria-hidden', 'true');
    }
  });
}

const hubMarks = await page.locator('#hubScreen [data-art-go="daily"]').count();
const hubDockCount = await page.locator('#hubScreen .art-dock [data-art-go="daily"]').count();
const hubSideCount = await page.locator('#hubScreen .art-side [data-art-go="daily"]').count();
await page.screenshot({ path: join(out, 'hub-daily-390x844.png'), fullPage: false });

await page.locator('#hubScreen .art-dock [data-art-go="daily"]').first().click();
await page.waitForSelector('#hvLichRoot.is-open', { timeout: 6000 });
await page.waitForTimeout(250);
const lichTitle = await page.locator('[data-lich-title]').textContent();
const spokeCount = await page.locator('[data-lich-spoke]').count();
const campaignLocked = await page.locator('[data-lich-spoke="campaign"].is-locked').count();
const towerLocked = await page.locator('[data-lich-spoke="tower"].is-locked').count();
const trainLocked = await page.locator('[data-lich-spoke="train"].is-locked').count();
const lichBack = await page.locator('[data-lich-back]').count();
const spokeSrcs = await page.$$eval('[data-lich-spoke] img', els => els.map(el => el.getAttribute('src') || ''));
const uniquePainted = spokeSrcs.length === 11
  && new Set(spokeSrcs).size === 11
  && spokeSrcs.every(src => /assets\/daily\/spokes\/[a-z]+\.jpg$/.test(src));
const lichBox = await page.locator('#hvLichRoot').boundingBox();
const lichFull = !!(lichBox && lichBox.x <= 1 && lichBox.y <= 1 && lichBox.width >= 388 && lichBox.height >= 840);
const hubDockCovered = await page.evaluate(() => {
  const lich = document.getElementById('hvLichRoot');
  const dock = document.querySelector('#hubScreen .art-dock');
  if (!lich || !dock) return false;
  const lr = lich.getBoundingClientRect();
  const dr = dock.getBoundingClientRect();
  return lr.bottom >= dr.bottom - 1 && lr.top <= 1;
});
await page.screenshot({ path: join(out, 'lich-wheel-390x844.png'), fullPage: false });

const chaptersBefore = await page.evaluate(() => Array.isArray(P.clearedChapters) ? P.clearedChapters.slice() : []);
await page.locator('[data-lich-spoke="campaign"]').click();
await page.waitForTimeout(400);
const campaignVisible = await page.evaluate(() => ST?.screen === 'campaign' || !!document.getElementById('campaignScreen')?.classList.contains('on') || !!document.getElementById('campaignScreen')?.classList.contains('show'));
const campaignScreen = await page.evaluate(() => ST?.screen || '');
await page.screenshot({ path: join(out, 'lich-campaign-390x844.png'), fullPage: false });

await page.evaluate(() => { if (typeof navTo === 'function') navTo('hub'); });
await page.waitForTimeout(400);
const wheelClosed = await page.evaluate(() => {
  const el = document.getElementById('hvLichRoot');
  return !el || el.hidden || !el.classList.contains('is-open');
});

await page.locator('#hubScreen .art-side [data-art-go="daily"]').first().click({ force: true });
await page.waitForSelector('#hvDailyRoot', { timeout: 6000 });
await page.waitForTimeout(250);
const journalTitle = await page.locator('[data-daily-title]').textContent();
const calDays = await page.locator('[data-daily-day]').count();
const questCount = await page.locator('[data-daily-quest]').count();
const weeklyCount = await page.locator('[data-daily-week]').count();
await page.screenshot({ path: join(out, 'daily-idle-390x844.png'), fullPage: false });

const goldBefore = await page.evaluate(() => Number(P.gold || 0));
const soBefore = await page.evaluate(() => Number(P.so || 0));
await page.locator('[data-daily-sign]').click();
await page.waitForTimeout(300);
await closeCeremony();
await page.waitForTimeout(150);
const goldAfterSign = await page.evaluate(() => Number(P.gold || 0));
const soAfter = await page.evaluate(() => Number(P.so || 0));
const signDay = await page.evaluate(() => Number(P.daily?.signInDay || 0));
const signDisabled = await page.locator('[data-daily-sign][disabled]').count();
await page.screenshot({ path: join(out, 'daily-signin-390x844.png'), fullPage: false });

await page.evaluate(() => {
  P.idle = P.idle || {};
  P.idle.claimedAt = Date.now() - 2 * 3600000;
  renderDaily();
});
await page.waitForTimeout(250);
const idleGoldBefore = await page.evaluate(() => Number(P.gold || 0));
await page.locator('[data-daily-idle]').click();
await page.waitForTimeout(300);
await closeCeremony();
await page.waitForTimeout(150);
const idleGoldAfter = await page.evaluate(() => Number(P.gold || 0));
await page.screenshot({ path: join(out, 'daily-idle-claim-390x844.png'), fullPage: false });

await page.evaluate(() => {
  const q = (P.daily.quests || []).find(x => x.id === 'q_win');
  if (q) q.progress = 3;
  renderDaily();
});
await page.waitForTimeout(200);
const questGoldBefore = await page.evaluate(() => Number(P.gold || 0));
await page.locator('[data-daily-claim="q_win"]').click();
await page.waitForTimeout(300);
await closeCeremony();
await page.waitForTimeout(150);
const questGoldAfter = await page.evaluate(() => Number(P.gold || 0));
const actPts = await page.evaluate(() => Number(P.daily?.activityPoints || 0));
await page.screenshot({ path: join(out, 'daily-quest-390x844.png'), fullPage: false });
await page.screenshot({ path: join(out, 'daily-full-390.png'), fullPage: true });

const chapters = await page.evaluate(() => Array.isArray(P.clearedChapters) ? P.clearedChapters.slice() : []);
await page.locator('[data-daily-back]').click();
await page.waitForTimeout(250);
const hubAfter = await page.locator('#hubScreen [data-art-go="daily"]').count();

const appErrors = errors.filter(text => !/extension|favicon|Failed to load resource|net::ERR/i.test(text));
const result = {
  hubMarks,
  hubDockCount,
  hubSideCount,
  lichTitle,
  spokeCount,
  campaignLocked,
  towerLocked,
  trainLocked,
  lichBack,
  uniquePainted,
  lichFull,
  hubDockCovered,
  campaignScreen,
  campaignVisible,
  wheelClosed,
  journalTitle,
  calDays,
  questCount,
  weeklyCount,
  goldBefore,
  goldAfterSign,
  soBefore,
  soAfter,
  signDay,
  signDisabled,
  idleGoldBefore,
  idleGoldAfter,
  questGoldBefore,
  questGoldAfter,
  actPts,
  chapters,
  chaptersUntouched: JSON.stringify(chapters) === JSON.stringify(chaptersBefore),
  hubAfter,
  appErrors,
  pass: hubMarks === 2
    && hubDockCount === 1
    && hubSideCount === 1
    && /Lịch luyện/.test(lichTitle || '')
    && spokeCount === 11
    && uniquePainted === true
    && lichBack === 1
    && lichFull === true
    && hubDockCovered === true
    && campaignLocked === 0
    && trainLocked === 0
    && towerLocked === 1
    && campaignScreen === 'campaign'
    && wheelClosed === true
    && /Nhật Ký Mơ/.test(journalTitle || '')
    && calDays === 28
    && questCount === 14
    && weeklyCount === 5
    && goldAfterSign === goldBefore + 120
    && soAfter === soBefore + 1
    && signDay === 1
    && signDisabled === 1
    && idleGoldAfter === idleGoldBefore + 120
    && questGoldAfter === questGoldBefore + 200
    && actPts === 15
    && JSON.stringify(chapters) === JSON.stringify(chaptersBefore)
    && hubAfter === 2
    && appErrors.length === 0
};
writeFileSync(join(out, 'evidence.json'), JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
await browser.close();
if (!result.pass) process.exit(1);
