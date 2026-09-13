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
const out = join(process.cwd(), 'docs/qa/L132-SO-POP');
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
  if (typeof P === 'object') {
    P.so = 20;
    P.bachBao = P.bachBao || {};
    P.bachBao.pending = { t: 'gold', stars: 1, n: 1 };
    P.bachBao.lastIdx = 5;
    P.bachBao.bet = 2;
  }
  if (typeof persist === 'function') persist();
});
await page.evaluate(() => { if (typeof navTo === 'function') navTo('festival'); });
await page.waitForSelector('#hvFestivalRoot.is-open', { timeout: 8000 });
await page.locator('#hvFestCity [data-fcity="wheel"]').click({ force: true });
await page.waitForSelector('#hvBbrDesk', { timeout: 8000 });
await page.evaluate(() => {
  P.so = 20;
  P.bachBao = P.bachBao || {};
  P.bachBao.pending = { t: 'gold', stars: 1, n: 1 };
  P.bachBao.lastIdx = 5;
  P.bachBao.bet = 2;
});
await page.locator('#hvBbrDesk [data-bbr-bet="2"]').click({ force: true });
const hold = await page.evaluate(() => {
  const hot = document.querySelector('#hvBbrDesk [data-bbr-cell].is-hot');
  const anim = hot ? getComputedStyle(hot).animationName : '';
  return {
    hold: !!document.querySelector('#hvBbrDesk .hv-bbr-ring.is-hold'),
    hot: !!hot,
    pulse: /bbrHold/i.test(anim)
  };
});
await page.screenshot({ path: join(out, 'hold-390x844.png') });

const soBefore = await page.evaluate(() => P.so);
await page.locator('#hvBbrDesk [data-bbr-convert]').click({ force: true });
await page.waitForSelector('#hvSoFx.is-open', { timeout: 4000 });
const pop = await page.evaluate(() => {
  const fx = document.getElementById('hvSoFx');
  const img = fx && fx.querySelector('img');
  const box = img ? img.getBoundingClientRect() : { width: 0, height: 0 };
  return {
    open: !!(fx && fx.classList.contains('is-open')),
    src: img ? img.getAttribute('src') : '',
    w: Math.round(box.width),
    h: Math.round(box.height),
    btn: !!(fx && fx.querySelector('button, [data-so-fx-done]')),
    text: (fx && fx.textContent) || '',
    so: (typeof P === 'object') ? P.so : -1,
    pe: fx ? getComputedStyle(fx).pointerEvents : ''
  };
});
await page.screenshot({ path: join(out, 'pop-390x844.png') });
await page.waitForTimeout(1200);
const gone = await page.evaluate(() => {
  const fx = document.getElementById('hvSoFx');
  return {
    open: !!(fx && fx.classList.contains('is-open')),
    so: (typeof P === 'object') ? P.so : -1
  };
});
await page.screenshot({ path: join(out, 'gone-390x844.png') });
await browser.close();

const appErrors = errors.filter(text => !/extension|favicon|Failed to load resource/i.test(text));
const ok = hold.hold && hold.hot && !hold.pulse
  && pop.open && pop.w <= 56 && pop.h <= 56 && !pop.btn
  && /bbr\/so\.png/.test(pop.src) && /\+\d+ sò/.test(pop.text)
  && pop.pe === 'none' && pop.so > soBefore
  && !gone.open && gone.so === pop.so
  && appErrors.length === 0;
writeFileSync(join(out, 'evidence.json'), JSON.stringify({
  ticket: 'TKT-0132', hold, soBefore, pop, gone, appErrors, ok, ts: new Date().toISOString()
}, null, 2));
console.log(ok ? 'PASS' : 'FAIL', 'L132-P1', JSON.stringify({ hold, pop, gone, err: appErrors[0] || '' }));
if (!ok) process.exit(1);
