import { launch, attach } from './tmp-qa-run-alt.mjs';
// Same battle as tmp-flick3, but as an iPhone: the atlas cache drops to 96 MiB / 1 decode at a time there.
const IPHONE = process.argv[2] !== 'desktop';
const P = (s, l) => ({ id: 'p-' + s + l, sourceId: s, team: 'player', slot: l });
const E = (s, l) => ({ id: 'e-' + s + l, sourceId: s, team: 'enemy', slot: l, accent: '#ed806b' });
const cfg = { heroes: [P('hero_splus_lang_tieu', 1), P('hero_splus_lang_chan', 4), P('hero_splus_lang_nguyet', 0), P('hero_splus_tinh_mac', 3),
  E('hero_splus_cuong_dong', 0), E('hero_splus_hac_pha', 1), E('hero_splus_lac_an', 3), E('hero_splus_thiem_ngan', 4)], timingScale: 1 };
const b = await launch({ width: 390, height: 844 });
const c = await attach((await (await fetch(b.base + '/json/list')).json()).find(t => t.type === 'page').webSocketDebuggerUrl);
await c.resize(390, 844, IPHONE);
if (IPHONE) {
  await c.send('Emulation.setUserAgentOverride', { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1', platform: 'iPhone' });
}
await c.eval(`window.name=${JSON.stringify('hvBattleConfig:' + encodeURIComponent(JSON.stringify(cfg)))};1`);
await c.goto('http://127.0.0.1:18092/battle.html?qa=flick-ios', 3500);
await c.eval(`(() => { const F=window.__F={n:0,fr:{}}; const cur=()=>F.fr[F.n]||(F.fr[F.n]={hero:0});
  const raf=window.requestAnimationFrame.bind(window); window.requestAnimationFrame=cb=>raf(t=>{F.n++;cb(t);});
  const gc=document.getElementById('gameCanvas'); const dr=CanvasRenderingContext2D.prototype.drawImage;
  CanvasRenderingContext2D.prototype.drawImage=function(img,...a){ if(this.canvas===gc&&a.length>=8&&a[2]>40){ cur().hero++; } return dr.apply(this,arguments);};
  return true;})()`);
await c.eval(`document.getElementById('startBattle').click();1`);
await new Promise(r => setTimeout(r, 2600));
const u0 = await c.eval('window.__HV_AUTHORED_UNPAINTED||0');
await c.eval(`document.getElementById('autoButton').click();1`);
await new Promise(r => setTimeout(r, 12000));
const u1 = await c.eval('window.__HV_AUTHORED_UNPAINTED||0');
const ins = await c.eval(`(()=>{const k=window.__HV_NATIVE_ATLAS_CACHE; if(!k||!k.inspect) return null; const i=k.inspect(); return {mib:Math.round(i.bytes/1048576), max:Math.round(i.maxBytes/1048576), mobile:i.constrainedMobile, entries:i.entries.length, loading:i.loading, queued:i.queued};})()`);
const frames = await c.eval('window.__F.n');
await b.kill();
console.log(IPHONE ? 'IPHONE' : 'DESKTOP', '| frames', frames, '| unpainted hero draws during fight:', u1 - u0, '| cache', JSON.stringify(ins));
