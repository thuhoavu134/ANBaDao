import { cdp } from './qa-cdp.mjs';

const c = await cdp('battle.html');
await c.resize(390, 844);

const info = await c.eval(`(() => {
  let n = 0;
  const raf = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = (cb) => { if (n++ < 3) return raf(cb); return 0; };
  document.querySelectorAll('*').forEach(el => { el.style.animationPlayState = 'paused'; el.style.transition = 'none'; });
  const imgs = [...document.images];
  for (const i of imgs) if (/\\.apng/i.test(i.src)) i.src = i.src.replace(/\\.apng/i, '.png');
  return { imgs: imgs.length };
})()`);
console.log('freeze', JSON.stringify(info));
await new Promise(r => setTimeout(r, 1500));
const p = await c.shotSafe('docs/qa/BD-UI-FIX/test-shot.png');
console.log('shot:', p);
c.close();
