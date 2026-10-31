// Run the preview page's inline script manually to surface the error.
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = resolve('C:/lt/wt-result-icons');
const { startBrowser } = await import(pathToFileURL(join(ROOT, 'scripts/qa-battle-readiness-browser.mjs')).href);
const browser = await startBrowser();
const p = await browser.page(375, 812, 2);
try {
  await p.send('Page.navigate', { url: `${browser.origin}/word-preview.html?vw=72&top=0.22&word=victory` });
  await new Promise(r => setTimeout(r, 1200));
  const info = await p.evaluate(`(()=>{
    const s=document.scripts[0];
    let err=null;
    try{ (0,eval)(s.textContent); }catch(e){ err=e.message; }
    const w=document.getElementById('word');
    return {len:s.textContent.length, head:s.textContent.slice(0,60), err,
            inline:w.style.cssText, rect:[Math.round(w.getBoundingClientRect().width),Math.round(w.getBoundingClientRect().top)]};
  })()`);
  console.log(JSON.stringify(info));
  console.log('EXC:' + JSON.stringify(p.events.filter(e => e.method === 'Runtime.exceptionThrown').map(e => e.params.exceptionDetails.exception?.description || e.params.exceptionDetails.text).slice(0, 3)));
} finally { await p.close(); await browser.close(); }
