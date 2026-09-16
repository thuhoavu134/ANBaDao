import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createCampaignResourcePackCache, campaignResourceKey } from '../src/assets/campaign-resource-pack-cache.mjs';

test('3Q-derived cache deduplicates one hero/clip/tier pack across owners', async () => {
  const calls = [];
  const cache = createCampaignResourcePackCache({
    maxDecodedBytes: 100,
    maxLoading: 2,
    clearDelayMs: 10,
    load: async pack => { calls.push(pack); return { image: { id: pack.src }, decodedBytes: pack.decodedBytes }; }
  });
  const pack = { heroId: 'bach_dien', clip: 'idle', tier: 'campaign', src: 'bach-idle-lite', decodedBytes: 40 };
  assert.equal(campaignResourceKey(pack), 'bach_dien:idle:campaign:bach-idle-lite');
  const a = await cache.acquire(pack, 'campaign-a');
  const b = await cache.acquire(pack, 'campaign-b');
  assert.equal(calls.length, 1);
  assert.equal(a.image, b.image);
  assert.equal(cache.inspect().entries[0].owners, 2);
  cache.release(pack, 'campaign-a', 0);
  assert.equal(cache.inspect().entries[0].owners, 1);
  cache.release(pack, 'campaign-b', 0);
  assert.equal(cache.inspect().entries[0].pendingClear, true);
  cache.sweep(11);
  assert.equal(cache.inspect().entries.length, 0);
});

test('3Q-derived cache bounds concurrent pack loading and queues the third pack', async () => {
  const resolvers = [];
  const started = [];
  const cache = createCampaignResourcePackCache({
    maxDecodedBytes: 300,
    maxLoading: 2,
    load: pack => { started.push(pack.src); return new Promise(resolve => resolvers.push(() => resolve({ image: { id: pack.src }, decodedBytes: 50 }))); }
  });
  const p1 = cache.acquire({ heroId: 'a', clip: 'idle', tier: 'campaign', src: 'a', decodedBytes: 50 }, 'scene');
  const p2 = cache.acquire({ heroId: 'b', clip: 'idle', tier: 'campaign', src: 'b', decodedBytes: 50 }, 'scene');
  const p3 = cache.acquire({ heroId: 'c', clip: 'idle', tier: 'campaign', src: 'c', decodedBytes: 50 }, 'scene');
  await Promise.resolve();
  assert.deepEqual(started, ['a', 'b']);
  resolvers.shift()();
  await p1;
  await Promise.resolve();
  assert.deepEqual(started, ['a', 'b', 'c']);
  resolvers.shift()(); resolvers.shift()();
  await Promise.all([p2, p3]);
  assert.equal(cache.inspect().loading, 0);
});

test('campaign-lite six-hero pack stays under the explicit decoded memory budget', () => {
  const manifest = JSON.parse(fs.readFileSync('campaign-lite-atlas-manifest.json', 'utf8'));
  const total = manifest.records.reduce((sum, record) => sum + record.decodedBytes, 0);
  assert.equal(manifest.schema, 'campaign-lite-atlas/v1');
  assert.equal(manifest.records.length, 6);
  assert.ok(total <= 96 * 1024 * 1024, `decoded campaign-lite bytes ${total} exceed budget`);
  assert.deepEqual(manifest.records.map(record => [record.hero, record.cellW, record.cellH]), [
    ['bach-dien', 240, 220], ['bach-dien', 240, 220], ['linh-dong', 240, 220],
    ['linh-dong', 240, 220], ['luc-anh', 240, 240], ['dinh-loi', 240, 135]
  ]);
});

test('3Q-derived cache refuses a pack when all existing bytes are owned, instead of exceeding budget', async () => {
  const cache = createCampaignResourcePackCache({
    maxDecodedBytes: 100,
    maxLoading: 2,
    load: async pack => ({ image: { id: pack.src }, decodedBytes: pack.decodedBytes })
  });
  await cache.acquire({ heroId: 'a', clip: 'idle', tier: 'native', src: 'a', decodedBytes: 60 }, 'visible-a');
  await assert.rejects(
    cache.acquire({ heroId: 'b', clip: 'idle', tier: 'native', src: 'b', decodedBytes: 60 }, 'visible-b'),
    /decoded budget/
  );
  const state = cache.inspect();
  assert.equal(state.bytes, 60);
  assert.equal(state.entries.length, 1);
});
