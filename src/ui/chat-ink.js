// Owner 2026-11-12: man Tro Chuyen kieu giay thuy mac (mau 2 da duyet), du 6 kenh khi offline.
// Offline: Thế Giới / Bang Hội / Tổ Đội dung kenh cu (setChatChannel, sendChat); Gia Tộc / Hảo Hữu / Hệ Thống la kenh cua man nay.
// Online: de chat-channels-runtime (#hvChat2) xu ly, CSS dung chung giao dien.
(() => {
  if (typeof document === 'undefined' || typeof renderChat !== 'function') return;
  const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const online = () => { try { return typeof netOnline === 'function' && netOnline(); } catch (_) { return false; } };
  const lv = name => { let h = 7; for (const c of String(name)) h = (h * 17 + c.charCodeAt(0)) | 0; return 20 + Math.abs(h) % 80; };
  const hhmm = t => { const d = new Date(Number(t) || Date.now()); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };
  // Cu dan khong co anh rieng: lay anh tuong co dinh theo ten (giong ban online), khong de chu cai tron.
  const AV = (() => { try { return Object.values(CHARACTER_MANIFEST).map(c => c && c.assets && c.assets.avatar).filter(Boolean); } catch (_) { return []; } })();
  const byName = n => { if (!AV.length) return ''; let h = 0; for (const c of String(n)) h = (h * 31 + c.charCodeAt(0)) | 0; return AV[Math.abs(h) % AV.length]; };
  const avatar = m => { try { return (m.heroId && characterAsset(m.heroId, 'avatar')) || byName(m.who || ''); } catch (_) { return byName(m.who || ''); } };
  const myAvatar = () => { try { const id = (P.squad || [])[0]?.id; return id ? characterAsset(id, 'avatar') : ''; } catch (_) { return ''; } };
  const fixName = t => String(t || '').replace(/Kênh Mộng Phố/g, 'Kênh Giang Hồ');

  const TABS = [
    { k: 'world', label: 'Thế Giới', base: true },
    { k: 'guild', label: 'Bang Hội', base: true },
    { k: 'clan', label: 'Gia Tộc' },
    { k: 'team', label: 'Tổ Đội', base: true },
    { k: 'friend', label: 'Hảo Hữu' },
    { k: 'sys', label: 'Hệ Thống' }
  ];
  const isSys = m => !m.me && (/^(Hệ thống|Loa)/i.test(m.who || '') || /Chúc mừng/i.test(m.text || ''));
  const st = { tab: null, peer: '', quick: false };

  const root = document.createElement('section');
  root.id = 'hvChatInk'; root.hidden = true;
  root.setAttribute('aria-label', 'Trò chuyện');
  document.body.append(root);

  const baseCh = () => (P.social && P.social.channel) || 'world';
  const cur = () => st.tab || baseCh();
  const friends = () => {
    try { const f = typeof ensureFriends === 'function' ? ensureFriends() : P.friends; const ids = (f && f.list) || [];
      return ids.map(id => FRIEND_SEEDS.find(x => x.id === id)).filter(Boolean); } catch (_) { return []; }
  };
  const peerName = () => (friends().find(f => f.id === st.peer) || {}).name || '';

  function banner() {
    const hit = [...(P.chat || [])].reverse().find(m => /Chúc mừng/i.test(m.text || ''));
    return hit ? hit.text : 'Chào mừng đại hiệp tới Kênh Giang Hồ';
  }

  function row(m) {
    if (isSys(m) || (!m.me && !m.heroId && /Bang Vụ|Chỉ Huy/i.test(m.who || ''))) {
      return `<div class="ck-sys"><b>${esc(m.who || 'Hệ thống')}</b><span>${esc(fixName(m.text))}</span></div>`;
    }
    const av = m.me ? myAvatar() : avatar(m);
    const name = m.me ? 'Ta' : (m.who || '?');
    return `<div class="ck-row${m.me ? ' me' : ''}">
      <div class="ck-av">${av ? `<img src="${esc(av)}" alt="">` : `<b>${esc(String(name).slice(0, 1))}</b>`}</div>
      <div class="ck-col"><div class="ck-meta"><b>${esc(name)}</b><i>Lv.${lv(m.who || name)}</i></div>
        <div class="ck-line"><div class="ck-bub">${esc(fixName(m.text))}</div><time>${hhmm(m.t)}</time></div></div></div>`;
  }

  function feedFor(k) {
    const all = P.chat || [];
    if (k === 'sys') {
      const list = all.filter(isSys).slice(-60);
      return { html: list.map(row).join('') || '<p class="ck-empty">Chưa có thông báo. Rèn ra đồ SSR hay chiêu mộ tướng hiếm sẽ được loa báo ở đây.</p>', canType: false, title: 'Loa hệ thống' };
    }
    if (k === 'clan') {
      return { html: '<p class="ck-empty">Đại hiệp chưa vào gia tộc. Gia tộc mở khi chơi online — đăng nhập tài khoản để lập hoặc gia nhập gia tộc.</p>', canType: false, title: 'Kênh gia tộc' };
    }
    if (k === 'friend') {
      if (!st.peer) {
        const fs = friends();
        const html = fs.length ? fs.map(f => `<button type="button" class="ck-fr" data-ck-peer="${esc(f.id)}"><span class="ck-av sm"><img src="${esc(byName(f.name))}" alt=""></span><b>${esc(f.name)}</b><small>Lv.${f.lv} · ⚔ ${Number(f.power || 0).toLocaleString('vi-VN')}</small></button>`).join('')
          : '<p class="ck-empty">Chưa có hảo hữu. Kết bạn ở mục <b>Bạn bè</b> rồi quay lại đây.</p>';
        return { html, canType: false, title: 'Hảo hữu' };
      }
      const list = all.filter(m => m.channel === 'friend:' + st.peer).slice(-80);
      return { html: list.map(row).join('') || `<p class="ck-empty">Gửi lời chào tới ${esc(peerName())} nào!</p>`, canType: true, title: '✉ ' + peerName(), back: true };
    }
    const list = all.filter(m => (m.channel || 'world') === k && !isSys(m) || ((m.channel || 'world') === k && /^Loa/.test(m.who || ''))).slice(-80);
    const ch = (typeof CHAT_CHANNELS === 'object' && CHAT_CHANNELS[k]) || {};
    return { html: list.map(row).join('') || `<p class="ck-empty">${esc(ch.hint || '')}</p>`, canType: true, title: '' };
  }

  function paint() {
    const k = cur();
    const tabs = TABS.map(t => {
      const open = !t.base || typeof chatChannelOpen !== 'function' || chatChannelOpen(t.k);
      const u = t.base && typeof socialUnread === 'function' && t.k !== k ? socialUnread(t.k) : 0;
      return `<button type="button" class="ck-tab${t.k === k ? ' on' : ''}" data-ck-tab="${t.k}" ${open ? '' : 'disabled'}>${t.label}${u ? `<i>${u}</i>` : ''}</button>`;
    }).join('');
    const f = feedFor(k);
    root.innerHTML = `<div class="ck">
      <header class="ck-top"><button type="button" class="ck-back" data-ck-close aria-label="Về Thành Chính">‹</button>
        <h2 class="ck-title">Trò Chuyện</h2></header>
      <nav class="ck-tabs">${tabs}</nav>
      <div class="ck-banner">${f.back ? '<button type="button" class="ck-mini" data-ck-peer="">‹ Danh sách</button>' : ''}<span>${esc(f.title || banner())}</span></div>
      <div class="ck-feed">${f.html}</div>
      <div class="ck-quick"${st.quick && f.canType ? '' : ' hidden'}>${['Chào các huynh đệ!', 'Ai đi Boss không?', 'Đa tạ!', 'Chúc mừng!', 'Lập tổ đội nào!'].map(q => `<button type="button" data-ck-q="${esc(q)}">${q}</button>`).join('')}</div>
      <form class="ck-input${f.canType ? '' : ' off'}" data-ck-send>
        <button type="button" class="ck-emo" data-ck-emo aria-label="Câu nhanh" ${f.canType ? '' : 'disabled'}>☺</button>
        <input name="text" maxlength="160" autocomplete="off" placeholder="${f.canType ? 'Nhập tin nhắn...' : 'Kênh này chỉ để xem'}" ${f.canType ? '' : 'disabled'}>
        <button type="submit" class="ck-send" ${f.canType ? '' : 'disabled'}>Gửi</button>
      </form></div>`;
    const el = root.querySelector('.ck-feed'); if (el) el.scrollTop = el.scrollHeight;
  }

  const prev = renderChat;
  renderChat = function renderChatInk() {
    if (online()) { root.hidden = true; document.body.classList.remove('chat-ink-open'); return prev.apply(this, arguments); }
    try { prev.apply(this, arguments); } catch (_) {}
    if (ST.screen !== 'chat') return;
    const old = document.getElementById('hvChatRoot'); if (old) old.style.visibility = 'hidden';
    root.hidden = false; document.body.classList.add('chat-ink-open');
    paint();
  };

  const close = () => { if (typeof navTo === 'function') navTo('hub'); };
  const baseShow = showScreen;
  showScreen = function showScreenChatInk(n) {
    baseShow.apply(this, arguments);
    if (ST.screen !== 'chat' && !root.hidden) {
      root.hidden = true; document.body.classList.remove('chat-ink-open');
      const old = document.getElementById('hvChatRoot'); if (old) old.style.visibility = '';
    }
  };

  function friendReply(id) {
    const f = FRIEND_SEEDS.find(x => x.id === id); if (!f) return;
    const pool = (typeof CHAT_REPLIES === 'object' && CHAT_REPLIES.world) || ['Ừ ừ!', 'Chuẩn luôn!', 'Đa tạ huynh!'];
    setTimeout(() => { chatPush(f.name, pool[(Math.random() * pool.length) | 0], false, 'friend:' + id); if (ST.screen === 'chat' && cur() === 'friend' && st.peer === id) paint(); }, 800 + Math.random() * 900);
  }

  root.addEventListener('click', ev => {
    const t = ev.target.closest('[data-ck-tab],[data-ck-close],[data-ck-emo],[data-ck-q],[data-ck-peer]');
    if (!t) return;
    ev.preventDefault();
    if (t.matches('[data-ck-close]')) return close();
    if (t.matches('[data-ck-emo]')) { st.quick = !st.quick; const q = root.querySelector('.ck-quick'); if (q) q.hidden = !st.quick; return; }
    if (t.matches('[data-ck-q]')) { const i = root.querySelector('.ck-input input'); i.value = t.dataset.ckQ; i.focus(); st.quick = false; root.querySelector('.ck-quick').hidden = true; return; }
    if (t.matches('[data-ck-peer]')) { st.peer = t.dataset.ckPeer; paint(); return; }
    if (t.matches('[data-ck-tab]')) {
      const k = t.dataset.ckTab, def = TABS.find(x => x.k === k);
      st.peer = '';
      if (def && def.base) { st.tab = null; if (k === baseCh()) paint(); else setChatChannel(k); }
      else { st.tab = k; paint(); }
    }
  });
  root.addEventListener('submit', ev => {
    ev.preventDefault();
    const i = ev.target.text; const text = (i.value || '').trim(); if (!text) return;
    i.value = '';
    if (cur() === 'friend' && st.peer) { chatPush('Anh', text, true, 'friend:' + st.peer); try { socialTrackPost?.(); } catch (_) {} paint(); friendReply(st.peer); return; }
    if (typeof sendChat === 'function') sendChat(text);
  });
  window.HV_CHAT_INK = { paint, state: st };
})();

