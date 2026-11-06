(() => {
  if (typeof document === 'undefined' || !document.body) return;

  const hoist = () => {
    const root = document.getElementById('hvTowerRoot');
    if (!root) return null;
    if (root.parentElement !== document.body) document.body.append(root);
    root.setAttribute('aria-label', 'Thông Thiên Tháp');
    return root;
  };

  const syncOpen = name => {
    const root = hoist();
    if (!root) return;
    const open = name === 'tower';
    root.hidden = !open;
    root.classList.toggle('is-open', open);
    document.body.classList.toggle('tower-3d-active', open);
  };

  const baseShowScreen = showScreen;
  showScreen = function showScreenWithTower3d(name) {
    baseShowScreen(name);
    syncOpen(ST.screen);
  };

  if (typeof renderTower === 'function') {
    const baseRender = renderTower;
    renderTower = function renderTowerWith3d() {
      baseRender.apply(this, arguments);
      syncOpen(typeof ST === 'object' ? ST.screen : 'tower');
    };
  }

  syncOpen(typeof ST === 'object' ? ST.screen : '');
})();
