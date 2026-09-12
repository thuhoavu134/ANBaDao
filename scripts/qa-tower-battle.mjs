import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = (() => {
  try { return require('playwright'); } catch {}
  try { return require('/workspace/node_modules/playwright'); } catch {}
  throw new Error('playwright missing');
})();
import { mkdirSync, writeFileSync, readFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { createServer } from 'node:http';

const dist = join(process.cwd(), 'dist');
const port = 18065;
const origin = 'http://127.0.0.1:' + port;
const out = join(process.cwd(), 'docs/qa/L65-TOWER-BATTLE');
mkdirSync(out, { recursive: true });
const mime = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2',
  '.mp3': 'audio/mpeg', '.mp4': 'video/mp4'
};
const server = createServer((req, res) => {
  const url = decodeURIComponent((req.url || '/').split('?')[0]);
  let file = join(dist, url === '/' ? 'index.html' : url.replace(/^\//, ''));
  try {
    const st = statSync(file);
    if (st.isDirectory()) file = join(file, 'index.html');
    res.writeHead(200, { 'content-type': mime[extname(file)] || 'application/octet-stream' });
    res.end(readFileSync(file));
  } catch {
    res.writeHead(404); res.end('missing');
  }
});
await new Promise(r => server.listen(port, '127.0.0.1', r));

const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-web-security'] });
const summary = [];

async function dismissLogin(page) {
  const btn = page.locator('#hvLoginContinue');
  if (await btn.count()) {
    await btn.click({ force: true }).catch(() => {});
    await page.waitForTimeout(400);
  }
  await page.evaluate(() => {
    const root = document.getElementById('hvLoginRoot');
    if (root) { root.hidden = true; root.classList.remove('is-open'); }
  });
}

for (const viewport of [{ width: 390, height: 844 }, { width: 768, height: 1024 }]) {
  const errors = [];
  const page = await browser.newPage({ viewport });
  page.on('pageerror', err => errors.push(String(err)));
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  await page.goto(origin + '/?qa=unlock-all', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(700);
  await dismissLogin(page);
  await page.evaluate(() => {
    document.getElementById('__mgDiag')?.remove();
    document.getElementById('hvQaFullAccess')?.remove();
    if (typeof P === 'object') P.stamina = Math.max(P.stamina || 0, 40);
  });
  await page.evaluate(() => navTo('tower'));
  await page.waitForSelector('#hvTowerRoot', { timeout: 8000 });
  await page.waitForTimeout(250);
  const floorBefore = await page.evaluate(() => Number(P.tower?.floor || 0));
  const stamBefore = await page.evaluate(() => Number(P.stamina || 0));
  await page.locator('#hvTowerRoot.is-open [data-tower-climb]').last().click({ force: true });
  await page.waitForSelector('#hvBattleOverlay.is-open', { timeout: 10000 });
  await page.waitForFunction(() => {
    const overlay = document.getElementById('hvBattleOverlay');
    return overlay && overlay.classList.contains('is-open') && !overlay.classList.contains('is-loading');
  }, null, { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(900);
  const battle = await page.evaluate(() => {
    const overlay = document.getElementById('hvBattleOverlay');
    const frame = document.getElementById('hvBattleFrame');
    const foes = Array.isArray(DATA?.encounters?.__tower) ? DATA.encounters.__tower : [];
    const ids = foes.map(u => u.sourceHeroId);
    return {
      overlayOpen: overlay?.classList.contains('is-open') || false,
      frameSrc: String(frame?.getAttribute('src') || ''),
      mode: ST?.mode || '',
      foeCount: foes.length,
      uniqueIds: new Set(ids).size,
      front: foes.filter(u => u.row === 'front').length,
      back: foes.filter(u => u.row === 'back').length,
      ids
    };
  });
  const stamAfter = await page.evaluate(() => Number(P.stamina || 0));
  const label = viewport.width + 'x' + viewport.height;
  await page.screenshot({ path: join(out, 'tower-battle-' + label + '.png') });

  await page.evaluate(() => {
    if (typeof abortIntegratedBattle === 'function') abortIntegratedBattle('tower');
  });
  await page.waitForTimeout(300);
  await page.evaluate(() => {
    navTo('tower');
    P.stamina = Math.max(P.stamina || 0, 40);
    P.tower = Object.assign(P.tower || {}, { floor: 12, stuckFloor: 0, stuckSince: 0 });
    teamPower = () => 400;
    window.HonVietTower?.render();
  });
  await page.waitForTimeout(250);
  await page.locator('#hvTowerRoot.is-open [data-tower-climb]').last().click({ force: true });
  await page.waitForSelector('#hvBattleOverlay.is-open', { timeout: 10000 });
  const weakStillFights = await page.evaluate(() => {
    const overlay = document.getElementById('hvBattleOverlay');
    return {
      overlayOpen: overlay?.classList.contains('is-open') || false,
      floor: Number(P.tower?.floor || 0),
      mode: ST?.mode || ''
    };
  });
  await page.screenshot({ path: join(out, 'tower-weak-' + label + '.png') });
  await page.close();
  const appErrors = errors.filter(text => !/extension|favicon|Failed to load resource/i.test(text));
  const ok = battle.overlayOpen
    && /battle\.html/.test(battle.frameSrc)
    && /embedded=1/.test(battle.frameSrc)
    && battle.foeCount === 6
    && battle.uniqueIds === 6
    && battle.front === 3
    && battle.back === 3
    && stamAfter === stamBefore - 5
    && floorBefore >= 1
    && weakStillFights.overlayOpen
    && weakStillFights.floor === 12
    && appErrors.length === 0;
  summary.push({ label, ok, battle, stamBefore, stamAfter, floorBefore, weakStillFights, appErrors });
  console.log(ok ? 'PASS' : 'FAIL', label, JSON.stringify({ battle, stamAfter, weakStillFights, appErrors }));
}

await browser.close();
server.close();
const result = {
  summary,
  safari: 'NOT_RUN',
  pass: summary.every(row => row.ok)
};
writeFileSync(join(out, 'evidence.json'), JSON.stringify(result, null, 2));
console.log(JSON.stringify({ pass: result.pass, safari: result.safari }, null, 2));
if (!result.pass) process.exit(1);
