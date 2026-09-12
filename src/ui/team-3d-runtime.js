(() => {
  if (typeof document === 'undefined' || !document.body) return;
  const screen = document.getElementById('teamScreen');
  if (!screen || document.getElementById('hvTeamRoot')) return;

  const root = document.createElement('section');
  root.id = 'hvTeamRoot';
  root.className = 'art-game-screen team-art-screen';
  root.setAttribute('aria-label', 'Trận Hình');
  root.innerHTML = `<header class="hv-team-top">
    <button type="button" class="hv-team-back" data-team-close aria-label="Về Thành Chính">‹</button>
    <b>Trận Hình</b>
    <span></span>
  </header>
  <div class="hv-team-stage"></div>`;
  const stage = root.querySelector('.hv-team-stage');
  while (screen.firstChild) stage.append(screen.firstChild);
  document.body.append(root);

  const syncOpen = name => {
    const open = name === 'team';
    root.hidden = !open;
    root.classList.toggle('is-open', open);
    document.body.classList.toggle('team-3d-active', open);
  };

  const baseShowScreen = showScreen;
  showScreen = function showScreenWithTeam3d(name) {
    baseShowScreen(name);
    syncOpen(ST.screen);
  };

  if (typeof renderTeam === 'function') {
    const baseRender = renderTeam;
    renderTeam = function renderTeamWith3d() {
      baseRender.apply(this, arguments);
      syncOpen(typeof ST === 'object' ? ST.screen : 'team');
    };
  }

  root.querySelector('[data-team-close]').addEventListener('click', () => navTo('hub'));
  syncOpen(typeof ST === 'object' ? ST.screen : '');
})();
