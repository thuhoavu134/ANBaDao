(() => {
  if (typeof document === 'undefined' || !document.body) return;
  const body = document.getElementById('mailBody');
  if (!body || document.getElementById('hvMailRoot')) return;

  const root = document.createElement('section');
  root.id = 'hvMailRoot';
  root.setAttribute('aria-label', 'Hòm thư');
  root.innerHTML = `<button type="button" class="hv-mail-back" data-mail-close aria-label="Đóng">×</button>
  <div class="hv-mail-frame">
    <header class="hv-mail-top"><b>Hòm thư</b><span></span></header>
    <div class="hv-mail-stage"></div>
  </div>`;
  root.querySelector('.hv-mail-stage').append(body);
  document.body.append(root);

  /* Owner 2026-11-01 — concept 2: lacquered wood frame, scroll plaque, system/gift tabs,
     mail rows with wax-sealed envelopes, parchment reader with rarity item slots.
     Claiming still goes through the frozen claimMail()/claimAllMail() commands. */
  const ui = { tab: null, sel: null };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const ago = t => {
    if (!t) return '';
    const m = Math.max(0, Math.round((Date.now() - t) / 60000));
    if (m < 1) return 'Vừa xong';
    if (m < 60) return m + ' phút trước';
    const h = Math.round(m / 60);
    if (h < 24) return h + ' giờ trước';
    return Math.round(h / 24) + ' ngày trước';
  };
  const ENV = '<svg viewBox="0 0 44 32" aria-hidden="true"><rect x="1" y="1" width="42" height="30" rx="3" fill="#f3e3bf" stroke="#a7834a"/><path d="M1.5 2.5 22 18 42.5 2.5" fill="none" stroke="#a7834a" stroke-width="1.6"/><circle cx="22" cy="17" r="6.2" fill="#8e1d14" stroke="#5a0f08"/><circle cx="22" cy="17" r="3.2" fill="none" stroke="#e08a6a" stroke-width="1"/></svg>';
  const GIFT = '<svg class="gf" viewBox="0 0 18 18" aria-hidden="true"><rect x="1.5" y="7" width="15" height="9.5" rx="1.5" fill="#d63b2a" stroke="#6a1208"/><rect x="1" y="4.5" width="16" height="3.5" rx="1" fill="#f0503a" stroke="#6a1208"/><rect x="7.6" y="4.5" width="2.8" height="12" fill="#f6d36a"/><path d="M9 4.5C6 1 3.5 2.6 5 4.5M9 4.5c3-3.5 5.5-1.9 4 0" fill="none" stroke="#f6d36a" stroke-width="1.4"/></svg>';
  const heroName = id => {
    try { const h = DATA.heroes[id]; return (h && (h.name || h.n)) || id; } catch (_) { return id; }
  };
  const items = rw => {
    if (!rw) return [];
    const out = [];
    if (rw.gold) out.push({ img: 'assets/items/materials/gold.png', n: rw.gold, label: 'Vàng', r: '' });
    if (rw.gems) out.push({ img: 'assets/ui/menu-v3233/icons/resource-gem-imagen.png', n: rw.gems, label: 'Ngọc', r: 'r-blue' });
    if (rw.tinh) out.push({ img: 'assets/items/materials/tinh-luc.png', n: rw.tinh, label: 'Tinh lực', r: 'r-blue' });
    if (rw.hoat) out.push({ img: 'assets/items/materials/hoat-luc.png', n: rw.hoat, label: 'Hoạt lực', r: 'r-green' });
    if (rw.shards && rw.shardHero) out.push({ img: '', n: rw.shards, label: 'Mảnh ' + heroName(rw.shardHero), r: 'r-purple', glyph: 'M' });
    return out;
  };
  const fmtN = n => (n >= 10000 ? Math.round(n / 1000) + 'K' : String(n));

  function draw() {
    const all = (typeof P === 'object' && P && P.mail) || [];
    const gift = all.filter(m => m.reward);
    const sys = all.filter(m => !m.reward);
    if (!ui.tab) ui.tab = gift.length ? 'gift' : 'sys';
    const list = ui.tab === 'gift' ? gift : sys;
    if (!list.some(m => m.id === ui.sel)) ui.sel = list.length ? list[0].id : null;
    const sel = list.find(m => m.id === ui.sel) || null;
    const giftOpen = gift.filter(m => !m.claimed).length;
    const sysNew = sys.filter(m => !m.read).length;
    const unclaimed = typeof mailUnclaimed === 'function' ? mailUnclaimed() : giftOpen;

    const rows = list.map(m => {
      const open = m.reward && !m.claimed;
      return `<button type="button" class="mx-row${m.id === ui.sel ? ' on' : ''}${m.claimed && m.reward ? ' done' : ''}" data-mail="${m.id}">
        <span class="mx-env">${ENV}${open ? '<span class="bd">1</span>' : ''}${m.reward ? GIFT : ''}</span>
        <span><span class="mx-t" style="display:block">${esc(m.title)}</span><span class="mx-f" style="display:block">${esc(m.from)}</span></span>
        <span class="mx-time">${esc(ago(m.t))}</span>
      </button>`;
    }).join('');

    let detail = '';
    if (sel) {
      const its = items(sel.reward);
      const slots = its.map(it => `<span class="mx-slot ${it.r}"><b>${it.img ? `<img src="${it.img}" alt="">` : `<u>${it.glyph || '?'}</u>`}<em>x${fmtN(it.n)}</em></b><small>${esc(it.label)}</small></span>`).join('');
      const claimBtn = sel.reward
        ? (sel.claimed ? '<div class="mx-claimed">✓ Đã nhận</div>' : `<button type="button" class="mx-btn" data-claim="${sel.id}">NHẬN</button>`)
        : '';
      detail = `<div class="mx-detail">
        <div><div class="mx-dt">${esc(sel.title)}</div><div class="mx-db">${esc(sel.body)}</div></div>
        <div class="mx-acts">${claimBtn}<button type="button" class="mx-btn alt" data-claim-all ${unclaimed ? '' : 'disabled'}>NHẬN TẤT CẢ</button></div>
        ${slots ? `<div class="mx-items">${slots}</div>` : ''}
      </div>`;
    }

    body.innerHTML = `<div class="mx-tabs">
        <button type="button" class="mx-tab${ui.tab === 'sys' ? ' on' : ''}" data-tab="sys">Thư hệ thống${sysNew ? `<i>${sysNew}</i>` : ''}</button>
        <button type="button" class="mx-tab${ui.tab === 'gift' ? ' on' : ''}" data-tab="gift">Thư quà${giftOpen ? `<i>${giftOpen}</i>` : ''}</button>
      </div>
      <div class="mx-list">${rows || '<div class="mx-empty">Chưa có thư nào.</div>'}</div>
      ${detail}`;
    if (sel && !sel.read) sel.read = true;
  }

  body.addEventListener('click', ev => {
    const t = ev.target.closest('[data-tab],[data-mail],[data-claim],[data-claim-all]');
    if (!t || !body.contains(t)) return;
    if (t.dataset.tab) { ui.tab = t.dataset.tab; ui.sel = null; draw(); return; }
    if (t.dataset.mail) { ui.sel = +t.dataset.mail; draw(); return; }
    if (t.dataset.claim) {
      if (typeof claimMail === 'function' && claimMail(+t.dataset.claim)) {
        if (typeof toast === 'function') toast('Đã nhận quà thư.');
      }
      draw(); return;
    }
    if (t.hasAttribute('data-claim-all')) {
      const n = typeof claimAllMail === 'function' ? claimAllMail() : 0;
      if (n && typeof toast === 'function') toast('Nhận ' + n + ' thư.');
      draw();
    }
  });

  if (typeof renderMail === 'function') {
    renderMail = function renderMailLacquer() { draw(); };
  }

  const syncOpen = name => {
    const open = name === 'mail';
    root.hidden = !open;
    root.classList.toggle('is-open', open);
    document.body.classList.toggle('mail-hall-active', open);
    if (open) draw();
  };

  const baseShowScreen = showScreen;
  showScreen = function showScreenWithMailHall(name) {
    baseShowScreen(name);
    syncOpen(ST.screen);
  };

  root.querySelector('[data-mail-close]').addEventListener('click', () => navTo('hub'));
  syncOpen(typeof ST === 'object' ? ST.screen : '');
})();
