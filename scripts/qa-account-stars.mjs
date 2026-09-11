import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const out = join(dirname(fileURLToPath(import.meta.url)), '../docs/qa/L17-STARS');
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
const starLocked = await page.locator('[data-assist="star"].is-locked').count();
await page.locator('[data-assist="star"]').click({ force: true });
await page.waitForSelector('[data-gear-view="star"].is-active', { timeout: 5000 });
await page.waitForTimeout(300);
const cellCount = await page.locator('[data-star-grid] [data-star]').count();
await page.evaluate(() => {
  P.heroes = P.heroes || {};
  P.heroes.ong_hang_pho = { ...(P.heroes.ong_hang_pho || {}), owned: true, stars: 1, level: 1 };
  P.shards = P.shards || {};
  P.shards.ong_hang_pho = 80;
  window.HonVietAccountGear?.openStar();
});
await page.waitForTimeout(200);
await page.locator('[data-star="ong_hang_pho"]').click();
const shardsBefore = await page.locator('[data-star-shards]').textContent();
await page.locator('[data-star-up]').click();
await page.waitForTimeout(400);
const shardsAfter = await page.locator('[data-star-shards]').textContent();
const spent = Number((shardsAfter || '0').replace(/\./g, '')) < Number((shardsBefore || '0').replace(/\./g, ''));
const starTwo = await page.locator('[data-star-grid] [data-star="ong_hang_pho"] .lvl').textContent();
await page.screenshot({ path: join(out, 'star-390x844.png'), fullPage: false });
await page.locator('[data-star-tab="codex"]').click();
await page.waitForTimeout(200);
const codexCopy = await page.locator('[data-star-tab-body]').textContent();
const loreVisible = /12%/.test(codexCopy || '');
await page.screenshot({ path: join(out, 'star-codex-390x844.png'), fullPage: false });
await page.evaluate(() => {
  const ids = ['ong_hang_pho', 'thay_mo', 'lac_yen', 'cung_thu_tre', 'co_dao_ganh_hoi', 'phong_tu', 'thuy_nuong_roi_nuoc', 'hong_lien_dao_nuong', 'thach_quyen', 'dinh_loi', 'luc_anh', 'to_diep'];
  P.heroes = P.heroes || {};
  for (const id of ids) P.heroes[id] = { ...(P.heroes[id] || {}), owned: true, stars: 2, level: 1 };
  window.HonVietAccountGear?.openStar();
});
await page.waitForTimeout(300);
const masterArmed = await page.locator('[data-star-master]').textContent();
const masterCopy = await page.locator('[data-star-master-copy]').textContent();
const masterOn = masterArmed === '2' && /Đội hình Tinh/.test(masterCopy || '');
await page.screenshot({ path: join(out, 'star-master-390x844.png'), fullPage: false });

const appErrors = errors.filter(text => !/extension|favicon|Failed to load resource/i.test(text));
const result = {
  cellCount,
  starLocked,
  spent,
  starTwo,
  loreVisible,
  masterOn,
  masterArmed,
  shardsBefore,
  shardsAfter,
  appErrors,
  pass: cellCount === 12 && starLocked === 0 && spent && starTwo === '★2' && loreVisible && masterOn && appErrors.length === 0
};
writeFileSync(join(out, 'evidence.json'), JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
await browser.close();
if (!result.pass) process.exit(1);
