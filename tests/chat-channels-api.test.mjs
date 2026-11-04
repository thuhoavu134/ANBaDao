import test from 'node:test';
import assert from 'node:assert/strict';
import { createMemoryStore } from '../src/server/store.mjs';
import { createApp } from '../src/server/app.mjs';
import { buildBroadcast, BROADCAST_COOLDOWN_MS } from '../src/domain/social/broadcast.mjs';

let clock = 1_800_000_000_000;
function setup() {
  const store = createMemoryStore();
  const handle = createApp({ store, secret: 'chat-ch-secret', now: () => clock });
  return { store, handle };
}
async function call(handle, method, path, { body, token, query } = {}) {
  const headers = {};
  if (token) headers.authorization = 'Bearer ' + token;
  return handle(method, path, { body, headers, query });
}
async function reg(handle, user) {
  const r = await call(handle, 'POST', '/api/register', { body: { user, pass: 'matkhau1' } });
  assert.equal(r.status, 200, JSON.stringify(r.json));
  return r.json.token;
}

test('CH-T1: world chat still works; old rows default to world', async () => {
  const { handle } = setup();
  const a = await reg(handle, 'DaiHiep');
  clock += 1000;
  assert.equal((await call(handle, 'POST', '/api/chat', { token: a, body: { text: 'xin chao' } })).status, 200);
  const g = await call(handle, 'GET', '/api/chat', { token: a, query: { since: 0 } });
  assert.equal(g.status, 200);
  assert.equal(g.json.messages.length, 1);
  assert.equal(g.json.messages[0].channel, 'world');
});

test('CH-T2: guild/clan channels need membership and stay private', async () => {
  const { handle } = setup();
  const a = await reg(handle, 'BangChu');
  const b = await reg(handle, 'NguoiLa');
  assert.equal((await call(handle, 'POST', '/api/chat', { token: a, body: { text: 'x', channel: 'guild' } })).status, 403);
  const made = await call(handle, 'POST', '/api/guild/create', { token: a, body: { name: 'Thiên Long', kind: 'guild' } });
  assert.equal(made.status, 200);
  const gid = made.json.guild.id;
  assert.equal((await call(handle, 'POST', '/api/guild/create', { token: b, body: { name: 'thiên long', kind: 'guild' } })).status, 409);
  clock += 1000;
  assert.equal((await call(handle, 'POST', '/api/chat', { token: a, body: { text: 'hop bang', channel: 'guild' } })).status, 200);
  assert.equal((await call(handle, 'GET', '/api/chat', { token: b, query: { channel: 'guild' } })).status, 403);
  assert.equal((await call(handle, 'POST', '/api/guild/join', { token: b, body: { id: gid } })).status, 200);
  const seen = await call(handle, 'GET', '/api/chat', { token: b, query: { channel: 'guild', since: 0 } });
  assert.equal(seen.json.messages.map(m => m.text).join(), 'hop bang');
  const world = await call(handle, 'GET', '/api/chat', { token: b, query: { since: 0 } });
  assert.equal(world.json.messages.length, 0);
  const me = await call(handle, 'GET', '/api/guild', { token: b });
  assert.equal(me.json.guild.members, 2);
  const clan = await call(handle, 'POST', '/api/guild/create', { token: b, body: { name: 'Họ Lý', kind: 'clan' } });
  assert.equal(clan.status, 200);
  assert.equal((await call(handle, 'POST', '/api/guild/leave', { token: b, body: { kind: 'guild' } })).status, 200);
  assert.equal((await call(handle, 'GET', '/api/chat', { token: b, query: { channel: 'guild' } })).status, 403);
  assert.equal((await call(handle, 'GET', '/api/chat', { token: b, query: { channel: 'clan' } })).status, 200);
});

