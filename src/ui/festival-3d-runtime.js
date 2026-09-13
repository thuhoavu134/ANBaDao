(() => {
  if (typeof document === 'undefined' || !document.body) return;

  const hoist = () => {
    const all = Array.from(document.querySelectorAll('#hvFestivalRoot'));
    if (!all.length) return null;
    const root = all.find(el => el.parentElement === document.body) || all[0];
    all.forEach(el => { if (el !== root) el.remove(); });
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
        if (!ev.target.closest('[data-fest-back]')) return;
        ev.preventDefault();
        ev.stopImmediatePropagation();
        if (root.classList.contains('is-tile-open')) {
          root.classList.remove('is-tile-open');
          root.dataset.fcity = '';
          prevFcity = '';
          prevTileOpen = false;
          return;
        }
        if (typeof navTo === 'function') navTo('hub');
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
  const FX_SHEET = { cols: 12, n: 145, cell: 180 };
  const sheetCache = {};

  function loadSheet(src) {
    if (sheetCache[src]) return Promise.resolve(sheetCache[src]);
    return new Promise((resolve, reject) => {
      const im = new Image();
      im.onload = () => { sheetCache[src] = im; resolve(im); };
      im.onerror = reject;
      im.src = src;
    });
  }

  function playSheet(cv, img, ondone) {
    const ctx = cv.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    const t0 = performance.now();
    const stage = cv.closest('.hv-chest-fx-stage');
    const burstAt = Math.floor(FX_SHEET.n * 0.38);
    const tick = () => {
      const i = Math.min(FX_SHEET.n - 1, Math.floor((performance.now() - t0) / 1000 * FX_FPS));
      const x = (i % FX_SHEET.cols) * FX_SHEET.cell;
      const y = Math.floor(i / FX_SHEET.cols) * FX_SHEET.cell;
      ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.drawImage(img, x, y, FX_SHEET.cell, FX_SHEET.cell, 0, 0, cv.width, cv.height);
      if (i >= burstAt) {
        stage?.classList.remove('is-shake');
        stage?.classList.add('is-burst');
      }
      if (i < FX_SHEET.n - 1) requestAnimationFrame(tick);
      else ondone();
    };
    requestAnimationFrame(tick);
  }

  function ensureFx() {
    let fx = document.getElementById('hvChestFx');
    if (fx) return fx;
    fx = document.createElement('div');
    fx.id = 'hvChestFx';
    fx.innerHTML = `
      <div class="hv-chest-fx-card">
        <div class="hv-chest-fx-stage">
          <canvas class="hv-chest-fx-seq" width="200" height="200"></canvas>
          <i class="hv-chest-fx-burst" aria-hidden="true"></i>
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
      const stage = fx.querySelector('.hv-chest-fx-stage');
      stage?.classList.remove('is-shake', 'is-burst', 'is-done');
      if (stage) stage.hidden = false;
      fx.classList.remove('is-open');
    });
    return fx;
  }

  function playChestFx(kind, result) {
    const fx = ensureFx();
    const cv = fx.querySelector('canvas');
    const stage = fx.querySelector('.hv-chest-fx-stage');
    const loot = fx.querySelector('.hv-chest-fx-loot');
    const img = loot.querySelector('img');
    const lab = loot.querySelector('b');
    img.src = lootArt(result, kind);
    lab.textContent = (result && result.msg) || (kind === 'supreme' ? 'Rương Chí Bảo đã mở' : 'Rương Báu đã mở');
    loot.hidden = true;
    stage.hidden = false;
    stage.classList.remove('is-done', 'is-burst', 'is-shake');
    fx.classList.add('is-open');
    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const showLoot = () => {
      loot.hidden = false;
      stage.classList.remove('is-shake', 'is-burst');
      stage.classList.add('is-done');
      stage.hidden = true;
    };
    const src = kind === 'supreme'
      ? 'assets/ui/festival/fx/supreme-sheet.webp'
      : 'assets/ui/festival/fx/chest-sheet.webp';
    if (reduced) {
      showLoot();
      return;
    }
    stage.classList.add('is-shake');
    loadSheet(src).then(sheet => playSheet(cv, sheet, showLoot)).catch(showLoot);
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
        prevTileOpen = old.classList.contains('is-tile-open');
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
