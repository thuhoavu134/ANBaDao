/* Owner 2026-11-04: man ket qua trieu hoi - the roi xuong 3 tang theo tu chat,
   hieu ung cuong hoa ben trong the, lat the de xem tuong. */
(() => {
  if (typeof document === 'undefined') return;
  const TIERS = [
    { cls: 'g', ys: 6, h: 31 },   // SSR - tren cung
    { cls: 'p', ys: 40, h: 27 },  // SR
    { cls: 'w', ys: 70, h: 24 }   // S va thap hon
  ];
  const MAP = { ssr: 'g', ss: 'p', s: 'p', a: 'w', b: 'w' };
  const LABEL = { g: 'SSR', p: 'SR', w: 'S' };
  const GLOW = { g: 'red', p: 'gold', w: 'purple' };
  const RANK = { g: 3, p: 2, w: 1 };

  function portrait(id) {
    const h = (window.DATA && DATA.heroes) ? DATA.heroes[id] : null;
    const src = h && (h.img || h.portrait || h.art);
    return src ? String(src) : '';
  }

  function play(pulls, grid) {
    const host = document.getElementById('summonBody') || grid.parentElement;
    if (!host || !Array.isArray(pulls) || !pulls.length) return;
    document.getElementById('hvSumReveal')?.remove();
    const box = document.createElement('div');
    box.id = 'hvSumReveal';
    box.innerHTML = '<div class="hsr-veil"></div><div class="hsr-stage"></div>';
    host.append(box);
    const stage = box.querySelector('.hsr-stage');
    const cards = pulls.map((p, i) => {
      const k = MAP[p.t] || 'w';
      const el = document.createElement('div');
      el.className = 'hsr-slot r-' + k;
      el.dataset.k = k;
      el.innerHTML = `<div class="hsr-card"><div class="hsr-inner">
          <div class="hsr-face hsr-back"><b>${LABEL[k]}</b></div>
          <div class="hsr-face hsr-front">${portrait(p.id) ? `<img src="${portrait(p.id)}" alt="">` : ''}
            <i class="hsr-name">${p.name || ''}</i><u class="hsr-rk">${LABEL[k]}</u></div>
        </div></div>`;
      el.querySelector('.hsr-card').addEventListener('click', () => flip(el));
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
      list.forEach((c, idx) => {
        const w = Math.min(tier.h * 0.72, 92 / Math.max(list.length, 1));
        const left = list.length === 1 ? 50 : 6 + (88 / (list.length - 1)) * idx;
        Object.assign(c.el.style, { top: tier.ys + '%', left: left + '%', width: w + '%', height: tier.h + '%' });
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
      btn.onclick = () => cards.filter(c => !c.el.classList.contains('flipped'))
        .sort((a, b) => RANK[a.k] - RANK[b.k]).forEach((c, i) => setTimeout(() => flip(c), i * 140));
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
