(() => {
  if (typeof document === 'undefined' || !document.body) return;

  const hoist = () => {
    const root = document.getElementById('hvFestivalRoot');
    if (!root) return null;
    if (root.parentElement !== document.body) document.body.append(root);
    root.setAttribute('aria-label', 'Lễ Hội');
    return root;
  };

  const syncOpen = name => {
    const root = hoist();
    if (!root) return;
    const open = name === 'festival';
    root.hidden = !open;
    root.classList.toggle('is-open', open);
    document.body.classList.toggle('festival-3d-active', open);
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
