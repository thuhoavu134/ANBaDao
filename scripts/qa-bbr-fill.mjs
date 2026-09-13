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
const out = join(process.cwd(), 'docs/qa/L123-BBR-FILL');
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
  await page.locator('#hvFestCity [data-fcity="wheel"]').click({ force: true }).catch(() => {});
  await page.waitForSelector('#hvBbrDesk', { timeout: 8000 });
  await page.waitForTimeout(300);
  const measure = await page.evaluate(() => {
    const cells = [...document.querySelectorAll('#hvBbrDesk .hv-bbr-cell')];
    const n1 = cells.filter(c => c.querySelector('.hv-bbr-stack.n1'));
    const rows = n1.map(cell => {
      const img = cell.querySelector('img');
      const cr = cell.getBoundingClientRect();
      const ir = img.getBoundingClientRect();
      return {
        src: img.getAttribute('src'),
        ratio: Math.min(ir.width / cr.width, ir.height / cr.height)
      };
    });
    const min = Math.min(...rows.map(r => r.ratio));
    return { n1: rows.length, min, rows };
  });
  await page.screenshot({ path: join(out, 'bbr-' + label + '.png') });
  await page.close();
  const appErrors = errors.filter(text => !/extension|favicon|Failed to load resource/i.test(text));
  const ok = measure.min >= 0.78 && appErrors.length === 0;
  summary.push({ label, ok, min: measure.min, n1: measure.n1, appErrors });
  console.log(ok ? 'PASS' : 'FAIL', 'L123-P1', label, JSON.stringify({ min: Number(measure.min.toFixed(3)), n1: measure.n1, err: appErrors[0] || '' }));
}

await browser.close();
writeFileSync(join(out, 'evidence.json'), JSON.stringify({
  ticket: 'TKT-0123', chrome: summary, safari: 'NOT_RUN', ts: new Date().toISOString()
}, null, 2));
if (summary.some(s => !s.ok)) process.exit(1);
