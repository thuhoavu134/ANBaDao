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
const out = join(process.cwd(), 'docs/qa/L125-FEST-LAMP');
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
      P.bachBao.chests = Math.max(P.bachBao.chests || 0, 1);
      P.bachBao.supreme = Math.max(P.bachBao.supreme || 0, 1);
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

  await page.evaluate(() => { if (typeof navTo === 'function') navTo('festival'); });
  await page.waitForSelector('#hvFestivalRoot.is-open', { timeout: 8000 });
  const hero = await page.evaluate(() => {
    const t = document.querySelector('#hvFestivalRoot .hv-fest-title');
    const c = t ? getComputedStyle(t).color : '';
    return { color: c, red: /rgb\(\s*196,\s*22,\s*28/.test(c) };
  });
  await page.screenshot({ path: join(out, 'hero-' + label + '.png') });

  await page.locator('#hvFestCity [data-fcity="lamp"]').click({ force: true });
  await page.waitForTimeout(400);
  const lamp = await page.evaluate(() => {
    const sky = document.querySelector('#hvFestivalRoot .hv-lamp-sky');
    const n = sky ? sky.querySelectorAll('.hv-float-lamp').length : 0;
    const copy = document.querySelector('#hvFestivalRoot .hv-fest-copy');
    const vis = copy ? getComputedStyle(copy).display !== 'none' : false;
    return { n, vis, fcity: document.getElementById('hvFestivalRoot')?.dataset.fcity };
  });
  await page.screenshot({ path: join(out, 'lamp-' + label + '.png') });

  await page.evaluate(() => {
    const root = document.getElementById('hvFestivalRoot');
    if (!root) return;
    root.classList.remove('is-tile-open');
    root.dataset.fcity = '';
  });
  await page.waitForTimeout(200);
  await page.locator('#hvFestCity [data-fcity="chest"]').click({ force: true });
  await page.waitForSelector('#hvFestVault', { timeout: 5000 });
  await page.locator('#hvFestVault [data-vault-open="normal"]').click({ force: true });
  await page.waitForTimeout(800);
  const fx = await page.evaluate(() => {
    const el = document.getElementById('hvChestFx');
    const vid = el && el.querySelector('video');
    return {
      open: !!(el && el.classList.contains('is-open')),
      src: vid ? (vid.getAttribute('src') || vid.currentSrc || '') : ''
    };
  });
  await page.screenshot({ path: join(out, 'chest-' + label + '.png') });
  await page.close();

  const appErrors = errors.filter(text => !/extension|favicon|Failed to load resource|play\(\)/i.test(text));
  const ok = hero.red && lamp.n >= 8 && lamp.vis && fx.open && /chest-open\.mp4/.test(fx.src) && appErrors.length === 0;
  summary.push({ label, ok, hero, lamp, fx, appErrors });
  console.log(ok ? 'PASS' : 'FAIL', 'L125-P1', label, JSON.stringify({ red: hero.red, lamps: lamp.n, copy: lamp.vis, fx: fx.open, src: /mp4/.test(fx.src), err: appErrors[0] || '' }));
}

await browser.close();
writeFileSync(join(out, 'evidence.json'), JSON.stringify({
  ticket: 'TKT-0125', chrome: summary, safari: 'NOT_RUN', ts: new Date().toISOString()
}, null, 2));
if (summary.some(s => !s.ok)) process.exit(1);
