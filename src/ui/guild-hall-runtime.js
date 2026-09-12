(() => {
  if (typeof document === 'undefined' || !document.body) return;
  const body = document.getElementById('guildBody');
  if (!body || document.getElementById('hvGuildRoot')) return;

  const root = document.createElement('section');
  root.id = 'hvGuildRoot';
  root.setAttribute('aria-label', 'Bang Hội');
  root.innerHTML = `<header class="hv-guild-top">
    <button type="button" class="hv-guild-back" data-guild-close aria-label="Đóng">‹</button>
    <b>Bang Hội</b>
    <span></span>
  </header>
  <div class="hv-guild-stage"></div>`;
  root.querySelector('.hv-guild-stage').append(body);
  document.body.append(root);

  const syncOpen = name => {
    const open = name === 'guild';
    root.hidden = !open;
    root.classList.toggle('is-open', open);
    document.body.classList.toggle('guild-hall-active', open);
  };

  const baseShowScreen = showScreen;
  showScreen = function showScreenWithGuildHall(name) {
    baseShowScreen(name);
    syncOpen(ST.screen);
  };

  root.querySelector('[data-guild-close]').addEventListener('click', () => navTo('hub'));
  syncOpen(typeof ST === 'object' ? ST.screen : '');
})();
