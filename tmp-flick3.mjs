import { launch, attach } from './tmp-qa-run-alt.mjs';
const P = (s, l) => ({ id: 'p-' + s + l, sourceId: s, team: 'player', slot: l });
const E = (s, l) => ({ id: 'e-' + s + l, sourceId: s, team: 'enemy', slot: l, accent: '#ed806b' });
const cfg = { heroes: [P('hero_splus_lang_tieu', 1), P('hero_splus_lang_chan', 4), P('hero_splus_lang_nguyet', 0), P('hero_splus_tinh_mac', 3),
  E('hero_splus_cuong_dong', 0), E('hero_splus_hac_pha', 1), E('hero_splus_lac_an', 3), E('hero_splus_thiem_ngan', 4)], timingScale: 1 };
const b = await launch({ width: 430, height: 900 });
const c = await attach((await (await fetch(b.base + '/json/list')).json()).find(t => t.type === 'page').webSocketDebuggerUrl);
await c.resize(430, 900);
await c.eval(`window.name=${JSON.stringify('hvBattleConfig:' + encodeURIComponent(JSON.stringify(cfg)))};1`);
await c.goto('http://127.0.0.1:18092/battle.html?qa=flick3', 3500);
await c.eval(`(() => { const F=window.__F={n:0,fr:{}}; const cur=()=>F.fr[F.n]||(F.fr[F.n]={hero:0,all:0,clear:0,units:''});
  const raf=window.requestAnimationFrame.bind(window); window.requestAnimationFrame=cb=>raf(t=>{F.n++;cb(t);});
  const gc=document.getElementById('gameCanvas');
  const dr=CanvasRenderingContext2D.prototype.drawImage;
  CanvasRenderingContext2D.prototype.drawImage=function(img,...a){ if(this.canvas===gc){const s=(img&&(img.currentSrc||img.src))||''; const f=cur(); f.all++; if(/characters\\/(lang-|tinh-mac)/.test(s)) f.hero++;} return dr.apply(this,arguments);};
  const cr=CanvasRenderingContext2D.prototype.clearRect;
  CanvasRenderingContext2D.prototype.clearRect=function(x,y,w,h){ if(this.canvas===gc&&w>=this.canvas.width*0.9) cur().clear++; return cr.apply(this,arguments);};
  const fr=CanvasRenderingContext2D.prototype.fillRect;
  CanvasRenderingContext2D.prototype.fillRect=function(x,y,w,h){ if(this.canvas===gc&&w>=this.canvas.width*0.9&&h>=this.canvas.height*0.9) cur().clear++; return fr.apply(this,arguments);};
  return true;})()`);
await c.eval(`document.getElementById('startBattle').click();1`);
await new Promise(r => setTimeout(r, 2600));
await c.eval(`document.getElementById('autoButton').click();1`);
await new Promise(r => setTimeout(r, 7000));
const F = JSON.parse(await c.eval(`JSON.stringify(window.__F.fr)`));
await b.kill();
const keys = Object.keys(F).map(Number).sort((a, b) => a - b);
let painted = 0, blankHero = [], noRedraw = 0;
for (const k of keys) {
  const f = F[k];
  if (f.clear || f.all) painted++;
  if ((f.clear || f.all > 3) && f.hero < 4) blankHero.push([k, f.hero, f.all, f.clear]);
  if (!f.clear && !f.all) noRedraw++;
}
console.log('frames', keys.length, 'painted', painted, 'no-redraw', noRedraw);
console.log('frames painted with < 4 hero sprites:', blankHero.length, JSON.stringify(blankHero.slice(0, 20)));
// group consecutive runs
const runs = []; let s = null, p = null;
for (const [k] of blankHero) { if (s === null) { s = p = k; } else if (k === p + 1) p = k; else { runs.push([s, p]); s = p = k; } }
if (s !== null) runs.push([s, p]);
console.log('runs:', JSON.stringify(runs.slice(0, 20)));
