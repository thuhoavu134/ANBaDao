// Measure the live detail idle canvas: ink bbox per sample, canvas swaps, jumps.
import { launch, attach } from './qa-run.mjs';

const id = process.argv[2] || 'tinh_mac';
const b = await launch({ width: 390, height: 844 });
const c = await attach((await (await fetch(b.base + '/json/list')).json()).find((t) => t.type === 'page').webSocketDebuggerUrl);
await c.resize(390, 844);
await c.goto('http://127.0.0.1:18091/index.html?qa=unlock-all', 6000);

await c.eval(`(async()=>{const el=[...document.querySelectorAll('button,a,div[role=button]')].find(e=>/Tiếp tục chơi game/i.test(e.textContent||''));if(el)el.click();await new Promise(r=>setTimeout(r,2500));navTo('heroes');await new Promise(r=>setTimeout(r,1500));return 1;})()`);

const openDetail = '(async()=>{const card=document.querySelector(\'[data-hero-id="' + id + '"]\');if(!card)return {card:false};card.click();await new Promise(r=>setTimeout(r,2200));return {card:true};})()';
console.log('open:', JSON.stringify(await c.eval(openDetail)));

const measure = `(async()=>{
  const stage=(document.getElementById('authoredDetailIdle')||{}).parentElement;
  let swaps=0;
  const mo=new MutationObserver(ms=>{for(const m of ms){for(const n of m.addedNodes){if(n&&n.id==='authoredDetailIdle')swaps++;}}});
  if(stage)mo.observe(stage,{childList:true,subtree:true});
  const rows=[];
  for(let i=0;i<60;i++){
    const el=document.getElementById('authoredDetailIdle');
    if(el){
      const d=el.getContext('2d').getImageData(0,0,el.width,el.height).data;
      let minX=1e9,maxX=-1,minY=1e9,maxY=-1;
      for(let y=0;y<el.height;y+=2){
        for(let x=0;x<el.width;x+=2){
          if(d[(y*el.width+x)*4+3]>24){if(x<minX)minX=x;if(x>maxX)maxX=x;if(y<minY)minY=y;if(y>maxY)maxY=y;}
        }
      }
      rows.push([el.width,el.height,minX,minY,maxX,maxY,Math.round(performance.now())]);
    }
    await new Promise(r=>setTimeout(r,70));
  }
  mo.disconnect();
  return {swaps:swaps,rows:rows};
})()`;

const r = await c.eval(measure);
const rows = r.rows;
const span = (i) => Math.max(...rows.map((x) => x[i])) - Math.min(...rows.map((x) => x[i]));
let jumps = 0;
let maxJump = 0;
for (let i = 1; i < rows.length; i++) {
  const dx = Math.abs(rows[i][2] - rows[i - 1][2]);
  const dy = Math.abs(rows[i][5] - rows[i - 1][5]);
  const j = Math.max(dx, dy);
  if (j > 6) jumps++;
  if (j > maxJump) maxJump = j;
}
console.log(JSON.stringify({
  canvas: [rows[0][0], rows[0][1]],
  samples: rows.length,
  canvasSwaps: r.swaps,
  xLeftSpan: span(2), yTopSpan: span(3), xRightSpan: span(4), footSpan: span(5),
  bigJumps: jumps, maxJump,
  first: rows.slice(0, 6).map((x) => x.slice(2, 6)),
}, null, 1));
await b.kill();
