import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const out = join(dirname(fileURLToPath(import.meta.url)), '../docs/qa/L18-ANTIQUES');
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
const antiqueLocked = await page.locator('[data-assist="antique"].is-locked').count();
await page.locator('[data-assist="antique"]').click({ force: true });
await page.waitForSelector('[data-gear-view="antique"].is-active', { timeout: 5000 });
await page.waitForTimeout(300);
const cellCount = await page.locator('[data-antique]').count();
const goldBefore = await page.locator('[data-gear-view="antique"] [data-gear-gold]').textContent();
await page.locator('[data-antique="bia-tien-si"]').click();
await page.locator('[data-antique-enhance]').click();
await page.waitForTimeout(400);
const goldAfter = await page.locator('[data-gear-view="antique"] [data-gear-gold]').textContent();
const spent = Number((goldAfter || '0').replace(/\./g, '')) < Number((goldBefore || '0').replace(/\./g, ''));
const levelOne = await page.locator('[data-antique="bia-tien-si"] .lvl').textContent();
await page.locator('[data-antique-tab="slot"]').click();
await page.waitForTimeout(200);
await page.locator('[data-antique-anvi]').click();
await page.waitForTimeout(300);
const slotted = await page.locator('[data-antique="bia-tien-si"].is-slotted').count();
await page.screenshot({ path: join(out, 'antique-390x844.png'), fullPage: false });
await page.evaluate(() => {
  const ids = ['bia-tien-si', 'riu-da', 'chuong-mot-cot', 'gom-cham', 'sach-thien-nam', 'lu-huong'];
  P.antiques = { equipped: 'bia-tien-si', levels: Object.fromEntries(ids.map(id => [id, { lvl: 1 }])) };
  window.HonVietAccountGear?.openAntique();
});
await page.waitForTimeout(300);
const masterArmed = await page.locator('[data-antique-master]').textContent();
const masterCopy = await page.locator('[data-antique-master-copy]').textContent();
const masterOn = masterArmed === '1' && /Đã kích hoạt/.test(masterCopy || '');
await page.screenshot({ path: join(out, 'antique-master-390x844.png'), fullPage: false });

const appErrors = errors.filter(text => !/extension|favicon|Failed to load resource/i.test(text));
const result = {
  cellCount,
  antiqueLocked,
  spent,
  levelOne,
  slotted,
  masterOn,
  masterArmed,
  goldBefore,
  goldAfter,
  appErrors,
  pass: cellCount === 6 && antiqueLocked === 0 && spent && levelOne === '+1' && slotted === 1 && masterOn && appErrors.length === 0
};
writeFileSync(join(out, 'evidence.json'), JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
await browser.close();
if (!result.pass) process.exit(1);
