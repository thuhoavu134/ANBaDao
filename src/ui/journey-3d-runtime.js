(() => {
  if (typeof document === 'undefined' || !document.body) return;
  const body = document.getElementById('journeyBody');
  if (!body || document.getElementById('hvJourneyRoot')) return;

  const root = document.createElement('section');
  root.id = 'hvJourneyRoot';
  root.setAttribute('aria-label', 'Hành trình');
  root.innerHTML = `<header class="hv-journey-top">
    <button type="button" class="hv-journey-back" data-journey-close aria-label="Về Thành Chính">‹</button>
    <b>Hành trình</b>
    <span></span>
  </header>
  <div class="hv-journey-stage"></div>`;
  root.querySelector('.hv-journey-stage').append(body);
  document.body.append(root);

  const syncOpen = name => {
    const open = name === 'journey';
    root.hidden = !open;
    root.classList.toggle('is-open', open);
    document.body.classList.toggle('journey-3d-active', open);
  };

  const baseShowScreen = showScreen;
  showScreen = function showScreenWithJourney3d(name) {
    baseShowScreen(name);
    syncOpen(ST.screen);
  };

  if (typeof renderJourney === 'function') {
    const baseRender = renderJourney;
    renderJourney = function renderJourneyWith3d() {
      baseRender.apply(this, arguments);
      syncOpen(typeof ST === 'object' ? ST.screen : 'journey');
    };
  }

  root.querySelector('[data-journey-close]').addEventListener('click', () => navTo('hub'));
  syncOpen(typeof ST === 'object' ? ST.screen : '');
})();
