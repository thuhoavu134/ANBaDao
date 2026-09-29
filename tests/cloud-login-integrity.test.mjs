import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { existsSync, readFileSync } from 'node:fs';

async function browser(failRead = false) {
  const requests = [], values = new Map();
  let cloud = { gold: 900, heroes: {}, v: 1 }, version = 7;
  const noop = () => {};
  const storage = { getItem: key => values.get(key) || null, setItem: (key, value) => values.set(key, value) };
  const context = { NET: {}, P: { gold: 3, heroes: {}, v: 1 }, location: { origin: 'https://local.invalid', search: '?net_code=test', pathname: '/', hash: '' },
    document: { getElementById: () => null }, history: { replaceState: noop }, localStorage: storage, SAFE_LS: storage,
    URLSearchParams, URL, AbortController, setTimeout, clearTimeout, saveNet: noop, toast: noop, refreshResbar: noop,
    netPushProfile: noop, persist: noop, migrateSave: x => structuredClone(x), defaultPlayer: () => ({ gold: 0, heroes: {}, v: 1 }),
    netUploadSave: async () => { requests.push('PUT /api/save'); cloud = structuredClone(context.P); } };
  context.window = context;
  context.fetch = async (url, options = {}) => {
    const path = new URL(url).pathname, method = options.method || 'GET';
    requests.push(method + ' ' + path);
    let json;
    if (path.endsWith('/exchange')) json = { user: 'alice', token: 'test-token' };
    else if (path === '/api/save' && method === 'GET') {
      if (failRead) return { ok: false, status: 503, json: async () => ({ error: 'offline' }) };
      json = { save: structuredClone(cloud), version };
    } else if (path === '/api/save' && method === 'PUT') {
      const body = JSON.parse(options.body);
      assert.equal(body.expectedVersion, version);
      cloud = body.save; json = { ok: true, version: ++version };
    } else throw Error('unexpected endpoint');
    return { ok: true, status: 200, json: async () => json };
  };
  vm.createContext(context);
  const modulePath = 'src/domain/save/cloud-session.mjs';
  const prelude = existsSync(modulePath) ? readFileSync(modulePath, 'utf8').replace(/^export\s+/gm, '') : '';
  vm.runInContext(prelude + '\n' + readFileSync('src/ui/net-auth-runtime.js', 'utf8'), context);
  for (let i = 0; i < 5; i++) await new Promise(setImmediate);
  return { context, requests, cloud: () => cloud };
}

test('OAuth restores the account save before any upload, preserving existing progress', async () => {
  const b = await browser();
  assert.ok(b.requests.includes('GET /api/save'));
  assert.ok(b.requests.indexOf('GET /api/save') < b.requests.indexOf('PUT /api/save'));
  assert.equal(b.context.P.gold, 900);
  assert.equal(b.cloud().gold, 900);
});

test('failed cloud reads never upload guest progress or replace local state', async () => {
  const b = await browser(true);
  assert.equal(b.requests.filter(x => x.startsWith('PUT')).length, 0);
  assert.equal(b.cloud().gold, 900);
  assert.equal(b.context.P.gold, 3);
});
