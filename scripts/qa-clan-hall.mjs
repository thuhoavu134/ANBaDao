import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = (() => {
  try { return require('playwright'); } catch {}
  try { return require('/workspace/node_modules/playwright'); } catch {}
  throw new Error('playwright missing');
})();
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createServer } from 'node:http';
import { readFileSync, statSync } from 'node:fs';
import { extname } from 'node:path';

const dist = join(process.cwd(), 'dist');
const port = 18043;
const origin = 'http://127.0.0.1:' + port;
const out = join(process.cwd(), 'docs/qa/L33-CLAN-HALL');
mkdirSync(out, { recursive: true });

const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
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

const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-web-security'] });

async function probe(viewport, label) {
  const errors = [];
  const page = await browser.newPage({ viewport });
  page.on('pageerror', err => errors.push(String(err)));
  await page.goto(origin + '/?qa=unlock-all', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(700);
  await page.evaluate(() => { if (typeof navTo === 'function') navTo('clan'); });
  await page.waitForTimeout(500);
  await page.locator('#hvClanRoot.is-open').waitFor({ timeout: 8000 });
  const shot = await page.evaluate(() => {
    const root = document.getElementById('hvClanRoot');
    const body = document.getElementById('clanBody');
    const box = el => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height };
    };
    const cs = root && getComputedStyle(root);
    return {
      parentIsBody: !!(root && root.parentElement === document.body),
      bodyInside: !!(root && body && root.contains(body)),
      open: !!(root && root.classList.contains('is-open')),
      hidden: !!(root && root.hidden),
      display: cs?.display || '',
      position: cs?.position || '',
      rootBox: box(root),
      bodyBox: box(body),
      hallBg: cs?.backgroundImage || ''
    };
  });
  await page.screenshot({ path: join(out, 'clan-' + label + '.png'), fullPage: false });
  await page.close();
  const pass = shot.parentIsBody && shot.bodyInside && shot.open && shot.hidden === false
    && shot.display === 'flex' && shot.position === 'fixed'
    && shot.rootBox?.h > 400 && shot.bodyBox?.h > 80
    && /clan-hall\.jpg/.test(shot.hallBg)
    && errors.filter(text => !/extension|favicon|Failed to load resource/i.test(text)).length === 0;
  return { viewport, ...shot, appErrors: errors, pass };
}

const phone = await probe({ width: 390, height: 844 }, '390x844');
const tablet = await probe({ width: 768, height: 1024 }, '768x1024');
const result = { phone, tablet, pass: phone.pass && tablet.pass };
writeFileSync(join(out, 'evidence.json'), JSON.stringify(result, null, 2));
writeFileSync(join(out, 'notes.md'), [
  '# L33-CLAN-HALL',
  '',
  '- Overlay #`hvClanRoot` gắn body. Hall `assets/ui/clan/clan-hall.jpg`.',
  `- Chrome 390×844 ${phone.pass ? 'PASS' : 'FAIL'}; 768×1024 ${tablet.pass ? 'PASS' : 'FAIL'}.`,
  '- Safari / device: NOT_RUN.'
].join('\n'));
await browser.close();
server.close();
console.log(JSON.stringify(result, null, 2));
if (!result.pass) process.exit(1);