// Owner 12/11 18:41: gom tab kenh thanh 1 nut so xuong (offline #hvChatInk + online #hvChat2).
(() => {
  const wrap = (box, tabSel) => {
    if (!box || box.querySelector('.ck-pick')) return;
    const tabs = [...box.querySelectorAll(tabSel)];
    if (!tabs.length) return;
    const on = tabs.find(t => t.classList.contains('on') || t.classList.contains('active') || t.getAttribute('aria-selected') === 'true') || tabs[0];
    const label = (on.childNodes[0] && on.childNodes[0].textContent || on.innerText).trim();
    const unread = tabs.filter(t => t !== on).reduce((s, t) => s + (parseInt((t.querySelector('i,.badge,.c2-badge') || {}).textContent, 10) || 0), 0);
    const drop = document.createElement('div'); drop.className = 'ck-drop';
    tabs.forEach(t => drop.append(t));
    const pick = document.createElement('button'); pick.type = 'button'; pick.className = 'ck-pick';
    pick.innerHTML = '<span>' + label.replace(/[<>&]/g, '') + '</span><i>▾</i>' + (unread ? '<b>' + unread + '</b>' : '');
    pick.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); box.classList.toggle('open'); });
    drop.addEventListener('click', () => box.classList.remove('open'));
    box.append(pick, drop);
  };
  const run = () => {
    wrap(document.querySelector('#hvChatInk .ck-tabs'), '.ck-tab');
    wrap(document.querySelector('#hvChat2 .c2-rail'), '.c2-ch');
  };
  new MutationObserver(run).observe(document.body, { childList: true, subtree: true });
  document.addEventListener('click', e => { if (!e.target.closest('.ck-tabs,.c2-rail')) document.querySelectorAll('.ck-tabs.open,.c2-rail.open').forEach(x => x.classList.remove('open')); });
})();