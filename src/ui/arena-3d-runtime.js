(() => {
  if (typeof document === 'undefined' || !document.body) return;

  const hoist = () => {
    const root = document.getElementById('hvArenaRoot');
    if (!root) return null;
    if (root.parentElement !== document.body) document.body.append(root);
    root.setAttribute('aria-label', 'Đấu Trường');
    return root;
  };

  const syncOpen = name => {
    const root = hoist();
    if (!root) return;
    const open = name === 'arena';
    root.hidden = !open;
    root.classList.toggle('is-open', open);
    document.body.classList.toggle('arena-3d-active', open);
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

  syncOpen(typeof ST === 'object' ? ST.screen : '');
})();
