(() => {
  if (typeof document === 'undefined' || !document.body) return;
  if (document.getElementById('hvProfileRoot')) return;

  const EXTRA = {
    LUCTHAN: { label: 'Lục Thần khai ấn', gold: 5000, gems: 300, stam: 40 },
    THANHCHINH: { label: 'Cổng Thành Chính', gold: 2200, gems: 180, stam: 25 }
  };
  const FRAMES = [
    { id: 'none', name: 'Mặc định', how: 'Hệ thống mặc định khung avatar' },
    { id: 'lacquer', name: 'Sơn son thếp vàng', how: 'Mở khi vào Thành Chính' },
    { id: 'tower', name: 'Tháp Trắng Đêm', how: 'Qua ải Tháp tầng 5' },
    { id: 'arena', name: 'Đấu Trường', how: 'Đấu 3 trận Đấu Trường' }
  ];
  const TITLES = [
    { id: 'none', name: 'Chưa có danh hiệu', how: 'Mặc định' },
    { id: 'mo', name: 'Kẻ Mất Ngủ', how: 'Hoàn thành đêm 1' },
    { id: 'pho', name: 'Bạn nồi phở', how: 'Sở hữu Ông Hàng Phở' },
    { id: 'anh', name: 'Bóng Lục Ảnh', how: 'Sở hữu Lục Ảnh' }
  ];
  const CHATS = [
    { id: 'none', name: 'Mặc định', how: 'Khung chat sở hữu' },
    { id: 'gold', name: 'Mộng vàng', how: 'Đổi mã quà bất kỳ' },
    { id: 'ink', name: 'Nghiên mực', how: 'Mở chat bang' }
  ];

  const root = document.createElement('section');
  root.id = 'hvProfileRoot';
  root.hidden = true;
  root.setAttribute('aria-label', 'Hồ sơ Lục Thần');
  document.body.append(root);

  const state = { sheet: 'home', tab: 'figure', modal: '', toast: '' };

  function esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, ch => ({ '&': '&', '<': '<', '>': '>', '"': '"', "'": '&#39;' }[ch]));
  }
  function fmt(n) {
    const x = Number(n || 0);
    if (x >= 1e6) return (x / 1e6).toFixed(2).replace(/\.00$/, '') + 'M';
    return x.toLocaleString('vi-VN');
  }
  function toast(msg) {
    state.toast = msg;
    paint();
    setTimeout(() => { if (state.toast === msg) { state.toast = ''; paint(); } }, 2200);
  }
  function profile() {
    if (typeof P !== 'object' || !P) return {};
    if (!P.profile || typeof P.profile !== 'object') P.profile = {};
    return P.profile;
  }
  function nick() {
    const n = profile().nick;
    if (n) return n;
    if (typeof NET === 'object' && NET.user) return String(NET.user).replace(/@tmp$/, '');
    return 'Lữ khách';
  }
  function roster() {
    return (typeof OFFICIAL_ROSTER_12_IDS !== 'undefined' && OFFICIAL_ROSTER_12_IDS) || [];
  }
  function heroName(id) {
    return (typeof DATA === 'object' && DATA.heroes && DATA.heroes[id] && DATA.heroes[id].name) || id;
  }
  function art(id, kind) {
    if (typeof portraitSrc === 'function') return portraitSrc(id, kind) || portraitSrc(id, 'card') || portraitSrc(id, 'avatar') || '';
    return '';
  }
  function owned(id) {
    return !!(typeof P === 'object' && P.heroes && P.heroes[id] && P.heroes[id].owned);
  }
  function leaderId() {
    const p = profile();
    if (p.figureId && owned(p.figureId)) return p.figureId;
    if (p.avatarId && owned(p.avatarId)) return p.avatarId;
    const sq = (typeof P === 'object' && P.squad && P.squad[0] && P.squad[0].id) || 'ong_hang_pho';
    return sq;
  }
  function power() {
    if (typeof teamPower === 'function') return teamPower();
    return 0;
  }
  function saveP() {
    if (typeof persist === 'function') persist();
    if (typeof refreshResbar === 'function') refreshResbar();
  }
  function pinAvatar() {
    const el = document.querySelector('#hubScreen .art-player .art-avatar') || document.querySelector('#hubScreen .art-avatar');
    if (!el) return;
    const id = profile().avatarId || leaderId();
    const src = art(id, 'avatar') || art(id, 'card');
    if (src) el.style.backgroundImage = 'url("' + src + '")';
  }
  function redeem(str) {
    const key = String(str || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!key) return { ok: false, msg: 'Chưa nhập mã.' };
    if (typeof redeemCode === 'function') {
      const r = redeemCode(str);
      if (r && (r.ok || !/không tồn tại/i.test(r.msg || ''))) return r;
    }
    if (typeof P !== 'object') return { ok: false, msg: 'Chưa có dữ liệu.' };
    const g = EXTRA[key];
    if (!g) return { ok: false, msg: 'Mã không tồn tại hoặc đã hết hạn.' };
    P.codes = P.codes || [];
    if (P.codes.indexOf(key) >= 0) return { ok: false, msg: 'Mã này đã nhận rồi.' };
    P.codes.push(key);
    P.gold = (P.gold || 0) + g.gold;
    P.gems = (P.gems || 0) + g.gems;
    if (typeof refreshStamina === 'function') refreshStamina();
    if (P.stamina != null && typeof DATA === 'object') {
      P.stamina = Math.min((DATA.daily && DATA.daily.stamCap) || 120, (P.stamina || 0) + g.stam);
    }
    saveP();
    return { ok: true, label: g.label, gold: g.gold, gems: g.gems, stam: g.stam };
  }
  function applyNick(value) {
    const s = String(value || '').trim();
    if (s.length < 4 || s.length > 14) return { ok: false, msg: 'Hãy nhập 4-14 ký tự' };
    if (/[<>&]/.test(s)) return { ok: false, msg: 'Tên không hợp lệ.' };
    const p = profile();
    const used = Number(p.renames || 0);
    if (used >= 1) {
      if ((P.gems || 0) < 200) return { ok: false, msg: 'Đổi tên tiếp theo cần 200 ngọc.' };
      P.gems -= 200;
    }
    p.nick = s;
    p.renames = used + 1;
    saveP();
    return { ok: true };
  }
  function setVol(kind, v) {
    const n = Math.max(0, Math.min(1, Number(v)));
    const p = profile();
    p.vol = p.vol || {};
    p.vol[kind] = n;
    if (kind === 'bgm' && typeof bgmPlayer !== 'undefined' && bgmPlayer) bgmPlayer.volume = n;
    saveP();
  }
  function open() {
    state.sheet = 'home';
    state.modal = '';
    root.hidden = false;
    root.classList.add('is-open');
    document.body.classList.add('profile-open');
    paint();
  }
  function close() {
    state.modal = '';
    root.hidden = true;
    root.classList.remove('is-open');
    document.body.classList.remove('profile-open');
  }
  function chapterLine() {
    const n = (typeof P === 'object' && Array.isArray(P.clearedChapters)) ? P.clearedChapters.length : 0;
    return (n + 1) + '-1';
  }
  function ownedCount() {
    return roster().filter(owned).length;
  }

  function homeHtml() {
    const id = leaderId();
    const src = art(id, 'master') || art(id, 'card');
    const sq = (typeof P === 'object' && Array.isArray(P.squad) ? P.squad : []).slice(0, 6);
    while (sq.length < 6) sq.push(null);
    const slots = sq.map(s => {
      if (!s || !s.id) return '<div class="hv-pf-slot is-empty"></div>';
      const a = art(s.id, 'avatar') || art(s.id, 'card');
      return `<div class="hv-pf-slot">${a ? `<img src="${esc(a)}" alt="">` : ''}</div>`;
    }).join('');
    const title = TITLES.find(t => t.id === (profile().titleId || 'none')) || TITLES[0];
    return `<div class="hv-pf-hero">
      ${src ? `<img class="hv-pf-lead" src="${esc(src)}" alt="">` : ''}
      <div class="hv-pf-id">
        <b>${esc(nick())}</b>
        <small>⚔ ${fmt(power())}</small>
      </div>
      <div class="hv-pf-wallet"><span>🪙 ${fmt(P && P.gold)}</span><span>💎 ${fmt(P && P.gems)}</span></div>
    </div>
    <dl class="hv-pf-meta">
      <div><dt>Ải nhiệm vụ chính</dt><dd>${esc(chapterLine())}</dd></div>
      <div><dt>Thu thập tướng</dt><dd>${ownedCount()}/12</dd></div>
      <div><dt>Hạng Đấu trường</dt><dd>${fmt(P && P.arena && P.arena.rank)}</dd></div>
      <div><dt>Tháp Trắng Đêm</dt><dd>Tầng ${fmt(P && P.tower && P.tower.best)}</dd></div>
    </dl>
    <p class="hv-pf-title">${esc(title.name)}</p>
    <div class="hv-pf-team">${slots}</div>
    <nav class="hv-pf-actions">
      <button type="button" data-pf-act="rename">Đổi tên</button>
      <button type="button" data-pf-act="gift">Mã đổi</button>
      <button type="button" data-pf-act="contact">Liên hệ</button>
      <button type="button" data-pf-act="settings">Thiết lập</button>
      <button type="button" data-pf-act="link">Liên kết</button>
    </nav>
    <div class="hv-pf-dock">
      <button type="button" data-pf-sheet="skins">Hình tượng</button>
    </div>`;
  }

  function skinsHtml() {
    const tab = state.tab;
    const tabs = [['figure', 'Hình tượng'], ['avatar', 'Avatar'], ['frame', 'Khung avatar'], ['title', 'Danh hiệu'], ['chat', 'Khung chat']];
    const tabBtns = tabs.map(([id, lab]) => `<button type="button" class="${tab === id ? 'is-on' : ''}" data-pf-tab="${id}">${lab}</button>`).join('');
    let grid = '';
    let how = '';
    let preview = '';
    if (tab === 'figure' || tab === 'avatar') {
      const cur = tab === 'figure' ? (profile().figureId || leaderId()) : (profile().avatarId || leaderId());
      grid = roster().map(id => {
        const src = art(id, tab === 'figure' ? 'card' : 'avatar') || art(id, 'card');
        const on = id === cur ? ' is-on' : '';
        const lock = owned(id) ? '' : ' is-lock';
        return `<button type="button" class="hv-pf-skin${on}${lock}" data-pf-pick="${esc(id)}">${src ? `<img src="${esc(src)}" alt="">` : ''}<span>${esc(heroName(id))}</span></button>`;
      }).join('');
      how = 'Chọn tướng đang sở hữu';
      const src = art(cur, tab === 'figure' ? 'master' : 'avatar') || art(cur, 'card');
      preview = src ? `<img src="${esc(src)}" alt="">` : '';
    } else {
      const list = tab === 'frame' ? FRAMES : tab === 'title' ? TITLES : CHATS;
      const key = tab === 'frame' ? 'frameId' : tab === 'title' ? 'titleId' : 'chatId';
      const cur = profile()[key] || 'none';
      const sel = list.find(x => x.id === cur) || list[0];
      how = sel.how;
      preview = `<div class="hv-pf-badge hv-pf-${tab}">${esc(sel.name)}</div>`;
      grid = list.map(x => `<button type="button" class="hv-pf-skin${x.id === cur ? ' is-on' : ''}" data-pf-pick="${esc(x.id)}"><span>${esc(x.name)}</span></button>`).join('');
    }
    return `<div class="hv-pf-preview">${preview}<b>${esc(nick())}</b></div>
      <p class="hv-pf-how">Cách lấy: ${esc(how)}</p>
      <div class="hv-pf-tabs">${tabBtns}</div>
      <div class="hv-pf-grid">${grid}</div>
      <button type="button" class="hv-pf-wear" data-pf-sheet="home">Mang</button>`;
  }

  function modalHtml() {
    const m = state.modal;
    if (!m) return '';
    if (m === 'rename') {
      const used = Number(profile().renames || 0);
      return `<div class="hv-pf-mask"><div class="hv-pf-dialog" role="dialog">
        <h3>Sửa tên</h3>
        <input id="hvPfNick" maxlength="14" placeholder="Hãy nhập 4-14 ký tự" value="${esc(nick())}">
        <p>${used ? 'Đổi tiếp theo: 200 ngọc' : 'Đổi tên lần đầu miễn phí'}</p>
        <div class="hv-pf-row"><button type="button" data-pf-x>Hủy</button><button type="button" class="is-gold" data-pf-do="rename">Xác định</button></div>
      </div></div>`;
    }
    if (m === 'gift') {
      return `<div class="hv-pf-mask"><div class="hv-pf-dialog" role="dialog">
        <h3>Mã đổi</h3>
        <input id="hvPfGift" maxlength="24" placeholder="Hãy nhập mã đổi" autocomplete="off">
        <p>Thử <b>MONGGIOI</b> hoặc <b>LUCTHAN</b></p>
        <div class="hv-pf-row"><button type="button" data-pf-x>Hủy</button><button type="button" class="is-gold" data-pf-do="gift">Xác định</button></div>
      </div></div>`;
    }
    if (m === 'settings') {
      const vol = profile().vol || {};
      const bgm = vol.bgm != null ? vol.bgm : 0.7;
      const sfx = vol.sfx != null ? vol.sfx : 1;
      return `<div class="hv-pf-mask"><div class="hv-pf-dialog hv-pf-settings" role="dialog">
        <h3>Cài đặt trò chơi</h3>
        <label>Nhạc <input type="range" min="0" max="1" step="0.05" value="${bgm}" data-pf-vol="bgm"></label>
        <label>Hiệu ứng âm thanh <input type="range" min="0" max="1" step="0.05" value="${sfx}" data-pf-vol="sfx"></label>
        <p class="hv-pf-lang">Ngôn ngữ: <b>Tiếng Việt</b> (bản khác sắp có)</p>
        <div class="hv-pf-grid2">
          <button type="button" data-pf-do="logout">Đổi tài khoản</button>
          <button type="button" data-pf-do="wipe">Hủy tài khoản</button>
          <button type="button" data-pf-act="contact">Liên hệ CSKH</button>
        </div>
        <button type="button" data-pf-x>Đóng</button>
      </div></div>`;
    }
    if (m === 'contact') {
      return `<div class="hv-pf-mask"><div class="hv-pf-dialog" role="dialog">
        <h3>Kênh CSKH Lục Thần</h3>
        <ul class="hv-pf-faq">
          <li>Mất tài khoản — đăng nhập lại Google/Facebook hoặc email đã tạo.</li>
          <li>Mã quà — nhập trong Hồ sơ → Mã đổi. Mỗi mã một lần.</li>
          <li>Không vào được Thành Chính — kéo trang, thử Du khách.</li>
        </ul>
        <button type="button" data-pf-x>Đóng</button>
      </div></div>`;
    }
    if (m === 'link') {
      const linked = typeof NET === 'object' && NET.token;
      return `<div class="hv-pf-mask"><div class="hv-pf-dialog" role="dialog">
        <h3>Liên kết tài khoản</h3>
        <p>${linked ? 'Đã liên kết — quà nhập môn giữ trên máy chủ.' : 'Đăng nhập Google/Facebook/email để không mất hồ sơ khi đổi máy.'}</p>
        <p class="hv-pf-giftline">Quà ràng buộc: 🪙 100 · 💎 30${profile().linkGift ? ' — đã nhận' : ''}</p>
        <div class="hv-pf-row"><button type="button" data-pf-x>Đóng</button>${linked ? '' : '<button type="button" class="is-gold" data-pf-do="login">Đăng nhập</button>'}</div>
      </div></div>`;
    }
    return '';
  }

  function paint() {
    pinAvatar();
    const body = state.sheet === 'skins' ? skinsHtml() : homeHtml();
    root.innerHTML = `<header class="hv-pf-top">
      <button type="button" class="hv-pf-back" data-pf-back aria-label="Quay lại">‹</button>
      <b>${state.sheet === 'skins' ? 'Hình tượng' : 'Hồ sơ'}</b>
      <span class="hv-pf-age">18+</span>
    </header>
    <div class="hv-pf-body">${body}</div>
    ${state.toast ? `<p class="hv-pf-toast">${esc(state.toast)}</p>` : ''}
    ${modalHtml()}`;
  }

  root.addEventListener('click', ev => {
    if (ev.target.classList && ev.target.classList.contains('hv-pf-mask')) {
      state.modal = '';
      paint();
      return;
    }
    const t = ev.target.closest('[data-pf-back],[data-pf-act],[data-pf-sheet],[data-pf-tab],[data-pf-pick],[data-pf-do],[data-pf-x]');
    if (!t) return;
    if (t.hasAttribute('data-pf-back')) {
      if (state.modal) { state.modal = ''; paint(); return; }
      if (state.sheet !== 'home') { state.sheet = 'home'; paint(); return; }
      close();
      return;
    }
    if (t.hasAttribute('data-pf-x')) { state.modal = ''; paint(); return; }
    const act = t.getAttribute('data-pf-act');
    if (act) { state.modal = act; paint(); return; }
    const sheet = t.getAttribute('data-pf-sheet');
    if (sheet) { state.sheet = sheet; paint(); return; }
    const tab = t.getAttribute('data-pf-tab');
    if (tab) { state.tab = tab; paint(); return; }
    const pick = t.getAttribute('data-pf-pick');
    if (pick) {
      if ((state.tab === 'figure' || state.tab === 'avatar') && !owned(pick)) { toast('Chưa sở hữu tướng này.'); return; }
      const p = profile();
      if (state.tab === 'figure') p.figureId = pick;
      else if (state.tab === 'avatar') p.avatarId = pick;
      else if (state.tab === 'frame') p.frameId = pick;
      else if (state.tab === 'title') p.titleId = pick;
      else p.chatId = pick;
      saveP();
      paint();
      return;
    }
    const doit = t.getAttribute('data-pf-do');
    if (doit === 'rename') {
      const el = root.querySelector('#hvPfNick');
      const r = applyNick(el && el.value);
      if (!r.ok) { toast(r.msg); return; }
      state.modal = '';
      toast('Đã đổi tên.');
      paint();
      return;
    }
    if (doit === 'gift') {
      const el = root.querySelector('#hvPfGift');
      const r = redeem(el && el.value);
      if (!r.ok) { toast(r.msg); return; }
      state.modal = '';
      toast((r.label || 'Mã quà') + ' · 🪙' + (r.gold || 0) + ' 💎' + (r.gems || 0));
      paint();
      return;
    }
    if (doit === 'logout') {
      close();
      if (typeof netLogout === 'function') netLogout();
      else if (typeof showLogin === 'function') showLogin();
      return;
    }
    if (doit === 'wipe') {
      if (!window.confirm('Xóa hồ sơ máy này? Không hoàn lại.')) return;
      if (typeof wipeSave === 'function') wipeSave();
      close();
      if (typeof navTo === 'function') navTo('hub');
      return;
    }
    if (doit === 'login') {
      const p = profile();
      if (!p.linkGift) {
        p.linkGift = true;
        if (typeof P === 'object') {
          P.gold = (P.gold || 0) + 100;
          P.gems = (P.gems || 0) + 30;
          saveP();
        }
      }
      close();
      if (typeof netLogout === 'function') netLogout();
    }
  });
  root.addEventListener('input', ev => {
    const kind = ev.target.getAttribute && ev.target.getAttribute('data-pf-vol');
    if (kind) setVol(kind, ev.target.value);
  });

  function hitPlayer(el) {
    return !!(el && el.closest && el.closest('#hubScreen .art-player'));
  }
  let lastOpen = 0;
  function tryOpen(ev) {
    if (!hitPlayer(ev.target)) return;
    ev.preventDefault();
    ev.stopPropagation();
    const now = Date.now();
    if (now - lastOpen < 400) return;
    lastOpen = now;
    open();
  }
  document.addEventListener('pointerup', tryOpen, true);
  document.addEventListener('click', tryOpen, true);

  pinAvatar();
})();
