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
const out = join(process.cwd(), 'docs/qa/L141-LINH-DONG-HERO');
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-web-security'] });
const errors = [];
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
page.on('pageerror', err => errors.push(String(err)));

await page.goto(origin + '/?qa=unlock-all', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(800);
const btn = page.locator('#hvLoginContinue');
if (await btn.count()) await btn.click({ force: true }).catch(() => {});
await page.evaluate(() => {
  const root = document.getElementById('hvLoginRoot');
  if (root) { root.hidden = true; root.classList.remove('is-open'); }
  document.getElementById('__mgDiag')?.remove();
});
await page.evaluate(() => { if (typeof navTo === 'function') navTo('heroes'); });
await page.waitForSelector('#hvHeroRosterV4.is-open .v4-card', { timeout: 8000 });
await page.waitForTimeout(400);

const roster = await page.evaluate(() => {
  const root = document.getElementById('hvHeroRosterV4');
  const cards = [...root.querySelectorAll('.v4-card')];
  const linh = root.querySelector('[data-hero-id="linh_dong"]');
  return {
    count: cards.length,
    firstId: cards[0]?.dataset.heroId || '',
    ids: cards.map(c => c.dataset.heroId),
    names: [...root.querySelectorAll('.v4-cardname')].map(n => n.textContent.trim()),
    sub: root.querySelector('.v4-sub')?.textContent || '',
    hasLinh: !!linh
  };
});
await page.screenshot({ path: join(out, 'tuong-390x844.png') });

await page.locator('#hvHeroRosterV4 [data-hero-id="linh_dong"]').click({ force: true });
await page.waitForTimeout(800);
const detail = await page.evaluate(() => {
  const canvas = document.getElementById('linhDongDetailIdle');
  const stage = document.querySelector('.hstage.linh-dong-stage');
  const name = document.getElementById('hdName')?.textContent || '';
  const basic = document.querySelector('.skillbox[data-skill-slot="basic"]')?.textContent || '';
  const ult = document.querySelector('.skillbox[data-skill-slot="ultimate"]')?.textContent || '';
  const lv = document.getElementById('lvBtn')?.textContent || '';
  const star = document.getElementById('stBtn')?.textContent || '';
  return {
    screen: typeof ST !== 'undefined' ? ST.screen : '',
    name,
    hasCanvas: !!canvas,
    canvasW: canvas?.width || 0,
    hasStage: !!stage,
    basic,
    ult,
    lv,
    star,
    href: location.href
  };
});
await page.screenshot({ path: join(out, 'detail-390x844.png') });
await browser.close();

const appErrors = errors.filter(text => !/extension|favicon|Failed to load resource/i.test(text));
const ok = roster.hasLinh && roster.firstId === 'linh_dong' && roster.names.includes('Linh Đồng')
  && detail.screen === 'heroDetail' && /Linh Đồng/.test(detail.name)
  && detail.hasCanvas && detail.hasStage && detail.canvasW > 0
  && /Lạc Hồn Tiếng Chuông/.test(detail.basic)
  && /Bách Quỷ Dạ Hành/.test(detail.ult)
  && /Nâng cấp/.test(detail.lv)
  && /Thăng sao/.test(detail.star)
  && !/qaSplus42/.test(detail.href)
  && appErrors.length === 0;
writeFileSync(join(out, 'evidence.json'), JSON.stringify({
  ticket: 'TKT-0141', roster, detail, appErrors, ok, ts: new Date().toISOString()
}, null, 2));
console.log(ok ? 'PASS' : 'FAIL', 'L141-P1', JSON.stringify({
  cards: roster.count, first: roster.firstId, screen: detail.screen, canvas: detail.hasCanvas,
  err: appErrors[0] || ''
}));
process.exit(ok ? 0 : 1);
