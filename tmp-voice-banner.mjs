import { launch, attach } from './tmp-qa-run-alt.mjs';
import { mkdirSync } from 'node:fs';
const P = (s, l) => ({ id: 'p-' + s + l, sourceId: s, team: 'player', slot: l });
const E = (s, l) => ({ id: 'e-' + s + l, sourceId: s, team: 'enemy', slot: l, accent: '#ed806b' });
const cfg = { heroes: [P('co_nuong', 1), P('hero_splus_lang_chan', 4), P('hero_splus_lang_chan', 0),
  E('hero_splus_cuong_dong', 0), E('hero_splus_hac_pha', 1), E('hero_splus_lac_an', 3), E('hero_splus_thiem_ngan', 4)], timingScale: 1 };
const OUT = 'C:/Users/Admin/aicoworker/openclaw/workspace-main/tmp/proof/ulti-text/box';
mkdirSync(OUT, { recursive: true });
const b = await launch({ width: 430, height: 900 });
const c = await attach((await (await fetch(b.base + '/json/list')).json()).find(t => t.type === 'page').webSocketDebuggerUrl);
await c.resize(430, 900);
await c.eval(`window.name=${JSON.stringify('hvBattleConfig:' + encodeURIComponent(JSON.stringify(cfg)))};1`);
await c.goto('http://127.0.0.1:18092/battle.html?qa=voicebanner', 3500);
await c.eval(`(()=>{window.__V=[];window.__T=[];const A=window.Audio;window.Audio=function(src){window.__V.push(String(src||''));return new A(src);};window.Audio.prototype=A.prototype;
 const f=CanvasRenderingContext2D.prototype.fillText;CanvasRenderingContext2D.prototype.fillText=function(t,x,y){const m=/(\\d+(?:\\.\\d+)?)px/.exec(this.font||'');const px=m?+m[1]:0;
  if(px>=28){const tr=this.getTransform();window.__T.push({t:String(t),x:Math.round(tr.a*x+tr.e),y:Math.round(tr.d*y+tr.f),px:Math.round(px),font:this.font,cw:this.canvas.clientWidth,ch:this.canvas.clientHeight,w:this.canvas.width,h:this.canvas.height,at:performance.now()|0});}
  return f.apply(this,arguments);};return true;})()`);
await c.eval(`document.getElementById('startBattle').click();1`);
await new Promise(r => setTimeout(r, 2600));
await c.eval(`document.getElementById('autoButton').click();1`);
let shot = null; const t0 = Date.now();
while (Date.now() - t0 < 150000) {
  const st = await c.eval(`({v:window.__V.filter(s=>s.includes('voice-')).length,t:window.__T.length})`);
  if (!shot && st.t > 0) { await new Promise(r => setTimeout(r, 220)); shot = `${OUT}/box-${Date.now() % 100000}.png`; await c.shot(shot); }
  if (shot && st.v > 0) break;
  await new Promise(r => setTimeout(r, 120));
}
const res = await c.eval(`({voices:window.__V.filter(s=>s.includes('voice-')),texts:window.__T.slice(0,12)})`);
await b.kill();
console.log('VOICES:', JSON.stringify(res.voices));
const tx = res.texts; console.log('BANNER calls:', tx.length);
for (const r of tx.slice(0, 10)) console.log(JSON.stringify(r));
console.log('shot:', shot);
