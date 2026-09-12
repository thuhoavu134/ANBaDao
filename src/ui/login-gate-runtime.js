(() => {
  if (typeof document === 'undefined' || !document.body) return;
  if (document.getElementById('hvLoginRoot')) return;

  const LAST_KEY = 'hv.login.last';
  const GUEST_KEY = 'hv.login.guest';
  const I_FB = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="12" fill="#1877F2"/><path fill="#fff" d="M13.5 8.5h1.7V6.1c-.4-.1-1.2-.2-2.1-.2-2.1 0-3.5 1.3-3.5 3.6V11H8v2.6h1.6V19h2.6v-5.4h2.1l.4-2.6h-2.5V9.8c0-.7.2-1.3 1.3-1.3z"/></svg>';
  const I_APPLE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#111" d="M16.7 12.3c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.2-2.8.9-3.5.9s-1.8-.8-3-.8c-1.5 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.3 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7 2-.1 2.9-2.2c1-.1.8-2.2 2.2-3.3-.1 0-2.1-.8-2.1-3.2zM14.8 5.6c.6-.8 1.1-1.8.9-2.9-0.9.1-2 .6-2.6 1.4-.6.7-1.1 1.8-.9 2.8 1 .1 2-.5 2.6-1.3z"/></svg>';
  const I_GG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#EA4335" d="M12 10.2v3.6h5.1c-.2 1.2-1.5 3.6-5.1 3.6-3.1 0-5.6-2.5-5.6-5.6S8.9 6.2 12 6.2c1.8 0 3 .7 3.7 1.4l2.5-2.4C16.7 3.7 14.6 2.8 12 2.8 6.9 2.8 2.8 6.9 2.8 12S6.9 21.2 12 21.2c5.5 0 9.1-3.8 9.1-9.2 0-.6-.1-1.1-.2-1.8H12z"/><path fill="#34A853" d="M3.9 7.4l3 2.2C7.7 7.3 9.7 6.2 12 6.2c1.8 0 3 .7 3.7 1.4l2.5-2.4C16.7 3.7 14.6 2.8 12 2.8 8.2 2.8 4.9 4.9 3.9 7.4z"/><path fill="#FBBC05" d="M12 21.2c2.5 0 4.6-.8 6.1-2.2l-2.8-2.2c-.8.5-1.8.9-3.3.9-3.5 0-4.9-2.4-5.1-3.6H3.8v2.3C5 19.3 8.2 21.2 12 21.2z"/><path fill="#4285F4" d="M21.1 12c0-.6-.1-1.1-.2-1.8H12v3.6h5.1c-.3 1.4-1.2 2.4-2.4 3.1l2.8 2.2c1.6-1.5 2.6-3.7 2.6-7.1z"/></svg>';
  const I_MAIL = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#8a5a22" d="M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2zm0 2 8 5 8-5H4z"/></svg>';
  const I_GUEST = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.2" fill="#8a5a22"/><path fill="#8a5a22" d="M5 19c.6-3.4 3.4-5.2 7-5.2s6.4 1.8 7 5.2"/></svg>';
  const TERMS_CHECK = '<label class="hv-login-check"><input type="checkbox" data-terms checked><span class="hv-login-agree">Tôi đồng ý với <button type="button" class="hv-login-link" data-legal="terms">Thỏa thuận người dùng</button> và <button type="button" class="hv-login-link" data-legal="privacy">Chính sách bảo mật</button></span></label>';

  function origin() {
    try { return location.origin; } catch { return ''; }
  }
  function hasSession() {
    return typeof NET === 'object' && !!(NET.token && NET.user);
  }
  function pinServer() {
    if (typeof NET !== 'object') return;
    NET.server = origin();
    if (typeof saveNet === 'function') saveNet();
  }
  function playLoginMusic() {
    if (typeof playBgm === 'function') playBgm('maincity');
    else if (window.__MG_BGM && typeof window.__MG_BGM.play === 'function') window.__MG_BGM.play('maincity');
  }
  function loadLast() {
    try { return JSON.parse(localStorage.getItem(LAST_KEY) || '{}'); } catch { return {}; }
  }
  function saveLast(user, guest) {
    localStorage.setItem(LAST_KEY, JSON.stringify({ user, guest: !!guest }));
  }
  function guestId() {
    let g = '';
    try { g = localStorage.getItem(GUEST_KEY) || ''; } catch {}
    if (!g) {
      g = String(Math.floor(1e11 + Math.random() * 9e11)) + '@tmp';
      try { localStorage.setItem(GUEST_KEY, g); } catch {}
    }
    return g;
  }
  function displayName() {
    if (typeof NET === 'object' && NET.user) return NET.user;
    const last = loadLast();
    return last.user || guestId();
  }

  const root = document.createElement('section');
  root.id = 'hvLoginRoot';
  root.setAttribute('aria-label', 'Đăng nhập Lục Thần');
  root.innerHTML = `
    <video class="hv-login-video" poster="assets/ui/auth/login-bg.jpg" muted loop playsinline webkit-playsinline>
      <source src="assets/ui/auth/login-bg.mp4" type="video/mp4">
    </video>
    <div class="hv-login-veil"></div>
    <p class="hv-login-age"><b>18+</b> Chơi quá 180 phút một ngày sẽ ảnh hưởng xấu đến sức khỏe</p>
    <div class="hv-login-stage">
      <div class="hv-login-frame">
        <div data-panel="welcome" id="hvLoginWelcome">
          <div class="hv-login-who">
            <span class="hv-login-avatar">${I_GUEST}</span>
            <div>
              <small>Mừng trở lại,</small>
              <b id="hvLoginWho">${displayName()}</b>
            </div>
            <button type="button" class="hv-login-textbtn" data-go="methods">Đổi tài khoản</button>
          </div>
          <p class="hv-login-hint">Liên kết tài khoản sẽ bảo vệ dữ liệu của bạn khỏi bị mất</p>
          <button type="button" class="hv-login-pill" data-oauth="facebook">${I_FB} Tiếp tục bằng Facebook</button>
          <button type="button" class="hv-login-pill" data-oauth="apple">${I_APPLE} Tiếp tục bằng Apple</button>
          <button type="button" class="hv-login-pill" data-oauth="google">${I_GG} Tiếp tục bằng Google</button>
          <button type="button" class="hv-login-cta" id="hvLoginContinue">Tiếp tục chơi game</button>
          ${TERMS_CHECK}
        </div>
        <div data-panel="methods" id="hvLoginMethods" hidden>
          <header class="hv-login-head"><b>Đăng nhập</b><button type="button" class="hv-login-x" data-go="welcome" aria-label="Đóng">×</button></header>
          <button type="button" class="hv-login-pill" data-oauth="facebook">${I_FB} Đăng nhập bằng Facebook</button>
          <button type="button" class="hv-login-pill" data-oauth="apple">${I_APPLE} Đăng nhập bằng Apple</button>
          <button type="button" class="hv-login-pill" data-oauth="google">${I_GG} Đăng nhập bằng Google</button>
          <p class="hv-login-or"><span>Hoặc</span></p>
          <div class="hv-login-split">
            <button type="button" class="hv-login-pill" data-go="email">${I_MAIL} Email</button>
            <button type="button" class="hv-login-pill" id="hvLoginGuest">${I_GUEST} Du khách</button>
          </div>
          ${TERMS_CHECK}
        </div>
        <form data-panel="email" id="hvLoginEmail" hidden autocomplete="on">
          <header class="hv-login-head"><b>Đăng nhập bằng email</b><button type="button" class="hv-login-x" data-go="methods" aria-label="Đóng">×</button></header>
          <input id="hvLoginUser" name="email" type="email" autocomplete="username" placeholder="Email">
          <div class="hv-login-passwrap">
            <input id="hvLoginPass" name="password" type="password" autocomplete="current-password" placeholder="Mật khẩu">
            <button type="button" class="hv-login-eye" data-eye="hvLoginPass" aria-label="Hiện mật khẩu">👁</button>
          </div>
          ${TERMS_CHECK}
          <button type="submit" class="hv-login-cta">Vào game</button>
          <div class="hv-login-foot">
            <button type="button" class="hv-login-textbtn" data-go="register">Đăng ký tài khoản mới</button>
            <button type="button" class="hv-login-textbtn" data-go="forgot">Quên mật khẩu?</button>
          </div>
        </form>
        <form data-panel="register" id="hvLoginReg" hidden autocomplete="on">
          <header class="hv-login-head"><b>Đăng ký tài khoản mới</b><button type="button" class="hv-login-x" data-go="email" aria-label="Đóng">×</button></header>
          <input id="hvLoginRegEmail" name="email" type="email" autocomplete="email" placeholder="Email">
          <div class="hv-login-passwrap">
            <input id="hvLoginRegPass" name="password" type="password" autocomplete="new-password" placeholder="Mật khẩu (tối thiểu 6 ký tự)">
            <button type="button" class="hv-login-eye" data-eye="hvLoginRegPass" aria-label="Hiện mật khẩu">👁</button>
          </div>
          ${TERMS_CHECK}
          <button type="submit" class="hv-login-cta">Tạo tài khoản</button>
          <p class="hv-login-hint">Tạo tài khoản xong thì dùng đúng email đó để đăng nhập.</p>
        </form>
        <div data-panel="forgot" hidden>
          <header class="hv-login-head"><b>Quên mật khẩu?</b><button type="button" class="hv-login-x" data-go="email" aria-label="Đóng">×</button></header>
          <p class="hv-login-hint">Nhập email đã đăng ký và mật khẩu mới (tối thiểu 6 ký tự), hoặc đăng nhập Google / Apple / Facebook.</p>
          <input id="hvLoginForgotEmail" type="email" placeholder="Email">
          <div class="hv-login-passwrap">
            <input id="hvLoginForgotPass" type="password" placeholder="Mật khẩu mới">
            <button type="button" class="hv-login-eye" data-eye="hvLoginForgotPass" aria-label="Hiện mật khẩu">👁</button>
          </div>
          <button type="button" class="hv-login-cta" id="hvLoginForgotGo">Đặt lại và vào game</button>
        </div>
        <form data-panel="google" hidden autocomplete="on">
          <header class="hv-login-head"><b>Đăng nhập bằng Google</b><button type="button" class="hv-login-x" data-go="methods" aria-label="Đóng">×</button></header>
          <input data-social-email type="email" autocomplete="username" placeholder="Gmail">
          <div class="hv-login-passwrap">
            <input data-social-pass type="password" autocomplete="current-password" placeholder="Mật khẩu">
            <button type="button" class="hv-login-eye" aria-label="Hiện mật khẩu">👁</button>
          </div>
          ${TERMS_CHECK}
          <button type="submit" class="hv-login-cta">Vào game</button>
        </form>
        <form data-panel="facebook" hidden autocomplete="on">
          <header class="hv-login-head"><b>Đăng nhập bằng Facebook</b><button type="button" class="hv-login-x" data-go="methods" aria-label="Đóng">×</button></header>
          <input data-social-email type="email" autocomplete="username" placeholder="Email Facebook">
          <div class="hv-login-passwrap">
            <input data-social-pass type="password" autocomplete="current-password" placeholder="Mật khẩu">
            <button type="button" class="hv-login-eye" aria-label="Hiện mật khẩu">👁</button>
          </div>
          ${TERMS_CHECK}
          <button type="submit" class="hv-login-cta">Vào game</button>
        </form>
        <form data-panel="apple" hidden autocomplete="on">
          <header class="hv-login-head"><b>Đăng nhập bằng Apple</b><button type="button" class="hv-login-x" data-go="methods" aria-label="Đóng">×</button></header>
          <input data-social-email type="email" autocomplete="username" placeholder="Email Apple">
          <div class="hv-login-passwrap">
            <input data-social-pass type="password" autocomplete="current-password" placeholder="Mật khẩu">
            <button type="button" class="hv-login-eye" aria-label="Hiện mật khẩu">👁</button>
          </div>
          ${TERMS_CHECK}
          <button type="submit" class="hv-login-cta">Vào game</button>
        </form>
        <p class="hv-login-err" id="hvLoginErr" hidden></p>
      </div>
    </div>
    <section class="hv-login-legal" id="hvLoginLegal" hidden>
      <header><span id="hvLoginLegalTitle">Thỏa thuận người dùng</span><button type="button" class="hv-login-x" data-legal-close aria-label="Đóng">×</button></header>
      <article class="hv-login-legal-body" id="hvLoginLegalBody"></article>
    </section>`;
  document.body.append(root);

  const video = root.querySelector('video');
  const errEl = root.querySelector('#hvLoginErr');
  const legalBox = root.querySelector('#hvLoginLegal');
  const legalBody = root.querySelector('#hvLoginLegalBody');
  const legalTitle = root.querySelector('#hvLoginLegalTitle');
  let pending = '';
  let providers = { google: false, facebook: false, apple: false };
  let clients = { google: '', facebook: '', apple: '' };
  let entered = false;
  const legalCache = { terms: '', privacy: '' };

  function loadSdk(src, id) {
    return new Promise((resolve, reject) => {
      if (id && document.getElementById(id)) return resolve();
      if ([...document.scripts].some(s => s.src === src)) return resolve();
      const s = document.createElement('script');
      if (id) s.id = id;
      s.src = src;
      s.async = true;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }
  function preloadOauthSdk() {
    if (clients.google) loadSdk('https://accounts.google.com/gsi/client', 'hvGsi').catch(() => {});
    if (clients.facebook) {
      window.fbAsyncInit = function () {
        if (window.FB) window.FB.init({ appId: clients.facebook, cookie: true, xfbml: false, version: 'v21.0' });
      };
      loadSdk('https://connect.facebook.net/vi_VN/sdk.js', 'hvFbSdk').catch(() => {});
    }
    if (clients.apple) loadSdk('https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js', 'hvAppleSdk').catch(() => {});
  }
  function stripLegal(html) {
    return String(html || '')
      .replace(/<!doctype[^>]*>/i, '')
      .replace(/<meta[^>]*>/gi, '')
      .replace(/<title>[\s\S]*?<\/title>/i, '')
      .replace(/<style>[\s\S]*?<\/style>/i, '');
  }
  async function openLegal(kind) {
    const privacy = kind === 'privacy';
    if (legalTitle) legalTitle.textContent = privacy ? 'Chính sách bảo mật' : 'Thỏa thuận người dùng';
    if (legalBox) legalBox.hidden = false;
    const key = privacy ? 'privacy' : 'terms';
    const src = privacy ? 'assets/legal/chinh-sach.html' : 'assets/legal/thoa-thuan.html';
    if (legalCache[key]) {
      if (legalBody) legalBody.innerHTML = legalCache[key];
      return;
    }
    if (legalBody) legalBody.innerHTML = '<p>Đang tải điều khoản…</p>';
    try {
      const t = stripLegal(await fetch(src).then(r => r.text()));
      legalCache[key] = t;
      if (legalBody) legalBody.innerHTML = t;
    } catch {
      if (legalBody) legalBody.innerHTML = '<p>Không tải được bản điều khoản. Thử lại.</p>';
    }
  }

  function setErr(msg) {
    errEl.hidden = !msg;
    errEl.textContent = msg || '';
  }
  function showPanel(name) {
    root.querySelectorAll('[data-panel]').forEach(el => { el.hidden = el.dataset.panel !== name; });
    setErr('');
  }
  function termsOk() {
    const panel = [...root.querySelectorAll('[data-panel]')].find(el => !el.hidden);
    const box = panel && panel.querySelector('[data-terms]');
    if (!box) return true;
    return !!box.checked;
  }
  function showLogin() {
    entered = false;
    root.hidden = false;
    root.classList.add('is-open');
    document.body.classList.add('login-gate-open');
    const who = root.querySelector('#hvLoginWho');
    if (who) who.textContent = displayName();
    showPanel('welcome');
    try {
      video.muted = true;
      video.playsInline = true;
      const playing = video.play();
      if (playing && typeof playing.catch === 'function') playing.catch(() => {});
    } catch {}
    playLoginMusic();
  }
  function hideLogin() {
    entered = true;
    root.hidden = true;
    root.classList.remove('is-open');
    document.body.classList.remove('login-gate-open');
    try {
      video.pause();
    } catch {}
  }
  function canEnter() {
    return hasSession() || (typeof NET === 'object' && NET.guest && NET.user);
  }
  async function enterGame() {
    pinServer();
    if (typeof saveNet === 'function') saveNet();
    hideLogin();
    if (typeof refreshResbar === 'function') refreshResbar();
    playLoginMusic();
    if (typeof navTo === 'function') navTo('hub');
    if (hasSession()) {
      if (typeof netPushProfile === 'function') netPushProfile();
      if (typeof netUploadSave === 'function') netUploadSave(true);
    }
  }
  function enterGuest() {
    if (typeof NET !== 'object') return;
    const id = guestId();
    NET.user = id;
    NET.token = '';
    NET.guest = true;
    pinServer();
    saveLast(id, true);
    enterGame();
  }
  async function postAuth(path, payload) {
    const r = await fetch(origin() + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || 'Không đăng nhập được.');
    return j;
  }
  async function applyAuth(j, guest) {
    NET.token = j.token;
    NET.user = j.user;
    NET.guest = false;
    pinServer();
    saveLast(j.user, !!guest);
    if (typeof api === 'function') {
      try {
        const cloud = await api('/api/save');
        if (cloud && cloud.save && typeof migrateSave === 'function') {
          P = migrateSave(cloud.save);
          if (typeof persist === 'function') persist();
        }
      } catch {}
    }
    await enterGame();
  }
  async function emailAuth(email, pass) {
    pinServer();
    try {
      const j = await postAuth('/api/login', { email, user: email, pass });
      await applyAuth(j);
    } catch (e) {
      const msg = (e && e.message) || '';
      if (/Sai tài khoản|Không đăng nhập/.test(msg) || /401/.test(msg)) {
        await postAuth('/api/register', { email, user: email, pass });
        const j = await postAuth('/api/login', { email, user: email, pass });
        await applyAuth(j);
        return;
      }
      throw e;
    }
  }
  async function startOauth(kind) {
    if (!termsOk()) {
      setErr('Cần đồng ý Thỏa thuận người dùng và Chính sách bảo mật.');
      return;
    }
    if (kind === 'google' && (providers.google || clients.google)) {
      location.href = origin() + '/api/auth/oauth/google';
      return;
    }
    if (kind === 'facebook' && clients.facebook && window.FB && typeof window.FB.login === 'function') {
      window.FB.login(async function (response) {
        const token = response && response.authResponse && response.authResponse.accessToken;
        if (!token) return;
        try {
          const j = await postAuth('/api/auth/oauth/facebook/token', { accessToken: token });
          await applyAuth(j);
        } catch (e) { setErr((e && e.message) || 'Facebook từ chối.'); }
      }, { scope: 'public_profile,email' });
      return;
    }
    if (kind === 'apple' && clients.apple && window.AppleID && window.AppleID.auth) {
      try {
        window.AppleID.auth.init({
          clientId: clients.apple,
          scope: 'name email',
          redirectURI: origin() + '/api/auth/oauth/apple/callback',
          usePopup: true
        });
        const res = await window.AppleID.auth.signIn();
        const idToken = res && res.authorization && res.authorization.id_token;
        if (!idToken) throw new Error('Apple không trả mã.');
        const j = await postAuth('/api/auth/oauth/apple/token', { id_token: idToken });
        await applyAuth(j);
      } catch (e) { setErr((e && e.message) || 'Apple từ chối.'); }
      return;
    }
    if (providers[kind] || clients[kind]) {
      location.href = origin() + '/api/auth/oauth/' + kind;
      return;
    }
    showPanel(kind);
  }

  root.addEventListener('pointerdown', playLoginMusic);
  root.querySelectorAll('[data-go]').forEach(btn => {
    btn.addEventListener('click', () => showPanel(btn.getAttribute('data-go')));
  });
  root.querySelectorAll('[data-oauth]').forEach(btn => {
    btn.addEventListener('click', () => startOauth(btn.getAttribute('data-oauth')));
  });
  root.querySelectorAll('[data-legal]').forEach(btn => {
    btn.addEventListener('click', ev => {
      ev.preventDefault();
      ev.stopPropagation();
      openLegal(btn.getAttribute('data-legal'));
    });
  });
  root.querySelectorAll('[data-legal-close]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (legalBox) legalBox.hidden = true;
      if (legalBody) legalBody.innerHTML = '';
    });
  });
  root.querySelectorAll('[data-eye]').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = document.getElementById(btn.getAttribute('data-eye'));
      if (!input) return;
      input.type = input.type === 'password' ? 'text' : 'password';
    });
  });
  root.querySelectorAll('.hv-login-passwrap .hv-login-eye:not([data-eye])').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = btn.parentElement.querySelector('input');
      if (!input) return;
      input.type = input.type === 'password' ? 'text' : 'password';
    });
  });
  root.querySelector('#hvLoginContinue').addEventListener('click', () => {
    if (!termsOk()) { setErr('Cần đồng ý Thỏa thuận người dùng và Chính sách bảo mật.'); return; }
    if (hasSession()) enterGame();
    else enterGuest();
  });
  root.querySelector('#hvLoginGuest').addEventListener('click', () => {
    if (!termsOk()) { setErr('Cần đồng ý Thỏa thuận người dùng và Chính sách bảo mật.'); return; }
    enterGuest();
  });
  root.querySelector('#hvLoginEmail').addEventListener('submit', async ev => {
    ev.preventDefault();
    if (pending) return;
    if (!termsOk()) { setErr('Cần đồng ý Thỏa thuận người dùng và Chính sách bảo mật.'); return; }
    const email = ((document.getElementById('hvLoginUser') || {}).value || '').trim();
    const pass = (document.getElementById('hvLoginPass') || {}).value || '';
    pending = 'login';
    setErr('');
    try {
      pinServer();
      const j = await postAuth('/api/login', { email, user: email, pass });
      await applyAuth(j);
    } catch (e) {
      setErr((e && e.message) || 'Không kết nối được. Thử lại.');
    } finally { pending = ''; }
  });
  root.querySelector('#hvLoginReg').addEventListener('submit', async ev => {
    ev.preventDefault();
    if (pending) return;
    if (!termsOk()) { setErr('Cần đồng ý Thỏa thuận người dùng và Chính sách bảo mật.'); return; }
    const email = ((document.getElementById('hvLoginRegEmail') || {}).value || '').trim();
    const pass = (document.getElementById('hvLoginRegPass') || {}).value || '';
    pending = 'register';
    setErr('');
    try {
      pinServer();
      await postAuth('/api/register', { email, user: email, pass });
      setErr('Tạo tài khoản xong. Đang đăng nhập bằng tài khoản vừa tạo…');
      const j = await postAuth('/api/login', { email, user: email, pass });
      await applyAuth(j);
    } catch (e) {
      setErr((e && e.message) || 'Không kết nối được. Thử lại.');
    } finally { pending = ''; }
  });
  ['google', 'facebook', 'apple'].forEach(kind => {
    const form = root.querySelector('[data-panel="' + kind + '"]');
    if (!form) return;
    form.addEventListener('submit', async ev => {
      ev.preventDefault();
      if (pending) return;
      if (!termsOk()) { setErr('Cần đồng ý Thỏa thuận người dùng và Chính sách bảo mật.'); return; }
      const email = ((form.querySelector('[data-social-email]') || {}).value || '').trim();
      const pass = ((form.querySelector('[data-social-pass]') || {}).value || '');
      pending = kind;
      setErr('');
      try { await emailAuth(email, pass); }
      catch (e) { setErr((e && e.message) || 'Không kết nối được. Thử lại.'); }
      finally { pending = ''; }
    });
  });
  const forgotGo = root.querySelector('#hvLoginForgotGo');
  if (forgotGo) forgotGo.addEventListener('click', async () => {
    if (pending) return;
    const email = ((document.getElementById('hvLoginForgotEmail') || {}).value || '').trim();
    const pass = (document.getElementById('hvLoginForgotPass') || {}).value || '';
    pending = 'forgot';
    setErr('');
    try { await emailAuth(email, pass); }
    catch (e) { setErr((e && e.message) || 'Không đặt lại được. Đăng ký email mới hoặc dùng mạng xã hội.'); }
    finally { pending = ''; }
  });

  fetch(origin() + '/api/health').then(r => r.json()).then(j => {
    providers = Object.assign(providers, j && j.providers);
    clients = Object.assign(clients, j && j.clients);
    if (j && j.oauth) providers.google = true;
    preloadOauthSdk();
  }).catch(() => {});
  fetch('assets/legal/thoa-thuan.html').then(r => r.text()).then(t => { legalCache.terms = stripLegal(t); }).catch(() => {});
  fetch('assets/legal/chinh-sach.html').then(r => r.text()).then(t => { legalCache.privacy = stripLegal(t); }).catch(() => {});

  if (typeof navTo === 'function') {
    const baseNav = navTo;
    navTo = function navToWithLoginGate(name) {
      if (!entered && !canEnter()) {
        showLogin();
        return;
      }
      if (!entered) {
        showLogin();
        return;
      }
      return baseNav.apply(this, arguments);
    };
  }

  if (typeof netLogout === 'function') {
    const baseOut = netLogout;
    netLogout = function netLogoutWithGate() {
      baseOut.apply(this, arguments);
      if (typeof NET === 'object') { NET.guest = false; NET.token = ''; }
      showLogin();
    };
  }

  showLogin();
  let code = '';
  try { code = new URLSearchParams(location.search).get('net_code') || ''; } catch {}
  if (code) {
    const started = Date.now();
    const tick = setInterval(() => {
      if (hasSession()) {
        clearInterval(tick);
        enterGame();
      } else if (Date.now() - started > 8000) clearInterval(tick);
    }, 80);
  }
})();
