(() => {
  if (typeof document === 'undefined' || typeof NET !== 'object') return;

  function origin() {
    try { return location.origin; } catch { return ''; }
  }

  function pinServer() {
    if (typeof NET !== 'object') return;
    NET.server = origin();
    if (typeof saveNet === 'function') saveNet();
    const el = document.getElementById('netServer');
    if (el) el.value = NET.server;
  }

  const storage = typeof SAFE_LS === 'object' ? SAFE_LS : localStorage;
  const ownerKey = 'hon_viet_cloud_owner_v1';
  const metaKey = user => 'hon_viet_cloud_ack_v1:' + encodeURIComponent(user);
  let localOwner = '';
  try { localOwner = storage.getItem(ownerKey) || (NET.token ? NET.user : '') || ''; } catch {}
  const cloud = createCloudSession({
    getPlayer: () => P,
    newPlayer: () => defaultPlayer(),
    getLocalOwner: () => localOwner,
    setLocalOwner(user) { localOwner = user; storage.setItem(ownerKey, user); },
    getAcknowledged(user) { try { return JSON.parse(storage.getItem(metaKey(user)) || 'null'); } catch { return null; } },
    acknowledge(user, data) { storage.setItem(metaKey(user), JSON.stringify(data)); },
    backup(player, owner) {
      if (!player) return;
      const key = 'hon_viet_cloud_backup_v1:' + encodeURIComponent(owner || 'guest');
      const value = JSON.stringify(player);
      storage.setItem(key, value);
      if (storage.getItem(key) !== value) throw new Error('Không sao lưu được tiến trình trên máy. Chưa thay đổi bản lưu.');
    },
    replacePlayer(save) {
      if (typeof validateSaveObject === 'function' && !validateSaveObject(save).ok) throw new Error('Bản lưu trên mây không hợp lệ. Chưa thay đổi tiến trình.');
      P = migrateSave(save);
      if (typeof persist === 'function') persist();
    },
    setCredentials(session) {
      NET.user = session.user; NET.token = session.token; NET.guest = false;
      pinServer();
      if (typeof _netSyncT !== 'undefined') clearTimeout(_netSyncT);
    },
    async request(session, method, path, body) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10000);
      try {
        const response = await fetch(origin() + path, { method, signal: controller.signal,
          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + session.token },
          body: body === undefined ? undefined : JSON.stringify(body) });
        const result = await response.json();
        if (!response.ok) throw Object.assign(new Error(result.error || 'Không đồng bộ được tiến trình.'), { status: response.status, code: result.code });
        return result;
      } finally { clearTimeout(timer); }
    }
  });
  window.HonVietCloud = {
    signIn: credentials => cloud.connect(credentials),
    ready: () => cloud.connect({ user: NET.user, token: NET.token }),
    disconnect: () => cloud.disconnect(),
    inspect: () => cloud.inspect()
  };
  netUploadSave = async function netUploadSaveSafely(quiet) {
    if (!cloud.readyFor(NET)) return false;
    try {
      const saved = await cloud.upload();
      if (saved && !quiet && typeof toast === 'function') toast('☁ Đã lưu tiến trình trên mây.');
      return saved;
    } catch (error) {
      if (error.code !== 'SESSION_CHANGED' && typeof toast === 'function') toast(error.message + ' Bản lưu trên máy được giữ nguyên.');
      return false;
    }
  };
  if (typeof netPullSave === 'function') netPullSave = async function netPullSaveSafely() {
    try {
      await cloud.connect({ user: NET.user, token: NET.token }, { force: true });
      if (typeof refreshResbar === 'function') refreshResbar();
      if (typeof navTo === 'function') navTo('hub');
      if (typeof toast === 'function') toast('☁ Đã tải tiến trình tài khoản. Bản cũ trên máy đã được sao lưu.');
      return true;
    } catch (error) { if (typeof toast === 'function') toast(error.message); return false; }
  };
  if (typeof netPushProfile === 'function') {
    const push = netPushProfile;
    netPushProfile = function pushAuthenticatedProfile() { if (cloud.readyFor(NET)) return push.apply(this, arguments); };
  }
  if (typeof netLogout === 'function') {
    const logout = netLogout;
    netLogout = function logoutCloudSession() {
      cloud.disconnect();
      if (typeof _netSyncT !== 'undefined') clearTimeout(_netSyncT);
      return logout.apply(this, arguments);
    };
  }

  async function consumeOauth() {
    let code = '';
    try {
      code = new URLSearchParams(location.search).get('net_code') || '';
    } catch {}
    if (!code || typeof NET !== 'object') return;
    try {
      const r = await fetch(origin() + '/api/auth/oauth/exchange', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || ('HTTP ' + r.status));
      await window.HonVietCloud.signIn(j);
      if (typeof toast === 'function') toast('Đăng nhập Google — chào ' + NET.user + '!');
      if (typeof netPushProfile === 'function') netPushProfile();
      if (typeof netUploadSave === 'function') netUploadSave(true);
      if (typeof renderNet === 'function') renderNet();
      if (typeof refreshResbar === 'function') refreshResbar();
    } catch (e) {
      if (typeof toast === 'function') toast('Google: ' + ((e && e.message) || e));
    }
    try { history.replaceState({}, '', location.pathname + location.hash); } catch {}
  }

  function enhance() {
    pinServer();
    const body = document.getElementById('netBody');
    if (!body) return;
    const server = document.getElementById('netServer');
    if (server) {
      server.value = origin();
      server.hidden = true;
    }
    if (document.getElementById('hvNetGoogle')) return;
    const row = document.getElementById('netIn') || document.getElementById('netOut') || document.getElementById('netReg');
    const host = row ? row.parentElement : body.querySelector('.section');
    if (!host) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'hvNetGoogle';
    btn.className = 'btn ghost sm hv-net-google';
    btn.textContent = 'Đăng nhập Google (email)';
    btn.addEventListener('click', async () => {
      try {
        const r = await fetch(origin() + '/api/health');
        const j = await r.json().catch(() => ({}));
        if (!j.oauth) {
          if (typeof toast === 'function') toast('Chưa gắn Google Client ID trên Vercel.');
          return;
        }
      } catch {}
      location.href = origin() + '/api/auth/oauth/google';
    });
    host.appendChild(btn);
    const hint = body.querySelector('.section div');
    if (hint && /mong-gioi-server/.test(hint.innerHTML)) {
      hint.innerHTML = 'Tài khoản Lục Thần trên cùng bản Vercel. User + mật khẩu, hoặc Google (email). Không mạng vẫn chơi offline đủ.';
    }
  }

  if (typeof renderNet === 'function') {
    const baseRender = renderNet;
    renderNet = function renderNetWithAuth() {
      baseRender.apply(this, arguments);
      enhance();
    };
  }

  if (typeof netAuth === 'function') {
    netAuth = async function netAuthSameOrigin(kind) {
      pinServer();
      try {
        const user = String(document.getElementById('netUser')?.value || '').trim();
        const pass = document.getElementById('netPass')?.value || '';
        const response = await fetch(origin() + '/api/' + (kind === 'register' ? 'register' : 'login'), {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user, pass })
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Không đăng nhập được.');
        await window.HonVietCloud.signIn(result);
        netPushProfile(); await netUploadSave(true); renderNet(); refreshResbar();
      } catch (error) { toast?.(error.message); }
    };
  }

  pinServer();
  consumeOauth();
})();
