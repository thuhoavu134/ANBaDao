import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const exists = rel => fs.existsSync(path.join(root, rel));

const atlasFiles = [
  'assets/characters/bach-dien/idle-atlas.webp',
  'assets/characters/bach-dien/run-atlas.webp',
  'assets/characters/bach-dien/hit-atlas.webp',
  'assets/characters/bach-dien/fall-atlas.webp',
  'assets/characters/bach-dien/basic-atlas.webp',
  'assets/characters/bach-dien/ultimate-atlas.webp',
  'assets/characters/bach-dien/skill1_vfx-atlas.webp',
  'assets/characters/bach-dien/ultimate_vfx-atlas.webp',
  'assets/characters/bach-dien/avatar.webp',
  'assets/audio/sfx/bach-dien/atk.wav',
  'assets/audio/sfx/bach-dien/ult.wav'
];

test('BACH-V5-0 Ultra v5 assets and runtime metadata are complete', () => {
  for (const rel of atlasFiles) assert.ok(exists(rel), rel);
  const meta = JSON.parse(read('assets/characters/bach-dien/runtime-meta.json'));
  assert.equal(meta.schema, 'canvas-sprite-runtime/v2');
  assert.equal(meta.heroId, 'hero_splus_bach_dien');
  assert.equal(meta.version, 'ultra-v5');
  assert.equal(meta.deliveryEncoding, 'webp-lossy-rgba-atlas-ultra-v5');
  assert.equal(Object.keys(meta.clips).length, 8);
  assert.deepEqual(Object.fromEntries(Object.entries(meta.clips).map(([key, clip]) => [key, clip.frames])), {
    idle: 32, run: 45, hurt: 18, defeated: 24, attack: 30,
    ultimate: 36, skill1Vfx: 36, ultimateVfx: 48
  });
});

test('BACH-V5-1 battle runtime binds Bạch Diện through the canonical Canvas Sprite owner', () => {
  const battle = read('battle.html');
  const runtime = read('scripts/bach-dien-canvas-runtime-v1.mjs');
  const roster = read('src/domain/hero/roster-view.mjs');
  assert.match(roster, /id: 'bach_dien'/);
  assert.match(battle, /drawGeneratedHero\(context, unit, time, progress\)/);
  assert.match(runtime, /function drawBachDienHero\(/);
  assert.match(runtime, /const BACH_DIEN_CLIPS=Object\.freeze/);
  assert.match(runtime, /function drawBachDienHero\(/);
  assert.match(runtime, /function drawBachDienFx\(/);
  assert.match(runtime, /BACH_DIEN_ASSET_BASE="assets\/characters\/bach-dien\/"/);
  assert.match(runtime, /BACH_DIEN_CANONICAL_ID/);
});

test('BACH-V5-2 build owner keeps the canonical runtime and avoids duplicate declarations', () => {
  const build = read('scripts/build-static.mjs');
  const owner = read('scripts/bach-dien-runtime-v6.mjs');
  assert.match(build, /await import\('\.\/bach-dien-canvas-runtime-v1\.mjs'\)/);
  assert.match(build, /await import\('\.\/bach-dien-runtime-v6\.mjs'\)/);
  assert.match(owner, /TKT-0154 Bạch Diện Canvas Sprite Runtime/);
  assert.doesNotMatch(owner, /const BACH_DIEN_META/);
});

test('BACH-V5-3 Ultra v5 package stays self-contained and uses the canonical runtime', () => {
  const meta = JSON.parse(read('assets/characters/bach-dien/runtime-meta.json'));
  assert.equal(meta.version, 'ultra-v5');
  assert.equal(meta.totalFrames, 269);
  assert.ok(Object.values(meta.clips).every(clip => clip.src.startsWith('assets/characters/bach-dien/')));
  assert.match(read('scripts/bach-dien-runtime-v6.mjs'), /canonical Canvas Sprite Runtime owner/);
});
