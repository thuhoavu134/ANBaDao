import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const out = join(dirname(fileURLToPath(import.meta.url)), '../docs/qa/L13-RELICS');
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
const relicLocked = await page.locator('[data-assist="relic"].is-locked').count();
const badges = await page.locator('[data-assist] span').evaluateAll(nodes => nodes.map(node => {
  const box = node.getBoundingClientRect();
  return { key: node.parentElement?.dataset.assist, x: box.x, y: box.y, w: box.width, h: box.height };
}));
let badgeOverlap = 0;
for (let i = 0; i < badges.length; i++) {
  for (let j = i + 1; j < badges.length; j++) {
    const a = badges[i], b = badges[j];
    const hit = a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
    if (hit) badgeOverlap++;
  }
}
await page.screenshot({ path: join(out, 'wheel-390x844.png'), fullPage: false });
await page.locator('[data-assist="relic"]').click({ force: true });
await page.waitForSelector('[data-gear-view="relic"].is-active', { timeout: 5000 });
await page.waitForTimeout(300);
const slotCount = await page.locator('[data-relic]').count();
const titleBox = await page.locator('[data-gear-view="relic"] .hv-gear-title').boundingBox();
const titleVisible = !!(titleBox && titleBox.y >= 0 && (titleBox.y + titleBox.height) <= 844 && titleBox.height >= 14);
const heroBox = await page.locator('[data-gear-view="relic"] .hv-gear-hero').boundingBox();
const heroFillsPortrait = !!(heroBox && heroBox.y <= 24 && heroBox.height >= 844 * 0.55);
const goldBefore = await page.locator('[data-gear-view="relic"] [data-gear-gold]').textContent();
await page.locator('[data-relic="trong-dong"]').click();
await page.locator('[data-relic-enhance]').click();
await page.waitForTimeout(400);
const goldAfter = await page.locator('[data-gear-view="relic"] [data-gear-gold]').textContent();
const spent = Number((goldAfter || '0').replace(/\./g, '')) < Number((goldBefore || '0').replace(/\./g, ''));
const levelOne = await page.locator('[data-relic="trong-dong"] .lvl').textContent();
await page.screenshot({ path: join(out, 'relic-390x844.png'), fullPage: false });
await page.locator('[data-relic-tab="codex"]').click();
await page.waitForTimeout(200);
const codexCopy = await page.locator('[data-relic-tab-body]').textContent();
const setVisible = /Lạc Việt/.test(codexCopy || '') && /Đế Vương/.test(codexCopy || '');
await page.screenshot({ path: join(out, 'relic-codex-390x844.png'), fullPage: false });
await page.evaluate(() => {
  const ids = ['trong-dong', 'cuu-dinh', 'luoi-cay', 'chuong-dong', 'no-than', 'kiem-ngoc', 'an-vang', 'ngoc-bich'];
  P.relics = Object.fromEntries(ids.map(id => [id, { lvl: 1 }]));
  window.HonVietAccountGear?.openRelic();
});
await page.waitForTimeout(300);
const masterArmed = await page.locator('[data-relic-master]').textContent();
const masterCopy = await page.locator('[data-relic-master-copy]').textContent();
const masterOn = masterArmed === '1' && /Đã kích hoạt/.test(masterCopy || '');
await page.screenshot({ path: join(out, 'relic-master-390x844.png'), fullPage: false });

const appErrors = errors.filter(text => !/extension|favicon|Failed to load resource/i.test(text));
const result = {
  slotCount,
  relicLocked,
  badgeCount: badges.length,
  badgeOverlap,
  titleVisible,
  heroFillsPortrait,
  spent,
  levelOne,
  setVisible,
  masterOn,
  masterArmed,
  goldBefore,
  goldAfter,
  appErrors,
  pass: slotCount === 8 && relicLocked === 0 && badges.length === 11 && badgeOverlap === 0 && titleVisible && spent && levelOne === '+1' && setVisible && masterOn && appErrors.length === 0
};
writeFileSync(join(out, 'evidence.json'), JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
await browser.close();
if (!result.pass) process.exit(1);
