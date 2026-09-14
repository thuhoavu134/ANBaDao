import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = (() => {
  try { return require('playwright'); } catch {}
  try { return require('/workspace/node_modules/playwright'); } catch {}
  throw new Error('playwright missing');
})();
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const origin = process.env.BBR_QA_ORIGIN || 'http://127.0.0.1:8080';
const out = join(process.cwd(), 'docs/qa/L142-LINH-DONG-BATTLE');
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-web-security'] });
const errors = [];
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
page.on('pageerror', err => errors.push(String(err)));

await page.goto(origin + '/battle.html?qaSplus42=hero_splus_linh_dong', {
  waitUntil: 'domcontentloaded', timeout: 45000
});
await page.waitForSelector('#gameCanvas', { timeout: 15000 });
await page.waitForTimeout(1200);

const snap = await page.evaluate(() => {
  const src = document.documentElement.innerHTML;
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  const img = ctx.getImageData(0, 0, w, h).data;
  let painted = 0;
  for (let i = 0; i < img.length; i += 16) {
    const a = img[i + 3];
    if (a > 20 && img[i] + img[i + 1] + img[i + 2] > 40) painted++;
  }
  return {
    canvasW: w, canvasH: h, painted,
    drawSize: /drawLinhDongAtlas\(context,key,frame,0,0,451,440,\{baseline:64\}\)/.test(src),
    oldSize: /drawLinhDongAtlas\(context,key,frame,0,0,340,332/.test(src),
    sourceOver: /blend:"source-over"/.test(src),
    screenVfx: /drawLinhDongAtlas\(context,fx\.kind[\s\S]{0,180}screen:true/.test(src),
    sfxBus: /HonVietSfx\?\.play\(action==='ultimate'\?'linh-dong-ult'/.test(src),
    oggAudio: /sfx\/linh-dong\/atk\.ogg/.test(src),
    identityScale: /identityScale=\(innerWidth<600\?0\.52:0\.74\)/.test(src),
    hasHero: typeof drawLinhDongHero === 'function'
  };
});
await page.screenshot({ path: join(out, 'battle-390x844.png') });

// Trigger one skill so VFX atlas is requested.
await page.evaluate(() => {
  if (typeof window.__HV_LINH_DONG_QA === 'function') window.__HV_LINH_DONG_QA('skill');
});
await page.waitForTimeout(600);
await page.screenshot({ path: join(out, 'battle-vfx-390x844.png') });
await browser.close();

const appErrors = errors.filter(text => !/extension|favicon|Failed to load resource/i.test(text));
const ok = snap.drawSize && !snap.oldSize && snap.sourceOver && !snap.screenVfx
  && snap.sfxBus && !snap.oggAudio && snap.identityScale && snap.hasHero
  && snap.painted > 50000 && appErrors.length === 0;
writeFileSync(join(out, 'evidence.json'), JSON.stringify({
  ticket: 'TKT-0142', snap, appErrors, ok, ts: new Date().toISOString()
}, null, 2));
console.log(ok ? 'PASS' : 'FAIL', 'L142-P1', JSON.stringify({
  painted: snap.painted, draw: snap.drawSize, sfx: snap.sfxBus, err: appErrors[0] || ''
}));
process.exit(ok ? 0 : 1);
