(() => {
  if (typeof document === 'undefined' || !document.body) return;
  const body = document.getElementById('bagBody');
  if (!body || document.getElementById('hvBagRoot')) return;

  const root = document.createElement('section');
  root.id = 'hvBagRoot';
  root.setAttribute('aria-label', 'Túi đồ');
  root.innerHTML = `<div class="hv-bag-panel">
    <header class="hv-bag-top">
      <button type="button" class="hv-bag-back" data-bag-close aria-label="Đóng">‹</button>
      <b>Túi đồ</b>
      <span></span>
    </header>
    <nav class="hv-bag-tabs">
      <button type="button" data-bag-tab="gear" class="is-on">Trang bị</button>
      <button type="button" data-bag-tab="shard">Mảnh</button>
      <button type="button" data-bag-tab="mat">Đạo cụ</button>
    </nav>
    <div class="hv-bag-grid" data-bag-grid></div>
    <div class="hv-bag-stage"></div>
  </div>`;
  root.querySelector('.hv-bag-stage').append(body);
  document.body.append(root);

  let tab = 'gear';

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

  function cell(cls, label, n, title, tip) {
    const i = tips.length;
    tips.push(tip || { title, what: title, use: '' });
    return `<button type="button" class="hv-bag-cell ${cls}" data-bag-i="${i}">${label}${n != null ? `<small>${n}</small>` : ''}</button>`;
  }

  let tips = [];

  function paintGrid() {
    const grid = root.querySelector('[data-bag-grid]');
    if (!grid || typeof P !== 'object') return;
    tips = [];
    let html = '';
    if (tab === 'gear') {
      const inv = P.inventory || [];
      if (!inv.length) html = '<div style="grid-column:1/-1;padding:18px;color:#6a4318;text-align:center">Kho trống — rèn để có đồ.</div>';
      else inv.forEach(it => {
        const rar = String(it.rar || 'b').toLowerCase();
        const name = typeof itemName === 'function' ? itemName(it) : (it.slot || 'đồ');
        const slot = (typeof DATA === 'object' && DATA.items && DATA.items.slotName && DATA.items.slotName[it.slot]) || it.slot || '';
        html += cell('t-' + rar, (it.slot || '?').slice(0, 2), '+' + (it.lvl || 0), name, {
          title: name, ic: '⚔️', qty: 1, tone: 'gold', how: ['forge', 'fest'],
          what: (slot ? slot + ' · ' : '') + 'phẩm ' + rar.toUpperCase().replace('SSR', 'S+').replace('SS', 'S') + ' · +' + (it.lvl || 0) + '.',
          use: 'Mặc cho tướng ở Đội hình. Cường hoá ở Rèn (vàng + Hoạt, tối đa +15).',
          action: 'Dùng', go: 'heroes'
        });
      });
    } else if (tab === 'shard') {
      const shards = P.shards || {};
      const ids = Object.keys(shards).filter(id => shards[id] > 0);
      if (!ids.length) html = '<div style="grid-column:1/-1;padding:18px;color:#6a4318;text-align:center">Chưa có mảnh.</div>';
      else ids.forEach(id => {
        const n = shards[id];
        const hero = (typeof DATA === 'object' && DATA.heroes && DATA.heroes[id]) || {};
        const name = hero.name || id;
        const rar = String(hero.rarity || 'a').toLowerCase();
        const need = rar === 'ssr' || rar === 'ss' ? 50 : (rar === 's' ? 30 : (rar === 'a' ? 20 : 10));
        html += cell('t-ss', name.slice(0, 2), n, name, {
          title: 'Mảnh ' + name, ic: '🧩', qty: n, tone: 'shard', how: ['shop', 'fest', 'summon', 'camp'],
          what: 'Đang có ' + n + ' mảnh. Cần ' + need + ' để mở tướng.',
          use: 'Đủ mảnh thì mở tướng. Thêm mảnh để lên sao, tăng lực chiến.',
          action: 'Dùng', go: 'heroes'
        });
      });
    } else {
      html += cell('t-mat', '🪙', P.gold, 'Vàng', {
        title: 'Vàng', ic: '🪙', qty: P.gold, tone: 'gold', how: ['camp', 'daily', 'mail', 'fest'],
        what: 'Tiền tệ chính.', use: 'Lên cấp tướng, trả rèn/cường, mua quầy vàng ở Chợ.'
      });
      html += cell('t-mat', '💎', P.gems, 'Ngọc', {
        title: 'Ngọc', ic: '💎', qty: P.gems, tone: 'gem', how: ['daily', 'fest', 'shop'],
        what: 'Tiền hiếm.', use: 'Gọi tướng, mua gói ngọc ở Chợ, đổi đồ giá trị.'
      });
      html += cell('t-mat', '⚗', P.tinh || 0, 'Tinh', {
        title: 'Tinh Lực', ic: '⚗', qty: P.tinh || 0, tone: 'craft', how: ['shop', 'daily', 'fest'],
        what: 'Nguyên liệu rèn.', use: 'Rèn trang bị ở Rèn (20/lần). Chế 10 sò Bách Bảo (25 Tinh + 25 Hoạt).',
        action: 'Dùng', go: 'forge'
      });
      html += cell('t-mat', '🔥', P.hoat || 0, 'Hoạt', {
        title: 'Hoạt Lực', ic: '🔥', qty: P.hoat || 0, tone: 'craft', how: ['shop', 'fest'],
        what: 'Nguyên liệu cường hoá.', use: 'Cường trang bị ở Rèn. Chế sò Bách Bảo (25 Hoạt).',
        action: 'Dùng', go: 'forge'
      });
      html += cell('t-mat', '🐚', P.so || 0, 'Sò', {
        title: 'Sò', ic: '🐚', qty: P.so || 0, tone: 'so', how: ['forge', 'fest'],
        what: 'Vé cược Bách Bảo Rương.', use: 'Cược 2 / 10 / 50 sò mỗi lượt quay. Chế sò ở Rèn.',
        action: 'Dùng', go: 'festival'
      });
      const bag = P.bag || {};
      Object.keys(bag).forEach(id => {
        if (!bag[id]) return;
        const known = knownBag(id);
        html += cell('t-a', known ? '📖' : id.slice(-2), bag[id], known ? known.title : id, Object.assign({
          title: id, ic: '◆', qty: bag[id], tone: 'gold', how: ['shop', 'mail', 'fest'],
          what: 'Đạo cụ trong túi.', use: 'Giữ trong túi. Dùng khi sự kiện hoặc rèn yêu cầu.'
        }, known || {}, { qty: bag[id] }));
      });
    }
    grid.innerHTML = html;
  }

  const close = () => { if (typeof navTo === 'function') navTo('hub'); };

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
      tab = btn.getAttribute('data-bag-tab');
      root.querySelectorAll('[data-bag-tab]').forEach(x => x.classList.toggle('is-on', x === btn));
      paintGrid();
    });
  });
  root.querySelector('[data-bag-grid]')?.addEventListener('click', ev => {
    const btn = ev.target.closest('[data-bag-i]');
    if (!btn) return;
    const info = tips[Number(btn.getAttribute('data-bag-i'))];
    if (!info) return;
    if (typeof window.hvShowItemTip === 'function') window.hvShowItemTip(info);
  });
  syncOpen(typeof ST === 'object' ? ST.screen : '');
})();
