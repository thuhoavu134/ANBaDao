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
const port = 18053;
const origin = 'http://127.0.0.1:' + port;
const out = join(process.cwd(), 'docs/qa/L43-HERO-DETAIL-HALL');
mkdirSync(out, { recursive: true });
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.mp3': 'audio/mpeg' };
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
const ids = ['lac_yen', 'cung_thu_tre', 'dinh_loi', 'to_diep', 'ong_hang_pho'];
const summary = [];

for (const viewport of [{ width: 390, height: 844 }, { width: 768, height: 1024 }]) {
  const errors = [];
  const page = await browser.newPage({ viewport });
  page.on('pageerror', err => errors.push(String(err)));
  await page.goto(origin + '/?qa=unlock-all', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(600);
  await page.evaluate(() => navTo('heroes'));
  await page.waitForTimeout(400);
  const shots = {};
  for (const id of ids) {
    await page.evaluate(heroId => { renderHeroDetail(heroId); showScreen('heroDetail'); }, id);
    await page.waitForTimeout(350);
    await page.locator('#hvHeroDetailRoot.is-open').waitFor({ timeout: 8000 });
    shots[id] = await page.evaluate(() => {
      const root = document.getElementById('hvHeroDetailRoot');
      const stage = document.querySelector('#hdBody .hstage');
      const cs = getComputedStyle(root);
      const bg = stage ? getComputedStyle(stage).getPropertyValue('--hero-detail-bg') : '';
      return {
        parent: root.parentElement === document.body,
        open: root.classList.contains('is-open'),
        position: cs.position,
        height: root.getBoundingClientRect().height,
        depth: stage?.classList.contains('hv-depth-bg') || false,
        bg
      };
    });
  }
  const label = viewport.width + 'x' + viewport.height;
  await page.screenshot({ path: join(out, 'detail-' + label + '.png') });
  await page.close();
  const ok = ids.every(id => shots[id].parent && shots[id].open && shots[id].position === 'fixed' && shots[id].height > 200 && shots[id].depth && /url\(/.test(shots[id].bg)) && !errors.length;
  summary.push({ label, ok, shots, errors });
  console.log((ok ? 'PASS' : 'FAIL'), label, errors[0] || '');
}

writeFileSync(join(out, 'evidence.json'), JSON.stringify({ summary }, null, 2));
writeFileSync(join(out, 'notes.md'), '# Hồ sơ tướng 3D overlay\n\nChrome 390×844 + 768×1024. Safari NOT_RUN.\n');
await browser.close();
server.close();
if (summary.some(x => !x.ok)) process.exit(1);
