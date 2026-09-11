import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const out = join(dirname(fileURLToPath(import.meta.url)), '../docs/qa/L15-SPIRITS');
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
const spiritLocked = await page.locator('[data-assist="spirit"].is-locked').count();
await page.locator('[data-assist="spirit"]').click({ force: true });
await page.waitForSelector('[data-gear-view="spirit"].is-active', { timeout: 5000 });
await page.waitForTimeout(300);
const cellCount = await page.locator('[data-spirit-grid] [data-spirit]').count();
const goldBefore = await page.locator('[data-gear-view="spirit"] [data-gear-gold]').textContent();
await page.locator('[data-spirit="son-tinh"]').click();
await page.locator('[data-spirit-enhance]').click();
await page.waitForTimeout(400);
const goldAfter = await page.locator('[data-gear-view="spirit"] [data-gear-gold]').textContent();
const spent = Number((goldAfter || '0').replace(/\./g, '')) < Number((goldBefore || '0').replace(/\./g, ''));
const levelOne = await page.locator('[data-spirit-grid] [data-spirit="son-tinh"] .lvl').textContent();
await page.screenshot({ path: join(out, 'spirit-390x844.png'), fullPage: false });
await page.locator('[data-spirit="lieu-hanh"]').click();
await page.locator('[data-spirit-tab="slot"]').click();
await page.waitForTimeout(200);
await page.locator('[data-spirit-slot="1"]').click();
await page.waitForTimeout(300);
const slotted = await page.locator('[data-spirit-grid] [data-spirit="lieu-hanh"].is-slotted').count();
const slotCopy = await page.locator('[data-spirit-tab-body]').textContent();
const setVisible = /Sơn Thủy/.test(slotCopy || '') && /Tiên Thánh/.test(slotCopy || '') && /Hồng Bàng/.test(slotCopy || '');
await page.screenshot({ path: join(out, 'spirit-slot-390x844.png'), fullPage: false });
await page.evaluate(() => {
  const ids = ['son-tinh', 'thuy-tinh', 'thanh-giong', 'lieu-hanh', 'chu-dong-tu', 'ba-chua-xu', 'lac-long-quan', 'au-co', 'than-sam'];
  P.spirits = { slots: ['son-tinh', 'thuy-tinh', 'thanh-giong'], levels: Object.fromEntries(ids.map(id => [id, { lvl: 1 }])) };
  window.HonVietAccountGear?.openSpirit();
});
await page.waitForTimeout(300);
const masterArmed = await page.locator('[data-spirit-master]').textContent();
const masterCopy = await page.locator('[data-spirit-master-copy]').textContent();
const masterOn = masterArmed === '1' && /Đã kích hoạt/.test(masterCopy || '');
await page.screenshot({ path: join(out, 'spirit-master-390x844.png'), fullPage: false });

const appErrors = errors.filter(text => !/extension|favicon|Failed to load resource/i.test(text));
const result = {
  cellCount,
  spiritLocked,
  spent,
  levelOne,
  slotted,
  setVisible,
  masterOn,
  masterArmed,
  goldBefore,
  goldAfter,
  appErrors,
  pass: cellCount === 9 && spiritLocked === 0 && spent && levelOne === '+1' && slotted === 1 && setVisible && masterOn && appErrors.length === 0
};
writeFileSync(join(out, 'evidence.json'), JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
await browser.close();
if (!result.pass) process.exit(1);
