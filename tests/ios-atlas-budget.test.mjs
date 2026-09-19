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

function fakeCanvas() {
  const canvas = {
    width: 0,
    height: 0,
    complete: false,
    getContext() {
      return { imageSmoothingEnabled: false, imageSmoothingQuality: '', drawImage() {} };
    }
  };
  return canvas;
}

function splusClip(name) {
  return {
    file: name + '.webp',
    src: 'assets/characters/' + name + '/idle-atlas.webp',
    frames: 94,
    cols: 8,
    rows: 12,
    cellW: 480,
    cellH: 440,
    decodedBytes: 3840 * 5280 * 4,
    atlasWidth: 3840,
    atlasHeight: 5280
  };
}

test('L157-T3 atlasDecodeScale halves 77 MiB S+ and leaves small atlases native', async () => {
  const { atlasDecodeScale } = await import('../src/assets/decoded-atlas-cache.mjs');
  assert.equal(atlasDecodeScale(3840 * 5280 * 4, 128 * 1024 * 1024), 0.5);
  assert.equal(atlasDecodeScale(3840 * 5760 * 4, 128 * 1024 * 1024), 0.5);
  assert.equal(atlasDecodeScale(8 * 1024 * 1024, 128 * 1024 * 1024), 1);
  assert.equal(atlasDecodeScale(32, 48), 1);
});

test('L157-T1 two S+ idle atlases stay ready together under 128 MiB', async () => {
  const { createDecodedAtlasCache } = await import('../src/assets/decoded-atlas-cache.mjs');
  const Image = mockImage();
  const cache = createDecodedAtlasCache({
    maxBytes: 128 * 1024 * 1024,
    maxLoading: 2,
    makeImage: () => new Image(),
    makeCanvas: fakeCanvas
  });
  const a = cache.reserve(splusClip('linh-dong'), { scope: 'battle' });
  a.image.naturalWidth = 3840;
  a.image.naturalHeight = 5280;
  a.image.complete = true;
  a.image.onload();
  const b = cache.reserve(splusClip('bach-dien'), { scope: 'battle' });
  b.image.naturalWidth = 3840;
  b.image.naturalHeight = 5280;
  b.image.complete = true;
  b.image.onload();
  const inspect = cache.inspect();
  assert.equal(inspect.entries.length, 2, inspect.entries.map(e => e.src).join(','));
  assert.ok(inspect.bytes <= 128 * 1024 * 1024, String(inspect.bytes));
  assert.ok(inspect.bytes < 50 * 1024 * 1024, 'downsampled pair must be well under 50 MiB, got ' + inspect.bytes);
  assert.equal(a.image.__hvAtlasScale, 0.5);
  assert.equal(b.image.__hvAtlasScale, 0.5);
  assert.equal(a.state, 'ready');
  assert.equal(b.state, 'ready');
});

test('L157-T2 drawCanvasSprite samples scaled atlas with matching source rect', async () => {
  const { drawCanvasSprite, sourceRectForFrame } = await import('../src/render/canvas-sprite-renderer.mjs');
  const clip = { cellW: 480, cellH: 440, cols: 8, frames: 94, pivot: { x: 240, y: 440 } };
  const native = sourceRectForFrame(clip, 9);
  assert.equal(native.sx, 480);
  assert.equal(native.sy, 440);
  const calls = [];
  const ctx = {
    save() {}, restore() {}, translate() {}, scale() {},
    drawImage(...args) { calls.push(args); },
    imageSmoothingEnabled: false,
    imageSmoothingQuality: '',
    globalAlpha: 1,
    globalCompositeOperation: 'source-over'
  };
  const image = { complete: true, naturalWidth: 1920, naturalHeight: 2640, __hvAtlasScale: 0.5 };
  assert.equal(drawCanvasSprite(ctx, { image, clip, frame: 9, x: 0, y: 0, width: 477, height: 440 }), true);
  assert.equal(calls.length, 1);
  const [src, sx, sy, sw, sh] = calls[0];
  assert.equal(src, image);
  assert.equal(sx, 240);
  assert.equal(sy, 220);
  assert.equal(sw, 240);
  assert.equal(sh, 220);
});

test('L157-T4 campaign releases every atlas when the battle overlay is open', () => {
  const scene = read('src/ui/campaign-scene.js');
  const cache = read('src/assets/campaign-resource-pack-cache.mjs');
  assert.match(scene, /hvBattleOverlay/);
  assert.match(scene, /releaseSceneAtlases/);
  assert.match(scene, /__HV_CAMPAIGN_RELEASE_ATLASES/);
  assert.match(scene, /sceneResourceCache\.purge/);
  assert.match(cache, /(?:const purge|function purge)/);
});

test('L157-T5 battle releases ATK/VFX after the action; host drops Bạch Diện idle on iframe open', () => {
  const linh = read('scripts/linh-dong-timing-main-v1.mjs');
  const bach = read('scripts/bach-dien-canvas-runtime-v1.mjs');
  const memory = read('scripts/linh-dong-memory-v1.mjs');
  assert.match(linh, /LINH_DONG_LOADER\.release/);
  assert.match(bach, /BACH_DIEN_LOADER\.release/);
  assert.match(memory, /_bachDienIdleIm/);
  assert.match(memory, /__HV_CAMPAIGN_RELEASE_ATLASES/);
  assert.match(linh, /atlasDecodeScale=\$\{atlasDecodeScale\.toString/);
  try {
    const battle = read('dist/battle.html');
    assert.match(battle, /function atlasDecodeScale/);
    assert.match(battle, /function downsampleDecodedAtlas/);
    assert.match(battle, /__hvAtlasScale/);
  } catch (error) {
    if (error.code === 'ENOENT') return;
    throw error;
  }
});
