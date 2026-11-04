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
await c.goto('http://127.0.0.1:18092/battle.html?qa=flick-ios2', 3500);
const hooked = await c.eval(`(() => { if (typeof authoredSprite !== 'function') return 'no-global';
  const S = window.__S = { ok: {}, miss: {}, swaps: 0, last: {} };
  const orig = authoredSprite;
  window.authoredSprite = function (ctx, def, key, frame, x, y) {
    const r = orig.apply(this, arguments);
    const id = (def && def.heroId) || '?'; const k = id + ':' + key;
    (r ? S.ok : S.miss)[k] = ((r ? S.ok : S.miss)[k] || 0) + 1;
    return r; };
  return typeof window.authoredSprite; })()`);
await c.eval(`document.getElementById('startBattle').click();1`);
await new Promise(r => setTimeout(r, 2600));
await c.eval(`document.getElementById('autoButton').click();1`);
await new Promise(r => setTimeout(r, 14000));
const S = await c.eval('JSON.stringify(window.__S||null)');
const ins = await c.eval(`(()=>{const k=window.__HV_NATIVE_ATLAS_CACHE; const i=k.inspect(); return JSON.stringify({mib:Math.round(i.bytes/1048576), max:Math.round(i.maxBytes/1048576), failed:i.failed, entries:i.entries.map(e=>[String(e.src||'').split('/').slice(-2).join('/'), Math.round(e.bytes/1048576*10)/10, e.state, e.scale])});})()`);
await b.kill();
console.log(IPHONE ? 'IPHONE' : 'DESKTOP', 'hook:', hooked);
const s = JSON.parse(S || 'null');
if (s) {
  const keys = [...new Set([...Object.keys(s.ok), ...Object.keys(s.miss)])].sort();
  for (const k of keys) if (!k.endsWith(':idle') || s.miss[k]) console.log('  ', k.padEnd(34), 'drawn', s.ok[k] || 0, 'MISSED', s.miss[k] || 0);
}
console.log('cache', ins.slice(0, 900));
