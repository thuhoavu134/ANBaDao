(() => {
  if (typeof document === 'undefined') return;

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
      NET.server = origin();
      NET.token = j.token;
      NET.user = j.user;
      if (typeof saveNet === 'function') saveNet();
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
    const baseAuth = netAuth;
    netAuth = function netAuthSameOrigin() {
      pinServer();
      return baseAuth.apply(this, arguments);
    };
  }

  pinServer();
  consumeOauth();
})();
