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
const port = 18058;
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
  } catch {
    res.writeHead(404); res.end('missing');
  }
});
await new Promise(r => server.listen(port, '127.0.0.1', r));

const screen = 'story';
const rootId = 'hvStoryRoot';
const folder = 'L48-STORY-3D';
const hallFile = 'story-hall.jpg';
const out = join(process.cwd(), 'docs/qa', folder);
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-web-security'] });
const summary = [];

for (const viewport of [{ width: 390, height: 844 }, { width: 768, height: 1024 }]) {
  const errors = [];
  const page = await browser.newPage({ viewport });
  page.on('pageerror', err => errors.push(String(err)));
  await page.goto(origin + '/?qa=unlock-all', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(500);
  await page.evaluate(name => { navTo(name); }, screen);
  await page.waitForTimeout(500);
  await page.locator('#' + rootId + '.is-open').waitFor({ timeout: 8000 });
  const info = await page.evaluate(id => {
    const root = document.getElementById(id);
    const cs = getComputedStyle(root);
    return {
      parent: root.parentElement === document.body,
      position: cs.position,
      overflow: cs.overflow,
      bg: cs.backgroundImage,
      display: cs.display,
      height: root.getBoundingClientRect().height,
      bodyFilter: getComputedStyle(document.body).filter
    };
  }, rootId);
  const label = viewport.width + 'x' + viewport.height;
  await page.screenshot({ path: join(out, screen + '-' + label + '.png') });
  await page.close();
  const ok = info.parent && info.position === 'fixed' && info.height > 200 && !errors.length && info.bg.includes(hallFile);
  summary.push({ screen, label, ok, info, errors });
  console.log((ok ? 'PASS' : 'FAIL'), screen, label, info.position, Math.round(info.height), errors[0] || '');
}

writeFileSync(join(out, 'evidence.json'), JSON.stringify({ screen, summary }, null, 2));
writeFileSync(join(out, 'notes.md'), '# ' + folder + '\n\nChrome 390×844 + 768×1024. Safari NOT_RUN.\nHall: đình / water-puppet courtyard, bright fake-3D, not lacquer.\n');
await browser.close();
server.close();
if (summary.some(x => !x.ok)) process.exit(1);
