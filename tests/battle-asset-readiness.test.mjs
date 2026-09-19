import test from 'node:test';
import assert from 'node:assert/strict';
import { createAssetLoader } from '../src/assets/asset-loader.mjs';

function fixture(options = {}) {
  const images = [];
  const loader = createAssetLoader({
    maxBytes: 128, maxLoading: 1, log() {},
    makeImage() {
      const image = { complete: false, naturalWidth: 0, naturalHeight: 0,
        src: '', onload: null, onerror: null,
        removeAttribute() { this.src = ''; } };
      images.push(image);
      return image;
    }, ...options
  });
  const clip = name => ({ src: name, cols: 1, rows: 1, frames: 1, w: 4, h: 4 });
  const ready = image => {
    image.naturalWidth = 4; image.naturalHeight = 4; image.complete = true;
    image.onload?.();
  };
  return { loader, images, clip, ready };
}
const tick = () => new Promise(resolve => setImmediate(resolve));

test('queued requests start without another render-loop ensure call', async () => {
  const { loader, images, clip, ready } = fixture();
  loader.ensure(clip('a'));
  const next = loader.ensure(clip('b'));
  const pending = next.promise;
  ready(images[0]); await tick();
  assert.equal(images.length, 2);
  ready(images[1]); await pending;
  assert.equal(next.state, 'ready');
});

test('a queued promise does not report ready before its image loads', async () => {
  const { loader, clip } = fixture();
  loader.ensure(clip('a'));
  let settled = false;
  loader.ensure(clip('b')).promise.then(() => { settled = true; }, () => {});
  await tick();
  assert.equal(settled, false);
  loader.clearScope('default');
});

test('a pinned visible atlas survives pressure while an unpinned atlas is evicted', () => {
  const { loader, images, clip, ready } = fixture({ maxLoading: 2 });
  const idle = loader.ensure(clip('idle'), { pin: 'visible:hero', scope: 'battle' });
  ready(images[0]);
  loader.ensure(clip('old-action')); ready(images[1]);
  loader.ensure(clip('next-action'));
  assert.equal(idle.state, 'ready');
  assert.ok(idle.image?.complete);
  assert.equal(loader.inspect().bytes, 128);
});

test('clearing a scope rejects outstanding readiness rather than hanging', async () => {
  const { loader, clip } = fixture();
  const handle = loader.ensure(clip('cancel-me'), { scope: 'battle' });
  const outcome = handle.promise.then(() => 'resolved', () => 'cancelled');
  loader.clearScope('battle');
  let timer;
  const actual = await Promise.race([outcome, new Promise(resolve => { timer = setTimeout(() => resolve('hung'), 60); })]);
  clearTimeout(timer);
  assert.equal(actual, 'cancelled');
});

test('a released action lease retains decoded data for the next turn', async () => {
  const { loader, images, clip, ready } = fixture();
  assert.equal(typeof loader.acquire, 'function');
  const pending = loader.acquire([clip('attack')], { owner: 'turn:1', scope: 'battle', timeoutMs: 100 });
  ready(images[0]);
  const lease = await pending;
  lease.release(); lease.release();
  assert.equal(loader.ensure(clip('attack')).state, 'ready');
  assert.equal(images.length, 1);
});

test('two leases sharing an atlas cannot release each others protection', async () => {
  const { loader, images, clip, ready } = fixture({ maxLoading: 2 });
  assert.equal(typeof loader.acquire, 'function');
  const a = loader.acquire([clip('same')], { owner: 'same-label', timeoutMs: 100 });
  const b = loader.acquire([clip('same')], { owner: 'same-label', timeoutMs: 100 });
  ready(images[0]);
  const first = await a, second = await b;
  first.release();
  loader.ensure(clip('other')); ready(images[1]);
  loader.ensure(clip('pressure'));
  assert.equal(loader.ensure(clip('same')).state, 'ready');
  second.release();
});

test('lease acquisition times out and removes only its own pins', async () => {
  const { loader, clip } = fixture();
  assert.equal(typeof loader.acquire, 'function');
  await assert.rejects(loader.acquire([clip('slow')], { timeoutMs: 15 }), /timeout/i);
  assert.equal(loader.inspect().entries[0].pins, 0);
  loader.clearScope('battle');
});

test('aborting a lease rejects it and clears its pins', async () => {
  const { loader, clip } = fixture();
  assert.equal(typeof loader.acquire, 'function');
  const controller = new AbortController();
  const pending = loader.acquire([clip('slow')], { signal: controller.signal, timeoutMs: 100 });
  controller.abort();
  await assert.rejects(pending, error => error.name === 'AbortError');
  assert.equal(loader.inspect().entries[0].pins, 0);
  loader.clearScope('battle');
});

test('clearing a scope cancels queued work without starting it', async () => {
  const { loader, images, clip } = fixture();
  loader.ensure(clip('one'), { scope: 'battle' });
  const two = loader.ensure(clip('two'), { scope: 'battle' });
  const cancelled = two.promise.then(() => false, () => true);
  loader.clearScope('battle');
  assert.equal(await cancelled, true);
  await tick();
  assert.equal(images.length, 1);
  assert.equal(loader.inspect().bytes, 0);
});

test('network failure frees a slot and automatically starts queued work', async () => {
  const { loader, images, clip, ready } = fixture();
  const a = loader.ensure(clip('a'));
  const b = loader.ensure(clip('b'));
  images[0].onerror(); await tick();
  assert.equal(a.state, 'failed');
  assert.equal(images.length, 2);
  ready(images[1]); await b.promise;
  assert.equal(b.state, 'ready');
});

test('existing handle state and explicit retry remain compatible', () => {
  const { loader, images, clip } = fixture();
  const a = loader.ensure(clip('a'));
  const b = loader.ensure(clip('b'));
  assert.equal(a.state, 'loading');
  assert.equal(b.state, 'idle');
  assert.equal(b.image, null);
  images[0].onerror();
  assert.equal(a.state, 'failed');
  assert.equal(loader.ensure(clip('a')).state, 'failed');
  loader.retry(clip('a'));
  assert.notEqual(a.state, 'failed');
  loader.clearScope('default');
});

test('the cache never exceeds maxLoading or its decoded reservation budget', async () => {
  const { loader, images, clip, ready } = fixture({ maxLoading: 2 });
  for (let i = 0; i < 8; i++) loader.ensure(clip('atlas-' + i));
  for (let i = 0; i < 8; i++) {
    assert.ok(loader.inspect().bytes <= 128);
    assert.ok(loader.inspect().loading <= 2);
    assert.ok(images[i], 'queued image should have started');
    ready(images[i]); await tick();
  }
  assert.equal(images.length, 8);
  loader.clearScope('default');
});
