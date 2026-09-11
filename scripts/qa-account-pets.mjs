import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const out = join(dirname(fileURLToPath(import.meta.url)), '../docs/qa/L14-PETS');
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
const petLocked = await page.locator('[data-assist="pet"].is-locked').count();
await page.locator('[data-assist="pet"]').click({ force: true });
await page.waitForSelector('[data-gear-view="pet"].is-active', { timeout: 5000 });
await page.waitForTimeout(300);
const slotCount = await page.locator('[data-pet]').count();
const goldBefore = await page.locator('[data-gear-view="pet"] [data-gear-gold]').textContent();
await page.locator('[data-pet="kim-quy"]').click();
await page.locator('[data-pet-enhance]').click();
await page.waitForTimeout(400);
const goldAfter = await page.locator('[data-gear-view="pet"] [data-gear-gold]').textContent();
const spent = Number((goldAfter || '0').replace(/\./g, '')) < Number((goldBefore || '0').replace(/\./g, ''));
const levelOne = await page.locator('[data-pet="kim-quy"] .lvl').textContent();
await page.screenshot({ path: join(out, 'pet-390x844.png'), fullPage: false });
await page.locator('[data-pet="rong-lac"]').click();
await page.locator('[data-pet-tab="deploy"]').click();
await page.waitForTimeout(200);
await page.locator('[data-pet-deploy]').click();
await page.waitForTimeout(300);
const deployed = await page.locator('[data-pet="rong-lac"].is-deployed').count();
const deployCopy = await page.locator('[data-pet-tab-body]').textContent();
const deployVisible = /Xuất chiến/.test(deployCopy || '') && /Rồng Lạc/.test(deployCopy || '');
await page.screenshot({ path: join(out, 'pet-deploy-390x844.png'), fullPage: false });
await page.evaluate(() => {
  const ids = ['kim-quy', 'rong-lac', 'ho-thieng', 'hac-trang', 'ca-chep', 'trau-vang'];
  P.pets = { deployed: 'rong-lac', levels: Object.fromEntries(ids.map(id => [id, { lvl: 1 }])) };
  window.HonVietAccountGear?.openPet();
});
await page.waitForTimeout(300);
const masterArmed = await page.locator('[data-pet-master]').textContent();
const masterCopy = await page.locator('[data-pet-master-copy]').textContent();
const masterOn = masterArmed === '1' && /Đã kích hoạt/.test(masterCopy || '');
await page.screenshot({ path: join(out, 'pet-master-390x844.png'), fullPage: false });

const appErrors = errors.filter(text => !/extension|favicon|Failed to load resource/i.test(text));
const result = {
  slotCount,
  petLocked,
  spent,
  levelOne,
  deployed,
  deployVisible,
  masterOn,
  masterArmed,
  goldBefore,
  goldAfter,
  appErrors,
  pass: slotCount === 6 && petLocked === 0 && spent && levelOne === '+1' && deployed === 1 && deployVisible && masterOn && appErrors.length === 0
};
writeFileSync(join(out, 'evidence.json'), JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
await browser.close();
if (!result.pass) process.exit(1);
