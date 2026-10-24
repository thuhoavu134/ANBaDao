// QA: open Tướng -> hero detail for one hero in headless Chrome and screenshot (also roster grid).
import { launch, attach } from './qa-run.mjs';
import { copyFileSync, mkdirSync } from 'node:fs';
const [id = 'bach_dien', tag = 'now'] = process.argv.slice(2);
const OUT = 'docs/qa/BD-UI-FIX', PUB = 'C:/Users/Admin/aicoworker/openclaw/workspace-main/outputs/qa';
mkdirSync(OUT, { recursive: true });
const b = await launch({ width: 390, height: 844 });
const c = await attach((await (await fetch(b.base + '/json/list')).json()).find(t => t.type === 'page').webSocketDebuggerUrl);
await c.resize(390, 844);
await c.goto('http://127.0.0.1:18091/index.html?qa=unlock-all', 5000);
await c.eval(`(async()=>{const el=[...document.querySelectorAll('button,a,div[role=button]')].find(e=>/Tiếp tục chơi game/i.test(e.textContent||''));if(el)el.click();await new Promise(r=>setTimeout(r,2500));navTo('heroes');await new Promise(r=>setTimeout(r,1500));return 1;})()`);
const shot = async name => { const f = `${OUT}/${name}-${tag}.png`; await c.shot(f); copyFileSync(f, `${PUB}/${name}-${tag}.png`); };
await shot('roster');
const info = await c.eval(`(async()=>{const card=document.querySelector('[data-hero-id="${id}"]');if(!card)return {card:false};const img=card.querySelector('img');const src=img&&(img.currentSrc||img.src);card.click();await new Promise(r=>setTimeout(r,2500));const cv=document.getElementById('authoredDetailIdle');const r=cv&&cv.getBoundingClientRect();const st=cv&&cv.parentElement.getBoundingClientRect();return {cardImg:src,cardNat:img&&[img.naturalWidth,img.naturalHeight],canvas:r&&[Math.round(r.top),Math.round(r.bottom),Math.round(r.width),Math.round(r.height)],stage:st&&[Math.round(st.top),Math.round(st.bottom)],pos:cv&&getComputedStyle(cv).position};})()`);
console.log(JSON.stringify(info));
await shot('detail');
await b.kill();
