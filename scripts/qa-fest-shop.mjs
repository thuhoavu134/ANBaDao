import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = (() => {
  try { return require('playwright'); } catch {}
  try { return require('/workspace/node_modules/playwright'); } catch {}
  throw new Error('playwright missing');
})();
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const origin = process.env.FEST_QA_ORIGIN || 'http://127.0.0.1:8080';
const out = join(process.cwd(), 'docs/qa/L119-FEST-SHOP');
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-web-security'] });
const summary = [];

async function boot(page) {
  await page.goto(origin + '/?qa=unlock-all', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(700);
  const btn = page.locator('#hvLoginContinue');
  if (await btn.count()) await btn.click({ force: true }).catch(() => {});
  await page.evaluate(() => {
    const root = document.getElementById('hvLoginRoot');
    if (root) { root.hidden = true; root.classList.remove('is-open'); }
    document.getElementById('__mgDiag')?.remove();
    if (typeof P === 'object') {
      P.so = Math.max(P.so || 0, 40);
      P.bachBao = P.bachBao || {};
      P.bachBao.pts = Math.max(P.bachBao.pts || 0, 400);
    }
    if (typeof persist === 'function') persist();
  });
}

for (const viewport of [{ width: 390, height: 844 }, { width: 768, height: 1024 }]) {
  const errors = [];
  const page = await browser.newPage({ viewport });
  page.on('pageerror', err => errors.push(String(err)));
  await boot(page);
  await page.evaluate(() => { if (typeof navTo === 'function') navTo('festival'); });
  await page.waitForSelector('#hvFestivalRoot.is-open', { timeout: 8000 });
  await page.waitForTimeout(300);
  const city = await page.evaluate(() => {
    const tiles = [...document.querySelectorAll('#hvFestCity [data-fcity]')].map(el => ({
      id: el.getAttribute('data-fcity'),
      fact: el.getAttribute('data-fact'),
      name: el.querySelector('b')?.textContent || '',
      src: el.querySelector('img')?.getAttribute('src') || ''
    }));
    return { tiles, city: !!document.getElementById('hvFestCity') };
  });
  const label = viewport.width + 'x' + viewport.height;
  await page.screenshot({ path: join(out, 'city-' + label + '.png') });
  await page.locator('#hvFestCity [data-fcity="wheel"]').click({ force: true });
  await page.waitForTimeout(400);
  await page.screenshot({ path: join(out, 'wheel-' + label + '.png') });
  await page.locator('[data-bbr-pane="shop"]').click({ force: true });
  await page.waitForSelector('#hvBbrShop.is-open', { timeout: 6000 });
  const shop = await page.evaluate(() => {
    const root = document.getElementById('hvBbrShop');
    const goods = [...document.querySelectorAll('#hvBbrShop .hv-bbr-good')].map(el => ({
      id: el.getAttribute('data-bbr-buy'),
      img: el.querySelector('img')?.getAttribute('src') || '',
      name: el.querySelector('b')?.textContent || '',
      cost: el.querySelector('.hv-bbr-cost')?.textContent || ''
    }));
    return {
      open: root?.classList.contains('is-open'),
      keep: !!document.querySelector('#hvBbrShop .hv-bbr-shop-hero img'),
      goods
    };
  });
  await page.screenshot({ path: join(out, 'shop-' + label + '.png') });
  await page.close();
  const appErrors = errors.filter(text => !/extension|favicon|Failed to load resource/i.test(text));
  const facts = (city.tiles || []).map(t => t.fact).sort().join(',');
  const ok = city.city && facts === 'chest,lantern,wheel' && shop.open && shop.goods.length === 6
    && shop.goods.every(g => g.img && g.name && /điểm/i.test(g.cost)) && appErrors.length === 0;
  summary.push({ label, ok, city, shop, appErrors });
  console.log(ok ? 'PASS' : 'FAIL', 'L119-P1', label, appErrors[0] || facts);
}

await browser.close();
writeFileSync(join(out, 'evidence.json'), JSON.stringify({
  ticket: 'TKT-0119', chrome: summary, safari: 'NOT_RUN', ts: new Date().toISOString()
}, null, 2));
if (summary.some(s => !s.ok)) process.exit(1);
