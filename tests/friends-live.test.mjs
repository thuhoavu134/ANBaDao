import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createMemoryStore } from '../src/server/store.mjs';
import { createApp } from '../src/server/app.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => readFileSync(join(root, rel), 'utf8');
const SECRET = 'test-secret-friends-l101';
const NOW = 1_700_000_000_000;

function app() {
  return createApp({
    store: createMemoryStore(),
    secret: SECRET,
    now: () => NOW,
    publicBase: 'https://example.test'
  });
}

async function json(handle, method, path, { body, token } = {}) {
  const headers = {};
  if (token) headers.authorization = 'Bearer ' + token;
  return handle(method, path, { body, headers });
}

test('L101: API bạn bè người thật, không NPC', async () => {
  const handle = app();
  const a = (await json(handle, 'POST', '/api/register', { body: { user: 'AnhA', pass: 'matkhau1' } })).json;
  const b = (await json(handle, 'POST', '/api/register', { body: { user: 'ChiB', pass: 'matkhau1' } })).json;
  await json(handle, 'POST', '/api/profile', { token: a.token, body: { power: 900 } });
  await json(handle, 'POST', '/api/profile', { token: b.token, body: { power: 400 } });
  const add = await json(handle, 'POST', '/api/friends', { token: a.token, body: { user: 'ChiB', action: 'add' } });
  assert.equal(add.status, 200);
  const inbox = await json(handle, 'GET', '/api/friends', { token: b.token });
  assert.equal(inbox.status, 200);
  assert.equal(inbox.json.inbox[0].user, 'AnhA');
  const acc = await json(handle, 'POST', '/api/friends', { token: b.token, body: { user: 'AnhA', action: 'accept' } });
  assert.equal(acc.status, 200);
  const listA = await json(handle, 'GET', '/api/friends', { token: a.token });
  assert.equal(listA.json.list[0].user, 'ChiB');
  const ui = read('src/ui/friends-hall-runtime.js');
  assert.match(ui, /\/api\/friends/);
  assert.doesNotMatch(ui, /FRIEND_SEEDS/);
  assert.doesNotMatch(ui, /document\.addEventListener\(['"](?:click|pointerdown|pointerup)/);
});

test('L102: lưới chức năng nền kem, jpg chỉ hero; không đụng login/hub', () => {
  const guild = read('src/ui/guild-hall.css');
  const daily = read('src/ui/daily-3d.css');
  const fest = read('src/ui/festival-3d.css');
  const arena = read('src/ui/arena-3d.css');
  const fr = read('src/ui/friends-hall.css');
  assert.match(guild, /#hvGuildRoot\{[^}]*background:#f3e4c4;/);
  assert.match(daily, /#hvDailyRoot\{[^}]*background:#f3e4c4/);
  assert.match(fest, /#hvFestivalRoot\{[^}]*background:#f3e4c4/);
  assert.match(arena, /#hvArenaRoot\{[^}]*background:#f3e4c4/);
  assert.match(fr, /#hvFriendsRoot\{[^}]*background:#f3e4c4;/);
  const login = read('src/ui/login-gate.css');
  assert.doesNotMatch(login, /#f3e4c4/);
});
