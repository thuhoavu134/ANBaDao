import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { SPLUS_HEROES, validateSplusCatalog, getSplusHero } from '../src/domain/hero/splus-catalog.mjs';
import { BACH_DIEN_TIMELINE } from '../src/combat-domain/bach-dien-presentation.mjs';
import { createAssetLoader } from '../src/assets/asset-loader.mjs';
import { frameAt } from '../src/assets/frame-clock.mjs';
import { sourceRectForFrame } from '../src/render/canvas-sprite-renderer.mjs';

const root = new URL('../', import.meta.url);
const read = rel => fs.readFileSync(new URL(rel, root), 'utf8');
const exists = rel => fs.existsSync(new URL(rel, root));
const bytes = rel => fs.readFileSync(new URL(rel, root));

const ATLASES = [
  'idle-atlas.webp',
  'run-atlas.webp',
  'hit-atlas.webp',
  'fall-atlas.webp',
  'basic-atlas.webp',
  'ultimate-atlas.webp',
  'skill1_vfx-atlas.webp',
  'ultimate_vfx-atlas.webp'
];

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

test('L154-T1 catalog resolves Bạch Diện aliases without Image or Spine', async () => {
  const catalog = await import('../src/assets/asset-catalog.mjs');
  const source = read('src/assets/asset-catalog.mjs');
  const renderer = read('src/render/canvas-sprite-renderer.mjs');
  const pkg = read('package.json');
  assert.doesNotMatch(source, /\bnew Image\b/);
  assert.doesNotMatch(renderer, /\bnew Image\b/);
  assert.doesNotMatch(source, /spine/i);
  assert.doesNotMatch(renderer, /spine/i);
  assert.doesNotMatch(pkg, /spine/i);
  const created = [];
  const Original = globalThis.Image;
  globalThis.Image = class { constructor() { created.push(this); } };
  try {
    for (const id of ['hero_splus_bach_dien', 'bach_dien', 'bach-dien', 'BACH_DIEN']) {
      assert.equal(catalog.normalizeHeroId(id), 'hero_splus_bach_dien', id);
      assert.equal(catalog.getHeroManifest(id)?.heroId, 'hero_splus_bach_dien', id);
    }
    assert.equal(catalog.normalizeClipKey('hit'), 'hurt');
    assert.equal(catalog.normalizeClipKey('fall'), 'defeated');
    assert.equal(catalog.normalizeClipKey('atk'), 'attack');
    assert.equal(catalog.normalizeClipKey('vfx_atk'), 'skill1Vfx');
    assert.equal(created.length, 0);
  } finally {
    if (Original) globalThis.Image = Original;
    else delete globalThis.Image;
  }
});

