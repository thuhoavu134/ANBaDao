// Confirm the flicker mechanism on WebKit/iPhone: count how often the shared atlas cache re-creates the SAME page
// (evicted while still on screen, then reloaded) and how full it is versus its iOS budget.
import { webkit, devices } from 'playwright';
const BASE = process.argv[2] || 'http://127.0.0.1:18092';
const P = (s, l) => ({ id: 'p-' + s + l, sourceId: s, team: 'player', slot: l });
const E = (s, l) => ({ id: 'e-' + s + l, sourceId: s, team: 'enemy', slot: l, accent: '#ed806b' });
const cfg = { heroes: [P('hero_splus_van_phong', 0), P('hero_splus_tinh_mac', 1), P('hero_splus_nguyet_diep', 2), P('hero_splus_khaos', 3), P('bach_dien', 4),
  E('hero_splus_lang_chan', 0), E('hero_splus_lang_tieu', 1), E('hero_splus_cuong_dong', 3), E('hero_splus_hac_pha', 4)], timingScale: 1 };
const dev = devices['iPhone 13'];
const browser = await webkit.launch();
const ctx = await browser.newContext({ ...dev });
const page = await ctx.newPage();
await page.addInitScript(() => {
  window.__LOADS = {};
  const d = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
  Object.defineProperty(HTMLImageElement.prototype, 'src', { configurable: true, get() { return d.get.call(this); },
    set(v) { const m = /assets\/characters\/([^/]+)\/([^/?]+)/.exec(String(v)); if (m) { const k = m[1] + '/' + m[2]; window.__LOADS[k] = (window.__LOADS[k] || 0) + 1; } return d.set.call(this, v); } });
});
await page.goto(BASE + '/index.html', { waitUntil: 'domcontentloaded' }).catch(() => {});
await page.evaluate(n => { window.name = n; }, 'hvBattleConfig:' + encodeURIComponent(JSON.stringify(cfg)));
await page.goto(BASE + '/battle.html?qa=webkit-thrash', { waitUntil: 'load' });
await page.waitForTimeout(3000);
await page.click('#startBattle').catch(() => {});
await page.waitForTimeout(2500);
await page.click('#autoButton').catch(() => {});
await page.waitForTimeout(20000);
const r = await page.evaluate(() => {
  const i = window.__HV_NATIVE_ATLAS_CACHE.inspect();
  return { mib: +(i.bytes / 1048576).toFixed(1), budget: +(i.maxBytes / 1048576).toFixed(1),
    entries: i.entries.map(e => [e.key.replace(/^authored:/, '').split('/').slice(-2).join('/'), +(e.bytes / 1048576).toFixed(1)]),
    reloads: Object.entries(window.__LOADS).filter(([, n]) => n > 1).sort((a, b) => b[1] - a[1]) };
});
console.log('cache', r.mib, '/', r.budget, 'MiB |', r.entries.length, 'pages');
for (const e of r.entries) console.log('  ', e[0], e[1], 'MiB');
console.log('pages loaded more than once (evicted then reloaded):');
for (const [k, n] of r.reloads.slice(0, 14)) console.log('  ', String(n).padStart(4), 'x', k);
await browser.close();
