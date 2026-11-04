/* Owner 2026-11-04: man Goi Mong dung concept te dan (UI trong phim mo dau v56).
   Giu nguyen logic/DOM cu cua summon-runtime (an di), lop nay doc du lieu that tu DOM cu va bam lai nut cu. */
(() => {
  if (typeof document === 'undefined') return;
  const $ = (r, s) => r.querySelector(s);
  const txt = (r, s) => ($(r, s)?.textContent || '').trim();
  const num = s => (String(s).match(/[\d.,]+/) || [''])[0];
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const cost = n => {
    try { if (typeof GACHA === 'object' && GACHA) return n === 1 ? GACHA.cost1 : GACHA.cost10; } catch (_) {}
    try { return n === 1 ? GACHA_COST1 : GACHA_COST10; } catch (_) { return ''; }
  };

  function build(body) {
    const old = body; // DOM cu cua renderLacquer
    const locked = !!$(old, '[data-summon-lock]');
    const freeBtn = $(old, '[data-summon-pull="free"]');
    const freeTxt = txt(old, '[data-summon-free]');
    const wait = ($(old, '[data-summon-free] b')?.textContent || '').trim();
    const gems = num(txt(old, '[data-summon-gems]')) || '0';
    const spark = (txt(old, '[data-summon-spark]').match(/\d+\s*\/\s*\d+/) || ['0/0'])[0].replace(/\s/g, '');
    const pity = txt(old, '[data-summon-pity]') || '0';
    const pct = ($(old, '.hv-sum-meter u')?.style.width) || '0%';
    const rates = txt(old, '.hv-sum-meter small') || 'SSR 3% · SS 12% · S 85%';
    const [sNow, sNeed] = spark.split('/').map(Number);
    const sparkReady = sNeed > 0 && sNow >= sNeed;

    const box = document.createElement('div');
    box.className = 'hva';
    box.innerHTML = `<div class="hva-panel">
        <button class="hva-hit hva-close" type="button" aria-label="Về Thành Chính"></button>
        <div class="hva-plq hva-pity" title="Bảo hiểm SSR">SSR sau ${esc(pity)}</div>
        <div class="hva-plq hva-gems" title="Ngọc">${esc(gems)}</div>
        <button class="hva-hit hva-box b1 ${freeBtn && !locked ? 'ready' : ''}" type="button" aria-label="Lượt miễn phí"><em>${freeBtn ? 'Miễn phí' : esc(wait || 'Đã nhận')}</em></button>
        <button class="hva-hit hva-box b2" type="button" aria-label="Tỉ lệ"><em>Tỉ lệ</em></button>
        <button class="hva-hit hva-box b3 ${sparkReady ? 'ready' : ''}" type="button" aria-label="Hồi Ức Tuyển Chọn"><em>Hồi Ức ${esc(spark)}</em></button>
        ${locked ? '<div class="hva-lock">Gọi Mộng tạm khóa: danh sách tướng chưa khớp cấu hình triệu hồi.</div>' : ''}
        <button class="hva-hit hva-btn hva-x1 ${freeBtn ? 'free' : ''}" type="button" data-hva-pull="${freeBtn ? 'free' : '1'}" ${locked ? 'disabled' : ''}>
          ${freeBtn ? 'MIỄN PHÍ x1<small>Lượt miễn phí hôm nay</small>' : `TRIỆU HỒI x1<small>💎 ${esc(cost(1))}</small>`}</button>
        <button class="hva-hit hva-btn hva-x10" type="button" data-hva-pull="10" ${locked ? 'disabled' : ''}>x10<small>💎 ${esc(cost(10))}</small></button>
        <div class="hva-strip">${esc(freeTxt || 'x10 chắc chắn có S trở lên')}</div>
        <div class="hva-rates">Tỉ lệ: ${esc(rates)}</div>
        <div class="hva-paper">
          <div class="hva-meter"><span>Còn <b>${esc(pity)}</b> lượt nữa chắc chắn SSR</span><i><u style="width:${esc(pct)}"></u></i></div>
          <div class="hva-note">Mỗi lượt tích 1 Hồi Ức · đủ ${esc(sNeed || 120)} được tự chọn 1 SSR. Tướng trùng đổi thành mảnh hồn và Mộng Tủy.</div>
        </div>
        <canvas class="hva-fx"></canvas>
      </div>`;
    const click = sel => $(old, sel)?.click();
    $(box, '.hva-close').onclick = () => click('[data-summon-back]');
    box.querySelectorAll('[data-hva-pull]').forEach(b => b.addEventListener('click', () => click(`[data-summon-pull="${b.dataset.hvaPull}"]`)));
    $(box, '.b1').onclick = () => { if (freeBtn && !locked) click('[data-summon-pull="free"]'); else sheet(box, '<h4>Lượt miễn phí</h4><p>' + esc(freeTxt) + '</p>'); };
    $(box, '.b2').onclick = () => sheet(box, `<h4>Tỉ lệ Gọi Mộng</h4><p><b>${esc(rates)}</b></p><p>Gọi x10 chắc chắn có ít nhất 1 tướng S trở lên. Sau ${esc(pity)} lượt nữa chắc chắn ra SSR.</p>`);
    $(box, '.b3').onclick = () => {
      const picks = [...old.querySelectorAll('[data-summon-pick]')];
      const s = sheet(box, `<h4>Hồi Ức Tuyển Chọn · ${esc(spark)}</h4><p>Đủ ${esc(sNeed || 120)} Hồi Ức thì tự chọn 1 SSR.</p><div class="picks">${
        picks.map(p => `<button type="button" data-id="${esc(p.dataset.summonPick)}" ${p.disabled ? 'disabled' : ''}>${esc(p.textContent.trim())}</button>`).join('')}</div>`);
      s.querySelectorAll('.picks button').forEach(b => b.onclick = () => click(`[data-summon-pick="${b.dataset.id}"]`));
    };
    return box;
  }

  function sheet(box, html) {
    box.querySelector('.hva-sheet')?.remove();
    const s = document.createElement('div');
    s.className = 'hva-sheet';
    s.innerHTML = '<button class="x" type="button" aria-label="Đóng">×</button>' + html;
    s.querySelector('.x').onclick = () => s.remove();
    box.querySelector('.hva-panel').append(s);
    return s;
  }

  // #hvSummonRoot duoc summon-3d-runtime keo len <body> lam lop phu toan man -> gan lop te dan vao chinh no
  function mount() {
    const root = document.getElementById('hvSummonRoot');
    if (!root) return;
    if (root.querySelector(':scope > .hva')) return;
    root.classList.add('hv-altar');
    root.append(build(root));
  }

  // te dan tu linh: than hong hoi tu, vong sang, loi sang lon dan, cot sang, chop trang
  function charge(best) {
    return new Promise(done => {
      const panel = document.querySelector('#hvSummonRoot .hva-panel');
      const cv = panel?.querySelector('.hva-fx');
      if (!panel || !cv) { done(); return; }
      const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
      const pxr = Math.min(2, window.devicePixelRatio || 1);
      const W = cv.clientWidth, H = cv.clientHeight;
      cv.width = W * pxr; cv.height = H * pxr;
      const g = cv.getContext('2d'); g.scale(pxr, pxr);
      const col = best === 'g' ? [255, 196, 70] : best === 'p' ? [196, 120, 255] : [90, 255, 220];
      const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
      const cx = W * 0.5, cy = H * 0.455;
      const R = W * 0.36;
      const embers = Array.from({ length: 140 }, () => {
        const a = Math.random() * Math.PI * 2, d = R * (0.7 + Math.random() * 1.4);
        return { a, d, sp: 0.6 + Math.random() * 0.9, s: 1 + Math.random() * 2.2, w: (Math.random() - 0.5) * 2.2 };
      });
      const DUR = reduce ? 600 : 2400;
      const flash = document.createElement('div');
      flash.className = 'hva-flash';
      document.body.append(flash);
      const t0 = performance.now();
      let shook = false;
      function frame(now) {
        const t = Math.min(1, (now - t0) / DUR);
        g.clearRect(0, 0, W, H);
        g.globalCompositeOperation = 'source-over';
        g.globalCompositeOperation = 'lighter';
        // than hong bay ve tam
        embers.forEach(e => {
          const k = Math.min(1, t * e.sp * 1.25);
          const d = e.d * (1 - k * k);
          const a = e.a + e.w * k;
          const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * 0.55;
          const al = Math.min(1, t * 4) * (1 - k * 0.6);
          g.fillStyle = rgba(col, al);
          g.beginPath(); g.arc(x, y, e.s, 0, Math.PI * 2); g.fill();
        });
        // vong sang toa ra
        for (let i = 0; i < 3; i++) {
          const p = ((t * 1.6 + i / 3) % 1);
          if (t < 0.12) break;
          g.strokeStyle = rgba(col, (1 - p) * 0.75);
          g.lineWidth = 2 + (1 - p) * 3;
          g.beginPath(); g.ellipse(cx, cy, R * (0.25 + p * 0.95), R * (0.25 + p * 0.95) * 0.42, 0, 0, Math.PI * 2); g.stroke();
        }
        // loi sang
        const core = W * (0.02 + 0.16 * t * t);
        const gr = g.createRadialGradient(cx, cy, 0, cx, cy, core * 2.6);
        gr.addColorStop(0, 'rgba(255,255,255,1)');
        gr.addColorStop(0.25, rgba(col, 0.9));
        gr.addColorStop(1, rgba(col, 0));
        g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, core * 2.6, 0, Math.PI * 2); g.fill();
        // cot sang len troi o 30% cuoi
        if (t > 0.62) {
          const k = (t - 0.62) / 0.38;
          const bw = W * (0.08 + 0.3 * k);
          const lg = g.createLinearGradient(0, 0, 0, cy);
          lg.addColorStop(0, rgba(col, 0));
          lg.addColorStop(1, 'rgba(255,255,255,' + (0.85 * k) + ')');
          g.save(); g.filter = 'blur(' + Math.round(W * 0.025) + 'px)';
          g.fillStyle = lg; g.fillRect(cx - bw / 2, H * 0.17, bw, cy - H * 0.17);
          g.fillRect(cx - bw * 0.22, H * 0.17, bw * 0.44, cy - H * 0.17);
          g.restore();
          if (!shook && k > 0.4) {
            shook = true;
            panel.classList.remove('shake'); void panel.offsetWidth; panel.classList.add('shake');
            if (navigator.vibrate) navigator.vibrate(best === 'g' ? [30, 20, 60] : 20);
          }
        }
        if (t < 1) { requestAnimationFrame(frame); return; }
        flash.animate([{ opacity: 0 }, { opacity: 1, offset: 0.35 }, { opacity: 0 }], { duration: 650, easing: 'ease-out' })
          .onfinish = () => flash.remove();
        setTimeout(() => { g.clearRect(0, 0, W, H); done(); }, 220);
      }
      requestAnimationFrame(frame);
    });
  }

  let pend = 0;
  function boot() {
    new MutationObserver(() => {
      if (pend) return;
      pend = requestAnimationFrame(() => { pend = 0; mount(); });
    }).observe(document.body, { childList: true });
    const sb = document.getElementById('summonBody');
    if (sb) new MutationObserver(() => mount()).observe(sb, { childList: true });
    mount();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  window.HV_SUMMON_ALTAR = { charge, mount };
})();
