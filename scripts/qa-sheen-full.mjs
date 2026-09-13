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
const out = join(process.cwd(), 'docs/qa/L135-SHEEN-FULL');
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
    P.so = Math.max(P.so || 0, 80);
    P.bachBao = P.bachBao || {};
    P.bachBao.pending = { t: 'chest', stars: 1, n: 1 };
    P.bachBao.lastIdx = 7;
    P.bachBao.bet = 2;
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
  P.bachBao = P.bachBao || {};
  P.bachBao.pending = { t: 'chest', stars: 1, n: 1 };
  P.bachBao.lastIdx = 13;
  P.bachBao.bet = 2;
});
await page.locator('#hvBbrDesk [data-bbr-bet="2"]').click({ force: true });
await page.waitForSelector('#hvBbrDesk .hv-bbr-ring.is-hold', { timeout: 5000 });
await page.waitForTimeout(200);

const held = await page.evaluate(() => {
  const ring = document.querySelector('#hvBbrDesk .hv-bbr-ring');
  const hot = document.querySelector('#hvBbrDesk [data-bbr-cell].is-hot');
  if (!hot) return { hotCount: 0 };
  const cs = getComputedStyle(hot, ':after');
  const box = hot.getBoundingClientRect();
  const inset0 = cs.top === '0px' && cs.left === '0px' && cs.right === '0px' && cs.bottom === '0px';
  return {
    hold: !!(ring && ring.classList.contains('is-hold')),
    hotCount: document.querySelectorAll('#hvBbrDesk [data-bbr-cell].is-hot').length,
    anim: String(cs.animationName || ''),
    duration: String(cs.animationDuration || ''),
    content: String(cs.content || ''),
    inset0,
    afterW: parseFloat(cs.width) || 0,
    cellW: hot.clientWidth,
    boxW: box.width,
    pulse: /bbrHold|bbrSweep/i.test(cs.animationName || '')
  };
});
await page.screenshot({ path: join(out, 'hold-390x844.png') });
await page.waitForTimeout(750);
await page.screenshot({ path: join(out, 'hold-b-390x844.png') });

await browser.close();
const appErrors = errors.filter(text => !/extension|favicon|Failed to load resource/i.test(text));
const covers = held.inset0 && held.afterW >= held.cellW * 0.95;
const ok = held.hold && held.hotCount === 1 && /bbrSheen/i.test(held.anim)
  && held.duration === '1.5s' && covers && !held.pulse && appErrors.length === 0;
writeFileSync(join(out, 'evidence.json'), JSON.stringify({
  ticket: 'TKT-0135', held, covers, appErrors, ok, ts: new Date().toISOString()
}, null, 2));
console.log(ok ? 'PASS' : 'FAIL', 'L135-P1', JSON.stringify({
  anim: held.anim, duration: held.duration, inset0: held.inset0, covers, err: appErrors[0] || ''
}));
if (!ok) process.exit(1);
