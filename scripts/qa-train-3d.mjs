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
const port = 18067;
const origin = 'http://127.0.0.1:' + port;
const out = join(process.cwd(), 'docs/qa/L67-TRAIN-3D');
mkdirSync(out, { recursive: true });
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.json': 'application/json', '.svg': 'image/svg+xml', '.mp3': 'audio/mpeg', '.mp4': 'video/mp4' };
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

async function boot(page) {
  await page.goto(origin + '/?qa=unlock-all', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(600);
  const btn = page.locator('#hvLoginContinue');
  if (await btn.count()) await btn.click({ force: true }).catch(() => {});
  await page.evaluate(() => {
    const root = document.getElementById('hvLoginRoot');
    if (root) { root.hidden = true; root.classList.remove('is-open'); }
    document.getElementById('__mgDiag')?.remove();
  });
}

for (const viewport of [{ width: 390, height: 844 }, { width: 768, height: 1024 }]) {
  const errors = [];
  const page = await browser.newPage({ viewport });
  page.on('pageerror', err => errors.push(String(err)));
  await boot(page);
  await page.evaluate(() => { if (typeof startTraining === 'function') startTraining(); });
  await page.waitForSelector('#hvTrainRoot.is-open', { timeout: 8000 });
  const info = await page.evaluate(() => {
    const root = document.getElementById('hvTrainRoot');
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
  });
  const label = viewport.width + 'x' + viewport.height;
  await page.screenshot({ path: join(out, 'train-' + label + '.png') });
  await page.locator('[data-train-fight]').click({ force: true });
  await page.waitForSelector('#hvBattleOverlay.is-open', { timeout: 10000 }).catch(() => {});
  const fight = await page.evaluate(() => ({
    overlay: document.getElementById('hvBattleOverlay')?.classList.contains('is-open') || false,
    src: document.getElementById('hvBattleFrame')?.getAttribute('src') || ''
  }));
  await page.screenshot({ path: join(out, 'train-fight-' + label + '.png') });
  await page.close();
  const appErrors = errors.filter(text => !/extension|favicon|Failed to load resource/i.test(text));
  const ok = info.parent && info.position === 'fixed' && info.height > 200
    && /train-hall\.jpg/.test(info.bg) && fight.overlay && appErrors.length === 0;
  summary.push({ label, ok, info, fight, appErrors });
  console.log(ok ? 'PASS' : 'FAIL', 'L67-P1', label, appErrors[0] || '');
}

writeFileSync(join(out, 'evidence.json'), JSON.stringify({ summary, safari: 'NOT_RUN', pass: summary.every(r => r.ok) }, null, 2));
writeFileSync(join(out, 'notes.md'), '# L67-TRAIN-3D\n\nChrome 390×844 + 768×1024. Safari NOT_RUN.\nGiáo Trường hall giả 3D. Wrap startTraining, Luyện mở iframe.\n');
writeFileSync(join(out, 'train-hall.meta.json'), JSON.stringify({
  file: 'assets/ui/train/train-hall.jpg',
  source: 'imagen',
  date: '2026-09-12',
  style: 'bright fake-3D multi-layer Vietnamese đình courtyard, not lacquer',
  ticket: 'TKT-0067',
  prompt: 'Sunlit đình training yard, honey timber pavilion, terracotta roof, wooden dummies, no UI text.'
}, null, 2));
await browser.close();
server.close();
if (summary.some(x => !x.ok)) process.exit(1);
