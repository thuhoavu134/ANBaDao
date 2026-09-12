(() => {
  if (typeof document === 'undefined' || !document.body) return;

  const hoist = () => {
    const root = document.getElementById('hvFestivalRoot');
    if (!root) return null;
    if (root.parentElement !== document.body) document.body.append(root);
    root.setAttribute('aria-label', 'Lễ Hội');
    return root;
  };

  const TILES = [
    { id: 'lamp', name: 'Hoa Đăng', img: 'assets/ui/festival/tiles/hoa-dang.jpg' },
    { id: 'wheel', name: 'Bách Bảo', img: 'assets/ui/festival/tiles/bach-bao.jpg' },
    { id: 'chest', name: 'Rương Báu', img: 'assets/ui/festival/tiles/ruong.jpg' }
  ];

  const ensureCity = root => {
    if (!root) return;
    root.classList.add('hv-city');
    let city = root.querySelector('#hvFestCity');
    if (!city) {
      city = document.createElement('div');
      city.id = 'hvFestCity';
      city.innerHTML = TILES.map(t =>
        `<button type="button" class="hv-ftile" data-fcity="${t.id}"><img src="${t.img}" alt=""><b>${t.name}</b></button>`
      ).join('');
      root.append(city);
      city.addEventListener('click', ev => {
        const btn = ev.target.closest('[data-fcity]');
        if (!btn) return;
        root.dataset.fcity = btn.getAttribute('data-fcity');
        root.classList.add('is-tile-open');
        paintVault(root);
      });
      root.addEventListener('click', ev => {
        if (!root.classList.contains('is-tile-open')) return;
        if (!ev.target.closest('[data-fest-back]')) return;
        ev.stopPropagation();
        root.classList.remove('is-tile-open');
        root.dataset.fcity = '';
      }, true);
    }
    paintVault(root);
  };

  function paintVault(root) {
    if (!root) return;
    let vault = root.querySelector('#hvFestVault');
    if (!vault) {
      vault = document.createElement('div');
      vault.id = 'hvFestVault';
      root.append(vault);
      vault.addEventListener('click', ev => {
        const btn = ev.target.closest('[data-vault-open]');
        if (!btn) return;
        const kind = btn.getAttribute('data-vault-open');
        if (typeof openBachBaoChest === 'function') openBachBaoChest(kind);
        else if (typeof honVietOpen === 'function') honVietOpen(kind);
        paintVault(root);
      });
    }
    const bb = (typeof P === 'object' && P.bachBao) || {};
    const n = bb.chests || 0;
    const s = bb.supreme || 0;
    vault.innerHTML = `
      <p class="hv-vault-note">Rương trúng ở Bách Bảo (bấm Thưởng) sẽ nằm đây. Mở để nhận mảnh / ngọc / đồ.</p>
      <div class="hv-vault-card">
        <img src="assets/ui/festival/bbr/chest.png" alt="">
        <div><b>Rương Báu ×${n}</b><p>Mảnh S · S+ · ngọc. Trúng ô rương gỗ trên vành.</p></div>
        <button type="button" data-vault-open="normal" ${n < 1 ? 'disabled' : ''}>Mở</button>
      </div>
      <div class="hv-vault-card">
        <img src="assets/ui/festival/bbr/supreme.png" alt="">
        <div><b>Rương Chí Bảo ×${s}</b><p>Mảnh S+ · đồ cực phẩm. Trúng ô giữa trên/dưới vành.</p></div>
        <button type="button" data-vault-open="supreme" ${s < 1 ? 'disabled' : ''}>Mở</button>
      </div>`;
  }

  const syncOpen = name => {
    const root = hoist();
    if (!root) return;
    const open = name === 'festival';
    root.hidden = !open;
    root.classList.toggle('is-open', open);
    document.body.classList.toggle('festival-3d-active', open);
    if (open) ensureCity(root);
  };

  const baseShowScreen = showScreen;
  showScreen = function showScreenWithFestival3d(name) {
    baseShowScreen(name);
    syncOpen(ST.screen);
  };

  if (typeof renderFestival === 'function') {
    const baseRender = renderFestival;
    renderFestival = function renderFestivalWith3d() {
      baseRender.apply(this, arguments);
      syncOpen(typeof ST === 'object' ? ST.screen : 'festival');
    };
  }

  syncOpen(typeof ST === 'object' ? ST.screen : '');
})();
