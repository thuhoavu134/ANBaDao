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
const port = 18068;
const origin = 'http://127.0.0.1:' + port;
const out = join(process.cwd(), 'docs/qa/L68-SKILL-SEALS-D');
mkdirSync(out, { recursive: true });
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.mp3': 'audio/mpeg', '.mp4': 'video/mp4' };
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

const sampleId = 'ong_hang_pho';
const controlId = 'lac_yen';
const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-web-security'] });
const summary = [];

const inspect = () => {
  const body = document.getElementById('hdBody');
  const seals = [...(body?.querySelectorAll('.hv-scene-skill-seal') || [])];
  const boxes = [...(body?.querySelectorAll('.skillbox[data-skill-slot]') || [])];
  const emoji = /[⚔★✦]/;
  const sealText = seals.map(s => s.textContent);
  const sealBg = seals.map(s => getComputedStyle(s).backgroundImage);
  const before = boxes.map(b => {
    const cs = getComputedStyle(b, '::before');
    return { content: cs.content, bg: cs.backgroundImage };
  });
  return {
    heroId: body?.getAttribute('data-hero-id') || '',
    sealCount: seals.length,
    sealText,
    sealBg,
    before,
    emojiOnSeal: sealText.some(t => emoji.test(t || '')),
    emojiOnBefore: before.some(b => emoji.test(b.content || ''))
  };
};

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
  await page.evaluate(() => navTo('heroes'));
  await page.waitForTimeout(300);
  await page.evaluate(id => { renderHeroDetail(id); showScreen('heroDetail'); }, sampleId);
  await page.waitForTimeout(400);
  await page.locator('#hvHeroDetailRoot.is-open').waitFor({ timeout: 8000 }).catch(() => {});
  const painted = await page.evaluate(inspect);
  const label = viewport.width + 'x' + viewport.height;
  await page.screenshot({ path: join(out, 'seals-' + sampleId + '-' + label + '.png') });
  await page.evaluate(id => { renderHeroDetail(id); showScreen('heroDetail'); }, controlId);
  await page.waitForTimeout(350);
  const control = await page.evaluate(inspect);
  await page.close();
  const appErrors = errors.filter(text => !/extension|favicon|Failed to load resource/i.test(text));
  const ok = painted.sealCount >= 3
    && painted.heroId === sampleId
    && !painted.emojiOnSeal
    && !painted.emojiOnBefore
    && painted.sealBg.every(bg => bg.includes('skill-seals/' + sampleId))
    && painted.before.every(b => b.bg.includes('skill-seals/' + sampleId))
    && control.heroId === controlId
    && !control.sealBg.some(bg => bg.includes('skill-seals/' + sampleId))
    && appErrors.length === 0;
  summary.push({ label, ok, painted, control, appErrors });
  console.log((ok ? 'PASS' : 'FAIL'), 'L68-P1', label, appErrors[0] || '');
}

writeFileSync(join(out, 'evidence.json'), JSON.stringify({ sampleId, controlId, summary, safari: 'NOT_RUN' }, null, 2));
writeFileSync(join(out, 'notes.md'), '# L68-SKILL-SEALS-D\n\nChrome 390×844 + 768×1024. Safari NOT_RUN.\nẤn UI Ông Phở / Lục Ảnh / Thầy Mo. Không combat atlas.\n');
await browser.close();
server.close();
if (summary.some(x => !x.ok)) process.exit(1);
