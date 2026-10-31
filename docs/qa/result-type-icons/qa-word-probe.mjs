// Why are width/top not applied on the preview page?
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = resolve('C:/lt/wt-result-icons');
const { startBrowser } = await import(pathToFileURL(join(ROOT, 'scripts/qa-battle-readiness-browser.mjs')).href);
const browser = await startBrowser();
const p = await browser.page(375, 812, 2);
try {
  await p.send('Page.navigate', { url: `${browser.origin}/word-preview.html?vw=72&top=0.22&word=victory` });
  await new Promise(r => setTimeout(r, 1500));
  const info = await p.evaluate(`(()=>{const w=document.getElementById('word');
    const vp=document.getElementById('viewport');
    return {inline:w.style.cssText,rect:[Math.round(w.getBoundingClientRect().width),Math.round(w.getBoundingClientRect().height),Math.round(w.getBoundingClientRect().top)],
      vpRect:[Math.round(vp.getBoundingClientRect().width),Math.round(vp.getBoundingClientRect().height)],
      scripts:document.scripts.length, src:w.getAttribute('src'), nat:[w.naturalWidth,w.naturalHeight]};})()`);
  console.log(JSON.stringify(info));
} finally { await p.close(); await browser.close(); }
