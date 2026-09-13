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
const out = join(process.cwd(), 'docs/qa/L134-SPIN-STEADY');
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-web-security'] });
const errors = [];
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
page.on('pageerror', err => errors.push(String(err)));

const afterAnim = () => page.evaluate(() => {
  const ring = document.querySelector('#hvBbrDesk .hv-bbr-ring');
  const hot = document.querySelector('#hvBbrDesk [data-bbr-cell].is-hot');
  const cs = hot ? getComputedStyle(hot, ':after') : null;
  return {
    run: !!(ring && ring.classList.contains('is-run')),
    hold: !!(ring && ring.classList.contains('is-hold')),
    hotCount: document.querySelectorAll('#hvBbrDesk [data-bbr-cell].is-hot').length,
    anim: String(cs?.animationName || ''),
    content: String(cs?.content || ''),
    pulse: /bbrHold|bbrSweep/i.test(cs?.animationName || '')
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
    P.bachBao = P.bachBao || {};
    P.bachBao.pending = null;
    P.bachBao.lastIdx = 0;
    P.bachBao.bet = 2;
  }
  if (typeof persist === 'function') persist();
});
await page.evaluate(() => { if (typeof navTo === 'function') navTo('festival'); });
await page.waitForSelector('#hvFestivalRoot.is-open', { timeout: 8000 });
await page.locator('#hvFestCity [data-fcity="wheel"]').click({ force: true });
await page.waitForSelector('#hvBbrDesk', { timeout: 8000 });

await page.locator('#hvBbrDesk [data-bbr-bet="2"]').click({ force: true });
await page.locator('#hvBbrDesk [data-bbr-step]').click({ force: true });
await page.waitForSelector('#hvBbrDesk .hv-bbr-ring.is-run', { timeout: 5000 });
const spinning = await afterAnim();
await page.screenshot({ path: join(out, 'spin-390x844.png') });

await page.waitForSelector('#hvBbrDesk .hv-bbr-ring.is-hold', { timeout: 16000 });
await page.waitForTimeout(220);
const held = await afterAnim();
await page.screenshot({ path: join(out, 'hold-390x844.png') });
await page.waitForTimeout(400);
const held2 = await afterAnim();

await browser.close();
const appErrors = errors.filter(text => !/extension|favicon|Failed to load resource/i.test(text));
const spinOk = spinning.run && !spinning.hold && !/bbrSweep|bbrSheen/i.test(spinning.anim) && !spinning.pulse;
const holdOk = held.hold && !held.run && /bbrSheen/i.test(held.anim) && held.hotCount === 1 && !held.pulse;
const ok = spinOk && holdOk && appErrors.length === 0;
writeFileSync(join(out, 'evidence.json'), JSON.stringify({
  ticket: 'TKT-0134', spinning, held, held2, appErrors, ok, ts: new Date().toISOString()
}, null, 2));
console.log(ok ? 'PASS' : 'FAIL', 'L134-P1', JSON.stringify({
  spinAnim: spinning.anim, holdAnim: held.anim, err: appErrors[0] || ''
}));
if (!ok) process.exit(1);
