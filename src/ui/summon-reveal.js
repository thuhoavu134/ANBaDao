/* Owner 2026-11-04: man ket qua trieu hoi - the roi xuong 3 tang theo tu chat,
   hieu ung cuong hoa ben trong the, lat the de xem tuong. */
(() => {
  if (typeof document === 'undefined') return;
  const TIERS = [
    { cls: 'g', ys: 3, h: 29 },   // SSR - tren cung, to nhat
    { cls: 'p', ys: 35, h: 21 },  // SS
    { cls: 'w', ys: 58, h: 38 }   // S: 2 hang
  ];
  const MAP = { ssr: 'g', ss: 'p', s: 'w', a: 'w', b: 'w' };
  const LABEL = { g: 'SSR', p: 'SS', w: 'S' };
  const GLOW = { g: 'red', p: 'gold', w: 'purple' };
  const RANK = { g: 3, p: 2, w: 1 };

  function shortName(name) {
    const s = String(name || '').trim();
    const cut = s.split(/\s+[—–-]\s+/)[0];
    return (cut || s).trim();
  }

  function portrait(id) {
    // dung dung chuoi art cua man role: portraitSrc(card/master) roi characterAsset
    try {
      if (typeof portraitSrc === 'function') {
        const p = portraitSrc(id, 'card') || portraitSrc(id, 'master') || portraitSrc(id, 'avatar');
        if (p) return String(p);
      }
    } catch (_) {}
    try {
      if (typeof characterAsset === 'function') {
        const a = characterAsset(id, 'card') || characterAsset(id, 'avatar') || characterAsset(id, 'icon') || characterAsset(id, 'idle');
        if (a) return String(a);
      }
    } catch (_) {}
    const h = (window.DATA && DATA.heroes) ? DATA.heroes[id] : null;
    const src = h && (h.img || h.portrait || h.art);
    return src ? String(src) : '';
  }

  function heroCol(id, fallback) {
    const h = (window.DATA && DATA.heroes) ? DATA.heroes[id] : null;
    return (h && h.col) ? String(h.col) : (fallback || '#6e573d');
  }

  function openDetail(id) {
    try {
      document.getElementById('hvSumReveal')?.remove();
      if (typeof renderHeroDetail === 'function') renderHeroDetail(id);
      if (typeof showScreen === 'function') showScreen('heroDetail');
    } catch (_) {}
  }

  function play(pulls, grid) {
    const host = document.getElementById('summonBody') || grid.parentElement;
    if (!host || !Array.isArray(pulls) || !pulls.length) return;
    document.getElementById('hvSumReveal')?.remove();
    const box = document.createElement('div');
    box.id = 'hvSumReveal';
    box.innerHTML = '<div class="hsr-veil"></div><div class="hsr-stage"></div>';
    // gan vao body: tranh bi scale/transform cua khung game lam lech toa do
    document.body.append(box);
    const stage = box.querySelector('.hsr-stage');
    box.querySelector('.hsr-veil')?.addEventListener('click', () => box.remove());
    const cards = pulls.map((p, i) => {
      const k = MAP[p.t] || 'w';
      const el = document.createElement('div');
      el.className = 'hsr-slot r-' + k;
      el.dataset.k = k;
      el.innerHTML = `<div class="hsr-card"><div class="hsr-inner">
          <div class="hsr-face hsr-back"><b>${LABEL[k]}</b></div>
          <div class="hsr-face hsr-front">${portrait(p.id)
            ? `<img src="${portrait(p.id)}" alt="" loading="lazy" onerror="this.remove()">`
            : `<span class="hsr-mono" style="--mono-col:${heroCol(p.id)}">${(String(p.name || '?').trim().charAt(0) || '?').toUpperCase()}</span>`}
            <i class="hsr-name" title="${(p.name || '').replace(/"/g, '&quot;')}">${shortName(p.name)}</i><u class="hsr-rk">${LABEL[k]}</u></div>
        </div></div>`;
      el.querySelector('.hsr-card').addEventListener('click', () => {
        // chua lat thi lat; lat roi thi mo man chi tiet tuong (man role)
        if (el.classList.contains('flipped')) openDetail(p.id); else flip(el);
      });
      stage.appendChild(el);
      return { el, k, i };
    });
    // xep 3 tang: hiem nhat len tren
    const sorted = [...cards].sort((a, b) => RANK[b.k] - RANK[a.k] || a.i - b.i);
    const rows = { g: [], p: [], w: [] };
    sorted.forEach(c => rows[c.k].push(c));
    const order = [];
    ['w', 'p', 'g'].forEach(k => {
      const tier = TIERS.find(t => t.cls === k);
      const list = rows[k];
      const perRow = Math.min(list.length, 4) || 1;
      const rowCount = Math.max(1, Math.ceil(list.length / perRow));
      const rowH = tier.h / rowCount;
      list.forEach((c, idx) => {
        const row = Math.floor(idx / perRow);
        const col = idx % perRow;
        const inRow = Math.min(perRow, list.length - row * perRow);
        const w = Math.min(rowH * 1.11, 92 / (inRow * 1.06));
        const step = w * 1.06;
        const left = 50 + (col - (inRow - 1) / 2) * step;
        Object.assign(c.el.style, {
          top: (tier.ys + rowH * row) + '%',
          left: left + '%',
          width: w + '%',
          height: (rowH * 0.94) + '%'
        });
        order.push(c);
      });
    });
    // roi lan luot: tang duoi -> tang tren, SSR roi cuoi
    let t = 120;
    order.forEach(c => {
      const drop = c.k === 'g' ? 780 : 620;
      setTimeout(() => {
        c.el.classList.add('fall');
        c.el.animate([
          { transform: 'translate(-50%,-160%) rotate(' + (Math.random() * 16 - 8).toFixed(1) + 'deg)', opacity: .85 },
          { transform: 'translate(-50%,4%)', opacity: 1, offset: .82 },
          { transform: 'translate(-50%,-3%)', offset: .92 },
          { transform: 'translate(-50%,0)' }
        ], { duration: drop, easing: 'cubic-bezier(.55,0,.85,.6)' }).onfinish = () => {
          c.el.classList.add('lit');
          const card = c.el.querySelector('.hsr-card');
          card.dataset.glow = GLOW[c.k];
          try { window.HV_ENH_FX?.attach(c.el); } catch (_) {}
          if (c.k !== 'w') {
            const sc = document.getElementById('summonScreen');
            if (sc) { sc.classList.remove('hsr-shake'); void sc.offsetWidth; sc.classList.add('hsr-shake'); }
            if (navigator.vibrate) navigator.vibrate(c.k === 'g' ? [30, 20, 60] : 15);
          }
        };
      }, t);
      t += c.k === 'g' ? 620 : 190;
    });
    setTimeout(() => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'hsr-all';
      btn.textContent = 'LẬT TẤT CẢ';
      btn.onclick = () => {
        cards.filter(c => !c.el.classList.contains('flipped'))
          .sort((a, b) => RANK[a.k] - RANK[b.k]).forEach((c, i) => setTimeout(() => flip(c), i * 140));
        setTimeout(() => {
          btn.textContent = 'TIẾP TỤC';
          btn.onclick = () => box.remove();
        }, cards.length * 140 + 700);
      };
      stage.append(btn);
    }, t + 400);
  }

  function flip(c) {
    if (c.el.classList.contains('flipped')) return;
    c.el.classList.add('flipped');
    try { window.HV_SFX?.flip?.(c.k); } catch (_) {}
  }

  window.HV_SUMMON_REVEAL = { play };
})();
