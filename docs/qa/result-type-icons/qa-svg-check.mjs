// Does the generated SVG actually render in Chromium, and at what intrinsic size?
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = resolve('C:/lt/wt-result-icons');
const OUT = join(ROOT, 'docs/qa/result-type-icons');
mkdirSync(OUT, { recursive: true });
const { startBrowser } = await import(pathToFileURL(join(ROOT, 'scripts/qa-battle-readiness-browser.mjs')).href);

const browser = await startBrowser();
const p = await browser.page(500, 320, 2);
const out = {};
try {
  await p.send('Page.navigate', { url: browser.origin + '/assets/result-art/result-word-v2/victory.svg' });
  await new Promise(r => setTimeout(r, 1500));
  out.direct = await p.evaluate(`(()=>{const s=document.querySelector('svg');return {hasSvg:!!s,
    viewBox:s?s.getAttribute('viewBox'):null,paths:document.querySelectorAll('path').length,
    bbox:(()=>{try{const b=s.getBBox();return [Math.round(b.x),Math.round(b.y),Math.round(b.width),Math.round(b.height)]}catch(e){return String(e)}})()};})()`);
  await p.screenshot(join(OUT, 'svg-direct.png'));

  await p.send('Page.navigate', { url: browser.origin + '/' });
  await new Promise(r => setTimeout(r, 1500));
  out.asImg = await p.evaluate(`(async()=>{const i=new Image();i.src='assets/result-art/result-word-v2/victory.svg';
    await new Promise(r=>{i.onload=r;i.onerror=r;setTimeout(r,3000)});
    return {complete:i.complete,natural:[i.naturalWidth,i.naturalHeight],w:i.width,h:i.height};})()`);
} catch (e) {
  out.error = String(e.stack || e).split('\n').slice(0, 3).join(' | ');
} finally {
  writeFileSync(join(OUT, 'svg-check.json'), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out));
  await browser.close();
}
