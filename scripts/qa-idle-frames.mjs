// Dump the hero-detail idle as one image PER AUTHORED FRAME to docs/qa/idle-anchor/frames/<id>/.
//
// The detail canvas paints frame = floor(((performance.now() - start) % durationMs) / durationMs * frames), with
// `frames` / `durationMs` from the page's AUTHORED_DETAIL_IDLE[id] and `start` in window.__AUTHORED_DETAIL_IDLE_STATE.
// This script reads those SAME values from the page (never a default: the previous version looked runtime-meta up
// by the detail id — "van_phong" — while the folder is the slug — "bach-y-van-phong" — and silently fell back to
// 3750 ms, which is only right for Tịnh Mặc) and keeps one image per frame index, in order.
// The polling loop lives in Node: a page whose requestAnimationFrame stalls cannot wedge the CDP call.
//
//   node scripts/qa-idle-frames.mjs <detail-id>
//   node scripts/qa-idle-frames.mjs <detail-id> --timed [n] [gapMs]   (old timed sampling, kept as a fallback)
import { launch, attach } from './qa-run.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';

const id = process.argv[2] || 'tinh_mac';
const timed = process.argv.includes('--timed');
const rest = process.argv.slice(3).filter(a => a !== '--timed');
const dir = `docs/qa/idle-anchor/frames/${id}`;
mkdirSync(dir, { recursive: true });

const b = await launch({ width: 390, height: 844 });
const fail = async msg => { console.log('FAIL: ' + msg); await b.kill(); process.exit(1); };
const c = await attach((await (await fetch(b.base + '/json/list')).json()).find((t) => t.type === 'page').webSocketDebuggerUrl);
await c.resize(390, 844);
await c.goto('http://127.0.0.1:18091/index.html?qa=unlock-all', 6000);
// The app may open on its login gate (body.login-gate-open, button #hvLoginContinue); clicking by text alone misses
// it, and then navTo('heroes') is a no-op and no card exists.
await c.eval(`(async()=>{const byId=document.getElementById('hvLoginContinue');const byText=[...document.querySelectorAll('button,a,div[role=button]')].find(e=>/Ti?p t?c|choi game/i.test(e.textContent||''));(byId||byText)?.click();await new Promise(r=>setTimeout(r,2500));navTo('heroes');await new Promise(r=>setTimeout(r,1500));return 1;})()`);
// Open the hero detail and WAIT for the idle canvas: the card click is a no-op until the roster has rendered.
const opened = await c.eval(`(async () => {
  for (let attempt = 0; attempt < 4; attempt++) {
    navTo('heroes');
    await new Promise(r => setTimeout(r, 900));
    const card = document.querySelector('[data-hero-id="${id}"]');
    if (card) card.click();
    for (let i = 0; i < 10; i++) {
      await new Promise(r => setTimeout(r, 400));
      const cv = document.getElementById('authoredDetailIdle');
      if (cv && cv.width > 0) return 'ready';
    }
  }
  return 'missing';
})()`, { timeoutMs: 90000 });
if (opened !== 'ready') await fail(`hero-detail never opened its idle canvas for ${id} (${opened})`);

// The exact numbers the runtime animates with.
const spec = JSON.parse(await c.eval(`JSON.stringify((typeof AUTHORED_DETAIL_IDLE!=='undefined'&&AUTHORED_DETAIL_IDLE[${JSON.stringify(id)}])?{frames:AUTHORED_DETAIL_IDLE[${JSON.stringify(id)}].frames,durationMs:AUTHORED_DETAIL_IDLE[${JSON.stringify(id)}].durationMs,clock:!!window.__AUTHORED_DETAIL_IDLE_STATE}:null)`));
if (!spec || !(spec.frames > 0) || !(spec.durationMs > 0)) await fail(`page has no AUTHORED_DETAIL_IDLE entry for ${id}`);
const { frames, durationMs } = spec;
console.log(`${id}: ${frames} frames / ${durationMs}ms (${(durationMs / frames).toFixed(1)}ms per frame, from the page)`);

let shots = [];
if (!timed) {
  if (!spec.clock) await fail('runtime clock __AUTHORED_DETAIL_IDLE_STATE missing');
  const probe = `(function(){const cv=document.getElementById('authoredDetailIdle');const st=window.__AUTHORED_DETAIL_IDLE_STATE;`
    + `if(!cv||!st||!cv.width)return '';`
    + `const idx=Math.min(${frames}-1,Math.floor((((performance.now()-st.start)%${durationMs})/${durationMs})*${frames}));`
    + `const off=window.__qaFrameOff||(window.__qaFrameOff=document.createElement('canvas'));`
    + `if(off.width!==cv.width||off.height!==cv.height){off.width=cv.width;off.height=cv.height;}`
    + `const o=off.getContext('2d');o.clearRect(0,0,off.width,off.height);o.drawImage(cv,0,0);`
    + `return JSON.stringify({idx:idx,url:off.toDataURL('image/png')});})()`;
  const got = new Map();
  const deadline = Date.now() + 60000;
  let rounds = 0;
  while (got.size < frames && Date.now() < deadline) {
    const r = await c.eval(probe);
    rounds++;
    if (r) { const p = JSON.parse(r); if (!got.has(p.idx)) got.set(p.idx, p.url); }
    await new Promise(res => setTimeout(res, 15));
  }
  console.log(`captured ${got.size}/${frames} frames in ${rounds} polls`);
  shots = [...got.entries()].sort((x, y) => x[0] - y[0]).map(e => e[1]);
} else {
  const n = Number(rest[0]) || frames, gap = Number(rest[1]) || 110;
  for (let i = 0; i < n; i++) {
    const dataUrl = await c.eval(`(function(){const cv=document.getElementById('authoredDetailIdle');return cv?cv.toDataURL('image/png'):'';})()`);
    if (!dataUrl) break;
    shots.push(dataUrl);
    await new Promise((r) => setTimeout(r, gap));
  }
}

if (shots.length < frames && !timed) await fail(`captured ${shots.length} frames, need ${frames} (idle canvas not advancing?)`);
shots = shots.slice(0, frames);
for (let i = 0; i < shots.length; i++) writeFileSync(`${dir}/f${String(i).padStart(2, '0')}.png`, Buffer.from(shots[i].split(',')[1], 'base64'));
console.log(`saved ${shots.length} frames (1 per authored frame, ${(durationMs / frames).toFixed(1)}ms each) -> ${dir}`);
await b.kill();
