// Reproduce the owner's "repacked heroes flicker all battle long" on the Safari engine (WebKit), iPhone-sized.
// Per animation frame we record which hero atlases were drawn, and whether the image was actually usable
// (complete + naturalWidth > 0). A hero that is on the field but missing from frames = visible flicker.
import { webkit, devices } from 'playwright';

const BASE = process.argv[2] || 'http://127.0.0.1:18092';
const P = (s, l) => ({ id: 'p-' + s + l, sourceId: s, team: 'player', slot: l });
const E = (s, l) => ({ id: 'e-' + s + l, sourceId: s, team: 'enemy', slot: l, accent: '#ed806b' });
const cfg = { heroes: [P('hero_splus_van_phong', 0), P('be_an', 1), P('hero_splus_nguyet_diep', 2), P('luc_anh', 3), P('dinh_loi', 4),
  E('hero_splus_khaos', 0), E('hero_splus_tinh_mac', 1), E('hero_splus_lang_chan', 3), E('hero_splus_hac_pha', 4)], timingScale: 1 };

const dev = devices['iPhone 13'];
const browser = await webkit.launch();
let ctx;
try { ctx = await browser.newContext({ ...dev }); }
catch (e) { console.log('isMobile unsupported here, using viewport+UA only:', e.message.slice(0, 80));
  ctx = await browser.newContext({ viewport: dev.viewport, userAgent: dev.userAgent, deviceScaleFactor: dev.deviceScaleFactor, hasTouch: true }); }
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', e => errors.push(String(e.message).slice(0, 160)));
await page.goto(BASE + '/index.html', { waitUntil: 'domcontentloaded' }).catch(() => {});
await page.evaluate(n => { window.name = n; }, 'hvBattleConfig:' + encodeURIComponent(JSON.stringify(cfg)));
await page.goto(BASE + '/battle.html?qa=webkit-flicker', { waitUntil: 'load' });
await page.waitForTimeout(3000);
await page.evaluate(() => {
  window.__F = { frame: 0, draws: {}, bad: {}, framesWith: {} };
  const slugOf = s => { const m = /assets\/characters\/([^/]+)\//.exec(s); return m ? m[1] : null; };
  const dr = CanvasRenderingContext2D.prototype.drawImage;
  CanvasRenderingContext2D.prototype.drawImage = function (img, ...a) {
    const src = (img && (img.currentSrc || img.src)) || '';
    const slug = slugOf(src);
    if (slug) {
      const F = window.__F;
      (F.framesWith[slug] ||= new Set()).add(F.frame);
      F.draws[slug] = (F.draws[slug] || 0) + 1;
      if (img instanceof HTMLImageElement && (!img.complete || !img.naturalWidth)) F.bad[slug] = (F.bad[slug] || 0) + 1;
    }
    return dr.apply(this, arguments);
  };
  window.__ERR = 0; window.__ULTI = {};
  new MutationObserver(() => { const t = document.body.innerText || ''; if (t.includes('Không tải đủ hình') && !window.__ERRSEEN) { window.__ERR++; window.__ERRSEEN = true; } if (!t.includes('Không tải đủ hình')) window.__ERRSEEN = false; })
    .observe(document.body, { childList: true, subtree: true, characterData: true });
  setInterval(() => { for (const u of (globalThis.__HON_VIET__?.getUnits?.() || [])) if (u.state === 'ultimate') window.__ULTI[u.sourceId || u.id] = 1; }, 100);
  window.__UF = {};
  const tick = () => { window.__F.frame++; const us = globalThis.__HON_VIET__?.getUnits?.() || [];
    const u = us.find(x => x.state === 'ultimate'); if (u) window.__UF[window.__F.frame] = u.sourceId || u.id;
    requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
});
await page.click('#startBattle').catch(() => {});
await page.waitForTimeout(2500);
await page.click('#autoButton').catch(() => {});
const startFrame = await page.evaluate(() => window.__F.frame);
await page.waitForTimeout(Number(process.env.RUN_MS || 45000));
const shot = 'C:/Users/Admin/aicoworker/openclaw/workspace-main/tmp/proof/webkit-battle.png';
await page.screenshot({ path: shot });
const res = await page.evaluate((sf) => {
  const F = window.__F, out = {};
  for (const [slug, set] of Object.entries(F.framesWith)) {
    const frames = [...set].filter(f => f >= sf).sort((a, b) => a - b);
    let gaps = 0, maxGap = 0;
    for (let i = 1; i < frames.length; i++) { const g = frames[i] - frames[i - 1] - 1; if (g > 0) { gaps++; maxGap = Math.max(maxGap, g); } }
    const gapList = [];
    for (let i = 1; i < frames.length; i++) { const g = frames[i] - frames[i - 1] - 1; if (g > 0) { const mid = [];
      for (let f = frames[i - 1] + 1; f < frames[i]; f++) mid.push(window.__UF[f] || '-');
      const who = [...new Set(mid)]; gapList.push(frames[i - 1] + 1 + '+' + g + ' during ' + who.join('/')); } }
    out[slug] = { framesDrawn: frames.length, gaps, maxGap, gapList: gapList.slice(0, 3) };
  }
  return { totalFrames: F.frame - sf, heroes: out, loadErrors: window.__ERR, ultimates: Object.keys(window.__ULTI),
    cache: (() => { const i = window.__HV_NATIVE_ATLAS_CACHE.inspect(); return { mib: +(i.bytes / 1048576).toFixed(1), budget: +(i.maxBytes / 1048576).toFixed(1), resident: +((i.residentBytes || 0) / 1048576).toFixed(1) }; })() };
}, startFrame);
console.log('webkit', browser.version(), '| frames', res.totalFrames, '| load errors', res.loadErrors, '| ultimates cast by', res.ultimates.join(','), '| cache', JSON.stringify(res.cache));
for (const [k, v] of Object.entries(res.heroes).sort()) console.log(k.padEnd(18), JSON.stringify(v));
if (errors.length) console.log('page errors:', errors.slice(0, 4));
console.log('shot', shot);
await browser.close();
