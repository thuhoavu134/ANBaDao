(() => {
  if (typeof document === 'undefined' || !document.body) return;
  const body = document.getElementById('mailBody');
  if (!body || document.getElementById('hvMailRoot')) return;

  const root = document.createElement('section');
  root.id = 'hvMailRoot';
  root.setAttribute('aria-label', 'Hòm thư');
  root.innerHTML = `<header class="hv-mail-top">
    <button type="button" class="hv-mail-back" data-mail-close aria-label="Đóng">‹</button>
    <b>Hòm thư</b>
    <span></span>
  </header>
  <div class="hv-mail-stage"></div>`;
  root.querySelector('.hv-mail-stage').append(body);
  document.body.append(root);

  const syncOpen = name => {
    const open = name === 'mail';
    root.hidden = !open;
    root.classList.toggle('is-open', open);
    document.body.classList.toggle('mail-hall-active', open);
  };

  const baseShowScreen = showScreen;
  showScreen = function showScreenWithMailHall(name) {
    baseShowScreen(name);
    syncOpen(ST.screen);
  };

  root.querySelector('[data-mail-close]').addEventListener('click', () => navTo('hub'));
  syncOpen(typeof ST === 'object' ? ST.screen : '');
})();