test('L154-T2 Extreme v6 pack metadata keeps explicit frame counts and native cells', async () => {
  const catalog = await import('../src/assets/asset-catalog.mjs');
  const report = catalog.validateManifest(catalog.getHeroManifest('hero_splus_bach_dien'));
  assert.equal(report.ok, true, report.errors.join('; '));
  const idle = catalog.getClip('bach-dien', 'idle');
  const run = catalog.getClip('bach_dien', 'run');
  const attack = catalog.getClip('hero_splus_bach_dien', 'skill1');
  const vfx = catalog.getClip('bach-dien', 'atkVfx');
  const ultVfx = catalog.getClip('bach-dien', 'ultimateVfx');
  const expectedCharacter = {
    idle: [22, 6, 4], run: [30, 6, 5], attack: [20, 5, 4]
  };
  for (const [key, clip] of [['idle', idle], ['run', run], ['attack', attack]]) {
    const [frames, cols, rows] = expectedCharacter[key];
    assert.equal(clip.frames, frames);
    assert.equal(clip.cellW, 480);
    assert.equal(clip.cellH, 440);
    assert.equal(clip.cols, cols);
    assert.equal(clip.rows, rows);
    assert.equal(clip.pivot.x, 240);
    assert.equal(clip.pivot.y, 440);
    assert.equal(clip.decodedBytes, cols * 480 * rows * 440 * 4);
    assert.equal(clip.atlasWidth, cols * 480);
    assert.equal(clip.atlasHeight, rows * 440);
    assert.equal(clip.fps, 30);
  }
  for (const [clip, frames, cols, rows] of [[vfx, 22, 6, 4], [ultVfx, 32, 8, 4]]) {
    assert.equal(clip.frames, frames);
    assert.equal(clip.cellW, 440);
    assert.equal(clip.cellH, 248);
    assert.equal(clip.cols, cols);
    assert.equal(clip.rows, rows);
    assert.equal(clip.kind, 'vfx');
    assert.equal(clip.blendMode, 'source-over');
    assert.equal(clip.decodedBytes, cols * 440 * rows * 248 * 4);
    assert.equal(clip.pivot.x, 220);
    assert.equal(clip.pivot.y, 248);
  }
  const meta = JSON.parse(read('assets/characters/bach-dien/runtime-meta.json'));
  assert.equal(meta.schema, 'canvas-sprite-runtime/v2');
  assert.match(meta.source, /Extreme v6/i);
  for (const file of ATLASES) {
    const rel = 'assets/characters/bach-dien/' + file;
    assert.ok(exists(rel), rel);
    const buf = bytes(rel);
    assert.ok(buf.length > 32, rel);
    const clip = Object.values(meta.clips).find(c => c.file === file);
    assert.ok(clip, file);
    assert.equal(createHash('sha256').update(buf).digest('hex'), clip.sha256, file);
  }
});

test('L154-T3 FrameClock replay and renderer source rect use clip metadata', async () => {
  const catalog = await import('../src/assets/asset-catalog.mjs');
  const idle = catalog.getClip('bach_dien', 'idle');
  const attack = catalog.getClip('bach_dien', 'attack');
  assert.equal(frameAt(idle, 0), 0);
  assert.equal(frameAt(idle, 1000 / 30), 1);
  assert.equal(frameAt({ ...idle, loop: true }, 22 * (1000 / 30)), 0);
  assert.equal(frameAt({ ...attack, loop: false }, 10_000), 19);
  assert.equal(frameAt(idle, 1000), frameAt(idle, 1000));
  const last = sourceRectForFrame(idle, 21);
  assert.equal(last.sx, (21 % 6) * 480);
  assert.equal(last.sy, Math.floor(21 / 6) * 440);
  assert.equal(last.sw, 480);
  assert.equal(last.sh, 440);
  const renderer = read('src/render/canvas-sprite-renderer.mjs');
  assert.doesNotMatch(renderer, /\b347\b/);
  assert.doesNotMatch(renderer, /\bnaturalWidth\s*\/\s*4/);
  assert.equal(BACH_DIEN_TIMELINE.atk.character.frames, 94);
  assert.equal(BACH_DIEN_TIMELINE.atk.recoveryEndMs, 3133.333);
  assert.equal(BACH_DIEN_TIMELINE.ultimate.sfx, 'assets/audio/sfx/bach-dien/ult.wav');
});

