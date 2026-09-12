import test from 'node:test';
import assert from 'node:assert/strict';
import { createMemoryStore } from '../src/server/store.mjs';
import { createApp } from '../src/server/app.mjs';

const SECRET = 'test-secret-hon-viet-auth-l74';
const NOW = 1_700_000_000_000;

function app(extra = {}) {
  return createApp({
    store: extra.store || createMemoryStore(),
    secret: SECRET,
    now: extra.now || (() => NOW),
    publicBase: 'https://luc-than.vercel.app',
    google: extra.google || { clientId: 'cid.apps.googleusercontent.com', clientSecret: 'csec' },
    facebook: extra.facebook || {},
    apple: extra.apple || {},
    fetchImpl: extra.fetchImpl
  });
}

async function json(appHandle, method, path, { body, token, query } = {}) {
  const headers = {};
  if (token) headers.authorization = 'Bearer ' + token;
  const res = await appHandle(method, path, { body, headers, query });
  return res;
}

test('L74-T2: register then login issues a token; duplicate user is rejected', async () => {
  const handle = app();
  const reg = await json(handle, 'POST', '/api/register', { body: { user: 'AnhHung', pass: 'matkhau1' } });
  assert.equal(reg.status, 200);
  assert.equal(reg.json.user, 'AnhHung');
  assert.equal(typeof reg.json.token, 'string');
  assert.ok(reg.json.token.split('.').length === 3);

  const dup = await json(handle, 'POST', '/api/register', { body: { user: 'AnhHung', pass: 'matkhau1' } });
  assert.equal(dup.status, 409);

  const bad = await json(handle, 'POST', '/api/login', { body: { user: 'AnhHung', pass: 'sai' } });
  assert.equal(bad.status, 401);

  const login = await json(handle, 'POST', '/api/login', { body: { user: 'AnhHung', pass: 'matkhau1' } });
  assert.equal(login.status, 200);
  assert.equal(login.json.user, 'AnhHung');
  assert.equal(typeof login.json.token, 'string');
});

test('L74-T2b: username and password are validated', async () => {
  const handle = app();
  const short = await json(handle, 'POST', '/api/register', { body: { user: 'ab', pass: 'matkhau1' } });
  assert.equal(short.status, 400);
  const weak = await json(handle, 'POST', '/api/register', { body: { user: 'hop_le', pass: '123' } });
  assert.equal(weak.status, 400);
  const weird = await json(handle, 'POST', '/api/register', { body: { user: 'có dấu', pass: 'matkhau1' } });
  assert.equal(weird.status, 400);
});

test('L74-T2c: email register then login', async () => {
  const handle = app();
  const reg = await json(handle, 'POST', '/api/register', { body: { email: 'lac.yen@gmail.com', pass: 'matkhau1' } });
  assert.equal(reg.status, 200);
  assert.match(reg.json.user, /^[A-Za-z0-9_]{3,16}$/);
  const login = await json(handle, 'POST', '/api/login', { body: { email: 'lac.yen@gmail.com', pass: 'matkhau1' } });
  assert.equal(login.status, 200);
  assert.equal(login.json.user, reg.json.user);
});

test('L74-T3: cloud save round-trips behind bearer token', async () => {
  const handle = app();
  const { json: auth } = await json(handle, 'POST', '/api/register', { body: { user: 'LuuMay', pass: 'matkhau1' } });
  const empty = await json(handle, 'GET', '/api/save', { token: auth.token });
  assert.equal(empty.status, 200);
  assert.equal(empty.json.save, null);

  const denied = await json(handle, 'PUT', '/api/save', { body: { save: { gold: 9 } } });
  assert.equal(denied.status, 401);

  const put = await json(handle, 'PUT', '/api/save', { token: auth.token, body: { save: { v: 1, gold: 42, heroes: {} } } });
  assert.equal(put.status, 200);
  const got = await json(handle, 'GET', '/api/save', { token: auth.token });
  assert.equal(got.json.save.gold, 42);
});

