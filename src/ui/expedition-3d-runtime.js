(() => {
  if (typeof document === 'undefined' || !document.body) return;

  const hoist = () => {
    const root = document.getElementById('hvExpeditionRoot');
    if (!root) return null;
    if (root.parentElement !== document.body) document.body.append(root);
    root.setAttribute('aria-label', 'Mộng Lộ');
    return root;
  };

  const syncOpen = name => {
    const root = hoist();
    if (!root) return;
    const open = name === 'expedition';
    root.hidden = !open;
    root.classList.toggle('is-open', open);
    document.body.classList.toggle('expedition-3d-active', open);
  };

  const baseShowScreen = showScreen;
  showScreen = function showScreenWithExpedition3d(name) {
    baseShowScreen(name);
    syncOpen(ST.screen);
  };

  if (typeof renderExpedition === 'function') {
    const baseRender = renderExpedition;
    renderExpedition = function renderExpeditionWith3d() {
      baseRender.apply(this, arguments);
      syncOpen(typeof ST === 'object' ? ST.screen : 'expedition');
    };
  }

  syncOpen(typeof ST === 'object' ? ST.screen : '');
})();
