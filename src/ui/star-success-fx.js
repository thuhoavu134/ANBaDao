// Owner 2026-10-30: star-upgrade success = staged reveal.
// Stars appear one by one left→right, each pops big then settles, a gold mist washes down,
// then every star gets a glass gloss. The overlay stays until the player taps it.
(() => {
  const BTN = '#stBtn';
  let pending = null;

  const starsOf = id => (typeof heroStars === 'function' ? heroStars(id) : 0);
  const currentHero = () => document.getElementById('hvHeroDetailRoot')?.dataset.heroId || '';

  function styleOnce() {
    if (document.getElementById('hvStarSuccessCss')) return;
    const style = document.createElement('style');
    style.id = 'hvStarSuccessCss';
    style.textContent = `
    #hvStarSuccess{position:fixed;inset:0;z-index:1400;display:grid;place-items:center;overflow:hidden;
      background:radial-gradient(circle at 50% 44%,rgba(64,44,16,.78),rgba(5,4,2,.95) 72%);
      opacity:0;transition:opacity .3s ease;cursor:pointer}
    #hvStarSuccess.is-on{opacity:1}
    #hvStarSuccess .ss-wrap{position:relative;display:grid;justify-items:center;gap:16px;padding:26px 18px}
    #hvStarSuccess .ss-mist{position:absolute;left:-20%;right:-20%;top:-40%;height:180%;pointer-events:none;
      background:linear-gradient(180deg,transparent 0%,rgba(255,206,110,.10) 34%,rgba(255,224,150,.34) 50%,rgba(255,196,90,.12) 66%,transparent 100%);
      transform:translateY(-58%);opacity:0}
    #hvStarSuccess.is-on .ss-mist{animation:ssMist 2.1s ease-in-out .12s both}
    @keyframes ssMist{0%{opacity:0;transform:translateY(-58%)}22%{opacity:1}100%{opacity:0;transform:translateY(46%)}}
    #hvStarSuccess .ss-stars{display:flex;gap:10px}
    #hvStarSuccess .ss-star{position:relative;display:inline-block;font-size:40px;line-height:1;color:#4a3a22;
      transform:scale(.86);opacity:.55;transition:color .16s ease}
    #hvStarSuccess .ss-star.on{color:#ffd75e;opacity:1;animation:ssPop .42s cubic-bezier(.2,1.5,.4,1) both;
      text-shadow:0 0 12px #ffc94d,0 0 26px rgba(255,150,20,.8),0 0 48px rgba(255,140,10,.5)}
    @keyframes ssPop{0%{transform:scale(.5)}58%{transform:scale(1.55)}100%{transform:scale(1)}}
    #hvStarSuccess .ss-star.on::after{content:"";position:absolute;inset:-14% -18%;border-radius:50%;pointer-events:none;
      background:linear-gradient(115deg,transparent 38%,rgba(255,255,255,.9) 48%,rgba(255,255,255,.28) 54%,transparent 62%);
      opacity:0}
    #hvStarSuccess.gloss .ss-star.on::after{animation:ssGloss 1.5s ease-in-out infinite}
    @keyframes ssGloss{0%{opacity:0;transform:translateX(-70%)}35%{opacity:.95}100%{opacity:0;transform:translateX(70%)}}
    #hvStarSuccess .ss-title{font:700 30px/1.1 'Noto Serif','Times New Roman',serif;letter-spacing:.1em;
      background:linear-gradient(180deg,#fff6cf,#ffca4e 55%,#b97a12);-webkit-background-clip:text;background-clip:text;color:transparent;
      filter:drop-shadow(0 2px 8px rgba(0,0,0,.85));opacity:0;transform:translateY(8px);transition:opacity .4s,transform .4s}
    #hvStarSuccess .ss-sub{font:14px/1.4 'Noto Serif',serif;color:#e8d3a8;opacity:0;transition:opacity .4s}
    #hvStarSuccess.show-text .ss-title,#hvStarSuccess.show-text .ss-sub{opacity:1;transform:none}
    #hvStarSuccess .ss-hint{font:12px/1.4 'Noto Serif',serif;color:#b9a27a;opacity:0;transition:opacity .4s .2s}
    #hvStarSuccess.show-text .ss-hint{opacity:.85}`;
    document.head.append(style);
  }

  function play(total, gained, heroName) {
    styleOnce();
    document.getElementById('hvStarSuccess')?.remove();
    const root = document.createElement('div');
    root.id = 'hvStarSuccess';
    const wrap = document.createElement('div');
    wrap.className = 'ss-wrap';
    const mist = document.createElement('div');
    mist.className = 'ss-mist';
    const row = document.createElement('div');
    row.className = 'ss-stars';
    const slots = Math.max(6, total);
    const elems = [];
    for (let i = 0; i < slots; i++) {
      const s = document.createElement('span');
      s.className = 'ss-star';
      s.textContent = '★';
      row.append(s);
      elems.push(s);
    }
    const title = document.createElement('div');
    title.className = 'ss-title';
    title.textContent = 'THÀNH CÔNG';
    const sub = document.createElement('div');
    sub.className = 'ss-sub';
    sub.textContent = (heroName ? heroName + ' · ' : '') + total + ' sao';
    const hint = document.createElement('div');
    hint.className = 'ss-hint';
    hint.textContent = 'Chạm vào màn hình để tiếp tục';
    wrap.append(mist, row, title, sub, hint);
    root.append(wrap);
    document.body.append(root);
    requestAnimationFrame(() => root.classList.add('is-on'));

    // Owner 2026-10-30: every star reveals left to right, one at a time, even stars already owned.
    const staged = elems.slice(0, total);
    staged.forEach((el, index) => {
      setTimeout(() => {
        el.classList.add('on');
        if (index < total - Math.max(1, gained)) el.style.opacity = '.9';
      }, 180 + index * 300);
    });
    const allIn = 180 + staged.length * 300 + 380;
    setTimeout(() => { root.classList.add('show-text'); }, allIn - 200);
    setTimeout(() => { root.classList.add('gloss'); }, allIn + 140);

    const close = () => {
      root.classList.remove('is-on');
      const veil = document.getElementById('rewardVeil');
      if (veil) veil.style.display = '';
      setTimeout(() => root.remove(), 320);
      root.removeEventListener('click', close);
    };
    root.addEventListener('click', close);
    root.addEventListener('touchend', event => { event.preventDefault(); close(); });
  }

  document.addEventListener('click', event => {
    const button = event.target instanceof Element ? event.target.closest(BTN) : null;
    if (!button || button.disabled) return;
    const id = currentHero();
    pending = { id, before: starsOf(id) };
  }, true);

  const settle = () => {
    if (!pending) return;
    const job = pending;
    pending = null;
    const after = starsOf(job.id);
    if (!(after > job.before)) return;
    const veil = document.getElementById('rewardVeil');
    if (veil) {
      veil.classList.remove('show');
      veil.style.display = 'none';
    }
    const name = (document.getElementById('hdName')?.textContent || '').split(' — ')[0].trim();
    play(after, after - job.before, name);
  };

  const observer = new MutationObserver(() => { if (pending) setTimeout(settle, 60); });
  const start = () => observer.observe(document.body, { subtree: true, childList: true, characterData: true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
