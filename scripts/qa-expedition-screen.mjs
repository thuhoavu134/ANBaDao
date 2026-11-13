import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const out = join(dirname(fileURLToPath(import.meta.url)), '../docs/qa/L15-EXPEDITION');
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on('pageerror', err => errors.push(String(err)));
page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

const origin = process.env.EXPEDITION_QA_ORIGIN || 'http://127.0.0.1:8080';
await page.goto(origin + '/?qa=unlock-all', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(900);
await page.evaluate(() => {
  document.getElementById('__mgDiag')?.remove();
  document.getElementById('hvQaFullAccess')?.remove();
});

const hubMarks = await page.locator('#hubScreen [data-art-go="expedition"]').count();
await page.locator('#hubScreen [data-art-go="expedition"]').first().click({ force: true });
await page.waitForSelector('#hvExpeditionRoot', { timeout: 6000 });
await page.waitForTimeout(250);
const idleFloor = await page.locator('[data-expedition-floor]').textContent();
const startLabel = await page.locator('[data-expedition-start]').textContent();
await page.screenshot({ path: join(out, 'expedition-idle-390x844.png'), fullPage: false });

await page.locator('[data-expedition-start]').click();
await page.waitForTimeout(250);
const floorAfterStart = await page.locator('[data-expedition-floor]').textContent();
const routeCount = await page.locator('[data-expedition-route]').count();
await page.locator('[data-expedition-route="mist"]').click();
await page.waitForTimeout(200);
const routeOn = await page.locator('[data-expedition-route="mist"].is-on').count();
const fightLabel = await page.locator('[data-expedition-fight]').textContent();
const chaptersBefore = await page.evaluate(() => Array.isArray(P.clearedChapters) ? P.clearedChapters.slice() : []);
await page.screenshot({ path: join(out, 'expedition-route-390x844.png'), fullPage: false });

await page.evaluate(() => {
  window.__rogueBattles = 0;
  const orig = window.runBattle;
  window.runBattle = function patchedRunBattle(id, cb) {
    window.__rogueBattles = (window.__rogueBattles || 0) + 1;
    window.__rogueBattleId = id;
    if (typeof cb === 'function') cb(true);
  };
});
await page.locator('[data-expedition-fight]').click();
await page.waitForTimeout(400);
const battles = await page.evaluate(() => Number(window.__rogueBattles || 0));
const battleId = await page.evaluate(() => String(window.__rogueBattleId || ''));
const offerCount = await page.locator('[data-expedition-bless]').count();
const pendingFloor = await page.locator('[data-expedition-floor]').textContent();
const chapters = await page.evaluate(() => Array.isArray(P.clearedChapters) ? P.clearedChapters.slice() : []);
const chaptersUntouched = JSON.stringify(chapters) === JSON.stringify(chaptersBefore);
await page.screenshot({ path: join(out, 'expedition-bless-390x844.png'), fullPage: false });

if (offerCount) {
  await page.locator('[data-expedition-bless]').first().click();
  await page.waitForTimeout(250);
}
const floorAfterBless = await page.locator('[data-expedition-floor]').textContent();
const worn = await page.locator('[data-expedition-worn] span').count();
await page.locator('[data-expedition-abort]').click();
await page.waitForTimeout(250);
const afterAbort = await page.locator('[data-expedition-floor]').textContent();
const best = await page.evaluate(() => Number(P.rogue?.best || 0));
await page.locator('[data-expedition-back]').click();
await page.waitForTimeout(250);
const hubAfter = await page.locator('#hubScreen [data-art-go="expedition"]').count();
await page.screenshot({ path: join(out, 'hub-expedition-390x844.png'), fullPage: false });

const appErrors = errors.filter(text => !/extension|favicon|Failed to load resource|net::ERR/i.test(text));
const result = {
  hubMarks,
  idleFloor,
  startLabel,
  floorAfterStart,
  routeCount,
  routeOn,
  fightLabel,
  battles,
  battleId,
  offerCount,
  pendingFloor,
  chapters,
  chaptersUntouched,
  floorAfterBless,
  worn,
  afterAbort,
  best,
  hubAfter,
  appErrors,
  pass: hubMarks === 1
    && /Chưa lên đường/.test(idleFloor || '')
    && /Bắt đầu Hành Tẩu/.test(startLabel || '')
    && /Tầng 1/.test(floorAfterStart || '')
    && routeCount === 3
    && routeOn === 1
    && /Xuất chiến tầng 1/.test(fightLabel || '')
    && battles === 1
    && battleId === '__rogue'
    && offerCount === 3
    && /Phúc Duyên/.test(pendingFloor || '')
    && chaptersUntouched
    && /Tầng 2/.test(floorAfterBless || '')
    && worn >= 1
    && /Chưa lên đường/.test(afterAbort || '')
    && best >= 1
    && hubAfter === 1
    && appErrors.length === 0
};
writeFileSync(join(out, 'evidence.json'), JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
await browser.close();
if (!result.pass) process.exit(1);
