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
const out = join(process.cwd(), 'docs/qa/L126-CHEST-CHROMA');
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
    if (typeof P === 'object') {
      P.so = Math.max(P.so || 0, 40);
      P.bachBao = P.bachBao || {};
      P.bachBao.chests = Math.max(P.bachBao.chests || 0, 1);
      P.bachBao.supreme = Math.max(P.bachBao.supreme || 0, 1);
    }
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
  await page.locator('#hvFestCity [data-fcity="lamp"]').click({ force: true });
  await page.waitForTimeout(350);
  const lamp = await page.evaluate(() => {
    const p = document.querySelector('#hvFestivalRoot .hv-fest-panel');
    const f = p ? getComputedStyle(p).filter : '';
    return { filter: f, bright: /brightness\(\s*1\.(2|3|4)/.test(f) };
  });
  await page.screenshot({ path: join(out, 'lamp-' + label + '.png') });

  await page.evaluate(() => {
    const root = document.getElementById('hvFestivalRoot');
    if (root) { root.classList.remove('is-tile-open'); root.dataset.fcity = ''; }
  });
  await page.waitForTimeout(150);
  await page.locator('#hvFestCity [data-fcity="chest"]').click({ force: true });
  await page.waitForSelector('#hvFestVault [data-vault-open="normal"]', { timeout: 5000 });
  await page.locator('#hvFestVault [data-vault-open="normal"]').click({ force: true });
  await page.waitForTimeout(900);
  const fx = await page.evaluate(() => {
    const el = document.getElementById('hvChestFx');
    const stage = el && el.querySelector('.hv-chest-fx-stage');
    const frame = el && el.querySelector('.hv-chest-fx-frame');
    const seq = el && el.querySelector('.hv-chest-fx-seq');
    const sr = stage ? stage.getBoundingClientRect() : { width: 0 };
    const fr = frame ? frame.getBoundingClientRect() : { width: 0 };
    return {
      open: !!(el && el.classList.contains('is-open')),
      seq: !!(seq && seq.getAttribute('src')),
      canvas: !!el?.querySelector('canvas'),
      stageW: sr.width,
      frameW: fr.width
    };
  });
  await page.screenshot({ path: join(out, 'chest-' + label + '.png') });
  await page.waitForTimeout(1600);
  await page.screenshot({ path: join(out, 'loot-' + label + '.png') });
  await page.close();

  const appErrors = errors.filter(text => !/extension|favicon|Failed to load resource|play\(\)/i.test(text));
  const ok = lamp.bright && fx.open && fx.seq && !fx.canvas && fx.stageW <= 230 && fx.frameW >= 100 && appErrors.length === 0;
  summary.push({ label, ok, lamp, fx, appErrors });
  console.log(ok ? 'PASS' : 'FAIL', 'L126-P1', label, JSON.stringify({
    bright: lamp.bright, seq: fx.seq, stage: Math.round(fx.stageW), frame: Math.round(fx.frameW), err: appErrors[0] || ''
  }));
}

await browser.close();
writeFileSync(join(out, 'evidence.json'), JSON.stringify({
  ticket: 'TKT-0126', chrome: summary, safari: 'NOT_RUN', ts: new Date().toISOString()
}, null, 2));
if (summary.some(s => !s.ok)) process.exit(1);
