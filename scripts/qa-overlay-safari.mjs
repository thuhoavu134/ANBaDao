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
const port = 18064;
const origin = 'http://127.0.0.1:' + port;
const out = join(process.cwd(), 'docs/qa/L51-SAFARI-OVERLAY');
mkdirSync(out, { recursive: true });
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.json': 'application/json', '.svg': 'image/svg/svg+xml', '.woff2': 'font/woff2', '.mp3': 'audio/mpeg' };
mime['.svg'] = 'image/svg+xml';
const server = createServer((req, res) => {
  const url = decodeURIComponent((req.url || '/').split('?')[0]);
  let file = join(dist, url === '/' ? 'index.html' : url.replace(/^\//, ''));
  try {
    const st = statSync(file);
    if (st.isDirectory()) file = join(file, 'index.html');
    res.writeHead(200, { 'content-type': mime[extname(file)] || 'application/octet-stream' });
    res.end(readFileSync(file));
  } catch { res.writeHead(404); res.end('missing'); }
});
await new Promise(r => server.listen(port, '127.0.0.1', r));

const halls = [
  ['story', 'hvStoryRoot', {}],
  ['bag', 'hvBagRoot', {}],
  ['heroes', 'hvHeroRosterV4', {}],
  ['team', 'hvTeamRoot', { formation: true }]
];

const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-web-security'] });
const summary = [];

async function openHall(page, screen, opts) {
  await page.evaluate(({ screen, opts }) => {
    document.body.classList.add('night');
    if (opts.formation) ST.hvOpenFormation = true;
    navTo(screen);
  }, { screen, opts });
}

function readOpen(id) {
  const root = document.getElementById(id);
  if (!root) return { missing: true };
  const cs = getComputedStyle(root);
  const r = root.getBoundingClientRect();
  return {
    parent: root.parentElement === document.body,
    open: root.classList.contains('is-open'),
    htmlOpen: document.documentElement.classList.contains('hv-overlay-open'),
    bodyFilter: getComputedStyle(document.body).filter,
    position: cs.position,
    height: r.height,
    innerH: window.innerHeight,
    vvH: window.visualViewport ? window.visualViewport.height : window.innerHeight
  };
}

for (const viewport of [{ width: 390, height: 844 }, { width: 768, height: 1024 }]) {
  for (const [screen, rootId, opts] of halls) {
    const errors = [];
    const page = await browser.newPage({ viewport });
    page.on('pageerror', err => errors.push(String(err)));
    await page.goto(origin + '/?qa=unlock-all', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(400);
    await openHall(page, screen, opts);
    await page.waitForTimeout(400);
    await page.locator('#' + rootId + '.is-open').waitFor({ timeout: 8000 });
    const info = await page.evaluate(readOpen, rootId);
    const label = screen + '-' + viewport.width + 'x' + viewport.height;
    await page.screenshot({ path: join(out, label + '.png') });
    await page.close();
    const delta = Math.abs((info.height || 0) - (info.innerH || 0));
    const ok = info.parent && info.open && info.htmlOpen && info.bodyFilter === 'none'
      && info.position === 'fixed' && info.height > 200 && delta <= 2 && !errors.length;
    summary.push({ screen, label, ok, info, errors, delta });
    console.log((ok ? 'PASS' : 'FAIL'), label, info.position, Math.round(info.height || 0), 'Δ' + delta, errors[0] || '');
  }
}

{
  const errors = [];
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.on('pageerror', err => errors.push(String(err)));
  await page.setContent('<iframe id="pv" src="' + origin + '/?qa=unlock-all" style="position:fixed;inset:0;width:100%;height:100%;border:0"></iframe>');
  await page.waitForTimeout(900);
  const child = page.frames().find(f => f !== page.mainFrame());
  await child.evaluate(() => { document.body.classList.add('night'); navTo('story'); });
  await page.waitForTimeout(400);
  const info = await child.evaluate(readOpen, 'hvStoryRoot');
  await page.screenshot({ path: join(out, 'iframe-story-390x844.png') });
  await page.close();
  const delta = Math.abs((info.height || 0) - (info.innerH || 0));
  const ok = info.parent && info.open && info.htmlOpen && info.bodyFilter === 'none'
    && info.height > 200 && delta <= 2 && !errors.length;
  summary.push({ screen: 'iframe-story', label: 'iframe-390x844', ok, info, errors, delta });
  console.log((ok ? 'PASS' : 'FAIL'), 'iframe-story', Math.round(info.height || 0), 'Δ' + delta, errors[0] || '');
}

await browser.close();
server.close();
writeFileSync(join(out, 'evidence.json'), JSON.stringify({ ok: summary.every(x => x.ok), summary }, null, 2));
writeFileSync(join(out, 'notes.md'), '# L51-SAFARI-OVERLAY\n\nChrome 390×844 + 768×1024 + iframe. Forced `body.night`. Safari device NOT_RUN (no WebKit in sandbox).\n');
if (summary.some(x => !x.ok)) process.exit(1);
