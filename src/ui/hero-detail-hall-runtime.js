(() => {
  if (typeof document === 'undefined' || !document.body) return;
  const body = document.getElementById('hdBody');
  if (!body || document.getElementById('hvHeroDetailRoot')) return;

  const root = document.createElement('section');
  root.id = 'hvHeroDetailRoot';
  root.setAttribute('aria-label', 'Hồ sơ tướng');
  root.innerHTML = `<header class="hv-hd-top">
    <button type="button" class="hv-hd-back" data-hd-close aria-label="Về danh sách tướng">‹</button>
    <b data-hd-title></b>
    <span></span>
  </header>
  <div class="hv-hd-stage"></div>`;
  root.querySelector('.hv-hd-stage').append(body);
  document.body.append(root);

  const SHOWCASE = Object.freeze({
    lac_yen: 'assets/ui/hero-detail/lac-yen-showcase-bg.jpg',
    cung_thu_tre: 'assets/ui/hero-detail/cung-thu-tre-showcase-bg.jpg',
    co_dao_ganh_hoi: 'assets/ui/hero-detail/co-dao-ganh-hoi-showcase-bg.jpg',
    phong_tu: 'assets/ui/hero-detail/phong-tu-showcase-bg.jpg',
    thuy_nuong_roi_nuoc: 'assets/ui/hero-detail/thuy-nuong-roi-nuoc-showcase-bg.jpg',
    hong_lien_dao_nuong: 'assets/ui/hero-detail/hong-lien-dao-nuong-showcase-bg.jpg',
    thach_quyen: 'assets/ui/hero-detail/thach-quyen-showcase-bg.jpg',
    dinh_loi: 'assets/ui/hero-detail/dinh-loi-showcase-bg.jpg',
    to_diep: 'assets/ui/hero-detail/to-diep-showcase-bg.jpg'
  });

  const paintShowcase = () => {
    const stage = body.querySelector('.hstage');
    if (!stage) return;
    const id = stage.dataset.heroId;
    root.dataset.heroId = id || '';
    const existing = getComputedStyle(stage).getPropertyValue('--hero-detail-bg');
    if (existing && existing.includes('url(')) {
      stage.classList.add('hv-depth-bg');
      return;
    }
    const url = SHOWCASE[id];
    if (!url) return;
    stage.classList.add('hv-depth-bg');
    stage.style.setProperty('--hero-detail-bg', "url('" + url + "')");
  };

  const syncOpen = name => {
    const open = name === 'heroDetail';
    if (!open) root.querySelector('.vc-detail-sheet[open]')?.close?.();
    root.hidden = !open;
    root.classList.toggle('is-open', open);
    document.body.classList.toggle('hero-detail-hall-active', open);
    if (open) {
      const title = document.getElementById('hdName')?.textContent || 'Tướng';
      const chip = root.querySelector('[data-hd-title]');
      if (chip) chip.textContent = title;
      paintShowcase();
    }
  };

  const baseShowScreen = showScreen;
  showScreen = function showScreenWithHeroDetailHall(name) {
    baseShowScreen(name);
    syncOpen(ST.screen);
  };

  if (typeof renderHeroDetail === 'function') {
    const baseRender = renderHeroDetail;
    renderHeroDetail = function renderHeroDetailWithHall(id) {
      baseRender.apply(this, arguments);
      paintShowcase();
      syncOpen(typeof ST === 'object' ? ST.screen : 'heroDetail');
    };
  }

  root.querySelector('[data-hd-close]').addEventListener('click', () => navTo('heroes'));
  syncOpen(typeof ST === 'object' ? ST.screen : '');
})();

