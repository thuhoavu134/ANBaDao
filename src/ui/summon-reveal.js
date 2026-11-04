/* Owner 2026-11-04: man ket qua Goi Mong = ban thu v56 da duyet (C:\lt\tmp\summon-demo\v56.html).
   Phim mo dau -> the thuy mac roi xuong dai bia 3 tang -> cham dai moi sang tu chat + cuong hoa
   -> lat the ra TUONG THAT (art man role) -> bam the da lat mo man chi tiet tuong. */
(() => {
  if (typeof document === 'undefined') return;
  const A = 'assets/ui/summon/';
  // vi tri dai bia (theo v53/v56): tang tren 3, giua 3, duoi 4
  const TIERS = [
    { b: 64.0, w: 16.5, xs: [29, 50, 71] },
    { b: 45.7, w: 19.0, xs: [21, 50, 79] },
    { b: 23.2, w: 22.5, xs: [12.5, 37.5, 62.5, 87.5] }
  ];
  const ORDER = TIERS.flatMap(t => t.xs.map(x => ({ x, b: t.b, w: t.w })));
  const MAP = { ssr: 'g', ss: 'p', s: 'w', a: 'w', b: 'w' };
  const LABEL = { g: 'SSR', p: 'SS', w: 'S' };
  const GLOW = { g: 'red', p: 'gold', w: 'purple' };
  const RANK = { g: 3, p: 2, w: 1 };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const shortName = n => { const s = String(n || '').trim(); return (s.split(/\s+[—–-]\s+/)[0] || s).trim(); };

  function portrait(id) {
    // cung chuoi art voi man role tuong
    try {
      if (typeof portraitSrc === 'function') {
        const p = portraitSrc(id, 'master') || portraitSrc(id, 'card') || portraitSrc(id, 'avatar');
        if (p) return String(p);
      }
    } catch (_) {}
    try {
      if (typeof characterAsset === 'function') {
        const a = characterAsset(id, 'card') || characterAsset(id, 'avatar') || characterAsset(id, 'idle');
        if (a) return String(a);
      }
    } catch (_) {}
    const h = window.DATA && DATA.heroes ? DATA.heroes[id] : null;
    return h && (h.img || h.portrait || h.art) ? String(h.img || h.portrait || h.art) : '';
  }

  function openDetail(id, box) {
    try {
      box.remove();
      if (typeof renderHeroDetail === 'function') renderHeroDetail(id);
      if (typeof showScreen === 'function') showScreen('heroDetail');
    } catch (_) {}
  }

  const TICK1 = [
    n => `✦ Thiên mệnh chiếu rọi! Đại hiệp đã chiêu mộ thành công <em>【SSR】${n}</em> — kỳ tài hiếm có, giang hồ chấn động! ✦`,
    n => `✦ Long ngâm cửu thiên! <em>【SSR】${n}</em> đã đầu quân dưới trướng đại hiệp — chúc mừng duyên trời định! ✦`
  ];
  const TICK2 = (a, b) => `✦ Song long xuất thế! <em>【SSR】${a}</em> và <em>【SSR】${b}</em> cùng quy về một mối — vạn hùng cúi đầu, giang hồ dậy sóng! ✦`;
  const TICK3 = ns => `✦ Quần hùng tụ hội! ${ns.map(n => `<em>【SSR】${n}</em>`).join(', ')} cùng tề tựu — <b>Thiên Mệnh</b> đã chọn đại hiệp! ✦`;

  function play(pulls) {
    if (!Array.isArray(pulls) || !pulls.length) return;
    document.getElementById('hvSumReveal')?.remove();
    const timers = [];
    const T = (f, ms) => timers.push(setTimeout(f, ms));
    const box = document.createElement('div');
    box.id = 'hvSumReveal';
    box.innerHTML = `<div class="hsv-stage">
        <video class="hsv-clip" src="${A}summon.mp4" muted playsinline preload="auto"></video>
        <button class="hsv-skip" type="button">Bỏ qua ›</button>
        <div class="hsv-hint">Chạm thẻ để lật · chạm lần nữa xem tướng</div>
        <button class="hsv-btn" type="button">LẬT TẤT CẢ</button>
      </div>
      <div class="hsv-brush"><img src="${A}title-thien-menh.webp" alt="Thiên Mệnh Chiêu Hiền"></div>
      <div class="hsv-ticker"><span></span></div>`;
    document.body.append(box);
    const stage = box.querySelector('.hsv-stage');
    const clip = box.querySelector('.hsv-clip');
    const skip = box.querySelector('.hsv-skip');
    const btn = box.querySelector('.hsv-btn');
    const close = () => { timers.forEach(clearTimeout); box.remove(); };

    // hiem nhat nam tang tren
    const list = pulls.slice(0, 10).map((p, i) => ({ p, i, k: MAP[p.t] || 'w' }))
      .sort((a, b) => RANK[b.k] - RANK[a.k] || a.i - b.i);
    const cards = list.map((c, idx) => {
      const s = ORDER[idx] || ORDER[ORDER.length - 1];
      const el = document.createElement('div');
      el.className = 'hsv-slot wait r-' + c.k;
      el.dataset.k = c.k;
      el.dataset.hero = c.p.id;
      el.style.setProperty('--x', s.x + '%');
      el.style.setProperty('--b', s.b + '%');
      el.style.setProperty('--w', s.w + '%');
      const name = shortName(c.p.name);
      const src = portrait(c.p.id);
      const art = src
        ? `<img src="${esc(src)}" alt="" onerror="this.outerHTML='<b class=&quot;hsv-mono&quot;>${esc(name.charAt(0) || '?')}</b>'">`
        : `<b class="hsv-mono">${esc(name.charAt(0) || '?')}</b>`;
      el.innerHTML = `<button class="hsv-card" type="button" aria-label="${esc(name)}">
          <div class="hsv-face hsv-back"></div>
          <div class="hsv-face hsv-front"><div class="hsv-art">${art}</div><div class="hsv-frame"></div>
            <div class="hsv-name" style="font-size:${Math.max(5.6, Math.min(10, 80 / Math.max(1, [...name].length))).toFixed(1)}cqw">${esc(name)}</div></div>
          <b class="hsv-rk">${LABEL[c.k]}</b></button>`;
      const card = el.querySelector('.hsv-card');
      card.addEventListener('click', () => {
        if (!el.classList.contains('lit')) return;
        if (card.classList.contains('done')) openDetail(c.p.id, box);
        else { card.classList.add('done'); afterFlip(); }
      });
      stage.appendChild(el);
      return { el, card, k: c.k, name };
    });

    function afterFlip() {
      if (cards.every(c => c.card.classList.contains('done'))) { btn.textContent = 'TIẾP TỤC'; btn.onclick = close; }
    }

    function land(c) {
      c.el.classList.add('lit');
      c.card.dataset.glow = GLOW[c.k];
      try { window.HV_ENH_FX?.attach(c.el); } catch (_) {}
      if (c.k !== 'w') { stage.classList.remove('shake'); void stage.offsetWidth; stage.classList.add('shake'); }
      if (navigator.vibrate) navigator.vibrate(c.k === 'g' ? [40, 30, 80] : c.k === 'p' ? 25 : 8);
    }
    function fall(c, delay) {
      T(() => {
        c.el.classList.remove('wait');
        const rot = (Math.random() * 24 - 12).toFixed(1);
        const an = c.card.animate([
          { transform: `translateY(-120vh) rotate(${rot}deg)`, opacity: .9 },
          { transform: 'translateY(5%) rotate(0deg)', opacity: 1, offset: .8 },
          { transform: 'translateY(-3%)', offset: .9 },
          { transform: 'translateY(0)' }
        ], { duration: c.k === 'g' ? 900 : 640, easing: 'cubic-bezier(.55,0,.85,.6)' });
        an.onfinish = () => land(c);
      }, delay);
    }
    function runTicker() {
      const ssr = cards.filter(c => c.k === 'g').map(c => esc(c.name));
      const tk = box.querySelector('.hsv-ticker');
      if (!ssr.length) return;
      const span = tk.querySelector('span');
      span.innerHTML = ssr.length === 1 ? TICK1[Math.floor(Math.random() * TICK1.length)](ssr[0]) : ssr.length === 2 ? TICK2(ssr[0], ssr[1]) : TICK3(ssr);
      tk.classList.add('on');
      const w = span.scrollWidth + box.clientWidth;
      const an = span.animate([{ transform: 'translateX(0)' }, { transform: `translateX(-${w}px)` }],
        { duration: w / 75 * 1000, iterations: 2, easing: 'linear' });
      an.onfinish = () => tk.classList.remove('on');
    }
    function dropAll() {
      // roi tu tang duoi len tang tren; the SSR luon roi cuoi
      const seq = [...cards].reverse().sort((a, b) => (a.k === 'g') - (b.k === 'g'));
      let t = 0;
      seq.forEach(c => { if (c.k === 'g') t += 450; fall(c, t); t += c.k === 'g' ? 700 : 220; });
      T(() => { box.querySelector('.hsv-brush').classList.add('on'); btn.classList.add('on'); box.querySelector('.hsv-hint').classList.add('on'); }, t + 900);
      T(runTicker, t + 1500);
    }
    let started = false;
    function toCards() {
      if (started) return; started = true;
      try { clip.pause(); } catch (_) {}
      clip.classList.remove('on'); skip.classList.remove('on');
      T(dropAll, 250);
    }
    btn.onclick = () => {
      cards.filter(c => c.el.classList.contains('lit') && !c.card.classList.contains('done'))
        .sort((a, b) => RANK[a.k] - RANK[b.k])
        .forEach((c, i) => T(() => { c.card.classList.add('done'); afterFlip(); }, i * 140));
    };
    skip.addEventListener('click', toCards);
    clip.addEventListener('ended', toCards);
    clip.addEventListener('error', toCards);
    clip.classList.add('on'); skip.classList.add('on');
    const pr = clip.play(); if (pr && pr.catch) pr.catch(() => toCards());
    T(toCards, 5000);
  }

  window.HV_SUMMON_REVEAL = { play };
})();
