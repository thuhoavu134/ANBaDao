(() => {
  if (typeof document === 'undefined' || typeof renderHeroDetail !== 'function') return;
  const HEROES = Object.freeze(['thach_quyen', 'dinh_loi', 'to_diep']);
  const paint = id => {
    const body = document.getElementById('hdBody');
    if (!body) return;
    const hid = String(id || '');
    // Tướng đã dùng mẫu hồ sơ chung (PR #382) tự lo icon kỹ năng — không xoá, không gắn nền cũ.
    if (globalThis.HV_VC_HERO_PROFILES && Object.prototype.hasOwnProperty.call(globalThis.HV_VC_HERO_PROFILES, hid)) {
      if (HEROES.includes(body.getAttribute('data-hero-id') || '')) body.removeAttribute('data-hero-id');
      return;
    }
    if (HEROES.includes(hid)) {
      body.setAttribute('data-hero-id', hid);
      body.querySelectorAll('.hv-scene-skill-seal').forEach(el => { el.textContent = ''; });
    } else if (HEROES.includes(body.getAttribute('data-hero-id') || '')) {
      body.removeAttribute('data-hero-id');
    }
  };
  const baseRender = renderHeroDetail;
  renderHeroDetail = function renderHeroDetailWithSealsC(id) {
    baseRender.apply(this, arguments);
    paint(id);
  };
  if (typeof ST === 'object' && ST.screen === 'heroDetail' && ST._heroDetailId) paint(ST._heroDetailId);
})();
