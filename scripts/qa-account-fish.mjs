import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const out = join(dirname(fileURLToPath(import.meta.url)), '../docs/qa/L21-FISH');
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
const fishLocked = await page.locator('[data-assist="fish"].is-locked').count();
const lockedCount = await page.locator('[data-assist].is-locked').count();
await page.locator('[data-assist="fish"]').click({ force: true });
await page.waitForSelector('[data-gear-view="fish"].is-active', { timeout: 5000 });
await page.waitForTimeout(300);
const cellCount = await page.locator('[data-fish-grid] [data-fish]').count();
const goldBefore = await page.locator('[data-gear-view="fish"] [data-gear-gold]').textContent();
await page.locator('[data-fish-cast]').click();
await page.waitForTimeout(400);
const goldAfter = await page.locator('[data-gear-view="fish"] [data-gear-gold]').textContent();
const spent = Number((goldAfter || '0').replace(/\./g, '')) < Number((goldBefore || '0').replace(/\./g, ''));
const caught = await page.locator('[data-fish-grid] .is-catch').count();
const leveled = await page.locator('[data-fish-grid] .lvl').evaluateAll(nodes => nodes.some(node => node.textContent === '+1'));
await page.screenshot({ path: join(out, 'fish-390x844.png'), fullPage: false });
await page.locator('[data-fish-tab="codex"]').click();
await page.waitForTimeout(200);
const codexCopy = await page.locator('[data-fish-tab-body]').textContent();
const loreVisible = /đàn cá/.test(codexCopy || '');
await page.evaluate(() => {
  const ids = ['ca-loc', 'ca-tre', 'ca-ro', 'ca-ngu', 'tom-cang', 'cua-dong', 'ca-dua', 'ca-guom'];
  P.fish = Object.fromEntries(ids.map(id => [id, { lvl: 1 }]));
  window.HonVietAccountGear?.openFish();
});
await page.waitForTimeout(300);
const masterArmed = await page.locator('[data-fish-master]').textContent();
const masterCopy = await page.locator('[data-fish-master-copy]').textContent();
const masterOn = masterArmed === '1' && /Đã kích hoạt/.test(masterCopy || '');
await page.screenshot({ path: join(out, 'fish-master-390x844.png'), fullPage: false });

const appErrors = errors.filter(text => !/extension|favicon|Failed to load resource/i.test(text));
const result = {
  cellCount,
  fishLocked,
  lockedCount,
  spent,
  caught,
  leveled,
  loreVisible,
  masterOn,
  masterArmed,
  goldBefore,
  goldAfter,
  appErrors,
  pass: cellCount === 8 && fishLocked === 0 && lockedCount === 0 && spent && caught === 1 && leveled && loreVisible && masterOn && appErrors.length === 0
};
writeFileSync(join(out, 'evidence.json'), JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
await browser.close();
if (!result.pass) process.exit(1);
