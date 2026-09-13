import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
const source = readFileSync(new URL('../src/ui/campaign-scene.js', import.meta.url), 'utf8');
const chunk = source.slice(source.indexOf('const HOME_SLOT'), source.indexOf('function drawScene('));

test('AC11 minimap viewport is the inverse of the actual world projection', () => {
  const api = runInNewContext(chunk + '\n({ campaignMapView, homePartyPose });');
  for (const [w,h] of [[390,696],[375,520],[620,850]]) {
    const view = api.campaignMapView(w,h);
    const rect = view.viewport;
    assert.ok(Math.abs(rect.x * view.width + view.left) < .001);
    assert.ok(Math.abs(rect.y * view.height + view.top) < .001);
    assert.ok(Math.abs(rect.width * view.width - w) < .001);
    assert.ok(Math.abs(rect.height * view.height - h) < .001);
    assert.ok(rect.x >= 0 && rect.y >= 0 && rect.x+rect.width <= 1 && rect.y+rect.height <= 1);
    for (let slot=0;slot<6;slot++) {
      const p=api.homePartyPose({slot},w,h);
      assert.ok(Math.abs(p.x-(view.left+p.worldX*view.width)) < .001);
      assert.ok(Math.abs(p.y-(view.top+p.worldY*view.height)) < .001);
    }
  }
});

test('AC11 map and scene share art; map opens and closes through the existing scene handler', () => {
  assert.match(source, /data-scene-action="open-map"/);
  assert.match(source, /sceneAction === 'close-map'/);
  assert.match(source, /cs-map-sheet/);
  assert.match(source, /data-map-viewport/);
  assert.doesNotMatch(source, /document\.addEventListener\(['"]click/);
});
