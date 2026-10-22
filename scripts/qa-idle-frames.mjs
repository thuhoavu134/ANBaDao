// Dump the hero-detail idle as one image PER AUTHORED FRAME to docs/qa/idle-anchor/frames/<id>/.
//
// The detail canvas paints frame = floor(((performance.now() - start) % durationMs) / durationMs * frames) with the
// clock it keeps in window.__AUTHORED_DETAIL_IDLE_STATE. A Node-side timer (the old `gap` argument) drifts off that
// grid: 24 shots every 105 ms of a 30-frame / 3750 ms idle covered two thirds of one cycle and skipped frames, so
// the GIF was not the idle animation. This script reads the frame index the runtime is painting and keeps one image
// per index. The polling loop lives HERE, not in the page: a page whose requestAnimationFrame stalls would never
// resolve an in-page wait (it hung until the CDP timeout), while Node keeps asking and can report a clear failure.
//
//   node scripts/qa-idle-frames.mjs <id> [frames]           (frames defaults to the hero's runtime-meta)
//   node scripts/qa-idle-frames.mjs <id> --timed [n] [gap]  (old behaviour, kept as a fallback)
import { launch, attach } from './qa-run.mjs';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const id = process.argv[2] || 'tinh_mac';
const timed = process.argv.includes('--timed');
const num = (v, d) => (v === undefined || v === '' || v.startsWith('--') ? d : Number(v));
const args = process.argv.slice(3).filter(a => a !== '--timed');

const metaPath = join('assets', 'characters', id, 'runtime-meta.json');
let frames = num(args[0], 30), durationMs = frames * 125;
if (existsSync(metaPath)) {
  const meta = JSON.parse(readFileSync(metaPath, 'utf8'));
  const c = meta.detail || meta.clips?.idle || {};
  frames = num(args[0], c.frames || frames);
  durationMs = c.durationMs || frames * 125;
}
const gap = num(args[1], 110);
const dir = `docs/qa/idle-anchor/frames/${id}`;
mkdirSync(dir, { recursive: true });
console.log(`${id}: ${frames} frames / ${durationMs}ms (${(durationMs / frames).toFixed(1)}ms per frame)`);

const b = await launch({ width: 390, height: 844 });
const c = await attach((await (await fetch(b.base + '/json/list')).json()).find((t) => t.type === 'page').webSocketDebuggerUrl);
await c.resize(390, 844);
await c.goto('http://127.0.0.1:18091/index.html?qa=unlock-all', 6000);
// The app may open on its login gate (body.login-gate-open, button #hvLoginContinue); clicking by text alone
// misses it, and then navTo('heroes') is a no-op and no card exists.
await c.eval(`(async()=>{const byId=document.getElementById('hvLoginContinue');const byText=[...document.querySelectorAll('button,a,div[role=button]')].find(e=>/Ti?p t?c|choi game/i.test(e.textContent||''));(byId||byText)?.click();await new Promise(r=>setTimeout(r,2500));navTo('heroes');await new Promise(r=>setTimeout(r,1500));return 1;})()`);
console.log('login gate passed, opening the hero detail…');
// Open the hero detail and WAIT for the idle canvas: the card click is a no-op until the roster has rendered
// (the probe re-enters navTo('heroes') first for the same reason), and the canvas only exists once the stage is up.
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
if (opened !== 'ready') { console.log(`FAIL: hero-detail never opened its idle canvas for ${id} (${opened})`); await b.kill(); process.exit(1); }
console.log('idle canvas ready — capturing one image per authored frame…');

let shots = [];
if (!timed) {
  // One grab per authored index, driven from Node: grab the canvas together with the index the runtime reports.
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
    await new Promise(res => setTimeout(res, 20));
  }
  console.log(`captured ${got.size}/${frames} frames in ${rounds} polls`);
  shots = [...got.entries()].sort((a, b2) => a[0] - b2[0]).map(e => e[1]);
} else {
  for (let i = 0; i < frames; i++) {
    const dataUrl = await c.eval(`(function(){const cv=document.getElementById('authoredDetailIdle');return cv?cv.toDataURL('image/png'):'';})()`);
    if (!dataUrl) { console.log('no canvas at', i); break; }
    shots.push(dataUrl);
    await new Promise((r) => setTimeout(r, gap));
  }
}

if (shots.length < frames) {
  console.log(`FAIL: captured ${shots.length} frames, need ${frames} (idle canvas not advancing? hero-detail not open?)`);
  await b.kill();
  process.exit(1);
}
// One full cycle, in order: a longer run means we caught a partial second cycle.
shots = shots.slice(0, frames);
for (let i = 0; i < shots.length; i++) writeFileSync(`${dir}/f${String(i).padStart(2, '0')}.png`, Buffer.from(shots[i].split(',')[1], 'base64'));
console.log(`saved ${shots.length} frames (1 per authored frame, ${(durationMs / frames).toFixed(1)}ms each) -> ${dir}`);
await b.kill();
