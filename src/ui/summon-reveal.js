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
    const h = typeof DATA === 'object' && DATA.heroes ? DATA.heroes[id] : null;
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
        <div class="hsv-hint">Chạm thẻ để lật · chạm lần nữa xem tướng</div>
        <button class="hsv-btn" type="button">LẬT TẤT CẢ</button>
      </div>
      <div class="hsv-brush"><img src="${A}title-thien-menh.webp" alt="Thiên Mệnh Chiêu Hiền"></div>
      <div class="hsv-ticker"><span></span></div>`;
    document.body.append(box);
    const stage = box.querySelector('.hsv-stage');
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
        else { card.classList.add('done'); if (c.k === 'g') showcase([cards.find(x => x.card === card)]); afterFlip(); }
      });
      stage.appendChild(el);
      return { el, card, k: c.k, name, id: c.p.id, full: c.p.name };
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
    btn.onclick = () => {
      const todo = cards.filter(c => c.el.classList.contains('lit') && !c.card.classList.contains('done'))
        .sort((a, b) => RANK[a.k] - RANK[b.k]);
      todo.forEach((c, i) => T(() => { c.card.classList.add('done'); afterFlip(); }, i * 140));
      const ssr = todo.filter(c => c.k === 'g');
      if (ssr.length) T(() => showcase(ssr), todo.length * 140 + 450);
    };

    // Man show tuong SSR (giong game tham khao): nen toi + tia sang, tranh tuong lon, ten thu phap, nhan SSR.
    function showcase(list) {
      const q = list.filter(Boolean);
      const EL = { 'Hỏa': ['hoa', 'Hỏa'], 'Thủy': ['thuy', 'Thủy'], 'Thổ': ['tho', 'Thổ'], 'Kim': ['kim', 'Kim'], 'Mộc': ['moc', 'Mộc'] };
      const RV = 'assets/ui/hero-detail/reference-v3/';
      const bgNow = () => (window.HV_SSR_BG = window.HV_SSR_BG || (new URLSearchParams(location.search).get('ssrbg') === '4' ? '4' : '1'));
      const next = () => {
        const c = q.shift();
        if (!c) return;
        const h = typeof DATA === 'object' && DATA.heroes ? DATA.heroes[c.id] : null;
        const prof = (globalThis.HV_VC_HERO_PROFILES || {})[c.id] || {};
        const role = String((h && h.role) || '');
        const title = String(c.full || '').split(/\s+[—–-]\s+/)[1] || (role.includes('/') ? role : (prof && prof.job) || role) || 'Kỳ hiệp Mộng Giới';
        const skName = k => { const o = h && h[k === 'basic' ? 'skill' : k]; return o && (o.nm || o.name || o.n || o.title) || ''; };
        const heNm = h && typeof HE === 'object' && HE[h.he] ? HE[h.he].nm : '';
        const el = Object.entries(EL).find(([k]) => k.normalize('NFC') === String(heNm).normalize('NFC'))?.[1] || null;
        const art = prof.skillIcons === 'reference-v3'
          ? { basic: RV + 'basic.png', ultimate: RV + 'ultimate.png', passive: RV + 'passive.png' }
          : (prof.skillIcons || null);
        const SK = [['basic', 'Đánh thường'], ['ultimate', 'Tuyệt kỹ'], ['passive', 'Nội tại']];
        const src = portrait(c.id);
        const sc = document.createElement('div');
        sc.className = 'hsv-show bg-' + bgNow();
        sc.innerHTML = `<div class="hsv-sbg"></div><div class="hsv-glow"></div>
          ${src ? `<img class="hsv-hero" src="${esc(src)}" alt="">` : `<b class="hsv-hero hsv-hero-mono">${esc(c.name.charAt(0))}</b>`}
          <span class="hsv-badge">SSR</span>
          <button class="hsv-bgsw" type="button">Nền: ${bgNow() === '1' ? 'Thủy mặc' : 'Đình làng'} ⇄</button>
          <div class="hsv-plate">
            <div class="hsv-id">
              ${el ? `<span class="hsv-el"><img src="${RV}element-${el[0]}.png" alt=""><em>${esc(el[1])}</em></span>` : ''}
              <div class="hsv-nm"><h3>${esc(c.name)}</h3><p>${esc(title)}</p></div>
            </div>
            <div class="hsv-skills">${SK.map(([k, lb]) => `<span class="hsv-sk">${art && art[k] ? `<img src="${esc(art[k])}" alt="">` : `<b>${lb.charAt(0)}</b>`}<em>${esc(skName(k) || lb)}</em><i>${lb}</i></span>`).join('')}</div>
          </div>
          <div class="hsv-tap">Chạm để tiếp tục</div>`;
        box.append(sc);
        sc.querySelector('.hsv-bgsw').addEventListener('click', ev => {
          ev.stopPropagation();
          window.HV_SSR_BG = bgNow() === '1' ? '4' : '1';
          sc.className = 'hsv-show bg-' + window.HV_SSR_BG;
          ev.currentTarget.textContent = 'Nền: ' + (window.HV_SSR_BG === '1' ? 'Thủy mặc' : 'Đình làng') + ' ⇄';
        });
        if (navigator.vibrate) navigator.vibrate([40, 30, 90]);
        let ok = false;
        T(() => { ok = true; }, 700);
        sc.addEventListener('click', () => {
          if (!ok) return;
          sc.classList.add('out');
          setTimeout(() => { sc.remove(); next(); }, 260);
        });
      };
      next();
    }
    box.style.display = 'none';
    const best = cards.some(c => c.k === 'g') ? 'g' : cards.some(c => c.k === 'p') ? 'p' : 'w';
    const altar = window.HV_SUMMON_ALTAR;
    try { altar?.mount(); } catch (_) {}
    const go = () => { box.style.display = ''; T(dropAll, 120); };
    if (altar && altar.charge) altar.charge(best).then(go, go); else go();
  }

  window.HV_SUMMON_REVEAL = { play };
})();
