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
const port = 18063;
const origin = 'http://127.0.0.1:' + port;
const out = join(process.cwd(), 'docs/qa/L53-SKILL-SEALS-C');
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

const sampleId = 'dinh_loi';
const controlId = 'ong_hang_pho';
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

for (const viewport of [{ width: 390, height: 844 }, { width: 768, height: 1024 }]) {
  const errors = [];
  const page = await browser.newPage({ viewport });
  page.on('pageerror', err => errors.push(String(err)));
  await page.goto(origin + '/?qa=unlock-all', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(600);
  await page.evaluate(() => navTo('heroes'));
  await page.waitForTimeout(400);
  await page.evaluate(id => { renderHeroDetail(id); showScreen('heroDetail'); }, sampleId);
  await page.waitForTimeout(400);
  await page.locator('#hvHeroDetailRoot.is-open').waitFor({ timeout: 8000 });
  const painted = await page.evaluate(inspect);
  const label = viewport.width + 'x' + viewport.height;
  await page.screenshot({ path: join(out, 'seals-' + sampleId + '-' + label + '.png') });
  await page.evaluate(id => { renderHeroDetail(id); showScreen('heroDetail'); }, controlId);
  await page.waitForTimeout(350);
  const control = await page.evaluate(inspect);
  await page.close();
  const ok = painted.sealCount >= 3
    && painted.heroId === sampleId
    && !painted.emojiOnSeal
    && !painted.emojiOnBefore
    && painted.sealBg.every(bg => bg.includes('skill-seals/' + sampleId))
    && painted.before.every(b => b.bg.includes('skill-seals/' + sampleId))
    && control.emojiOnSeal
    && !control.sealBg.some(bg => bg.includes('skill-seals/'))
    && !errors.length;
  summary.push({ label, ok, painted, control, errors });
  console.log((ok ? 'PASS' : 'FAIL'), 'L53-P1', label, errors[0] || '');
}

writeFileSync(join(out, 'evidence.json'), JSON.stringify({ sampleId, controlId, summary }, null, 2));
writeFileSync(join(out, 'notes.md'), '# L53-SKILL-SEALS-C\n\nChrome 390×844 + 768×1024. Safari NOT_RUN.\nẤn UI Thạch Quyền / Đình Lôi / Tố Điệp. Không đụng assets/characters/dinh-loi.\n');
await browser.close();
server.close();
if (summary.some(x => !x.ok)) process.exit(1);
