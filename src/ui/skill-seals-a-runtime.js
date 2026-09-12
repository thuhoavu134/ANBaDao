(() => {
  if (typeof document === 'undefined' || typeof renderHeroDetail !== 'function') return;
  const HEROES = Object.freeze(['lac_yen', 'cung_thu_tre', 'co_dao_ganh_hoi']);
  const paint = id => {
    const body = document.getElementById('hdBody');
    if (!body) return;
    const hid = String(id || '');
    if (HEROES.includes(hid)) {
      body.setAttribute('data-hero-id', hid);
      body.querySelectorAll('.hv-scene-skill-seal').forEach(el => { el.textContent = ''; });
    } else if (HEROES.includes(body.getAttribute('data-hero-id') || '')) {
      body.removeAttribute('data-hero-id');
    }
  };
  const baseRender = renderHeroDetail;
  renderHeroDetail = function renderHeroDetailWithSealsA(id) {
    baseRender.apply(this, arguments);
    paint(id);
  };
  if (typeof ST === 'object' && ST.screen === 'heroDetail' && ST._heroDetailId) paint(ST._heroDetailId);
})();
