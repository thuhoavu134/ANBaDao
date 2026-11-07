/* Owner 2026-11-06: Dau Truong = 1 san vo duong (concept B), 3 khu tren cung san.
   Tren = Vo Dai (pve), giua = Dau Hang (pvp), duoi = Mua (season). Chon khu -> nen luot + phong toi khu do.
   Chi doc du lieu that va bam lai nut that; khong tu xu ly logic dau truong. */
(() => {
  if (typeof document === 'undefined') return;
  const BG = 'assets/ui/arena/arena-courtyard.webp';
  const ZONES = { pve: { y: 24, x: 20, label: 'Võ Đài', sub: 'Thí luyện · điểm Mùa' }, pvp: { y: 52, x: 50, label: 'Đấu Hạng', sub: 'Thắng ai chiếm hạng' }, season: { y: 82, x: 80, label: 'Mùa', sub: 'Hạng mùa · quà mốc' } };
  const ENERGY = 'assets/ui/menu-v3233/icons/resource-energy-imagen.png';
  // Bo moi emoji (tranh moi may ve mot kieu), rieng tia set doi sang icon nang luong that cua game
  const STRIP = /(?!\u26A1)[\p{Extended_Pictographic}\uFE0F\u200D]/gu;

  // QA: ?qa=unlock-all mo khoa Dau Truong (mac dinh khoa toi chuong 3) de link test vao thang
  try {
    if (new URLSearchParams(location.search).get('qa') === 'unlock-all' && typeof featLocked === 'function') {
      const base = featLocked;
      featLocked = function qaFeatLocked(name) { return name === 'arena' || name === 'tower' ? false : base.apply(this, arguments); };
    }
  } catch (_) {}

  function clean(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) { const v = walker.currentNode.nodeValue || ''; STRIP.lastIndex = 0; if (STRIP.test(v) || v.includes('\u26A1')) nodes.push(walker.currentNode); }
    for (const n of nodes) {
      const parts = (n.nodeValue || '').replace(STRIP, '').split('\u26A1');
      const frag = document.createDocumentFragment();
      parts.forEach((t, i) => {
        if (t) frag.append(document.createTextNode(i === 0 ? t.replace(/^\s+/, '') : t));
        if (i < parts.length - 1) { const im = document.createElement('img'); im.src = ENERGY; im.alt = 'năng lượng'; im.className = 'hva-ico'; frag.append(im); }
      });
      n.replaceWith(frag);
    }
  }

  let busy = false;
  function mount() {
    if (busy) return;
    busy = true;
    try { mountInner(); } finally { busy = false; }
  }
  function mountInner() {
    const root = document.getElementById('hvArenaRoot');
    if (!root || !root.classList.contains('is-open')) return;
    // classList.add van ghi lai thuoc tinh khi class da co -> MutationObserver goi lai vo han. Chi them khi thieu.
    if (!root.classList.contains('hva-concept')) root.classList.add('hva-concept');
    let bg = root.querySelector(':scope > .hva-bg');
    if (!bg) { bg = document.createElement('div'); bg.className = 'hva-bg'; bg.style.backgroundImage = `url('${BG}')`; root.prepend(bg); }
    // Owner 06/11: bo man tong quan 1 san + 3 diem bam. Vao Dau Truong la vao thang 1 san,
    // doi san bang 3 tab duoi day (moi san la 1 man rieng).
    if (!root.classList.contains('is-tile-open')) {
      if (typeof ST === 'object' && !ST.arenaTab) ST.arenaTab = 'pvp';
      root.classList.add('is-tile-open');
      return;
    }
    const open = root.classList.contains('is-tile-open');
    const zone = open ? ((typeof ST === 'object' && ST.arenaTab) || 'season') : '';
    if (root.dataset.zone !== zone) root.dataset.zone = zone;
    // Bam khu tren san moi chi doi ST.arenaTab; noi dung khu do do nut tab cua game ve. Neu tab dang sang khac khu -> bam dung tab that.
    if (open && zone) {
      const want = root.querySelector(`[data-arena-tab="${zone}"]`);
      if (want && !want.classList.contains('is-on') && root.dataset.syncing !== zone) { root.dataset.syncing = zone; want.click(); return; }
      if (want && want.classList.contains('is-on')) delete root.dataset.syncing;
    }
    // bien hinh 3 o anh cu thanh bang go gan dung khu tren san
    root.querySelectorAll('#hvArenaCity .hv-atile').forEach((btn) => {
      const z = ZONES[btn.dataset.acity];
      if (!z || btn.dataset.hva === '1') return;
      btn.dataset.hva = '1';
      btn.style.setProperty('--y', z.y + '%');
      btn.style.setProperty('--x', z.x + '%');
      btn.innerHTML = `<i class="hva-bn-ic"><img src="assets/ui/arena/kit/ic-${btn.dataset.acity}.webp" alt=""></i><b>${z.label}</b>`;
      btn.setAttribute('aria-label', z.label + ' — ' + z.sub);
    });
    // tab duoi day doi khu: an dung vao renderArena cua game
    root.querySelectorAll('[data-arena-tab]').forEach((t) => {
      const z = ZONES[t.dataset.arenaTab];
      if (z && t.textContent.trim() !== z.label) t.textContent = z.label;
    });
    // Kit chung: nut quay ve vuong + khung bang anh (owner 2026-11-06)
    if (!document.querySelector('.hvk-back.hva-back')) {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'hvk-back hva-back'; b.setAttribute('aria-label', 'Quay ve Thanh Chinh');
      b.addEventListener('click', () => { const t = root.querySelector('[data-arena-back]'); if (t) t.click(); else if (typeof navTo === 'function') navTo('hub'); });
      document.body.append(b);
    }
    clean(root);
  }

  const start = () => {
    mount();
    // gom nhieu thay doi DOM vao 1 lan mount moi khung hinh, khong goi dong bo trong callback
    let queued = false;
    const schedule = () => { if (queued) return; queued = true; requestAnimationFrame(() => { queued = false; mount(); }); };
    new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'hidden'] });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
