(() => {
  if (typeof document === 'undefined' || !document.body) return;

  const hoist = () => {
    const root = document.getElementById('hvHuntRoot');
    if (!root) return null;
    if (root.parentElement !== document.body) document.body.append(root);
    root.setAttribute('aria-label', 'Săn Boss');
    return root;
  };

  const fab = () => {
    let el = document.getElementById('hvHuntBackFab');
    if (el) return el;
    el = document.createElement('button');
    el.id = 'hvHuntBackFab';
    el.type = 'button';
    el.setAttribute('aria-label', 'Về Thành Chính');
    el.textContent = '‹';
    document.body.append(el);
    el.addEventListener('click', ev => {
      ev.preventDefault();
      ev.stopPropagation();
      if (typeof navTo === 'function') navTo('hub');
      syncOpen('hub');
    });
    return el;
  };

  const pinBack = root => {
    if (!root) return;
    let btn = root.querySelector('[data-hunt-back]');
    if (!btn) {
      btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'hv-hunt-back';
      btn.setAttribute('data-hunt-back', '');
      btn.setAttribute('aria-label', 'Về Thành Chính');
      btn.textContent = '‹';
      root.prepend(btn);
    }
    btn.style.pointerEvents = 'auto';
    if (!root.dataset.hvHuntBound) {
      root.dataset.hvHuntBound = '1';
      root.addEventListener('click', ev => {
        if (!ev.target.closest('[data-hunt-back]')) return;
        ev.preventDefault();
        if (typeof navTo === 'function') navTo('hub');
        syncOpen('hub');
      });
    }
  };

  function hushParentBgm() {
    try {
      if (typeof bgmPlayer !== 'undefined' && bgmPlayer) bgmPlayer.pause();
    } catch {}
    try { window.HonVietAudio?.stopCombat?.(); } catch {}
  }

  const syncOpen = name => {
    const root = hoist();
    const open = name === 'hunt';
    if (root) {
      root.hidden = !open;
      root.classList.toggle('is-open', open);
      if (open) pinBack(root);
    }
    document.body.classList.toggle('hunt-3d-active', open);
    const battle = document.getElementById('hvBattleOverlay');
    const inBattle = !!(battle && battle.classList.contains('is-open'));
    fab().classList.toggle('is-on', open && !inBattle);
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

  const overlay = document.getElementById('hvBattleOverlay');
  if (overlay) {
    const obs = new MutationObserver(() => {
      if (overlay.classList.contains('is-open')) hushParentBgm();
      syncOpen(typeof ST === 'object' ? ST.screen : '');
    });
    obs.observe(overlay, { attributes: true, attributeFilter: ['class'] });
  }

  fab();
  syncOpen(typeof ST === 'object' ? ST.screen : '');
})();
