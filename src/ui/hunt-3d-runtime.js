(() => {
  if (typeof document === 'undefined' || !document.body) return;

  const hoist = () => {
    const root = document.getElementById('hvHuntRoot');
    if (!root) return null;
    if (root.parentElement !== document.body) document.body.append(root);
    root.setAttribute('aria-label', 'Săn Boss');
    return root;
  };

  const syncOpen = name => {
    const root = hoist();
    if (!root) return;
    const open = name === 'hunt';
    root.hidden = !open;
    root.classList.toggle('is-open', open);
    document.body.classList.toggle('hunt-3d-active', open);
  };

  const baseShowScreen = showScreen;
  showScreen = function showScreenWithHunt3d(name) {
    baseShowScreen(name);
    syncOpen(ST.screen);
  };

  if (typeof renderHunt === 'function') {
    const baseRender = renderHunt;
    renderHunt = function renderHuntWith3d() {
      baseRender.apply(this, arguments);
      syncOpen(typeof ST === 'object' ? ST.screen : 'hunt');
    };
  }

  syncOpen(typeof ST === 'object' ? ST.screen : '');
})();
