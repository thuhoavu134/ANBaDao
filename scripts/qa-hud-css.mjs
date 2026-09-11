import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const out = join(dirname(fileURLToPath(import.meta.url)), '../docs/qa/L12-HUD-CSS');
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on('pageerror', err => errors.push(String(err)));
page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

await page.goto('http://127.0.0.1:8080/?qa=unlock-all', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(800);
await page.evaluate(() => {
  document.getElementById('__mgDiag')?.remove();
  document.getElementById('hvQaFullAccess')?.remove();
});
await page.locator('#hubScreen [data-art-go="campaign"]').click({ force: true });
await page.waitForTimeout(500);
const challenge = page.locator('[data-hv-afk-challenge]');
if (await challenge.count()) {
  await challenge.first().click({ force: true });
  await page.waitForTimeout(400);
}
await page.locator('[data-scene-action="launch"]').click({ force: true });
await page.waitForSelector('#hvBattleOverlay.is-open', { timeout: 8000 });
await page.waitForTimeout(2800);

const frame = page.frameLocator('#hvBattleFrame');
const hud = await page.evaluate(async () => {
  const overlay = document.getElementById('hvBattleOverlay');
  const iframe = document.getElementById('hvBattleFrame');
  const child = iframe?.contentDocument;
  const body = child?.body;
  const topbar = child?.querySelector('.topbar');
  const ribbon = child?.querySelector('.battle-ribbon');
  const speed = child?.querySelector('.reference-battle-speed');
  const skip = child?.querySelector('.reference-battle-skip');
  const dock = child?.querySelector('.reference-battle-dock');
  const cs = el => el ? getComputedStyle(el) : null;
  const box = el => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height, display: getComputedStyle(el).display, vis: getComputedStyle(el).visibility };
  };
  const top = box(topbar);
  const rib = box(ribbon);
  const spd = box(speed);
  const skp = box(skip);
  const dck = box(dock);
  const bg = body ? getComputedStyle(body).backgroundColor : '';
  return {
    overlayOpen: overlay?.classList.contains('is-open') || false,
    bodyClass: body?.className || '',
    topbarHidden: !topbar || top.display === 'none' || top.h === 0,
    ribbonH: rib?.h || 0,
    ribbonVisible: !!(rib && rib.h > 0 && rib.display !== 'none'),
    speedW: spd?.w || 0,
    speedH: spd?.h || 0,
    skipW: skp?.w || 0,
    skipH: skp?.h || 0,
    dockVisible: !!(dck && dck.h > 0 && dck.display !== 'none'),
    mintBody: /231,\s*244,\s*239|#e7f4ef/i.test(bg) || bg.includes('231, 244, 239'),
    bodyBg: bg,
    exitPresent: !!document.getElementById('hvBattleExit'),
    unmutePresent: !!document.getElementById('hvUnmuteAudio')
  };
});

await page.screenshot({ path: join(out, 'hud-390x844.png'), fullPage: false });
await page.screenshot({ path: join(out, 'hud-top-crop.png'), clip: { x: 0, y: 0, width: 390, height: 140 } });
await page.screenshot({ path: join(out, 'hud-dock-crop.png'), clip: { x: 0, y: 704, width: 390, height: 140 } });

const appErrors = errors.filter(text => !/extension|favicon|Failed to load resource/i.test(text));
const result = {
  ticket: 'TKT-0011',
  viewport: '390x844',
  ...hud,
  chromeCompact: hud.topbarHidden && hud.ribbonVisible && hud.ribbonH <= 56 && hud.speedW >= 44 && hud.skipW >= 44 && !hud.mintBody && !hud.exitPresent && !hud.unmutePresent,
  appErrors,
  screenshots: ['hud-390x844.png', 'hud-top-crop.png', 'hud-dock-crop.png']
};
writeFileSync(join(out, 'evidence.json'), JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
if (!result.chromeCompact) process.exit(1);
await browser.close();
