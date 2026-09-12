(() => {
  if (typeof document === 'undefined' || !document.body) return;
  if (typeof prepareShopOpen !== 'function') return;

  function commitShop(next, commandId, source) {
    const run = typeof hvRunCommittedTransaction === 'function' ? hvRunCommittedTransaction : null;
    const apply = player => {
      if (next.shop) player.shop = next.shop;
      if (next.gold != null) player.gold = next.gold;
      if (next.gems != null) player.gems = next.gems;
      if (next.shards) player.shards = next.shards;
      if (next.stamina != null) player.stamina = next.stamina;
      if (next.tinh != null) player.tinh = next.tinh;
      if (next.hoat != null) player.hoat = next.hoat;
      return { ok: true };
    };
    if (!run) {
      apply(P);
      persist?.();
      return { ok: true };
    }
    return run({
      commandId: commandId || (source + ':' + (P.revision || 0)),
      source,
      reason: 'shop',
      mutate: apply
    });
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
    const ids = Object.keys(data);
    const ssr = typeof poolOf === 'function'
      ? poolOf('ssr')
      : ids.filter(id => data[id]?.rarity === 'ssr');
    const nonSsr = ids.filter(id => data[id] && data[id].rarity !== 'ssr');
    return { nonSsr, ssr };
  }

  function heroName(id) {
    return DATA?.heroes?.[id]?.name || id || 'Kẻ Mất Ngủ';
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
    body.innerHTML = `
      <div id="hvShopRoot" data-testid="hv-shop">
        <div class="hv-shop-top">
          <button type="button" class="hv-shop-back" data-shop-back aria-label="Về Thành Chính">‹</button>
          <b>Chợ Mộng</b>
          <div class="hv-shop-chips">
            <span class="hv-shop-chip" data-shop-gold>🪙 ${fmt(P.gold)}</span>
            <span class="hv-shop-chip" data-shop-gems>💎 ${fmt(P.gems)}</span>
          </div>
        </div>
        <div class="hv-shop-hero">
          <div class="hv-shop-kicker">Quầy đêm · đổi lúc nửa đêm</div>
          <div class="hv-shop-title" data-shop-title>Chợ Đêm Mộng</div>
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
        </div>
      </div>`;
    body.querySelector('[data-shop-back]')?.addEventListener('click', () => navTo('hub'));
    body.querySelectorAll('[data-shop-buy]').forEach(btn => {
      btn.addEventListener('click', () => buyShop(btn.dataset.shopBuy));
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