test('L154-T4 lazy loader boots idle only; ATK+VFX on action; shared 128 MiB LRU', async () => {
  const catalog = await import('../src/assets/asset-catalog.mjs');
  const loader = createAssetLoader({ maxBytes: 128 * 1024 * 1024, maxLoading: 2, makeImage: () => new (mockImage())() });
  const idle = catalog.getClip('bach_dien', 'idle');
  const boot = loader.ensure(idle, { priority: 'visible', scope: 'battle' });
  assert.equal(boot.state, 'loading');
  assert.equal(loader.inspect().loading, 1);
  assert.equal(loader.inspect().entries.some(e => /basic-atlas/.test(e.src)), false);
  assert.equal(loader.inspect().entries.some(e => /skill1_vfx/.test(e.src)), false);
  assert.ok(loader.inspect().bytes <= 128 * 1024 * 1024, String(loader.inspect().bytes));
  loader.clearScope('battle');
  assert.equal(loader.inspect().entries.length, 0);
  const patch = read('scripts/bach-dien-canvas-runtime-v1.mjs');
  assert.doesNotMatch(patch, /Object\.keys\(BACH_DIEN_CLIPS\)\.forEach/);
  assert.match(patch, /bachDienImage\('idle'\)/);
  assert.match(patch, /bachDienImage\(normalized==='ultimate'\?'ultimate':'attack'\)/);
  assert.match(patch, /bachDienImage\(normalized==='ultimate'\?'ultimateVfx':'atkVfx'\)/);
  assert.match(patch, /BACH_DIEN_LOADER=typeof LINH_DONG_LOADER/);
  assert.match(patch, /drawCanvasSprite/);
  assert.doesNotMatch(patch, /spine/i);
});

test('L154-T5 wav SFX on HonVietSfx; 42 catalog stays 42; roster 12 closed', () => {
  assert.ok(exists('assets/audio/sfx/bach-dien/atk.wav'));
  assert.ok(exists('assets/audio/sfx/bach-dien/ult.wav'));
  const sfx = read('src/ui/audio-sfx-runtime.js');
  assert.match(sfx, /'bach-dien-atk': 'bach-dien\/atk\.wav'/);
  assert.match(sfx, /'bach-dien-ult': 'bach-dien\/ult\.wav'/);
  assert.doesNotMatch(sfx, /new Audio/);
  assert.doesNotMatch(read('assets/characters/bach-dien/skill1/skill.json'), /\.ogg/);
  assert.equal(getSplusHero('bach_dien')?.art.atlas, 'assets/characters/bach-dien/idle-atlas.webp');
  assert.deepEqual(validateSplusCatalog().errors, []);
  assert.equal(SPLUS_HEROES.length, 42);
  assert.equal(SPLUS_HEROES.filter(h => h.element === 'soul').length, 7);
  const index = read('index.html');
  assert.match(index, /OFFICIAL_ROSTER_12_IDS=Object\.freeze\(\[[^\]]*bach_dien/);
  const campaign = read('src/ui/campaign-scene.js');
  assert.match(campaign, /bach_dien: \{ src: 'assets\/characters\/bach-dien\/idle-atlas\.webp'/);
  assert.match(campaign, /bach_dien: \{ src: 'assets\/characters\/bach-dien\/run-atlas\.webp'/);
  assert.match(campaign, /frames: 94, cols: 8, cellW: 480, cellH: 440/);
});

test('L154-T6 battle adapter uses catalog metadata and shared cache, not a 4×2 guess', () => {
  const patch = read('scripts/bach-dien-canvas-runtime-v1.mjs');
  const bridge = read('src/runtime/splus-battle-bridge.js');
  const build = read('scripts/build-static.mjs');
  assert.match(patch, /drawBachDienAtlas\(context,key,frame,0,0,477,440,\{baseline:64/);
  assert.match(patch, /cols=clip\.cols/);
  assert.match(patch, /cellW=clip\.cellW/);
  assert.doesNotMatch(patch, /naturalWidth\s*\/\s*4/);
  assert.doesNotMatch(patch, /\b347\b/);
  assert.match(patch, /bachDienQa/);
  assert.match(bridge, /isBachDien\(unit\)/);
  assert.match(bridge, /drawBachDienHero\(context,unit,time\)/);
  assert.match(bridge, /beginBachDienAction/);
  assert.equal(bridge.slice(
    bridge.indexOf('async function performSplusAction'),
    bridge.indexOf('function drawSplusToken')
  ).split('e.act(').length, 2);
  assert.match(build, /bach-dien-canvas-runtime-v1\.mjs/);
});
