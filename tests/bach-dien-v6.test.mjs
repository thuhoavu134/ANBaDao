import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const exists = rel => fs.existsSync(path.join(root, rel));

test('Bạch Diện Kiếm Thế six-state package assets and runtime metadata are complete', () => {
  const meta = JSON.parse(read('assets/characters/bach-dien/runtime-meta.json'));
  assert.equal(meta.heroId, 'hero_splus_bach_dien');
  assert.ok(Object.keys(meta.clips).length >= 6);
  assert.equal(meta.clips.idle.frames, 30);
  assert.equal(meta.clips.run.frames, 18);
  assert.equal(meta.clips.basic.frames, 18);
  assert.equal(meta.clips.ultimate.frames, 18);
  assert.equal(meta.clips.hit.frames, 18);
  assert.equal(meta.clips['fall-die'].frames, 18);
  assert.ok(exists('assets/characters/bach-dien/' + meta.detail.file));
  for (const c of Object.values(meta.clips)) {
    assert.ok(exists('assets/characters/bach-dien/' + c.file), c.file);
  }
});
