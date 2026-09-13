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
const out = join(process.cwd(), 'docs/qa/L124-BBR-HUB');
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
    if (typeof P === 'object') P.so = Math.max(P.so || 0, 40);
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
  const tile = await page.evaluate(() => {
    const b = [...document.querySelectorAll('#hvFestCity .hv-ftile b')].map(el => el.textContent.trim());
    return { ok: b.includes('Bách Bảo Rương'), labels: b };
  });
  await page.screenshot({ path: join(out, 'city-' + label + '.png') });

  await page.locator('#hvFestCity [data-fcity="wheel"]').click({ force: true });
  await page.waitForSelector('#hvBbrDesk', { timeout: 8000 });
  await page.waitForTimeout(250);
  const hub = await page.evaluate(() => {
    const mark = document.querySelector('#hvBbrDesk .hv-bbr-hub-mark');
    const chest = document.querySelector('#hvBbrDesk .hv-bbr-hub-chest');
    const hoat = [...document.querySelectorAll('#hvBbrDesk .hv-bbr-cell img')].some(img => /hoat-luc\.png/.test(img.getAttribute('src') || ''));
    const cr = chest?.getBoundingClientRect();
    return {
      mark: !!mark,
      hoat,
      chestW: cr ? cr.width : 0
    };
  });
  await page.screenshot({ path: join(out, 'hub-' + label + '.png') });
  await page.close();

  const appErrors = errors.filter(text => !/extension|favicon|Failed to load resource/i.test(text));
  const ok = tile.ok && hub.mark && hub.hoat && hub.chestW >= 60 && appErrors.length === 0;
  summary.push({ label, ok, tile, hub, appErrors });
  console.log(ok ? 'PASS' : 'FAIL', 'L124-P1', label, JSON.stringify({ tile: tile.ok, mark: hub.mark, hoat: hub.hoat, chest: Math.round(hub.chestW), err: appErrors[0] || '' }));
}

await browser.close();
writeFileSync(join(out, 'evidence.json'), JSON.stringify({
  ticket: 'TKT-0124', chrome: summary, safari: 'NOT_RUN', ts: new Date().toISOString()
}, null, 2));
if (summary.some(s => !s.ok)) process.exit(1);
