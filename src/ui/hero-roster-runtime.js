// Installed once by the static build. Uses the existing shell router and art.
(() => {
  const state = { element: 'all', scope: 'owned', sort: 'default', scrollTop: 0, selectedId: null };
  const screen = document.getElementById('heroesScreen');
  const root = document.createElement('section');
  root.id = 'hvHeroRosterV4';
  root.setAttribute('aria-label', 'Danh sách tướng');
  // Same paint surface as Trợ trận: body-level fixed overlay. Mounting inside
  // #heroesScreen (a .wrap > .screen) lets iOS/Grok iframe clip the card grid
  // to header height. Overflow auto + min-height on cards cannot collapse.
  if (screen) screen.replaceChildren();
  document.body.append(root);
  root.hidden = ST.screen !== 'heroes';
  root.classList.toggle('is-open', ST.screen === 'heroes');
  const scrollSurface = () => root.querySelector('.v4-grid');
  const rememberScroll = () => { state.scrollTop = scrollSurface()?.scrollTop || 0; };
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
  const number = value => Number(value || 0).toLocaleString('vi-VN');
  const nav = [['hub', 'hub', 'Thành Chính'], ['heroes', 'heroes', 'Tướng'],
    ['team', 'team', 'Trợ trận'], ['daily', 'daily', 'Lịch Luyện'], ['campaign', 'expedition', 'Chinh chiến']];

  renderHeroes = function renderPlayerRoster() {
    const view = buildRosterView({
      ids: ['linh_dong', ...OFFICIAL_ROSTER_12_IDS.filter(id => id !== 'linh_dong')],
      heroes: DATA.heroes, player: P,
      powerFor: heroPower, portraitFor: id => portraitSrc(id, 'card'),
      ...state });
    root.innerHTML = `<header class="v4-top"><div class="v4-profile">
      <button class="v4-avatar" data-roster-nav="hub" aria-label="Về Thành Chính">‹</button>
      <div><div class="v4-name">Hồn Việt</div><div class="v4-sub">Sở hữu ${view.owned}/${view.total} tướng</div>
      <div class="v4-total" aria-label="Lực chiến đội hình">⚔ ${number(view.squadPower)}</div></div>
      <div class="v4-res"><span aria-label="Vàng" data-roster-gold>🪙 ${number(view.gold)}</span>
      <span aria-label="Ngọc" data-roster-gems>💎 ${number(view.gems)}</span></div></div>
      <div class="v4-tabs" role="group" aria-label="Chế độ danh sách">
      ${[['owned', 'Tướng'], ['all', 'Đồ Giám']].map(([key, label]) =>
        `<button class="v4-tab ${state.scope === key ? 'active' : ''}" data-roster-scope="${key}" aria-pressed="${state.scope === key}">${label}</button>`).join('')}
      <label class="v4-sort">Sắp xếp <select aria-label="Sắp xếp tướng" data-roster-sort>
      ${[['default', 'Mặc định'], ['power', 'Lực chiến'], ['level', 'Cấp độ'], ['name', 'Tên']].map(([key, label]) =>
        `<option value="${key}" ${state.sort === key ? 'selected' : ''}>${label}</option>`).join('')}</select></label></div>
      <div class="v4-filter" role="group" aria-label="Lọc hệ">
      ${['all', 'hoa', 'kim', 'moc', 'phong', 'thuy', 'tho', 'mong'].map(key =>
        `<button data-roster-element="${key}" class="${state.element === key ? 'active' : ''}" aria-label="${key === 'all' ? 'Tất cả hệ' : 'Hệ ' + HE[key].nm}" aria-pressed="${state.element === key}">${key === 'all' ? '▦' : HE[key].ic}</button>`).join('')}</div></header>
      <div class="v4-grid" aria-label="Thẻ tướng">
      ${view.cards.map(card => {
        const grade = ({ SSR: 'S+', SS: 'S', S: 'S', A: 'A', B: 'B' }[card.rarity] || 'B');
        const gradeFile = grade === 'S+' ? 'splus' : grade.toLowerCase();
        const starN = Math.max(0, Math.min(5, card.stars || 0));
        const stars = Array.from({ length: 5 }, (_, i) => '<i class="' + (i < starN ? 'on' : '') + '">★</i>').join('');
        return `<button class="v4-card r-${grade === 'S+' ? 'splus' : grade.toLowerCase()} ${card.owned ? '' : 'is-locked'}" data-hero-id="${esc(card.id)}" aria-label="${esc(card.name)}${card.owned ? ', cấp ' + card.level + ', ' + card.stars + ' sao, lực chiến ' + card.power : ', chưa sở hữu'}">
        <div class="v4-art"><img src="${esc(card.portrait)}" alt="" loading="lazy" decoding="async"></div>
        <div class="v4-grade"><img src="assets/ui/heroes/grade-${gradeFile}.png" alt="${grade}"></div><div class="v4-level">${card.owned ? 'Lv.' + card.level : '🔒'}</div>
        <div class="v4-veil">
          <div class="v4-element">${HE[card.element]?.ic || ''}</div>
          <div class="v4-stars">${stars}</div>
          <div class="v4-cardname" title="${esc(card.name)}">${esc(card.shortName)}</div>
        </div></button>`;
      }).join('')}
      ${view.cards.length ? '' : '<p class="v4-empty" role="status">Chưa có tướng phù hợp với bộ lọc này.</p>'}</div>
      <nav class="v4-dock" aria-label="Điều hướng game">${nav.map(([target, icon, label]) =>
        `<button data-roster-nav="${target}" ${target === 'heroes' ? 'aria-current="page"' : ''}><img src="assets/ui/menu-v3233/icons/${icon}.png" alt="">${label}</button>`).join('')}</nav>`;
    root.dataset.rosterTargetTotal = String(view.catalog.targetTotal);
    root.dataset.rosterActiveTotal = String(view.catalog.activeTotal);
    root.dataset.rosterTargetCounts = JSON.stringify(view.catalog.targetCounts);
    scrollSurface().scrollTop = state.scrollTop;
  };

  // Native click supports touch, mouse and keyboard without three command owners.
  root.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button || !root.contains(button)) return;
    if (button.dataset.rosterNav) { navTo(button.dataset.rosterNav); return; }
    if (button.dataset.rosterElement || button.dataset.rosterScope) {
      if (button.dataset.rosterElement) state.element = button.dataset.rosterElement;
      if (button.dataset.rosterScope) state.scope = button.dataset.rosterScope;
      state.scrollTop = 0; renderHeroes(); return;
    }
    const id = button.dataset.heroId;
    if (!OFFICIAL_ROSTER_12_IDS.includes(id)) return;
    if (!P.heroes[id]?.owned) { toast('Chưa sở hữu tướng này.'); return; }
    state.selectedId = id; rememberScroll();
    renderHeroDetail(id); showScreen('heroDetail');
  });
  root.addEventListener('change', event => {
    if (!event.target.matches('[data-roster-sort]')) return;
    state.sort = event.target.value; state.scrollTop = 0; renderHeroes();
  });
  root.addEventListener('scroll', () => { if (ST.screen === 'heroes') rememberScroll(); }, { capture: true, passive: true });

  // Keep one route owner. Overlay visibility follows the heroes route.
  const baseShowScreen = showScreen;
  showScreen = function showScreenWithRosterState(name) {
    const fromDetail = ST.screen === 'heroDetail';
    if (ST.screen === 'heroes') rememberScroll();
    if (name !== 'heroDetail' && typeof _lucDetailRaf !== 'undefined') {
      cancelAnimationFrame(_lucDetailRaf); _lucDetailRaf = 0;
    }
    baseShowScreen(name);
    root.hidden = ST.screen !== 'heroes';
    root.classList.toggle('is-open', ST.screen === 'heroes');
    document.body.classList.toggle('hero-roster-active', ST.screen === 'heroes');
    if (name === 'heroes') {
      if (scrollSurface()) scrollSurface().scrollTop = state.scrollTop;
      if (fromDetail && state.selectedId) {
        root.querySelector(`[data-hero-id="${state.selectedId}"]`)?.focus({ preventScroll: true });
      }
    }
  };

  const baseRefresh = refreshResbar;
  refreshResbar = function refreshRosterResources() {
    baseRefresh();
    if (ST.screen !== 'heroes') return;
    const gold = root.querySelector('[data-roster-gold]'), gems = root.querySelector('[data-roster-gems]');
    if (gold) gold.textContent = '🪙 ' + number(P.gold);
    if (gems) gems.textContent = '💎 ' + number(P.gems);
  };

  // Upgrade buttons used to redraw the entire detail on each click, restarting
  // Lục Ảnh's idle loop. Move the existing canvas into the refreshed detail.
  const baseDetail = renderHeroDetail;
  renderHeroDetail = function renderDetailWithoutIdleRestart(id) {
    const canvas = ST.screen === 'heroDetail' && ST._heroDetailId === id
      ? (document.getElementById('lucAnhDetailIdle') || document.getElementById('linhDongDetailIdle')) : null;
    const raf = canvas ? _lucDetailRaf : 0;
    const startLucIdle = startLucAnhDetailIdle;
    const startLinhIdle = typeof startLinhDongDetailIdle === 'function' ? startLinhDongDetailIdle : null;
    if (canvas) {
      startLucAnhDetailIdle = () => {};
      if (startLinhIdle) startLinhDongDetailIdle = () => {};
    }
    try { baseDetail(id); }
    finally {
      startLucAnhDetailIdle = startLucIdle;
      if (startLinhIdle) startLinhDongDetailIdle = startLinhIdle;
    }
    if (canvas) {
      const next = document.getElementById(canvas.id);
      if (next) next.replaceWith(canvas);
      _lucDetailRaf = raf;
    }
  };

  // Make the authored back control keyboard-accessible without adding another
  // pointer/touch handler or shadow route.
  const oldBack = document.querySelector('#heroDetailScreen [data-nav="heroes"]');
  if (oldBack) {
    const back = document.createElement('button');
    back.type = 'button'; back.className = oldBack.className; back.textContent = '‹';
    back.dataset.nav = 'heroes'; back.setAttribute('aria-label', 'Quay lại danh sách tướng');
    back.addEventListener('click', () => navTo('heroes')); oldBack.replaceWith(back);
  }
  document.body.classList.toggle('hero-roster-active', ST.screen === 'heroes');
  root.classList.toggle('is-open', ST.screen === 'heroes');
  if (ST.screen === 'heroes') renderHeroes();
})();
