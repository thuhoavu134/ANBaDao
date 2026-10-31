// Shoot typeface alternates by swapping the <img> source in ONE page (no nav races),
// and record currentSrc + natural size so the evidence is verifiable.
import { join, resolve } from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const ROOT = resolve('C:/lt/wt-result-icons');
const OUT = join(ROOT, 'docs/qa/result-type-icons');
mkdirSync(OUT, { recursive: true });
const { startBrowser } = await import(pathToFileURL(join(ROOT, 'scripts/qa-battle-readiness-browser.mjs')).href);

const browser = await startBrowser();
const shots = [];
try {
  for (const [width, height] of [[375, 812]]) {
    const p = await browser.page(width, height, 2);
    try {
      await p.send('Page.navigate', { url: `${browser.origin}/word-preview.html?vw=72&top=0.22&word=victory` });
      await p.wait('document.readyState==="complete"', 20000);
      await p.wait('(()=>{const i=document.querySelector(".wings");return i&&i.complete&&i.naturalWidth>0;})()', 20000);
      await new Promise(r => setTimeout(r, 1500));
      for (const face of ['palatino', 'bookman', 'constantia']) {
        for (const word of ['victory', 'defeat']) {
          const info = await p.evaluate(`(async()=>{
            const w=document.getElementById('word'),g=document.querySelector('.wings');
            g.src = ${JSON.stringify('assets/owner-refresh-20261018/result-' + word + '-wings.png')};
            w.src = ${JSON.stringify('assets/result-art/result-word-alt/')} + ${JSON.stringify(word)} + '-' + ${JSON.stringify(face)} + '.svg';
            await w.decode().catch(()=>{});
            await new Promise(r=>{if(g.complete)r();else g.onload=r;setTimeout(r,1500)});
            await new Promise(r=>setTimeout(r,120));
            const r=w.getBoundingClientRect();
            return {src:w.currentSrc.split('/').pop(),natural:[w.naturalWidth,w.naturalHeight],
                    box:[Math.round(r.width),Math.round(r.height)],top:Math.round(r.top)};
          })()`);
          await new Promise(r => setTimeout(r, 400));
          const file = join(OUT, `face-${word}-${face}.png`);
          await p.screenshot(file);
          shots.push({ file, word, face, ...info });
        }
      }
    } finally { await p.close(); }
  }
} finally {
  writeFileSync(join(OUT, 'faces.json'), JSON.stringify(shots, null, 2) + '\n');
  console.log(JSON.stringify(shots.map(s => `${s.word}/${s.face} ${s.src} nat=${s.natural} box=${s.box} top=${s.top}`), null, 1));
  await browser.close();
}
