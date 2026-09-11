import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const out = join(dirname(fileURLToPath(import.meta.url)), '../docs/qa/L24-HERO-ROSTER');
mkdirSync(out, { recursive: true });
const origin = process.env.ROSTER_QA_ORIGIN || 'http://127.0.0.1:8080';
const browser = await chromium.launch({ args: ['--no-sandbox'] });

async function probe(viewport, tag) {
  const errors = [];
  const page = await browser.newPage({ viewport });
  page.on('pageerror', err => errors.push(String(err)));
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  await page.goto(origin + '/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(700);
  await page.evaluate(() => {
    document.getElementById('__mgDiag')?.remove();
    document.getElementById('hvQaFullAccess')?.remove();
    try { localStorage.removeItem('mong_gioi_save_v1'); } catch (_) {}
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);
  await page.evaluate(() => {
    document.getElementById('__mgDiag')?.remove();
    document.getElementById('hvQaFullAccess')?.remove();
  });
  await page.screenshot({ path: join(out, `hub-${tag}.png`), fullPage: false });
  const hubHeroes = await page.locator('#hubScreen [data-art-go="heroes"]').count();
  await page.locator('#hubScreen [data-art-go="heroes"]').first().click({ force: true });
  await page.waitForTimeout(500);
  await page.waitForSelector('#hvHeroRosterV4 .v4-card', { timeout: 6000 });
  const shot = await page.evaluate(() => {
    const screen = document.getElementById('heroesScreen');
    const root = document.getElementById('hvHeroRosterV4');
    const grid = root?.querySelector('.v4-grid');
    const filter = root?.querySelector('.v4-filter');
    const dock = root?.querySelector('.v4-dock');
    const card = root?.querySelector('.v4-card');
    const cs = screen ? getComputedStyle(screen) : null;
    const cr = root ? getComputedStyle(root) : null;
    const box = el => {
      const b = el?.getBoundingClientRect();
      return b ? { x: b.x, y: b.y, w: b.width, h: b.height } : null;
    };
    return {
      parentIsBody: !!(root && root.parentElement === document.body),
      screenDisplay: cs?.display || '',
      rootDisplay: cr?.display || '',
      rootPosition: cr?.position || '',
      rootHidden: !!(root && root.hidden),
      rootOpen: !!(root && root.classList.contains('is-open')),
      bodyClass: document.body.classList.contains('hero-roster-active'),
      cards: root ? root.querySelectorAll('.v4-card').length : 0,
      screenBox: box(screen),
      rootBox: box(root),
      gridBox: box(grid),
      filterBox: box(filter),
      dockBox: box(dock),
      cardBox: box(card)
    };
  });
  await page.screenshot({ path: join(out, `roster-${tag}.png`), fullPage: false });
  const appErrors = errors.filter(text => !/extension|favicon|Failed to load resource/i.test(text));
  await page.close();
  const tall = !!(shot.rootBox && shot.rootBox.h > 400);
  const cardsVisible = !!(shot.cardBox && shot.cardBox.h > 80 && shot.gridBox && shot.gridBox.h > 200);
  const chromeVisible = !!(shot.filterBox && shot.filterBox.h > 20 && shot.dockBox && shot.dockBox.h > 20);
  const pass = hubHeroes >= 1
    && shot.parentIsBody === true
    && shot.rootDisplay !== 'none'
    && shot.rootHidden === false
    && shot.rootOpen === true
    && shot.bodyClass === true
    && shot.cards === 12
    && tall === true
    && cardsVisible === true
    && chromeVisible === true
    && appErrors.length === 0;
  return { viewport, hubHeroes, ...shot, tall, cardsVisible, chromeVisible, appErrors, pass };
}

const phone = await probe({ width: 390, height: 844 }, '390x844');
const tablet = await probe({ width: 768, height: 1024 }, '768x1024');

async function probeIframe() {
  const errors = [];
  const page = await browser.newPage({ viewport: { width: 768, height: 1024 } });
  page.on('pageerror', err => errors.push(String(err)));
  await page.setContent(
    `<iframe id="pv" src="${origin}/" style="position:fixed;inset:0;width:100%;height:100%;border:0"></iframe>`,
    { waitUntil: 'domcontentloaded', timeout: 30000 }
  );
  const frame = page.frameLocator('#pv');
  await page.waitForTimeout(900);
  await frame.locator('#hubScreen [data-art-go="heroes"]').first().click({ force: true });
  await page.waitForTimeout(600);
  await frame.locator('#hvHeroRosterV4 .v4-card').first().waitFor({ timeout: 6000 });
  const child = page.frames().find(f => f !== page.mainFrame() && /127\.0\.0\.1|localhost/.test(f.url()));
  if (!child) throw new Error('preview iframe missing');
  const shot = await child.evaluate(() => {
    const root = document.getElementById('hvHeroRosterV4');
    const card = root && root.querySelector('.v4-card');
    const rb = root && root.getBoundingClientRect();
    const cb = card && card.getBoundingClientRect();
    return {
      cards: root ? root.querySelectorAll('.v4-card').length : 0,
      parentIsBody: !!(root && root.parentElement === document.body),
      rootOpen: !!(root && root.classList.contains('is-open')),
      rootH: rb ? rb.height : 0,
      cardH: cb ? cb.height : 0
    };
  });
  await page.screenshot({ path: join(out, 'roster-iframe-768.png'), fullPage: false });
  await page.close();
  const pass = shot.cards === 12 && shot.parentIsBody && shot.rootOpen && shot.rootH > 400 && shot.cardH > 80;
  return { ...shot, pass, appErrors: errors };
}

const iframe = await probeIframe();
const result = { phone, tablet, iframe, pass: phone.pass && tablet.pass && iframe.pass };
writeFileSync(join(out, 'evidence.json'), JSON.stringify(result, null, 2));
writeFileSync(join(out, 'notes.md'), [
  '# L24-HERO-ROSTER',
  '',
  '- Dock Tướng → overlay `#hvHeroRosterV4` gắn body như Trợ trận. overflow auto, thẻ min-height 150, lưới min-height 420. Không `height:auto`.',
  `- Chrome 390×844 ${phone.pass ? 'PASS' : 'FAIL'}; 768×1024 ${tablet.pass ? 'PASS' : 'FAIL'}; iframe 768 ${iframe.pass ? 'PASS' : 'FAIL'}.`,
  '- Safari / device: NOT_RUN.'
].join('\n'));
await browser.close();
if (!result.pass) {
  console.error(result);
  process.exit(1);
}
console.log(JSON.stringify(result, null, 2));
