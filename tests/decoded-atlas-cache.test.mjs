import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

function mockImage() {
  return class Image {
    constructor() {
      this.complete = false;
      this.naturalWidth = 0;
      this.naturalHeight = 0;
      this.decoding = '';
      this.onload = null;
      this.onerror = null;
      this._src = '';
    }
    set src(value) { this._src = value; }
    get src() { return this._src; }
    removeAttribute(name) { if (name === 'src') this._src = ''; }
  };
}

function tinyClip(name, bytesCells = 8) {
  return {
    file: name + '.webp',
    src: 'assets/' + name + '.webp',
    frames: 1,
    cols: 1,
    rows: 1,
    cellW: bytesCells,
    cellH: 1,
    decodedBytes: bytesCells * 1 * 4
  };
}

test('L151-T2 decoded byte formula is atlas width × height × 4', async () => {
  const { atlasDecodedBytes } = await import('../src/assets/decoded-atlas-cache.mjs');
  assert.equal(atlasDecodedBytes({ cols: 8, rows: 12, cellW: 480, cellH: 440 }), 3840 * 5280 * 4);
  assert.equal(atlasDecodedBytes({ cols: 8, rows: 6, cellW: 480, cellH: 440 }), 3840 * 2640 * 4);
  assert.equal(atlasDecodedBytes({ cols: 10, rows: 12, cellW: 440, cellH: 248 }), 4400 * 2976 * 4);
});

test('L151-T2 LRU evicts ready atlases under 128 MiB and never evicts loading', async () => {
  const { createDecodedAtlasCache } = await import('../src/assets/decoded-atlas-cache.mjs');
  const Image = mockImage();
  const cache = createDecodedAtlasCache({
    maxBytes: 48,
    maxLoading: 2,
    makeImage: () => new Image()
  });
  const a = cache.reserve(tinyClip('a', 4), { scope: 'battle' });
  const b = cache.reserve(tinyClip('b', 4), { scope: 'battle' });
  assert.equal(cache.inspect().loading, 2);
  a.image.naturalWidth = 4; a.image.naturalHeight = 1; a.image.complete = true; a.image.onload();
  const aImage = a.image;
  const c = cache.reserve(tinyClip('c', 8), { scope: 'battle' });
  assert.ok(c.image);
  assert.equal(cache.inspect().bytes, 48);
  assert.equal(aImage.src, '', 'ready LRU entry must be released');
  assert.ok(b.image.src, 'loading entry must stay');
});

test('L151-T2 failed and malformed atlases do not retry every frame', async () => {
  const { createDecodedAtlasCache } = await import('../src/assets/decoded-atlas-cache.mjs');
  const Image = mockImage();
  const cache = createDecodedAtlasCache({ maxBytes: 128, maxLoading: 2, makeImage: () => new Image() });
  const clip = tinyClip('idle', 8);
  const first = cache.reserve(clip, { scope: 'battle' });
  first.image.onerror();
  for (let n = 0; n < 40; n++) {
    const again = cache.reserve(clip, { scope: 'battle' });
    assert.equal(again.state, 'failed');
    assert.equal(again.image, null);
  }
  assert.equal(cache.inspect().failed, 1);
});

test('L151-T2 release clears handlers and stale onload is harmless', async () => {
  const { createDecodedAtlasCache } = await import('../src/assets/decoded-atlas-cache.mjs');
  const Image = mockImage();
  const cache = createDecodedAtlasCache({ maxBytes: 128, maxLoading: 2, makeImage: () => new Image() });
  const clip = tinyClip('idle', 8);
  const handle = cache.reserve(clip, { scope: 'hero-detail' });
  const image = handle.image;
  const late = image.onload;
  cache.clearScope('hero-detail');
  assert.equal(image.src, '');
  assert.equal(image.onload, null);
  assert.equal(image.onerror, null);
  late();
  assert.equal(cache.inspect().bytes, 0);
});

test('L151-T2 atlas larger than the budget fails with a clear error instead of crashing', async () => {
  const { createDecodedAtlasCache } = await import('../src/assets/decoded-atlas-cache.mjs');
  const Image = mockImage();
  const logs = [];
  const cache = createDecodedAtlasCache({
    maxBytes: 16,
    maxLoading: 2,
    makeImage: () => new Image(),
    log: msg => logs.push(String(msg))
  });
  const huge = tinyClip('huge', 32);
  const handle = cache.reserve(huge, { scope: 'battle' });
  assert.equal(handle.state, 'failed');
  assert.match(handle.error, /budget|decodedBytes|maxBytes/i);
  assert.equal(cache.inspect().bytes, 0);
  cache.reserve(huge, { scope: 'battle' });
  assert.equal(logs.length, 1, 'log each failing URL once');
});

test('L151-T2 cache source stays self-contained for battle injection', () => {
  const source = read('src/assets/decoded-atlas-cache.mjs');
  assert.match(source, /maxBytes/);
  assert.match(source, /maxLoading/);
  assert.doesNotMatch(source, /spine/i);
});
