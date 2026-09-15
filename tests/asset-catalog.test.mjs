import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('L151-T1 catalog module does not create Image or touch the DOM', () => {
  const source = read('src/assets/asset-catalog.mjs');
  assert.doesNotMatch(source, /\bnew Image\b/);
  assert.doesNotMatch(source, /\bdocument\b/);
  assert.doesNotMatch(source, /\bfetch\s*\(/);
  assert.doesNotMatch(source, /spine/i);
  const pkg = read('package.json');
  assert.doesNotMatch(pkg, /spine/i);
});

test('L151-T1 alias normalization and unknown lookup', async () => {
  const catalog = await import('../src/assets/asset-catalog.mjs');
  assert.equal(catalog.normalizeHeroId('linh_dong'), 'hero_splus_linh_dong');
  assert.equal(catalog.normalizeHeroId('linh-dong'), 'hero_splus_linh_dong');
  assert.equal(catalog.normalizeHeroId('hero_splus_linh_dong'), 'hero_splus_linh_dong');
  assert.equal(catalog.normalizeHeroId('LUC-ANH'), 'luc_anh');
  assert.equal(catalog.normalizeHeroId('dinh-loi'), 'dinh_loi');
  assert.equal(catalog.normalizeClipKey('skill1'), 'attack');
  assert.equal(catalog.normalizeClipKey('basic'), 'attack');
  assert.equal(catalog.normalizeClipKey('normal'), 'attack');
  assert.equal(catalog.normalizeClipKey('ult'), 'ultimate');
  assert.equal(catalog.normalizeClipKey('hit'), 'hurt');
  assert.equal(catalog.normalizeClipKey('fall'), 'defeated');
  assert.equal(catalog.normalizeClipKey('atkVfx'), 'skill1Vfx');
  assert.equal(catalog.getHeroManifest('missing_hero'), null);
  assert.equal(catalog.getClip('hero_splus_linh_dong', 'nope'), null);
});

test('L151-T1 resolves Linh Đồng plus two older heroes without creating Image', async () => {
  const catalog = await import('../src/assets/asset-catalog.mjs');
  const created = [];
  const Original = globalThis.Image;
  globalThis.Image = class { constructor() { created.push(this); } };
  try {
    const linh = catalog.getHeroManifest('linh_dong');
    const luc = catalog.getHeroManifest('luc_anh');
    const dinh = catalog.getHeroManifest('dinh_loi');
    assert.ok(linh, 'Linh Đồng manifest missing');
    assert.ok(luc, 'Lục Ảnh manifest missing');
    assert.ok(dinh, 'Đình Lôi manifest missing');
    assert.equal(linh.heroId, 'hero_splus_linh_dong');
    assert.equal(linh.schema, 'canvas-sprite-runtime/v2');
    const idle = catalog.getClip('linh-dong', 'idle');
    assert.equal(idle.cellW, 480);
    assert.equal(idle.cellH, 440);
    assert.equal(idle.cols, 8);
    assert.equal(idle.rows, 12);
    assert.equal(idle.frames, 96);
    assert.equal(idle.decodedBytes, 3840 * 5280 * 4);
    assert.equal(idle.pivot.x, 240);
    assert.equal(idle.pivot.y, 440);
    assert.equal(idle.trimMode, 'stable-union');
    const attack = catalog.getClip('hero_splus_linh_dong', 'skill1');
    assert.equal(attack.file, 'basic-atlas.webp');
    assert.equal(attack.cellW, 480);
    assert.equal(attack.decodedBytes, 3840 * 2640 * 4);
    const vfx = catalog.getClip('linh_dong', 'ultimateVfx');
    assert.equal(vfx.kind, 'vfx');
    assert.equal(vfx.cellW, 440);
    assert.equal(vfx.cellH, 248);
    assert.equal(vfx.blendMode, 'source-over');
    const lucIdle = catalog.getClip('luc-anh', 'idle');
    assert.equal(lucIdle.cellW, 480);
    assert.equal(lucIdle.cellH, 480);
    assert.equal(lucIdle.frames, 96);
    const dinhIdle = catalog.getClip('dinh_loi', 'idle');
    assert.equal(dinhIdle.cellW, 480);
    assert.equal(dinhIdle.cellH, 270);
    assert.equal(dinhIdle.frames, 64);
    assert.equal(created.length, 0, 'catalog must not construct Image');
  } finally {
    if (Original) globalThis.Image = Original;
    else delete globalThis.Image;
  }
});

test('L151-T1 manifest validator rejects broken layout and wrong decodedBytes', async () => {
  const catalog = await import('../src/assets/asset-catalog.mjs');
  const base = catalog.getHeroManifest('hero_splus_linh_dong');
  const idle = { ...base.clips.idle };
  const broken = catalog.validateManifest({
    schema: 'canvas-sprite-runtime/v2',
    heroId: 'hero_test_broken',
    aliases: [],
    clips: { idle: { ...idle, frames: 0 } }
  });
  assert.equal(broken.ok, false);
  assert.ok(broken.errors.some(e => /frames/i.test(e)));

  const bytes = catalog.validateManifest({
    schema: 'canvas-sprite-runtime/v2',
    heroId: 'hero_test_bytes',
    aliases: [],
    clips: { idle: { ...idle, decodedBytes: 12 } }
  });
  assert.equal(bytes.ok, false);
  assert.ok(bytes.errors.some(e => /decodedBytes/i.test(e)));

  const layout = catalog.validateManifest({
    schema: 'canvas-sprite-runtime/v2',
    heroId: 'hero_test_layout',
    aliases: [],
    clips: { idle: { ...idle, atlasWidth: 99, atlasHeight: idle.rows * idle.cellH } }
  });
  assert.equal(layout.ok, false);
});

test('L151-T1 Linh Đồng v1 runtime-meta hydrates to v2 without losing hashes', async () => {
  const catalog = await import('../src/assets/asset-catalog.mjs');
  const meta = JSON.parse(read('assets/characters/linh-dong/runtime-meta.json'));
  const idle = catalog.getClip('hero_splus_linh_dong', 'idle');
  const packed = meta.packed.find(p => p.file === 'idle-atlas.webp');
  assert.equal(idle.sha256, packed.sha256);
  assert.equal(idle.atlasWidth, packed.atlasW);
  assert.equal(idle.atlasHeight, packed.atlasH);
  assert.equal(idle.atlasWidth, idle.cols * idle.cellW);
  assert.equal(idle.atlasHeight, idle.rows * idle.cellH);
  assert.equal(meta.perFrameCrop, false);
  assert.equal(meta.blackKeyForbidden, true);
});
