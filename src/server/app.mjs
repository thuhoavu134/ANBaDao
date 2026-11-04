import { hashPassword, randomId, signToken, usernameFromEmail, verifyPassword, verifyToken } from './crypto.mjs';
import { BROADCAST_COOLDOWN_MS, buildBroadcast, cleanGuildName } from '../domain/social/broadcast.mjs';
import { redeemGiftCode } from '../domain/profile/gift-codes.mjs';

const USER_RE = /^[A-Za-z0-9_]{3,16}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SAVE_LIMIT = 400 * 1024;

function fail(status, error) {
  return { status, json: { error } };
}

function ok(json, extra = {}) {
  return { status: 200, json, ...extra };
}

function bearer(headers = {}) {
  const raw = headers.authorization || headers.Authorization || '';
  const m = String(raw).match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : '';
}

function readQuery(path, query = {}) {
  try {
    const u = new URL(path, 'http://local');
    return { path: u.pathname, query: { ...Object.fromEntries(u.searchParams), ...query } };
  } catch {
    return { path, query };
  }
}

async function uniqueUsername(store, base) {
  let name = base;
  let n = 1;
  while (await store.findUserByName(name)) {
    n += 1;
    const suffix = String(n);
    name = (base.slice(0, 16 - suffix.length) + suffix).slice(0, 16);
  }
  return name;
}

