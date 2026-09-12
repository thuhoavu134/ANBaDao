(() => {
  if (typeof document === 'undefined' || !document.body) return;

  const BETS = [2, 10, 50];
  const STAR_W = [0, 40, 26, 18, 10, 5, 1];
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
  const TYPE_L = {
    gold: 'Vàng', gems: 'Ngọc', so: 'Sò', tinh: 'Tinh', hoat: 'Hoạt',
    stam: 'Tỉnh', sh_ss: 'Mảnh S', sh_ssr: 'Mảnh S+', chest: 'Rương Báu', supreme: 'Chí Bảo'
  };
  const UNLOCK_AT = { b: 10, a: 20, s: 30, ss: 50, ssr: 50 };
  const SO_IC = '<img class="hv-so-ic" src="assets/ui/festival/so-icon.jpg" alt="sò">';

  function rarLabel(rar) {
    if (rar === 'ssr' || rar === 'ss') return 'S+';
    if (rar === 's') return 'S';
    if (rar === 'a') return 'A';
    return 'B';
  }
  const SHOP = [
    { id: 'ss8', pts: 100, sh_ss: 8, name: '8 mảnh S' },
    { id: 'ssr12', pts: 250, sh_ssr: 12, name: '12 mảnh S+' },
    { id: 'chest', pts: 400, chest: 1, name: 'Rương Báu' },
    { id: 'gems40', pts: 800, gems: 40, name: '40 Ngọc' },
    { id: 'supreme', pts: 1500, supreme: 1, name: 'Rương Chí Bảo' },
    { id: 'ssr40', pts: 3000, sh_ssr: 40, name: '40 mảnh S+' }
  ];

  function st() {
    P.bachBao = P.bachBao || {};
    const b = P.bachBao;
    if (!BETS.includes(b.bet)) b.bet = 2;
    b.pts = b.pts || 0;
    b.pool = b.pool || 12000;
    b.streak = b.streak || 0;
    b.crafted = b.crafted || 0;
    b.supPity = b.supPity || 0;
    return b;
  }

  if (typeof giveHeroShards === 'function') {
    giveHeroShards = function giveHeroShardsUnlock(rar, n) {
      const pool = typeof rareHeroPool === 'function' ? rareHeroPool(rar) : [];
      const id = (pool.length && typeof randOf === 'function')
        ? randOf(pool)
        : (DATA && DATA.heroes ? Object.keys(DATA.heroes)[0] : null);
      if (!id) return n + ' mảnh ' + rarLabel(rar);
      P.shards = P.shards || {};
      P.shards[id] = (P.shards[id] || 0) + n;
      let extra = '';
      const need = UNLOCK_AT[rar] || 30;
      if (P.heroes && P.heroes[id] && !P.heroes[id].owned && P.shards[id] >= need) {
        P.heroes[id].owned = true;
        P.shards[id] -= need;
        extra = ' · mở tướng';
      }
      return n + ' mảnh ' + (DATA.heroes[id].name) + ' (' + rarLabel(rar) + ')' + extra;
    };
  }

  function slots() {
    if (typeof BACH_BAO === 'object' && Array.isArray(BACH_BAO.slots)) return BACH_BAO.slots;
    if (typeof BACH_BAO_SLOTS !== 'undefined') return BACH_BAO_SLOTS;
    return [];
  }

  function rollStars(same) {
    const r = Math.random() * 100;
    let acc = 0, s = 1;
    for (let i = 1; i <= 6; i++) { acc += STAR_W[i]; if (r < acc) { s = i; break; } }
    return same ? Math.min(6, s + 1) : s;
  }

  function qty(type, stars, bet) {
    const row = PAY[type] || PAY.gold;
    return Math.round((row[stars] || 0) * (bet / 2));
  }

  function applyGrant(type, n) {
    if (!n) return;
    if (type === 'gold') P.gold += n;
    else if (type === 'gems') P.gems += n;
    else if (type === 'so') P.so += n;
    else if (type === 'tinh') P.tinh = (P.tinh || 0) + n;
    else if (type === 'hoat') P.hoat = (P.hoat || 0) + n;
    else if (type === 'stam' && typeof refreshStamina === 'function') {
      refreshStamina();
      P.stamina = Math.min(DATA.daily.stamCap, P.stamina + n);
    } else if (type === 'sh_ss' && typeof giveHeroShards === 'function') giveHeroShards('ss', n);
    else if (type === 'sh_ssr' && typeof giveHeroShards === 'function') giveHeroShards('ssr', n);
    else if (type === 'chest') st().chests = (st().chests || 0) + n;
    else if (type === 'supreme') st().supreme = (st().supreme || 0) + n;
  }

  function settleSpin() {
    const b = st();
    const bet = b.bet || 2;
    const list = slots();
    if ((P.so || 0) < bet) return { ok: false, msg: 'Không đủ sò. Cược ' + bet + '.' };
    if (!list.length) return { ok: false, msg: 'Luân chưa sẵn.' };
    P.so -= bet;
    const idx = Math.floor(Math.random() * list.length);
    const z = list[idx];
    const type = z.t || 'gold';
    const same = !!(b.lastType && b.lastType === type);
    const stars = rollStars(same);
    b.lastType = type;
    b.streak = same ? Math.min(6, (b.streak || 0) + 1) : 1;
    b.stars = stars;
    b.spins = (b.spins || 0) + 1;
    b.pool = (b.pool || 12000) + bet;
    const n = qty(type, stars, bet);
    applyGrant(type, n);
    let extra = 0;
    if (stars >= 6 && type === 'gold') {
      extra = Math.floor(b.pool * 0.2);
      P.gold += extra;
      b.pool = Math.max(0, b.pool - extra);
    }
    if (stars >= 3) b.pts += Math.max(1, qty('so', stars, bet));
    const label = TYPE_L[type] || z.l;
    const msg = stars + '★ ' + label + ' · +' + n + (extra ? (' · hũ +' + extra) : '');
    b.history = b.history || [];
    b.history.unshift({ kind: 'spin', label: msg, t: Date.now() });
    if (b.history.length > 12) b.history.length = 12;
    questProgress?.('spin', 1);
    persist?.();
    refreshResbar?.();
    return { ok: true, idx, msg, z: { ...z, l: label }, stars, bet, type, n };
  }

  function paintStep(idx, final) {
    const cells = document.querySelectorAll('#hvFestivalRoot .hv-fest-cell, #festivalBody .bbw-cell');
    const n = cells.length || 20;
    cells.forEach((el, i) => {
      el.classList.remove('is-hot', 'is-trail', 'is-win', 'hot', 'trail', 'win');
      if (i === idx) el.classList.add('is-hot', 'hot');
      else if (i === (idx - 1 + n) % n || i === (idx - 2 + n) % n) el.classList.add('is-trail', 'trail');
    });
    if (final) cells[idx]?.classList.add('is-win', 'win');
  }

  function delayFor(step, total) {
    const p = step / Math.max(1, total - 1);
    if (p < 0.55) return 38;
    if (p < 0.78) return 65 + Math.round((p - 0.55) * 180);
    return 115 + Math.round(Math.pow((p - 0.78) / 0.22, 1.65) * 210);
  }

  async function runSpinAnimated() {
    if (typeof ST === 'object' && ST.bachBaoSpinning) return;
    const r = settleSpin();
    if (!r.ok) { toast?.(r.msg); return; }
    if (typeof ST === 'object') ST.bachBaoSpinning = true;
    const btn = document.querySelector('[data-fest-spin], #bbwSpin');
    if (btn) { btn.classList.add('is-spinning', 'spinning'); btn.textContent = 'Đang quay…'; }
    const status = document.querySelector('[data-fest-status], #bbwStatus');
    if (status) status.innerHTML = 'Ánh sáng đang chạy… <strong>' + r.stars + '★</strong>';
    const n = slots().length || 20;
    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const total = reduced ? 1 : (n * 2 + r.idx + 1);
    for (let k = 0; k < total; k++) {
      const idx = reduced ? r.idx : k % n;
      paintStep(idx, k === total - 1);
      if (!reduced) await new Promise(res => setTimeout(res, delayFor(k, total)));
    }
    if (status) status.innerHTML = 'Dừng <strong>' + r.stars + '★ ' + r.z.l + '</strong> · ' + r.msg;
    if (btn) {
      btn.classList.remove('is-spinning', 'spinning');
      btn.innerHTML = 'QUAY · ' + st().bet + ' ' + SO_IC;
      btn.disabled = (P.so || 0) < st().bet;
    }
    toast?.('🎡 ' + r.msg);
    if (typeof ST === 'object') ST.bachBaoSpinning = false;
    paintDesk();
    setTimeout(() => { if (typeof renderFestival === 'function') renderFestival(); }, 1100);
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
      if (typeof giveHeroShards === 'function') giveHeroShards('ssr', 20);
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
    const el = document.querySelector('[data-fest-reveal], #bbwReveal');
    if (el) el.innerHTML = '<div class="hv-fest-reveal bbw-reveal"><div class="big">' + ic + '</div><strong>RƯƠNG CHÍ BẢO</strong><span>' + msg + '</span></div>';
    paintDesk();
    return { ok: true, msg, ic, kind: 'supreme' };
  }

  if (typeof spinBachBaoCore === 'function') {
    spinBachBaoCore = function spinBachBaoRuongCore() { return settleSpin(); };
  }
  spinBachBaoAnimated = runSpinAnimated;
  if (typeof openBachBaoChest === 'function') {
    const prevOpen = openBachBaoChest;
    openBachBaoChest = function openBachBaoChestRare(kind) {
      if (kind === 'supreme') return openSupreme();
      return prevOpen(kind);
    };
  }

  function starRows() {
    const bet = st().bet || 2;
    const last = st().stars || 0;
    return [1, 2, 3, 4, 5, 6].map(s => {
      const g = qty('gold', s, bet);
      const on = last === s ? ' is-on' : '';
      return '<li class="hv-bbr-star' + on + '">' + '★'.repeat(s) + ' · 🪙' + g + ' · 💎' + qty('gems', s, bet) + ' · ' + SO_IC + qty('so', s, bet) + '</li>';
    }).join('');
  }

  function relabelCells() {
    const list = slots();
    document.querySelectorAll('#hvFestivalRoot .hv-fest-cell b, #festivalBody .bbw-cell b').forEach((el, i) => {
      const z = list[i];
      if (z) el.textContent = TYPE_L[z.t] || z.l;
    });
    document.querySelectorAll('.hv-fest-chest p').forEach((p, i) => {
      if (i === 0) p.textContent = 'Mảnh S/S+ · trang bị +5';
      if (i === 1) p.textContent = 'Hiếm: 80 S+ · +12/+15 · jackpot 💎200 · pity 8';
    });
  }

  function paintDesk() {
    const host = document.querySelector('#hvFestivalRoot .hv-fest-center, #festivalBody .bbw-center');
    if (!host) return;
    let desk = document.getElementById('hvBbrDesk');
    if (!desk) {
      desk = document.createElement('div');
      desk.id = 'hvBbrDesk';
      host.prepend(desk);
      desk.addEventListener('click', ev => {
        const bet = ev.target.closest('[data-bbr-bet]');
        if (bet) {
          st().bet = Number(bet.getAttribute('data-bbr-bet')) || 2;
          persist?.();
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
      });
    }
    const b = st();
    desk.innerHTML = `<div class="hv-bbr-row"><b>${SO_IC} ${P.so || 0}</b><span>Hũ ${b.pool}</span><span>Điểm ${b.pts || 0}</span></div>
      <div class="hv-bbr-bets">${BETS.map(n =>
        `<button type="button" class="hv-bbr-bet${b.bet === n ? ' is-on' : ''}" data-bbr-bet="${n}">${n} ${SO_IC}</button>`
      ).join('')}</div>
      <ul class="hv-bbr-stars">${starRows()}</ul>
      <div class="hv-bbr-row"><button type="button" data-bbr-craft>Chế 10 ${SO_IC} · 25⚗+25🔥 (${b.crafted || 0}/2)</button></div>
      <div class="hv-bbr-shop">${SHOP.map(it =>
        `<button type="button" data-bbr-buy="${it.id}">${it.name} · ${it.pts}đ</button>`
      ).join('')}</div>
      <p class="hv-bbr-note">Mở tướng: B 10 · A 20 · S 30 · S+ 50 mảnh. 6★ thêm 300.</p>`;
    const btn = document.querySelector('[data-fest-spin], #bbwSpin');
    if (btn) {
      btn.innerHTML = 'QUAY · ' + b.bet + ' ' + SO_IC;
      btn.disabled = (P.so || 0) < b.bet;
    }
    relabelCells();
    document.querySelectorAll('[data-fest-so]').forEach(el => {
      el.innerHTML = SO_IC + ' ' + (P.so || 0);
    });
  }

  function bindCapture(root) {
    if (!root || root.dataset.bbrCap === '1') return;
    root.dataset.bbrCap = '1';
    root.addEventListener('click', ev => {
      if (ev.target.closest('[data-fest-spin], #bbwSpin')) {
        ev.preventDefault();
        ev.stopImmediatePropagation();
        runSpinAnimated();
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
