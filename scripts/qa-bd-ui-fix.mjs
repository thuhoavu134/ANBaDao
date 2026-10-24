// QA capture: Victory banner clearance, hero-detail feet, formation card fill.
// Serves dist/, drives the real UI with Playwright, measures DOM rects and saves screenshots.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = (() => {
  try { return require('playwright'); } catch {}
  try { return require('C:/lt/luc-than-main/node_modules/playwright'); } catch {}
  throw new Error('playwright missing');
})();
import { mkdirSync, writeFileSync, readFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { createServer } from 'node:http';

const ROOT = 'C:/lt/luc-than-main';
const dist = join(ROOT, 'dist');
const out = join(ROOT, 'docs/qa/BD-UI-FIX');
mkdirSync(out, { recursive: true });
const port = 18091;
const origin = 'http://127.0.0.1:' + port;
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.mp3': 'audio/mpeg' };
const server = createServer((req, res) => {
  const url = decodeURIComponent((req.url || '/').split('?')[0]);
  let file = join(dist, url === '/' ? 'index.html' : url.replace(/^\//, ''));
  try {
    const st = statSync(file);
    if (st.isDirectory()) file = join(file, 'index.html');
    res.writeHead(200, { 'content-type': mime[extname(file)] || 'application/octet-stream' });
    res.end(readFileSync(file));
  } catch { res.writeHead(404); res.end('missing'); }
});
await new Promise(r => server.listen(port, '127.0.0.1', r));

const browser = await chromium.launch({ args: ['--no-sandbox'] });
const report = {};

const HERO = { id: 'bach_dien', sourceId: 'bach_dien', name: 'Bạch Diện', damage: 4200, kills: 3, hp: 100, maxHp: 100, alive: true, slot: 0 };

for (const vp of [{ width: 390, height: 844, tag: 'p' }, { width: 1280, height: 720, tag: 'd' }]) {
  const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('requestfailed', r => { if (/\.webp$/.test(r.url())) errors.push('FAIL ' + r.url()); });
  await page.goto(origin + '/?qa=unlock-all', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(900);

  // ---- 1. VICTORY ----
  await page.evaluate(`__showIntegratedResultV6(true, ${JSON.stringify(JSON.stringify({ player: [HERO], enemy: [], rewards: [] }))})`);
  await page.waitForFunction(() => !!document.querySelector('#integratedResultV6 .irv-hero.run'), { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1800);
  report['victory_' + vp.tag] = await page.evaluate(`(() => {
    const root = document.querySelector('#integratedResultV6 .irv-viewport') || document.querySelector('#integratedResultV6');
    const hero = document.querySelector('#integratedResultV6 .irv-hero.idle') || document.querySelector('#integratedResultV6 .irv-hero.run');
    if (!root || !hero) return { ok: false };
    const rr = root.getBoundingClientRect(), hr = hero.getBoundingClientRect();
    const ctx = hero.getContext && hero.getContext('2d');
    let opaqueTop = null, opaqueBottom = null;
    if (ctx) {
      const d = ctx.getImageData(0, 0, hero.width, hero.height).data;
      let minY = hero.height, maxY = -1;
      for (let y = 0; y < hero.height; y++) for (let x = 0; x < hero.width; x += 2) {
        if (d[(y * hero.width + x) * 4 + 3] > 24) { if (y < minY) minY = y; if (y > maxY) maxY = y; }
      }
      if (maxY >= 0) { opaqueTop = hr.top + (minY / hero.height) * hr.height; opaqueBottom = hr.top + ((maxY + 1) / hero.height) * hr.height; }
    }
    return { ok: true, viewport: [rr.width, rr.height], heroRect: [hr.left, hr.top, hr.right, hr.bottom], opaqueTop, opaqueBottom,
      heroTopPct: +(((hr.top - rr.top) / rr.height) * 100).toFixed(2), heroBottomPct: +(((hr.bottom - rr.top) / rr.height) * 100).toFixed(2),
      clippedTop: opaqueTop !== null ? hr.top - opaqueTop : null, clippedBottom: opaqueBottom !== null ? opaqueBottom - hr.bottom : null };
  })()`);
  await page.screenshot({ path: join(out, `victory-${vp.tag}.png`), fullPage: false });
  await page.evaluate('__hideIntegratedResultV6 && __hideIntegratedResultV6()');
  await page.waitForTimeout(400);

  // ---- 2. HERO DETAIL (Bạch Diện) ----
  await page.evaluate('navTo("heroes")');
  await page.waitForTimeout(700);
  report['detail_' + vp.tag] = await page.evaluate(`(async () => {
    const cards = [...document.querySelectorAll('[data-hero-id],[data-id],[data-actor]')];
    const target = cards.find(c => /bach_dien|bach-dien/.test(c.getAttribute('data-hero-id') || c.getAttribute('data-id') || c.getAttribute('data-actor') || ''))
      || cards.find(c => /Bạch Diện/i.test(c.textContent || ''));
    if (target) target.click();
    await new Promise(r => setTimeout(r, 1200));
    const sel = '.hero-detail img, .hdetail img, #heroDetail img, .detail-stage img, .hero-stage img';
    const imgs = [...document.querySelectorAll(sel)].filter(i => i.getBoundingClientRect().width > 40);
    const big = imgs.sort((a, b) => b.getBoundingClientRect().height - a.getBoundingClientRect().height)[0];
    if (!big) return { ok: false, found: imgs.length, href: location.hash };
    const r = big.getBoundingClientRect();
    const box = big.parentElement.getBoundingClientRect();
    return { ok: true, src: big.currentSrc || big.src, natural: [big.naturalWidth, big.naturalHeight],
      imgRect: [r.left, r.top, r.right, r.bottom], boxRect: [box.left, box.top, box.right, box.bottom],
      imgH: +r.height.toFixed(1), boxH: +box.height.toFixed(1), fillPct: +((r.height / box.height) * 100).toFixed(1) };
  })()`);
  await page.screenshot({ path: join(out, `detail-${vp.tag}.png`) });

  // ---- 3. FORMATION / card fill ----
  await page.evaluate('navTo("heroes")').catch(() => {});
  await page.waitForTimeout(800);
  report['cards_' + vp.tag] = await page.evaluate(`(() => {
    const imgs = [...document.querySelectorAll('img')].filter(i => /characters\\//.test(i.currentSrc || i.src) && i.getBoundingClientRect().width > 30);
    return imgs.slice(0, 24).map(i => ({ src: (i.currentSrc || i.src).split('/characters/')[1], w: Math.round(i.getBoundingClientRect().width), h: Math.round(i.getBoundingClientRect().height), nat: [i.naturalWidth, i.naturalHeight] }));
  })()`);
  await page.screenshot({ path: join(out, `cards-${vp.tag}.png`) });

  report['errors_' + vp.tag] = errors.slice(0, 10);
  await page.close();
}

writeFileSync(join(out, 'report.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
await browser.close();
server.close();