export function createApp(deps) {
  const store = deps.store;
  const secret = deps.secret;
  const now = deps.now || Date.now;
  const publicBase = String(deps.publicBase || '').replace(/\/+$/, '');
  const google = deps.google || {};
  const facebook = deps.facebook || {};
  const apple = deps.apple || {};
  const fetchImpl = deps.fetchImpl || globalThis.fetch;
  const gifts = deps.gifts || {};
  const giftIndex = deps.giftIndex || { currencies: [], heroes: [], items: [], pets: [] };

  async function currentUser(ctx) {
    const token = bearer(ctx.headers);
    if (!token) return null;
    const payload = verifyToken(token, secret, now());
    if (!payload?.sub) return null;
    return store.findUserById(payload.sub);
  }

  async function nextRank() {
    return store.nextRank();
  }

  async function ensureProfile(user) {
    let profile = await store.getProfile(user.id);
    if (!profile) {
      profile = { user: user.user, power: 0, towerBest: 0, chapter: 0, squad: [], rank: await nextRank() };
      await store.putProfile(user.id, profile);
    }
    if (!profile.user) profile.user = user.user;
    return profile;
  }

  async function handle(method, rawPath, ctx = {}) {
    const m = String(method || 'GET').toUpperCase();
    const parsed = readQuery(rawPath, ctx.query);
    const path = parsed.path.replace(/\/+$/, '') || '/';
    const query = parsed.query;
    const body = ctx.body && typeof ctx.body === 'object' ? ctx.body : {};
    const origin = String(ctx.origin || publicBase || '').replace(/\/+$/, '');

    if (m === 'OPTIONS') return { status: 204, json: {} };

    if (m === 'GET' && path === '/api/health') {
      return ok({
        ok: true,
        auth: true,
        arenaRanked: false,
        persist: store.kind || 'memory',
        store: store.kind || 'memory',
        oauth: Boolean(google.clientId && google.clientSecret),
        providers: {
          google: Boolean(google.clientId && google.clientSecret),
          facebook: Boolean(facebook.appId && facebook.appSecret),
          apple: Boolean(apple.clientId)
        },
        clients: {
          google: google.clientId || '',
          facebook: facebook.appId || '',
          apple: apple.clientId || ''
        }
      });
    }

    if (m === 'POST' && (path === '/api/register' || path === '/api/auth/register')) {
      const pass = String(body.pass || '');
      if (pass.length < 6) return fail(400, 'Mật khẩu tối thiểu 6 ký tự.');
      const emailRaw = String(body.email || body.user || '').trim().toLowerCase();
      const userRaw = String(body.user || '').trim();
      const email = EMAIL_RE.test(emailRaw) ? emailRaw : '';
      let user = userRaw;
      if (email) {
        if (await store.findUserByEmail(email)) return fail(409, 'Email đã có tài khoản.');
        user = await uniqueUsername(store, usernameFromEmail(email));
      } else if (!USER_RE.test(user)) {
        return fail(400, 'Nhập email hoặc tên tài khoản 3–16 chữ/số/_.');
      }
      if (!email && await store.findUserByName(user)) return fail(409, 'Tên tài khoản đã có người dùng.');
      const row = {
        id: randomId(),
        user,
        passHash: await hashPassword(pass),
        email: email || null,
        provider: 'password',
        createdAt: now()
      };
      await store.createUser(row);
      await ensureProfile(row);
      return ok({ user: row.user, token: signToken({ sub: row.id, user: row.user }, secret, now()) });
    }

    if (m === 'POST' && (path === '/api/login' || path === '/api/auth/login')) {
      const ident = String(body.email || body.user || '').trim();
      const pass = String(body.pass || '');
      const row = EMAIL_RE.test(ident)
        ? await store.findUserByEmail(ident.toLowerCase())
        : await store.findUserByName(ident);
      if (!row) return fail(401, 'Sai tài khoản hoặc mật khẩu.');
      if (!row.passHash) return fail(401, 'Tài khoản này đăng nhập bằng ' + (row.provider || 'mạng xã hội') + '.');
      if (!(await verifyPassword(pass, row.passHash))) return fail(401, 'Sai tài khoản hoặc mật khẩu.');
      return ok({ user: row.user, token: signToken({ sub: row.id, user: row.user }, secret, now()) });
    }

    if (m === 'GET' && path === '/api/auth/me') {
      const user = await currentUser(ctx);
      if (!user) return fail(401, 'Chưa đăng nhập.');
      return ok({ user: user.user, email: user.email || null, provider: user.provider });
    }

    if (m === 'GET' && path === '/api/auth/oauth/google') {
      if (!google.clientId || !google.clientSecret) return fail(501, 'Chưa gắn Google Client ID trên Vercel.');
      const state = randomId();
      await store.putOauthState(state, { createdAt: now() });
      const redirectUri = origin + '/api/auth/oauth/google/callback';
      const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      url.searchParams.set('client_id', google.clientId);
      url.searchParams.set('redirect_uri', redirectUri);
      url.searchParams.set('response_type', 'code');
      url.searchParams.set('scope', 'openid email profile');
      url.searchParams.set('state', state);
      url.searchParams.set('prompt', 'select_account');
      return { status: 302, redirect: url.toString(), json: { ok: true } };
    }

    if (m === 'GET' && path === '/api/auth/oauth/google/callback') {
      if (!google.clientId || !google.clientSecret) return fail(501, 'Chưa gắn Google Client ID trên Vercel.');
      const state = String(query.state || '');
      const code = String(query.code || '');
      const st = await store.takeOauthState(state);
      if (!st || !code) return fail(400, 'Phiên Google hết hạn. Thử lại.');
      const redirectUri = origin + '/api/auth/oauth/google/callback';
      const tokenRes = await fetchImpl('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: google.clientId,
          client_secret: google.clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code'
        }).toString()
      });
      if (!tokenRes.ok) return fail(401, 'Google từ chối mã đăng nhập.');
      const tokenJson = await tokenRes.json();
      const infoRes = await fetchImpl('https://openidconnect.googleapis.com/v1/userinfo', {
        headers: { Authorization: 'Bearer ' + tokenJson.access_token }
      });
      if (!infoRes.ok) return fail(401, 'Không đọc được email Google.');
      const info = await infoRes.json();
      const email = String(info.email || '').trim().toLowerCase();
      if (!email) return fail(401, 'Tài khoản Google không có email.');
      let user = await store.findUserByEmail(email);
      if (!user) {
        const name = await uniqueUsername(store, usernameFromEmail(email));
        user = {
          id: randomId(),
          user: name,
          passHash: null,
          email,
          provider: 'google',
          createdAt: now()
        };
        await store.createUser(user);
        await ensureProfile(user);
      }
      const netCode = randomId(18);
      await store.putOauthCode(netCode, { userId: user.id, createdAt: now() });
      return { status: 302, redirect: origin + '/?net_code=' + encodeURIComponent(netCode), json: { ok: true } };
    }

    async function finishOauthUser(email, provider) {
      const net = await issueOauthUser(email, provider);
      return { status: 302, redirect: origin + '/?net_code=' + encodeURIComponent(net), json: { ok: true } };
    }

    async function finishOauthJson(email, provider) {
      const user = await upsertOauthUser(email, provider);
      return ok({ user: user.user, token: signToken({ sub: user.id, user: user.user }, secret, now()) });
    }

    async function upsertOauthUser(email, provider) {
      let user = await store.findUserByEmail(email);
      if (!user) {
        const name = await uniqueUsername(store, usernameFromEmail(email));
        user = {
          id: randomId(),
          user: name,
          passHash: null,
          email,
          provider,
          createdAt: now()
        };
        await store.createUser(user);
        await ensureProfile(user);
      }
      return user;
    }

    async function issueOauthUser(email, provider) {
      const user = await upsertOauthUser(email, provider);
      const netCode = randomId(18);
      await store.putOauthCode(netCode, { userId: user.id, createdAt: now() });
      return netCode;
    }

    function emailFromJwt(idToken) {
      try {
        const payload = JSON.parse(Buffer.from(String(idToken).split('.')[1], 'base64url').toString('utf8'));
        if (apple.clientId && payload.aud && payload.aud !== apple.clientId) return '';
        if (payload.iss && payload.iss !== 'https://appleid.apple.com') return '';
        return String(payload.email || '').trim().toLowerCase();
      } catch {
        return '';
      }
    }

    if (m === 'GET' && path === '/api/auth/oauth/facebook') {
      if (!facebook.appId || !facebook.appSecret) return fail(501, 'Chưa gắn Facebook App ID.');
      const state = randomId();
      await store.putOauthState(state, { createdAt: now(), provider: 'facebook' });
      const redirectUri = origin + '/api/auth/oauth/facebook/callback';
      const url = new URL('https://www.facebook.com/v21.0/dialog/oauth');
      url.searchParams.set('client_id', facebook.appId);
      url.searchParams.set('redirect_uri', redirectUri);
      url.searchParams.set('state', state);
      url.searchParams.set('scope', 'email,public_profile');
      url.searchParams.set('response_type', 'code');
      return { status: 302, redirect: url.toString(), json: { ok: true } };
    }

    if (m === 'GET' && path === '/api/auth/oauth/facebook/callback') {
      if (!facebook.appId || !facebook.appSecret) return fail(501, 'Chưa gắn Facebook App ID.');
      const state = String(query.state || '');
      const code = String(query.code || '');
      const st = await store.takeOauthState(state);
      if (!st || !code) return fail(400, 'Phiên Facebook hết hạn. Thử lại.');
      const redirectUri = origin + '/api/auth/oauth/facebook/callback';
      const tokenUrl = new URL('https://graph.facebook.com/v21.0/oauth/access_token');
      tokenUrl.searchParams.set('client_id', facebook.appId);
      tokenUrl.searchParams.set('client_secret', facebook.appSecret);
      tokenUrl.searchParams.set('redirect_uri', redirectUri);
      tokenUrl.searchParams.set('code', code);
      const tokenRes = await fetchImpl(tokenUrl.toString());
      if (!tokenRes.ok) return fail(401, 'Facebook từ chối mã đăng nhập.');
      const tokenJson = await tokenRes.json();
      const meUrl = new URL('https://graph.facebook.com/me');
      meUrl.searchParams.set('fields', 'id,name,email');
      meUrl.searchParams.set('access_token', tokenJson.access_token);
      const meRes = await fetchImpl(meUrl.toString());
      if (!meRes.ok) return fail(401, 'Không đọc được tài khoản Facebook.');
      const me = await meRes.json();
      const email = String(me.email || (me.id ? 'fb_' + me.id + '@facebook.local' : '')).trim().toLowerCase();
      if (!email) return fail(401, 'Tài khoản Facebook không có email.');
      return finishOauthUser(email, 'facebook');
    }

    if (m === 'GET' && path === '/api/auth/oauth/apple') {
      if (!apple.clientId) return fail(501, 'Chưa gắn Sign in with Apple.');
      const state = randomId();
      await store.putOauthState(state, { createdAt: now(), provider: 'apple' });
      const redirectUri = origin + '/api/auth/oauth/apple/callback';
      const url = new URL('https://appleid.apple.com/auth/authorize');
      url.searchParams.set('client_id', apple.clientId);
      url.searchParams.set('redirect_uri', redirectUri);
      url.searchParams.set('response_type', 'code id_token');
      url.searchParams.set('response_mode', 'form_post');
      url.searchParams.set('scope', 'name email');
      url.searchParams.set('state', state);
      return { status: 302, redirect: url.toString(), json: { ok: true } };
    }

    if ((m === 'POST' || m === 'GET') && path === '/api/auth/oauth/apple/callback') {
      if (!apple.clientId) return fail(501, 'Chưa gắn Sign in with Apple.');
      const state = String(body.state || query.state || '');
      const idToken = String(body.id_token || query.id_token || '');
      const st = await store.takeOauthState(state);
      if (!st) return fail(400, 'Phiên Apple hết hạn. Thử lại.');
      const email = emailFromJwt(idToken);
      if (!email) return fail(401, 'Tài khoản Apple không có email.');
      return finishOauthUser(email, 'apple');
    }

    if (m === 'POST' && path === '/api/auth/oauth/google/code') {
      if (!google.clientId || !google.clientSecret) return fail(501, 'Chưa gắn Google Client ID trên Vercel.');
      const code = String(body.code || '');
      if (!code) return fail(400, 'Thiếu mã Google.');
      const tokenRes = await fetchImpl('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: google.clientId,
          client_secret: google.clientSecret,
          redirect_uri: 'postmessage',
          grant_type: 'authorization_code'
        }).toString()
      });
      if (!tokenRes.ok) return fail(401, 'Google từ chối mã đăng nhập.');
      const tokenJson = await tokenRes.json();
      const infoRes = await fetchImpl('https://openidconnect.googleapis.com/v1/userinfo', {
        headers: { Authorization: 'Bearer ' + tokenJson.access_token }
      });
      if (!infoRes.ok) return fail(401, 'Không đọc được email Google.');
      const info = await infoRes.json();
      const email = String(info.email || '').trim().toLowerCase();
      if (!email) return fail(401, 'Tài khoản Google không có email.');
      return finishOauthJson(email, 'google');
    }

    if (m === 'POST' && path === '/api/auth/oauth/facebook/token') {
      if (!facebook.appId || !facebook.appSecret) return fail(501, 'Chưa gắn Facebook App ID.');
      const accessToken = String(body.accessToken || body.access_token || '');
      if (!accessToken) return fail(400, 'Thiếu mã Facebook.');
      const debugUrl = new URL('https://graph.facebook.com/debug_token');
      debugUrl.searchParams.set('input_token', accessToken);
      debugUrl.searchParams.set('access_token', facebook.appId + '|' + facebook.appSecret);
      const debugRes = await fetchImpl(debugUrl.toString());
      const debugJson = debugRes.ok ? await debugRes.json() : {};
      if (!debugJson?.data?.is_valid) return fail(401, 'Facebook từ chối mã đăng nhập.');
      const meUrl = new URL('https://graph.facebook.com/me');
      meUrl.searchParams.set('fields', 'id,name,email');
      meUrl.searchParams.set('access_token', accessToken);
      const meRes = await fetchImpl(meUrl.toString());
      if (!meRes.ok) return fail(401, 'Không đọc được tài khoản Facebook.');
      const me = await meRes.json();
      const email = String(me.email || (me.id ? 'fb_' + me.id + '@facebook.local' : '')).trim().toLowerCase();
      if (!email) return fail(401, 'Tài khoản Facebook không có email.');
      return finishOauthJson(email, 'facebook');
    }

    if (m === 'POST' && path === '/api/auth/oauth/apple/token') {
      if (!apple.clientId) return fail(501, 'Chưa gắn Sign in with Apple.');
      const idToken = String(body.id_token || body.idToken || '');
      const email = emailFromJwt(idToken);
      if (!email) return fail(401, 'Tài khoản Apple không có email.');
      return finishOauthJson(email, 'apple');
    }

    if (m === 'POST' && path === '/api/auth/oauth/exchange') {
      const code = String(body.code || query.code || '');
      const row = await store.takeOauthCode(code);
      if (!row || now() - row.createdAt > 60 * 1000) return fail(400, 'Mã đăng nhập hết hạn.');
      const user = await store.findUserById(row.userId);
      if (!user) return fail(400, 'Tài khoản không còn.');
      return ok({ user: user.user, token: signToken({ sub: user.id, user: user.user }, secret, now()) });
    }

    if (m === 'GET' && path === '/api/gift') {
      return ok({ ok: true, rewards: giftIndex });
    }

    if (m === 'POST' && path === '/api/gift') {
      const preview = redeemGiftCode({ codes: [], gold: 0, gems: 0 }, body.code || query.code, gifts);
      if (!preview.ok) return fail(400, preview.msg);
      return ok({
        ok: true,
        key: preview.key,
        label: preview.label,
        gold: preview.gold,
        gems: preview.gems,
        stam: preview.stam,
        tinh: preview.tinh || 0,
        hoat: preview.hoat || 0,
        so: preview.so || 0,
        essence: preview.essence || 0,
        shards: preview.shards || {},
        items: preview.items || {},
        pets: preview.pets || {}
      });
    }

    const user = await currentUser(ctx);

    if (m === 'GET' && path === '/api/save') {
      if (!user) return fail(401, 'Chưa đăng nhập.');
      return ok(await store.getSaveRecord(user.id));
    }

    if (m === 'PUT' && path === '/api/save') {
      if (!user) return fail(401, 'Chưa đăng nhập.');
      const save = body.save;
      if (!save || typeof save !== 'object' || Array.isArray(save)) return fail(400, 'Bản lưu không hợp lệ.');
      if (!Number.isSafeInteger(body.expectedVersion) || body.expectedVersion < 0) {
        return { status: 428, json: { error: 'Hãy tải bản lưu tài khoản trước khi đồng bộ.', code: 'SAVE_VERSION_REQUIRED' } };
      }
      const size = Buffer.byteLength(JSON.stringify(save));
      if (size > SAVE_LIMIT) return fail(413, 'Bản lưu quá lớn.');
      const version = await store.putSaveIfVersion(user.id, save, body.expectedVersion);
      if (version === null) return { status: 409, json: { error: 'Tiến trình đã thay đổi trên thiết bị khác. Hãy tải lại bản lưu trước khi đồng bộ.', code: 'SAVE_CONFLICT' } };
      return ok({ ok: true, version });
    }

    if (m === 'POST' && path === '/api/profile') {
      if (!user) return fail(401, 'Chưa đăng nhập.');
      await ensureProfile(user);
      await store.patchProfileStats(user.id, {
        power: Number(body.power) || 0,
        towerBest: Number(body.towerBest) || 0,
        chapter: Number(body.chapter) || 0,
        squad: Array.isArray(body.squad) ? body.squad : []
      });
      return ok({ ok: true });
    }

    if (m === 'GET' && path === '/api/rivals') {
      if (!user) return fail(401, 'Chưa đăng nhập.');
      const mine = await ensureProfile(user);
      const all = await store.listRivals(user.id, 8);
      const rivals = all
        .filter(p => p.userId !== user.id && p.user !== user.user)
        .slice(0, 8)
        .map(p => ({ user: p.user, rank: p.rank, power: p.power | 0, squad: p.squad || [] }));
      return ok({ myRank: mine.rank, rivals, ranked: false });
    }

    if (m === 'POST' && path === '/api/arena/result') {
      if (!user) return fail(401, 'Chưa đăng nhập.');
      // No authoritative combat runner exists on the server yet. A signed
      // match ticket would still not prove a client-declared victory. Fail
      // closed until shared combat replay + one atomic settlement are wired.
      return { status: 503, json: {
        code: 'ARENA_VERIFIER_UNAVAILABLE',
        error: 'Đấu hạng online đang bảo trì. Hạng và phần thưởng chưa thay đổi.'
      } };
    }

    // Owner 2026-11-04: kenh Thế Giới / Bang Hội / Gia Tộc / Hệ Thống + loa he thong + bang/gia toc tren server
    const chatScope = async (u, channel, peer) => {
      if (channel === 'world' || channel === 'sys') return { ok: true, scope: '' };
      if (channel === 'friend') {
        const other = String(peer || '').trim();
        if (!other) return { ok: false };
        const mine = await ensureProfile(u);
        const fr = Array.isArray(mine.friends) ? mine.friends : [];
        if (!fr.some(x => x.toLowerCase() === other.toLowerCase())) return { ok: false, code: 'NOT_FRIEND' };
        return { ok: true, scope: [u.user.toLowerCase(), other.toLowerCase()].sort().join('|') };
      }
      if (channel !== 'guild' && channel !== 'clan') return { ok: false };
      const mb = await store.getMembership(u.id);
      const id = channel === 'guild' ? mb.guild : mb.clan;
      return id ? { ok: true, scope: id } : { ok: false, code: 'NOT_MEMBER' };
    };

    if (m === 'GET' && path === '/api/chat') {
      if (!user) return fail(401, 'Chưa đăng nhập.');
      const channel = String(query.channel || 'world');
      const sc = await chatScope(user, channel, query.peer);
      if (!sc.ok) return fail(sc.code ? 403 : 400, sc.code === 'NOT_FRIEND' ? 'Chưa kết hảo hữu.' : sc.code === 'NOT_MEMBER' ? 'Chưa vào ' + (channel === 'guild' ? 'bang' : 'gia tộc') + '.' : 'Kênh không hợp lệ.');
      const messages = await store.listChatSince(query.since, { channel, scope: sc.scope });
      const last = messages.reduce((acc, x) => Math.max(acc, x.t || 0), Number(query.since) || 0);
      return ok({ messages, last, channel });
    }

    if (m === 'POST' && path === '/api/chat') {
      if (!user) return fail(401, 'Chưa đăng nhập.');
      const text = String(body.text || '').trim().slice(0, 160);
      if (!text) return fail(400, 'Trống.');
      const channel = String(body.channel || 'world');
      if (channel === 'sys') return fail(403, 'Kênh Hệ Thống chỉ để thông báo.');
      const sc = await chatScope(user, channel, body.peer);
      if (!sc.ok) return fail(sc.code ? 403 : 400, sc.code === 'NOT_FRIEND' ? 'Chưa kết hảo hữu.' : sc.code === 'NOT_MEMBER' ? 'Chưa vào ' + (channel === 'guild' ? 'bang' : 'gia tộc') + '.' : 'Kênh không hợp lệ.');
      await store.appendChat({ user: user.user, text, t: now(), channel, scope: sc.scope, kind: 'chat' });
      return ok({ ok: true });
    }

    if (m === 'POST' && path === '/api/broadcast') {
      if (!user) return fail(401, 'Chưa đăng nhập.');
      const last = await store.lastBroadcastAt(user.user);
      if (last && now() - last < BROADCAST_COOLDOWN_MS) return fail(429, 'Loa hệ thống đang hồi, thử lại sau.');
      const b = buildBroadcast(String(body.event || ''), body.data, user.user, now());
      if (!b.ok) return fail(400, 'Sự kiện không hợp lệ.');
      const t = now();
      const base = { user: '📢 Hệ Thống', text: b.text, t, kind: 'sys', by: user.user, meta: { event: b.event } };
      await store.appendChat({ ...base, channel: 'sys', scope: '' });
      await store.appendChat({ ...base, channel: 'world', scope: '' });
      const mb = await store.getMembership(user.id);
      if (mb.guild) await store.appendChat({ ...base, channel: 'guild', scope: mb.guild });
      if (mb.clan) await store.appendChat({ ...base, channel: 'clan', scope: mb.clan });
      return ok({ ok: true, text: b.text });
    }

    if (m === 'GET' && path === '/api/guild') {
      if (!user) return fail(401, 'Chưa đăng nhập.');
      const mb = await store.getMembership(user.id);
      const out = { guild: null, clan: null };
      for (const k of ['guild', 'clan']) {
        if (!mb[k]) continue;
        const g = await store.getGuild(mb[k]);
        if (g) out[k] = { ...g, members: await store.countMembers(g.id) };
      }
      const kind = query.kind === 'clan' ? 'clan' : 'guild';
      return ok({ ...out, list: await store.listGuilds(kind, 30) });
    }

    if (m === 'POST' && path === '/api/guild/create') {
      if (!user) return fail(401, 'Chưa đăng nhập.');
      const kind = body.kind === 'clan' ? 'clan' : 'guild';
      const name = cleanGuildName(body.name);
      if (!name) return fail(400, 'Tên cần 2–18 ký tự.');
      const mb = await store.getMembership(user.id);
      if (mb[kind]) return fail(409, kind === 'guild' ? 'Đại hiệp đã có bang.' : 'Đại hiệp đã có gia tộc.');
      if (await store.findGuildByName(name, kind)) return fail(409, 'Tên đã có người dùng.');
      const g = { id: kind[0] + '_' + now().toString(36) + Math.random().toString(36).slice(2, 6), name, kind, owner: user.user, createdAt: now() };
      await store.createGuild(g);
      await store.setMembership(user.id, { [kind]: g.id });
      return ok({ ok: true, [kind]: { ...g, members: 1 } });
    }

    if (m === 'POST' && path === '/api/guild/join') {
      if (!user) return fail(401, 'Chưa đăng nhập.');
      const g = await store.getGuild(String(body.id || ''));
      if (!g) return fail(404, 'Không tìm thấy.');
      const mb = await store.getMembership(user.id);
      if (mb[g.kind]) return fail(409, g.kind === 'guild' ? 'Đại hiệp đã có bang.' : 'Đại hiệp đã có gia tộc.');
      if (await store.countMembers(g.id) >= (g.kind === 'guild' ? 50 : 20)) return fail(409, 'Đã đủ người.');
      await store.setMembership(user.id, { [g.kind]: g.id });
      return ok({ ok: true, [g.kind]: { ...g, members: await store.countMembers(g.id) } });
    }

    if (m === 'POST' && path === '/api/guild/leave') {
      if (!user) return fail(401, 'Chưa đăng nhập.');
      const kind = body.kind === 'clan' ? 'clan' : 'guild';
      await store.setMembership(user.id, { [kind]: '' });
      return ok({ ok: true });
    }

    if (m === 'GET' && path === '/api/friends') {
      if (!user) return fail(401, 'Chưa đăng nhập.');
      const mine = await ensureProfile(user);
      const names = Array.isArray(mine.friends) ? mine.friends : [];
      const inboxNames = Array.isArray(mine.friendInbox) ? mine.friendInbox : [];
      const all = await store.getProfilesByNames([...new Set([...names, ...inboxNames])]);
      const pick = name => {
        const p = all.find(x => x.user === name);
        return p ? { user: p.user, power: p.power | 0, rank: p.rank, chapter: p.chapter | 0 } : { user: name, power: 0, rank: 0, chapter: 0 };
      };
      const list = names.map(pick);
      const inbox = inboxNames.map(pick);
      const suggestions = await store.listFriendSuggestions(user.id, names, 12);
      const suggest = suggestions
        .filter(p => p.user !== user.user && !names.includes(p.user))
        .sort((a, b) => (b.power || 0) - (a.power || 0))
        .slice(0, 12)
        .map(p => ({ user: p.user, power: p.power | 0, rank: p.rank, chapter: p.chapter | 0 }));
      return ok({ list, inbox, suggest, cap: 100, me: user.user });
    }

    if (m === 'POST' && path === '/api/friends') {
      if (!user) return fail(401, 'Chưa đăng nhập.');
      const targetName = String(body.user || '').trim();
      const action = String(body.action || 'add');
      if (!targetName) return fail(400, 'Thiếu tên người chơi.');
      const target = await store.findUserByName(targetName);
      if (!target) return fail(404, 'Không tìm thấy người chơi.');
      if (target.id === user.id) return fail(400, 'Không kết bạn với chính mình.');
      const mine = await ensureProfile(user);
      const theirs = await ensureProfile(target);
      mine.friends = Array.isArray(mine.friends) ? mine.friends : [];
      mine.friendInbox = Array.isArray(mine.friendInbox) ? mine.friendInbox : [];
      theirs.friends = Array.isArray(theirs.friends) ? theirs.friends : [];
      theirs.friendInbox = Array.isArray(theirs.friendInbox) ? theirs.friendInbox : [];
      if (action === 'add') {
        if (mine.friends.includes(target.user)) return ok({ ok: true, already: true });
        if (mine.friendInbox.includes(target.user)) {
          mine.friendInbox = mine.friendInbox.filter(x => x !== target.user);
          if (!mine.friends.includes(target.user)) mine.friends.push(target.user);
          if (!theirs.friends.includes(user.user)) theirs.friends.push(user.user);
          theirs.friendInbox = theirs.friendInbox.filter(x => x !== user.user);
        } else if (!theirs.friendInbox.includes(user.user) && !theirs.friends.includes(user.user)) {
          theirs.friendInbox.push(user.user);
        }
        await store.putProfile(user.id, mine);
        await store.putProfile(target.id, theirs);
        return ok({ ok: true });
      }
      if (action === 'accept') {
        mine.friendInbox = mine.friendInbox.filter(x => x !== target.user);
        if (!mine.friends.includes(target.user)) mine.friends.push(target.user);
        if (!theirs.friends.includes(user.user)) theirs.friends.push(user.user);
        theirs.friendInbox = theirs.friendInbox.filter(x => x !== user.user);
        await store.putProfile(user.id, mine);
        await store.putProfile(target.id, theirs);
        return ok({ ok: true });
      }
      if (action === 'remove') {
        mine.friends = mine.friends.filter(x => x !== target.user);
        mine.friendInbox = mine.friendInbox.filter(x => x !== target.user);
        theirs.friends = theirs.friends.filter(x => x !== user.user);
        theirs.friendInbox = theirs.friendInbox.filter(x => x !== user.user);
        await store.putProfile(user.id, mine);
        await store.putProfile(target.id, theirs);
        return ok({ ok: true });
      }
      return fail(400, 'Thao tác lạ.');
    }

    if (m === 'GET' && path === '/api/leaderboard') {
      if (!user) return fail(401, 'Chưa đăng nhập.');
      const by = String(query.by || 'power');
      const all = await store.listLeaderboard(by, 20);
      const sorted = [...all].sort((a, b) => {
        if (by === 'arena') return (a.rank || 9999) - (b.rank || 9999);
        if (by === 'tower') return (b.towerBest || 0) - (a.towerBest || 0);
        return (b.power || 0) - (a.power || 0);
      });
      return ok({
        top: sorted.slice(0, 20).map(p => ({
          user: p.user,
          rank: p.rank,
          towerBest: p.towerBest || 0,
          power: p.power || 0
        }))
      });
    }

    return fail(404, 'Không có API này.');
  }

  return handle;
}
