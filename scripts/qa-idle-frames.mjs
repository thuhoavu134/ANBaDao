// Dump N real canvas frames of the hero-detail idle to docs/qa/idle-anchor/frames/<id>/.
import { launch, attach } from './qa-run.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';

const id = process.argv[2] || 'tinh_mac';
const n = Number(process.argv[3] || 18);
const gap = Number(process.argv[4] || 110);
const dir = `docs/qa/idle-anchor/frames/${id}`;
mkdirSync(dir, { recursive: true });

const b = await launch({ width: 390, height: 844 });
const c = await attach((await (await fetch(b.base + '/json/list')).json()).find((t) => t.type === 'page').webSocketDebuggerUrl);
await c.resize(390, 844);
await c.goto('http://127.0.0.1:18091/index.html?qa=unlock-all', 6000);
await c.eval(`(async()=>{const el=[...document.querySelectorAll('button,a,div[role=button]')].find(e=>/Tiếp tục chơi game/i.test(e.textContent||''));if(el)el.click();await new Promise(r=>setTimeout(r,2500));navTo('heroes');await new Promise(r=>setTimeout(r,1500));return 1;})()`);
await c.eval(`(async()=>{const card=document.querySelector('[data-hero-id="${id}"]');if(card)card.click();await new Promise(r=>setTimeout(r,2000));return 1;})()`);

for (let i = 0; i < n; i++) {
  const dataUrl = await c.eval(`(function(){const cv=document.getElementById('authoredDetailIdle');return cv?cv.toDataURL('image/png'):'';})()`);
  if (!dataUrl) { console.log('no canvas at', i); break; }
  writeFileSync(`${dir}/f${String(i).padStart(2, '0')}.png`, Buffer.from(dataUrl.split(',')[1], 'base64'));
  await new Promise((r) => setTimeout(r, gap));
}
console.log(`saved ${n} frames -> ${dir}`);
await b.kill();
