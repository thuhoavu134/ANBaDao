import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const out = join(dirname(fileURLToPath(import.meta.url)), '../docs/qa/L08-SHOP');
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on('pageerror', err => errors.push(String(err)));
page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

const origin = process.env.SHOP_QA_ORIGIN || 'http://127.0.0.1:8080';
await page.goto(origin + '/?qa=unlock-all', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(900);
await page.evaluate(() => {
  document.getElementById('__mgDiag')?.remove();
  document.getElementById('hvQaFullAccess')?.remove();
});

const hubMarks = await page.locator('#hubScreen [data-art-go="shop"]').count();
await page.locator('#hubScreen [data-art-go="shop"]').first().click({ force: true });
await page.waitForSelector('#hvShopRoot', { timeout: 6000 });
await page.waitForTimeout(250);
const title = await page.locator('[data-shop-title]').textContent();
const cardCount = await page.locator('[data-shop-card]').count();
const buyCount = await page.locator('[data-shop-buy]').count();
await page.screenshot({ path: join(out, 'shop-idle-390x844.png'), fullPage: false });

const goldBefore = await page.evaluate(() => Number(P.gold || 0));
const stamBefore = await page.evaluate(() => Number(P.stamina || 0));
const chaptersBefore = await page.evaluate(() => Array.isArray(P.clearedChapters) ? P.clearedChapters.slice() : []);
await page.locator('[data-shop-buy="stam"]').click();
await page.waitForTimeout(250);
const goldAfter = await page.evaluate(() => Number(P.gold || 0));
const stamSold = await page.locator('[data-shop-card="stam"].is-sold').count();
const stamLabel = await page.locator('[data-shop-buy="stam"]').textContent();
await page.screenshot({ path: join(out, 'shop-bought-390x844.png'), fullPage: false });

await page.locator('[data-shop-buy="stam"]').click({ force: true });
await page.waitForTimeout(150);
const goldUnchanged = await page.evaluate(() => Number(P.gold || 0));
const bought = await page.evaluate(() => (P.shop?.bought || []).slice());

await page.evaluate(() => {
  P.shop.day = -1;
  renderShop();
});
await page.waitForTimeout(250);
const afterRollover = await page.evaluate(() => ({
  day: Number(P.shop?.day),
  bought: (P.shop?.bought || []).length,
  stock: (P.shop?.stock || []).length
}));
const stamOpen = await page.locator('[data-shop-buy="stam"]:not([disabled])').count();
const chapters = await page.evaluate(() => Array.isArray(P.clearedChapters) ? P.clearedChapters.slice() : []);
await page.locator('[data-shop-back]').click();
await page.waitForTimeout(250);
const hubAfter = await page.locator('#hubScreen [data-art-go="shop"]').count();
await page.screenshot({ path: join(out, 'hub-shop-390x844.png'), fullPage: false });

const appErrors = errors.filter(text => !/extension|favicon|Failed to load resource|net::ERR/i.test(text));
const result = {
  hubMarks,
  title,
  cardCount,
  buyCount,
  goldBefore,
  goldAfter,
  stamBefore,
  stamSold,
  stamLabel,
  goldUnchanged,
  bought,
  afterRollover,
  stamOpen,
  chapters,
  chaptersUntouched: JSON.stringify(chapters) === JSON.stringify(chaptersBefore),
  hubAfter,
  appErrors,
  pass: hubMarks === 1
    && /Hắc Thị/.test(title || '')
    && cardCount === 5
    && buyCount === 5
    && goldAfter === goldBefore - 160
    && stamSold === 1
    && /Hết hàng/.test(stamLabel || '')
    && goldUnchanged === goldAfter
    && Array.isArray(bought) && bought.includes('stam')
    && afterRollover.stock === 5
    && afterRollover.bought === 0
    && stamOpen === 1
    && JSON.stringify(chapters) === JSON.stringify(chaptersBefore)
    && hubAfter === 1
    && appErrors.length === 0
};
writeFileSync(join(out, 'evidence.json'), JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
await browser.close();
if (!result.pass) process.exit(1);
