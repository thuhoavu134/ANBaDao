import { launch, attach } from './qa-run.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';

const OUT = 'docs/qa/BD-UI-FIX';
mkdirSync(OUT, { recursive: true });
const b = await launch({ width: 1280, height: 820 });
const list = await (await fetch(b.base + '/json/list')).json();
const c = await attach(list.find(t => t.type === 'page').webSocketDebuggerUrl);

await c.resize(1280, 820);
await c.goto('http://127.0.0.1:18091/index.html', 5000);
await new Promise(r => setTimeout(r, 2000));

// pass the login/consent gate
const gate = await c.eval(`(async () => {
  const txt = (el) => (el.textContent || '').trim();
  const click = (pred) => { const el = [...document.querySelectorAll('button,a,div[role=button]')].find(pred); if (el) { el.click(); return true; } return false; };
  const out = { consent: false, play: false };
  out.consent = click(e => /Tôi đồng ý|đồng ý với/i.test(txt(e)));
  await new Promise(r => setTimeout(r, 600));
  out.consent = out.consent || click(e => /Tôi đồng ý|đồng ý với/i.test(txt(e)));
  await new Promise(r => setTimeout(r, 600));
  out.play = click(e => /Tiếp tục chơi game/i.test(txt(e)));
  await new Promise(r => setTimeout(r, 2500));
  out.after = [...document.querySelectorAll('[id$="Screen"]')].filter(e => getComputedStyle(e).display !== 'none').map(e => e.id);
  return out;
})()`);
console.log('gate', JSON.stringify(gate));

const probe = await c.eval(`(async () => {
  const out = {};
  if (typeof window.navTo === 'function') { try { window.navTo('team'); } catch (e) { out.navErr = String(e); } }
  await new Promise(r => setTimeout(r, 1800));
  out.visible = [...document.querySelectorAll('[id$="Screen"]')].filter(e => getComputedStyle(e).display !== 'none').map(e => e.id);
  const sc = document.getElementById('teamScreen');
  out.screenVisible = sc ? getComputedStyle(sc).display : 'none';
  if (!sc) return out;
  out.htmlLen = sc.innerHTML.length;
  out.bachMentions = (sc.innerHTML.match(/bach[-_]dien/gi) || []).length;
  const imgs = [...sc.querySelectorAll('img')];
  out.imgCount = imgs.length;
  out.imgs = imgs.slice(0, 14).map(i => ({
    src: (i.currentSrc || i.src || '').replace(location.origin, ''),
    nat: [i.naturalWidth, i.naturalHeight],
    box: [Math.round(i.getBoundingClientRect().width), Math.round(i.getBoundingClientRect().height)],
    complete: i.complete
  }));
  out.canvasCount = sc.querySelectorAll('canvas').length;
  const slots = [...sc.querySelectorAll('[class*=slot],[class*=card],[class*=unit],[class*=hero]')].slice(0, 18);
  out.slots = slots.map(e => {
    const im = e.querySelector('img'); const r = e.getBoundingClientRect();
    return { cls: (e.className || '').toString().slice(0, 44), w: Math.round(r.width), h: Math.round(r.height),
      img: im ? { src: (im.currentSrc || im.src).replace(location.origin, ''), nat: [im.naturalWidth, im.naturalHeight] } : null };
  });
  return out;
})()`);

console.log(JSON.stringify(probe, null, 2));
await c.shot(OUT + '/team-probe.png').then(p => console.log('shot', p)).catch(e => console.log('shot ERR', e.message));
writeFileSync(OUT + '/team-probe.json', JSON.stringify({ gate, probe }, null, 2));
await b.kill();
