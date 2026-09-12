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
const port = 18080;
const origin = 'http://127.0.0.1:' + port;
const out = join(process.cwd(), 'docs/qa/L80-ONG-PHO-FLIP');
mkdirSync(out, { recursive: true });
const mime = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.mp3': 'audio/mpeg', '.mp4': 'video/mp4'
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

for (const viewport of [{ width: 390, height: 844 }, { width: 768, height: 1024 }]) {
  const errors = [];
  const page = await browser.newPage({ viewport });
  page.on('pageerror', err => errors.push(String(err)));
  await page.goto(origin + '/?qa=unlock-all', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(500);
  const btn = page.locator('#hvLoginContinue');
  if (await btn.count()) await btn.click({ force: true }).catch(() => {});
  await page.waitForTimeout(350);
  await page.evaluate(() => {
    document.getElementById('hvLoginRoot')?.classList.remove('is-open');
    const login = document.getElementById('hvLoginRoot');
    if (login) login.hidden = true;
    document.getElementById('__mgDiag')?.remove();
    if (typeof P === 'object') P.stamina = Math.max(P.stamina || 0, 40);
  });
  await page.evaluate(() => navTo('tower'));
  await page.waitForSelector('#hvTowerRoot', { timeout: 8000 });
  await page.locator('#hvTowerRoot.is-open [data-tower-climb]').last().click({ force: true });
  await page.waitForSelector('#hvBattleOverlay.is-open', { timeout: 12000 });
  await page.waitForFunction(() => {
    const overlay = document.getElementById('hvBattleOverlay');
    return overlay && overlay.classList.contains('is-open') && !overlay.classList.contains('is-loading');
  }, null, { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(1200);
  await page.evaluate(() => {
    const tower = document.getElementById('hvTowerRoot');
    if (tower) {
      tower.hidden = true;
      tower.classList.remove('is-open');
      tower.style.setProperty('display', 'none', 'important');
    }
    document.getElementById('hvHubBackChip')?.classList.remove('is-on');
  });
  await page.waitForTimeout(400);
  const shot = viewport.width + 'x' + viewport.height;
  const frame = page.locator('#hvBattleFrame');
  if (await frame.count()) await frame.screenshot({ path: join(out, 'tower-' + shot + '.png') });
  else await page.screenshot({ path: join(out, 'tower-' + shot + '.png') });
  const state = await page.evaluate(() => {
    const frame = document.getElementById('hvBattleFrame');
    let src = '';
    try { src = frame?.contentDocument?.documentElement?.innerHTML || ''; } catch {}
    const fn = (src.match(/function drawUnit\([\s\S]*?function drawUnitHud/) || [''])[0];
    const foes = Array.isArray(DATA?.encounters?.__tower) ? DATA.encounters.__tower : [];
    return {
      overlay: document.getElementById('hvBattleOverlay')?.classList.contains('is-open') || false,
      flipInFn: /if \(unit\.team === TEAM_ENEMY\) context\.scale\(-1, 1\);\s*if \(drawOngPhoGifHero/.test(fn),
      phoFoe: foes.some(u => String(u?.sourceHeroId || u?.id || '').includes('ong_hang_pho'))
    };
  });
  await page.close();
  const appErrors = errors.filter(text => !/extension|favicon|Failed to load resource|operation was aborted|AbortError/i.test(text));
  const ok = state.overlay && state.flipInFn && state.phoFoe && appErrors.length === 0;
  summary.push({ label: shot, ok, state, appErrors });
  console.log(ok ? 'PASS' : 'FAIL', shot, JSON.stringify({ state, appErrors }));
}

await browser.close();
server.close();
const result = { summary, safari: 'NOT_RUN', pass: summary.every(row => row.ok) };
writeFileSync(join(out, 'evidence.json'), JSON.stringify(result, null, 2));
writeFileSync(join(out, 'notes.md'), '# L80-ONG-PHO-FLIP\n\nChrome 390×844 + 768×1024. Safari NOT_RUN.\nTháp tầng 1 NPC Ông Phở `context.scale(-1,1)` khi TEAM_ENEMY.\n');
console.log(JSON.stringify({ pass: result.pass, safari: result.safari }, null, 2));
if (!result.pass) process.exit(1);
