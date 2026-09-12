(() => {
  if (typeof document === 'undefined' || !document.body) return;
  if (typeof prepareShopOpen !== 'function') return;

  function commitShop(next, commandId, source) {
    if (next.shop) P.shop = next.shop;
    if (next.gold != null) P.gold = next.gold;
    if (next.gems != null) P.gems = next.gems;
    if (next.shards) P.shards = next.shards;
    if (next.stamina != null) P.stamina = next.stamina;
    if (next.tinh != null) P.tinh = next.tinh;
    if (next.hoat != null) P.hoat = next.hoat;
    persist?.();
    const run = typeof hvRunCommittedTransaction === 'function' ? hvRunCommittedTransaction : null;
    if (run) {
      run({
        commandId: commandId || (source + ':' + (P.revision || 0)),
        source,
        reason: 'shop',
        mutate: () => ({ ok: true })
      });
    }
    return { ok: true };
  }

  function liveShopRoot() {
    const nodes = [...document.querySelectorAll('#hvShopRoot')];
    const keep = nodes[nodes.length - 1] || null;
    nodes.forEach(el => { if (keep && el !== keep) el.remove(); });
    return keep;
  }

  function closeShop() {
    document.querySelectorAll('#hvShopRoot').forEach(el => {
      el.hidden = true;
      el.classList.remove('is-open');
    });
    document.body.classList.remove('shop-3d-active');
    if (typeof navTo === 'function') navTo('hub');
    else if (typeof showScreen === 'function') showScreen('hub');
  }

  function adoptShop(opened) {
    if (!opened?.ok || !opened.shop) return;
    P.shop = opened.shop;
    if (opened.refreshed) persist?.();
  }

  function fmt(n) {
    return Number(n || 0).toLocaleString('vi-VN');
  }

  function dayNow() {
    return typeof today === 'function' ? today() : (typeof shopDayIndex === 'function' ? shopDayIndex() : 0);
  }

  function heroCatalog() {
    const data = typeof DATA === 'object' && DATA?.heroes ? DATA.heroes : {};
    const ids = (typeof OFFICIAL_ROSTER_12_IDS !== 'undefined' && OFFICIAL_ROSTER_12_IDS.length)
      ? OFFICIAL_ROSTER_12_IDS.slice()
      : Object.keys(data);
    const ssr = ids.filter(id => data[id]?.rarity === 'ssr' || data[id]?.rarity === 'ss');
    const nonSsr = ids.filter(id => data[id] && data[id].rarity !== 'ssr' && data[id].rarity !== 'ss');
    return { nonSsr, ssr };
  }

  function heroName(id) {
    return DATA?.heroes?.[id]?.name || id || 'Người Giữ Ấn';
  }

  function stallIcon(it) {
    if (it.type === 'craftpack') {
      if (it.k === 'binh_tinh') return 'https://luc-than.vercel.app/assets/items/materials/tinh-luc.png';
      if (it.k === 'lo_hoat') return 'https://luc-than.vercel.app/assets/items/materials/hoat-luc.png';
      return 'https://luc-than.vercel.app/assets/ui/menu-v3233/icons/forge.png';
    }
    if (it.type === 'gold') return 'https://luc-than.vercel.app/assets/ui/menu-v3233/icons/bag.png';
    if (it.type === 'stam') return 'https://luc-than.vercel.app/assets/ui/menu-v3233/icons/daily.png';
    return 'https://luc-than.vercel.app/assets/ui/menu-v3233/icons/summon.png';
  }

  function stallWhat(it) {
    if (it.type === 'shards') return it.qty + ' mảnh ' + heroName(it.hero);
    if (it.type === 'stam') return '+' + it.qty + '⚡ Độ Tỉnh Táo';
    if (it.type === 'craftpack') {
      const a = it.tinh ? ('⚗ ' + it.tinh) : '';
      const b = it.hoat ? ('🔥 ' + it.hoat) : '';
      return [a, b].filter(Boolean).join(' + ') || 'Tinh/Hoạt';
    }
    return '+🪙 ' + it.qty + ' vàng';
  }

  function stallCost(it) {
    return it.gold ? ('🪙 ' + fmt(it.gold)) : ('💎 ' + fmt(it.gems));
  }

  const SRC = {
    shop: { name: 'Chợ Lục Châu', go: 'shop' },
    forge: { name: 'Rèn', go: 'forge' },
    fest: { name: 'Bách Bảo Rương', go: 'festival' },
    camp: { name: 'Chinh chiến', go: 'campaign' },
    daily: { name: 'Nhiệm vụ ngày', go: 'daily' },
    arena: { name: 'Đấu trường', go: 'arena' },
    hunt: { name: 'Săn', go: 'hunt' },
    mail: { name: 'Hòm thư', go: 'mail' },
    summon: { name: 'Gọi tướng', go: 'summon' },
    jobs: { name: 'Giao việc', go: 'jobs' }
  };

  const TIPS = {
    sh10: {
      what: 'Mảnh tướng 12 chính tuyến.',
      use: 'Đủ mảnh thì mở tướng (B 10 · A 20 · S 30 · S+ 50). Thêm mảnh để lên sao, tăng lực chiến.',
      tone: 'shard', how: ['shop', 'fest', 'summon', 'camp']
    },
    sh5ssr: {
      what: 'Mảnh tướng phẩm S+.',
      use: 'Đủ 50 mảnh mở tướng S+. Thêm mảnh lên sao. Dùng ở Đội hình / chi tiết tướng.',
      tone: 'shard', how: ['shop', 'fest', 'summon']
    },
    stam: {
      what: 'Độ Tỉnh Táo — thể lực đánh trận.',
      use: 'Tiêu khi Chinh chiến, Tháp, Săn, Đài. Tự hồi +1 mỗi 5 phút, trần 120.',
      tone: 'stam', how: ['shop', 'daily', 'camp']
    },
    gold: {
      what: 'Vàng — tiền tệ chính.',
      use: 'Lên cấp tướng, trả rèn/cường hoá, mua quầy vàng.',
      tone: 'gold', how: ['camp', 'daily', 'mail', 'fest']
    },
    craft: {
      what: 'Túi Tinh Lực + Hoạt Lực.',
      use: 'Rèn trang bị (20 Tinh/lần). Chế 10 sò Bách Bảo (25 Tinh + 25 Hoạt, 2 lần/ngày).',
      tone: 'craft', how: ['shop', 'daily', 'fest']
    },
    binh_tinh: {
      what: 'Bình Tinh Lực.',
      use: 'Rèn đồ (20/lần) hoặc chế sò ở Rèn (25/lần).',
      tone: 'craft', how: ['shop', 'daily', 'fest']
    },
    lo_hoat: {
      what: 'Lò Hoạt Lực.',
      use: 'Cường hoá trang bị ở Rèn, hoặc chế sò Bách Bảo (25 Hoạt).',
      tone: 'craft', how: ['shop', 'fest']
    },
    goi_ngoc: {
      what: 'Gói Tinh Hoả — 80 Tinh + 80 Hoạt.',
      use: 'Dự trữ ngày thiếu. Đổ vào Rèn / chế sò. Trần mua 1 lần/ngày.',
      tone: 'gem', how: ['shop']
    }
  };

  let tipInfo = null;
  let tipView = 'item';

  function goScreen(name) {
    const tip = document.getElementById('hvItemTip');
    if (tip) tip.hidden = true;
    if (typeof navTo === 'function') navTo(name);
    else if (typeof showScreen === 'function') showScreen(name);
  }

  function paintTip() {
    const tip = document.getElementById('hvItemTip');
    if (!tip || !tipInfo) return;
    const info = tipInfo;
    const how = (info.how || []).map(id => SRC[id]).filter(Boolean);
    if (tipView === 'how') {
      tip.innerHTML = `<div class="hv-tip-card" id="hvShopInfo">
        <div class="hv-tip-head t-${info.tone || 'gold'}">
          ${info.icon ? `<img src="${info.icon}" alt="">` : ''}
          <b>${info.title || ''}</b>
          <small>Số lượng sở hữu: ${info.qty != null ? info.qty : '—'}</small>
        </div>
        <div class="hv-tip-body">
          <p>${info.use || info.what || ''}</p>
          ${how.map(s => `<div class="hv-tip-src"><span>${s.name}</span><button type="button" data-tip-go="${s.go}">Đi</button></div>`).join('') || '<p>Chưa có nguồn nhận.</p>'}
        </div>
        <p class="hv-tip-hint">Nhấn vị trí bất kỳ để đóng</p>
      </div>`;
      return;
    }
    tip.innerHTML = `<div class="hv-tip-card" id="hvShopInfo">
      <div class="hv-tip-head t-${info.tone || 'gold'}">
        ${info.icon ? `<img src="${info.icon}" alt="">` : `<span class="hv-tip-ic">${info.ic || '◆'}</span>`}
        <b>${info.title || ''}</b>
        <small>Số lượng sở hữu: ${info.qty != null ? info.qty : '—'}</small>
        <button type="button" class="hv-tip-how" data-tip-how>Cách nhận ⌕</button>
      </div>
      <div class="hv-tip-body">
        <p>${info.use || info.what || ''}</p>
        ${info.action ? `<button type="button" class="hv-tip-act" data-tip-act>${info.action}</button>` : ''}
      </div>
      <p class="hv-tip-hint">Nhấn vị trí bất kỳ để đóng</p>
    </div>`;
  }

  window.hvShowItemTip = function hvShowItemTip(info) {
    let tip = document.getElementById('hvItemTip');
    if (!tip) {
      tip = document.createElement('div');
      tip.id = 'hvItemTip';
      tip.setAttribute('role', 'dialog');
      document.body.append(tip);
      tip.addEventListener('click', ev => {
        if (ev.target.closest('[data-tip-how]')) {
          tipView = 'how';
          paintTip();
          return;
        }
        const go = ev.target.closest('[data-tip-go]');
        if (go) {
          goScreen(go.getAttribute('data-tip-go'));
          return;
        }
        if (ev.target.closest('[data-tip-act]')) {
          const k = tipInfo && tipInfo.buyKey;
          tip.hidden = true;
          if (k && typeof buyShop === 'function') buyShop(k);
          else if (tipInfo && tipInfo.go) goScreen(tipInfo.go);
          return;
        }
        if (ev.target === tip || ev.target.closest('[data-tip-close]')) {
          tip.hidden = true;
        }
      });
    }
    tipInfo = info || {};
    tipView = 'item';
    tip.hidden = false;
    paintTip();
  };

  function showUse(k) {
    const it = (P.shop && P.shop.stock || []).find(x => x.k === k);
    const tip = TIPS[k] || { what: 'Vật phẩm ngày.', use: 'Xem mô tả trên thẻ.', tone: 'gold', how: ['shop'] };
    const sold = (P.shop && P.shop.bought || []).includes(k);
    let qty = 0;
    if (it?.type === 'shards') qty = (P.shards && it.hero && P.shards[it.hero]) || 0;
    else if (it?.type === 'stam') qty = P.stamina || 0;
    else if (it?.type === 'gold') qty = P.gold || 0;
    else if (it?.type === 'craftpack') qty = (P.tinh || 0);
    window.hvShowItemTip({
      icon: it ? stallIcon(it) : '',
      title: it?.name || k,
      what: tip.what,
      use: tip.use,
      tone: tip.tone,
      how: tip.how,
      qty,
      action: sold ? '' : 'Mua',
      buyKey: sold ? '' : k
    });
  }

  function openArgs() {
    return { day: dayNow(), heroes: heroCatalog(), rng: Math.random.bind(Math), stamCap: DATA?.daily?.stamCap || 120 };
  }

  function currentShop() {
    const opened = prepareShopOpen(P, openArgs());
    return opened.ok ? opened : { ok: false, shop: typeof normalizeShop === 'function' ? normalizeShop(P.shop) : (P.shop || emptyShop()) };
  }

  function renderLacquer() {
    const screen = document.getElementById('shopScreen');
    const body = document.getElementById('shopBody');
    if (!body) return;
    screen?.classList.add('hv-shop-live');
    const opened = currentShop();
    adoptShop(opened);
    const shop = opened.shop || P.shop;
    const sold = shop.bought?.length || 0;
    const inner = `
        <div class="hv-shop-top">
          <button type="button" class="hv-shop-back" data-shop-back aria-label="Về Thành Chính">‹</button>
          <b>Chợ Lục Châu</b>
          <div class="hv-shop-chips">
            <span class="hv-shop-chip" data-shop-gold>🪙 ${fmt(P.gold)}</span>
            <span class="hv-shop-chip" data-shop-gems>💎 ${fmt(P.gems)}</span>
          </div>
        </div>
        <div class="hv-shop-hero">
          <div class="hv-shop-kicker">Quầy đêm · đổi lúc nửa đêm</div>
          <div class="hv-shop-title" data-shop-title>Chợ Đêm</div>
          <div class="hv-shop-best">Đã mua ${sold}/8 hôm nay · Tinh/Hoạt có trần</div>
        </div>
        <div class="hv-shop-panel">
          <p class="hv-shop-copy">Mỗi món một lần/ngày. Không bán tăng lực chiến vô hạn.</p>
          <div class="hv-shop-shelf" data-shop-shelf>
            ${(shop.stock || []).map(it => {
              const out = (shop.bought || []).includes(it.k);
              return `<article class="hv-shop-card${out ? ' is-sold' : ''}" data-shop-card="${it.k}">
                <img src="${stallIcon(it)}" alt="">
                <b>${it.name}</b>
                <small>${stallWhat(it)}</small>
                <span data-shop-price="${it.k}">${out ? 'Đã mua hôm nay' : stallCost(it)}</span>
                <button type="button" class="hv-shop-buy" data-shop-buy="${it.k}" ${out ? 'disabled' : ''}>${out ? 'Hết hàng' : 'Mua ngay'}</button>
              </article>`;
            }).join('')}
          </div>
          <div class="hv-shop-note">⚗ Tinh ${fmt(P.tinh || 0)} · 🔥 Hoạt ${fmt(P.hoat || 0)} · ⚡ ${fmt(P.stamina || 0)}</div>
        </div>`;
    let root = liveShopRoot();
    if (!root) {
      body.innerHTML = `<div id="hvShopRoot" data-testid="hv-shop">${inner}</div>`;
      root = body.querySelector('#hvShopRoot');
    } else {
      root.innerHTML = inner;
    }
    if (root && root.parentElement !== document.body) document.body.append(root);
    root.hidden = false;
    root.classList.add('is-open');
    root.querySelector('[data-shop-back]')?.addEventListener('click', ev => {
      ev.preventDefault();
      ev.stopPropagation();
      closeShop();
    });
    root.querySelectorAll('[data-shop-buy]').forEach(btn => {
      btn.addEventListener('click', ev => {
        ev.preventDefault();
        ev.stopPropagation();
        buyShop(btn.getAttribute('data-shop-buy'));
      });
    });
    root.querySelectorAll('[data-shop-card]').forEach(card => {
      card.addEventListener('click', () => showUse(card.getAttribute('data-shop-card')));
    });
  }

  const baseEnsure = typeof ensureShop === 'function' ? ensureShop : null;
  ensureShop = function honVietShopEnsure() {
    const opened = prepareShopOpen(P, openArgs());
    if (!opened.ok) {
      if (baseEnsure) return baseEnsure();
      return;
    }
    adoptShop(opened);
  };

  const baseRender = typeof renderShop === 'function' ? renderShop : null;
  renderShop = function honVietShopRender() {
    if (typeof refreshStamina === 'function') refreshStamina();
    renderLacquer();
    if (!document.getElementById('hvShopRoot') && baseRender) baseRender();
  };

  const baseBuy = typeof buyShop === 'function' ? buyShop : null;
  buyShop = function honVietShopBuy(k) {
    if (typeof refreshStamina === 'function') refreshStamina();
    const result = prepareShopBuy(P, k, openArgs());
    if (!result.ok) {
      toast?.(result.message);
      return;
    }
    if (commitShop(result, 'shop.buy:' + k + ':' + result.shop.day, 'shop.buy').ok) {
      questProgress?.('shop', 1);
      refreshResbar?.();
      toast?.('Đã mua: ' + (result.item?.name || 'món chợ'));
      renderShop();
    } else if (baseBuy) {
      return baseBuy(k);
    }
  };

  window.HonVietShop = {
    render: renderShop,
    buy: buyShop
  };
})();
