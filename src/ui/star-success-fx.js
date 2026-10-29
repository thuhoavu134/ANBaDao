// Owner 2026-10-30: a star upgrade ends with a full-screen gold-star reveal, not a reward card.
// Stars light up one by one with "THÀNH CÔNG"; no game state is touched here.
(() => {
  const BTN = '#stBtn';
  let pending = null;

  const starsOf = id => (typeof heroStars === 'function' ? heroStars(id) : 0);
  const currentHero = () => document.getElementById('hvHeroDetailRoot')?.dataset.heroId || '';

  function styleOnce() {
    if (document.getElementById('hvStarSuccessCss')) return;
    const css = `
    #hvStarSuccess{position:fixed;inset:0;z-index:1400;display:grid;place-items:center;pointer-events:none;
      background:radial-gradient(circle at 50% 46%,rgba(70,48,18,.72),rgba(6,4,2,.94) 72%);opacity:0;transition:opacity .28s ease}
    #hvStarSuccess.is-on{opacity:1}
    #hvStarSuccess .ss-wrap{display:grid;justify-items:center;gap:14px;transform:translateY(6px) scale(.96);transition:transform .35s cubic-bezier(.2,.9,.2,1)}
    #hvStarSuccess.is-on .ss-wrap{transform:none}
    #hvStarSuccess .ss-stars{display:flex;gap:8px}
    #hvStarSuccess .ss-star{font-size:38px;line-height:1;color:#4a3a22;text-shadow:0 0 0 transparent;
      transition:transform .18s ease,color .18s ease,text-shadow .18s ease;transform:scale(.82)}
    #hvStarSuccess .ss-star.on{color:#ffd75e;transform:scale(1.22);
      text-shadow:0 0 10px #ffcf5e,0 0 24px #ff9d18,0 0 44px rgba(255,150,20,.75)}
    #hvStarSuccess .ss-title{font:700 30px/1.1 'Noto Serif','Times New Roman',serif;letter-spacing:.08em;
      background:linear-gradient(180deg,#fff3c4,#ffc94d 55%,#b97a12);-webkit-background-clip:text;background-clip:text;color:transparent;
      filter:drop-shadow(0 2px 6px rgba(0,0,0,.8))}
    #hvStarSuccess .ss-sub{font:14px/1.4 'Noto Serif',serif;color:#e8d3a8;opacity:.92}
    #hvStarSuccess .ss-burst{position:absolute;width:280px;height:280px;border-radius:50%;
      background:radial-gradient(circle,rgba(255,214,120,.34),transparent 68%);opacity:0;transition:opacity .4s}
    #hvStarSuccess.is-on .ss-burst{opacity:1}`;
    const style = document.createElement('style');
    style.id = 'hvStarSuccessCss';
    style.textContent = css;
    document.head.append(style);
  }

  function play(total, gained, heroName) {
    styleOnce();
    document.getElementById('hvStarSuccess')?.remove();
    const root = document.createElement('div');
    root.id = 'hvStarSuccess';
    const wrap = document.createElement('div');
    wrap.className = 'ss-wrap';
    const stars = document.createElement('div');
    stars.className = 'ss-stars';
    const slots = Math.max(6, total);
    for (let i = 0; i < slots; i++) {
      const s = document.createElement('span');
      s.className = 'ss-star' + (i < total - gained ? ' on' : '');
      s.textContent = '★';
      stars.append(s);
    }
    const title = document.createElement('div');
    title.className = 'ss-title';
    title.textContent = 'THÀNH CÔNG';
    const sub = document.createElement('div');
    sub.className = 'ss-sub';
    sub.textContent = heroName ? (heroName + ' · ' + total + ' sao') : (total + ' sao');
    const burst = document.createElement('div');
    burst.className = 'ss-burst';
    wrap.append(burst, stars, title, sub);
    root.append(wrap);
    document.body.append(root);
    requestAnimationFrame(() => root.classList.add('is-on'));

    const lights = [...stars.children].slice(Math.max(0, total - gained), total);
    lights.forEach((el, index) => {
      setTimeout(() => el.classList.add('on'), 220 + index * 260);
    });
    const hold = 520 + lights.length * 260;
    setTimeout(() => root.classList.remove('is-on'), hold + 640);
    setTimeout(() => root.remove(), hold + 1000);
  }

  // Capture the click before the game's own handler runs, so the reward card can be suppressed.
  document.addEventListener('click', event => {
    const button = event.target instanceof Element ? event.target.closest(BTN) : null;
    if (!button || button.disabled) return;
    const id = currentHero();
    pending = { id, before: starsOf(id), at: Date.now() };
  }, true);

  const settle = () => {
    if (!pending) return;
    const job = pending;
    pending = null;
    const after = starsOf(job.id);
    if (!(after > job.before)) return;
    // The game opens its reward card right after a successful upgrade; drop it for this case only.
    const veil = document.getElementById('rewardVeil');
    if (veil) {
      veil.classList.remove('show');
      veil.style.display = 'none';
      setTimeout(() => { veil.style.display = ''; }, 1800);
    }
    const name = (document.getElementById('hdName')?.textContent || '').split(' — ')[0].trim();
    play(after, after - job.before, name);
  };

  // Observe the star counter/level text rather than guessing the command internals.
  const observer = new MutationObserver(() => { if (pending) setTimeout(settle, 60); });
  document.addEventListener('DOMContentLoaded', () => {
    observer.observe(document.body, { subtree: true, childList: true, characterData: true });
  });
  if (document.readyState !== 'loading') {
    observer.observe(document.body, { subtree: true, childList: true, characterData: true });
  }
})();
