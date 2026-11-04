import { launch, attach } from './tmp-qa-run-alt.mjs';
const P = (s, l) => ({ id: 'p-' + s + l, sourceId: s, team: 'player', slot: l });
const E = (s, l) => ({ id: 'e-' + s + l, sourceId: s, team: 'enemy', slot: l, accent: '#ed806b' });
const cfg = { heroes: [P('hero_splus_lang_tieu', 1), P('hero_splus_lang_chan', 4), P('hero_splus_lang_nguyet', 0), P('hero_splus_tinh_mac', 3),
  E('hero_splus_cuong_dong', 0), E('hero_splus_hac_pha', 1), E('hero_splus_lac_an', 3), E('hero_splus_thiem_ngan', 4)], timingScale: 1 };
const b = await launch({ width: 430, height: 900 });
const c = await attach((await (await fetch(b.base + '/json/list')).json()).find(t => t.type === 'page').webSocketDebuggerUrl);
await c.resize(430, 900);
await c.eval(`window.name=${JSON.stringify('hvBattleConfig:' + encodeURIComponent(JSON.stringify(cfg)))};1`);
await c.goto('http://127.0.0.1:18092/battle.html?qa=flick2', 3500);
await c.eval(`(() => { window.__F={n:0,log:[]}; const raf=window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame=cb=>raf(t=>{window.__F.n++;cb(t);});
  const dr=CanvasRenderingContext2D.prototype.drawImage;
  CanvasRenderingContext2D.prototype.drawImage=function(img,...a){ const s=(img&&(img.currentSrc||img.src))||'';
    const m=/characters\\/([a-z-]+)\\/([a-z-]+)-\\d/.exec(s);
    if(m&&a.length>=8){ const t=this.getTransform(); window.__F.log.push([window.__F.n,m[1],m[2],Math.round(a[0]),Math.round(a[1]),Math.round(a[6]*t.a),Math.round(a[7]*t.d),Math.round(t.e+a[4]*t.a),Math.round(t.f+a[5]*t.d),+this.globalAlpha.toFixed(2)]); }
    return dr.apply(this,arguments);};
  return true;})()`);
await c.eval(`document.getElementById('startBattle').click();1`);
await new Promise(r => setTimeout(r, 3000));
// stay in the idle/prep phase first (no auto) to see standing heroes only
await new Promise(r => setTimeout(r, 2500));
const idleLog = JSON.parse(await c.eval(`JSON.stringify(window.__F.log.splice(0))`));
await c.eval(`document.getElementById('autoButton').click();1`);
await new Promise(r => setTimeout(r, 5000));
const fightLog = JSON.parse(await c.eval(`JSON.stringify(window.__F.log.splice(0))`));
await b.kill();
function analyse(tag, log) {
  const heroes = [...new Set(log.map(r => r[1]))];
  for (const h of heroes) {
    const rows = log.filter(r => r[1] === h);
    const frames = [...new Set(rows.map(r => r[0]))];
    const fmin = Math.min(...frames), fmax = Math.max(...frames);
    const span = fmax - fmin + 1;
    const perFrame = {}; rows.forEach(r => perFrame[r[0]] = (perFrame[r[0]] || 0) + 1);
    const multi = Object.values(perFrame).filter(v => v > 1).length;
    const missing = span - frames.length;
    const sizes = {}; rows.forEach(r => { const k = r[2] + ':' + r[5] + 'x' + r[6]; sizes[k] = (sizes[k] || 0) + 1; });
    const alphas = [...new Set(rows.map(r => r[9]))];
    console.log(`${tag} ${h.padEnd(14)} frames ${span} drawn ${frames.length} missing ${missing} multi ${multi} | sizes ${JSON.stringify(sizes).slice(0, 160)} | alpha ${alphas.slice(0, 6).join(',')}`);
  }
}
analyse('IDLE ', idleLog);
analyse('FIGHT', fightLog);
