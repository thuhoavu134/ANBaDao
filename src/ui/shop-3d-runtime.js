(() => {
  if (typeof document === 'undefined' || !document.body) return;

  const TILES = [
    { id: 'night', name: 'Chợ Đêm', img: 'assets/ui/shop/tiles/cho-dem.jpg' },
    { id: 'pts', name: 'Shop điểm', img: 'assets/ui/festival/bbr/shop-girl.jpg' }
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
        const btn = ev.target.closest('[data-scity]');
        if (!btn) return;
        root.dataset.scity = btn.getAttribute('data-scity');
        root.classList.add('is-tile-open');
        prevCity = root.dataset.scity;
        prevTileOpen = true;
        if (typeof paintBbrShop === 'function') paintBbrShop();
      });
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
    city.innerHTML = TILES.map(t =>
      `<button type="button" class="hv-stile" data-scity="${t.id}"><img src="${t.img}" alt="${t.name}"><b>${t.name}</b></button>`
    ).join('');
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
    baseShowScreen(name);
    syncOpen(ST.screen);
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
