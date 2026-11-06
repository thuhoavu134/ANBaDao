/* Owner 2026-11-06: Dau Truong cho nhieu nguoi choi cung server - hoc AFK Arena / Summoners War / Epic Seven.
   4 phan: Nhat ky + Phuc thu, Phan hang 6 bac + thuong tuan, Cua hang xu, Bang xep hang server.
   Du lieu rieng o P.arenaMeta (commitArena ghi de ca khoi P.arena nen khong de o do).
   Hinh: anh gpt_image trong assets/ui/arena (tier-1..6, coin, chest, slot, row-frame). */
(() => {
  if (typeof document === 'undefined' || !document.body) return;
  const A = 'assets/ui/arena/';
  const ICON = 'assets/ui/menu-v3233/icons/';
  const QA = /[?&]qa=unlock-all\b/.test(location.search);
  const h = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fmt = n => Number(n || 0).toLocaleString('vi-VN');
  const day = () => (typeof today === 'function' ? today() : Math.floor(Date.now() / 86400000));
  const weekId = () => Math.floor((day() + 3) / 7);

  // 6 bac theo hang (so hang cang nho cang cao). Thuong tuan phat theo bac cao nhat dat duoc trong tuan.
  const TIERS = [
    { id: 1, name: 'Tân Binh', upTo: Infinity, reward: { gold: 300, gems: 0, coins: 20 } },
    { id: 2, name: 'Thiện Chiến', upTo: 700, reward: { gold: 500, gems: 5, coins: 40 } },
    { id: 3, name: 'Tinh Anh', upTo: 350, reward: { gold: 800, gems: 10, coins: 60 } },
    { id: 4, name: 'Cao Thủ', upTo: 150, reward: { gold: 1200, gems: 15, coins: 90 } },
    { id: 5, name: 'Tông Sư', upTo: 50, reward: { gold: 1800, gems: 25, coins: 130 } },
    { id: 6, name: 'Huyền Thoại', upTo: 10, reward: { gold: 2500, gems: 40, coins: 200 } }
  ];
  const tierOf = rank => { let t = TIERS[0]; for (const x of TIERS) if ((rank || 9999) <= x.upTo) t = x; return t; };
  const COIN_WIN = 30, COIN_LOSE = 10;

  const SHOP = [
    { id: 'shard', name: '10 mảnh tướng ngẫu nhiên', cost: 120, limit: 3, icon: ICON + 'summon.png' },
    { id: 'gold', name: '2.000 vàng', cost: 60, limit: 5, icon: ICON + 'resource-gold-imagen.png' },
    { id: 'gems', name: '20 ngọc', cost: 150, limit: 2, icon: ICON + 'resource-gem-imagen.png' },
    { id: 'stam', name: '30 năng lượng', cost: 80, limit: 3, icon: ICON + 'resource-energy-imagen.png' }
  ];

  function meta() {
    if (!P.arenaMeta || typeof P.arenaMeta !== 'object') P.arenaMeta = {};
    const m = P.arenaMeta;
    if (!Array.isArray(m.log)) m.log = [];
    if (typeof m.coins !== 'number') m.coins = 0;
    const w = weekId(), rank = P.arena?.rank || 1000;
    if (!m.week || typeof m.week !== 'object') m.week = { id: w, best: rank };
    if (m.week.id !== w) { // sang tuan moi: chot bac tuan truoc de nhan thuong
      m.lastWeek = { id: m.week.id, best: m.week.best, claimed: false };
      m.week = { id: w, best: rank };
    }
    if (!m.shop || m.shop.week !== w) m.shop = { week: w, bought: {} };
    return m;
  }
  const save = () => { try { persist?.(); } catch (_) {} };
  const say = t => { try { toast?.(t); } catch (_) {} };
  const teamIds = r => (r?.team || []).map(x => typeof x === 'string' ? x : x && x.id).filter(Boolean);
  const avatar = id => {
    try { const s = typeof portraitSrc === 'function' && (portraitSrc(id, 'avatar') || portraitSrc(id, 'card')); if (s) return String(s); } catch (_) {}
    return '';
  };
  const nm = id => { try { return typeof heroName === 'function' ? heroName(id) : (DATA.heroes[id]?.name || id); } catch (_) { return id; } };
  const ago = t => { const s = Math.max(1, Math.round((Date.now() - t) / 1000)); return s < 60 ? s + ' giây trước' : s < 3600 ? Math.round(s / 60) + ' phút trước' : s < 86400 ? Math.round(s / 3600) + ' giờ trước' : Math.round(s / 86400) + ' ngày trước'; };
  const grudged = key => { try { const g = (typeof ensureArenaRivalry === 'function' ? ensureArenaRivalry() : P.arena?.rivalry)?.grudges; return !!(g && key && g[key]); } catch (_) { return false; } };

  // 1) Nhat ky: boc arenaSettle (da duoc arena-runtime boc), ghi 1 dong moi tran local.
  const baseSettle = typeof arenaSettle === 'function' ? arenaSettle : null;
  if (baseSettle) {
    arenaSettle = function hvMetaArenaSettle(win) {
      const r = typeof ST === 'object' ? ST.rival : null;
      const before = P.arena?.rank || 1000;
      const out = baseSettle.apply(this, arguments);
      try {
        if (r && !r.net) {
          const m = meta();
          const after = P.arena?.rank || before;
          m.log.unshift({ t: Date.now(), win: !!win, name: r.name, rank: r.rank, team: teamIds(r).slice(0, 6), before, after,
            key: typeof arenaRivalKey === 'function' ? arenaRivalKey(r) : '' });
          if (m.log.length > 20) m.log.length = 20;
          m.coins += win ? COIN_WIN : COIN_LOSE;
          m.week.best = Math.min(m.week.best || after, after);
          save();
          say('Đấu Trường: +' + (win ? COIN_WIN : COIN_LOSE) + ' xu đấu trường');
        }
      } catch (_) {}
      return out;
    };
  }

  function revenge(i) {
    const e = meta().log[i];
    if (!e || e.win || !grudged(e.key)) return;
    const rival = { rank: e.rank, name: e.name, team: e.team.slice() };
    if (!P.arena) return;
    P.arena.rivals = [rival, ...(P.arena.rivals || []).filter(x => x.name !== rival.name)].slice(0, 4);
    save();
    closeSheet();
    if (typeof startArena === 'function') startArena(0);
  }

  // ---- bang (sheet) dung chung ----
  let sheetEl = null;
  function closeSheet() { sheetEl?.remove(); sheetEl = null; }
  function openSheet(kind) {
    closeSheet();
    sheetEl = document.createElement('div');
    sheetEl.className = 'hvm-sheet';
    sheetEl.dataset.hvm = kind;
    sheetEl.innerHTML = `<div class="hvm-panel"><header class="hvm-head"><b></b><button type="button" class="hvm-close" aria-label="Đóng">Đóng</button></header><div class="hvm-body"></div></div>`;
    sheetEl.addEventListener('click', ev => { if (ev.target === sheetEl) closeSheet(); });
    sheetEl.querySelector('.hvm-close').addEventListener('click', closeSheet);
    document.body.append(sheetEl); // popup that su: nam ngoai khung man (khung co hieu ung phong to)
    paintSheet(kind);
  }
  function paintSheet(kind) {
    if (!sheetEl) return;
    const head = sheetEl.querySelector('.hvm-head b'), body = sheetEl.querySelector('.hvm-body');
    const m = meta();
    if (kind === 'log') {
      head.textContent = 'Nhật ký trận';
      body.innerHTML = m.log.length ? m.log.map((e, i) => {
        const can = !e.win && grudged(e.key);
        const avs = (e.team || []).slice(0, 3).map(id => avatar(id) ? `<img class="hvm-av" src="${avatar(id)}" alt="${h(nm(id))}">` : '').join('');
        return `<article class="hvm-row" data-hvm-log="${i}">
          <span class="hvm-tag ${e.win ? 'is-win' : 'is-lose'}">${e.win ? 'Thắng' : 'Thua'}</span>
          <div class="hvm-main"><b>${h(e.name)}</b><small>Hạng ${fmt(e.before)} → ${fmt(e.after)} · ${ago(e.t)}</small><div class="hvm-avs">${avs}</div></div>
          ${can ? `<button type="button" class="hvm-btn" data-hvm-revenge="${i}">Phục thù</button>` : `<small class="hvm-note">${e.win ? (e.before > e.after ? 'Lên ' + fmt(e.before - e.after) + ' hạng' : 'Giữ hạng') : 'Đã phục thù'}</small>`}
        </article>`;
      }).join('') : '<p class="hvm-empty">Chưa có trận nào. Đánh một trận Đấu Hạng để ghi nhật ký.</p>';
      body.querySelectorAll('[data-hvm-revenge]').forEach(b => b.addEventListener('click', () => revenge(+b.dataset.hvmRevenge)));
    } else if (kind === 'week') {
      head.textContent = 'Phân hạng & thưởng tuần';
      const cur = tierOf(P.arena?.rank), best = tierOf(m.week.best);
      const lw = m.lastWeek && !m.lastWeek.claimed ? m.lastWeek : null;
      const lwTier = lw ? tierOf(lw.best) : null;
      body.innerHTML = `
        <section class="hvm-week-top">
          <img class="hvm-tier-big" src="${A}tier-${cur.id}.webp" alt="">
          <div><b>${cur.name}</b><small>Hạng hiện tại ${fmt(P.arena?.rank || 1000)}</small><small>Cao nhất tuần này: ${best.name} (hạng ${fmt(m.week.best)})</small></div>
        </section>
        ${lw ? `<div class="hvm-claim"><img src="${A}chest.webp" alt=""><div><b>Thưởng tuần trước: ${lwTier.name}</b><small>${fmt(lwTier.reward.gold)} vàng · ${lwTier.reward.gems} ngọc · ${lwTier.reward.coins} xu</small></div><button type="button" class="hvm-btn" data-hvm-claim>Nhận</button></div>`
              : `<p class="hvm-hint">Thưởng phát theo bậc cao nhất trong tuần, nhận khi sang tuần mới.</p>`}
        <div class="hvm-tiers">${TIERS.slice().reverse().map(t => `
          <div class="hvm-tier${t.id === cur.id ? ' is-on' : ''}"><img src="${A}tier-${t.id}.webp" alt=""><div><b>${t.name}</b><small>${t.upTo === Infinity ? 'Mọi hạng' : 'Hạng ' + t.upTo + ' trở lên'}</small></div>
          <small class="hvm-rw">${fmt(t.reward.gold)} vàng${t.reward.gems ? ' · ' + t.reward.gems + ' ngọc' : ''} · ${t.reward.coins} xu</small></div>`).join('')}</div>
        ${QA ? '<button type="button" class="hvm-btn is-ghost" data-hvm-qa-week>QA: chốt tuần</button>' : ''}`;
      body.querySelector('[data-hvm-claim]')?.addEventListener('click', claimWeek);
      body.querySelector('[data-hvm-qa-week]')?.addEventListener('click', () => { const mm = meta(); mm.week.id -= 1; meta(); save(); paintSheet('week'); });
    } else if (kind === 'shop') {
      head.textContent = 'Cửa hàng xu đấu trường';
      body.innerHTML = `<p class="hvm-coins"><img src="${A}coin.webp" alt=""><b data-hvm-coins>${fmt(m.coins)}</b> xu · làm mới mỗi tuần · thắng +${COIN_WIN}, thua +${COIN_LOSE}</p>
        <div class="hvm-shop">${SHOP.map(it => {
          const left = it.limit - (m.shop.bought[it.id] || 0), can = left > 0 && m.coins >= it.cost;
          return `<div class="hvm-item"><div class="hvm-slot"><img src="${it.icon}" alt=""></div><b>${it.name}</b><small>Còn ${left}/${it.limit}</small>
            <button type="button" class="hvm-btn" data-hvm-buy="${it.id}" ${can ? '' : 'disabled'}><img src="${A}coin.webp" alt="">${it.cost}</button></div>`;
        }).join('')}</div>`;
      body.querySelectorAll('[data-hvm-buy]').forEach(b => b.addEventListener('click', () => buy(b.dataset.hvmBuy)));
    } else if (kind === 'board') {
      head.textContent = 'Bảng xếp hạng server';
      const online = typeof netOnline === 'function' && netOnline();
      if (!online) {
        body.innerHTML = `<p class="hvm-empty">Bảng xếp hạng lấy từ server chung của mọi người chơi. Bạn đang chơi offline nên chưa xem được.<br>Đăng nhập server ở mục Bạn bè / Mạng rồi mở lại.</p>
          <p class="hvm-hint">Hạng trên máy bạn: <b>${fmt(P.arena?.rank || 1000)}</b> (${tierOf(P.arena?.rank).name})</p>`;
        return;
      }
      body.innerHTML = '<p class="hvm-empty">Đang tải bảng xếp hạng...</p>';
      (async () => {
        try {
          const j = await api('/api/leaderboard?by=arena');
          if (!sheetEl || sheetEl.dataset.hvm !== 'board') return;
          const top = j.top || [];
          body.innerHTML = top.length ? top.map((u, i) => `
            <article class="hvm-row hvm-board"><span class="hvm-pos${i < 3 ? ' is-top' : ''}">${i + 1}</span>
              <img class="hvm-tier-sm" src="${A}tier-${tierOf(u.rank).id}.webp" alt="">
              <div class="hvm-main"><b>${h(u.user)}</b><small>${tierOf(u.rank).name} · Hạng ${fmt(u.rank)}</small></div>
              <small class="hvm-note">Lực chiến ${fmt(u.power)}</small></article>`).join('') : '<p class="hvm-empty">Server chưa có người chơi nào trên bảng.</p>';
        } catch (e) {
          if (sheetEl && sheetEl.dataset.hvm === 'board') body.innerHTML = `<p class="hvm-empty">Không tải được bảng xếp hạng: ${h(e.message)}</p>`;
        }
      })();
    }
  }

  function claimWeek() {
    const m = meta();
    if (!m.lastWeek || m.lastWeek.claimed) return;
    const t = tierOf(m.lastWeek.best);
    P.gold = (P.gold || 0) + t.reward.gold;
    P.gems = (P.gems || 0) + t.reward.gems;
    m.coins += t.reward.coins;
    m.lastWeek.claimed = true;
    save(); try { refreshResbar?.(); } catch (_) {}
    say('Nhận thưởng tuần ' + t.name + ': +' + fmt(t.reward.gold) + ' vàng, +' + t.reward.gems + ' ngọc, +' + t.reward.coins + ' xu');
    paintSheet('week'); decorate(true);
  }

  function buy(id) {
    const m = meta(), it = SHOP.find(x => x.id === id);
    if (!it) return;
    const used = m.shop.bought[id] || 0;
    if (used >= it.limit) return say('Hết lượt mua tuần này.');
    if (m.coins < it.cost) return say('Không đủ xu đấu trường.');
    m.coins -= it.cost;
    m.shop.bought[id] = used + 1;
    let msg = it.name;
    if (id === 'gold') P.gold = (P.gold || 0) + 2000;
    else if (id === 'gems') P.gems = (P.gems || 0) + 20;
    else if (id === 'stam') { try { refreshStamina?.(); } catch (_) {} P.stamina = (P.stamina || 0) + 30; }
    else if (id === 'shard') {
      const ids = Object.keys(DATA.heroes || {});
      const pick = ids[Math.floor(Math.random() * ids.length)];
      if (!P.shards) P.shards = {};
      P.shards[pick] = (P.shards[pick] || 0) + 10;
      msg = '10 mảnh ' + nm(pick);
    }
    save(); try { refreshResbar?.(); } catch (_) {}
    say('Đã mua: ' + msg);
    paintSheet('shop'); decorate(true);
  }

  // ---- gan vao man Dau Hang ----
  function decorate(force) {
    const list = document.querySelector('#hvArenaRoot [data-arena-pvp-list]');
    if (!list) return;
    const pane = list.parentElement;
    if (pane.dataset.hvmDone === '1' && !force) return;
    pane.dataset.hvmDone = '1';
    const m = meta();
    const sum = pane.querySelector('.hv-arp-me');
    if (sum) {
      const t = tierOf(P.arena?.rank);
      let tg = sum.querySelector('.hvm-tier-me');
      if (!tg) { tg = document.createElement('div'); tg.className = 'hvm-tier-me'; sum.prepend(tg); }
      tg.innerHTML = `<img src="${A}tier-${t.id}.webp" alt=""><em>${t.name}</em>`;
    }
    pane.querySelector('.hvm-bar')?.remove();
    const claim = !!(m.lastWeek && !m.lastWeek.claimed);
    const bar = document.createElement('div');
    bar.className = 'hvm-bar';
    bar.innerHTML = [
      ['log', A + 'row-frame.webp', 'Nhật ký', m.log.length ? m.log.length + ' trận' : 'Trống', false],
      ['board', A + 'tier-6.webp', 'Xếp hạng', 'Server', false],
      ['shop', A + 'coin.webp', 'Cửa hàng', fmt(m.coins) + ' xu', false],
      ['week', A + 'chest.webp', 'Thưởng tuần', claim ? 'Có quà' : tierOf(m.week.best).name, claim]
    ].map(([k, img, label, sub, dot]) => `<button type="button" class="hvm-tab${dot ? ' has-dot' : ''}" data-hvm-open="${k}" title="${label}: ${sub}"><i><img src="${img}" alt=""></i><b>${label}</b></button>`).join('');
    bar.querySelectorAll('[data-hvm-open]').forEach(b => b.addEventListener('click', () => openSheet(b.dataset.hvmOpen)));
    (pane.querySelector('.hv-arp-sum') || list).after(bar);
  }
  // Man tong quan: hang nut day kieu huy hieu tron + bang ten (giong game tham khao owner gui)
  function dock() {
    const root = document.getElementById('hvArenaRoot');
    if (!root) return;
    const show = root.classList.contains('is-open') && !root.classList.contains('is-tile-open');
    let d = root.querySelector(':scope > .hvm-dock');
    if (!show) { d?.remove(); return; }
    const mm = meta(), claim = !!(mm.lastWeek && !mm.lastWeek.claimed);
    const sig = mm.log.length + '|' + mm.coins + '|' + claim;
    if (d && d.dataset.sig === sig) return;
    if (!d) { d = document.createElement('nav'); d.className = 'hvm-dock'; root.append(d); }
    d.dataset.sig = sig;
    d.innerHTML = [['log', A + 'row-frame.webp', 'Nhật ký', false], ['board', A + 'tier-6.webp', 'Xếp hạng', false], ['shop', A + 'coin.webp', 'Cửa hàng', false], ['week', A + 'chest.webp', 'Thưởng tuần', claim]]
      .map(([k, img, label, dot]) => `<button type="button" class="hvm-dk${dot ? ' has-dot' : ''}" data-hvm-open="${k}"><i><img src="${img}" alt=""></i><b>${label}</b></button>`).join('');
    d.querySelectorAll('[data-hvm-open]').forEach(b => b.addEventListener('click', () => openSheet(b.dataset.hvmOpen)));
  }
  new MutationObserver(() => { decorate(false); dock(); }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  window.HV_ARENA_META = { meta, tierOf, TIERS, SHOP, openSheet, closeSheet, decorate };
})();
