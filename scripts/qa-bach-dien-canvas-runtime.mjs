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
const out = join(process.cwd(), 'docs/qa/L154-BACH-DIEN-CANVAS');
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-web-security'] });

function uniqueAtlas(list) {
  return [...new Set(list.map(url => url.split('?')[0]))];
}

async function capture(name, viewport, dpr, path) {
  const errors = [];
  const requests = [];
  const context = await browser.newContext({ viewport, deviceScaleFactor: dpr });
  const page = await context.newPage();
  page.on('pageerror', err => errors.push(String(err)));
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('request', req => {
    const url = req.url();
    if (url.includes('characters/bach-dien/') && url.includes('-atlas.webp')) {
      requests.push(url.replace(origin + '/', ''));
    }
  });
  await page.goto(origin + path, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForSelector('#gameCanvas', { timeout: 15000 });
  await page.waitForTimeout(2200);
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
    const inspect = window.__HV_BACH_DIEN_QA?.inspect?.() || window.__HV_SPRITE_RUNTIME?.inspect?.() || null;
    return {
      canvasW: w, canvasH: h, painted,
      hasHero: typeof drawBachDienHero === 'function',
      hasRuntime: typeof window.__HV_BACH_DIEN_QA === 'object',
      snapshot: window.__HV_BACH_DIEN_QA?.snapshot?.() || null,
      inspect,
      drawSize: /477,440/.test(document.documentElement.innerHTML),
      colsFromClip: /cols=clip\.cols/.test(document.documentElement.innerHTML),
      notFourByTwo: !/BACH_DIEN_CLIPS[\s\S]{0,400}cols:\s*4/.test(document.documentElement.innerHTML),
      eagerForEach: /Object\.keys\(BACH_DIEN_CLIPS\)\.forEach/.test(document.documentElement.innerHTML),
      spine: /spine/i.test(document.documentElement.innerHTML)
    };
  });
  await page.screenshot({ path: join(out, `${name}-idle.png`) });
  const bootRequests = [...requests];
  await page.evaluate(async () => {
    if (window.__HV_BACH_DIEN_QA?.force) await window.__HV_BACH_DIEN_QA.force('atk');
  });
  await page.waitForTimeout(2200);
  await page.screenshot({ path: join(out, `${name}-atk.png`) });
  const atkRequests = [...requests];
  await page.evaluate(async () => {
    if (window.__HV_BACH_DIEN_QA?.force) await window.__HV_BACH_DIEN_QA.force('ultimate');
  });
  await page.waitForTimeout(2800);
  await page.screenshot({ path: join(out, `${name}-ultimate.png`) });
  const inspectAfter = await page.evaluate(() => window.__HV_BACH_DIEN_QA?.inspect?.() || window.__HV_SPRITE_RUNTIME?.inspect?.() || null);
  await context.close();
  const appErrors = errors.filter(text => !/extension|favicon|Failed to load resource|net::ERR/i.test(text));
  return {
    name, viewport, dpr, path, boot, bootRequests, atkRequests, requests, inspectAfter, appErrors
  };
}

const desktop = await capture('desktop-dpr1', { width: 1280, height: 800 }, 1, '/battle.html?bachDienQa=1');
const splus = await capture('splus-390', { width: 390, height: 844 }, 2, '/battle.html?qaSplus42=hero_splus_bach_dien&bachDienQa=1');
const mobile = await capture('mobile-390', { width: 390, height: 844 }, 2, '/battle.html?bachDienQa=1');
await browser.close();

function bootOnlyIdle(run) {
  const urls = uniqueAtlas(run.bootRequests);
  return urls.every(url => /idle-atlas/.test(url) || url.length === 0);
}

const ok = [desktop, splus, mobile].every(run => (
  run.boot.hasHero && run.boot.hasRuntime && run.boot.drawSize && run.boot.colsFromClip &&
  run.boot.notFourByTwo && !run.boot.eagerForEach && !run.boot.spine &&
  run.boot.painted > 2000 && run.appErrors.length === 0 && bootOnlyIdle(run)
));

const report = {
  ticket: 'TKT-0154',
  ts: new Date().toISOString(),
  decoded: {
    idle: 3840 * 5280 * 4,
    attack: 3840 * 5280 * 4,
    ultimate: 3840 * 5280 * 4,
    skill1Vfx: 4400 * 2480 * 4,
    ultimateVfx: 4400 * 2480 * 4,
    cap: 128 * 1024 * 1024
  },
  desktop, splus, mobile
};

writeFileSync(join(out, 'evidence.json'), JSON.stringify({ ok, report }, null, 2));
console.log(ok ? 'PASS' : 'FAIL', 'L154-P1', JSON.stringify({
  desktopPaint: desktop.boot.painted,
  splusPaint: splus.boot.painted,
  mobilePaint: mobile.boot.painted,
  bootAtlas: uniqueAtlas(desktop.bootRequests),
  atkAtlas: uniqueAtlas(desktop.atkRequests),
  splusBoot: uniqueAtlas(splus.bootRequests),
  err: desktop.appErrors[0] || splus.appErrors[0] || mobile.appErrors[0] || ''
}, null, 2));
process.exit(ok ? 0 : 1);
