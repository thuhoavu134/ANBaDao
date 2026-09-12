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

  const syncOpen = name => {
    const root = hoist();
    if (!root) return;
    const open = name === 'daily';
    root.hidden = !open;
    root.classList.toggle('is-open', open);
    document.body.classList.toggle('daily-3d-active', open);
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
