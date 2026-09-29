import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/server/app.mjs';
import { createMemoryStore, createStoreFromEnv } from '../src/server/store.mjs';
import { signToken } from '../src/server/crypto.mjs';

async function fixture() {
  const store = createMemoryStore();
  await store.createUser({ id: 'a', user: 'alice', provider: 'password' });
  await store.putProfile('a', { user: 'alice', power: 1, rank: 1000, friends: ['bob'], friendInbox: ['carol'] });
  const handle = createApp({ store, secret: 'local-test-secret' });
  const headers = { authorization: 'Bearer ' + signToken({ sub: 'a' }, 'local-test-secret') };
  return { store, call: (method, path, body) => handle(method, path, { body, headers }) };
}

test('cloud writes require the last server version and reject concurrent stale writes', async () => {
  const { call } = await fixture();
  const first = await call('GET', '/api/save');
  assert.equal(first.json.version, 0);
  const missing = await call('PUT', '/api/save', { save: { v: 1, gold: 10, heroes: {} } });
  assert.equal(missing.status, 428);
  const replies = await Promise.all([10, 20].map(gold => call('PUT', '/api/save', { expectedVersion: 0, save: { v: 1, gold, heroes: {} } })));
  assert.deepEqual(replies.map(r => r.status).sort(), [200, 409]);
  assert.equal((await call('GET', '/api/save')).json.version, 1);
  const before = await call('GET', '/api/save');
  assert.equal((await call('PUT', '/api/save', { expectedVersion: 0, save: { gold: 999999, revision: 999999 } })).status, 409);
  assert.deepEqual((await call('GET', '/api/save')).json, before.json);
});

test('profile synchronization preserves social fields and server-owned rank', async () => {
  const { call, store } = await fixture();
  assert.equal((await call('POST', '/api/profile', { power: 300, towerBest: 2, chapter: 1, squad: [], rank: 1, friends: [] })).status, 200);
  const saved = await store.getProfile('a');
  assert.equal(saved.power, 300);
  assert.equal(saved.rank, 1000);
  assert.deepEqual(saved.friends, ['bob']);
  assert.deepEqual(saved.friendInbox, ['carol']);
});

test('production cannot use a volatile fallback when the database is absent or unavailable', async () => {
  await assert.rejects(createStoreFromEnv({ VERCEL: '1' }), { code: 'STORE_UNAVAILABLE' });
  await assert.rejects(createStoreFromEnv({ VERCEL: '1', DATABASE_URL: 'postgres://local-test' }, { sql: async () => { throw Error('offline'); } }), { code: 'STORE_UNAVAILABLE' });
});

test('public ranking queries use bounded store methods instead of loading every profile', async () => {
  const { store } = await fixture();
  store.listProfiles = async () => { throw Error('unbounded profile scan'); };
  store.listLeaderboard = async (by, limit) => { assert.equal(by, 'power'); assert.equal(limit, 20); return [{ user: 'bob', power: 20 }]; };
  const handle = createApp({ store, secret: 'local-test-secret' });
  const result = await handle('GET', '/api/leaderboard', { headers: { authorization: 'Bearer ' + signToken({ sub: 'a' }, 'local-test-secret') } });
  assert.equal(result.status, 200);
  assert.equal(result.json.top[0].user, 'bob');
});

test('client-declared wins cannot change either player rank without a server verifier', async () => {
  const { store, call } = await fixture();
  await store.createUser({ id: 'b', user: 'bob', provider: 'password' });
  await store.putProfile('b', { user: 'bob', rank: 500 });
  const result = await call('POST', '/api/arena/result', { defender: 'bob', win: true });
  assert.equal(result.status, 503);
  assert.equal(result.json.code, 'ARENA_VERIFIER_UNAVAILABLE');
  assert.equal((await store.getProfile('a')).rank, 1000);
  assert.equal((await store.getProfile('b')).rank, 500);
});
