(() => {
  if (typeof document === 'undefined' || !document.body) return;

  const hoist = () => {
    const nodes = [...document.querySelectorAll('#hvDailyRoot')];
    if (!nodes.length) return null;
    nodes.slice(0, -1).forEach(node => node.remove());
    const root = nodes[nodes.length - 1];
    if (root.parentElement !== document.body) document.body.append(root);
    root.setAttribute('aria-label', 'Nhật Ký Mơ');
    return root;
  };

  const TILES = [
    { id: 'sign', name: 'Điểm danh', img: 'assets/ui/daily/tiles/diem-danh.jpg' },
    { id: 'nap', name: 'Chợp Mắt', img: 'assets/ui/daily/tiles/chop-mat.jpg' },
    { id: 'idle', name: 'Ca Trực', img: 'assets/ui/daily/tiles/ca-truc.jpg' },
    { id: 'quest', name: 'Việc Vặt', img: 'assets/ui/daily/tiles/viec-vat.jpg' },
    { id: 'week', name: 'Việc Tuần', img: 'assets/ui/daily/tiles/viec-tuan.jpg' },
    { id: 'journal', name: 'Nhật Ký', img: 'assets/ui/daily/tiles/nhat-ky.jpg' }
  ];

  const ensureCity = root => {
    if (!root) return;
    root.classList.add('hv-city');
    let city = root.querySelector('#hvDailyCity');
    if (!city) {
      city = document.createElement('div');
      city.id = 'hvDailyCity';
      city.innerHTML = TILES.map(t =>
        `<button type="button" class="hv-dtile" data-dcity="${t.id}"><img src="${t.img}" alt=""><b>${t.name}</b></button>`
      ).join('');
      root.append(city);
      city.addEventListener('click', ev => {
        const btn = ev.target.closest('[data-dcity]');
        if (!btn) return;
        root.dataset.dcity = btn.getAttribute('data-dcity');
        root.classList.add('is-tile-open');
      });
      root.addEventListener('click', ev => {
        if (!root.classList.contains('is-tile-open')) return;
        if (!ev.target.closest('[data-daily-back]')) return;
        ev.stopPropagation();
        root.classList.remove('is-tile-open');
        root.dataset.dcity = '';
      }, true);
    }
  };

  const syncOpen = name => {
    const root = hoist();
    if (!root) return;
    const open = name === 'daily';
    root.hidden = !open;
    root.classList.toggle('is-open', open);
    document.body.classList.toggle('daily-3d-active', open);
    if (open) ensureCity(root);
  };

  const baseShowScreen = showScreen;
  showScreen = function showScreenWithDaily3d(name) {
    baseShowScreen(name);
    syncOpen(ST.screen);
  };

  if (typeof renderDaily === 'function') {
    const baseRender = renderDaily;
    renderDaily = function renderDailyWith3d() {
      baseRender.apply(this, arguments);
      syncOpen(typeof ST === 'object' ? ST.screen : 'daily');
    };
  }

  syncOpen(typeof ST === 'object' ? ST.screen : '');
})();
