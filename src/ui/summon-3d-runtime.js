(() => {
  if (typeof document === 'undefined' || !document.body) return;

  const hoist = () => {
    const root = document.getElementById('hvSummonRoot');
    if (!root) return null;
    if (root.parentElement !== document.body) document.body.append(root);
    root.setAttribute('aria-label', 'Gọi Mộng');
    return root;
  };

  const syncOpen = name => {
    const root = hoist();
    if (!root) return;
    const open = name === 'summon';
    root.hidden = !open;
    root.classList.toggle('is-open', open);
    document.body.classList.toggle('summon-3d-active', open);
  };

  const baseShowScreen = showScreen;
  showScreen = function showScreenWithSummon3d(name) {
    baseShowScreen(name);
    syncOpen(ST.screen);
  };

  if (typeof renderSummon === 'function') {
    const baseRender = renderSummon;
    renderSummon = function renderSummonWith3d() {
      baseRender.apply(this, arguments);
      syncOpen(typeof ST === 'object' ? ST.screen : 'summon');
    };
  }

  syncOpen(typeof ST === 'object' ? ST.screen : '');
})();
