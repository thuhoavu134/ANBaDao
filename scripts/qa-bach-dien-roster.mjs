import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = (() => {
  try { return require('playwright'); } catch {}
  try { return require('/workspace/node_modules/playwright'); } catch {}
  throw new Error('playwright missing');
})();
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const origin = process.env.BBR_QA_ORIGIN || 'http://127.0.0.1:8080';
const out = join(process.cwd(), 'docs/qa/L155-BACH-DIEN-ROSTER');
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-web-security'] });
const errors = [];
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const page = await context.newPage();
page.on('pageerror', err => errors.push(String(err)));
page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

await page.goto(origin + '/?qa=unlock-all', { waitUntil: 'domcontentloaded', timeout: 45000 });
await page.waitForTimeout(700);
const btn = page.locator('#hvLoginContinue');
if (await btn.count()) await btn.click({ force: true }).catch(() => {});
await page.evaluate(() => {
  const root = document.getElementById('hvLoginRoot');
  if (root) { root.hidden = true; root.classList.remove('is-open'); }
  document.getElementById('__mgDiag')?.remove();
  document.getElementById('hvQaFullAccess')?.remove();
  if (typeof navTo === 'function') navTo('heroes');
});
await page.waitForSelector('#hvHeroRosterV4.is-open .v4-card', { timeout: 10000 });
await page.waitForTimeout(800);
await page.screenshot({ path: join(out, 'owned-390.png') });
const owned = await page.evaluate(() => {
  const card = document.querySelector('#hvHeroRosterV4 [data-hero-id="bach_dien"]');
  const img = card?.querySelector('.v4-art img');
  return {
    count: document.querySelectorAll('#hvHeroRosterV4 [data-hero-id="bach_dien"]').length,
    name: card?.querySelector('.v4-cardname')?.textContent || '',
    portrait: img?.getAttribute('src') || '',
    officialHas: /bach_dien/.test(String(window.OFFICIAL_ROSTER_12_IDS || ''))
  };
});
await page.locator('#hvHeroRosterV4 [data-roster-scope="all"]').click({ force: true });
await page.waitForTimeout(400);
await page.screenshot({ path: join(out, 'all-390.png') });
const all = await page.evaluate(() => ({
  count: document.querySelectorAll('#hvHeroRosterV4 [data-hero-id="bach_dien"]').length,
  name: document.querySelector('#hvHeroRosterV4 [data-hero-id="bach_dien"] .v4-cardname')?.textContent || ''
}));
await browser.close();
const appErrors = errors.filter(text => !/extension|favicon|Failed to load resource|net::ERR/i.test(text));
const ok = owned.count === 1 && all.count === 1 && owned.name.includes('Bạch Diện')
  && owned.portrait.includes('bach-dien/card.webp') && owned.officialHas === false && appErrors.length === 0;
writeFileSync(join(out, 'evidence.json'), JSON.stringify({ ok, owned, all, appErrors }, null, 2));
console.log(ok ? 'PASS' : 'FAIL', 'L155-P1', JSON.stringify({ owned, all, err: appErrors[0] || '' }));
process.exit(ok ? 0 : 1);
