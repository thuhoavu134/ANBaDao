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
const out = join(process.cwd(), 'docs/qa/L138-SHEEN-SMOOTH');
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-web-security'] });
const errors = [];
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
page.on('pageerror', err => errors.push(String(err)));

const snap = () => page.evaluate(() => {
  const hot = document.querySelector('#hvBbrDesk [data-bbr-cell].is-hot');
  const ring = document.querySelector('#hvBbrDesk .hv-bbr-ring');
  if (!hot) return { hotCount: 0 };
  const cs = getComputedStyle(hot, ':after');
  return {
    hold: !!(ring && ring.classList.contains('is-hold')),
    hotCount: document.querySelectorAll('#hvBbrDesk [data-bbr-cell].is-hot').length,
    anim: String(cs.animationName || ''),
    duration: String(cs.animationDuration || ''),
    transform: String(cs.transform || ''),
    opacity: String(cs.opacity || '')
  };
});

await page.goto(origin + '/?qa=unlock-all', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(700);
const btn = page.locator('#hvLoginContinue');
if (await btn.count()) await btn.click({ force: true }).catch(() => {});
await page.evaluate(() => {
  const root = document.getElementById('hvLoginRoot');
  if (root) { root.hidden = true; root.classList.remove('is-open'); }
  document.getElementById('__mgDiag')?.remove();
  if (typeof P === 'object') {
    P.so = Math.max(P.so || 0, 80);
    P.bachBao = Object.assign(P.bachBao || {}, { pending: { t: 'gold', stars: 2, n: 2 }, lastIdx: 7, bet: 2 });
  }
  if (typeof persist === 'function') persist();
});
await page.evaluate(() => { if (typeof navTo === 'function') navTo('festival'); });
await page.waitForSelector('#hvFestivalRoot.is-open', { timeout: 8000 });
await page.locator('#hvFestCity [data-fcity="wheel"]').click({ force: true });
await page.waitForSelector('#hvBbrDesk', { timeout: 8000 });
await page.evaluate(() => {
  if (typeof P !== 'object') return;
  P.so = Math.max(P.so || 0, 80);
  P.bachBao = Object.assign(P.bachBao || {}, { pending: { t: 'gold', stars: 2, n: 2 }, lastIdx: 7, bet: 2 });
});
await page.locator('#hvBbrDesk [data-bbr-bet="2"]').click({ force: true });
await page.waitForSelector('#hvBbrDesk .hv-bbr-ring.is-hold', { timeout: 5000 });
await page.waitForTimeout(200);
const samples = [];
samples.push(await snap());
await page.screenshot({ path: join(out, 'hold-a-390x844.png') });
for (const wait of [500, 500, 220]) {
  await page.waitForTimeout(wait);
  samples.push(await snap());
}
await page.screenshot({ path: join(out, 'hold-b-390x844.png') });
await browser.close();

const appErrors = errors.filter(text => !/extension|favicon|Failed to load resource/i.test(text));
const transforms = samples.map(s => s.transform);
const unique = new Set(transforms).size;
const stalled = samples.length >= 4 && samples[2].transform === samples[3].transform;
const first = samples[0];
const ok = first.hold && first.hotCount === 1 && /bbrSheen/i.test(first.anim) && first.duration === '1.5s'
  && unique === samples.length && !stalled && appErrors.length === 0;
writeFileSync(join(out, 'evidence.json'), JSON.stringify({
  ticket: 'TKT-0138', samples, unique, stalled, appErrors, ok, ts: new Date().toISOString()
}, null, 2));
console.log(ok ? 'PASS' : 'FAIL', 'L138-P1', JSON.stringify({
  unique, stalled, duration: first.duration, err: appErrors[0] || ''
}));
if (!ok) process.exit(1);
