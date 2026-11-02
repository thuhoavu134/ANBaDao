(() => {
  if (typeof document === 'undefined' || !document.body) return;
  const body = document.getElementById('bagBody');
  if (!body || document.getElementById('hvBagRoot')) return;

  const root = document.createElement('section');
  root.id = 'hvBagRoot';
  root.setAttribute('aria-label', 'Túi đồ');
  root.innerHTML = `<div class="hv-bag-frame">
    <header class="hv-bag-top"><b>Túi đồ</b><span></span></header>
    <button type="button" class="hv-bag-close" data-bag-close aria-label="Đóng">×</button>
    <nav class="hv-bag-tabs">
      <button type="button" class="hv-bag-tab on" data-bag-tab="all">Tất cả</button>
      <button type="button" class="hv-bag-tab" data-bag-tab="gear">Trang bị</button>
      <button type="button" class="hv-bag-tab" data-bag-tab="shard">Mảnh</button>
      <button type="button" class="hv-bag-tab" data-bag-tab="mat">Đạo cụ</button>
    </nav>
    <div class="hv-bag-grid" data-bag-grid></div>
    <div class="hv-bag-detail" data-bag-detail></div>
    <div class="hv-bag-stage"></div>
  </div>`;
  root.querySelector('.hv-bag-stage').append(body);
  document.body.append(root);

  /* Owner 2026-11-01 — popup frame is the approved 4-column concept art; every piece of
     text, every slot and both buttons below are real elements laid on top of it.
     Data, use/sell/equip destinations and the item tooltip are unchanged. */
  const ui = { tab: 'all', sel: 0 };
  let tips = [];

  const ICO = {
    gold: 'assets/items/materials/gold.png',
    gems: 'assets/ui/festival/bbr/gems.png',
    tinh: 'assets/items/materials/tinh-luc.png',
    hoat: 'assets/items/materials/hoat-luc.png',
    so: 'assets/ui/festival/bbr/so.png'
  };

  const BAG_KNOWN = {
    mastery: {
      title: 'Sách Tinh Thông',
      icon: 'assets/result-victory-v6/tinh-thong.png',
      stars: 3,
      tone: 'gold',
      how: ['fest', 'camp'],
      what: 'Sách tăng Tinh Thông tướng.',
      use: 'Dùng cho tướng để tăng Tinh Thông. Rơi từ Bách Bảo Rương và Chinh chiến.',
      action: 'Dùng',
      go: 'heroes'
    },
    exp: {
      title: 'Sách EXP',
      icon: 'assets/result-victory-v6/sach-exp.png',
      stars: 3,
      tone: 'gold',
      how: ['fest', 'camp'],
      what: 'Sách kinh nghiệm tướng.',
      use: 'Dùng cho tướng để tăng EXP. Rơi từ Bách Bảo Rương và Chinh chiến.',
      action: 'Dùng',
      go: 'heroes'
    }
  };

  function knownBag(id) {
    const raw = String(id || '').normalize('NFC').toLowerCase();
    if (/tinh\s*thông|tinh.?thong|mastery/.test(raw)) return BAG_KNOWN.mastery;
    if (/sách\s*exp|sach.?exp/.test(raw)) return BAG_KNOWN.exp;
    return null;
  }

  const GEAR_ART = { weapon: 'vu-khi', armor: 'giap', charm: 'ngoc-boi', boots: 'giay' };

  function ico(src, alt) {
    return `<img class="hv-bag-ico" src="${src}" alt="${alt || ''}">`;
  }

  function cell(cls, label, n, title, tip) {
    const i = tips.length;
    const t = tip || { title, what: title, use: '' };
    t.cls = cls;
    tips.push(t);
    const nn = (n === '+0' || n === '') ? null : n;
    return `<button type="button" class="hv-bag-cell ${cls}" data-bag-i="${i}" aria-label="${title}">${label}${nn != null ? `<small>${nn}</small>` : ''}</button>`;
  }

  function gearCells(out) {
    const inv = P.inventory || [];
    inv.forEach(it => {
      const rar = String(it.rar || 'b').toLowerCase();
      const name = typeof itemName === 'function' ? itemName(it) : (it.slot || 'đồ');
      const slot = (typeof DATA === 'object' && DATA.items && DATA.items.slotName && DATA.items.slotName[it.slot]) || it.slot || '';
      const art = GEAR_ART[it.slot];
      const pic = art ? ico(`assets/items/equipment/slots/${art}-${rar}.webp`, name) : (it.slot || '?').slice(0, 2);
      out.push(cell('t-' + rar, pic, '+' + (it.lvl || 0), name, {
        title: name, ic: '⚔️', icon: art ? `assets/items/equipment/slots/${art}-${rar}.webp` : undefined,
        qty: 1, tone: 'gold', how: ['hunt', 'forge'], lvl: it.lvl || 0, item: it, kind: slot ? 'Trang bị · ' + slot : 'Trang bị',
        what: (slot ? slot + ' · ' : '') + 'phẩm ' + rar.toUpperCase().replace('SSR', 'S+').replace('SS', 'S') + ' · +' + (it.lvl || 0) + '.',
        use: 'Mặc cho tướng ở Đội hình. Cường hoá ở Rèn (vàng + Hoạt, tối đa +15).',
        action: 'Dùng', go: 'heroes'
      }));
    });
    return inv.length;
  }

  function shardCells(out) {
    const shards = P.shards || {};
    const ids = Object.keys(shards).filter(id => shards[id] > 0);
    ids.forEach(id => {
      const n = shards[id];
      const hero = (typeof DATA === 'object' && DATA.heroes && DATA.heroes[id]) || {};
      const name = hero.name || id;
      const rar = String(hero.rarity || 'a').toLowerCase();
      const need = rar === 'ssr' || rar === 'ss' ? 50 : (rar === 's' ? 30 : (rar === 'a' ? 20 : 10));
      const art = typeof characterAsset === 'function' ? characterAsset(id, 'icon') : null;
      out.push(cell('t-ss', art ? ico(art, name) : '◆', n, name, {
        title: 'Mảnh ' + name, ic: '🧩', icon: art || undefined, qty: n, tone: 'shard', how: ['shop', 'fest', 'summon', 'camp'],
        what: 'Đang có ' + n + ' mảnh. Cần ' + need + ' để mở tướng.',
        use: 'Đủ mảnh thì mở tướng. Thêm mảnh để lên sao, tăng lực chiến.',
        action: 'Dùng', go: 'heroes'
      }));
    });
    return ids.length;
  }

  function matCells(out) {
    out.push(cell('t-mat', ico(ICO.gold, 'Vàng'), P.gold, 'Vàng', {
      title: 'Vàng', icon: ICO.gold, qty: P.gold, tone: 'gold', how: ['camp', 'daily', 'mail', 'fest'],
      what: 'Tiền tệ chính.', use: 'Lên cấp tướng, trả rèn/cường, mua quầy vàng ở Chợ.',
      act: 'Chợ', go: 'shop'
    }));
    out.push(cell('t-mat', ico(ICO.gems, 'Ngọc'), P.gems, 'Ngọc', {
      title: 'Ngọc', icon: ICO.gems, qty: P.gems, tone: 'gem', how: ['daily', 'fest', 'shop'],
      what: 'Tiền hiếm.', use: 'Gọi tướng, mua gói ngọc ở Chợ, đổi đồ giá trị.',
      act: 'Gọi tướng', go: 'summon'
    }));
    out.push(cell('t-mat', ico(ICO.tinh, 'Tinh Lực'), P.tinh || 0, 'Tinh', {
      title: 'Tinh Lực', icon: ICO.tinh, qty: P.tinh || 0, tone: 'craft', how: ['shop', 'daily', 'fest'],
      what: 'Nguyên liệu rèn.', use: 'Rèn trang bị ở Rèn (20/lần). Chế 10 sò Bách Bảo (25 Tinh + 25 Hoạt).',
      action: 'Dùng', go: 'forge'
    }));
    out.push(cell('t-mat', ico(ICO.hoat, 'Hoạt Lực'), P.hoat || 0, 'Hoạt', {
      title: 'Hoạt Lực', icon: ICO.hoat, qty: P.hoat || 0, tone: 'craft', how: ['shop', 'fest'],
      what: 'Nguyên liệu cường hoá.', use: 'Cường trang bị ở Rèn. Chế sò Bách Bảo (25 Hoạt).',
      action: 'Dùng', go: 'forge'
    }));
    out.push(cell('t-mat', ico(ICO.so, 'Sò'), P.so || 0, 'Sò', {
      title: 'Sò', icon: ICO.so, qty: P.so || 0, tone: 'so', how: ['forge', 'fest'],
      what: 'Vé cược Bách Bảo Rương.', use: 'Cược 2 / 10 / 50 sò mỗi lượt quay. Chế sò ở Rèn.',
      action: 'Dùng', go: 'festival'
    }));
    const bag = P.bag || {};
    Object.keys(bag).forEach(id => {
      if (!bag[id]) return;
      const known = knownBag(id);
      out.push(cell('t-a', known && known.icon ? ico(known.icon, known.title) : '◆', bag[id], known ? known.title : id, Object.assign({
        title: id, ic: '◆', qty: bag[id], tone: 'gold', how: ['shop', 'mail', 'fest'],
        what: 'Đạo cụ trong túi.', use: 'Giữ trong túi. Dùng khi sự kiện hoặc rèn yêu cầu.'
      }, known || {}, { qty: bag[id] })));
    });
  }

  function paintGrid() {
    const grid = root.querySelector('[data-bag-grid]');
    if (!grid || typeof P !== 'object') return;
    tips = [];
    const out = [];
    if (ui.tab === 'all' || ui.tab === 'gear') gearCells(out);
    if (ui.tab === 'all' || ui.tab === 'shard') shardCells(out);
    if (ui.tab === 'all' || ui.tab === 'mat') matCells(out);
    grid.innerHTML = out.length ? out.join('') : '<div class="hv-bag-empty">Chưa có vật phẩm nào.</div>';
    if (ui.sel > tips.length - 1) ui.sel = 0;
    grid.querySelectorAll('[data-bag-i]').forEach(el => {
      el.classList.toggle('on', Number(el.getAttribute('data-bag-i')) === ui.sel);
    });
    paintDetail();
  }

  function paintDetail() {
    const box = root.querySelector('[data-bag-detail]');
    if (!box) return;
    const info = tips[ui.sel];
    if (!info) {
      box.innerHTML = '<div class="hv-bag-sub" style="position:absolute;left:6cqw;top:12cqw">Chọn một vật phẩm trong túi.</div>';
      return;
    }
    const pic = info.icon
      ? `<img src="${info.icon}" alt="">`
      : `<u>${info.ic || '◆'}</u>`;
    const act = info.action || info.act || 'Chi tiết';
    const canGo = !!(info.go || info.buyKey);
    box.innerHTML = `<div class="hv-bag-pic ${info.cls || ''}">${pic}</div>
      <div class="hv-bag-name">${info.title || ''}</div>
      <div class="hv-bag-sub">Số lượng: ${info.qty != null ? info.qty : '—'}${info.what ? ' · ' + info.what : ''}</div>
      <div class="hv-bag-desc">${info.use || info.what || ''}</div>
      <button type="button" class="hv-bag-act use" data-bag-act${canGo ? '' : ' disabled'}>${act}</button>`;
  }

  const close = () => { if (typeof navTo === 'function') navTo('hub'); };

  function useItem(info) {
    if (!info) return;
    if (info.buyKey && typeof buyShop === 'function') { buyShop(info.buyKey); return; }
    if (info.go && typeof navTo === 'function') navTo(info.go);
  }

  const syncOpen = name => {
    const open = name === 'bag';
    root.hidden = !open;
    root.classList.toggle('is-open', open);
    document.body.classList.toggle('bag-hall-active', open);
    if (open) {
      if (typeof renderBag === 'function') renderBag();
      paintGrid();
    }
  };

  const baseShowScreen = showScreen;
  showScreen = function showScreenWithBagHall(name) {
    baseShowScreen(name);
    syncOpen(ST.screen);
  };

  root.querySelector('[data-bag-close]').addEventListener('click', close);
  root.addEventListener('click', ev => { if (ev.target === root) close(); });
  root.querySelectorAll('[data-bag-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      ui.tab = btn.getAttribute('data-bag-tab');
      ui.sel = 0;
      root.querySelectorAll('[data-bag-tab]').forEach(x => x.classList.toggle('on', x === btn));
      paintGrid();
    });
  });
  root.querySelector('[data-bag-grid]')?.addEventListener('click', ev => {
    const btn = ev.target.closest('[data-bag-i]');
    if (!btn) return;
    ui.sel = Number(btn.getAttribute('data-bag-i'));
    root.querySelectorAll('[data-bag-i]').forEach(el => el.classList.toggle('on', el === btn));
    paintDetail();
    if (typeof window.hvShowItemTip === 'function') window.hvShowItemTip(tips[ui.sel]);
  });
  root.querySelector('[data-bag-detail]')?.addEventListener('click', ev => {
    const info = tips[ui.sel];
    if (ev.target.closest('[data-bag-act]')) { useItem(info); return; }
    if (ev.target.closest('[data-bag-more]') && typeof window.hvShowItemTip === 'function') window.hvShowItemTip(info);
  });
  syncOpen(typeof ST === 'object' ? ST.screen : '');

  function pinResIcons() {
    const map = [
      ['rGoldBtn', ICO.gold, 'Vàng'],
      ['rGemsBtn', ICO.gems, 'Ngọc'],
      ['rSoBtn', ICO.so, 'Sò']
    ];
    map.forEach(([id, src, alt]) => {
      const el = document.getElementById(id);
      if (!el || el.querySelector('img.hv-res-ico')) return;
      const img = document.createElement('img');
      img.className = 'hv-res-ico';
      img.src = src;
      img.alt = alt;
      el.insertBefore(img, el.firstChild);
      el.childNodes.forEach(n => {
        if (n.nodeType === 3) n.textContent = n.textContent.replace(/[🪙💎🐚]\s*/g, '');
      });
    });
  }
  if (typeof refreshResbar === 'function') {
    const baseRes = refreshResbar;
    refreshResbar = function refreshResbarWithIcons() {
      baseRes();
      pinResIcons();
    };
  }
  pinResIcons();
})();
