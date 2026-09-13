import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = (() => {
  try { return require('playwright'); } catch {}
  try { return require('/workspace/node_modules/playwright'); } catch {}
  throw new Error('playwright missing');
})();
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const origin = process.env.BAG_QA_ORIGIN || 'http://127.0.0.1:8080';
const out = join(process.cwd(), 'docs/qa/L121-BAG-ICONS');
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
      P.gold = Math.max(P.gold || 0, 1709);
      P.gems = Math.max(P.gems || 0, 48);
      P.tinh = Math.max(P.tinh || 0, 1346);
      P.hoat = Math.max(P.hoat || 0, 1200);
      P.so = Math.max(P.so || 0, 40);
    }
    if (typeof persist === 'function') persist();
  });
}

for (const viewport of [{ width: 390, height: 844 }, { width: 768, height: 1024 }]) {
  const errors = [];
  const page = await browser.newPage({ viewport });
  page.on('pageerror', err => errors.push(String(err)));
  await boot(page);
  await page.evaluate(() => { if (typeof navTo === 'function') navTo('bag'); });
  await page.waitForSelector('#hvBagRoot.is-open', { timeout: 8000 });
  await page.locator('#hvBagRoot [data-bag-tab="mat"]').click({ force: true });
  await page.waitForTimeout(250);
  const label = viewport.width + 'x' + viewport.height;
  const cells = await page.evaluate(() => {
    const btns = [...document.querySelectorAll('#hvBagRoot .hv-bag-cell.t-mat')];
    return btns.map(el => {
      const img = el.querySelector('img.hv-bag-ico');
      const r = img ? img.getBoundingClientRect() : null;
      const c = el.getBoundingClientRect();
      return {
        src: img?.getAttribute('src') || '',
        alt: img?.getAttribute('alt') || '',
        imgW: r ? Math.round(r.width) : 0,
        cellW: Math.round(c.width),
        ratio: r && c.width ? r.width / c.width : 0
      };
    });
  });
  await page.screenshot({ path: join(out, 'bag-' + label + '.png') });
  const hoat = cells.find(c => /hoat-luc/.test(c.src));
  if (hoat) {
    await page.locator('#hvBagRoot .hv-bag-cell.t-mat img[src*="hoat-luc"]').click({ force: true });
    await page.waitForSelector('#hvItemTip:not([hidden])', { timeout: 4000 }).catch(() => {});
    await page.waitForTimeout(200);
    await page.screenshot({ path: join(out, 'tip-' + label + '.png') });
  }
  await page.close();
  const appErrors = errors.filter(text => !/extension|favicon|Failed to load resource/i.test(text));
  const srcs = cells.map(c => c.src).join(' ');
  const ok = cells.length >= 5
    && /gold\.png/.test(srcs)
    && /gems\.png/.test(srcs)
    && /tinh-luc\.png/.test(srcs)
    && /hoat-luc\.png/.test(srcs)
    && /so\.png/.test(srcs)
    && cells.every(c => c.ratio >= 0.75)
    && appErrors.length === 0;
  summary.push({ label, ok, cells, appErrors });
  console.log(ok ? 'PASS' : 'FAIL', 'L121-P1', label, appErrors[0] || cells.map(c => c.alt + ':' + c.imgW).join(' '));
}

await browser.close();
writeFileSync(join(out, 'evidence.json'), JSON.stringify({
  ticket: 'TKT-0121', chrome: summary, safari: 'NOT_RUN', ts: new Date().toISOString()
}, null, 2));
if (summary.some(s => !s.ok)) process.exit(1);
