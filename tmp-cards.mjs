import { launch, attach } from './tmp-qa-run-alt.mjs';
import { mkdirSync } from 'node:fs';
const OUT = 'C:/Users/Admin/aicoworker/openclaw/workspace-main/tmp/proof/portraits/cards';
mkdirSync(OUT, { recursive: true });
const ids = ['be_an','van_phong','khaos','nguyet_diep','tinh_mac','lang_van','lang_tieu','lang_nguyet','tieu_linh','lang_chan'];
const b = await launch({ width: 430, height: 932 });
const c = await attach((await (await fetch(b.base + '/json/list')).json()).find(t => t.type === 'page').webSocketDebuggerUrl);
await c.resize(430, 932);
await c.goto('http://127.0.0.1:18092/index.html?qa=unlock-all', 7000);
await c.eval(`(()=>{ ST.screen='heroes'; renderHeroes(); const r=document.getElementById('hvHeroRosterV4'); r.hidden=false; r.classList.add('is-open'); for(const el of document.body.children){ if(el!==r) el.style.setProperty('visibility','hidden','important'); } r.style.setProperty('z-index','2147483647','important'); r.style.setProperty('visibility','visible','important'); return 1; })()`);
await new Promise(r => setTimeout(r, 1500));
for (const id of ids) {
  const box = await c.eval(`(async()=>{ const el=document.querySelector('#hvHeroRosterV4 [data-hero-id="${id}"]'); if(!el) return null;
    el.scrollIntoView({block:'center'}); await new Promise(r=>setTimeout(r,500));
    const img=el.querySelector('img'); if(img && !img.complete) await new Promise(r=>{img.onload=r; setTimeout(r,2500);});
    const r=el.getBoundingClientRect(); return {x:r.x,y:r.y,w:r.width,h:r.height,reviewed:img&&img.dataset.portraitReviewed}; })()`);
  if (!box) { console.log('no card', id); continue; }
  await c.shot(`${OUT}/${id}.png`, { clip: { x: box.x, y: box.y, width: box.w, height: box.h, scale: 2 } });
  console.log(id, 'reviewed=' + box.reviewed, Math.round(box.w) + 'x' + Math.round(box.h));
}
await b.kill();
