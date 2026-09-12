(() => {
  if (typeof document === 'undefined' || !document.body) return;

  const hoist = () => {
    const root = document.getElementById('hvExpeditionRoot');
    if (!root) return null;
    if (root.parentElement !== document.body) document.body.append(root);
    root.setAttribute('aria-label', 'Mộng Lộ');
    return root;
  };

  const fab = () => {
    let el = document.getElementById('hvExpBackFab');
    if (el) return el;
    el = document.createElement('button');
    el.id = 'hvExpBackFab';
    el.type = 'button';
    el.setAttribute('aria-label', 'Về Thành Chính');
    el.textContent = '‹';
    document.body.append(el);
    el.addEventListener('click', ev => {
      ev.preventDefault();
      if (typeof navTo === 'function') navTo('hub');
      syncOpen('hub');
    });
    return el;
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
    if (!root.dataset.hvExpBound) {
      root.dataset.hvExpBound = '1';
      root.addEventListener('click', ev => {
        if (!ev.target.closest('[data-expedition-back]')) return;
        ev.preventDefault();
        if (typeof navTo === 'function') navTo('hub');
        syncOpen('hub');
      });
    }
  };

  const syncOpen = name => {
    const root = hoist();
    if (!root) return;
    const open = name === 'expedition';
    root.hidden = !open;
    root.classList.toggle('is-open', open);
    document.body.classList.toggle('expedition-3d-active', open);
    if (open) pinBack(root);
    fab().classList.toggle('is-on', open);
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

  fab();
  syncOpen(typeof ST === 'object' ? ST.screen : '');
})();
