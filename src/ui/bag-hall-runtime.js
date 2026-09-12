(() => {
  if (typeof document === 'undefined' || !document.body) return;
  const body = document.getElementById('bagBody');
  if (!body || document.getElementById('hvBagRoot')) return;

  const root = document.createElement('section');
  root.id = 'hvBagRoot';
  root.setAttribute('aria-label', 'Túi đồ');
  root.innerHTML = `<div class="hv-bag-panel">
    <header class="hv-bag-top">
      <button type="button" class="hv-bag-back" data-bag-close aria-label="Đóng">‹</button>
      <b>Túi đồ</b>
      <span></span>
    </header>
    <div class="hv-bag-stage"></div>
  </div>`;
  root.querySelector('.hv-bag-stage').append(body);
  document.body.append(root);

  const syncOpen = name => {
    const open = name === 'bag';
    root.hidden = !open;
    root.classList.toggle('is-open', open);
    document.body.classList.toggle('bag-hall-active', open);
  };

  const baseShowScreen = showScreen;
  showScreen = function showScreenWithBagHall(name) {
    baseShowScreen(name);
    syncOpen(ST.screen);
  };

  root.querySelector('[data-bag-close]').addEventListener('click', () => navTo('hub'));
  root.addEventListener('click', ev => {
    if (ev.target === root) navTo('hub');
  });
  syncOpen(typeof ST === 'object' ? ST.screen : '');
})();
