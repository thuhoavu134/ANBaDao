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
          title: name,
          what: (slot ? slot + ' · ' : '') + 'phẩm ' + rar.toUpperCase().replace('SSR', 'S+').replace('SS', 'S') + ' · +' + (it.lvl || 0) + '.',
          use: 'Mặc cho tướng ở Đội hình. Cường hoá ở Rèn (vàng + Hoạt, tối đa +15). Phẩm càng cao chỉ số càng mạnh.'
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
          title: 'Mảnh ' + name,
          what: 'Đang có ' + n + ' mảnh. Cần ' + need + ' để mở tướng.',
          use: 'Đủ mảnh thì mở tướng. Thêm mảnh để lên sao, tăng lực chiến. Kiếm từ Chợ, Bách Bảo, ải, thư.'
        });
      });
    } else {
      html += cell('t-mat', '🪙', P.gold, 'Vàng', {
        title: 'Vàng', what: 'Tiền tệ chính.', use: 'Lên cấp tướng, trả rèn/cường, mua quầy vàng ở Chợ.'
      });
      html += cell('t-mat', '💎', P.gems, 'Ngọc', {
        title: 'Ngọc', what: 'Tiền hiếm.', use: 'Gọi mộng (gacha), mua gói ngọc ở Chợ, đổi đồ giá trị.'
      });
      html += cell('t-mat', '⚗', P.tinh || 0, 'Tinh', {
        title: 'Tinh Lực', what: 'Nguyên liệu rèn.', use: 'Rèn trang bị ở Rèn (20/lần). Chế 10 sò Bách Bảo (25 Tinh + 25 Hoạt).'
      });
      html += cell('t-mat', '🔥', P.hoat || 0, 'Hoạt', {
        title: 'Hoạt Lực', what: 'Nguyên liệu cường hoá.', use: 'Cường trang bị ở Rèn. Chế sò Bách Bảo (25 Hoạt).'
      });
      html += cell('t-mat', '🐚', P.so || 0, 'Sò', {
        title: 'Sò', what: 'Vé cược Bách Bảo Rương.', use: 'Cược 2 / 10 / 50 sò mỗi lượt quay. Chế sò ở Rèn. Đổi sò nếu không nhận thưởng vành.'
      });
      const bag = P.bag || {};
      Object.keys(bag).forEach(id => {
        if (bag[id]) html += cell('t-a', id.slice(-2), bag[id], id, {
          title: id, what: 'Đạo cụ trong túi.', use: 'Giữ trong túi. Dùng khi sự kiện hoặc rèn yêu cầu.'
        });
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
