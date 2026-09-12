(() => {
  if (typeof document === 'undefined' || !document.body) return;

  const BETS = [2, 10, 50];
  const PAY = {
    gold: [0, 180, 480, 1200, 3600, 10000, 36000],
    gems: [0, 3, 8, 18, 48, 120, 400],
    so: [0, 2, 5, 12, 30, 80, 250],
    tinh: [0, 6, 14, 32, 80, 200, 560],
    hoat: [0, 6, 14, 32, 80, 200, 560],
    sh_ss: [0, 2, 4, 8, 18, 40, 90],
    sh_ssr: [0, 1, 2, 5, 12, 28, 70],
    stam: [0, 4, 10, 20, 40, 80, 160],
    chest: [0, 1, 1, 1, 1, 2, 3],
    supreme: [0, 1, 1, 1, 2, 2, 3]
  };
  const BOARD = (typeof BBR_BOARD !== 'undefined') ? BBR_BOARD : [
    { t: 'gold', n: 1 }, { t: 'gold', n: 2 }, { t: 'gold', n: 3 },
    { t: 'gems', n: 1 }, { t: 'gems', n: 2 }, { t: 'gems', n: 3 },
    { t: 'so', n: 1 }, { t: 'so', n: 2 },
    { t: 'tinh', n: 1 }, { t: 'tinh', n: 2 }, { t: 'tinh', n: 3 },
    { t: 'hoat', n: 1 }, { t: 'hoat', n: 2 }, { t: 'hoat', n: 3 },
    { t: 'sh_ss', n: 1 }, { t: 'sh_ss', n: 2 },
    { t: 'sh_ssr', n: 1 }, { t: 'sh_ssr', n: 2 },
    { t: 'chest', n: 1 }, { t: 'chest', n: 2 },
    { t: 'supreme', n: 1 }, { t: 'gold', n: 1 },
    { t: 'gems', n: 1 }, { t: 'tinh', n: 1 }
  ];
  const LAB = {
    gold: 'Vàng', gems: 'Ngọc', so: 'Sò', tinh: 'Tinh', hoat: 'Hoạt',
    sh_ss: 'Mảnh S', sh_ssr: 'Mảnh S+', chest: 'Rương', supreme: 'Chí Bảo'
  };
  const GLYPH = {
    gold: '🪙', gems: '💎', so: 'sò', tinh: '⚗', hoat: '🔥',
    sh_ss: '🧩', sh_ssr: '🌟', chest: '🎁', supreme: '👑'
  };
  const SHOP = [
    { id: 'ss8', pts: 100, sh_ss: 8, name: '8 mảnh S' },
    { id: 'ssr12', pts: 250, sh_ssr: 12, name: '12 mảnh S+' },
    { id: 'chest', pts: 400, chest: 1, name: 'Rương Báu' },
    { id: 'gems40', pts: 800, gems: 40, name: '40 Ngọc' },
    { id: 'supreme', pts: 1500, supreme: 1, name: 'Rương Chí Bảo' },
    { id: 'ssr40', pts: 3000, sh_ssr: 40, name: '40 mảnh S+' }
  ];
  const UNLOCK_AT = { b: 10, a: 20, s: 30, ss: 50, ssr: 50 };
  const SO_IC = '<img class="hv-so-ic" src="assets/ui/festival/so-icon.jpg" alt="sò">';

  function st() {
    P.bachBao = P.bachBao || {};
    const b = P.bachBao;
    if (!BETS.includes(b.bet)) b.bet = 2;
    b.pts = b.pts || 0;
    b.pool = b.pool || 12000;
    b.crafted = b.crafted || 0;
    b.supPity = b.supPity || 0;
    return b;
  }

  function pay(type, stars, bet) {
    const row = PAY[type] || PAY.gold;
    return Math.round((row[stars] || 0) * ((bet || 2) / 2));
  }

  function cellFace(c) {
    const g = GLYPH[c.t] || '•';
    if (c.t === 'so') return Array.from({ length: c.n }, () => SO_IC).join('');
    return Array.from({ length: c.n }, () => '<span>' + g + '</span>').join('');
  }

  if (typeof giveHeroShards === 'function') {
    const prevGive = giveHeroShards;
    giveHeroShards = function giveHeroShardsUnlock(rar, n) {
      const msg = prevGive(rar, n);
      return String(msg || '').replace(/SSR/g, 'S+').replace(/\bSS\b/g, 'S');
    };
  }

  function applyGrant(type, n) {
    if (!n) return;
    if (type === 'gold') P.gold += n;
    else if (type === 'gems') P.gems += n;
    else if (type === 'so') P.so += n;
    else if (type === 'tinh') P.tinh = (P.tinh || 0) + n;
    else if (type === 'hoat') P.hoat = (P.hoat || 0) + n;
    else if (type === 'sh_ss') giveHeroShards?.('ss', n);
    else if (type === 'sh_ssr') giveHeroShards?.('ssr', n);
    else if (type === 'chest') st().chests = (st().chests || 0) + n;
    else if (type === 'supreme') st().supreme = (st().supreme || 0) + n;
  }

  function doStep() {
    const b = st();
    const bet = b.bet || 2;
    if ((P.so || 0) < bet) { toast?.('Không đủ sò. Cược ' + bet + '.'); return null; }
    P.so -= bet;
    const idx = Math.floor(Math.random() * BOARD.length);
    const cell = BOARD[idx];
    const same = !!(b.pending && b.pending.t === cell.t);
    const stars = same ? Math.min(6, b.pending.stars + cell.n) : cell.n;
    b.pending = { t: cell.t, stars, n: cell.n };
    b.stars = stars;
    b.lastType = cell.t;
    b.spins = (b.spins || 0) + 1;
    b.pool = (b.pool || 12000) + bet;
    persist?.();
    refreshResbar?.();
    questProgress?.('spin', 1);
    return { idx, cell, same, stars };
  }

  function doTake() {
    const b = st();
    if (!b.pending) { toast?.('Quay rồi hãy nhận.'); return null; }
    const { t, stars } = b.pending;
    const n = pay(t, stars, b.bet || 2);
    applyGrant(t, n);
    if (stars >= 6 && t === 'gold') {
      const jack = Math.floor(b.pool * 0.2);
      P.gold += jack;
      b.pool = Math.max(0, b.pool - jack);
    }
    if (stars >= 3) b.pts = (b.pts || 0) + Math.max(1, pay('so', stars, b.bet || 2));
    const msg = stars + '★ ' + (LAB[t] || t) + ' · +' + n;
    b.history = b.history || [];
    b.history.unshift({ kind: 'take', label: msg, t: Date.now() });
    b.pending = null;
    persist?.();
    refreshResbar?.();
    toast?.('🎡 ' + msg);
    return { msg, t, stars, n };
  }

  function openSupreme() {
    const b = st();
    if ((b.supreme || 0) < 1) { toast?.('Chưa có Rương Chí Bảo.'); return { ok: false }; }
    b.supreme--;
    b.opened = (b.opened || 0) + 1;
    b.supPity = (b.supPity || 0) + 1;
    let r = Math.random() * 100;
    if (b.supPity >= 8) { r = 99; b.supPity = 0; }
    let msg = '', ic = '👑';
    if (r < 50) {
      msg = typeof giveHeroShards === 'function' ? giveHeroShards('ssr', 80) : '80 mảnh S+';
      ic = '🌟';
    } else if (r < 72) {
      msg = typeof grantExtremeEquipment === 'function' ? grantExtremeEquipment(12) : 'S+ +12';
      ic = '⚔️';
    } else if (r < 87) {
      P.gems = (P.gems || 0) + 150;
      giveHeroShards?.('ssr', 20);
      msg = '💎150 + 20 mảnh S+';
      ic = '💎';
    } else if (r < 95) {
      msg = typeof grantExtremeEquipment === 'function' ? grantExtremeEquipment(15) : 'S+ +15';
      ic = '🗡️';
    } else {
      b.supPity = 0;
      P.gems = (P.gems || 0) + 200;
      msg = (typeof giveHeroShards === 'function' ? giveHeroShards('ssr', 60) : '60 mảnh S+') + ' + 💎200';
      ic = '👑';
    }
    b.history = b.history || [];
    b.history.unshift({ kind: 'open', label: 'Chí Bảo: ' + msg, t: Date.now() });
    persist?.();
    refreshResbar?.();
    toast?.('👑 ' + msg);
    paintDesk();
    return { ok: true, msg, ic, kind: 'supreme' };
  }

  if (typeof spinBachBaoCore === 'function') {
    spinBachBaoCore = function spinBachBaoRuongCore() {
      const step = doStep();
      if (!step) return { ok: false, msg: 'Không đủ sò.' };
      return { ok: true, idx: step.idx, msg: step.stars + '★', z: { l: LAB[step.cell.t], t: step.cell.t }, stars: step.stars };
    };
  }
  spinBachBaoAnimated = function () { doStep(); paintDesk(); };
  if (typeof openBachBaoChest === 'function') {
    const prevOpen = openBachBaoChest;
    openBachBaoChest = function openBachBaoChestRare(kind) {
      if (kind === 'supreme') return openSupreme();
      return prevOpen(kind);
    };
  }

  function starTable(type, bet, on) {
    const row = PAY[type] || PAY.gold;
    return [1, 2, 3, 4, 5, 6].map(s => {
      const cls = on === s ? ' is-on' : '';
      return '<li class="hv-bbr-star' + cls + '">' + '★'.repeat(s) + ' · ' + row[s] * (bet / 2) + '</li>';
    }).join('');
  }

  function paintDesk() {
    const shell = document.querySelector('#hvFestivalRoot .hv-fest-wheel-shell, #festivalBody .bbw-wrap');
    if (!shell) return;
    const b = st();
    const bet = b.bet || 2;
    const pend = b.pending;
    const type = pend ? pend.t : 'gold';
    shell.innerHTML = `<div id="hvBbrDesk" class="hv-bbr-kt">
      <div class="hv-bbr-kt-head">
        <h3>Bách Bảo Rương</h3>
        <div class="hv-bbr-row"><b>${SO_IC} ${P.so || 0}</b><span>Hũ ${b.pool}</span><span>Điểm ${b.pts || 0}</span>
          <span>🎁 ${b.chests || 0}</span><span>👑 ${b.supreme || 0}</span></div>
      </div>
      <div class="hv-bbr-kt-body">
        <div class="hv-bbr-grid" data-bbr-grid>${BOARD.map((c, i) =>
          `<button type="button" class="hv-bbr-cell${pend && pend.t === c.t && pend.n === c.n ? ' is-hot' : ''}" data-bbr-cell="${i}" disabled>
            <i>${cellFace(c)}</i><small>${c.n} ${LAB[c.t]}</small>
          </button>`
        ).join('')}</div>
        <div class="hv-bbr-side">
          <div class="hv-bbr-bets">${BETS.map(n =>
            `<button type="button" class="hv-bbr-bet${bet === n ? ' is-on' : ''}" data-bbr-bet="${n}">${n} ${SO_IC}</button>`
          ).join('')}</div>
          <p class="hv-bbr-now">${pend ? (pend.stars + '★ ' + LAB[pend.t] + ' · Tiếp cộng cục cùng loại') : 'Quay — trúng 2 cục rồi Tiếp trúng 3 = 5★'}</p>
          <ul class="hv-bbr-stars">${starTable(type, bet, pend && pend.stars)}</ul>
          <div class="hv-bbr-actions">
            <button type="button" data-bbr-step ${((P.so || 0) < bet) ? 'disabled' : ''}>${pend ? 'Tiếp' : 'Quay'} · ${bet} ${SO_IC}</button>
            <button type="button" data-bbr-take ${pend ? '' : 'disabled'}>Thưởng</button>
          </div>
          <button type="button" data-bbr-craft>Chế 10 ${SO_IC} · 25⚗+25🔥 (${b.crafted || 0}/2)</button>
          <div class="hv-bbr-shop">${SHOP.map(it =>
            `<button type="button" data-bbr-buy="${it.id}">${it.name} · ${it.pts}đ</button>`
          ).join('')}</div>
          <p class="hv-bbr-note">Cục cộng sao. Loại khác = mất chuỗi. Tinh/Hoạt → sò → rương → đồ/mảnh → lực chiến.</p>
        </div>
      </div>
    </div>`;
    const title = document.querySelector('[data-fest-title], .hv-fest-title');
    if (title) title.textContent = 'Hoa Đăng Lục Châu';
    const kicker = document.querySelector('.hv-fest-kicker');
    if (kicker) kicker.textContent = 'Hoa đăng · Bách Bảo Rương';
    document.querySelectorAll('[data-fest-so]').forEach(el => {
      el.innerHTML = SO_IC + ' ' + (P.so || 0);
    });
    const spin = document.querySelector('[data-fest-spin], #bbwSpin');
    if (spin) spin.style.display = 'none';
  }

  function onDesk(ev) {
    const bet = ev.target.closest('[data-bbr-bet]');
    if (bet) {
      st().bet = Number(bet.getAttribute('data-bbr-bet')) || 2;
      persist?.();
      paintDesk();
      return;
    }
    if (ev.target.closest('[data-bbr-step]')) {
      const r = doStep();
      if (r) toast?.(r.same ? ('Cộng ' + r.cell.n + ' → ' + r.stars + '★ ' + LAB[r.cell.t]) : (r.stars + '★ ' + LAB[r.cell.t]));
      paintDesk();
      return;
    }
    if (ev.target.closest('[data-bbr-take]')) {
      doTake();
      paintDesk();
      return;
    }
    if (ev.target.closest('[data-bbr-craft]')) {
      const b = st();
      const day = typeof today === 'function' ? today() : 0;
      if (b.craftDay !== day) { b.crafted = 0; b.craftDay = day; }
      if (b.crafted >= 2) { toast?.('Hôm nay đã chế đủ sò.'); return; }
      if ((P.tinh || 0) < 25 || (P.hoat || 0) < 25) {
        toast?.('Cần 25 Tinh + 25 Hoạt. Mua Bình/Lò ở Chợ.');
        return;
      }
      P.tinh -= 25; P.hoat -= 25; P.so = (P.so || 0) + 10; b.crafted++;
      persist?.(); refreshResbar?.(); toast?.('Chế 10 sò.');
      paintDesk();
      return;
    }
    const buy = ev.target.closest('[data-bbr-buy]');
    if (buy) {
      const it = SHOP.find(x => x.id === buy.getAttribute('data-bbr-buy'));
      if (!it) return;
      const b = st();
      if ((b.pts || 0) < it.pts) { toast?.('Thiếu điểm.'); return; }
      b.pts -= it.pts;
      if (it.gems) P.gems += it.gems;
      if (it.chest) b.chests = (b.chests || 0) + it.chest;
      if (it.supreme) b.supreme = (b.supreme || 0) + it.supreme;
      if (it.sh_ss) giveHeroShards?.('ss', it.sh_ss);
      if (it.sh_ssr) giveHeroShards?.('ssr', it.sh_ssr);
      persist?.(); refreshResbar?.(); toast?.('Đổi ' + it.name);
      paintDesk();
    }
  }

  function bindCapture(root) {
    if (!root || root.dataset.bbrCap === '1') return;
    root.dataset.bbrCap = '1';
    root.addEventListener('click', ev => {
      if (ev.target.closest('#hvBbrDesk')) {
        ev.preventDefault();
        ev.stopImmediatePropagation();
        onDesk(ev);
        return;
      }
      if (ev.target.closest('[data-fest-spin], #bbwSpin')) {
        ev.preventDefault();
        ev.stopImmediatePropagation();
        doStep();
        paintDesk();
        return;
      }
      if (ev.target.closest('[data-fest-open-supreme], #bbwOpenSupreme')) {
        ev.preventDefault();
        ev.stopImmediatePropagation();
        openSupreme();
      }
    }, true);
  }

  if (typeof renderFestival === 'function') {
    const base = renderFestival;
    renderFestival = function renderFestivalWithBbr() {
      base.apply(this, arguments);
      bindCapture(document.getElementById('hvFestivalRoot'));
      bindCapture(document.getElementById('festivalBody'));
      paintDesk();
    };
  }

  bindCapture(document.getElementById('hvFestivalRoot'));
  bindCapture(document.getElementById('festivalBody'));
  paintDesk();
})();
