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

function clip(file, w = 8, h = 4, cols = 2, rows = 2, frames = 4) {
  return {
    file,
    src: 'assets/' + file,
    frames,
    cols,
    rows,
    cellW: w,
    cellH: h,
    decodedBytes: cols * w * rows * h * 4,
    atlasWidth: cols * w,
    atlasHeight: rows * h
  };
}

test('L151-T3 loader dedupes the same URL and does not construct Image in a draw loop helper', async () => {
  const { createAssetLoader } = await import('../src/assets/asset-loader.mjs');
  const Image = mockImage();
  let made = 0;
  const loader = createAssetLoader({
    maxBytes: 1024,
    maxLoading: 2,
    makeImage: () => { made += 1; return new Image(); }
  });
  const idle = clip('idle.webp');
  const a = loader.ensure(idle, { priority: 'visible', scope: 'battle' });
  const b = loader.ensure(idle, { priority: 'visible', scope: 'battle' });
  assert.equal(a.key, b.key);
  assert.equal(a.image, b.image);
  assert.equal(made, 1);
  assert.equal(a.state, 'loading');
});

test('L151-T3 validate natural size after load; wrong size fails without retry', async () => {
  const { createAssetLoader } = await import('../src/assets/asset-loader.mjs');
  const Image = mockImage();
  const loader = createAssetLoader({ maxBytes: 1024, maxLoading: 2, makeImage: () => new Image() });
  const idle = clip('idle.webp', 8, 4, 2, 2, 4);
  const handle = loader.ensure(idle, { scope: 'battle' });
  handle.image.naturalWidth = 1;
  handle.image.naturalHeight = 1;
  handle.image.complete = true;
  handle.image.onload();
  assert.equal(handle.state, 'failed');
  const again = loader.ensure(idle, { scope: 'battle' });
  assert.equal(again.state, 'failed');
  assert.equal(again.image, null);
});

test('L151-T3 concurrent loads stay at maxLoading=2', async () => {
  const { createAssetLoader } = await import('../src/assets/asset-loader.mjs');
  const Image = mockImage();
  const loader = createAssetLoader({ maxBytes: 4096, maxLoading: 2, makeImage: () => new Image() });
  const a = loader.ensure(clip('a.webp'), { scope: 'battle' });
  const b = loader.ensure(clip('b.webp'), { scope: 'battle' });
  const c = loader.ensure(clip('c.webp'), { scope: 'battle' });
  assert.equal(a.state, 'loading');
  assert.equal(b.state, 'loading');
  assert.equal(c.state, 'idle');
  assert.equal(c.image, null);
  assert.equal(loader.inspect().loading, 2);
});

test('L151-T3 explicit retry is required after failure', async () => {
  const { createAssetLoader } = await import('../src/assets/asset-loader.mjs');
  const Image = mockImage();
  let made = 0;
  const loader = createAssetLoader({ maxBytes: 1024, maxLoading: 2, makeImage: () => { made += 1; return new Image(); } });
  const idle = clip('idle.webp');
  const handle = loader.ensure(idle, { scope: 'battle' });
  handle.image.onerror();
  assert.equal(handle.state, 'failed');
  const skipped = loader.ensure(idle, { scope: 'battle' });
  assert.equal(skipped.state, 'failed');
  assert.equal(made, 1);
  const retried = loader.retry(idle, { scope: 'battle' });
  assert.equal(retried.state, 'loading');
  assert.equal(made, 2);
});

test('L151-T3 battle patch no longer eager-loads every Linh Đồng clip', () => {
  const patch = read('scripts/linh-dong-timing-main-v1.mjs');
  assert.doesNotMatch(patch, /Object\.keys\(LINH_DONG_CLIPS\)\.forEach\(linhDongImage\)/);
  assert.match(patch, /createAssetLoader|createDecodedAtlasCache/);
  assert.match(patch, /atkVfx:\{file:"skill1_vfx-atlas\.webp"/);
  assert.match(patch, /linhDongImage\((?:normalized==='ultimate'\s*\?\s*'ultimateVfx'\s*:\s*'atkVfx'|fx\.kind)\)/);
});

test('L151-T3 loader source does not construct Image during draw', () => {
  const loader = read('src/assets/asset-loader.mjs');
  const renderer = read('src/render/canvas-sprite-renderer.mjs');
  assert.doesNotMatch(renderer, /\bnew Image\b/);
  assert.doesNotMatch(renderer, /\bfetch\s*\(/);
  assert.match(loader, /ensure\(/);
});
