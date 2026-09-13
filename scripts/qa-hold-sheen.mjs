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
const out = join(process.cwd(), 'docs/qa/L133-HOLD-SHEEN');
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
    P.bachBao.pending = { t: 'gold', stars: 1, n: 1 };
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
  P.bachBao.pending = { t: 'gold', stars: 1, n: 1 };
  P.bachBao.lastIdx = 7;
  P.bachBao.bet = 2;
});
await page.locator('#hvBbrDesk [data-bbr-bet="2"]').click({ force: true });
await page.waitForSelector('#hvBbrDesk .hv-bbr-ring.is-hold', { timeout: 5000 });
await page.waitForTimeout(280);

const snap = async () => page.evaluate(() => {
  const ring = document.querySelector('#hvBbrDesk .hv-bbr-ring');
  const hot = document.querySelector('#hvBbrDesk [data-bbr-cell].is-hot');
  if (!hot) return { hotCount: 0 };
  const cs = getComputedStyle(hot, ':after');
  return {
    hold: !!(ring && ring.classList.contains('is-hold')),
    hotCount: document.querySelectorAll('#hvBbrDesk [data-bbr-cell].is-hot').length,
    hotIdx: Number(hot.getAttribute('data-bbr-cell')),
    lastIdx: (typeof P === 'object' && P.bachBao) ? Number(P.bachBao.lastIdx) : -1,
    anim: String(cs.animationName || ''),
    duration: String(cs.animationDuration || ''),
    transform: String(cs.transform || ''),
    pulse: /bbrHold/i.test(cs.animationName || '')
  };
});

const a = await snap();
await page.screenshot({ path: join(out, 'sheen-a-390x844.png') });
await page.waitForTimeout(420);
const b = await snap();
await page.screenshot({ path: join(out, 'sheen-b-390x844.png') });

await browser.close();
const appErrors = errors.filter(text => !/extension|favicon|Failed to load resource/i.test(text));
const moved = a.transform && b.transform && a.transform !== b.transform;
const ok = a.hold && a.hotCount === 1 && a.hotIdx === 7 && a.lastIdx === 7
  && /bbrSheen/i.test(a.anim) && !a.pulse && moved
  && appErrors.length === 0;
writeFileSync(join(out, 'evidence.json'), JSON.stringify({
  ticket: 'TKT-0133', a, b, moved, appErrors, ok, ts: new Date().toISOString()
}, null, 2));
console.log(ok ? 'PASS' : 'FAIL', 'L133-P1', JSON.stringify({
  hold: a.hold, hot: a.hotCount, anim: a.anim, moved, err: appErrors[0] || ''
}));
if (!ok) process.exit(1);
