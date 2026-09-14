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
const out = join(process.cwd(), 'docs/qa/L140-LINH-DONG-ROSTER');
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-web-security'] });
const errors = [];
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
page.on('pageerror', err => errors.push(String(err)));

await page.goto(origin + '/?qa=unlock-all', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(700);
const btn = page.locator('#hvLoginContinue');
if (await btn.count()) await btn.click({ force: true }).catch(() => {});
await page.evaluate(() => {
  const root = document.getElementById('hvLoginRoot');
  if (root) { root.hidden = true; root.classList.remove('is-open'); }
  document.getElementById('__mgDiag')?.remove();
});
await page.evaluate(() => { if (typeof navTo === 'function') navTo('heroes'); });
await page.waitForSelector('#hvHeroRosterV4.is-open .v4-card', { timeout: 8000 });
await page.waitForTimeout(400);

const snap = async tab => {
  if (tab) {
    await page.locator(`#hvHeroRosterV4 [data-roster-scope="${tab}"]`).click({ force: true });
    await page.waitForTimeout(250);
  }
  return page.evaluate(() => {
    const root = document.getElementById('hvHeroRosterV4');
    const cards = [...root.querySelectorAll('.v4-card')];
    const linh = root.querySelector('[data-hero-id="linh_dong"]');
    const img = linh?.querySelector('.v4-art img');
    return {
      count: cards.length,
      ids: cards.map(c => c.dataset.heroId),
      names: [...root.querySelectorAll('.v4-cardname')].map(n => n.textContent.trim()),
      sub: root.querySelector('.v4-sub')?.textContent || '',
      hasLinh: !!linh,
      portrait: img?.getAttribute('src') || '',
      imgW: img?.naturalWidth || 0
    };
  });
};

const owned = await snap('owned');
await page.screenshot({ path: join(out, 'tuong-390x844.png') });
const catalog = await snap('all');
await page.screenshot({ path: join(out, 'do-giam-390x844.png') });
await page.locator('#hvHeroRosterV4 [data-roster-element="hoa"]').click({ force: true });
await page.waitForTimeout(200);
const fire = await snap();
await page.locator('#hvHeroRosterV4 [data-roster-element="mong"]').click({ force: true });
await page.waitForTimeout(200);
const moon = await snap();
await page.screenshot({ path: join(out, 'moon-390x844.png') });
await browser.close();

const appErrors = errors.filter(text => !/extension|favicon|Failed to load resource/i.test(text));
const ok = owned.hasLinh && catalog.hasLinh
  && owned.names.includes('Linh Đồng') && catalog.names.includes('Linh Đồng')
  && owned.count === 13 && catalog.count === 13
  && /linh-dong\/card\.webp/.test(owned.portrait)
  && fire.hasLinh === false && moon.hasLinh === true
  && appErrors.length === 0;
writeFileSync(join(out, 'evidence.json'), JSON.stringify({
  ticket: 'TKT-0140', owned, catalog, fire: { hasLinh: fire.hasLinh, count: fire.count },
  moon: { hasLinh: moon.hasLinh, names: moon.names }, appErrors, ok, ts: new Date().toISOString()
}, null, 2));
console.log(ok ? 'PASS' : 'FAIL', 'L140-P1', JSON.stringify({
  owned: owned.count, catalog: catalog.count, linh: owned.hasLinh, fire: fire.hasLinh, moon: moon.hasLinh,
  err: appErrors[0] || ''
}));
if (!ok) process.exit(1);
