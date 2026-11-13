(() => {
  if (typeof document === 'undefined' || !document.body) return;
  const body = document.getElementById('forgeBody');
  if (!body || document.getElementById('hvForgeRoot')) return;

  const root = document.createElement('section');
  root.id = 'hvForgeRoot';
  root.setAttribute('aria-label', 'Rèn Binh');
  root.innerHTML = `<header class="hv-forge-top">
    <button type="button" class="hv-forge-back" data-forge-close aria-label="Đóng">‹</button>
    <b>Rèn Binh</b>
    <span class="hv-forge-chip" data-forge-pity></span>
    <button type="button" class="hv-forge-so" data-forge-so>Chế 10 sò</button>
  </header>
  <div class="hv-forge-stage"></div>`;
  root.querySelector('.hv-forge-stage').append(body);
  const strike = document.createElement('div');
  strike.id = 'hvForgeStrike';
  strike.hidden = true;
  strike.innerHTML = `<div class="hv-anvil-stage" data-forge-asset="pending">
    <i class="hv-smith"></i><i class="hv-hammer"></i><i class="hv-anvil"></i><i class="hv-spark"></i>
    <div class="hv-drop" data-forge-drop></div>
  </div>`;
  root.append(strike);

  function playAnvil(item) {
    const drop = strike.querySelector('[data-forge-drop]');
    const rar = String((item && item.rar) || 'b').toLowerCase();
    strike.hidden = false;
    strike.className = 'is-play t-' + rar;
    if (drop) {
      drop.className = 'hv-drop t-' + rar;
      drop.textContent = (item && (typeof itemName === 'function' ? itemName(item) : item.slot)) || '';
    }
    window.HonVietSfx?.play?.('forge-reveal', { group: 'ui' });
    clearTimeout(playAnvil._t);
    playAnvil._t = setTimeout(() => { strike.hidden = true; strike.className = ''; }, 1400);
  }

  if (typeof hvForgeReveal === 'function') {
    const baseReveal = hvForgeReveal;
    hvForgeReveal = function (item, kind) {
      if (item && kind !== 'enhance') playAnvil(item);
      return baseReveal.apply(this, arguments);
    };
  }
  document.body.append(root);

  const paintPity = () => {
    const chip = root.querySelector('[data-forge-pity]');
    if (!chip || typeof econ !== 'function') return;
    const cap = (typeof ECON === 'object' && ECON.craftPitySSR) || 30;
    chip.textContent = 'Pity ' + (econ().craftPity || 0) + '/' + cap;
    const soBtn = root.querySelector('[data-forge-so]');
    if (soBtn) {
      const n = (P.bachBao && P.bachBao.crafted) || 0;
      soBtn.textContent = 'Chế 10 sò · 25 Tinh+25 Hoạt (' + n + '/2)';
    }
  };

  root.querySelector('[data-forge-so]')?.addEventListener('click', () => {
    window.hvCraftSo?.();
    paintPity();
  });

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
