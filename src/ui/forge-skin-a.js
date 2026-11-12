// Lo Ren mau A (owner 11/11): ao giao dien bang anh gpt_image + thanh tien trinh ren.
// Chi doi lop ao + chen thanh tien trinh truoc khi lenh ren chay. Khong doi logic/ket qua.
(function () {
  var A = 'assets/ui/forge/v2/';
  var SLOT_TAB = { 'Vũ Khí': 'weapon', 'Giáp': 'armor', 'Bùa': 'acc', 'Giày': 'acc' };
  var tab = 'all';

  function el(html) { var d = document.createElement('div'); d.innerHTML = html; return d.firstElementChild; }
  function caption(btn, text) {
    if (!text) return;
    var c = document.createElement('small'); c.className = 'fa-cost'; c.textContent = text.trim();
    btn.insertAdjacentElement('afterend', c);
  }
  function imgBtn(btn, cls, label) {
    if (!btn || btn.classList.contains('fa-ib')) return;
    var txt = (btn.textContent || '').replace(/\s+/g, ' ').trim();
    btn.classList.add('fa-ib', cls);
    btn.setAttribute('aria-label', label);
    btn.title = txt || label;
    return txt;
  }

  function skin(body) {
    if (!body || body.dataset.faSkin === '1') return;
    body.dataset.faSkin = '1';
    var stage = body.querySelector('.econ-stage'); if (stage) stage.classList.add('fa-stage');
    var hero = body.querySelector('.econ-hero');
    if (hero) {
      var chips = hero.querySelector('.econ-chips');
      var h = el('<div class="fa-hero"><img class="fa-scene" src="' + A + 'scene.webp" alt=""><img class="fa-plaque" src="' + A + 'plaque.webp" alt="Lò Rèn"></div>');
      if (chips) { chips.classList.add('fa-chips'); h.appendChild(chips); }
      hero.replaceWith(h);
    }
    body.querySelectorAll('.craftb').forEach(function (b) {
      var nm = b.querySelector('b'); var sm = b.querySelector('small');
      var name = nm ? nm.textContent : '';
      var cost = sm ? sm.textContent.replace(/^Rèn thường\s*·\s*/, '') : '';
      imgBtn(b, 'fa-ren', 'Rèn ' + name);
      b.insertAdjacentElement('beforebegin', el('<div class="fa-slotname">' + name + '</div>'));
      caption(b, cost);
    });
    body.querySelectorAll('.dualb').forEach(function (b) {
      var t = imgBtn(b, 'fa-songren', 'Song Rèn'); caption(b, (t || '').replace(/^Song Rèn\s*·\s*/, ''));
    });
    body.querySelectorAll('.econ-item').forEach(function (card) {
      var acts = card.querySelector('.econ-actions'); var enh = card.querySelector('.enh');
      var t = imgBtn(enh, 'fa-cuonghoa', 'Cường hoá');
      imgBtn(card.querySelector('.eqp'), 'fa-trangbi', 'Trang bị');
      imgBtn(card.querySelector('.salv'), 'fa-phanra', 'Phân rã');
      if (acts && t) acts.insertAdjacentElement('afterend', el('<div class="fa-cost">' + t.replace(/^Cường hoá\s*·\s*/, 'Cường hoá: ') + '</div>'));
      var meta = card.querySelector('.meta'); var slot = meta ? meta.textContent.split('·')[0].trim() : '';
      card.dataset.faTab = SLOT_TAB[slot] || 'acc';
    });
    imgBtn(body.querySelector('#eqCancel'), 'fa-huy', 'Huỷ');
    var grid = body.querySelector('.econ-itemgrid');
    if (grid) {
      var bar = el('<div class="fa-tabs"><button class="fa-tab fa-tab-all" data-t="all">Tất cả</button>'
        + '<button class="fa-tab" data-t="weapon" aria-label="Vũ khí" style="background-image:url(' + A + 'tab-vukhi.webp)"></button>'
        + '<button class="fa-tab" data-t="armor" aria-label="Giáp" style="background-image:url(' + A + 'tab-giap.webp)"></button>'
        + '<button class="fa-tab" data-t="acc" aria-label="Trang sức" style="background-image:url(' + A + 'tab-trangsuc.webp)"></button></div>');
      grid.parentElement.insertBefore(bar, grid.parentElement.querySelector('h3') || grid);
      bar.addEventListener('click', function (e) { var b = e.target.closest('.fa-tab'); if (!b) return; tab = b.dataset.t; applyTab(body); });
      applyTab(body);
    }
  }
  function applyTab(body) {
    body.querySelectorAll('.fa-tab').forEach(function (b) { b.classList.toggle('on', b.dataset.t === tab); });
    body.querySelectorAll('.econ-item').forEach(function (c) { c.style.display = (tab === 'all' || c.dataset.faTab === tab) ? '' : 'none'; });
  }

  // Thanh tien trinh ren: chan click dau tien, chay thanh, roi bam lai cho handler goc chay.
  var busy = false;
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('#forgeBody .craftb, #forgeBody .dualb, #forgeBody .enh');
    if (!b || b.disabled) return;
    if (b.dataset.faPass === '1') { delete b.dataset.faPass; return; }
    e.stopImmediatePropagation(); e.preventDefault();
    if (busy) return;
    run(function () { b.dataset.faPass = '1'; b.click(); });
  }, true);

  function run(done) {
    busy = true;
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    var dur = reduce ? 400 : 1600;
    var ov = el('<div class="fa-prog" role="progressbar" aria-valuemin="0" aria-valuemax="100"><div class="fa-prog-box"><div class="fa-prog-lbl">Đang rèn...</div>'
      + '<div class="fa-prog-bar"><div class="fa-prog-fill"></div><img class="fa-prog-frame" src="' + A + 'bar-frame.webp" alt=""><i class="fa-spark"></i></div><div class="fa-prog-pct">0%</div></div></div>');
    document.body.appendChild(ov);
    var fill = ov.querySelector('.fa-prog-fill'), pct = ov.querySelector('.fa-prog-pct'), sp = ov.querySelector('.fa-spark');
    var t0 = performance.now();
    (function step(now) {
      var k = Math.min(1, (now - t0) / dur), v = Math.round((1 - Math.pow(1 - k, 2)) * 100);
      fill.style.clipPath = 'inset(0 ' + (100 - v) + '% 0 0)'; sp.style.left = (11 + v * 0.84) + '%';
      pct.textContent = v + '%'; ov.setAttribute('aria-valuenow', v);
      if (k < 1) return requestAnimationFrame(step);
      setTimeout(function () { ov.remove(); busy = false; try { done(); } catch (err) { console.error(err); } }, reduce ? 60 : 220);
    })(t0);
  }

  function boot() {
    var body = document.getElementById('forgeBody'); if (!body) return;
    new MutationObserver(function () { if (body.dataset.faSkin !== '1' || !body.querySelector('.fa-stage')) { delete body.dataset.faSkin; skin(body); } })
      .observe(body, { childList: true });
    skin(body);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
