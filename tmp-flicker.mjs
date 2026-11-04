import { launch, attach } from './tmp-qa-run-alt.mjs';
const P = (s, l) => ({ id: 'p-' + s + l, sourceId: s, team: 'player', slot: l });
const E = (s, l) => ({ id: 'e-' + s + l, sourceId: s, team: 'enemy', slot: l, accent: '#ed806b' });
const cfg = { heroes: [P('hero_splus_khaos', 1), P('hero_splus_van_phong', 0), P('hero_splus_lang_chan', 2),
  E('hero_splus_cuong_dong', 0), E('hero_splus_hac_pha', 1), E('hero_splus_lac_an', 3), E('hero_splus_thiem_ngan', 4)], timingScale: 1 };
const b = await launch({ width: 430, height: 900 });
const c = await attach((await (await fetch(b.base + '/json/list')).json()).find(t => t.type === 'page').webSocketDebuggerUrl);
await c.resize(430, 900);
await c.eval(`window.name=${JSON.stringify('hvBattleConfig:' + encodeURIComponent(JSON.stringify(cfg)))};1`);
await c.goto('http://127.0.0.1:18092/battle.html?qa=flicker', 3500);
await c.eval(`(() => { window.__D={events:[], frameIdx:{}}; const dr=CanvasRenderingContext2D.prototype.drawImage;
  CanvasRenderingContext2D.prototype.drawImage=function(img,...a){const s=(img&&(img.currentSrc||img.src))||'';
    if(s.includes('khaos/idle-0')||s.includes('van-phong/idle-0')){ const key=s.includes('khaos')?'khaos':'van-phong';
      window.__D.events.push([key, performance.now()|0, a.length>=8?Math.round(a[0]):-1, a.length>=8?Math.round(a[3]):-1]);
      window.__D.frameIdx[key]=window.__D.frameIdx[key]||{}; }
    return dr.apply(this,arguments);};
  return true;})()`);
await c.eval(`document.getElementById('startBattle').click();1`);
await new Promise(r => setTimeout(r, 2600));
await c.eval(`document.getElementById('autoButton').click();1`);
await new Promise(r => setTimeout(r, 6000));
const ev = await c.eval(`JSON.stringify(window.__D.events.slice(-400))`);
await b.kill();
const rows = JSON.parse(ev);
for (const key of ['khaos', 'van-phong']) {
  const xs = rows.filter(r => r[0] === key);
  if (!xs.length) { console.log(key, 'no draws'); continue; }
  const times = xs.map(r => r[1]);
  const gaps = [];
  for (let i = 1; i < times.length; i++) gaps.push(times[i] - times[i - 1]);
  const frames = xs.map(r => r[2]);
  const uniq = [...new Set(frames)];
  gaps.sort((a, b) => b - a);
  console.log(key, 'draws=', xs.length, '| biggest gaps ms=', gaps.slice(0, 5).join(','), '| frame idx range', Math.min(...frames), '..', Math.max(...frames), '| distinct', uniq.length);
}
