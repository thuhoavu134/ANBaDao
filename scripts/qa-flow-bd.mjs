import { launch, attach } from './qa-run.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';

const OUT = 'docs/qa/BD-UI-FIX';
mkdirSync(OUT, { recursive: true });
const b = await launch({ width: 390, height: 844 });
const c = await attach((await (await fetch(b.base + '/json/list')).json()).find(t => t.type === 'page').webSocketDebuggerUrl);

const report = {};

async function shot(name, w, h) {
  await c.resize(w, h);
  await new Promise(r => setTimeout(r, 600));
  try { await c.shot(`${OUT}/${name}.png`); report[name] = 'ok'; }
  catch (e) { report[name] = 'FAIL ' + e.message.slice(0, 60); }
}

// ---------- VICTORY ----------
for (const [tag, w, h] of [['p', 390, 844], ['d', 1280, 720]]) {
  await c.resize(w, h);
  await c.goto('http://127.0.0.1:18091/battle.html', 4000);
  await new Promise(r => setTimeout(r, 1200));
  await c.eval(`(() => {
    const mk = (id) => ({ id, sourceId: id, name: 'Bạch Diện', damage: 4200, kills: 3, hp: 100, maxHp: 100, alive: true, slot: 0 });
    window.__showIntegratedResultV6(true, { player: [mk('bach_dien')], enemy: [], rewards: [] });
    return 1;
  })()`);
  await new Promise(r => setTimeout(r, 2400));
  report['victory_' + tag] = await c.eval(`(() => {
    const root = document.querySelector('#integratedResultV6 .irv-viewport');
    const idle = document.querySelector('#integratedResultV6 .irv-hero.idle');
    const title = document.querySelector('#integratedResultV6 .irv-title');
    const res = document.querySelector('#integratedResultV6 .irv-result, #integratedResultV6 .irv-card');
    if (!root || !idle) return { ok: false };
    const rr = root.getBoundingClientRect(), ir = idle.getBoundingClientRect();
    const tr = title ? title.getBoundingClientRect() : null;
    const pct = v => +(((v - rr.top) / rr.height) * 100).toFixed(2);
    let topP = null, botP = null;
    try {
      const ctx = idle.getContext('2d');
      const d = ctx.getImageData(0, 0, idle.width, idle.height).data;
      let minY = idle.height, maxY = -1;
      for (let y = 0; y < idle.height; y++) for (let x = 0; x < idle.width; x += 2)
        if (d[(y * idle.width + x) * 4 + 3] > 24) { if (y < minY) minY = y; if (y > maxY) maxY = y; }
      if (maxY >= 0) { topP = pct(ir.top + (minY / idle.height) * ir.height); botP = pct(ir.top + ((maxY + 1) / idle.height) * ir.height); }
    } catch (e) { topP = 'ctx:' + e.message.slice(0, 20); }
    return { ok: true, vp: [rr.width | 0, rr.height | 0], titleBottomPct: tr ? pct(tr.bottom) : null,
      canvasTopPct: pct(ir.top), canvasBottomPct: pct(ir.bottom), artTopPct: topP, artBottomPct: botP,
      resTopPct: res ? pct(res.getBoundingClientRect().top) : null };
  })()`);
  await shot('victory-' + tag, w, h);
}

// ---------- HERO DETAIL ----------
for (const [tag, w, h] of [['p', 390, 844], ['d', 1280, 720]]) {
  await c.resize(w, h);
  await c.goto('http://127.0.0.1:18091/index.html', 3500);
  await new Promise(r => setTimeout(r, 1500));
  report['detail_nav_' + tag] = await c.eval(`(async () => {
    if (typeof window.navTo === 'function') { try { window.navTo('heroes'); } catch(e) {} }
    await new Promise(r => setTimeout(r, 900));
    const t = [...document.querySelectorAll('[data-hero-id]')].find(e => /bach_dien/.test(e.getAttribute('data-hero-id')));
    if (t) { t.click(); await new Promise(r => setTimeout(r, 1400)); return { clicked: 'data-hero-id' }; }
    return { clicked: null, hash: location.hash, views: [...document.querySelectorAll('[id]')].map(e=>e.id).filter(i=>/hero/i.test(i)).slice(0,10) };
  })()`);
  report['detail_' + tag] = await c.eval(`(() => {
    const imgs = [...document.querySelectorAll('img')].filter(i => /characters\\//.test(i.currentSrc || i.src) && i.getBoundingClientRect().height > 120);
    if (!imgs.length) return { ok: false };
    const big = imgs.sort((a, b) => b.getBoundingClientRect().height - a.getBoundingClientRect().height)[0];
    const r = big.getBoundingClientRect(), box = big.parentElement.getBoundingClientRect();
    return { ok: true, src: (big.currentSrc || big.src).split('/characters/')[1], imgH: +r.height.toFixed(1), boxH: +box.height.toFixed(1),
      fillPct: +((r.height / box.height) * 100).toFixed(1), objectFit: getComputedStyle(big).objectFit, objectPosition: getComputedStyle(big).objectPosition,
      nat: [big.naturalWidth, big.naturalHeight] };
  })()`);
  await shot('detail-' + tag, w, h);
}

writeFileSync(OUT + '/report.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
await b.kill();
