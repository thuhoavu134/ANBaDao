(() => {
  if (typeof document === 'undefined' || !document.body) return;
  const body = document.getElementById('netBody');
  if (!body || document.getElementById('hvNetRoot')) return;

  const root = document.createElement('section');
  root.id = 'hvNetRoot';
  root.setAttribute('aria-label', 'Trực Tuyến');
  root.innerHTML = `<header class="hv-net-top">
    <button type="button" class="hv-net-back" data-net-close aria-label="Về Thành Chính">‹</button>
    <b>Trực Tuyến</b>
    <span></span>
  </header>
  <div class="hv-net-stage"></div>`;
  root.querySelector('.hv-net-stage').append(body);
  document.body.append(root);

  const syncOpen = name => {
    const open = name === 'net';
    root.hidden = !open;
    root.classList.toggle('is-open', open);
    document.body.classList.toggle('net-3d-active', open);
  };

  const baseShowScreen = showScreen;
  showScreen = function showScreenWithNet3d(name) {
    baseShowScreen(name);
    syncOpen(ST.screen);
  };

  if (typeof renderNet === 'function') {
    const baseRender = renderNet;
    renderNet = function renderNetWith3d() {
      baseRender.apply(this, arguments);
      syncOpen(typeof ST === 'object' ? ST.screen : 'net');
    };
  }

  root.querySelector('[data-net-close]').addEventListener('click', () => navTo('hub'));
  syncOpen(typeof ST === 'object' ? ST.screen : '');
})();
