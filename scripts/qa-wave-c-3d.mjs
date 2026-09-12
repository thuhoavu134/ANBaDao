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
const port = 18046;
const origin = 'http://127.0.0.1:' + port;
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.mp3': 'audio/mpeg' };
const server = createServer((req, res) => {
  const url = decodeURIComponent((req.url || '/').split('?')[0]);
  let file = join(dist, url === '/' ? 'index.html' : url.replace(/^\//, ''));
  try {
    const st = statSync(file);
    if (st.isDirectory()) file = join(file, 'index.html');
    const body = readFileSync(file);
    res.writeHead(200, { 'content-type': mime[extname(file)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404); res.end('missing');
  }
});
await new Promise(r => server.listen(port, '127.0.0.1', r));

const halls = [
  ['tower', 'hvTowerRoot', 'L36-TOWER-3D'],
  ['expedition', 'hvExpeditionRoot', 'L37-EXPEDITION-3D'],
  ['shop', 'hvShopRoot', 'L38-SHOP-3D'],
  ['summon', 'hvSummonRoot', 'L39-SUMMON-3D'],
  ['arena', 'hvArenaRoot', 'L40-ARENA-3D'],
  ['hunt', 'hvHuntRoot', 'L41-HUNT-3D'],
  ['festival', 'hvFestivalRoot', 'L42-FESTIVAL-3D']
];

const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-web-security'] });
const summary = [];

for (const [screen, rootId, folder] of halls) {
  const out = join(process.cwd(), 'docs/qa', folder);
  mkdirSync(out, { recursive: true });
  for (const viewport of [{ width: 390, height: 844 }, { width: 768, height: 1024 }]) {
    const errors = [];
    const page = await browser.newPage({ viewport });
    page.on('pageerror', err => errors.push(String(err)));
    await page.goto(origin + '/?qa=unlock-all', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(500);
    await page.evaluate(name => { navTo(name); }, screen);
    await page.waitForTimeout(400);
    await page.locator('#' + rootId + '.is-open').waitFor({ timeout: 8000 });
    const info = await page.evaluate(id => {
      const root = document.getElementById(id);
      const cs = getComputedStyle(root);
      return {
        parent: root.parentElement === document.body,
        position: cs.position,
        inset: cs.top + ',' + cs.right + ',' + cs.bottom + ',' + cs.left,
        overflow: cs.overflow,
        bg: cs.backgroundImage,
        display: cs.display,
        height: root.getBoundingClientRect().height
      };
    }, rootId);
    const label = viewport.width + 'x' + viewport.height;
    await page.screenshot({ path: join(out, screen + '-' + label + '.png') });
    await page.close();
    const ok = info.parent && info.position === 'fixed' && info.height > 200 && !errors.length && /hall\.jpg/.test(info.bg);
    summary.push({ screen, label, ok, info, errors });
    writeFileSync(join(out, 'evidence.json'), JSON.stringify({ screen, ok, info, errors }, null, 2));
    console.log((ok ? 'PASS' : 'FAIL'), screen, label, info.position, Math.round(info.height), errors[0] || '');
  }
}

await browser.close();
server.close();
if (summary.some(x => !x.ok)) process.exit(1);
