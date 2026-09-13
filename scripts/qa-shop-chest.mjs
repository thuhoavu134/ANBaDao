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
const out = join(process.cwd(), 'docs/qa/L129-SHOP-CHEST');
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
    P.bachBao.supreme = Math.max(P.bachBao.supreme || 0, 1);
    P.bachBao.pts = P.bachBao.pts || 12;
  }
  if (typeof persist === 'function') persist();
});

await page.evaluate(() => { if (typeof navTo === 'function') navTo('shop'); });
await page.waitForSelector('#hvShopRoot.is-open', { timeout: 8000 });
const city = await page.evaluate(() => {
  const root = document.getElementById('hvShopRoot');
  const tiles = [...(root?.querySelectorAll('#hvShopCity [data-scity]') || [])].map(el => el.textContent.trim());
  const ic = document.querySelector('.hv-bbr-shop-ic');
  return { tiles, noBbrIcon: !ic, city: !!root?.querySelector('#hvShopCity') };
});
await page.screenshot({ path: join(out, 'shop-390x844.png') });
await page.locator('#hvShopCity [data-scity="pts"]').click({ force: true });
await page.waitForTimeout(400);
const pts = await page.evaluate(() => {
  const root = document.getElementById('hvShopRoot');
  return {
    scity: root?.dataset.scity,
    goods: (root?.querySelectorAll('#hvShopPts [data-bbr-buy]') || []).length
  };
});
await page.screenshot({ path: join(out, 'pts-390x844.png') });

await page.evaluate(() => { if (typeof navTo === 'function') navTo('festival'); });
await page.waitForSelector('#hvFestivalRoot.is-open', { timeout: 8000 });
await page.locator('#hvFestCity [data-fcity="chest"]').click({ force: true });
await page.waitForSelector('#hvFestVault [data-vault-open="supreme"]', { timeout: 5000 });
await page.locator('#hvFestVault [data-vault-open="supreme"]').click({ force: true });
await page.waitForTimeout(500);
const mid = await page.evaluate(() => {
  const fx = document.getElementById('hvChestFx');
  const cv = fx && fx.querySelector('canvas');
  const loot = fx && fx.querySelector('.hv-chest-fx-loot');
  const stage = fx && fx.querySelector('.hv-chest-fx-stage');
  let black = false;
  if (cv) {
    const ctx = cv.getContext('2d');
    const px = ctx.getImageData(2, 2, 1, 1).data;
    black = px[3] > 40 && px[0] < 20 && px[1] < 20 && px[2] < 20;
  }
  return {
    open: !!(fx && fx.classList.contains('is-open')),
    canvas: !!cv,
    lootHidden: !!(loot && loot.hidden),
    stageOn: !!(stage && !stage.hidden),
    black
  };
});
await page.screenshot({ path: join(out, 'anim-390x844.png') });
await page.waitForTimeout(900);
await page.screenshot({ path: join(out, 'open-390x844.png') });
await page.waitForTimeout(2200);
const after = await page.evaluate(() => {
  const loot = document.querySelector('#hvChestFx .hv-chest-fx-loot');
  const stage = document.querySelector('#hvChestFx .hv-chest-fx-stage');
  return { lootShown: !!(loot && !loot.hidden), stageOff: !!(stage && (stage.hidden || stage.classList.contains('is-done'))) };
});
await page.screenshot({ path: join(out, 'loot-390x844.png') });
await browser.close();

const appErrors = errors.filter(text => !/extension|favicon|Failed to load resource/i.test(text));
const ok = city.city && city.tiles.includes('Chợ Đêm') && city.tiles.includes('Shop điểm') && city.noBbrIcon
  && pts.scity === 'pts' && pts.goods >= 4
  && mid.open && mid.canvas && mid.lootHidden && !mid.black
  && after.lootShown && after.stageOff && appErrors.length === 0;
writeFileSync(join(out, 'evidence.json'), JSON.stringify({ ticket: 'TKT-0129', city, pts, mid, after, appErrors, ok, ts: new Date().toISOString() }, null, 2));
console.log(ok ? 'PASS' : 'FAIL', 'L129-P1', JSON.stringify({ city, pts, mid, after, err: appErrors[0] || '' }));
if (!ok) process.exit(1);
