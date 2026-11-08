/* Owner 06/11: Mong Lo theo concept nguyen man duoc duyet (monglo-full.webp).
   Nen la anh concept; chu/so la du lieu that lay tu DOM goc; bam vao the la bam nut that cua game. */
(() => {
  if (typeof document === 'undefined') return;
  const ART = 'assets/ui/expedition/monglo-full.webp';
  // textContent: lop goc bi an (visibility:hidden) thi innerText tra rong -> mat chu
const txt = (el) => el ? (el.textContent || '').replace(/\s+/g, ' ').trim() : '';

  // Owner 07/11: KHONG xoa/dung lai ca lop moi lan game ve lai (gay chop nhay).
  // Lop #hvm3 duoc tao 1 lan; moi lan game doi chi thay noi dung ben trong, giu nguyen anh nen + vien sang.
  const ORIG = () => document.getElementById('hvExpeditionRoot');
  function stageHtml(body) {
    const nodes = [...body.querySelectorAll('[data-expedition-node]')];
    const routesEls = [...body.querySelectorAll('[data-expedition-route]')];
    const blessEls = [...body.querySelectorAll('[data-expedition-bless]')];
    const floor = txt(body.querySelector('[data-expedition-floor]'));
    const gold = txt(body.querySelector('[data-expedition-gold]'));
    const sigil = txt(body.querySelector('[data-expedition-sigil]'));
    const best = txt(body.querySelector('.hv-exp-best'));
    const wornEl = body.querySelector('[data-expedition-worn]');
    const wornText = wornEl && !/Chưa có/i.test(wornEl.innerText) ? txt(wornEl).replace(/^PHÚC ĐANG MANG\s*/i, '').slice(0, 80) : '';
    const startBtn = body.querySelector('[data-expedition-start]');
    const fightBtn = body.querySelector('[data-expedition-fight]');
    const abortBtn = body.querySelector('[data-expedition-abort]');
    const rerollBtn = body.querySelector('[data-expedition-reroll]');
    const pending = blessEls.length > 0;
    const pick = pending ? blessEls : routesEls;
    return `
        <div class="hvm3-floors">${nodes.map((n, i) => `<i class="hvm3-fl ${n.className.replace(/hv-exp-node/g, '').trim()}">${(n.textContent || '').trim() || (i + 1)}</i>`).join('')}</div>
        <div class="hvm3-floor">${floor}</div>
        <div class="hvm3-cards ${pending ? 'is-bless' : ''}">
          ${pick.map((el, i) => `<button type="button" class="hvm3-card${el.classList.contains('is-on') ? ' is-on' : ''}" data-i="${i}">
            <b>${txt(el.querySelector('b')) || txt(el).split(' ')[0]}</b>
            <small>${txt(el.querySelector('small'))}</small></button>`).join('')}
        </div>
        ${rerollBtn ? `<button type="button" class="hvm3-reroll" data-k="reroll" ${rerollBtn.disabled ? 'disabled' : ''}>Đổi bộ Phúc</button>` : ''}
        <div class="hvm3-acts">
          ${startBtn ? '<button type="button" class="hvm3-btn is-main" data-k="start">Bắt đầu Mộng Lộ</button>' : ''}
          ${fightBtn ? `<button type="button" class="hvm3-btn is-main" data-k="fight">${txt(fightBtn)}</button>` : ''}
          ${abortBtn ? '<button type="button" class="hvm3-btn is-sub" data-k="abort">Rời Mộng Lộ</button>' : ''}
        </div>
        <div class="hvm3-foot"><span>${gold}</span><span>${sigil}</span><span>${best}</span>${wornText ? `<span>${wornText}</span>` : ''}</div>`;
  }
  let lastHtml = '';
  // Owner 07/11 (loi sau merge #419): mount bat 'hvm3-on' vo dieu kien, guard tat lai, observer thay doi class -> mount lai
  // => vong lap bat/tat lop toan man o sanh: chop nhay lien tuc + lop vo hinh chan cham o Tran Hinh.
  const expOn = () => { const s = document.getElementById('expeditionScreen'); if (!s) return false;
    const cs = getComputedStyle(s); return s.getBoundingClientRect().width > 0 && cs.display !== 'none' && cs.visibility !== 'hidden'; };
  function mount() {
    const body = ORIG();
    if (!body) return;
    if (!expOn()) { if (document.body.classList.contains('hvm3-on')) document.body.classList.remove('hvm3-on'); return; }
    if (!body.querySelector('[data-expedition-path],[data-expedition-offer],[data-expedition-route]')) return;
    let root = document.getElementById('hvm3');
    if (!root) {
      root = document.createElement('div');
      root.id = 'hvm3';
      root.innerHTML = '<div class="hvm3-stage"></div>';
      lastHtml = ''; // lop moi tao (vd vao lai Mong Lo) -> phai do lai noi dung, khong dung ban nho cu
      document.body.append(root);
      // Bam: luon tra nut THAT cua game o thoi diem bam (khong giu tham chieu cu)
      root.addEventListener('click', (ev) => {
        const b = ORIG(); if (!b) return;
        const card = ev.target.closest('.hvm3-card');
        if (card) {
          const list = b.querySelectorAll(b.querySelector('[data-expedition-bless]') ? '[data-expedition-bless]' : '[data-expedition-route]');
          list[Number(card.dataset.i)]?.click();
          return;
        }
        if (ev.target.closest('.hvm3-team')) {
          // Owner 07/11: chon doi hinh truoc khi xuat chien; dong doi hinh thi quay lai Mong Lo
          try { sessionStorage.setItem('hvTeamReturn', 'expedition'); } catch (_) {}
          ST.hvOpenFormation = true;
          navTo('team');
          return;
        }
        const btn = ev.target.closest('.hvm3-btn,.hvm3-reroll');
        if (btn) {
          const sel = { start: '[data-expedition-start]', fight: '[data-expedition-fight]', abort: '[data-expedition-abort]', reroll: '[data-expedition-reroll]' }[btn.dataset.k];
          // Owner 07/11: Xuat chien -> phai qua Tran Hinh xep doi truoc; Luu doi moi vao tran
          if (btn.dataset.k === 'fight') {
            try { sessionStorage.setItem('hvTeamReturn', 'expedition'); sessionStorage.setItem('hvMongLoFight', '1'); sessionStorage.removeItem('hvMongLoGo'); } catch (_) {}
            ST.hvOpenFormation = true; navTo('team');
            return;
          }
          if (sel) b.querySelector(sel)?.click();
        }
      });
    }
    body.classList.add('hvm3-under');
    if (!document.body.classList.contains('hvm3-on')) document.body.classList.add('hvm3-on');
    const html = stageHtml(body);
    const stageNow = root.querySelector('.hvm3-stage');
    if (html === lastHtml && stageNow && stageNow.querySelector('.hvm3-cards,.hvm3-acts')) return;
    lastHtml = html;
    const stage = root.querySelector('.hvm3-stage');
    // giu lai anh vien sang, chi thay phan noi dung
    [...stage.children].forEach(c => { if (!c.classList.contains('hvm3-rim') && !c.classList.contains('hvm3-mrim')) c.remove(); });
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    stage.prepend(...tmp.children);
    try { placeCards(); placeRims(); placeMedalRims(); } catch (_) {}
  }
  const remount = mount;

  let queued = false;
  const schedule = () => { if (queued) return; queued = true; requestAnimationFrame(() => { queued = false; mount(); }); };
  // Bo qua thay doi do chinh lop hvm3 gay ra
  const own = n => n && n.nodeType === 1 && (n.id === 'hvm3' || (n.closest && n.closest('#hvm3')));
  const obs = new MutationObserver(list => {
    if (list.every(m => own(m.target) || (m.type === 'attributes' && (m.target === document.body || m.target === document.documentElement)) || (m.type === 'childList' && [...m.addedNodes, ...m.removedNodes].every(own)))) return;
    schedule();
  });
  const boot = () => {
    obs.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'aria-pressed', 'disabled'] });
    schedule();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  window.HVM3 = { mount, remount };
})();

  // Owner 06/11: dat 3 the theo px tinh tu chinh khung anh (khong dung % vi cha co the cao 0)
  const CARD_RECTS = [[7.4, 38.3, 24.4, 23.4], [38.5, 38.3, 24, 23.4], [69.2, 38.3, 24.4, 23.4]];
  function placeCards() {
    const stage = document.querySelector('#hvm3 .hvm3-stage');
    const wrap = document.querySelector('#hvm3 .hvm3-cards');
    if (!stage || !wrap) return;
    const sr = stage.getBoundingClientRect();
    if (!sr.width || !sr.height) return;
    wrap.style.position = 'absolute'; wrap.style.left = '0'; wrap.style.top = '0';
    wrap.style.width = sr.width + 'px'; wrap.style.height = sr.height + 'px'; wrap.style.zIndex = '6';
    [...wrap.querySelectorAll('.hvm3-card')].forEach((c, i) => {
      const [x, y, w, h] = CARD_RECTS[i] || CARD_RECTS[2];
      c.style.position = 'absolute';
      c.style.setProperty('left', (sr.width * x / 100).toFixed(1) + 'px', 'important');
      c.style.setProperty('top', (sr.height * y / 100).toFixed(1) + 'px', 'important');
      c.style.setProperty('width', (sr.width * w / 100).toFixed(1) + 'px', 'important');
      c.style.setProperty('height', (sr.height * h / 100).toFixed(1) + 'px', 'important');
      c.style.display = 'flex'; c.style.flexDirection = 'column';
      c.style.alignItems = 'center'; c.style.justifyContent = 'flex-start';
      c.style.padding = '14px 7px 6px'; c.style.gap = '6px'; c.style.overflow = 'hidden';
      [...c.children].forEach(k => { k.style.height = 'auto'; k.style.flex = '0 0 auto'; k.style.width = '100%'; });
    });
  }
  setInterval(() => { try { placeCards(); } catch (_) {} }, 800);

  // Owner 07/11: chon loi -> chinh VIEN KHUNG trong anh sang len (anh vien cat tu concept, dat khit dung cho)
  const RIM_RECTS = [[3.93, 30.8, 31.24, 32.78], [35.07, 30.8, 30.82, 32.78], [65.78, 30.8, 31.14, 32.78]];
  function placeRims() {
    const stage = document.querySelector('#hvm3 .hvm3-stage');
    if (!stage) return;
    const sr = stage.getBoundingClientRect();
    if (!sr.width || !sr.height) return;
    const cards = [...stage.querySelectorAll('.hvm3-card')];
    RIM_RECTS.forEach(([x, y, w, h], i) => {
      let rim = stage.querySelector('.hvm3-rim[data-i="' + i + '"]');
      if (!rim) {
        rim = document.createElement('img');
        rim.className = 'hvm3-rim'; rim.dataset.i = String(i); rim.alt = '';
        rim.src = 'assets/ui/expedition/rim-' + (i + 1) + '.webp';
        stage.appendChild(rim);
      }
      rim.style.left = (sr.width * x / 100).toFixed(1) + 'px';
      rim.style.top = (sr.height * y / 100).toFixed(1) + 'px';
      rim.style.width = (sr.width * w / 100).toFixed(1) + 'px';
      rim.style.height = (sr.height * h / 100).toFixed(1) + 'px';
      rim.classList.toggle('is-on', !!(cards[i] && cards[i].classList.contains('is-on')));
    });
  }
  setInterval(() => { try { placeRims(); } catch (_) {} }, 200);

  // Owner 07/11: tang dang o -> chinh VIEN huy hieu trong anh sang len (cat tu concept, dat khit)
  const MEDAL_RECTS = [[8.18, 6.46, 15.2, 9.03], [26.14, 6.64, 14.35, 8.25], [43.04, 6.76, 14.24, 8.73], [59.72, 6.64, 14.35, 8.19], [76.73, 6.28, 14.98, 8.97]];
  function placeMedalRims() {
    const stage = document.querySelector('#hvm3 .hvm3-stage');
    if (!stage) return;
    const sr = stage.getBoundingClientRect();
    if (!sr.width || !sr.height) return;
    const fls = [...document.querySelectorAll('#hvm3 .hvm3-fl')];
    MEDAL_RECTS.forEach(([x, y, w, h], i) => {
      let rim = stage.querySelector('.hvm3-mrim[data-i="' + i + '"]');
      if (!rim) {
        rim = document.createElement('img');
        rim.className = 'hvm3-mrim'; rim.dataset.i = String(i); rim.alt = '';
        rim.src = 'assets/ui/expedition/medal-rim-' + (i + 1) + '.webp';
        stage.appendChild(rim);
      }
      rim.style.left = (sr.width * x / 100).toFixed(1) + 'px';
      rim.style.top = (sr.height * y / 100).toFixed(1) + 'px';
      rim.style.width = (sr.width * w / 100).toFixed(1) + 'px';
      rim.style.height = (sr.height * h / 100).toFixed(1) + 'px';
      const f = fls[i];
      rim.classList.toggle('is-on', !!(f && (f.classList.contains('is-now') || f.classList.contains('hv-exp-now'))));
    });
  }
  setInterval(() => { try { placeMedalRims(); } catch (_) {} }, 200);

  // Owner 07/11: (1) nut quay ve chi ton tai khi dang o Mong Lo; (3) vao Mong Lo la mo luon 3 loi + sang tang 1
  (function hvm3Guard() {
    let auto = false;
    setInterval(() => {
      try {
        const scr = document.getElementById('expeditionScreen');
        const on = !!scr && scr.getBoundingClientRect().width > 0 && getComputedStyle(scr).display !== 'none' && getComputedStyle(scr).visibility !== 'hidden';
        const want = on && !!document.getElementById('hvm3'); if (document.body.classList.contains('hvm3-on') !== want) document.body.classList.toggle('hvm3-on', want);
        if (!on) { auto = false; return; }
        if (auto) return;
        if (document.querySelector('[data-expedition-route]')) { auto = true; return; }
        const st = document.querySelector('[data-expedition-start]');
        if (st && !st.disabled) { auto = true; st.click(); }
      } catch (_) {}
    }, 150);
  })();

  // Owner 07/11: mo Doi hinh tu Mong Lo -> roi Doi hinh (ve sanh) thi dua thang ve Mong Lo
  if (typeof navTo === 'function' && !window.__hvTeamReturnWrap) {
    window.__hvTeamReturnWrap = true;
    const navOrig = navTo;
    navTo = function (name, ...rest) {
      let ret = null;
      try { ret = sessionStorage.getItem('hvTeamReturn'); } catch (_) {}
      const ts = document.getElementById('teamScreen');
      const cur = ts && ts.getBoundingClientRect().width > 0 && getComputedStyle(ts).display !== 'none' ? 'teamScreen' : '';
      if (ret && name === 'hub' && /team/i.test(cur)) {
        try { sessionStorage.removeItem('hvTeamReturn'); } catch (_) {}
        return navOrig.call(this, 'expedition', ...rest);
      }
      if (ret && name !== 'team' && !/team/i.test(cur)) { try { sessionStorage.removeItem('hvTeamReturn'); } catch (_) {} }
      return navOrig.call(this, name, ...rest);
    };
  }

  // Owner 07/11: buoc xep doi truoc tran Mong Lo
  (function hvMongLoFormation() {
    const flag = k => { try { return sessionStorage.getItem(k); } catch (_) { return null; } };
    const setf = (k, v) => { try { v == null ? sessionStorage.removeItem(k) : sessionStorage.setItem(k, v); } catch (_) {} };
    // Bam Luu doi khi dang xep doi cho Mong Lo -> danh dau "vao tran"
    document.addEventListener('click', ev => {
      if (ev.target && ev.target.closest && ev.target.closest('#teamSave') && flag('hvMongLoFight')) setf('hvMongLoGo', '1');
    }, true);
    let lastLabel = '';
    setInterval(() => {
      try {
        const save = document.getElementById('teamSave');
        if (save) {
          const want = flag('hvMongLoFight') ? 'Lưu đội & vào trận' : 'Lưu đội';
          if (save.textContent !== want && (lastLabel !== want || save.textContent !== want)) { save.textContent = want; lastLabel = want; }
        }
        // Da quay ve Mong Lo
        const scr = document.getElementById('expeditionScreen');
        const onExp = !!scr && scr.getBoundingClientRect().width > 0 && getComputedStyle(scr).display !== 'none';
        if (!onExp || !flag('hvMongLoFight')) return;
        const go = flag('hvMongLoGo');
        setf('hvMongLoFight', null); setf('hvMongLoGo', null);
        if (go) {
          const f = document.querySelector('#hvExpeditionRoot [data-expedition-fight]');
          if (f) setTimeout(() => f.click(), 120);
        }
      } catch (_) {}
    }, 200);
  })();
