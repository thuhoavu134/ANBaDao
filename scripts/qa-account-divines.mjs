import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const out = join(dirname(fileURLToPath(import.meta.url)), '../docs/qa/L16-DIVINES');
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
const divineLocked = await page.locator('[data-assist="divine"].is-locked').count();
await page.locator('[data-assist="divine"]').click({ force: true });
await page.waitForSelector('[data-gear-view="divine"].is-active', { timeout: 5000 });
await page.waitForTimeout(300);
const bannerCount = await page.locator('[data-divine]').count();
const goldBefore = await page.locator('[data-gear-view="divine"] [data-gear-gold]').textContent();
await page.locator('[data-divine="cam-quan"]').click();
await page.locator('[data-divine-enhance]').click();
await page.waitForTimeout(400);
const goldAfter = await page.locator('[data-gear-view="divine"] [data-gear-gold]').textContent();
const spent = Number((goldAfter || '0').replace(/\./g, '')) < Number((goldBefore || '0').replace(/\./g, ''));
const levelOne = await page.locator('[data-divine="cam-quan"] .lvl').textContent();
await page.screenshot({ path: join(out, 'divine-390x844.png'), fullPage: false });
await page.locator('[data-divine-tab="codex"]').click();
await page.waitForTimeout(200);
const codexCopy = await page.locator('[data-divine-tab-body]').textContent();
const pctVisible = /Buff %/.test(codexCopy || '') && /HP/.test(codexCopy || '');
await page.screenshot({ path: join(out, 'divine-codex-390x844.png'), fullPage: false });
await page.evaluate(() => {
  const ids = ['cam-quan', 'no-binh', 'voi-chien', 'thuy-quan'];
  P.divines = Object.fromEntries(ids.map(id => [id, { lvl: 1 }]));
  window.HonVietAccountGear?.openDivine();
});
await page.waitForTimeout(300);
const masterArmed = await page.locator('[data-divine-master]').textContent();
const masterCopy = await page.locator('[data-divine-master-copy]').textContent();
const masterOn = masterArmed === '1' && /Đã kích hoạt/.test(masterCopy || '');
await page.screenshot({ path: join(out, 'divine-master-390x844.png'), fullPage: false });

const appErrors = errors.filter(text => !/extension|favicon|Failed to load resource/i.test(text));
const result = {
  bannerCount,
  divineLocked,
  spent,
  levelOne,
  pctVisible,
  masterOn,
  masterArmed,
  goldBefore,
  goldAfter,
  appErrors,
  pass: bannerCount === 4 && divineLocked === 0 && spent && levelOne === '+1' && pctVisible && masterOn && appErrors.length === 0
};
writeFileSync(join(out, 'evidence.json'), JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
await browser.close();
if (!result.pass) process.exit(1);
