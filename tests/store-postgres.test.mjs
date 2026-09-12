import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStoreFromEnv, createPostgresStore } from '../src/server/store.mjs';

function mockSql() {
  const users = [];
  const saves = new Map();
  const profiles = new Map();
  const chat = [];
  const oauthState = new Map();
  const oauthCodes = new Map();
  const sql = async (strings, ...values) => {
    const q = strings.join('?').replace(/\s+/g, ' ');
    if (/CREATE TABLE|ALTER TABLE/.test(q)) return [];
    if (/INSERT INTO hv_users/.test(q)) {
      users.push({
        id: values[0], username: values[1], pass_hash: values[2],
        email: values[3], provider: values[4], created_at: values[5]
      });
      return [];
    }
    if (/FROM hv_users WHERE lower\(username\)/.test(q)) {
      return users.filter(u => u.username.toLowerCase() === String(values[0]).toLowerCase()).slice(0, 1);
    }
    if (/FROM hv_users WHERE id =/.test(q)) return users.filter(u => u.id === values[0]).slice(0, 1);
    if (/FROM hv_users WHERE lower\(email\)/.test(q)) {
      return users.filter(u => (u.email || '').toLowerCase() === String(values[0]).toLowerCase()).slice(0, 1);
    }
    if (/INSERT INTO hv_saves/.test(q)) {
      saves.set(values[0], typeof values[1] === 'string' ? JSON.parse(values[1]) : values[1]);
      return [];
    }
    if (/SELECT save FROM hv_saves/.test(q)) {
      return saves.has(values[0]) ? [{ save: saves.get(values[0]) }] : [];
    }
    if (/INSERT INTO hv_profiles/.test(q)) {
      profiles.set(values[0], {
        user_id: values[0], power: values[1], tower_best: values[2],
        chapter: values[3], squad: typeof values[4] === 'string' ? JSON.parse(values[4]) : values[4],
        rank: values[5]
      });
      return [];
    }
    if (/FROM hv_profiles p JOIN hv_users/.test(q) && /WHERE p.user_id/.test(q)) {
      const p = profiles.get(values[0]);
      const u = users.find(row => row.id === values[0]);
      return p && u ? [{ ...p, username: u.username }] : [];
    }
    if (/INSERT INTO hv_oauth_state/.test(q)) {
      oauthState.set(values[0], {
        created_at: values[1],
        payload: typeof values[2] === 'string' ? JSON.parse(values[2]) : values[2]
      });
      return [];
    }
    if (/SELECT \* FROM hv_oauth_state/.test(q)) {
      const row = oauthState.get(values[0]);
      return row ? [{ created_at: row.created_at, payload: row.payload }] : [];
    }
    if (/DELETE FROM hv_oauth_state/.test(q)) { oauthState.delete(values[0]); return []; }
    if (/INSERT INTO hv_oauth_codes/.test(q)) {
      oauthCodes.set(values[0], { user_id: values[1], created_at: values[2] });
      return [];
    }
    if (/SELECT \* FROM hv_oauth_codes/.test(q)) {
      const row = oauthCodes.get(values[0]);
      return row ? [{ user_id: row.user_id, created_at: row.created_at }] : [];
    }
    if (/DELETE FROM hv_oauth_codes/.test(q)) { oauthCodes.delete(values[0]); return []; }
    if (/INSERT INTO hv_chat/.test(q)) { chat.push({ username: values[0], text: values[1], t: values[2] }); return []; }
    return [];
  };
  return sql;
}

test('L76A-T1: createStoreFromEnv with DATABASE_URL uses postgres', async () => {
  const store = await createStoreFromEnv({ DATABASE_URL: 'postgres://luc-than/mock' }, { sql: mockSql() });
  assert.equal(store.kind, 'postgres');
});

test('L76A-T2: no DATABASE_URL + VERCEL=1 is memory; local is file', async () => {
  const mem = await createStoreFromEnv({ VERCEL: '1' });
  assert.equal(mem.kind, 'memory');
  const dir = mkdtempSync(join(tmpdir(), 'l76-'));
  const path = join(dir, 'store.json');
  const file = await createStoreFromEnv({ HONVIET_STORE_PATH: path });
  assert.equal(file.kind, 'file');
  rmSync(dir, { recursive: true, force: true });
});

test('L76A-T3: createUser + findUserByName roundtrip', async () => {
  const store = await createPostgresStore('postgres://luc-than/mock', mockSql());
  await store.createUser({
    id: 'u1', user: 'AnhHung', passHash: 'hash', email: 'a@b.c', provider: 'password', createdAt: 9
  });
  const found = await store.findUserByName('anhhung');
  assert.equal(found.id, 'u1');
  assert.equal(found.user, 'AnhHung');
  assert.equal(found.email, 'a@b.c');
});

test('L76A-T4: putSave / getSave JSONB keeps nested fields', async () => {
  const store = await createPostgresStore('postgres://luc-than/mock', mockSql());
  const save = { v: 2, gold: 44, heroes: { ong_hang_pho: { level: 7 } }, nested: { a: [1, { b: true }] } };
  await store.putSave('u1', save);
  assert.deepEqual(await store.getSave('u1'), save);
});
