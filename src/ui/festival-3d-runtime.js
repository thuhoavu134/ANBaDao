(() => {
  if (typeof document === 'undefined' || !document.body) return;

  const hoist = () => {
    const root = document.getElementById('hvFestivalRoot');
    if (!root) return null;
    if (root.parentElement !== document.body) document.body.append(root);
    root.setAttribute('aria-label', 'Lễ Hội');
    return root;
  };

  const TILES = [
    { id: 'lamp', name: 'Hoa Đăng', fact: 'lantern', img: 'assets/ui/festival/tiles/hoa-dang.jpg' },
    { id: 'wheel', name: 'Bách Bảo Rương', fact: 'wheel', img: 'assets/ui/festival/tiles/bach-bao.jpg' },
    { id: 'chest', name: 'Rương Báu', fact: 'chest', img: 'assets/ui/festival/tiles/ruong.jpg' }
  ];

  let prevFcity = '';
  let prevTileOpen = false;

  const ensureCity = root => {
    if (!root) return;
    root.classList.add('hv-city');
    let city = root.querySelector('#hvFestCity');
    if (!city) {
      city = document.createElement('div');
      city.id = 'hvFestCity';
      root.append(city);
      city.addEventListener('click', ev => {
        const btn = ev.target.closest('[data-fcity]');
        if (!btn) return;
        root.dataset.fcity = btn.getAttribute('data-fcity');
        root.classList.add('is-tile-open');
        prevFcity = root.dataset.fcity;
        prevTileOpen = true;
        paintVault(root);
        paintLamp(root);
      });
      root.addEventListener('click', ev => {
        if (!root.classList.contains('is-tile-open')) return;
        if (!ev.target.closest('[data-fest-back]')) return;
        ev.preventDefault();
        ev.stopImmediatePropagation();
        root.classList.remove('is-tile-open');
        root.dataset.fcity = '';
        prevFcity = '';
        prevTileOpen = false;
      }, true);
    }
    city.innerHTML = TILES.map(t =>
      `<button type="button" class="hv-ftile" data-fcity="${t.id}" data-fact="${t.fact}"><img src="${t.img}" alt="${t.name}"><b>${t.name}</b></button>`
    ).join('');
    paintVault(root);
    paintLamp(root);
  };

  function paintLamp(root) {
    if (!root || root.dataset.fcity !== 'lamp') return;
    const panel = root.querySelector('.hv-fest-panel');
    if (!panel) return;
    if (panel.querySelector('.hv-lamp-sky')) return;
    const sky = document.createElement('div');
    sky.className = 'hv-lamp-sky';
    sky.setAttribute('aria-hidden', 'true');
    sky.innerHTML = Array.from({ length: 12 }, (_, i) =>
      '<i class="hv-float-lamp" style="left:' + (4 + i * 8) + '%;animation-delay:' + (i * 0.55) + 's;animation-duration:' + (7 + (i % 5)) + 's"></i>'
    ).join('');
    panel.prepend(sky);
  }

  function burstLamps() {
    const sky = document.querySelector('#hvFestivalRoot .hv-lamp-sky');
    if (!sky) return;
    for (let i = 0; i < 6; i++) {
      const el = document.createElement('i');
      el.className = 'hv-float-lamp is-burst';
      el.style.left = (18 + i * 12) + '%';
      sky.append(el);
      setTimeout(() => el.remove(), 2500);
    }
  }

  function lootArt(result, kind) {
    const g = result && result.grant;
    if (g) {
      if (g.type === 'gems') return 'assets/ui/festival/bbr/gems.png';
      if (g.type === 'gold') return 'assets/items/materials/gold.png';
      if (g.type === 'shards') {
        return g.rarity === 'ssr' ? 'assets/ui/festival/bbr/sh_ssr.png' : 'assets/ui/festival/bbr/sh_ss.png';
      }
      if (g.type === 'equip') return 'assets/ui/festival/bbr/supreme.png';
    }
    const msg = String((result && result.msg) || '');
    if (/Ngọc|💎/.test(msg)) return 'assets/ui/festival/bbr/gems.png';
    if (/mảnh/i.test(msg) && /S\+|SSR/.test(msg)) return 'assets/ui/festival/bbr/sh_ssr.png';
    if (/mảnh/i.test(msg)) return 'assets/ui/festival/bbr/sh_ss.png';
    if (/\+\d+|trang bị|⚔️|🗡️/.test(msg)) return 'assets/ui/festival/bbr/supreme.png';
    return kind === 'supreme' ? 'assets/ui/festival/bbr/supreme.png' : 'assets/ui/festival/bbr/chest.png';
  }

  const FX_FPS = 60;

  function ensureFx() {
    let fx = document.getElementById('hvChestFx');
    if (fx) return fx;
    fx = document.createElement('div');
    fx.id = 'hvChestFx';
    fx.innerHTML = `
      <div class="hv-chest-fx-card">
        <div class="hv-chest-fx-stage">
          <img class="hv-chest-fx-seq" alt="">
        </div>
        <div class="hv-chest-fx-loot" hidden>
          <span class="hv-chest-fx-frame"><img alt=""></span>
          <b></b>
        </div>
        <button type="button" data-chest-fx-done>Nhận</button>
      </div>`;
    document.body.append(fx);
    fx.addEventListener('click', ev => {
      if (!ev.target.closest('[data-chest-fx-done]') && ev.target !== fx) return;
      const seq = fx.querySelector('.hv-chest-fx-seq');
      const stage = fx.querySelector('.hv-chest-fx-stage');
      if (seq) seq.removeAttribute('src');
      stage?.classList.remove('is-shake');
      fx.classList.remove('is-open');
    });
    return fx;
  }

  function playChestFx(kind, result) {
    const fx = ensureFx();
    const seq = fx.querySelector('.hv-chest-fx-seq');
    const stage = fx.querySelector('.hv-chest-fx-stage');
    const loot = fx.querySelector('.hv-chest-fx-loot');
    const img = loot.querySelector('img');
    const lab = loot.querySelector('b');
    img.src = lootArt(result, kind);
    lab.textContent = (result && result.msg) || (kind === 'supreme' ? 'Rương Chí Bảo đã mở' : 'Rương Báu đã mở');
    loot.hidden = true;
    fx.classList.add('is-open');
    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const showLoot = () => { loot.hidden = false; stage.classList.remove('is-shake'); };
    const src = kind === 'supreme'
      ? 'assets/ui/festival/fx/supreme-open.webp'
      : 'assets/ui/festival/fx/chest-open.webp';
    if (reduced) {
      seq.removeAttribute('src');
      showLoot();
      return;
    }
    seq.removeAttribute('src');
    seq.src = src + '?fps=' + FX_FPS;
    stage.classList.add('is-shake');
    setTimeout(() => stage.classList.remove('is-shake'), 1200);
    setTimeout(showLoot, 2200);
  }

  function paintVault(root) {
    if (!root) return;
    let vault = root.querySelector('#hvFestVault');
    if (!vault) {
      vault = document.createElement('div');
      vault.id = 'hvFestVault';
      root.append(vault);
      vault.addEventListener('click', ev => {
        const btn = ev.target.closest('[data-vault-open]');
        if (!btn) return;
        if (document.getElementById('hvChestFx')?.classList.contains('is-open')) return;
        const kind = btn.getAttribute('data-vault-open');
        let result = null;
        if (typeof openBachBaoChest === 'function') result = openBachBaoChest(kind);
        else if (typeof honVietOpen === 'function') result = honVietOpen(kind);
        if (result && result.ok !== false) playChestFx(kind, result);
        const live = document.getElementById('hvFestivalRoot');
        paintVault(live || root);
      });
    }
    const bb = (typeof P === 'object' && P.bachBao) || {};
    const n = bb.chests || 0;
    const s = bb.supreme || 0;
    vault.innerHTML = `
      <p class="hv-vault-note">Rương trúng ở Bách Bảo (bấm Thưởng) sẽ nằm đây. Mở để nhận mảnh / ngọc / đồ.</p>
      <div class="hv-vault-card">
        <img src="assets/ui/festival/bbr/chest.png" alt="">
        <div><b>Rương Báu ×${n}</b><p>Mảnh S · S+ · ngọc. Trúng ô rương gỗ trên vành.</p></div>
        <button type="button" data-vault-open="normal" ${n < 1 ? 'disabled' : ''}>Mở</button>
      </div>
      <div class="hv-vault-card">
        <img src="assets/ui/festival/bbr/supreme.png" alt="">
        <div><b>Rương Chí Bảo ×${s}</b><p>Mảnh S+ · đồ cực phẩm. Trúng ô giữa trên/dưới vành.</p></div>
        <button type="button" data-vault-open="supreme" ${s < 1 ? 'disabled' : ''}>Mở</button>
      </div>`;
  }

  const restoreCity = root => {
    if (!root) return;
    if (prevFcity) {
      root.dataset.fcity = prevFcity;
      root.classList.toggle('is-tile-open', prevTileOpen);
    }
  };

  const syncOpen = name => {
    const root = hoist();
    if (!root) return;
    const open = name === 'festival';
    root.hidden = !open;
    root.classList.toggle('is-open', open);
    document.body.classList.toggle('festival-3d-active', open);
    if (open) {
      ensureCity(root);
      restoreCity(root);
      paintLamp(root);
    }
  };

  const baseShowScreen = showScreen;
  showScreen = function showScreenWithFestival3d(name) {
    baseShowScreen(name);
    syncOpen(ST.screen);
  };

  if (typeof renderFestival === 'function') {
    const baseRender = renderFestival;
    renderFestival = function renderFestivalWith3d() {
      const old = document.getElementById('hvFestivalRoot');
      if (old) {
        prevFcity = old.dataset.fcity || prevFcity;
        prevTileOpen = old.classList.contains('is-tile-open') || prevTileOpen;
      }
      baseRender.apply(this, arguments);
      syncOpen(typeof ST === 'object' ? ST.screen : 'festival');
    };
  }

  if (typeof releaseLantern === 'function') {
    const prevRelease = releaseLantern;
    releaseLantern = function releaseLanternWithRise() {
      const r = prevRelease.apply(this, arguments);
      if (r && r.ok) burstLamps();
      return r;
    };
  }

  syncOpen(typeof ST === 'object' ? ST.screen : '');
})();
