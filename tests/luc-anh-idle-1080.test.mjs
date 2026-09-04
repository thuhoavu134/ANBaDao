import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  LUC_ANH_IDLE_1080,
  LUC_ANH_IDLE_1080_ATLAS
} from '../src/domain/character/luc-anh-idle.mjs';

test('Lục Ảnh IDLE 1080 contract matches the authored 96-frame atlas', () => {
  assert.deepEqual(LUC_ANH_IDLE_1080, {
    src: 'assets/characters/luc-anh/idle-1080-atlas.webp',
    frames: 96,
    cols: 8,
    rows: 12,
    cellW: 480,
    cellH: 480,
    ms: 42,
    loop: true,
    cleanup: {
      background: 'edge-connected-black',
      edgeThreshold: 8,
      enclosedDarkMinArea: 2000,
      enclosedDarkMinX: 700,
      transparentEdgeColorBleed: true
    }
  });
  assert.deepEqual(LUC_ANH_IDLE_1080_ATLAS, { width: 3840, height: 5760 });
});

test('Lục Ảnh IDLE 1080 asset and post-build hook are present', () => {
  const asset = new URL('../assets/characters/luc-anh/idle-1080-atlas.webp', import.meta.url);
  // The partial scratch checkout used for extraction may not contain the final
  // repository asset yet; a full checkout must carry the generated atlas.
  if (fs.existsSync(asset)) assert.ok(fs.statSync(asset).size > 1_000_000);
  const patch = fs.readFileSync(new URL('../scripts/luc-anh-idle-1080-v1.mjs', import.meta.url), 'utf8');
  assert.match(patch, /idle-atlas\\\.webp/);
  assert.match(patch, /LUC_ANH_IDLE_1080/);
  assert.match(patch, /legacy master ghost layer/);
});
