// QA: boot battle.html with an authored hero (window.name config), auto-battle, and screenshot every time
// one of that hero's action/VFX atlases is being drawn.
// Usage: node scripts/qa-authored-battle.mjs <heroKey> <assetSlug> [tag]   (static server on :18091 serving dist/)
import { launch, attach } from './qa-run.mjs';
import { mkdirSync, copyFileSync } from 'node:fs';

const [id = 'van_phong', slug = 'bach-y-van-phong', tag = 'now'] = process.argv.slice(2);
const OUT = 'docs/qa/' + slug;
const PUB = 'C:/Users/Admin/aicoworker/openclaw/workspace-main/outputs/qa';
mkdirSync(OUT, { recursive: true }); mkdirSync(PUB, { recursive: true });
const P = (sid, slot) => ({ id: 'p-' + sid, sourceId: sid, team: 'player', slot });
const E = (sid, slot) => ({ id: 'e-' + sid + slot, sourceId: sid, team: 'enemy', slot, accent: '#ed806b' });
const cfg = { heroes: [
  P(id, 1), P('khaos', 0), P('bach_dien', 4),
  E('hero_splus_cuong_dong', 0), E('hero_splus_hac_pha', 1), E('hero_splus_lac_an', 3), E('hero_splus_thiem_ngan', 4)
], timingScale: 1 };
const b = await launch({ width: 390, height: 844 });
const c = await attach((await (await fetch(b.base + '/json/list')).json()).find(t => t.type === 'page').webSocketDebuggerUrl);
await c.resize(390, 844);
await c.eval(`window.name=${JSON.stringify('hvBattleConfig:' + encodeURIComponent(JSON.stringify(cfg)))};1`);
await c.goto('http://127.0.0.1:18091/battle.html?qa=authored-' + id, 3500);
await c.eval(`(()=>{window.__vpLog=[];window.__vpErr=[];const d=CanvasRenderingContext2D.prototype.drawImage;CanvasRenderingContext2D.prototype.drawImage=function(img,...a){const s=img&&img.src||'';if(s.includes(${JSON.stringify(slug)}))window.__vpLog.push(s.split('/').pop().replace(/-[0-9a-f]{8}\\.webp$/,''));return d.call(this,img,...a)};window.addEventListener('error',e=>window.__vpErr.push(e.message));})();1`);
await c.eval(`document.getElementById('startBattle').click();1`);
await new Promise(r => setTimeout(r, 2500));
await c.eval(`document.getElementById('autoButton').click();1`);
const seen = {}; const shots = [];
const t0 = Date.now();
while (Date.now() - t0 < 75000) {
  await new Promise(r => setTimeout(r, 350));
  const draws = await c.eval(`(()=>{const L=window.__vpLog;window.__vpLog=[];return JSON.stringify([...new Set(L)])})()`);
  const keys = JSON.parse(draws).filter(k => k !== 'idle-0' && k !== 'portrait');
  for (const k of keys) seen[k] = (seen[k] || 0) + 1;
  const fresh = keys.find(k => (seen[k] === 1 || seen[k] === 4) && shots.length < 10);
  if (fresh) {
    const file = `${OUT}/battle-${tag}-${shots.length}-${fresh}.png`;
    await c.shot(file); copyFileSync(file, `${PUB}/vp-${tag}-${shots.length}-${fresh}.png`);
    shots.push(file);
  }
}
const errs = await c.eval(`JSON.stringify(window.__vpErr)`);
console.log(JSON.stringify({ seen, shots: shots.map(s => s.split('/').pop()), errors: JSON.parse(errs) }));
await c.shot(`${OUT}/battle-${tag}-end.png`); copyFileSync(`${OUT}/battle-${tag}-end.png`, `${PUB}/vp-${tag}-end.png`);
await b.kill();
