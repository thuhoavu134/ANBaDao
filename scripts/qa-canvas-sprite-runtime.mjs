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
const out = join(process.cwd(), 'docs/qa/L151-CANVAS-SPRITE-RUNTIME');
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-web-security'] });

async function capture(name, viewport, dpr) {
  const errors = [];
  const requests = [];
  const context = await browser.newContext({ viewport, deviceScaleFactor: dpr });
  const page = await context.newPage();
  page.on('pageerror', err => errors.push(String(err)));
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('request', req => {
    const url = req.url();
    if (url.includes('characters/linh-dong/') && url.includes('-atlas.webp')) {
      requests.push(url.replace(origin + '/', ''));
    }
  });
  await page.goto(origin + '/battle.html?qaSplus42=hero_splus_linh_dong&linhDongQa', {
    waitUntil: 'domcontentloaded', timeout: 45000
  });
  await page.waitForSelector('#gameCanvas', { timeout: 15000 });
  await page.waitForTimeout(1800);
  const boot = await page.evaluate(() => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const { width: w, height: h } = canvas;
    const img = ctx.getImageData(0, 0, w, h).data;
    let painted = 0;
    for (let i = 0; i < img.length; i += 16) {
      const a = img[i + 3];
      if (a > 20 && img[i] + img[i + 1] + img[i + 2] > 40) painted++;
    }
    const inspect = window.__HV_SPRITE_RUNTIME?.inspect?.() || null;
    return {
      canvasW: w, canvasH: h, painted,
      hasHero: typeof drawLinhDongHero === 'function',
      hasRuntime: typeof window.__HV_SPRITE_RUNTIME === 'object',
      inspect,
      sourceOver: /blend:'source-over'|blend:"source-over"/.test(document.documentElement.innerHTML),
      drawSize: /477,440/.test(document.documentElement.innerHTML),
      eagerForEach: /Object\.keys\(LINH_DONG_CLIPS\)\.forEach\(linhDongImage\)/.test(document.documentElement.innerHTML)
    };
  });
  await page.screenshot({ path: join(out, `${name}-idle.png`) });
  const bootRequests = [...requests];
  await page.evaluate(async () => {
    if (window.__HV_LINH_DONG_QA?.force) await window.__HV_LINH_DONG_QA.force('atk');
  });
  await page.waitForTimeout(1800);
  await page.screenshot({ path: join(out, `${name}-atk.png`) });
  const atkRequests = [...requests];
  await page.evaluate(async () => {
    if (window.__HV_LINH_DONG_QA?.force) await window.__HV_LINH_DONG_QA.force('ultimate');
  });
  await page.waitForTimeout(2200);
  await page.screenshot({ path: join(out, `${name}-ultimate.png`) });
  const inspectAfter = await page.evaluate(() => window.__HV_SPRITE_RUNTIME?.inspect?.() || null);
  await context.close();
  const appErrors = errors.filter(text => !/extension|favicon|Failed to load resource|net::ERR/i.test(text));
  return {
    name, viewport, dpr, boot, bootRequests, atkRequests, requests, inspectAfter, appErrors
  };
}

const desktop = await capture('desktop-dpr1', { width: 1280, height: 800 }, 1);
const desktop2 = await capture('desktop-dpr2', { width: 1280, height: 800 }, 2);
const mobile = await capture('mobile-390', { width: 390, height: 844 }, 2);
await browser.close();

function uniqueAtlas(list) {
  return [...new Set(list.map(url => url.split('?')[0]))];
}

const report = {
  ticket: 'TKT-0151',
  ts: new Date().toISOString(),
  decoded: {
    idle: 3840 * 5280 * 4,
    attack: 3840 * 2640 * 4,
    ultimate: 3840 * 3520 * 4,
    skill1Vfx: 4400 * 2976 * 4,
    ultimateVfx: 4400 * 2976 * 4,
    cap: 128 * 1024 * 1024
  },
  compressed: {
    idle: 10909760,
    attack: 5046406,
    ultimate: 4420342,
    skill1Vfx: 7239332,
    ultimateVfx: 12856778
  },
  desktop, desktop2, mobile
};

const ok = [desktop, desktop2, mobile].every(run => (
  run.boot.hasHero && run.boot.hasRuntime && run.boot.drawSize && run.boot.sourceOver &&
  !run.boot.eagerForEach && run.boot.painted > 4000 && run.appErrors.length === 0 &&
  uniqueAtlas(run.bootRequests).every(url => /idle-atlas/.test(url) || url.length === 0)
));

writeFileSync(join(out, 'evidence.json'), JSON.stringify({ ok, report }, null, 2));
console.log(ok ? 'PASS' : 'FAIL', 'L151-P1', JSON.stringify({
  desktopPaint: desktop.boot.painted,
  mobilePaint: mobile.boot.painted,
  bootAtlas: uniqueAtlas(mobile.bootRequests),
  atkAtlas: uniqueAtlas(mobile.atkRequests),
  err: desktop.appErrors[0] || mobile.appErrors[0] || ''
}));
process.exit(ok ? 0 : 1);
