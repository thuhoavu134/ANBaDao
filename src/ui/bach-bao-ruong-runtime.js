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
    chest: [0, 0, 0, 1, 1, 2, 2],
    supreme: [0, 0, 0, 0, 1, 1, 2]
  };
  const SHOP = [
    { id: 'ss8', pts: 100, sh_ss: 8, name: '8 mảnh SS' },
    { id: 'ssr12', pts: 250, sh_ssr: 12, name: '12 mảnh SSR' },
    { id: 'chest', pts: 400, chest: 1, name: 'Rương Báu' },
    { id: 'gems40', pts: 800, gems: 40, name: '40 Ngọc' },
    { id: 'supreme', pts: 1500, supreme: 1, name: 'Rương Chí Bảo' },
    { id: 'ssr40', pts: 3000, sh_ssr: 40, name: '40 mảnh SSR' }
  ];

  function st() {
    P.bachBao = P.bachBao || {};
    const b = P.bachBao;
    if (!BETS.includes(b.bet)) b.bet = 2;
    b.pts = b.pts || 0;
    b.pool = b.pool || 12000;
    b.streak = b.streak || 0;
    b.crafted = b.crafted || 0;
    return b;
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

  if (typeof spinBachBaoCore === 'function') {
    spinBachBaoCore = function spinBachBaoRuongCore() {
      const b = st();
      const bet = b.bet || 2;
      if ((P.so || 0) < bet) return { ok: false, msg: 'Không đủ vỏ sò. Cược ' + bet + '🐚 — chế từ Tinh+Hoạt hoặc mua chợ.' };
      const slots = (typeof BACH_BAO === 'object' && BACH_BAO.slots) || [];
      if (!slots.length) return { ok: false, msg: 'Luân chưa sẵn.' };
      P.so -= bet;
      const idx = Math.floor(Math.random() * slots.length);
      const z = slots[idx];
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
      if (stars >= 6 && type === 'gold') {
        const jack = Math.floor(b.pool * 0.2);
        P.gold += jack;
        b.pool = Math.max(0, b.pool - jack);
      }
      if (stars >= 3) b.pts += Math.max(1, qty('so', stars, bet));
      const msg = stars + '★ ' + z.l + ' · +' + n + (type === 'so' ? '🐚' : '');
      b.history = b.history || [];
      b.history.unshift({ kind: 'spin', label: msg, t: Date.now() });
      if (b.history.length > 12) b.history.length = 12;
      if (typeof questProgress === 'function') questProgress('spin', 1);
      if (typeof persist === 'function') persist();
      if (typeof refreshResbar === 'function') refreshResbar();
      return { ok: true, idx, msg, z, stars, bet };
    };
  }

  function paintDesk() {
    const host = document.querySelector('#festivalBody .bbw-center, #hvFestivalRoot .bbw-center');
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
          if (typeof persist === 'function') persist();
          paintDesk();
          const btn = document.getElementById('bbwSpin');
          if (btn) btn.textContent = 'QUAY · ' + st().bet + '🐚';
          return;
        }
        if (ev.target.closest('[data-bbr-craft]')) {
          const b = st();
          const day = typeof today === 'function' ? today() : 0;
          if (b.craftDay !== day) { b.crafted = 0; b.craftDay = day; }
          if (b.crafted >= 2) { toast?.('Hôm nay đã chế đủ sò.'); return; }
          if ((P.tinh || 0) < 25 || (P.hoat || 0) < 25) {
            toast?.('Cần 25 Tinh + 25 Hoạt. Làm nhiệm vụ hoặc mua túi đồ nghề ở Chợ.');
            return;
          }
          P.tinh -= 25; P.hoat -= 25; P.so = (P.so || 0) + 10; b.crafted++;
          persist?.(); refreshResbar?.(); toast?.('Chế 10🐚 từ Tinh+Hoạt.');
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
          if (it.sh_ss && typeof giveHeroShards === 'function') giveHeroShards('ss', it.sh_ss);
          if (it.sh_ssr && typeof giveHeroShards === 'function') giveHeroShards('ssr', it.sh_ssr);
          persist?.(); refreshResbar?.(); toast?.('Đổi ' + it.name);
          paintDesk();
        }
      });
    }
    const b = st();
    desk.innerHTML = `<div class="hv-bbr-row"><b>Vỏ sò ${P.so || 0}</b><span>Hũ ${b.pool}</span><span>Điểm ${b.pts || 0}</span></div>
      <div class="hv-bbr-bets">${BETS.map(n =>
        `<button type="button" class="hv-bbr-bet${b.bet === n ? ' is-on' : ''}" data-bbr-bet="${n}">${n} 🐚</button>`
      ).join('')}</div>
      <div class="hv-bbr-row"><button type="button" data-bbr-craft>Chế 10🐚 · 25⚗+25🔥 (${b.crafted || 0}/2)</button></div>
      <div class="hv-bbr-shop">${SHOP.map(it =>
        `<button type="button" data-bbr-buy="${it.id}">${it.name} · ${it.pts}đ</button>`
      ).join('')}</div>
      <p class="hv-bbr-note">Cùng loại +1★. 3★ trở lên cộng điểm. 6★ Vàng lấy 20% hũ.</p>`;
    const btn = document.getElementById('bbwSpin');
    if (btn) {
      btn.textContent = 'QUAY · ' + b.bet + '🐚';
      btn.disabled = (P.so || 0) < b.bet;
    }
  }

  if (typeof renderFestival === 'function') {
    const base = renderFestival;
    renderFestival = function renderFestivalWithBbr() {
      base.apply(this, arguments);
      paintDesk();
    };
  }

  paintDesk();
})();
