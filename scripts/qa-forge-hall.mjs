import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const origin = process.env.QA_ORIGIN || 'http://127.0.0.1:8080';
const out = join(process.cwd(), 'docs/qa/L25-FORGE-HALL');
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-web-security'] });

async function probe(viewport, label) {
  const errors = [];
  const page = await browser.newPage({ viewport });
  page.on('pageerror', err => errors.push(String(err)));
  await page.goto(origin + '/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(700);
  await page.locator('#hubScreen [data-art-go="forge"]').first().click({ force: true });
  await page.waitForTimeout(500);
  await page.locator('#hvForgeRoot.is-open').waitFor({ timeout: 6000 });
  const shot = await page.evaluate(() => {
    const root = document.getElementById('hvForgeRoot');
    const body = document.getElementById('forgeBody');
    const molds = root ? root.querySelectorAll('.moldbtn').length : 0;
    const slots = root ? root.querySelectorAll('.craftb').length : 0;
    const box = el => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height };
    };
    const cs = root && getComputedStyle(root);
    return {
      parentIsBody: !!(root && root.parentElement === document.body),
      bodyInside: !!(root && body && root.contains(body)),
      open: !!(root && root.classList.contains('is-open')),
      hidden: !!(root && root.hidden),
      display: cs?.display || '',
      position: cs?.position || '',
      molds,
      slots,
      rootBox: box(root),
      bodyBox: box(body),
      hallBg: cs?.backgroundImage || ''
    };
  });
  await page.screenshot({ path: join(out, `forge-${label}.png`), fullPage: false });
  await page.close();
  const pass = shot.parentIsBody && shot.bodyInside && shot.open && shot.hidden === false
    && shot.display === 'flex' && shot.position === 'fixed'
    && shot.molds >= 2 && shot.slots >= 4
    && shot.rootBox?.h > 400 && shot.bodyBox?.h > 200
    && /forge-hall\.jpg/.test(shot.hallBg)
    && errors.filter(text => !/extension|favicon|Failed to load resource/i.test(text)).length === 0;
  return { viewport, ...shot, appErrors: errors, pass };
}

const phone = await probe({ width: 390, height: 844 }, '390x844');
const tablet = await probe({ width: 768, height: 1024 }, '768x1024');
const result = { phone, tablet, pass: phone.pass && tablet.pass };
writeFileSync(join(out, 'evidence.json'), JSON.stringify(result, null, 2));
writeFileSync(join(out, 'notes.md'), [
  '# L25-FORGE-HALL',
  '',
  '- Side Rèn → overlay `#hvForgeRoot` gắn body. Hall `assets/ui/forge/forge-hall.jpg`. `forgeCommand` không đổi.',
  `- Chrome 390×844 ${phone.pass ? 'PASS' : 'FAIL'}; 768×1024 ${tablet.pass ? 'PASS' : 'FAIL'}.`,
  '- Safari / device: NOT_RUN.'
].join('\n'));
await browser.close();
console.log(JSON.stringify(result, null, 2));
if (!result.pass) process.exit(1);
