import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const out = join(dirname(fileURLToPath(import.meta.url)), '../docs/qa/L13-ACCOUNT-GEAR');
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on('pageerror', err => errors.push(String(err)));
page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

await page.goto('http://127.0.0.1:8080/?qa=unlock-all', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(800);
await page.evaluate(() => {
  const diag = document.getElementById('__mgDiag');
  if (diag) diag.remove();
  const qa = document.getElementById('hvQaFullAccess');
  if (qa) qa.remove();
});
await page.locator('#hubScreen [data-art-go="team"]').click({ force: true });
await page.waitForSelector('#hvGearRoot.is-open [data-gear-view="wheel"].is-active', { timeout: 5000 });
await page.screenshot({ path: join(out, 'wheel-390x844.png'), fullPage: false });
await page.locator('[data-assist="gear"]').click();
await page.waitForSelector('[data-gear-view="board"].is-active', { timeout: 5000 });
const slotCount = await page.locator('[data-gear-slot]').count();
await page.locator('[data-gear-tab="wear"]').click();
await page.locator('[data-gear-equip-all]').click();
await page.waitForTimeout(400);
const filled = await page.locator('[data-gear-slot]:not(.is-empty)').count();
await page.locator('[data-gear-tab="enhance"]').click();
await page.locator('[data-gear-slot="I"]').click();
await page.locator('[data-gear-enhance]').click();
await page.waitForTimeout(400);
const master = await page.locator('[data-gear-master]').textContent();
const titleBox = await page.locator('[data-gear-view="board"] .hv-gear-title').boundingBox();
const titleVisible = !!(titleBox && titleBox.y >= 0 && (titleBox.y + titleBox.height) <= 844 && titleBox.height >= 14);
const heroBox = await page.locator('[data-gear-view="board"] .hv-gear-hero').boundingBox();
const heroFillsPortrait = !!(heroBox && heroBox.y <= 24 && heroBox.height >= 844 * 0.55);
await page.screenshot({ path: join(out, 'board-390x844.png'), fullPage: false });
await page.locator('[data-gear-tab="wear"]').click();
await page.screenshot({ path: join(out, 'board-wear-390x844.png'), fullPage: false });

await page.locator('[data-gear-unequip-all]').click();
await page.waitForTimeout(2300);
await page.locator('[data-gear-smelt]').click({ force: true });
await page.waitForSelector('[data-gear-view="smelt"].is-active', { timeout: 5000 });
await page.screenshot({ path: join(out, 'smelt-empty-390x844.png'), fullPage: false });
await page.locator('[data-smelt-once]').click();
await page.waitForTimeout(200);
const emptyToast = await page.locator('#toast').textContent();
const emptyToastOk = /Hãy chọn trang bị/.test(emptyToast || '');
const bagCount = await page.locator('[data-smelt-bag] [data-smelt-item]').count();
await page.locator('[data-smelt-bag] [data-smelt-item]').first().click();
await page.waitForTimeout(150);
const tinhBefore = await page.locator('[data-gear-view="smelt"] [data-gear-tinh]').textContent();
await page.locator('[data-smelt-once]').click();
await page.waitForTimeout(400);
const tinhAfter = await page.locator('[data-gear-view="smelt"] [data-gear-tinh]').textContent();
const smeltToast = await page.locator('#toast').textContent();
const smelted = Number((tinhAfter || '0').replace(/\./g, '')) > Number((tinhBefore || '0').replace(/\./g, ''));
await page.screenshot({ path: join(out, 'smelt-390x844.png'), fullPage: false });
await page.locator('[data-smelt-tab="enhance"]').click();
await page.waitForTimeout(200);
const enhanceOnce = await page.locator('[data-smelt-enhance]').count();
await page.screenshot({ path: join(out, 'smelt-enhance-390x844.png'), fullPage: false });

const appErrors = errors.filter(text => !/extension|favicon|Failed to load resource/i.test(text));
const result = {
  ticket: 'TKT-0008',
  viewport: '390x844',
  slotCount, filled, master, titleVisible, titleBox, heroBox, heroFillsPortrait,
  emptyToast, emptyToastOk, bagCount, tinhBefore, tinhAfter, smelted, smeltToast, enhanceOnce,
  appErrors,
  screenshots: [
    'wheel-390x844.png',
    'board-390x844.png',
    'board-wear-390x844.png',
    'smelt-empty-390x844.png',
    'smelt-390x844.png',
    'smelt-enhance-390x844.png'
  ]
};
writeFileSync(join(out, 'evidence.json'), JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
if (slotCount !== 12 || filled < 12 || !titleVisible || !heroFillsPortrait || !emptyToastOk || bagCount < 1 || !smelted || enhanceOnce < 1 || appErrors.length) process.exit(1);
await browser.close();
