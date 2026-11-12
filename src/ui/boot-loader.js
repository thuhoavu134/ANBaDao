/* Owner 08/11: man tai co thanh tien do ngay sau dang nhap.
   Nap san anh cua MOI tuong dang so huu (idle, danh, chieu, trung don, chay, nga) + anh UI chinh,
   de vao tran / len dai doi hinh khong bi "tuong chua kip tai".
   Owner 12/11: PHAI tai het 100% moi vao game (bo moc 25 giay tu vao). Anh nao treo qua 20 giay
   thi tinh la xong anh do de thanh tien do van chay toi 100%, khong ket mai. */
(() => {
  const UI = [
    'assets/ui/team/team-concept-tray.webp', 'assets/ui/team/slot-frame.webp',
    'assets/ui/expedition/monglo-full.webp', 'assets/ui/expedition/back-medal.webp', 'assets/ui/expedition/floor-plaque.webp'
  ];
  let started = false;
  const css = `
#hvBoot{position:fixed;inset:0;z-index:2147483000;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;
  background:#1b130c url('assets/ui/loading/boot-bg.webp') center/cover no-repeat;transition:opacity .45s ease;font-family:inherit}
#hvBoot.is-done{opacity:0;pointer-events:none}
#hvBoot .hvb-box{width:min(92vw,420px);margin-bottom:calc(64px + env(safe-area-inset-bottom));display:flex;flex-direction:column;align-items:center;gap:8px}
#hvBoot .hvb-label{color:#fff3d6;font-size:15px;font-weight:700;text-shadow:0 1px 3px #000,0 0 8px rgba(0,0,0,.8);letter-spacing:.2px}
#hvBoot .hvb-bar{position:relative;width:100%;aspect-ratio:2158/336;background:url('assets/ui/loading/bar-frame.webp') center/100% 100% no-repeat}
#hvBoot .hvb-trough{position:absolute;left:15.6%;right:4.6%;top:27%;bottom:25%;border-radius:999px;overflow:hidden}
#hvBoot .hvb-fill{height:100%;width:0;background:linear-gradient(180deg,#ffe9a6 0%,#f2b73c 45%,#c97a16 100%);box-shadow:0 0 10px rgba(255,200,90,.8);transition:width .18s linear}
#hvBoot .hvb-pct{position:absolute;left:0;width:15.6%;top:0;bottom:0;display:grid;place-items:center;color:#fff3d6;font-size:12px;font-weight:800;text-shadow:0 1px 2px #000}
#hvBoot .hvb-tip{color:#ffe3ab;font-size:12.5px;text-shadow:0 1px 2px #000;text-align:center;max-width:92%}`;
  function urlsFor(id) {
    const slug = id.replace(/_/g, '-'), base = 'assets/characters/' + slug + '/';
    return fetch(base + 'runtime-meta.json', { cache: 'force-cache' })
      .then(r => r.ok ? r.json() : null)
      .then(m => {
        const out = [];
        if (!m || !m.clips) return out;
        Object.values(m.clips).forEach(c => {
          if (!c) return;
          if (c.file) out.push(base + c.file);
          (c.pages || []).forEach(p => p && p.file && out.push(base + p.file));
        });
        return out;
      }).catch(() => []);
  }
  function loadImg(src) {
    return new Promise(res => {
      const im = new Image(); im.decoding = 'async';
      let fin = false; const done = () => { if (!fin) { fin = true; res(); } };
      im.onload = () => { (im.decode ? im.decode().catch(() => {}) : Promise.resolve()).then(done); };
      im.onerror = done; im.src = src;
      setTimeout(done, 20000);
      (window.__hvBootKeep = window.__hvBootKeep || []).push(im);
    });
  }
  function run() {
    if (started) return; started = true;
    const st = document.createElement('style'); st.id = 'hvBootCss'; st.textContent = css; document.head.append(st);
    const el = document.createElement('div'); el.id = 'hvBoot';
    el.innerHTML = '<div class="hvb-box"><div class="hvb-label">Đang tải…</div><div class="hvb-bar"><div class="hvb-trough"><div class="hvb-fill"></div></div><div class="hvb-pct">0%</div></div><div class="hvb-tip">Mẹo: Xếp tướng đỡ đòn ở hàng trước để che chắn cho cả đội.</div></div>';
    document.body.append(el);
    const TIPS = ['Mẹo: Xếp tướng đỡ đòn ở hàng trước để che chắn cho cả đội.','Mẹo: Bấm Đội gợi ý nhiều lần để xem các kiểu đội khác nhau.','Mẹo: Mỗi tầng Mộng Lộ cho chọn một Phúc Mộng, chọn hợp với đội đang có.','Mẹo: Đấu Hạng mỗi tuần có thưởng theo bậc hạng.']; let tipI = 0; const tipEl = el.querySelector('.hvb-tip'); const tipT = setInterval(() => { if (!tipEl || !el.isConnected) { clearInterval(tipT); return; } tipI = (tipI + 1) % TIPS.length; tipEl.textContent = TIPS[tipI]; }, 3000);
  const fill = el.querySelector('.hvb-fill'), pct = el.querySelector('.hvb-pct'), label = el.querySelector('.hvb-label');
    const ids = Object.keys(P.heroes).filter(id => P.heroes[id].owned && DATA.heroes && DATA.heroes[id]);
    let closed = false;
    const close = () => { if (closed) return; closed = true; el.classList.add('is-done'); setTimeout(() => { el.remove(); }, 600); window.HV_BOOT_DONE = true; };
    Promise.all(ids.map(urlsFor)).then(lists => {
      const all = [...new Set(UI.concat(...lists))];
      let n = 0, k = 0;
      const total = all.length || 1;
      label.textContent = 'Đang tải tài nguyên…';
      const tick = () => { const v = Math.round(n / total * 100); fill.style.width = v + '%'; pct.textContent = v + '%'; };
      const worker = () => { const src = all[k++]; if (!src) return Promise.resolve(); return loadImg(src).then(() => { n++; tick(); return worker(); }); };
      return Promise.all(Array.from({ length: 6 }, worker)).then(() => { tick(); label.textContent = 'Sẵn sàng!'; });
    }).finally(() => { setTimeout(close, 350); });
  }
  // bat dau ngay khi dang nhap xong (co du lieu tuong) va man dang nhap da dong
  const watch = setInterval(() => {
    try {
      if (typeof P !== 'object' || !P || !P.heroes || typeof DATA !== 'object') return;
      const login = document.getElementById('hvLoginContinue');
      if (login && login.offsetParent !== null) return;
      clearInterval(watch); run();
    } catch (_) {}
  }, 150);
  window.HV_BOOT = { run };
})();
