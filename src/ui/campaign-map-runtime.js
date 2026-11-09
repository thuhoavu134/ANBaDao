// Chiến Dịch · Giang Hồ Đồ (owner chọn Mẫu B 09/11).
// Như Mộng Lộ / Săn Boss: nút, khung, ấn sáp VẼ SẴN trong ảnh gpt_image
// (assets/ui/campaign/giang-ho-do.webp, 941x1672). Ở đây chỉ đặt chữ + vùng
// bấm trong suốt theo toạ độ % đo trên ảnh. Không đụng logic chinh chiến cũ:
// "Vào ải" đóng bản đồ để lộ màn treo máy; ấn chương mở cốt truyện chương đó.
(() => {
  if (typeof document === 'undefined' || !document.body) return;

  // Toạ độ tâm 6 ấn sáp trên cuộn (% theo ảnh), theo thứ tự chương 1→6.
  const NODES = [
    [16.0, 63.2], [23.7, 50.7], [32.9, 41.3], [61.5, 44.0], [76.3, 31.3], [80.4, 25.9]
  ];
  let open = false;

  function unlocked() {
    const u = (typeof P === 'object' && P && P.unlockedChapters) || 1;
    return Math.max(1, Math.min(6, Number(u) || 1));
  }
  function chapters() {
    return (typeof DATA === 'object' && Array.isArray(DATA.chapters)) ? DATA.chapters : [];
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }

  function render(root) {
    const chs = chapters();
    const un = unlocked();
    const cur = Math.min(un, chs.length || 6) - 1;
    const ch = chs[cur] || { name: '', desc: '' };
    const gold = (typeof P === 'object' && P) ? (P.gold || 0) : 0;
    const fmt = n => (typeof fmtNum === 'function' ? fmtNum(n) : Number(n).toLocaleString('vi-VN'));
    root.innerHTML = `
      <div class="hvcm-stage">
        <button type="button" class="hvcm-back" data-cm-back aria-label="Về Thành Chính"></button>
        <span class="hvcm-plaque">Giang Hồ Đồ</span>
        <span class="hvcm-gold"><b>${fmt(gold)}</b></span>
        ${NODES.map(([x, y], i) => {
          const state = i < cur ? 'is-done' : i === cur ? 'is-now' : (i < un ? 'is-open' : 'is-lock');
          const c = chs[i] || {};
          return `<button type="button" class="hvcm-node ${state}" style="left:${x}%;top:${y}%" data-cm-ch="${i}" ${i >= un ? 'disabled' : ''} aria-label="Chương ${i + 1}: ${esc(c.name)}"><span>${i + 1}</span></button>`;
        }).join('')}
        <section class="hvcm-info">
          <small>Chương ${cur + 1}/6</small>
          <b>${esc(ch.name)}</b>
          <p>${esc(ch.desc)}</p>
        </section>
        <button type="button" class="hvcm-go" data-cm-go><span>Vào ải</span></button>
        <button type="button" class="hvcm-story" data-cm-story><span>Truyện</span></button>
      </div>`;
  }

  function close() {
    const root = document.getElementById('hvCampMap');
    if (root) root.hidden = true;
    open = false;
  }

  function show() {
    let root = document.getElementById('hvCampMap');
    if (!root) {
      root = document.createElement('section');
      root.id = 'hvCampMap';
      root.setAttribute('aria-label', 'Giang Hồ Đồ');
      document.body.append(root);
      root.addEventListener('click', ev => {
        const t = ev.target.closest('button');
        if (!t || t.disabled) return;
        if (t.hasAttribute('data-cm-back')) { close(); if (typeof navTo === 'function') navTo('hub'); return; }
        if (t.hasAttribute('data-cm-go')) { close(); return; }
        const idx = t.hasAttribute('data-cm-story') ? unlocked() - 1 : (t.dataset.cmCh != null ? Number(t.dataset.cmCh) : -1);
        if (idx >= 0) {
          close();
          if (typeof startChapter === 'function') startChapter(idx);
        }
      });
    }
    render(root);
    root.hidden = false;
    open = true;
  }

  window.HonVietCampMap = Object.freeze({ show, close, isOpen: () => open });

  if (typeof showScreen === 'function') {
    const base = showScreen;
    showScreen = function showScreenWithCampMap(name) {
      const r = base.apply(this, arguments);
      if (name === 'campaign') show();
      else close();
      return r;
    };
  }
})();
