import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const out = join(dirname(fileURLToPath(import.meta.url)), '../docs/qa/L12-HIDE-CHROME');
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
const prepare = page.locator('[data-scene-action="prepare"]');
if (await prepare.count() && !(await page.locator('[data-scene-action="launch"]').isVisible())) {
  await prepare.first().click({ force: true });
  await page.waitForTimeout(400);
}
const launch = page.locator('[data-scene-action="launch"]');
await launch.waitFor({ state: 'visible', timeout: 8000 });
await launch.click({ force: true });
await page.waitForSelector('#hvBattleOverlay.is-open', { timeout: 8000 });
await page.waitForTimeout(2500);

const overlay = await page.evaluate(() => {
  const overlay = document.getElementById('hvBattleOverlay');
  const unmute = document.getElementById('hvUnmuteAudio');
  const exit = document.getElementById('hvBattleExit');
  const visible = [...document.querySelectorAll('button')].filter(el => {
    const style = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return style.display !== 'none' && style.visibility !== 'hidden' && r.width > 0 && r.height > 0
      && /Rút lui|Bật tiếng/.test(`${el.textContent || ''} ${el.getAttribute('aria-label') || ''}`);
  }).map(el => ({ id: el.id, text: (el.textContent || '').trim(), aria: el.getAttribute('aria-label') }));
  let hud = { exitHidden: null, soundLabel: null };
  try {
    const frame = document.getElementById('hvBattleFrame');
    const doc = frame?.contentDocument;
    const exitBtn = doc?.getElementById('exitBattleButton');
    const soundBtn = doc?.getElementById('soundButton');
    hud = {
      exitHidden: exitBtn ? exitBtn.hidden || exitBtn.hasAttribute('hidden') : null,
      soundLabel: soundBtn ? (soundBtn.textContent || '').trim() : null
    };
  } catch (_e) {}
  return {
    overlayOpen: overlay?.classList.contains('is-open') || false,
    exitPresent: !!exit,
    unmutePresent: !!unmute,
    visibleChrome: visible,
    overlayText: overlay?.innerText || '',
    hud
  };
});
await page.screenshot({ path: join(out, 'battle-390x844.png'), fullPage: false });
await page.screenshot({ path: join(out, 'battle-top-crop.png'), clip: { x: 0, y: 0, width: 390, height: 120 } });

const dump = await page.evaluate(() => ({
  overlayHTML: (document.getElementById('hvBattleOverlay')?.innerHTML || '').slice(0, 400),
  bodyBat: /Bật tiếng/.test(document.body.innerText),
  bodyRut: /Rút lui/.test(document.body.innerText)
}));
Object.assign(overlay, dump);

const appErrors = errors.filter(text => !/extension|favicon|Failed to load resource/i.test(text));
const result = {
  ticket: 'TKT-0010',
  viewport: '390x844',
  overlayOpen: overlay.overlayOpen,
  exitPresent: overlay.exitPresent,
  unmutePresent: overlay.unmutePresent,
  visibleChrome: overlay.visibleChrome,
  hudExitHidden: overlay.hud.exitHidden,
  hudSound: overlay.hud.soundLabel,
  overlayHTML: overlay.overlayHTML,
  bodyHasBatTieng: overlay.bodyBat,
  bodyHasRutLui: overlay.bodyRut,
  chromeGone: !overlay.exitPresent && !overlay.unmutePresent && overlay.visibleChrome.length === 0,
  appErrors,
  screenshots: ['battle-390x844.png', 'battle-top-crop.png']
};
writeFileSync(join(out, 'evidence.json'), JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
await browser.close();
if (!result.overlayOpen || !result.chromeGone || appErrors.length) process.exit(1);
