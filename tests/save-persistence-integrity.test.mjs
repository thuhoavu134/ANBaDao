import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createFileStore } from '../src/server/store.mjs';
import { handleNode } from '../src/server/http.mjs';

test('save versions survive a local store restart and migrate old unversioned saves', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'hv-save-version-'));
  try {
    const path = join(dir, 'store.json');
    writeFileSync(path, JSON.stringify({ users: [{ id: 'a', user: 'alice' }], saves: [['a', { gold: 900 }]] }));
    const first = createFileStore(path);
    assert.deepEqual(await first.getSaveRecord('a'), { save: { gold: 900 }, version: 0 });
    assert.equal(await first.putSaveIfVersion('a', { gold: 901 }, 0), 1);
    const reopened = createFileStore(path);
    assert.deepEqual(await reopened.getSaveRecord('a'), { save: { gold: 901 }, version: 1 });
    assert.equal(await reopened.putSaveIfVersion('a', { gold: 3 }, 0), null);
    assert.equal((await createFileStore(path).getSaveRecord('a')).save.gold, 901);
    const concurrent = await Promise.all([902, 903].map(gold => reopened.putSaveIfVersion('a', { gold }, 1)));
    assert.deepEqual(concurrent, [2, null]);
    assert.deepEqual(await createFileStore(path).getSaveRecord('a'), { save: { gold: 902 }, version: 2 });
  } finally { rmSync(dir, { recursive: true }); }
});

test('HTTP initialization failure returns 503 and cannot acknowledge a save', async () => {
  const prior = { vercel: process.env.VERCEL, database: process.env.DATABASE_URL };
  const headers = {}; let body;
  const res = { setHeader: (name, value) => { headers[name] = value; }, end: value => { body = JSON.parse(value); } };
  try {
    process.env.VERCEL = '1'; delete process.env.DATABASE_URL;
    await handleNode({ method: 'PUT', url: '/api/save', headers: {}, body: { save: { gold: 3 } } }, res);
    assert.equal(res.statusCode, 503);
    assert.equal(body.code, 'STORE_UNAVAILABLE');
    assert.equal(headers['Cache-Control'], 'no-store');
    assert.equal(body.ok, undefined);
  } finally {
    if (prior.vercel === undefined) delete process.env.VERCEL; else process.env.VERCEL = prior.vercel;
    if (prior.database === undefined) delete process.env.DATABASE_URL; else process.env.DATABASE_URL = prior.database;
  }
});
