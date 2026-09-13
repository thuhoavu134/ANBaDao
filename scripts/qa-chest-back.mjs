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
const out = join(process.cwd(), 'docs/qa/L127-CHEST-BACK');
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
    P.bachBao.chests = Math.max(P.bachBao.chests || 0, 1);
    P.bachBao.supreme = Math.max(P.bachBao.supreme || 0, 1);
  }
  if (typeof persist === 'function') persist();
});

await page.evaluate(() => { if (typeof navTo === 'function') navTo('festival'); });
await page.waitForSelector('#hvFestivalRoot.is-open', { timeout: 8000 });
await page.locator('#hvFestCity [data-fcity="chest"]').click({ force: true });
await page.waitForSelector('#hvFestVault [data-vault-open="normal"]', { timeout: 5000 });
await page.locator('#hvFestVault [data-vault-open="normal"]').click({ force: true });
await page.waitForTimeout(400);
const mid = await page.evaluate(() => {
  const fx = document.getElementById('hvChestFx');
  const vid = fx && fx.querySelector('video');
  const loot = fx && fx.querySelector('.hv-chest-fx-loot');
  return {
    open: !!(fx && fx.classList.contains('is-open')),
    video: !!(vid && vid.getAttribute('src') && vid.getAttribute('src').endsWith('.mp4')),
    lootHidden: !!(loot && loot.hidden)
  };
});
await page.screenshot({ path: join(out, 'anim-390x844.png') });
await page.waitForTimeout(3000);
const after = await page.evaluate(() => {
  const loot = document.querySelector('#hvChestFx .hv-chest-fx-loot');
  return { lootShown: !!(loot && !loot.hidden) };
});
await page.screenshot({ path: join(out, 'loot-390x844.png') });
await page.locator('#hvChestFx [data-chest-fx-done]').click({ force: true }).catch(() => {});
await page.waitForTimeout(200);
await page.evaluate(() => {
  const fx = document.getElementById('hvChestFx');
  if (fx) fx.classList.remove('is-open');
  const root = Array.from(document.querySelectorAll('#hvFestivalRoot')).find(el => el.parentElement === document.body)
    || document.getElementById('hvFestivalRoot');
  root?.querySelector('[data-fest-back]')?.click();
});
await page.waitForTimeout(250);
const city = await page.evaluate(() => {
  const root = document.getElementById('hvFestivalRoot');
  return { tileOpen: !!(root && root.classList.contains('is-tile-open')) };
});
await page.evaluate(() => {
  const root = Array.from(document.querySelectorAll('#hvFestivalRoot')).find(el => el.parentElement === document.body)
    || document.getElementById('hvFestivalRoot');
  root?.querySelector('[data-fest-back]')?.click();
});
await page.waitForTimeout(400);
const hub = await page.evaluate(() => ({
  screen: typeof ST === 'object' ? ST.screen : '',
  festOpen: !!(document.getElementById('hvFestivalRoot')?.classList.contains('is-open') && !document.getElementById('hvFestivalRoot')?.hidden)
}));
await page.screenshot({ path: join(out, 'hub-390x844.png') });
await browser.close();

const appErrors = errors.filter(text => !/extension|favicon|Failed to load resource|play\(\)/i.test(text));
const ok = mid.open && mid.video && mid.lootHidden && after.lootShown && !city.tileOpen && hub.screen === 'hub' && !hub.festOpen && appErrors.length === 0;
writeFileSync(join(out, 'evidence.json'), JSON.stringify({
  ticket: 'TKT-0127', mid, after, city, hub, appErrors, ok, ts: new Date().toISOString()
}, null, 2));
console.log(ok ? 'PASS' : 'FAIL', 'L127-P1', JSON.stringify({ mid, after, city, hub, err: appErrors[0] || '' }));
if (!ok) process.exit(1);
