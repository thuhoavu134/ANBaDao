import test from 'node:test';
import assert from 'node:assert/strict';
import { createCloudSession } from '../src/domain/save/cloud-session.mjs';

const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
const account = user => ({ user, token: user + '-token' });
function setup(request, owner = '') {
  let player = { gold: 3, revision: 1 }, localOwner = owner;
  const acknowledgements = new Map(), backups = [];
  const cloud = createCloudSession({ request, getPlayer: () => player,
    replacePlayer: p => { player = p; }, newPlayer: () => ({ gold: 0, revision: 0 }),
    getLocalOwner: () => localOwner, setLocalOwner: value => { localOwner = value; },
    backup: (p, user) => backups.push({ p, user }),
    acknowledge: (user, value) => acknowledgements.set(user, value),
    getAcknowledged: user => acknowledgements.get(user) });
  return { cloud, backups, acknowledgements, player: () => player, edit: value => Object.assign(player, value) };
}

test('rapid saves serialize independent server versions and keep their own snapshots', async () => {
  const release = deferred(), requests = [];
  const b = setup(async (session, method, path, body) => {
    if (method === 'GET') return { save: { gold: 900, revision: 50 }, version: 7 };
    requests.push({ session, ...body });
    if (requests.length === 1) await release.promise;
    return { version: body.expectedVersion + 1 };
  });
  await b.cloud.connect(account('alice'));
  b.edit({ gold: 899, revision: 51 }); const first = b.cloud.upload();
  b.edit({ gold: 898, revision: 52 }); const second = b.cloud.upload();
  await new Promise(setImmediate);
  assert.equal(requests.length, 1);
  release.resolve();
  assert.deepEqual(await Promise.all([first, second]), [true, true]);
  assert.deepEqual(requests.map(r => [r.expectedVersion, r.save.gold]), [[7, 899], [8, 898]]);
  assert.deepEqual(b.acknowledgements.get('alice'), { version: 9, localRevision: 52 });
});

test('an old account read cannot replace the new account or guest state', async () => {
  for (const guest of [false, true]) {
    const pending = deferred();
    const b = setup(async session => session.user === 'alice' ? pending.promise : { save: { gold: 80 }, version: 4 });
    const old = b.cloud.connect(account('alice'));
    const rejected = assert.rejects(old, { code: 'SESSION_CHANGED' });
    if (guest) b.cloud.disconnect(); else await b.cloud.connect(account('bob'));
    pending.resolve({ save: { gold: 900 }, version: 7 });
    await rejected;
    assert.equal(b.player().gold, guest ? 3 : 80);
  }
});

test('a conflict blocks queued writes and never silently fetches then overwrites', async () => {
  const requests = [];
  const b = setup(async (session, method) => {
    requests.push(method);
    if (method === 'GET') return { save: null, version: 0 };
    throw Object.assign(new Error('conflict'), { code: 'SAVE_CONFLICT' });
  });
  await b.cloud.connect(account('alice'));
  const first = b.cloud.upload(), second = b.cloud.upload();
  await assert.rejects(first, { code: 'SAVE_CONFLICT' });
  assert.equal(await second, false);
  assert.deepEqual(requests, ['GET', 'PUT']);
  assert.equal(b.cloud.readyFor(account('alice')), false);
  assert.equal(b.player().gold, 3);
});

test('a new account cannot inherit another account save', async () => {
  const b = setup(async () => ({ save: null, version: 0 }), 'alice');
  await b.cloud.connect(account('bob'));
  assert.equal(b.player().gold, 0);
  assert.equal(b.backups[0].p.gold, 3);
  assert.equal(b.backups[0].user, 'alice');
});

test('manual pull waits for a write already in flight before reading its committed save', async () => {
  const release = deferred(); let save = { gold: 10, revision: 1 }, version = 1;
  const b = setup(async (session, method, path, body) => {
    if (method === 'GET') return { save, version };
    await release.promise; save = body.save; version++;
    return { version };
  });
  await b.cloud.connect(account('alice'));
  b.edit({ gold: 9, revision: 2 });
  const write = b.cloud.upload();
  const superseded = assert.rejects(write, { code: 'SESSION_CHANGED' });
  await new Promise(setImmediate);
  const pull = b.cloud.connect(account('alice'), { force: true });
  release.resolve();
  await Promise.all([superseded, pull]);
  assert.equal(b.player().gold, 9);
  assert.equal(b.cloud.inspect().version, 2);
});

test('offline changes survive reconnect only against the last acknowledged cloud version', async () => {
  let remote = { save: { gold: 10, revision: 1 }, version: 1 };
  const b = setup(async () => structuredClone(remote));
  await b.cloud.connect(account('alice'));
  b.edit({ gold: 9, revision: 2 }); b.cloud.disconnect();
  await b.cloud.connect(account('alice'));
  assert.equal(b.player().gold, 9);
  remote = { save: { gold: 25, revision: 8 }, version: 2 };
  b.cloud.disconnect();
  await b.cloud.connect(account('alice'));
  assert.equal(b.player().gold, 25);
  assert.equal(b.backups.at(-1).p.gold, 9);
});
