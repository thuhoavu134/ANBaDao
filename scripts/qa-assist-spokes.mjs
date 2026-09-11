import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const out = join(dirname(fileURLToPath(import.meta.url)), '../docs/qa/L23-ASSIST-SPOKES');
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on('pageerror', err => errors.push(String(err)));
page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

const origin = process.env.ASSIST_QA_ORIGIN || 'http://127.0.0.1:8080';
await page.goto(origin + '/', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(900);
await page.evaluate(() => {
  document.getElementById('__mgDiag')?.remove();
  document.getElementById('hvQaFullAccess')?.remove();
  try { localStorage.removeItem('mong_gioi_save_v1'); } catch (_) {}
});
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForTimeout(900);
await page.evaluate(() => {
  document.getElementById('__mgDiag')?.remove();
  document.getElementById('hvQaFullAccess')?.remove();
});

const hubTeam = await page.locator('#hubScreen [data-art-go="team"]').count();
await page.screenshot({ path: join(out, 'hub-390x844.png'), fullPage: false });
await page.locator('#hubScreen [data-art-go="team"]').first().click({ force: true });
await page.waitForSelector('#hvGearRoot.is-open [data-gear-view="wheel"].is-active', { timeout: 6000 });
await page.waitForTimeout(280);

const spokeCount = await page.locator('#hvGearRoot [data-assist]').count();
const svgCount = await page.locator('#hvGearRoot [data-gear-view="wheel"] svg').count();
const spokeSrcs = await page.$$eval('#hvGearRoot [data-assist] img', els => els.map(el => el.getAttribute('src') || ''));
const uniquePainted = spokeSrcs.length === 11
  && new Set(spokeSrcs).size === 11
  && spokeSrcs.every(src => /assets\/ui\/account-gear\/spokes\/[a-z]+\.jpg$/.test(src));
const hallBg = await page.evaluate(() => {
  const el = document.querySelector('#hvGearRoot [data-gear-view="wheel"] .hv-assist-stage');
  if (!el) return '';
  return getComputedStyle(el).backgroundImage || '';
});
const hallKept = /assist-hall-day\.jpg/.test(hallBg);
const gearRoot = await page.locator('#hvGearRoot').boundingBox();
const fullScreen = !!(gearRoot && gearRoot.x <= 1 && gearRoot.y <= 1 && gearRoot.width >= 388 && gearRoot.height >= 840);
await page.screenshot({ path: join(out, 'wheel-painted-390x844.png'), fullPage: false });

await page.locator('[data-assist="gear"]').click();
await page.waitForSelector('[data-gear-view="board"].is-active', { timeout: 5000 });
const boardSlots = await page.locator('[data-gear-slot]').count();
await page.screenshot({ path: join(out, 'board-from-spoke-390x844.png'), fullPage: false });
await page.locator('[data-gear-wheel]').first().click();
await page.waitForSelector('[data-gear-view="wheel"].is-active', { timeout: 5000 });

await page.locator('[data-assist="relic"]').click();
await page.waitForSelector('[data-gear-view="relic"].is-active', { timeout: 5000 });
const relicTitle = await page.locator('[data-gear-view="relic"] .hv-gear-title').textContent();
await page.screenshot({ path: join(out, 'relic-from-spoke-390x844.png'), fullPage: false });
await page.locator('[data-gear-view="relic"] [data-gear-wheel]').click();
await page.waitForSelector('[data-gear-view="wheel"].is-active', { timeout: 5000 });

await page.locator('[data-gear-close]').click();
await page.waitForTimeout(300);
const closed = await page.evaluate(() => {
  const el = document.getElementById('hvGearRoot');
  return !el || el.hidden || !el.classList.contains('is-open');
});

const appErrors = errors.filter(text => !/extension|favicon|Failed to load resource/i.test(text));
const result = {
  hubTeam,
  spokeCount,
  svgCount,
  spokeSrcs,
  uniquePainted,
  hallKept,
  fullScreen,
  boardSlots,
  relicTitle,
  closed,
  appErrors,
  pass: hubTeam >= 1
    && spokeCount === 11
    && svgCount === 0
    && uniquePainted === true
    && hallKept === true
    && fullScreen === true
    && boardSlots === 12
    && /Bậc Thầy Bảo Vật/.test(relicTitle || '')
    && closed === true
    && appErrors.length === 0
};
writeFileSync(join(out, 'evidence.json'), JSON.stringify(result, null, 2));
writeFileSync(join(out, 'notes.md'), [
  '# L23-ASSIST-SPOKES',
  '',
  '- Dock Trợ trận → `#hvGearRoot` hall sáng 3D `assist-hall-day.jpg`.',
  '- 11 nan icon 3D từ art sẵn có `assets/ui/account-gear/spokes/{key}.jpg`. Không còn SVG `spokeGlyph`.',
  '- Nan Trang bị / Bảo Vật vẫn mở board / relic. Quân Trận không đổi.',
  `- Chrome 390×844 ${result.pass ? 'PASS' : 'FAIL'}. Safari / device: NOT_RUN.`
].join('\n'));
await browser.close();
if (!result.pass) {
  console.error(result);
  process.exit(1);
}
console.log(JSON.stringify(result, null, 2));
