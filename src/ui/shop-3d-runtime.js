(() => {
  if (typeof document === 'undefined' || !document.body) return;

  const TILES = [
    { id: 'night', name: 'Hắc Thị', img: 'assets/ui/shop/tiles/cho-dem.jpg' },
    { id: 'pts', name: 'Tụ Bảo Các', img: 'assets/ui/festival/bbr/shop-girl.jpg' }
  ];

  let prevCity = '';
  let prevTileOpen = false;

  const hoist = () => {
    const nodes = [...document.querySelectorAll('#hvShopRoot')];
    const root = nodes.find(el => el.parentElement === document.body) || nodes[nodes.length - 1] || null;
    if (!root) return null;
    nodes.forEach(el => { if (el !== root) el.remove(); });
    if (root.parentElement !== document.body) document.body.append(root);
    root.setAttribute('aria-label', 'Chợ Lục Châu');
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    return root;
  };

  const ensureCity = root => {
    if (!root) return;
    root.classList.add('hv-city');
    let city = root.querySelector('#hvShopCity');
    if (!city) {
      city = document.createElement('div');
      city.id = 'hvShopCity';
      root.append(city);
      city.addEventListener('click', ev => {
        if (ev.target.closest('[data-city-close]')) {
          ev.preventDefault();
          const x = root.querySelector('.hv-shopc-x');
          if (x) x.click();
          return;
        }
        const btn = ev.target.closest('[data-scity]');
        if (!btn) return;
        root.dataset.scity = btn.getAttribute('data-scity');
        root.classList.add('is-tile-open');
        prevCity = root.dataset.scity;
        prevTileOpen = true;
        if (typeof paintBbrShop === 'function') paintBbrShop();
      });
      window.hvShopCityBack = () => {
        root.classList.remove('is-tile-open');
        root.dataset.scity = '';
        prevCity = '';
        prevTileOpen = false;
      };
      if (!root.__shopBackBound) {
      root.__shopBackBound = true;
      root.addEventListener('click', ev => {
        if (!ev.target.closest('[data-shop-back]')) return;
        if (!root.classList.contains('is-tile-open')) return;
        ev.preventDefault();
        ev.stopImmediatePropagation();
        root.classList.remove('is-tile-open');
        root.dataset.scity = '';
        prevCity = '';
        prevTileOpen = false;
      }, true);
      }
    }
    const fmtN = n => Number(n || 0).toLocaleString('vi-VN');
    const bbrPts = (typeof P === 'object' && P && P.bachBao && P.bachBao.pts) || 0;
    // Owner 2026-11-03: market chooser on the approved Concept (lacquer frame, 2 painted gateways).
    city.innerHTML = `<div class="hv-cityf">
      <b class="hv-cityf-title">Chợ Lục Châu</b>
      <button type="button" class="hv-cityf-x" data-city-close aria-label="Đóng"></button>
      ${TILES.map((t, i) => `<button type="button" class="hv-stile hv-cityf-card c${i}" data-scity="${t.id}" aria-label="${t.name}" data-art="${t.img}"><span class="hv-cityf-plaque">${t.name}</span></button>`).join('')}
      <div class="hv-cityf-note">
        <p><b>Hắc Thị</b> · chợ đen giang hồ, 8 món mỗi ngày, đổi hàng lúc nửa đêm</p>
        <p><b>Tụ Bảo Các</b> · đổi Điểm tích từ Bách Bảo Rương lấy bảo vật</p>
        <p class="bal"><img src="assets/items/materials/gold.png" alt=""> ${fmtN(P.gold)} · <img src="assets/ui/menu-v3233/icons/resource-gem-imagen.png" alt=""> ${fmtN(P.gems)} · Điểm <b>${fmtN(bbrPts)}</b></p>
      </div>
    </div>`;
    let pts = root.querySelector('#hvShopPts');
    if (!pts) {
      pts = document.createElement('div');
      pts.id = 'hvShopPts';
      root.append(pts);
    }
  };

  const restoreCity = root => {
    if (!root) return;
    if (prevCity) {
      root.dataset.scity = prevCity;
      root.classList.toggle('is-tile-open', prevTileOpen);
    }
  };

  const syncOpen = name => {
    const root = hoist();
    if (!root) return;
    const open = name === 'shop';
    root.hidden = !open;
    root.classList.toggle('is-open', open);
    document.body.classList.toggle('shop-3d-active', open);
    if (open) {
      ensureCity(root);
      restoreCity(root);
      if (typeof paintBbrShop === 'function') paintBbrShop();
    }
  };

  const baseShowScreen = showScreen;
  showScreen = function showScreenWithShop3d(name) {
    // Real hub DOM behind the modal. Never substitute a concept image backdrop.
    baseShowScreen(name === 'shop' ? 'hub' : name);
    if (name === 'shop') ST.screen = 'shop';
    syncOpen(name);
  };

  if (typeof renderShop === 'function') {
    const baseRender = renderShop;
    renderShop = function renderShopWith3d() {
      const old = document.getElementById('hvShopRoot');
      if (old) {
        prevCity = old.dataset.scity || prevCity;
        prevTileOpen = old.classList.contains('is-tile-open');
      }
      baseRender.apply(this, arguments);
      syncOpen(typeof ST === 'object' ? ST.screen : 'shop');
    };
  }

  syncOpen(typeof ST === 'object' ? ST.screen : '');
})();
