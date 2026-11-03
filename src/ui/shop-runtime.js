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
      if (it.k === 'binh_tinh') return 'assets/items/materials/tinh-luc.png';
      if (it.k === 'lo_hoat') return 'assets/items/materials/hoat-luc.png';
      return 'assets/ui/menu-v3233/icons/forge.png';
    }
    if (it.type === 'gold') return 'assets/items/materials/gold.png';
    if (it.type === 'stam') return 'assets/ui/menu-v3233/icons/daily.png';
    return 'assets/ui/menu-v3233/icons/summon.png';
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
    hunt: { name: 'Săn Boss', go: 'hunt' },
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

  function hideTip() {
    const tip = document.getElementById('hvItemTip');
    if (!tip) return;
    tip.hidden = true;
    tip.classList.remove('is-open');
  }

  function goScreen(name) {
    hideTip();
    if (typeof navTo === 'function') navTo(name);
    else if (typeof showScreen === 'function') showScreen(name);
  }

  function paintTip() {
    const tip = document.getElementById('hvItemTip');
    if (!tip || !tipInfo) return;
    const info = tipInfo;
    const how = (info.how || []).map(id => SRC[id]).filter(Boolean);
    const icon = info.icon
      ? `<img src="${info.icon}" alt="">`
      : `<span class="hv-tip-ic">${info.ic || '◆'}</span>`;
    const stars = Math.max(0, Math.min(5, Number(info.stars) || 0));
    const starHtml = stars ? `<span class="hv-tip-stars">${'★'.repeat(stars)}</span>` : '';
    const rcls = String(info.cls || '').replace(/^.*?(t-[a-z]+).*$/, '$1') || 't-mat';
    const RL = { 't-ssr': 'Huyền thoại · SSR', 't-ss': 'Sử thi · SS', 't-s': 'Hiếm · S', 't-a': 'Tinh xảo · A', 't-b': 'Thường · B' };
    const rarTxt = RL[rcls] || 'Vật phẩm';
    const lvl = info.lvl != null ? Number(info.lvl) : null;
    const kind = info.kind || (info.tone === 'shard' ? 'Mảnh tướng' : 'Vật phẩm');
    const qty = info.qty != null ? (typeof fmtN === 'function' ? fmtN(info.qty) : info.qty) : '—';
    // Chỉ số lấy đúng hệ thống trang bị (giống bảng thông tin ô đồ): chỉ số chính, khuôn, dòng phụ.
    const it = info.item || null;
    const maxLvl = it && typeof gearMaxLvl === 'function' ? gearMaxLvl(it) : 15;
    let rows = [];
    let moldTxt = '';
    if (it) {
      const sn = (typeof DATA !== 'undefined' && DATA.items && DATA.items.statName && DATA.items.statName[it.slot]) || '';
      const sv = typeof itemStat === 'function' ? itemStat(it) : 0;
      if (sn) rows.push({ k: sn.charAt(0) + sn.slice(1).toLowerCase(), v: '+' + Number(sv).toLocaleString('vi-VN') });
      const mold = (typeof FORGE_MOLDS !== 'undefined' && it.mold && FORGE_MOLDS[it.mold]) ? FORGE_MOLDS[it.mold] : null;
      if (mold) moldTxt = `<b class="tf-mold">${mold.name}</b> ${mold.desc || ''}`;
      const aff = typeof affixLines === 'function' ? affixLines(it) : [];
      for (const a of aff) { if (rows.length >= 4) break; const m = String(a.text || '').match(/^([+\-]?\d[\d.,]*%?)\s+(.+)$/); rows.push({ k: m ? m[2] : a.text, v: m ? m[1] : '', sp: !!a.special }); }
    }
    if (!rows.length) rows = [{ k: 'Loại', v: kind }, { k: 'Phẩm cấp', v: rarTxt }, { k: 'Sở hữu', v: qty }, { k: 'Cách dùng', v: info.action || '—' }];
    const srcs = how.slice(0, 2).map((s, k) => `<button type="button" class="hv-tip-src tf-c${k}" data-tip-go="${s.go}">${s.name}</button>`).join('');
    tip.innerHTML = `<div class="hv-tip-card hv-tipf">
      <button type="button" class="hv-tip-x" data-tip-close aria-label="Đóng">×</button>
      <div class="hv-tip-head">
        <div class="tf-art ${rcls}">${icon}${starHtml}</div>
        <b class="tf-name">${info.title || ''}</b>
        <span class="tf-strip ${rcls}">${rarTxt}</span>
        <div class="tf-meta"><span>${kind}</span><span>Sở hữu: ${qty}</span></div>
      </div>
      <div class="hv-tip-body">
        <div class="tf-rows">${rows.map(r => `<div class="tf-row${r.sp ? ' sp' : ''}"><span>${r.k}</span><b>${r.v}</b></div>`).join('')}</div>
        <div class="tf-bar"><em style="width:${lvl != null ? Math.max(0, Math.min(100, lvl / maxLvl * 100)) : 0}%"></em></div>
        <div class="tf-barv">${lvl != null ? `+${lvl}/${maxLvl}` : '—'}</div>
        <div class="tf-desc">${moldTxt ? moldTxt + '<br>' : ''}${info.use || info.what || ''}</div>
        <h4 class="hv-tip-how-title" data-tip-how>Cách nhận</h4>
        ${srcs}
      </div>
      ${info.action ? `<button type="button" class="hv-tip-act" data-tip-act>${info.action}</button>` : ''}
      <button type="button" class="tf-close" data-tip-close>Đóng</button>
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
        if (ev.target.closest('[data-tip-how]')) return;
        const go = ev.target.closest('[data-tip-go]');
        if (go) {
          goScreen(go.getAttribute('data-tip-go'));
          return;
        }
        if (ev.target.closest('[data-tip-act]')) {
          const k = tipInfo && tipInfo.buyKey;
          hideTip();
          if (k && typeof buyShop === 'function') buyShop(k);
          else if (tipInfo && tipInfo.go) goScreen(tipInfo.go);
          return;
        }
        if (ev.target === tip || ev.target.closest('[data-tip-close]')) hideTip();
      });
    }
    tipInfo = info || {};
    tip.hidden = false;
    tip.classList.add('is-open');
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
    const GEM_ICO = 'assets/ui/menu-v3233/icons/resource-gem-imagen.png';
    const CARD_X = [8.368, 29.289, 50.209, 71.13];
    const CARD_Y = [29.397, 52.01];
    const tone = it => {
      if (it.type === 'shards') {
        const rr = DATA?.heroes?.[it.hero]?.rarity;
        return (rr === 'ssr' || rr === 'ss') ? 'gold' : 'purple';
      }
      if (it.type === 'craftpack') return 'purple';
      return 'blue';
    };
    const costHtml = it => it.gold
      ? `<img class="hv-cur-ico" src="assets/items/materials/gold.png" alt="">${fmt(it.gold)}`
      : `<img class="hv-cur-ico" src="${GEM_ICO}" alt="">${fmt(it.gems)}`;
    const inner = `
        <button type="button" class="hv-shopc-x" data-shop-back aria-label="Đóng">×</button>
        <b class="hv-shopc-title">Chợ Lục Châu</b>
        <div class="hv-shopf">
          <button type="button" class="hv-shop-back" data-shop-back aria-label="Về Thành Chính"></button>
          <b class="hv-shopf-title" data-shop-title>Hắc Thị</b>
          <span class="hv-shop-chip hv-shopf-pill g" data-shop-gold><img class="hv-cur-ico" src="assets/items/materials/gold.png" alt=""> ${fmt(P.gold)}</span>
          <span class="hv-shop-chip hv-shopf-pill m" data-shop-gems><img class="hv-cur-ico" src="${GEM_ICO}" alt=""> ${fmt(P.gems)}</span>
          <div class="hv-shop-shelf" data-shop-shelf>
            ${(shop.stock || []).slice(0, 8).map((it, i) => {
              const out = (shop.bought || []).includes(it.k);
              return `<article class="hv-shop-card t-${tone(it)}${out ? ' is-sold' : ''}" data-shop-card="${it.k}" style="left:${CARD_X[i % 4]}%;top:${CARD_Y[i >> 2]}%" title="${stallWhat(it)}">
                <span class="hv-shopf-ic"><img src="${stallIcon(it)}" alt="">${it.qty ? `<em>x${fmt(it.qty)}</em>` : ''}</span>
                <b>${it.name}</b>
                <span class="hv-shopf-price" data-shop-price="${it.k}">${out ? 'Đã mua hôm nay' : costHtml(it)}</span>
                <button type="button" class="hv-shop-buy" data-shop-buy="${it.k}" ${out ? 'disabled' : ''}>${out ? 'ĐÃ MUA' : 'MUA'}</button>
              </article>`;
            }).join('')}
          </div>
          <div class="hv-shopf-res">
            <span class="r1" title="Tinh lực">${fmt(P.tinh || 0)}</span>
            <span class="r2" title="Hoạt lực">${fmt(P.hoat || 0)}</span>
            <span class="r3" title="Độ tỉnh táo">${fmt(P.stamina || 0)}</span>
          </div>
          <span class="hv-shopf-pill c" data-shop-sold>Đã mua <b>${sold}/8</b></span>
          <div class="hv-shop-note"><span>Mỗi món một lần mỗi ngày · Đổi hàng lúc nửa đêm<br>Tinh/Hoạt mua ở chợ có giới hạn mỗi ngày</span></div>
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
    root.classList.add('is-open', 'hv-shopl');
    root.querySelectorAll('[data-shop-back]').forEach(el => el.addEventListener('click', ev => {
      ev.preventDefault();
      ev.stopPropagation();
      closeShop();
    }));
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
