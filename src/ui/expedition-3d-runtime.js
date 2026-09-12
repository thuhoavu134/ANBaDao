(() => {
  if (typeof document === 'undefined' || !document.body) return;

  const hoist = () => {
    const root = document.getElementById('hvExpeditionRoot');
    if (!root) return null;
    if (root.parentElement !== document.body) document.body.append(root);
    root.setAttribute('aria-label', 'Mộng Lộ');
    return root;
  };

  const pinBack = root => {
    if (!root) return;
    let btn = root.querySelector('[data-expedition-back]');
    if (!btn) {
      btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'hv-exp-back';
      btn.setAttribute('data-expedition-back', '');
      btn.setAttribute('aria-label', 'Về Thành Chính');
      btn.textContent = '‹';
      root.prepend(btn);
    }
    btn.style.pointerEvents = 'auto';
  };

  const syncOpen = name => {
    const root = hoist();
    if (!root) return;
    const open = name === 'expedition';
    root.hidden = !open;
    root.classList.toggle('is-open', open);
    document.body.classList.toggle('expedition-3d-active', open);
    if (open) pinBack(root);
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

  const boot = hoist();
  if (boot && !boot.dataset.hvExpBack) {
    boot.dataset.hvExpBack = '1';
    boot.addEventListener('click', ev => {
      if (!ev.target.closest('[data-expedition-back]')) return;
      ev.preventDefault();
      navTo('hub');
    });
  }

  syncOpen(typeof ST === 'object' ? ST.screen : '');
})();
