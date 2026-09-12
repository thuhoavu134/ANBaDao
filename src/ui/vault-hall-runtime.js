(() => {
  if (typeof document === 'undefined' || !document.body) return;
  const body = document.getElementById('vaultBody');
  if (!body || document.getElementById('hvVaultRoot')) return;

  const root = document.createElement('section');
  root.id = 'hvVaultRoot';
  root.setAttribute('aria-label', 'Kho lưu');
  root.innerHTML = `<header class="hv-vault-top">
    <button type="button" class="hv-vault-back" data-vault-close aria-label="Đóng">‹</button>
    <b>Kho lưu</b>
    <span></span>
  </header>
  <div class="hv-vault-stage"></div>`;
  root.querySelector('.hv-vault-stage').append(body);
  document.body.append(root);

  const syncOpen = name => {
    const open = name === 'vault';
    root.hidden = !open;
    root.classList.toggle('is-open', open);
    document.body.classList.toggle('vault-hall-active', open);
  };

  const baseShowScreen = showScreen;
  showScreen = function showScreenWithVaultHall(name) {
    baseShowScreen(name);
    syncOpen(ST.screen);
  };

  root.querySelector('[data-vault-close]').addEventListener('click', () => navTo('hub'));
  syncOpen(typeof ST === 'object' ? ST.screen : '');
})();
