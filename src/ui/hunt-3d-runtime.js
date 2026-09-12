(() => {
  if (typeof document === 'undefined' || !document.body) return;

  const hoist = () => {
    const root = document.getElementById('hvHuntRoot');
    if (!root) return null;
    if (root.parentElement !== document.body) document.body.append(root);
    root.setAttribute('aria-label', 'Săn Boss');
    return root;
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
  };

  function hushParentBgm() {
    try {
      if (typeof bgmPlayer !== 'undefined' && bgmPlayer) {
        bgmPlayer.pause();
      }
    } catch {}
    try { window.HonVietAudio?.stopCombat?.(); } catch {}
  }

  const syncOpen = name => {
    const root = hoist();
    if (!root) return;
    const open = name === 'hunt';
    root.hidden = !open;
    root.classList.toggle('is-open', open);
    document.body.classList.toggle('hunt-3d-active', open);
    if (open) pinBack(root);
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

  const boot = hoist();
  if (boot && !boot.dataset.hvHuntBack) {
    boot.dataset.hvHuntBack = '1';
    boot.addEventListener('click', ev => {
      if (!ev.target.closest('[data-hunt-back]')) return;
      ev.preventDefault();
      navTo('hub');
    });
  }

  const overlay = document.getElementById('hvBattleOverlay');
  if (overlay) {
    const obs = new MutationObserver(() => {
      if (overlay.classList.contains('is-open')) hushParentBgm();
    });
    obs.observe(overlay, { attributes: true, attributeFilter: ['class'] });
  }

  syncOpen(typeof ST === 'object' ? ST.screen : '');
})();
