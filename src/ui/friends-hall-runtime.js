(() => {
  if (typeof document === 'undefined' || !document.body) return;
  const body = document.getElementById('friendsBody');
  if (!body || document.getElementById('hvFriendsRoot')) return;

  const root = document.createElement('section');
  root.id = 'hvFriendsRoot';
  root.setAttribute('aria-label', 'Bạn bè');
  root.innerHTML = `<header class="hv-friends-top">
    <button type="button" class="hv-friends-back" data-friends-close aria-label="Đóng">‹</button>
    <b>Bạn bè</b>
    <span data-fr-count></span>
  </header>
  <div class="hv-friends-hero"></div>
  <nav class="hv-fr-tabs">
    <button type="button" class="is-on" data-fr-tab="list">Hảo hữu</button>
    <button type="button" data-fr-tab="inbox">Danh sách xin</button>
    <button type="button" data-fr-tab="add">Thêm bạn bè</button>
  </nav>
  <div class="hv-fr-list" data-fr-list></div>
  <div class="hv-fr-bar">
    <button type="button" data-fr-gift>Nhận và tặng nhanh</button>
  </div>
  <nav class="hv-fr-dock">
    <button type="button" data-fr-tab="list">Hảo hữu</button>
    <button type="button" data-fr-tab="inbox">Xin kết</button>
    <button type="button" data-fr-tab="add">Thêm</button>
    <button type="button" data-fr-chat>Trò chuyện</button>
  </nav>
  <div class="hv-friends-stage"></div>`;
  root.querySelector('.hv-friends-stage').append(body);
  document.body.append(root);

  let tab = 'list';
  let cache = { list: [], inbox: [], suggest: [], cap: 100, offline: true };

  function online() {
    return typeof netOnline === 'function' ? netOnline() : false;
  }

  function card(p, kind) {
    const ic = String(p.user || '?').slice(0, 1).toUpperCase();
    const acts = kind === 'list'
      ? `<button type="button" data-fr-msg="${p.user}" title="Chat">💬</button>
         <button type="button" data-fr-rm="${p.user}" title="Xóa">✕</button>`
      : kind === 'inbox'
        ? `<button type="button" data-fr-ok="${p.user}">Nhận</button>`
        : `<button type="button" data-fr-add="${p.user}">Kết</button>`;
    return `<article class="hv-fr-card">
      <div class="hv-fr-av">${ic}</div>
      <div><b>${p.user}</b><small>Lực chiến ${(p.power || 0).toLocaleString('vi-VN')} · rank ${p.rank || '—'}</small></div>
      <div class="hv-fr-acts">${acts}</div>
    </article>`;
  }

  async function load() {
    if (!online() || typeof api !== 'function') {
      cache = { list: [], inbox: [], suggest: [], cap: 100, offline: true };
      return cache;
    }
    try {
      const j = await api('/api/friends');
      cache = { list: j.list || [], inbox: j.inbox || [], suggest: j.suggest || [], cap: j.cap || 100, offline: false };
    } catch {
      cache = { list: [], inbox: [], suggest: [], cap: 100, offline: true };
    }
    return cache;
  }

  function paint() {
    const list = root.querySelector('[data-fr-list]');
    const count = root.querySelector('[data-fr-count]');
    root.querySelectorAll('[data-fr-tab]').forEach(b => b.classList.toggle('is-on', b.getAttribute('data-fr-tab') === tab));
    if (count) count.textContent = (cache.list.length || 0) + '/' + (cache.cap || 100);
    if (cache.offline) {
      list.innerHTML = `<div class="hv-fr-empty">Đăng nhập tài khoản để kết bạn <b>người chơi thật</b>. Không dùng NPC.</div>`;
      return;
    }
    if (tab === 'inbox') {
      list.innerHTML = cache.inbox.length ? cache.inbox.map(p => card(p, 'inbox')).join('') : '<div class="hv-fr-empty">Không có lời mời.</div>';
      return;
    }
    if (tab === 'add') {
      list.innerHTML = `<div class="hv-fr-card"><input data-fr-name placeholder="Tên người chơi" style="grid-column:1/-1;min-height:40px;border:1px solid #d7b883;border-radius:10px;padding:8px 10px;font:inherit">
        <button type="button" data-fr-go style="grid-column:1/-1;min-height:40px;border:0;border-radius:10px;background:#e2b45a;font-weight:800">Gửi lời mời</button></div>`
        + (cache.suggest.length ? cache.suggest.map(p => card(p, 'add')).join('') : '<div class="hv-fr-empty">Chưa có gợi ý từ server.</div>');
      return;
    }
    list.innerHTML = cache.list.length ? cache.list.map(p => card(p, 'list')).join('') : '<div class="hv-fr-empty">Chưa có hảo hữu. Mở Thêm bạn bè.</div>';
  }

  async function act(action, user) {
    if (typeof api !== 'function') return;
    try {
      await api('/api/friends', 'POST', { user, action });
      await load();
      paint();
    } catch (e) {
      if (typeof toast === 'function') toast((e && e.message) || 'Không gửi được.');
    }
  }

  const syncOpen = name => {
    const open = name === 'friends';
    root.hidden = !open;
    root.classList.toggle('is-open', open);
    document.body.classList.toggle('friends-hall-active', open);
    if (open) load().then(paint);
  };

  const baseShowScreen = showScreen;
  showScreen = function showScreenWithFriendsHall(name) {
    baseShowScreen(name);
    syncOpen(ST.screen);
  };

  if (typeof renderFriends === 'function') {
    const base = renderFriends;
    renderFriends = function () {
      base.apply(this, arguments);
      if (ST && ST.screen === 'friends') load().then(paint);
    };
  }

  root.querySelector('[data-friends-close]').addEventListener('click', () => navTo('hub'));
  root.addEventListener('click', ev => {
    const t = ev.target.closest('[data-fr-tab],[data-fr-add],[data-fr-ok],[data-fr-rm],[data-fr-msg],[data-fr-go],[data-fr-gift],[data-fr-chat]');
    if (!t) return;
    if (t.hasAttribute('data-fr-tab')) { tab = t.getAttribute('data-fr-tab'); paint(); return; }
    if (t.hasAttribute('data-fr-chat')) { navTo('chat'); return; }
    if (t.hasAttribute('data-fr-gift')) {
      if (typeof friendClaimStamina === 'function') {
        const n = friendClaimStamina();
        if (typeof toast === 'function') toast(n ? ('⚡ Nhận ' + n + ' Thể Lực.') : 'Hôm nay đã nhận rồi.');
      }
      return;
    }
    if (t.hasAttribute('data-fr-go')) {
      const input = root.querySelector('[data-fr-name]');
      if (input && input.value) act('add', input.value.trim());
      return;
    }
    if (t.hasAttribute('data-fr-add')) act('add', t.getAttribute('data-fr-add'));
    if (t.hasAttribute('data-fr-ok')) act('accept', t.getAttribute('data-fr-ok'));
    if (t.hasAttribute('data-fr-rm')) act('remove', t.getAttribute('data-fr-rm'));
    if (t.hasAttribute('data-fr-msg')) navTo('chat');
  });
  syncOpen(typeof ST === 'object' ? ST.screen : '');
})();
