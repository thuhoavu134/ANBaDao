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

  function cell(cls, label, n, title) {
    return `<button type="button" class="hv-bag-cell ${cls}" title="${title || label}">${label}${n != null ? `<small>${n}</small>` : ''}</button>`;
  }

  function paintGrid() {
    const grid = root.querySelector('[data-bag-grid]');
    if (!grid || typeof P !== 'object') return;
    let html = '';
    if (tab === 'gear') {
      const inv = P.inventory || [];
      if (!inv.length) html = '<div style="grid-column:1/-1;padding:18px;color:#6a4318;text-align:center">Kho trống — rèn để có đồ.</div>';
      else inv.forEach(it => {
        const rar = String(it.rar || 'b').toLowerCase();
        const name = typeof itemName === 'function' ? itemName(it) : (it.slot || 'đồ');
        html += cell('t-' + rar, (it.slot || '?').slice(0, 2), '+' + (it.lvl || 0), name);
      });
    } else if (tab === 'shard') {
      const shards = P.shards || {};
      const ids = Object.keys(shards).filter(id => shards[id] > 0);
      if (!ids.length) html = '<div style="grid-column:1/-1;padding:18px;color:#6a4318;text-align:center">Chưa có mảnh.</div>';
      else ids.forEach(id => {
        const n = shards[id];
        const name = (typeof DATA === 'object' && DATA.heroes && DATA.heroes[id] && DATA.heroes[id].name) || id;
        html += cell('t-ss', name.slice(0, 2), n, name);
      });
    } else {
      html += cell('t-mat', '🪙', P.gold, 'Vàng');
      html += cell('t-mat', '💎', P.gems, 'Ngọc');
      html += cell('t-mat', '⚗', P.tinh || 0, 'Tinh');
      html += cell('t-mat', '🔥', P.hoat || 0, 'Hoạt');
      html += cell('t-mat', '🐚', P.so || 0, 'Sò');
      const bag = P.bag || {};
      Object.keys(bag).forEach(id => { if (bag[id]) html += cell('t-a', id.slice(-2), bag[id], id); });
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
  syncOpen(typeof ST === 'object' ? ST.screen : '');
})();