test('CH-T3: broadcast is server-composed, whitelisted, rate limited, fans out', async () => {
  const { handle } = setup();
  const a = await reg(handle, 'MayMan');
  await call(handle, 'POST', '/api/guild/create', { token: a, body: { name: 'Bang Gió', kind: 'guild' } });
  clock += 5000;
  assert.equal((await call(handle, 'POST', '/api/broadcast', { token: a, body: { event: 'free_text', data: { text: 'hack' } } })).status, 400);
  assert.equal((await call(handle, 'POST', '/api/broadcast', { token: a, body: { event: 'enhance', data: { item: 'Kiếm', level: 3 } } })).status, 400);
  const ok = await call(handle, 'POST', '/api/broadcast', { token: a, body: { event: 'ssr', data: { heroes: ['Tịnh Mặc', 'Lăng Vân<script>'] } } });
  assert.equal(ok.status, 200);
  assert.match(ok.json.text, /Song long xuất thế!/);
  assert.doesNotMatch(ok.json.text, /<script>/);
  clock += 1000;
  assert.equal((await call(handle, 'POST', '/api/broadcast', { token: a, body: { event: 'bbr_jackpot', data: { prize: '1000 Ngọc' } } })).status, 429);
  for (const channel of ['sys', 'world', 'guild']) {
    const r = await call(handle, 'GET', '/api/chat', { token: a, query: { channel, since: 0 } });
    assert.equal(r.json.messages.filter(m => m.kind === 'sys').length, 1, channel);
  }
  assert.equal((await call(handle, 'POST', '/api/chat', { token: a, body: { text: 'x', channel: 'sys' } })).status, 403);
  clock += BROADCAST_COOLDOWN_MS;
  assert.equal((await call(handle, 'POST', '/api/broadcast', { token: a, body: { event: 'bbr_jackpot', data: { prize: '1000 Ngọc' } } })).status, 200);
});

test('CH-T5: Hảo Hữu = private thread, only between friends', async () => {
  const { handle } = setup();
  const a = await reg(handle, 'HuynhDe');
  const b = await reg(handle, 'TyMuoi');
  const c = await reg(handle, 'NguoiNgoai');
  assert.equal((await call(handle, 'POST', '/api/chat', { token: a, body: { text: 'x', channel: 'friend', peer: 'TyMuoi' } })).status, 403);
  await call(handle, 'POST', '/api/friends', { token: a, body: { user: 'TyMuoi', action: 'add' } });
  await call(handle, 'POST', '/api/friends', { token: b, body: { user: 'HuynhDe', action: 'accept' } });
  clock += 1000;
  assert.equal((await call(handle, 'POST', '/api/chat', { token: a, body: { text: 'Muội ơi!', channel: 'friend', peer: 'TyMuoi' } })).status, 200);
  const got = await call(handle, 'GET', '/api/chat', { token: b, query: { channel: 'friend', peer: 'HuynhDe', since: 0 } });
  assert.equal(got.json.messages.map(m => m.text).join(), 'Muội ơi!');
  assert.equal((await call(handle, 'GET', '/api/chat', { token: c, query: { channel: 'friend', peer: 'HuynhDe' } })).status, 403);
  assert.equal((await call(handle, 'GET', '/api/chat', { token: a, query: { since: 0 } })).json.messages.length, 0);
});

test('CH-T4: templates read well for 1 / 2 / 3 SSR and reject empty', () => {
  assert.match(buildBroadcast('ssr', { heroes: ['A'] }, 'X', 0).text, /Thiên mệnh chiếu rọi!/);
  assert.match(buildBroadcast('ssr', { heroes: ['A'] }, 'X', 1).text, /Long ngâm cửu thiên!/);
  assert.match(buildBroadcast('ssr', { heroes: ['A', 'B', 'C'] }, 'X').text, /Quần hùng tụ hội!.*3 tướng SSR/);
  assert.equal(buildBroadcast('ssr', { heroes: [] }, 'X').ok, false);
  assert.match(buildBroadcast('boss_drop', { item: 'Huyết Kiếm', boss: 'Hắc Long', rarity: 'legend' }, 'X').text, /【Thần Thoại】Huyết Kiếm/);
});
