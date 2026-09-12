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
const port = 18079;
const origin = 'http://127.0.0.1:' + port;
const out = join(process.cwd(), 'docs/qa/L79-ABORT-BANNER');
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
  await page.waitForTimeout(400);
  await page.evaluate(() => {
    const video = document.querySelector('#hvLoginRoot video');
    try { video?.pause(); } catch {}
    const err = Object.assign(new Error('The operation was aborted.'), { name: 'AbortError' });
    Promise.reject(err);
  });
  await page.waitForTimeout(1800);
  const shot = viewport.width + 'x' + viewport.height;
  await page.screenshot({ path: join(out, 'hub-' + shot + '.png') });
  const state = await page.evaluate(() => {
    const box = document.getElementById('__mgDiag');
    const text = box ? box.textContent || '' : '';
    return {
      banner: !!box,
      abortText: /operation was aborted/i.test(text),
      errs: (window.__mgErrs || []).slice(),
      filterOn: !!window.__hvAbortNoise,
      videoAuto: document.querySelector('#hvLoginRoot video')?.hasAttribute('autoplay') || false,
      hub: typeof ST === 'object' ? ST.screen : ''
    };
  });
  await page.close();
  const appErrors = errors.filter(text => !/extension|favicon|Failed to load resource|operation was aborted|AbortError/i.test(text));
  const ok = state.filterOn && !state.abortText && !state.videoAuto && appErrors.length === 0;
  summary.push({ label: shot, ok, state, appErrors });
  console.log(ok ? 'PASS' : 'FAIL', shot, JSON.stringify({ state, appErrors }));
}

await browser.close();
server.close();
const result = { summary, safari: 'NOT_RUN', pass: summary.every(row => row.ok) };
writeFileSync(join(out, 'evidence.json'), JSON.stringify(result, null, 2));
writeFileSync(join(out, 'notes.md'), '# L79-ABORT-BANNER\n\nChrome 390×844 + 768×1024. Safari NOT_RUN.\nFilter AbortError video login. Banner đỏ aborted không hiện.\n');
console.log(JSON.stringify({ pass: result.pass, safari: result.safari }, null, 2));
if (!result.pass) process.exit(1);