test('L74-T4: Google OAuth start redirects and callback exchanges to a token', async () => {
  const fetchImpl = async (url, opts) => {
    const href = String(url);
    if (href.includes('oauth2.googleapis.com/token')) {
      const body = String(opts?.body || '');
      assert.match(body, /code=ok-code/);
      return { ok: true, json: async () => ({ access_token: 'at', id_token: 'idt' }) };
    }
    if (href.includes('googleapis.com') && href.includes('userinfo')) {
      return { ok: true, json: async () => ({ email: 'lac.yen@gmail.com', sub: 'gid-1', name: 'Lạc Yên' }) };
    }
    throw new Error('unexpected fetch ' + href);
  };
  const handle = app({ fetchImpl });
  const start = await json(handle, 'GET', '/api/auth/oauth/google');
  assert.equal(start.status, 302);
  assert.match(start.redirect, /accounts\.google\.com/);
  const state = new URL(start.redirect).searchParams.get('state');
  assert.ok(state);

  const cb = await json(handle, 'GET', '/api/auth/oauth/google/callback', { query: { code: 'ok-code', state } });
  assert.equal(cb.status, 302);
  assert.match(cb.redirect, /net_code=/);

  const code = new URL(cb.redirect, 'https://luc-than.vercel.app').searchParams.get('net_code');
  const ex = await json(handle, 'POST', '/api/auth/oauth/exchange', { body: { code } });
  assert.equal(ex.status, 200);
  assert.equal(typeof ex.json.token, 'string');
  assert.match(ex.json.user, /^[A-Za-z0-9_]{3,16}$/);

  const me = await json(handle, 'GET', '/api/auth/me', { token: ex.json.token });
  assert.equal(me.status, 200);
  assert.equal(me.json.email, 'lac.yen@gmail.com');
});

test('L74-T4b: OAuth is disabled when Google env is missing', async () => {
  const handle = app({ google: { clientId: '', clientSecret: '' } });
  const health = await json(handle, 'GET', '/api/health');
  assert.equal(health.json.oauth, false);
  const start = await json(handle, 'GET', '/api/auth/oauth/google');
  assert.equal(start.status, 501);
});

test('L74-T4c: Facebook token login and public client ids on health', async () => {
  const fetchImpl = async (url) => {
    const href = String(url);
    if (href.includes('debug_token')) {
      return { ok: true, json: async () => ({ data: { is_valid: true, app_id: 'fb-app' } }) };
    }
    if (href.includes('graph.facebook.com/me')) {
      return { ok: true, json: async () => ({ id: '1001', name: 'Yen', email: 'yen.fb@example.com' }) };
    }
    throw new Error('unexpected fetch ' + href);
  };
  const handle = app({
    facebook: { appId: 'fb-app', appSecret: 'fb-sec' },
    fetchImpl
  });
  const health = await json(handle, 'GET', '/api/health');
  assert.equal(health.json.providers.facebook, true);
  assert.equal(health.json.clients.facebook, 'fb-app');
  const login = await json(handle, 'POST', '/api/auth/oauth/facebook/token', { body: { accessToken: 'user-token' } });
  assert.equal(login.status, 200);
  assert.equal(typeof login.json.token, 'string');
  const me = await json(handle, 'GET', '/api/auth/me', { token: login.json.token });
  assert.equal(me.json.email, 'yen.fb@example.com');
});

test('L74-T5: profile, rivals, chat, leaderboard, arena swap match live client', async () => {
  const handle = app();
  const a = (await json(handle, 'POST', '/api/register', { body: { user: 'DauSi_A', pass: 'matkhau1' } })).json;
  const b = (await json(handle, 'POST', '/api/register', { body: { user: 'DauSi_B', pass: 'matkhau1' } })).json;

  await json(handle, 'POST', '/api/profile', { token: a.token, body: { power: 900, towerBest: 3, chapter: 2, squad: [{ id: 'lac_yen', row: 'front' }] } });
  await json(handle, 'POST', '/api/profile', { token: b.token, body: { power: 400, towerBest: 1, chapter: 1, squad: [{ id: 'phong_tu', row: 'back' }] } });

  const rivals = await json(handle, 'GET', '/api/rivals', { token: a.token });
  assert.equal(rivals.status, 200);
  assert.ok(Array.isArray(rivals.json.rivals));
  assert.equal(rivals.json.rivals.some(r => r.user === 'DauSi_B'), true);
  assert.equal(typeof rivals.json.myRank, 'number');

  const fight = await json(handle, 'POST', '/api/arena/result', { token: a.token, body: { defender: 'DauSi_B', win: true } });
  assert.equal(fight.status, 200);
  assert.equal(typeof fight.json.rank, 'number');

  const chat = await json(handle, 'POST', '/api/chat', { token: a.token, body: { text: 'Chào bản' } });
  assert.equal(chat.status, 200);
  const feed = await json(handle, 'GET', '/api/chat', { token: a.token, query: { since: 0 } });
  assert.equal(feed.json.messages.some(m => m.text === 'Chào bản' && m.user === 'DauSi_A'), true);

  const board = await json(handle, 'GET', '/api/leaderboard', { token: a.token, query: { by: 'power' } });
  assert.equal(board.status, 200);
  assert.equal(board.json.top[0].user, 'DauSi_A');
});

test('L76A health reports store kind', async () => {
  const memory = await json(app(), 'GET', '/api/health');
  assert.equal(memory.json.store, 'memory');
  assert.equal(memory.json.persist, 'memory');
  const pg = createMemoryStore();
  pg.kind = 'postgres';
  const health = await json(app({ store: pg }), 'GET', '/api/health');
  assert.equal(health.json.store, 'postgres');
  assert.equal(health.json.persist, 'postgres');
});
