import { launch, attach } from './qa-run.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';

const OUT = 'docs/qa/BD-UI-FIX';
mkdirSync(OUT, { recursive: true });
const b = await launch({ width: 1280, height: 800 });
const c = await attach((await (await fetch(b.base + '/json/list')).json()).find(t => t.type === 'page').webSocketDebuggerUrl);
const report = {};

await c.resize(1280, 800);
await c.goto('http://127.0.0.1:18091/index.html', 4500);
await new Promise(r => setTimeout(r, 1800));

// What art does the roster/formation card ask for?
report.probe = await c.eval(`(async () => {
  const out = { screens: [...document.querySelectorAll('[id$="Screen"],[id$="screen"]')].map(e => e.id).slice(0, 40) };
  out.heroCardImgs = [...document.querySelectorAll('img')].filter(i => /characters\\//.test(i.currentSrc || i.src)).slice(0, 12)
    .map(i => ({ src: (i.currentSrc || i.src).split('/characters/')[1], nat: [i.naturalWidth, i.naturalHeight], w: Math.round(i.getBoundingClientRect().width), h: Math.round(i.getBoundingClientRect().height), complete: i.complete }));
  return out;
})()`);

// Try to reach the formation screen and inspect the Bạch Diện tile
report.formation = await c.eval(`(async () => {
  const nav = window.navTo || window.__navTo;
  const tries = [];
  for (const s of ['formation', 'team', 'squad', 'heroes']) {
    if (typeof nav === 'function') { try { nav(s); tries.push(s); await new Promise(r => setTimeout(r, 1200)); } catch (e) {} }
  }
  const tiles = [...document.querySelectorAll('[data-hero-id],[data-id],[data-actor]')]
    .filter(e => /bach_dien|bach-dien/i.test(e.getAttribute('data-hero-id') || e.getAttribute('data-id') || e.getAttribute('data-actor') || ''));
  const out = { tries, tiles: tiles.length, detail: [] };
  for (const t of tiles.slice(0, 6)) {
    const img = t.querySelector('img');
    out.detail.push({
      cls: t.className.slice(0, 60),
      text: (t.textContent || '').trim().slice(0, 40),
      img: img ? { src: (img.currentSrc || img.src).split('/characters/')[1], nat: [img.naturalWidth, img.naturalHeight], w: Math.round(img.getBoundingClientRect().width), h: Math.round(img.getBoundingClientRect().height), complete: img.complete } : null,
      canvas: t.querySelector('canvas') ? 'canvas' : null,
      bg: getComputedStyle(t).backgroundImage.slice(0, 90),
    });
  }
  return out;
})()`);

await c.shot(OUT + '/formation-probe.png').catch(() => {});
writeFileSync(OUT + '/probe.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
await b.kill();
