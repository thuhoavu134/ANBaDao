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
    { t: 'tinh', n: 1 }, { t: 'gold', n: 2 }, { t: 'gold', n: 1 },
    { t: 'supreme', n: 1 },
    { t: 'hoat', n: 1 }, { t: 'gold', n: 1 }, { t: 'gems', n: 3 },
    { t: 'gems', n: 1 }, { t: 'sh_ss', n: 1 }, { t: 'tinh', n: 2 }, { t: 'chest', n: 1 },
    { t: 'sh_ssr', n: 3 }, { t: 'sh_ss', n: 3 }, { t: 'sh_ssr', n: 1 },
    { t: 'supreme', n: 1 },
    { t: 'hoat', n: 2 }, { t: 'gems', n: 2 }, { t: 'sh_ss', n: 2 },
    { t: 'hoat', n: 3 }, { t: 'gold', n: 3 }, { t: 'sh_ssr', n: 2 }, { t: 'tinh', n: 3 }
  ];
  const RING = [
    [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [7, 1],
    [7, 2], [7, 3], [7, 4], [7, 5],
    [7, 6], [6, 6], [5, 6], [4, 6], [3, 6], [2, 6], [1, 6],
    [1, 5], [1, 4], [1, 3], [1, 2]
  ];
  const SO_STAR = [0, 1, 3, 10, 28, 80, 220];
  const ART = {
    gold: 'assets/items/materials/gold.png',
    gems: 'assets/ui/festival/bbr/gems.png',
    tinh: 'assets/items/materials/tinh-luc.png',
    hoat: 'assets/items/materials/hoat-luc.png',
    sh_ss: 'assets/ui/festival/bbr/sh_ss.png',
    sh_ssr: 'assets/ui/festival/bbr/sh_ssr.png',
    chest: 'assets/ui/festival/bbr/chest.png',
    supreme: 'assets/ui/festival/bbr/supreme.png',
    so: 'assets/ui/festival/bbr/so.png'
  };
  const LAB = {
    gold: 'Vàng', gems: 'Ngọc', so: 'Sò', tinh: 'Tinh', hoat: 'Hoạt',
    sh_ss: 'Mảnh S', sh_ssr: 'Mảnh S+', chest: 'Rương Báu', supreme: 'Chí Bảo'
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
  const SO_IC = '<img class="hv-so-ic" src="assets/ui/festival/bbr/so.png" alt="sò">';

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

  const BUCKET = { common: 50, shard: 30, chest: 15, supreme: 5 };
  const WN = { 1: 5, 2: 3, 3: 2 };
  const CYCLE = ['sh_ss', 'chest', 'supreme', 'sh_ssr', 'chest', 'supreme'];

  function bucketOf(t) {
    if (t === 'supreme') return 'supreme';
    if (t === 'chest') return 'chest';
    if (t === 'sh_ss' || t === 'sh_ssr') return 'shard';
    return 'common';
  }

  function firstType(t) {
    const i = BOARD.findIndex(c => c.t === t);
    return i < 0 ? 0 : i;
  }

  function pickIdx() {
    const b = st();
    const bet = b.bet || 2;
    const continuing = !!b.pending;
    const spent = (b.spent || 0) + bet;
    if (!continuing && spent - (b.pityAt || 0) >= 200) return firstType('supreme');
    const pool = (b.pool || 12000) + bet;
    const mark = b.poolMark != null ? b.poolMark : 2;
    const now = Math.floor(pool / 5000);
    if (!continuing && now > mark) {
      return firstType(CYCLE[(now - 1 + CYCLE.length) % CYCLE.length]);
    }
    const keys = ['common', 'shard', 'chest', 'supreme'];
    let r = Math.random() * 100;
    let bucket = 'common';
    for (let i = 0; i < keys.length; i++) {
      r -= BUCKET[keys[i]];
      if (r < 0) { bucket = keys[i]; break; }
    }
    const hits = [];
    BOARD.forEach((c, i) => { if (bucketOf(c.t) === bucket) hits.push(i); });
    const poolHits = hits.length ? hits : BOARD.map((_, i) => i);
    let s = 0;
    const ww = poolHits.map(i => { const x = WN[BOARD[i].n] || 1; s += x; return x; });
    let x = Math.random() * s;
    for (let i = 0; i < poolHits.length; i++) {
      x -= ww[i];
      if (x < 0) return poolHits[i];
    }
    return poolHits[poolHits.length - 1];
  }

  function cellFace(c) {
    const src = ART[c.t] || ART.gold;
    const n = Math.max(1, Math.min(3, c.n || 1));
    return '<span class="hv-bbr-stack n' + n + '">'
      + Array.from({ length: n }, () => '<img src="' + src + '" alt="">').join('')
      + '</span>';
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

  function applyIdx(idx) {
    const b = st();
    const bet = b.bet || 2;
    if ((P.so || 0) < bet) { toast?.('Không đủ sò. Cược ' + bet + '.'); return null; }
    P.so -= bet;
    const cell = BOARD[idx];
    const continuing = !!b.pending;
    const same = !!(continuing && b.pending.t === cell.t);
    b.spins = (b.spins || 0) + 1;
    b.spent = (b.spent || 0) + bet;
    b.pts = (b.pts || 0) + bet;
    b.pool = (b.pool || 12000) + bet;
    let pity = false;
    let bonusSup = 0;
    if (!continuing && b.spent - (b.pityAt || 0) >= 200) {
      pity = true;
      b.pityAt = b.spent;
      bonusSup = Math.random() < 0.5 ? 2 : 1;
      if (bonusSup === 2) b.supreme = (b.supreme || 0) + 1;
    }
    const mark = b.poolMark != null ? b.poolMark : 2;
    const now = Math.floor(b.pool / 5000);
    if (!continuing && now > mark) b.poolMark = now;
    if (continuing && !same) {
      b.pending = null;
      b.lastType = '';
      b.stars = 1;
      b.lastIdx = 0;
      persist?.();
      refreshResbar?.();
      questProgress?.('spin', 1);
      return { idx, cell, same: false, stars: 0, bust: true, pity: false };
    }
    const stars = same ? Math.min(6, b.pending.stars + cell.n) : cell.n;
    b.pending = { t: cell.t, stars, n: cell.n };
    b.stars = stars;
    b.lastType = cell.t;
    b.lastIdx = idx;
    persist?.();
    refreshResbar?.();
    questProgress?.('spin', 1);
    return { idx, cell, same, stars, bust: false, pity, bonusSup };
  }

  let spinning = false;
  let pane = 'play';
  function light(i) {
    document.querySelectorAll('#hvBbrDesk [data-bbr-cell]').forEach(el => {
      el.classList.toggle('is-hot', Number(el.getAttribute('data-bbr-cell')) === i);
    });
  }
  function delay(ms) { return new Promise(res => setTimeout(res, ms)); }

  function spinDelay(k, total) {
    const t = k / Math.max(1, total - 1);
    if (t < 0.22) return 340 - t * 900;
    if (t < 0.58) return 90;
    const u = (t - 0.58) / 0.42;
    return 90 + u * u * 360;
  }

  async function runSpin() {
    if (spinning) return;
    const bet = st().bet || 2;
    if ((P.so || 0) < bet) { toast?.('Không đủ sò. Cược ' + bet + '.'); return; }
    spinning = true;
    document.querySelectorAll('[data-bbr-step],[data-bbr-take],[data-bbr-convert]').forEach(el => { el.disabled = true; });
    const ring = document.querySelector('#hvBbrDesk .hv-bbr-ring');
    ring?.classList.add('is-run');
    const dest = pickIdx();
    const n = BOARD.length;
    const b0 = st();
    const continuing = !!b0.pending;
    const start = continuing ? Math.max(0, asInt(b0.lastIdx, 0)) : 0;
    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let dist = (dest - start + n) % n;
    if (dist === 0) dist = n;
    const total = reduced ? dist : ((continuing ? 1 : 2) * n + dist);
    for (let k = 1; k <= total; k++) {
      light((start + k) % n);
      await delay(reduced ? 70 : spinDelay(k - 1, total));
    }
    light(dest);
    const r = applyIdx(dest);
    if (r && r.bust) st().lastIdx = 0;
    else st().lastIdx = dest;
    await delay(280);
    spinning = false;
    ring?.classList.remove('is-run');
    if (r) {
      toast?.(r.bust
        ? 'Trượt cùng loại. Mất sò lượt này.'
        : (r.pity
          ? ('Pity · ' + r.bonusSup + ' Rương Chí Bảo')
          : (r.same ? ('Cộng ' + r.cell.n + ' → ' + r.stars + '★ ' + LAB[r.cell.t]) : (r.stars + '★ ' + LAB[r.cell.t]))));
    }
    paintDesk();
  }

  function asInt(v, f) {
    const n = Math.floor(Number(v));
    return Number.isFinite(n) ? n : f;
  }

  function doStep() {
    return applyIdx(pickIdx());
  }

  function doTake() {
    if (spinning) { toast?.('Đang quay.'); return null; }
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
    const msg = stars + '★ ' + (LAB[t] || t) + ' · +' + n;
    b.history = b.history || [];
    b.history.unshift({ kind: 'take', label: msg, t: Date.now() });
    b.pending = null;
    persist?.();
    refreshResbar?.();
    toast?.('🎡 ' + msg);
    b.lastIdx = 0;
    return { msg, t, stars, n };
  }

  function convertQty(type, stars, bet) {
    return Math.max(1, Math.round((SO_STAR[stars] || 1) * ((bet || 2) / 2)));
  }

  function doConvert() {
    if (spinning) { toast?.('Đang quay.'); return null; }
    const b = st();
    if (!b.pending) { toast?.('Quay rồi hãy đổi.'); return null; }
    const { t, stars } = b.pending;
    if (t === 'chest' || t === 'supreme') {
      toast?.('Rương không đổi sò. Bấm Thưởng.');
      return { ok: false, code: 'CHEST_NO_CONVERT' };
    }
    const n = convertQty(t, stars, b.bet || 2);
    P.so = (P.so || 0) + n;
    b.pending = null;
    b.lastIdx = 0;
    b.history = b.history || [];
    b.history.unshift({ kind: 'convert', label: stars + '★ → sò ' + n, t: Date.now() });
    persist?.();
    refreshResbar?.();
    return { n, t, stars };
  }

  function showConvertLoot(n) {
    let fx = document.getElementById('hvSoFx');
    if (!fx) {
      fx = document.createElement('div');
      fx.id = 'hvSoFx';
      fx.innerHTML = `
        <div class="hv-chest-fx-card">
          <div class="hv-chest-fx-loot">
            <span class="hv-chest-fx-frame"><img alt="sò"></span>
            <b></b>
          </div>
          <button type="button" data-so-fx-done>Nhận</button>
        </div>`;
      document.body.append(fx);
      fx.addEventListener('click', ev => {
        if (!ev.target.closest('[data-so-fx-done]') && ev.target !== fx) return;
        fx.classList.remove('is-open');
      });
    }
    const img = fx.querySelector('img');
    const lab = fx.querySelector('b');
    img.src = ART.so;
    lab.textContent = '+' + n + ' sò';
    fx.classList.add('is-open');
  }

  function doScore() {
    if (spinning) { toast?.('Đang quay.'); return null; }
    const b = st();
    if (!b.pending) { toast?.('Quay rồi hãy nhận điểm.'); return null; }
    const { stars } = b.pending;
    const n = Math.max(1, pay('so', stars, b.bet || 2) * 2);
    b.pts = (b.pts || 0) + n;
    b.pending = null;
    b.lastIdx = 0;
    persist?.();
    toast?.('+' + n + ' điểm shop');
    return { n, stars };
  }

  window.hvCraftSo = function hvCraftSo() {
    const b = st();
    const day = typeof today === 'function' ? today() : 0;
    if (b.craftDay !== day) { b.crafted = 0; b.craftDay = day; }
    if (b.crafted >= 2) { toast?.('Hôm nay đã chế đủ sò.'); return { ok: false }; }
    if ((P.tinh || 0) < 25 || (P.hoat || 0) < 25) {
      toast?.('Cần 25 Tinh + 25 Hoạt. Mua Bình/Lò ở Chợ.');
      return { ok: false };
    }
    P.tinh -= 25; P.hoat -= 25; P.so = (P.so || 0) + 10; b.crafted++;
    persist?.(); refreshResbar?.(); toast?.('Chế 10 sò.');
    return { ok: true };
  };

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
  spinBachBaoAnimated = function () { runSpin(); };
  if (typeof openBachBaoChest === 'function') {
    const prevOpen = openBachBaoChest;
    openBachBaoChest = function openBachBaoChestRare(kind) {
      if (kind === 'supreme') return openSupreme();
      return prevOpen(kind);
    };
  }

  function shopIcon(it) {
    if (it.sh_ss) return ART.sh_ss;
    if (it.sh_ssr) return ART.sh_ssr;
    if (it.chest) return ART.chest;
    if (it.gems) return ART.gems;
    if (it.supreme) return ART.supreme;
    return ART.gold;
  }
  function shopTag(it) {
    if (it.supreme || (it.sh_ssr && it.pts >= 1500)) return { cls: 't-super', label: 'Siêu' };
    if (it.chest || it.sh_ssr || it.gems) return { cls: 't-rare', label: 'Hiếm' };
    return { cls: 't-ok', label: 'Đổi' };
  }
  function shopQty(it) {
    return it.sh_ss || it.sh_ssr || it.gems || it.chest || it.supreme || 1;
  }
  function shopTitle(it) {
    if (it.sh_ss) return 'Mảnh S';
    if (it.sh_ssr) return 'Mảnh S+';
    if (it.chest) return 'Rương Báu';
    if (it.gems) return 'Ngọc';
    if (it.supreme) return 'Rương Chí Bảo';
    return it.name;
  }

  function paintShop() {
    const host = document.getElementById('hvShopPts');
    if (!host) return;
    const b = st();
    host.innerHTML = `
      <div class="hv-bbr-shop-hero">
        <img src="assets/ui/festival/shop-keep.jpg" alt="">
        <div class="hv-bbr-shop-pts">Điểm <b>${b.pts || 0}</b></div>
        <div class="hv-bbr-shop-ribbon">Shop Điểm</div>
      </div>
      <div class="hv-bbr-shop-body">
        <div class="hv-bbr-shop-tab">Điểm</div>
        <div class="hv-bbr-goods">${SHOP.map(it => {
        const tag = shopTag(it);
        return `<button type="button" class="hv-bbr-good" data-bbr-buy="${it.id}">
          <i class="hv-bbr-tag ${tag.cls}">${tag.label}</i>
          <span class="hv-bbr-ico"><img src="${shopIcon(it)}" alt=""><em>${shopQty(it)}</em></span>
          <span class="hv-bbr-meta">
            <b>${shopTitle(it)}</b>
            <small>Đổi bằng điểm</small>
            <span class="hv-bbr-cost">${it.pts} điểm</span>
          </span>
        </button>`;
      }).join('')}</div>
      </div>`;
  }
  window.paintBbrShop = paintShop;

  function starTable(type, bet, on) {
    const row = PAY[type] || PAY.gold;
    return [1, 2, 3, 4, 5, 6].map(s => {
      const cls = on === s ? ' is-on' : '';
      return '<li class="hv-bbr-star' + cls + '">' + '★'.repeat(s) + ' · ' + row[s] * (bet / 2) + '</li>';
    }).join('');
  }

  function paintDesk() {
    if (spinning && document.getElementById('hvBbrDesk')) return;
    const shell = document.querySelector('#hvFestivalRoot .hv-fest-wheel-shell, #festivalBody .bbw-wrap');
    if (!shell) return;
    const b = st();
    const bet = b.bet || 2;
    const pend = b.pending;
    const type = pend ? pend.t : 'gold';
    shell.innerHTML = `<div id="hvBbrDesk" class="hv-bbr-kt">
      <div class="hv-bbr-kt-head">
        <h3>Bách Bảo Rương</h3>
        <div class="hv-bbr-row"><b>${SO_IC} ${P.so || 0}</b><span>Hũ ${b.pool}</span><span>Pity ${Math.min(200, (b.spent || 0) - (b.pityAt || 0))}/200</span></div>
        <p class="hv-bbr-pts-note">Điểm tích luỹ <b>${b.pts || 0}</b> · tự động nhận sau khi tiêu mỗi 100 sò</p>
      </div>
      <div class="hv-bbr-kt-body">
        <div class="hv-bbr-ring${pend ? ' is-hold' : ''}" data-bbr-grid>
          ${BOARD.map((c, i) => {
            const pos = RING[i] || [1, 1];
            const lit = !!(pend && asInt(b.lastIdx, -1) === i);
            const kind = c.t === 'supreme' ? ' is-sup' : (c.t === 'chest' ? ' is-chest' : '');
            return `<button type="button" class="hv-bbr-cell${lit ? ' is-hot is-win' : ''}${kind}" data-bbr-cell="${i}" style="grid-column:${pos[0]};grid-row:${pos[1]}" disabled>
              ${cellFace(c)}
            </button>`;
          }).join('')}
          <div class="hv-bbr-hub">
            <i class="hv-bbr-hub-mark" aria-hidden="true"></i>
            <img class="hv-bbr-hub-chest" src="assets/ui/festival/bbr/supreme.png" alt="">
            <ul class="hv-bbr-stars">${starTable(type, bet, pend && pend.stars)}</ul>
          </div>
        </div>
        <div class="hv-bbr-side">
            <div class="hv-bbr-bets">${BETS.map(n =>
              `<button type="button" class="hv-bbr-bet${bet === n ? ' is-on' : ''}" data-bbr-bet="${n}">${n} ${SO_IC}</button>`
            ).join('')}</div>
            <p class="hv-bbr-now">${pend
              ? ((pend.t === 'chest' || pend.t === 'supreme')
                ? (pend.stars + '★ ' + LAB[pend.t] + ' · chỉ nhận thưởng, không đổi sò')
                : (pend.stars + '★ ' + LAB[pend.t] + ' · Đổi sò ' + convertQty(pend.t, pend.stars, bet)))
              : 'Cược sò rồi Quay.'}</p>
            <button type="button" class="hv-bbr-go" data-bbr-step ${((P.so || 0) < bet) ? 'disabled' : ''}>${pend ? 'Tiếp' : 'Quay'} · ${bet} ${SO_IC}</button>
            <div class="hv-bbr-sub">
              <button type="button" data-bbr-take ${pend ? '' : 'disabled'}>Thưởng</button>
              <button type="button" data-bbr-convert ${(pend && pend.t !== 'chest' && pend.t !== 'supreme') ? '' : 'disabled'}>Đổi sò</button>
            </div>
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
    paintShop();
  }

  function onDesk(ev) {
    if (spinning && ev.target.closest('[data-bbr-take],[data-bbr-convert],[data-bbr-buy]')) {
      toast?.('Đang quay — chưa nhận được.');
      return;
    }
    const bet = ev.target.closest('[data-bbr-bet]');
    if (bet) {
      st().bet = Number(bet.getAttribute('data-bbr-bet')) || 2;
      persist?.();
      paintDesk();
      return;
    }
    if (ev.target.closest('[data-bbr-step]')) {
      runSpin();
      return;
    }
    if (ev.target.closest('[data-bbr-take]')) {
      doTake();
      paintDesk();
      return;
    }
    if (ev.target.closest('[data-bbr-convert]')) {
      const r = doConvert();
      paintDesk();
      if (r && r.n) showConvertLoot(r.n);
      return;
    }
    const tabBtn = ev.target.closest('[data-bbr-pane]');
    if (tabBtn) {
      pane = tabBtn.getAttribute('data-bbr-pane') === 'shop' ? 'shop' : 'play';
      paintDesk();
      return;
    }
    const open = ev.target.closest('[data-bbr-open]');
    if (open) {
      const kind = open.getAttribute('data-bbr-open');
      if (kind === 'supreme') openSupreme();
      else if (typeof openBachBaoChest === 'function') openBachBaoChest('chest');
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
      if (ev.target.closest('#hvBbrDesk, #hvBbrShop, #hvShopPts')) {
        ev.preventDefault();
        ev.stopImmediatePropagation();
        onDesk(ev);
        return;
      }
      if (ev.target.closest('[data-fest-spin], #bbwSpin')) {
        ev.preventDefault();
        ev.stopImmediatePropagation();
        runSpin();
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

  if (typeof renderShop === 'function') {
    const baseShop = renderShop;
    renderShop = function renderShopWithBbrPts() {
      baseShop.apply(this, arguments);
      bindCapture(document.getElementById('hvShopRoot'));
      paintShop();
    };
  }

  bindCapture(document.getElementById('hvFestivalRoot'));
  bindCapture(document.getElementById('festivalBody'));
  bindCapture(document.getElementById('hvShopRoot'));
  paintDesk();
})();
