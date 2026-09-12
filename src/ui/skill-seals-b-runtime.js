(() => {
  if (typeof document === 'undefined' || typeof renderHeroDetail !== 'function') return;
  const HEROES = Object.freeze(['phong_tu', 'thuy_nuong_roi_nuoc', 'hong_lien_dao_nuong']);
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
  renderHeroDetail = function renderHeroDetailWithSealsB(id) {
    baseRender.apply(this, arguments);
    paint(id);
  };
  if (typeof ST === 'object' && ST.screen === 'heroDetail' && ST._heroDetailId) paint(ST._heroDetailId);
})();
