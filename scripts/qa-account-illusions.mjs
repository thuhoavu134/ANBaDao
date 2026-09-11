import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const out = join(dirname(fileURLToPath(import.meta.url)), '../docs/qa/L20-ILLUSIONS');
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on('pageerror', err => errors.push(String(err)));
page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

await page.goto('http://127.0.0.1:8080/?qa=unlock-all', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(800);
await page.evaluate(() => {
  document.getElementById('__mgDiag')?.remove();
  document.getElementById('hvQaFullAccess')?.remove();
});
await page.locator('#hubScreen [data-art-go="team"]').click({ force: true });
await page.waitForSelector('#hvGearRoot.is-open [data-gear-view="wheel"].is-active', { timeout: 5000 });
const illusionLocked = await page.locator('[data-assist="illusion"].is-locked').count();
await page.locator('[data-assist="illusion"]').click({ force: true });
await page.waitForSelector('[data-gear-view="illusion"].is-active', { timeout: 5000 });
await page.waitForTimeout(300);
const cellCount = await page.locator('[data-illusion-grid] [data-illusion]').count();
const goldBefore = await page.locator('[data-gear-view="illusion"] [data-gear-gold]').textContent();
await page.locator('[data-illusion="hon-trang"]').click();
await page.locator('[data-illusion-enhance]').click();
await page.waitForTimeout(400);
const goldAfter = await page.locator('[data-gear-view="illusion"] [data-gear-gold]').textContent();
const spent = Number((goldAfter || '0').replace(/\./g, '')) < Number((goldBefore || '0').replace(/\./g, ''));
const levelOne = await page.locator('[data-illusion="hon-trang"] .lvl').textContent();
await page.locator('[data-illusion-tab="slot"]').click();
await page.waitForTimeout(200);
await page.locator('[data-illusion-anvi]').click();
await page.waitForTimeout(300);
const slotted = await page.locator('[data-illusion="hon-trang"].is-slotted').count();
await page.locator('[data-illusion="mat-na-tuong"]').click();
await page.locator('[data-illusion-anvi]').click();
await page.waitForTimeout(300);
const slottedTwo = await page.locator('[data-illusion-grid] .is-slotted').count();
await page.screenshot({ path: join(out, 'illusion-390x844.png'), fullPage: false });
await page.evaluate(() => {
  const ids = ['hon-trang', 'mat-na-tuong', 'bong-cheo', 'khoi-den', 'rong-may', 'anh-son-mai'];
  P.illusions = { slots: ['hon-trang', 'mat-na-tuong'], levels: Object.fromEntries(ids.map(id => [id, { lvl: 1 }])) };
  window.HonVietAccountGear?.openIllusion();
});
await page.waitForTimeout(300);
const masterArmed = await page.locator('[data-illusion-master]').textContent();
const masterCopy = await page.locator('[data-illusion-master-copy]').textContent();
const masterOn = masterArmed === '1' && /Đã kích hoạt/.test(masterCopy || '');
await page.screenshot({ path: join(out, 'illusion-master-390x844.png'), fullPage: false });

const appErrors = errors.filter(text => !/extension|favicon|Failed to load resource/i.test(text));
const result = {
  cellCount,
  illusionLocked,
  spent,
  levelOne,
  slotted,
  slottedTwo,
  masterOn,
  masterArmed,
  goldBefore,
  goldAfter,
  appErrors,
  pass: cellCount === 6 && illusionLocked === 0 && spent && levelOne === '+1' && slotted === 1 && slottedTwo === 2 && masterOn && appErrors.length === 0
};
writeFileSync(join(out, 'evidence.json'), JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
await browser.close();
if (!result.pass) process.exit(1);
