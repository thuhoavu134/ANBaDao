(() => {
  if (typeof document === 'undefined' || !document.body) return;

  const hoist = () => {
    const nodes = [...document.querySelectorAll('#hvShopRoot')];
    const root = nodes[nodes.length - 1] || null;
    if (!root) return null;
    nodes.forEach(el => { if (el !== root) el.remove(); });
    if (root.parentElement !== document.body) document.body.append(root);
    root.setAttribute('aria-label', 'Chợ Lục Châu');
    return root;
  };

  const syncOpen = name => {
    const root = hoist();
    if (!root) return;
    const open = name === 'shop';
    root.hidden = !open;
    root.classList.toggle('is-open', open);
    document.body.classList.toggle('shop-3d-active', open);
  };

  const baseShowScreen = showScreen;
  showScreen = function showScreenWithShop3d(name) {
    baseShowScreen(name);
    syncOpen(ST.screen);
  };

  if (typeof renderShop === 'function') {
    const baseRender = renderShop;
    renderShop = function renderShopWith3d() {
      baseRender.apply(this, arguments);
      syncOpen(typeof ST === 'object' ? ST.screen : 'shop');
    };
  }

  syncOpen(typeof ST === 'object' ? ST.screen : '');
})();
