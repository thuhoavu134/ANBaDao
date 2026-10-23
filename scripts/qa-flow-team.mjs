import { launch, attach } from './qa-run.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';

const OUT = 'docs/qa/BD-UI-FIX';
mkdirSync(OUT, { recursive: true });
const b = await launch({ width: 1280, height: 800 });
const c = await attach((await (await fetch(b.base + '/json/list')).json()).find(t => t.type === 'page').webSocketDebuggerUrl);

await c.resize(1280, 800);
await c.goto('http://127.0.0.1:18091/index.html', 4500);
await new Promise(r => setTimeout(r, 1500));

const r = await c.eval(`(async () => {
  navTo('team');
  await new Promise(r => setTimeout(r, 1600));
  const sc = document.getElementById('teamScreen');
  const html = sc ? sc.innerHTML : '';
  const out = { len: html.length, imgs: [], canvases: 0, bachNodes: [] };
  out.imgs = [...sc.querySelectorAll('img')].slice(0, 10).map(i => ({ src: (i.currentSrc || i.src).split('/characters/')[1] || (i.currentSrc||i.src).slice(-40), nat: [i.naturalWidth, i.naturalHeight], w: Math.round(i.getBoundingClientRect().width), h: Math.round(i.getBoundingClientRect().height) }));
  out.canvases = sc.querySelectorAll('canvas').length;
  // nodes mentioning bach
  const all = [...sc.querySelectorAll('*')];
  for (const e of all) {
    const s = (e.getAttribute('data-hero-id') || e.getAttribute('data-id') || e.getAttribute('data-actor') || '');
    if (/bach/i.test(s)) out.bachNodes.push({ tag: e.tagName, cls: (e.className || '').toString().slice(0, 50), attrs: s });
  }
  out.bachInHtml = (html.match(/bach[-_]dien/gi) || []).length;
  out.slotCount = sc.querySelectorAll('[class*=slot]').length;
  out.slotClasses = [...new Set([...sc.querySelectorAll('[class*=slot]')].map(e => (e.className||'').toString()))].slice(0, 8);
  return out;
})()`);

console.log(JSON.stringify(r, null, 2));
await c.shot(OUT + '/team.png').catch(e => console.log('shot err', e.message));
await b.kill();
