import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const out = join(dirname(fileURLToPath(import.meta.url)), '../docs/qa/L22-TOWER');
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
const hubTower = await page.locator('#hubScreen [data-art-go="tower"]').count();
await page.locator('#hubScreen [data-art-go="tower"]').click({ force: true });
await page.waitForSelector('#hvTowerRoot', { timeout: 5000 });
await page.waitForTimeout(250);
const trialCount = await page.locator('[data-tower-trial]').count();
const floorText = await page.locator('[data-tower-floor]').textContent();
const powerCopy = await page.locator('[data-tower-power]').textContent();
await page.locator('[data-tower-trial="intact"]').click();
await page.waitForTimeout(200);
const trialOn = await page.locator('[data-tower-trial="intact"].is-on').count();
await page.screenshot({ path: join(out, 'tower-390x844.png'), fullPage: false });

const stamBefore = await page.evaluate(() => Number(P.stamina || 0));
const powerBefore = await page.evaluate(() => (typeof teamPower === 'function' ? teamPower() : 0));
const climbLabel = await page.locator('[data-tower-climb]').textContent();
await page.evaluate(() => {
  window.__towerBattles = 0;
  const orig = window.runBattle;
  window.runBattle = function patchedRunBattle() {
    window.__towerBattles = (window.__towerBattles || 0) + 1;
    if (typeof orig === 'function') return orig.apply(this, arguments);
  };
});
await page.locator('[data-tower-climb]').click();
await page.waitForTimeout(400);
const stamAfter = await page.evaluate(() => Number(P.stamina || 0));
const battles = await page.evaluate(() => Number(window.__towerBattles || 0));
const floorAfter = await page.locator('[data-tower-floor]').textContent();
const goldSpentOrGained = await page.evaluate(() => Number(P.gold || 0));
const towerRootAfterClimb = await page.locator('#hvTowerRoot').count();
await page.screenshot({ path: join(out, 'tower-cleared-390x844.png'), fullPage: false });

await page.evaluate(() => {
  window.__realTeamPower = teamPower;
  teamPower = () => 1200;
  P.tower = Object.assign(P.tower || {}, { floor: 12, stuckFloor: 0, stuckSince: 0, selectedTrial: null });
  window.HonVietTower?.render();
});
await page.waitForTimeout(200);
const wallFloor = await page.locator('[data-tower-floor]').textContent();
const wallHint = await page.locator('[data-tower-power-hint]').textContent();
const stamWall = await page.evaluate(() => Number(P.stamina || 0));
await page.locator('[data-tower-climb]').click();
await page.waitForTimeout(350);
const wallAfter = await page.locator('[data-tower-floor]').textContent();
const stuck = await page.evaluate(() => ({
  floor: Number(P.tower?.floor || 0),
  stuckFloor: Number(P.tower?.stuckFloor || 0),
  stuckSince: Number(P.tower?.stuckSince || 0),
  stamina: Number(P.stamina || 0)
}));
await page.screenshot({ path: join(out, 'tower-blocked-390x844.png'), fullPage: false });
await page.evaluate(() => {
  if (window.__realTeamPower) teamPower = window.__realTeamPower;
});

await page.locator('[data-tower-back]').click();
await page.waitForTimeout(250);
const backOnHub = await page.locator('#hubScreen [data-art-go="tower"]').count();
await page.screenshot({ path: join(out, 'hub-tower-390x844.png'), fullPage: false });

const appErrors = errors.filter(text => !/extension|favicon|Failed to load resource/i.test(text));
const result = {
  hubTower,
  trialCount,
  floorText,
  powerCopy,
  trialOn,
  stamBefore,
  powerBefore,
  climbLabel,
  stamAfter,
  spentStamina: stamAfter === stamBefore - 5,
  battles,
  floorAfter,
  goldSpentOrGained,
  towerRootAfterClimb,
  wallFloor,
  wallHint,
  wallAfter,
  stuck,
  backOnHub,
  appErrors,
  pass: hubTower === 1
    && trialCount === 3
    && /Tầng 1/.test(floorText || '')
    && /Lực chiến/.test(powerCopy || '')
    && trialOn === 1
    && stamAfter === stamBefore - 5
    && battles >= 1
    && towerRootAfterClimb === 1
    && /Leo tầng/.test(climbLabel || '')
    && /Tầng 2/.test(floorAfter || '')
    && /Tầng 12/.test(wallFloor || '')
    && /Tầng 12/.test(wallAfter || '')
    && stuck.floor === 12
    && stuck.stuckFloor === 12
    && stuck.stuckSince > 0
    && stuck.stamina === stamWall - 5
    && backOnHub === 1
    && appErrors.length === 0
};
writeFileSync(join(out, 'evidence.json'), JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
await browser.close();
if (!result.pass) process.exit(1);
