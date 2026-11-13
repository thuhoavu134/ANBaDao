// Owner 2026-11-04 09:05: khung chat theo concept da duyet (kieu game quoc te) + kenh Hảo Hữu.
// Kenh that qua server: Thế Giới / Bang Hội / Gia Tộc / Hảo Hữu / Hệ Thống. Offline -> giu man chat cu.
(() => {
  if (typeof document === 'undefined' || typeof renderChat !== 'function') return;
  const A = 'assets/ui/chat/v2/';
  const CH = [
    { k: 'world', label: 'Thế giới', title: 'Kênh thế giới', ic: 'ic-world.png', hint: 'Kênh chung của toàn giang hồ.' },
    { k: 'guild', label: 'Bang hội', title: 'Kênh bang hội', ic: 'ic-guild.png', hint: 'Chỉ thành viên trong bang mới thấy.' },
    { k: 'friend', label: 'Hảo hữu', title: 'Hảo hữu', ic: 'ic-friend.png', hint: 'Trò chuyện riêng với hảo hữu.' },
    { k: 'sys', label: 'Hệ thống', title: 'Loa hệ thống', ic: 'ic-sys.png', hint: 'Chiêu mộ SSR, báu vật, vận may lớn.' }
  ];
  try { CHAT_CHANNELS.world.label = 'Thế Giới'; CHAT_CHANNELS.world.ic = '🌏'; CHAT_CHANNELS.world.hint = CH[0].hint; } catch (_) {}
  const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const online = () => { try { return typeof netOnline === 'function' && netOnline(); } catch (_) { return false; } };
  const me = () => (typeof NET === 'object' && NET.user) || '';
  const S = { ch: 'world', peer: '', msgs: {}, last: {}, mine: { guild: null }, list: { guild: [] }, friends: [], busy: false };
  const key = () => S.ch === 'friend' ? 'friend:' + S.peer.toLowerCase() : S.ch;

  // avatar: tuong co dinh theo ten nguoi choi
  const AV = (() => { try { return Object.values(CHARACTER_MANIFEST).map(c => c && c.assets && c.assets.avatar).filter(Boolean); } catch (_) { return []; } })();
  function avatarOf(name) {
    if (!AV.length) return '';
    let h = 0; for (const c of String(name)) h = (h * 31 + c.charCodeAt(0)) | 0;
    return AV[Math.abs(h) % AV.length];
  }
  const levelOf = name => { let h = 7; for (const c of String(name)) h = (h * 17 + c.charCodeAt(0)) | 0; return 20 + Math.abs(h) % 80; };
  const hhmm = t => { const d = new Date(Number(t) || Date.now()); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };

  async function info(kind) { const j = await api('/api/guild?kind=' + kind); S.mine.guild = j.guild || null; S.list[kind] = j.list || []; }
  async function friends() { const j = await api('/api/friends'); S.friends = j.list || []; }
  async function pull() {
    const ch = S.ch, k = key();
    if ((ch === 'guild') && !S.mine[ch]) return false;
    if (ch === 'friend' && !S.peer) return false;
    const q = '/api/chat?channel=' + ch + '&since=' + (S.last[k] || 0) + (ch === 'friend' ? '&peer=' + encodeURIComponent(S.peer) : '');
    const j = await api(q);
    S.last[k] = Math.max(S.last[k] || 0, j.last || 0);
    const add = j.messages || [];
    if (!add.length) return false;
    S.msgs[k] = (S.msgs[k] || []).concat(add).slice(-80);
    return true;
  }

  const root = document.createElement('section');
  root.id = 'hvChat2'; root.hidden = true;
  root.setAttribute('aria-label', 'Trò chuyện');
  document.body.append(root);

  function bubble(m) {
    if (m.kind === 'sys') {
      return `<div class="c2-sys"><i class="c2-sys-tag">Hệ thống</i><img class="c2-sys-horn" src="${A}ic-sys.png" alt=""><p>${esc(m.text).replace(/【([^】]+)】([^—!,]+)/g, '<em>【$1】$2</em>')}</p></div>`;
    }
    const mine = m.user === me();
    const av = avatarOf(m.user);
    return `<div class="c2-row${mine ? ' me' : ''}">
      <div class="c2-av">${av ? `<img src="${esc(av)}" alt="">` : `<b>${esc(String(m.user).slice(0, 1))}</b>`}<i>Lv.${levelOf(m.user)}</i></div>
      <div class="c2-col"><div class="c2-meta"><b>${esc(m.user)}</b><time>${hhmm(m.t)}</time></div>
        <div class="c2-bub">${esc(m.text)}</div></div></div>`;
  }
  function groupPanel(kind) {
    const label = 'bang';
    const rows = (S.list[kind] || []).map(g => `<div class="c2-g"><div><b>${esc(g.name)}</b><small>${g.members} người · chủ ${esc(g.owner)}</small></div>
        <button type="button" class="c2-btn" data-cc-join="${esc(g.id)}">Gia nhập</button></div>`).join('')
      || `<p class="c2-empty">Chưa có ${label} nào. Đại hiệp hãy lập ${label} đầu tiên!</p>`;
    return `<p class="c2-empty">Đại hiệp chưa vào ${label}. Gia nhập hoặc lập ${label} để mở kênh.</p>${rows}
      <form class="c2-make" data-cc-make="${kind}"><input name="name" maxlength="18" minlength="2" placeholder="Tên ${label} (2–18 ký tự)" required>
      <button type="submit" class="c2-btn gold">Lập ${label}</button></form>`;
  }
  function friendPanel() {
    if (!S.friends.length) return `<p class="c2-empty">Chưa có hảo hữu. Kết bạn ở mục <b>Bạn bè</b> rồi quay lại đây trò chuyện riêng.</p>`;
    return S.friends.map(f => `<button type="button" class="c2-fr" data-cc-peer="${esc(f.user)}">
      <span class="c2-av sm">${avatarOf(f.user) ? `<img src="${esc(avatarOf(f.user))}" alt="">` : ''}</span>
      <b>${esc(f.user)}</b><small>⚔ ${Number(f.power || 0).toLocaleString('vi-VN')}</small></button>`).join('');
  }
  function paint() {
    if (root.hidden) return;
    const c = CH.find(x => x.k === S.ch);
    const rail = CH.map(x => `<button type="button" class="c2-ch${x.k === S.ch ? ' on' : ''}" data-cc-tab="${x.k}">
        <img src="${A}${x.ic}" alt=""><span>${x.label}</span></button>`).join('');
    let title = c.title, count = '', body, canType = true;
    if ((S.ch === 'guild') && !S.mine[S.ch]) { body = groupPanel(S.ch); canType = false; }
    else if (S.ch === 'friend' && !S.peer) { body = friendPanel(); canType = false; }
    else {
      if (S.ch === 'guild') { title = S.mine[S.ch].name; count = `👥 ${S.mine[S.ch].members || 1}`; }
      if (S.ch === 'friend') title = '✉ ' + S.peer;
      body = (S.msgs[key()] || []).map(bubble).join('') || `<p class="c2-empty">${esc(c.hint)}</p>`;
      if (S.ch === 'sys') canType = false;
    }
    const back = S.ch === 'friend' && S.peer ? `<button type="button" class="c2-mini" data-cc-peer="">‹ Danh sách</button>`
      : ((S.ch === 'guild') && S.mine[S.ch] ? `<button type="button" class="c2-mini" data-cc-leave="${S.ch}">Rời</button>` : '');
    root.innerHTML = `<div class="c2">
      <div class="c2-roof"><button type="button" class="c2-x" data-c2-close aria-label="Đóng">✕</button></div>
      <nav class="c2-rail">${rail}</nav>
      <div class="c2-main">
        <div class="c2-bar">${back}<h3><i></i>${esc(title)}<i></i></h3>${count ? `<span class="c2-count">${count}</span>` : ''}</div>
        <div class="c2-feed">${body}</div>
      </div>
      <form class="c2-input${canType ? '' : ' off'}" data-cc-send>
        <button type="button" class="c2-emo" data-c2-emo aria-label="Câu nhanh">☺</button>
        <input name="text" maxlength="160" autocomplete="off" placeholder="${canType ? 'Nhập tin nhắn…' : 'Kênh này chỉ để xem'}" ${canType ? '' : 'disabled'}>
        <button type="submit" class="c2-send" ${canType ? '' : 'disabled'}>Gửi</button>
      </form>
      <div class="c2-quick" hidden>${['Chào các huynh đệ!', 'Ai đi Boss không?', 'Đa tạ!', 'Bang mình lên!', 'Chúc mừng!'].map(q => `<button type="button" data-c2-q="${esc(q)}">${q}</button>`).join('')}</div>
    </div>`;
    const feed = root.querySelector('.c2-feed');
    if (feed) feed.scrollTop = feed.scrollHeight;
  }

  const base = renderChat;
  renderChat = function renderChatV2() {
    if (!online()) { root.hidden = true; return base.apply(this, arguments); }
    open();
  };
  async function open() {
    const wasHidden = root.hidden;
    root.hidden = false; document.body.classList.add('chat2-open');
    const old = document.getElementById('hvChatRoot'); if (old) old.style.visibility = 'hidden';
    paint();
    if (wasHidden) { try { await Promise.all([info('guild'), friends()]); await pull(); } catch (_) {} paint(); }
  }
  function close() {
    root.hidden = true; document.body.classList.remove('chat2-open');
    const old = document.getElementById('hvChatRoot'); if (old) old.style.visibility = '';
    if (typeof navTo === 'function') navTo('hub');
  }
  const baseShow = typeof showScreen === 'function' ? showScreen : null;
  if (baseShow) showScreen = function showScreenChat2(n) { baseShow.apply(this, arguments); if (ST.screen !== 'chat' && !root.hidden) { root.hidden = true; document.body.classList.remove('chat2-open'); const o = document.getElementById('hvChatRoot'); if (o) o.style.visibility = ''; } };

  root.addEventListener('click', async ev => {
    const t = ev.target.closest('[data-cc-tab],[data-cc-join],[data-cc-leave],[data-cc-peer],[data-c2-close],[data-c2-emo],[data-c2-q]');
    if (!t) return;
    ev.preventDefault();
    try {
      if (t.dataset.c2Close !== undefined && t.matches('[data-c2-close]')) return close();
      if (t.matches('[data-c2-emo]')) { const q = root.querySelector('.c2-quick'); q.hidden = !q.hidden; return; }
      if (t.matches('[data-c2-q]')) { const i = root.querySelector('.c2-input input'); if (i && !i.disabled) { i.value = t.dataset.c2Q; i.focus(); } root.querySelector('.c2-quick').hidden = true; return; }
      if (t.matches('[data-cc-tab]')) {
        S.ch = t.dataset.ccTab; if (S.ch !== 'friend') S.peer = ''; paint();
        if (S.ch === 'guild') await info(S.ch).catch(() => {});
        if (S.ch === 'friend') await friends().catch(() => {});
        await pull().catch(() => {}); paint();
      } else if (t.matches('[data-cc-peer]')) { S.peer = t.dataset.ccPeer; paint(); await pull().catch(() => {}); paint(); }
      else if (t.matches('[data-cc-join]')) { await api('/api/guild/join', 'POST', { id: t.dataset.ccJoin }); await info(S.ch); await pull(); paint(); toast?.('Đã gia nhập!'); }
      else if (t.matches('[data-cc-leave]')) { const k = t.dataset.ccLeave; await api('/api/guild/leave', 'POST', { kind: k }); delete S.msgs[k]; delete S.last[k]; await info(k); paint(); }
    } catch (e) { toast?.(e.message || 'Lỗi mạng'); }
  });
  root.addEventListener('submit', async ev => {
    const f = ev.target; ev.preventDefault();
    if (S.busy) return; S.busy = true;
    try {
      if (f.matches('[data-cc-send]')) {
        const text = f.text.value.trim(); if (!text) return;
        await api('/api/chat', 'POST', { text, channel: S.ch, peer: S.peer || undefined });
        f.text.value = ''; await pull(); paint();
        try { socialTrackPost?.(); } catch (_) {}
      } else if (f.matches('[data-cc-make]')) {
        const kind = f.dataset.ccMake;
        await api('/api/guild/create', 'POST', { name: f.name.value.trim(), kind });
        await info(kind); await pull(); paint(); toast?.('Đã lập bang!');
      }
    } catch (e) { toast?.(e.message || 'Lỗi mạng'); } finally { S.busy = false; }
  });
  setInterval(async () => { if (root.hidden || !online()) return; try { if (await pull()) paint(); } catch (_) {} }, 4000);
  window.HV_CHAT_CHANNELS = { state: S, paint, pull, info, open };
})();
