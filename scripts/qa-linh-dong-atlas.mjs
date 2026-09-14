import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = (() => {
  try { return require('playwright'); } catch {}
  try { return require('/workspace/node_modules/playwright'); } catch {}
  throw new Error('playwright missing');
})();
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const origin = process.env.L139_QA_ORIGIN || 'http://127.0.0.1:8080';
const out = join(process.cwd(), 'docs/qa/L139-LINH-DONG');
mkdirSync(out, { recursive: true });

async function openBattle(browser, viewport) {
  const errors = [];
  const page = await browser.newPage({ viewport });
  page.on('pageerror', err => errors.push(String(err)));
  await page.goto(origin + '/battle.html?qaSplus42=hero_splus_linh_dong', {
    waitUntil: 'domcontentloaded',
    timeout: 45000
  });
  await page.waitForSelector('#gameCanvas', { timeout: 15000 });
  const atlasW = await page.evaluate(() => new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img.naturalWidth);
    img.onerror = () => reject(new Error('idle-atlas failed'));
    img.src = 'assets/characters/linh-dong/idle-atlas.webp';
  }));
  if (!(atlasW > 1000)) throw new Error('idle atlas too small: ' + atlasW);
  await page.waitForTimeout(900);
  const snap = await page.evaluate(() => {
    const canvas = document.getElementById('gameCanvas');
    const catalog = globalThis.SPLUS42?.catalog || [];
    const hero = catalog.find(h => h.id === 'hero_splus_linh_dong') || null;
    const atlasHit = ['idle-atlas.webp','basic-atlas.webp','ultimate-atlas.webp'].map(name => ({
      name,
      present: new RegExp(name.replace('.', '\\.')).test(document.documentElement.innerHTML)
    }));
    const ctx = canvas.getContext('2d');
    const { width: w, height: h } = canvas;
    const img = ctx.getImageData(0, 0, w, h).data;
    let painted = 0, bronze = 0, tokenCyan = 0;
    for (let i = 0; i < img.length; i += 16) {
      const r = img[i], g = img[i + 1], b = img[i + 2], a = img[i + 3];
      if (a < 20) continue;
      if (r + g + b > 40) painted++;
      if (r > 140 && g > 90 && g < 180 && b < 90 && r > b + 40) bronze++;
      if (b > 150 && g > 140 && r < 120) tokenCyan++;
    }
    const src = document.documentElement.innerHTML;
    return {
      canvasW: w,
      canvasH: h,
      painted,
      bronze,
      tokenCyan,
      atlasHit,
      artStatus: hero?.art?.status || null,
      artPortrait: hero?.art?.portrait || null,
      visualSource: hero ? undefined : null,
      hasDrawFn: /function drawLinhDongHero\(/.test(src),
      hasDelegate: /drawLinhDongHero\(context,unit,time\)/.test(src),
      placeholderTokenFn: /S\+ · Đang thử cơ chế/.test(src)
    };
  });
  const file = join(out, `battle-${viewport.width}x${viewport.height}.png`);
  await page.screenshot({ path: file, fullPage: false });
  await page.close();
  return { snap, errors, file };
}

const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-web-security'] });
const mobile = await openBattle(browser, { width: 390, height: 844 });
const desk = await openBattle(browser, { width: 1280, height: 720 });

const profilePage = await browser.newPage({ viewport: { width: 390, height: 844 } });
const profileErrors = [];
profilePage.on('pageerror', err => profileErrors.push(String(err)));
await profilePage.goto(origin + '/splus-lab.html#hero_splus_linh_dong', {
  waitUntil: 'domcontentloaded',
  timeout: 30000
});
await profilePage.waitForSelector('.hero-emblem img.hero-portrait', { timeout: 10000 });
const portrait = await profilePage.evaluate(() => {
  const img = document.querySelector('.hero-emblem img.hero-portrait');
  return {
    src: img?.getAttribute('src') || '',
    complete: !!img?.complete,
    w: img?.naturalWidth || 0,
    h: img?.naturalHeight || 0,
    title: document.querySelector('.profile-view h2')?.textContent || ''
  };
});
await profilePage.screenshot({ path: join(out, 'profile-390x844.png'), fullPage: false });
await browser.close();

const appErrors = [...mobile.errors, ...desk.errors, ...profileErrors]
  .filter(text => !/extension|favicon|Failed to load resource|play\(\)/i.test(text));
const idleLoaded = (snap) => snap.atlasHit.some(h => h.name === 'idle-atlas.webp' && h.present);
const ok = mobile.snap.hasDrawFn
  && mobile.snap.hasDelegate
  && mobile.snap.artStatus === 'authored-rgba-v1'
  && idleLoaded(mobile.snap)
  && idleLoaded(desk.snap)
  && mobile.snap.bronze > 20
  && desk.snap.bronze > 20
  && mobile.snap.painted > 500
  && portrait.src.includes('linh-dong/avatar.webp')
  && portrait.w > 100
  && portrait.title === 'Linh Đồng'
  && appErrors.length === 0;

writeFileSync(join(out, 'evidence.json'), JSON.stringify({
  ticket: 'TKT-0139',
  acceptance: 'L139-P1',
  mobile: mobile.snap,
  desktop: desk.snap,
  portrait,
  appErrors,
  ok,
  ts: new Date().toISOString()
}, null, 2));
console.log(ok ? 'PASS' : 'FAIL', 'L139-P1', JSON.stringify({
  bronzeM: mobile.snap.bronze,
  bronzeD: desk.snap.bronze,
  idle: idleLoaded(mobile.snap),
  art: mobile.snap.artStatus,
  portrait: portrait.w,
  err: appErrors[0] || ''
}));
if (!ok) process.exit(1);
