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
const out = join(process.cwd(), 'docs/qa/L157-IOS-ATLAS-BUDGET');
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-web-security'] });
const errors = [];
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
page.on('pageerror', err => errors.push(String(err)));
page.on('crash', () => errors.push('page-crash'));

await page.goto(origin + '/battle.html?linhDongQa=1&bachDienQa=1', {
  waitUntil: 'domcontentloaded', timeout: 45000
});
await page.waitForSelector('#gameCanvas', { timeout: 20000 });
await page.waitForTimeout(2500);

const snap = await page.evaluate(() => {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  const img = ctx.getImageData(0, 0, w, h).data;
  let painted = 0;
  for (let i = 0; i < img.length; i += 16) {
    const a = img[i + 3];
    if (a > 20 && img[i] + img[i + 1] + img[i + 2] > 40) painted++;
  }
  const inspect = window.__HV_SPRITE_RUNTIME?.inspect?.() || window.__HV_BACH_DIEN_QA?.inspect?.() || null;
  const html = document.documentElement.innerHTML;
  return {
    canvasW: w,
    canvasH: h,
    painted,
    title: document.title,
    hasLinhDong: typeof window.drawLinhDongHero === 'function',
    hasBachDien: typeof window.drawBachDienHero === 'function',
    hasDecodeScale: html.includes('function atlasDecodeScale'),
    hasDownsample: html.includes('function downsampleDecodedAtlas'),
    cacheBytes: inspect?.bytes ?? null,
    cacheMax: inspect?.maxBytes ?? null,
    cacheEntries: inspect?.entries?.length ?? null,
    scales: (inspect?.entries || []).map(e => e.scale)
  };
});

await page.screenshot({ path: join(out, 'battle-both-390x844.png'), fullPage: true });

const evidence = {
  schema: 'hon-viet-l157-ios-atlas-budget/v1',
  origin,
  viewport: '390x844',
  errors,
  snap,
  pass: errors.length === 0
    && snap.painted > 200
    && snap.hasLinhDong
    && snap.hasBachDien
    && snap.hasDecodeScale
    && (snap.cacheBytes == null || snap.cacheBytes <= 128 * 1024 * 1024)
};
writeFileSync(join(out, 'evidence.json'), JSON.stringify(evidence, null, 2) + '\n');
writeFileSync(join(out, 'README.md'), `# L157 — iOS atlas budget\n\nChrome 390×844 \`battle.html?linhDongQa=1&bachDienQa=1\`.\nCache bytes ${snap.cacheBytes} / ${snap.cacheMax}. Painted ${snap.painted}. Errors ${errors.length}.\nSafari/iPhone NOT_RUN.\n`);
await browser.close();
if (!evidence.pass) {
  console.error(evidence);
  process.exit(1);
}
console.log('L157 QA PASS', snap);
