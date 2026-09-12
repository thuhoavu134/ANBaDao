(() => {
  if (typeof document === 'undefined' || !document.body) return;

  let openTile = '';

  const hoist = () => {
    const nodes = [...document.querySelectorAll('#hvArenaRoot')];
    if (!nodes.length) return null;
    nodes.slice(0, -1).forEach(n => n.remove());
    const root = nodes[nodes.length - 1];
    if (root.parentElement !== document.body) document.body.append(root);
    root.setAttribute('aria-label', 'Đấu Trường');
    return root;
  };

  const fab = () => {
    let el = document.getElementById('hvArenaBackFab');
    if (el) return el;
    el = document.createElement('button');
    el.id = 'hvArenaBackFab';
    el.type = 'button';
    el.setAttribute('aria-label', 'Về Thành Chính');
    el.textContent = '‹';
    document.body.append(el);
    el.addEventListener('click', ev => {
      ev.preventDefault();
      ev.stopPropagation();
      openTile = '';
      if (typeof navTo === 'function') navTo('hub');
      syncOpen('hub');
    });
    return el;
  };

  const TILES = [
    { id: 'season', name: 'Mùa', img: 'assets/ui/arena/tiles/mua.jpg' },
    { id: 'pvp', name: 'Đấu Hạng', img: 'assets/ui/arena/tiles/dau-hang.jpg' },
    { id: 'pve', name: 'Võ Đài', img: 'assets/ui/arena/tiles/vo-dai.jpg' }
  ];

  const ensureCity = root => {
    if (!root) return;
    root.classList.add('hv-city');
    if (openTile) {
      root.dataset.acity = openTile;
      root.classList.add('is-tile-open');
    } else {
      root.dataset.acity = '';
      root.classList.remove('is-tile-open');
    }
    let city = root.querySelector('#hvArenaCity');
    if (!city) {
      city = document.createElement('div');
      city.id = 'hvArenaCity';
      city.innerHTML = TILES.map(t =>
        `<button type="button" class="hv-atile" data-acity="${t.id}"><img src="${t.img}" alt=""><b>${t.name}</b></button>`
      ).join('');
      root.append(city);
      city.addEventListener('click', ev => {
        const btn = ev.target.closest('[data-acity]');
        if (!btn) return;
        openTile = btn.getAttribute('data-acity');
        if (typeof ST === 'object') ST.arenaTab = openTile;
        if (typeof renderArena === 'function') renderArena();
      });
      root.addEventListener('click', ev => {
        if (!ev.target.closest('[data-arena-back]')) return;
        if (openTile) {
          ev.stopPropagation();
          openTile = '';
          root.classList.remove('is-tile-open');
          root.dataset.acity = '';
          return;
        }
        ev.preventDefault();
        if (typeof navTo === 'function') navTo('hub');
        syncOpen('hub');
      }, true);
    }
  };

  const syncOpen = name => {
    const root = hoist();
    const open = name === 'arena';
    if (root) {
      root.hidden = !open;
      root.classList.toggle('is-open', open);
      if (open) ensureCity(root);
    }
    document.body.classList.toggle('arena-3d-active', open);
    const battle = document.getElementById('hvBattleOverlay');
    const inBattle = !!(battle && battle.classList.contains('is-open'));
    fab().classList.remove('is-on');
  };

  const baseShowScreen = showScreen;
  showScreen = function showScreenWithArena3d(name) {
    baseShowScreen(name);
    syncOpen(ST.screen);
  };

  if (typeof renderArena === 'function') {
    const baseRender = renderArena;
    renderArena = function renderArenaWith3d() {
      baseRender.apply(this, arguments);
      syncOpen(typeof ST === 'object' ? ST.screen : 'arena');
    };
  }

  fab();
  syncOpen(typeof ST === 'object' ? ST.screen : '');
})();
