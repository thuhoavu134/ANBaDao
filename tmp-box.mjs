import { launch, attach } from './tmp-qa-run-alt.mjs';
import { mkdirSync } from 'node:fs';
// Shoot the vertical ultimate name a few frames into its life for two heroes and measure where its ink lands.
const who = process.argv[2] || 'hero_splus_van_phong';
const P = (s, l) => ({ id: 'p-' + s + l, sourceId: s, team: 'player', slot: l });
const E = (s, l) => ({ id: 'e-' + s + l, sourceId: s, team: 'enemy', slot: l, accent: '#ed806b' });
const cfg = { heroes: [P(who, 1), P('khaos', 0), P('van_phong', 2),
  E('hero_splus_cuong_dong', 0), E('hero_splus_hac_pha', 1), E('hero_splus_lac_an', 3), E('hero_splus_thiem_ngan', 4)], timingScale: 1 };
const OUT = 'C:/Users/Admin/aicoworker/openclaw/workspace-main/tmp/proof/ulti-text/box';
mkdirSync(OUT, { recursive: true });
const b = await launch({ width: 390, height: 844 });
const c = await attach((await (await fetch(b.base + '/json/list')).json()).find(t => t.type === 'page').webSocketDebuggerUrl);
await c.resize(390, 844, true);
await c.eval(`window.name=${JSON.stringify('hvBattleConfig:' + encodeURIComponent(JSON.stringify(cfg)))};1`);
await c.goto('http://127.0.0.1:18092/battle.html?qa=box', 3500);
await c.eval(`(() => { window.__T=[]; const f=CanvasRenderingContext2D.prototype.fillText;
  CanvasRenderingContext2D.prototype.fillText=function(t,x,y){ if(/HV Brush/.test(this.font)) window.__T.push([String(t),Math.round(x),Math.round(y),this.font.split('px')[0].split(' ').pop(),this.canvas.width,this.canvas.height,performance.now()|0]); return f.apply(this,arguments);};
  return 1;})()`);
await c.eval(`document.getElementById('startBattle').click();1`);
await new Promise(r => setTimeout(r, 2600));
await c.eval(`document.getElementById('autoButton').click();1`);
let shots = 0; const t0 = Date.now();
while (Date.now() - t0 < 150000 && shots < 3) {
  const n = await c.eval('window.__T.length');
  if (n > 0) {
    await new Promise(r => setTimeout(r, shots === 0 ? 650 : 250));
    await c.shot(`${OUT}/${who.replace('hero_splus_', '')}-${shots}.png`); shots++;
    if (shots === 3) break;
    continue;
  }
  await new Promise(r => setTimeout(r, 80));
}
const T = await c.eval('JSON.stringify(window.__T.slice(0, 400))');
const canvasRect = await c.eval(`JSON.stringify(document.getElementById('gameCanvas').getBoundingClientRect())`);
await b.kill();
const rows = JSON.parse(T);
const words = [...new Set(rows.map(r => r[0]))];
const xs = rows.map(r => r[1]), ys = rows.map(r => r[2]);
const W = rows[0]?.[4], H = rows[0]?.[5];
console.log(who, 'words:', words.join(' / '));
if (rows.length) console.log('ink centres x', Math.min(...xs), '..', Math.max(...xs), 'of', W, '| y', Math.min(...ys), '..', Math.max(...ys), 'of', H,
  '| as % x', (Math.min(...xs) / W * 100).toFixed(0), '-', (Math.max(...xs) / W * 100).toFixed(0), ' y', (Math.min(...ys) / H * 100).toFixed(0), '-', (Math.max(...ys) / H * 100).toFixed(0), '| font px', rows[0][3]);
console.log('canvas css rect', canvasRect, 'shots', shots);
