// Sample the integrated result overlay right after it is shown, to prove the
// Victory/Defeat word is drawn once, above the wings, and never repaints from a
// stale frame (the owner saw old glyphs flash in a few frames).
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = process.cwd();
const OUT = join(ROOT, 'docs/qa/result-type-icons');
mkdirSync(OUT, { recursive: true });
const { startBrowser } = await import(pathToFileURL(join(ROOT, 'scripts/qa-battle-readiness-browser.mjs')).href);

const browser = await startBrowser();
try {
  const { page } = browser;
  const report = { when: new Date().toISOString(), cases: [] };
  for (const kind of ['victory', 'defeat']) {
    await page.evaluate(`(()=>{const r=document.getElementById('integratedResultV6');if(!r)return 'no-overlay';r.className='irv-'+${JSON.stringify(kind)};r.classList.add('show');return 'shown';})()`);
    const frames = [];
    for (const wait of [80, 120, 200, 400, 800]) {
      await page.wait(ms => new Promise(r => setTimeout(r, ms)), wait);
      const info = await page.evaluate(`(()=>{const r=document.getElementById('integratedResultV6');if(!r)return null;const ws=[...r.querySelectorAll('.irv-word')];const t=r.querySelector('.irv-title');if(!t||!ws.length)return {words:ws.length,title:!!t};const w=ws[0];const wr=w.getBoundingClientRect(),tr=t.getBoundingClientRect();const cs=getComputedStyle(w);return {words:ws.length,z:cs.zIndex,opacity:cs.opacity,complete:w.complete,word:[Math.round(wr.x),Math.round(wr.y),Math.round(wr.width),Math.round(wr.height)],titleTop:Math.round(tr.y),overlapsWings:wr.top<tr.bottom-6};})()`);
      frames.push({ wait, info });
    }
    report.cases.push({ kind, frames });
    await page.evaluate(`(()=>{const r=document.getElementById('integratedResultV6');r.classList.remove('show');return 1;})()`);
  }
  writeFileSync(join(OUT, 'word-layer-sample.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report));
} finally {
  await browser.close();
}
