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
const out = join(process.cwd(), 'docs/qa/L128-BBR-PTS');
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
    P.so = Math.max(P.so || 0, 40);
    P.bachBao = P.bachBao || {};
    P.bachBao.pts = P.bachBao.pts || 12;
  }
  if (typeof persist === 'function') persist();
});
await page.evaluate(() => { if (typeof navTo === 'function') navTo('festival'); });
await page.waitForSelector('#hvFestivalRoot.is-open', { timeout: 8000 });
await page.locator('#hvFestCity [data-fcity="wheel"]').click({ force: true });
await page.waitForSelector('#hvBbrDesk', { timeout: 8000 });
const vis = await page.evaluate(() => {
  const desk = document.getElementById('hvBbrDesk');
  const go = desk && desk.querySelector('.hv-bbr-go');
  const shop = desk && desk.querySelector('.hv-bbr-shop-ic img');
  const note = desk && desk.querySelector('.hv-bbr-pts-note');
  const ptsBtn = desk && desk.querySelector('[data-bbr-pts]');
  const shopTxt = desk && /Shop điểm/.test(desk.textContent || '');
  const take = desk && desk.querySelector('[data-bbr-take]');
  const conv = desk && desk.querySelector('[data-bbr-convert]');
  return {
    goH: go ? go.getBoundingClientRect().height : 0,
    shopSrc: !!(shop && /shop-girl/.test(shop.getAttribute('src') || '')),
    note: !!(note && /Điểm tích luỹ/.test(note.textContent || '')),
    noPts: !ptsBtn,
    noShopTxt: !shopTxt,
    take: !!(take && take.textContent.includes('Thưởng')),
    conv: !!(conv && conv.textContent.includes('Đổi sò'))
  };
});
await page.screenshot({ path: join(out, 'bbr-390x844.png') });
await page.locator('#hvBbrDesk .hv-bbr-shop-ic').click({ force: true });
await page.waitForTimeout(400);
const shopOpen = await page.evaluate(() => !!document.getElementById('hvBbrShop')?.classList.contains('is-open'));
await page.screenshot({ path: join(out, 'shop-390x844.png') });
await browser.close();
const appErrors = errors.filter(text => !/extension|favicon|Failed to load resource/i.test(text));
const ok = vis.goH >= 56 && vis.shopSrc && vis.note && vis.noPts && vis.noShopTxt && vis.take && vis.conv && shopOpen && appErrors.length === 0;
writeFileSync(join(out, 'evidence.json'), JSON.stringify({ ticket: 'TKT-0128', vis, shopOpen, appErrors, ok, ts: new Date().toISOString() }, null, 2));
console.log(ok ? 'PASS' : 'FAIL', 'L128-P1', JSON.stringify({ vis, shopOpen, err: appErrors[0] || '' }));
if (!ok) process.exit(1);
