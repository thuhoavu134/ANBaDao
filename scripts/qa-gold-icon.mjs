import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = (() => {
  try { return require('playwright'); } catch {}
  try { return require('/workspace/node_modules/playwright'); } catch {}
  throw new Error('playwright missing');
})();
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const origin = process.env.GOLD_QA_ORIGIN || 'http://127.0.0.1:8080';
const out = join(process.cwd(), 'docs/qa/L122-GOLD-ICON');
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
  const label = viewport.width + 'x' + viewport.height;

  await page.evaluate(() => { if (typeof navTo === 'function') navTo('hub'); });
  await page.waitForTimeout(400);
  const hub = await page.evaluate(() => {
    const el = document.querySelector('#hubScreen .art-res .res-icon-gold');
    if (!el) return { ok: false };
    const bg = getComputedStyle(el).backgroundImage;
    return { ok: /materials\/gold\.png/.test(bg), bg };
  });
  await page.screenshot({ path: join(out, 'hub-' + label + '.png') });

  await page.evaluate(() => { if (typeof navTo === 'function') navTo('bag'); });
  await page.waitForSelector('#hvBagRoot.is-open', { timeout: 8000 });
  await page.locator('#hvBagRoot [data-bag-tab="mat"]').click({ force: true });
  await page.waitForTimeout(200);
  const bag = await page.evaluate(() => {
    const img = document.querySelector('#hvBagRoot .hv-bag-ico[alt="Vàng"]');
    return { ok: !!img && /materials\/gold\.png/.test(img.getAttribute('src') || ''), src: img?.getAttribute('src') };
  });
  await page.screenshot({ path: join(out, 'bag-' + label + '.png') });

  await page.evaluate(() => { if (typeof navTo === 'function') navTo('festival'); });
  await page.waitForSelector('#hvFestivalRoot.is-open', { timeout: 8000 });
  await page.locator('#hvFestCity [data-fcity="wheel"]').click({ force: true }).catch(() => {});
  await page.waitForTimeout(400);
  const bbr = await page.evaluate(() => {
    const imgs = [...document.querySelectorAll('#hvBbrDesk img')].map(el => el.getAttribute('src') || '');
    return { ok: imgs.some(s => /materials\/gold\.png/.test(s)), imgs: [...new Set(imgs)] };
  });
  await page.screenshot({ path: join(out, 'bbr-' + label + '.png') });
  await page.close();

  const appErrors = errors.filter(text => !/extension|favicon|Failed to load resource/i.test(text));
  const ok = hub.ok && bag.ok && bbr.ok && appErrors.length === 0;
  summary.push({ label, ok, hub, bag, bbr, appErrors });
  console.log(ok ? 'PASS' : 'FAIL', 'L122-P1', label, JSON.stringify({ hub: hub.ok, bag: bag.ok, bbr: bbr.ok, err: appErrors[0] || '' }));
}

await browser.close();
writeFileSync(join(out, 'evidence.json'), JSON.stringify({
  ticket: 'TKT-0122', chrome: summary, safari: 'NOT_RUN', ts: new Date().toISOString()
}, null, 2));
if (summary.some(s => !s.ok)) process.exit(1);
