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
const port = 18066;
const origin = 'http://127.0.0.1:' + port;
const out = join(process.cwd(), 'docs/qa/L66-HUB-BACK');
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

async function boot(page) {
  await page.goto(origin + '/?qa=unlock-all', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(700);
  const btn = page.locator('#hvLoginContinue');
  if (await btn.count()) await btn.click({ force: true }).catch(() => {});
  await page.evaluate(() => {
    const root = document.getElementById('hvLoginRoot');
    if (root) { root.hidden = true; root.classList.remove('is-open'); }
    document.getElementById('__mgDiag')?.remove();
    document.getElementById('hvQaFullAccess')?.remove();
  });
  await page.waitForTimeout(200);
}

function chipOn(page) {
  return page.evaluate(() => {
    const chip = document.querySelector('[data-hv-hub]');
    const cs = chip ? getComputedStyle(chip) : null;
    return {
      exists: !!chip,
      visible: !!(chip && cs && cs.display !== 'none' && chip.classList.contains('is-on')),
      hub: !!document.getElementById('hubScreen')?.classList.contains('active')
        || (typeof ST === 'object' && ST.screen === 'hub')
    };
  });
}

async function tapChip(page) {
  await page.locator('[data-hv-hub]').click({ force: true });
  await page.waitForTimeout(350);
}

for (const viewport of [{ width: 390, height: 844 }, { width: 768, height: 1024 }]) {
  const errors = [];
  const page = await browser.newPage({ viewport });
  page.on('pageerror', err => errors.push(String(err)));
  await boot(page);

  await page.evaluate(() => {
    if (typeof runBattle === 'function') runBattle('luyen_tap', () => {});
  });
  await page.waitForSelector('#hvBattleOverlay.is-open', { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(250);
  const battle = await chipOn(page);
  const label = viewport.width + 'x' + viewport.height;
  await page.screenshot({ path: join(out, 'battle-' + label + '.png') });
  if (battle.visible) await tapChip(page);
  const afterBattle = await page.evaluate(() => ({
    overlay: document.getElementById('hvBattleOverlay')?.classList.contains('is-open') || false,
    screen: typeof ST === 'object' ? ST.screen : ''
  }));

  await page.evaluate(() => {
    document.querySelector('[data-art-go="account"]')?.click()
      || document.querySelector('#hubScreen [data-art-go="gear"]')?.click();
    if (typeof navTo === 'function' && !document.getElementById('hvGearRoot')?.classList.contains('is-open')) {
      navTo('account');
    }
  });
  await page.waitForSelector('#hvGearRoot.is-open', { timeout: 8000 }).catch(() => {});
  await page.evaluate(() => {
    const spoke = document.querySelector('#hvGearRoot [data-assist="gear"], #hvGearRoot [data-assist="relic"]');
    spoke?.click();
  });
  await page.waitForTimeout(250);
  const gear = await chipOn(page);
  await page.screenshot({ path: join(out, 'gear-' + label + '.png') });
  if (gear.visible) await tapChip(page);
  const afterGear = await page.evaluate(() => ({
    gearOpen: document.getElementById('hvGearRoot')?.classList.contains('is-open') && !document.getElementById('hvGearRoot')?.hidden,
    screen: ST?.screen
  }));

  await page.evaluate(() => {
    if (window.HonVietDaily && typeof window.HonVietDaily.openLich === 'function') window.HonVietDaily.openLich();
    else document.querySelector('#hubScreen .art-dock [data-art-go="daily"]')?.click();
  });
  await page.waitForSelector('#hvLichRoot.is-open', { timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(200);
  const lich = await chipOn(page);
  const lichBack = await page.evaluate(() => {
    const btn = document.querySelector('#hvLichRoot.is-open [data-lich-back]');
    const cs = btn ? getComputedStyle(btn) : null;
    return {
      exists: !!btn,
      visible: !!(btn && cs && cs.display !== 'none' && cs.visibility !== 'hidden'),
      label: (btn && (btn.getAttribute('aria-label') || btn.textContent || '')).trim()
    };
  });
  await page.screenshot({ path: join(out, 'lich-' + label + '.png') });
  if (lichBack.visible) {
    await page.locator('#hvLichRoot.is-open [data-lich-back]').click({ force: true });
    await page.waitForTimeout(350);
  } else if (lich.visible) {
    await tapChip(page);
  }
  const afterLich = await page.evaluate(() => ({
    lichOpen: document.getElementById('hvLichRoot')?.classList.contains('is-open') && !document.getElementById('hvLichRoot')?.hidden,
    body: document.body.classList.contains('hv-lich-open'),
    screen: ST?.screen
  }));

  await page.evaluate(() => { showScreen('end'); });
  await page.waitForTimeout(250);
  const end = await chipOn(page);
  await page.screenshot({ path: join(out, 'end-' + label + '.png') });
  if (end.visible) await tapChip(page);
  const afterEnd = await page.evaluate(() => ST?.screen);

  await page.close();
  const appErrors = errors.filter(text => !/extension|favicon|Failed to load resource/i.test(text));
  const ok = battle.exists
    && battle.visible
    && afterBattle.screen === 'hub'
    && !afterBattle.overlay
    && gear.visible
    && afterGear.screen === 'hub'
    && !lich.visible
    && lichBack.visible
    && afterLich.screen === 'hub'
    && !afterLich.lichOpen
    && end.visible
    && afterEnd === 'hub'
    && appErrors.length === 0;
  summary.push({ label, ok, battle, afterBattle, gear, afterGear, lich, lichBack, afterLich, end, afterEnd, appErrors });
  console.log(ok ? 'PASS' : 'FAIL', label, JSON.stringify({ battle, afterBattle, gear, afterGear, lich, lichBack, afterLich, end, afterEnd, appErrors }));
}

await browser.close();
server.close();
const result = { summary, safari: 'NOT_RUN', pass: summary.every(row => row.ok) };
writeFileSync(join(out, 'evidence.json'), JSON.stringify(result, null, 2));
writeFileSync(join(out, 'notes.md'), '# L66-HUB-BACK\n\nChrome 390×844 + 768×1024. Safari NOT_RUN.\nChip Thành Chính trên trận iframe, nan Trợ trận inner, kết quả.\nLịch Luyện: ẩn chip, dùng mũi tên ‹ `[data-lich-back]`.\n');
console.log(JSON.stringify({ pass: result.pass, safari: result.safari }, null, 2));
if (!result.pass) process.exit(1);
