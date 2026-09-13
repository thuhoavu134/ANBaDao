import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const source = readFileSync(new URL('../src/ui/campaign-scene.js', import.meta.url), 'utf8');
const start = source.indexOf('const HOME_SLOT');
const end = source.indexOf('function drawScene(', start);
const pose = runInNewContext(source.slice(start, end) + '\nhomePartyPose;');

for (const [w, h] of [[390, 696], [375, 520], [620, 850]]) {
  test(`AC03 feet stay on the open road and clear of controls at ${w}x${h}`, () => {
    const positions = Array.from({ length: 6 }, (_, slot) => pose({ slot }, w, h));
    for (const p of positions) {
      assert.ok(p.y >= h * .48 && p.y <= h * .77, `foot ${p.y / h} outside road band`);
      assert.ok(p.y - p.bodyH > h * .25, 'head overlaps route heading');
      assert.ok(p.x - p.bodyH * .55 > 0 && p.x + p.bodyH * .55 < w, 'body clipped');
    }
    for (let slot = 0; slot < 3; slot++) {
      assert.ok(positions[slot].y > positions[slot + 3].y, 'front row must draw nearer');
      if (slot) assert.ok(positions[slot].x - positions[slot - 1].x >= w * .22, 'columns too crowded');
    }
    assert.deepEqual(pose({ slot: 4 }, w, h), positions[4], 'removing another hero must not move this slot');
  });
}
