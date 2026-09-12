(() => {
  if (typeof document === 'undefined' || !document.body) return;
  const body = document.getElementById('forgeBody');
  if (!body || document.getElementById('hvForgeRoot')) return;

  const root = document.createElement('section');
  root.id = 'hvForgeRoot';
  root.setAttribute('aria-label', 'Rèn Mộng');
  root.innerHTML = `<header class="hv-forge-top">
    <button type="button" class="hv-forge-back" data-forge-close aria-label="Đóng">‹</button>
    <b>Rèn Mộng</b>
    <span class="hv-forge-chip" data-forge-pity></span>
  </header>
  <div class="hv-forge-stage"></div>`;
  root.querySelector('.hv-forge-stage').append(body);
  document.body.append(root);

  const paintPity = () => {
    const chip = root.querySelector('[data-forge-pity]');
    if (!chip || typeof econ !== 'function') return;
    const cap = (typeof ECON === 'object' && ECON.craftPitySSR) || 30;
    chip.textContent = 'Pity ' + (econ().craftPity || 0) + '/' + cap;
  };

  const syncOpen = name => {
    const open = name === 'forge';
    root.hidden = !open;
    root.classList.toggle('is-open', open);
    document.body.classList.toggle('forge-hall-active', open);
    if (open) {
      paintPity();
      window.HonVietSfx?.unlock?.();
    }
  };

  const baseShowScreen = showScreen;
  showScreen = function showScreenWithForgeHall(name) {
    baseShowScreen(name);
    syncOpen(ST.screen);
  };

  root.querySelector('[data-forge-close]').addEventListener('click', () => navTo('hub'));
  syncOpen(typeof ST === 'object' ? ST.screen : '');
})();
