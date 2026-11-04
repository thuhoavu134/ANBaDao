import { launch, attach } from './tmp-qa-run-alt.mjs';
const IPHONE = process.argv[2] !== 'desktop';
const P = (s, l) => ({ id: 'p-' + s + l, sourceId: s, team: 'player', slot: l });
const E = (s, l) => ({ id: 'e-' + s + l, sourceId: s, team: 'enemy', slot: l, accent: '#ed806b' });
const cfg = { heroes: [P('hero_splus_lang_tieu', 1), P('hero_splus_lang_chan', 4), P('hero_splus_lang_nguyet', 0), P('hero_splus_tinh_mac', 3),
  E('hero_splus_cuong_dong', 0), E('hero_splus_hac_pha', 1), E('hero_splus_lac_an', 3), E('hero_splus_thiem_ngan', 4)], timingScale: 1 };
const b = await launch({ width: 390, height: 844 });
const c = await attach((await (await fetch(b.base + '/json/list')).json()).find(t => t.type === 'page').webSocketDebuggerUrl);
await c.resize(390, 844, IPHONE);
if (IPHONE) await c.send('Emulation.setUserAgentOverride', { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1', platform: 'iPhone' });
await c.eval(`window.name=${JSON.stringify('hvBattleConfig:' + encodeURIComponent(JSON.stringify(cfg)))};1`);
await c.goto('http://127.0.0.1:18092/battle.html?qa=flick-ios3', 3500);
const hooked = await c.eval(`(() => { const k = window.__HV_NATIVE_ATLAS_CACHE; if (!k || typeof k.ensure !== 'function') return 'no-cache';
  const S = window.__S = { lost: {}, notReady: {}, ready: {}, was: {} };
  const orig = k.ensure.bind(k);
  k.ensure = function (key, spec) {
    const im = orig(key, spec);
    const ok = !!(im && (im.complete === undefined ? (im.width > 0) : (im.complete && im.naturalWidth)));
    const name = String(key).split('/').slice(-2).join('/');
    if (ok) { S.ready[name] = (S.ready[name] || 0) + 1; S.was[name] = true; }
    else { S.notReady[name] = (S.notReady[name] || 0) + 1; if (S.was[name]) { S.lost[name] = (S.lost[name] || 0) + 1; S.was[name] = false; } }
    return im; };
  return 'ok'; })()`);
await c.eval(`document.getElementById('startBattle').click();1`);
await new Promise(r => setTimeout(r, 2600));
await c.eval(`document.getElementById('autoButton').click();1`);
await new Promise(r => setTimeout(r, 15000));
const S = JSON.parse(await c.eval('JSON.stringify(window.__S||{})'));
const ins = await c.eval(`(()=>{const i=window.__HV_NATIVE_ATLAS_CACHE.inspect(); return Math.round(i.bytes/1048576)+'/'+Math.round(i.maxBytes/1048576)+' MiB';})()`);
await b.kill();
console.log(IPHONE ? 'IPHONE' : 'DESKTOP', 'hook', hooked, 'cache', ins);
const names = [...new Set([...Object.keys(S.ready || {}), ...Object.keys(S.notReady || {})])].sort();
let totalLost = 0, totalMiss = 0;
for (const n of names) {
  const lost = S.lost[n] || 0, miss = S.notReady[n] || 0; totalLost += lost; totalMiss += miss;
  if (lost || miss) console.log('  ', n.padEnd(40), 'ready', S.ready[n] || 0, 'notReady', miss, 'LOST(evicted after ready)', lost);
}
console.log('TOTAL lost', totalLost, 'notReady calls', totalMiss);
