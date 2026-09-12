(() => {
  if (typeof document === 'undefined' || !document.body) return;
  const body = document.getElementById('clanBody');
  if (!body || document.getElementById('hvClanRoot')) return;

  const root = document.createElement('section');
  root.id = 'hvClanRoot';
  root.setAttribute('aria-label', 'Gia Tộc');
  root.innerHTML = `<header class="hv-clan-top">
    <button type="button" class="hv-clan-back" data-clan-close aria-label="Đóng">‹</button>
    <b>Gia Tộc</b>
    <span></span>
  </header>
  <div class="hv-clan-stage"></div>`;
  root.querySelector('.hv-clan-stage').append(body);
  document.body.append(root);

  const syncOpen = name => {
    const open = name === 'clan';
    root.hidden = !open;
    root.classList.toggle('is-open', open);
    document.body.classList.toggle('clan-hall-active', open);
  };

  const baseShowScreen = showScreen;
  showScreen = function showScreenWithClanHall(name) {
    baseShowScreen(name);
    syncOpen(ST.screen);
  };

  root.querySelector('[data-clan-close]').addEventListener('click', () => navTo('hub'));
  syncOpen(typeof ST === 'object' ? ST.screen : '');
})();
