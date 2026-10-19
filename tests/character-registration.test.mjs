import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { getClip } from '../src/assets/asset-catalog.mjs';
import { drawCanvasSprite } from '../src/render/canvas-sprite-renderer.mjs';

function destination(clip, frame = 0, flip = false, image = {}) {
  const calls = [];
  const ctx = { save() {}, restore() {}, translate() {}, scale(...args) { calls.push(['scale', ...args]); },
    drawImage(...args) { calls.push(['draw', ...args]); } };
  assert.equal(drawCanvasSprite(ctx, { image, clip, frame, width: 477, height: 440, baseline: 64, flip }), true);
  return { rect: calls.find(c => c[0] === 'draw').slice(6), calls };
}

async function firstPose(clip) {
  const { data, info } = await sharp(clip.src).extract({ left: 0, top: 0, width: clip.cellW, height: clip.cellH })
    .ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let top = info.height, bottom = 0;
  for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) {
    if (data[(y * info.width + x) * 4 + 3] > 100) { top = Math.min(top, y); bottom = Math.max(bottom, y + 1); }
  }
  const [dx, dy, dw, dh] = destination(clip).rect;
  return { height: (bottom - top) * dh / clip.cellH, footY: dy + bottom * dh / clip.cellH };
}

for (const hero of ['linh_dong', 'bach_dien']) {
  test(`${hero}: real Idle / ATK / Ultimate opening poses keep body size and ground contact`, async () => {
    const idle = await firstPose(getClip(hero, 'idle'));
    for (const action of ['attack', 'ultimate']) {
      const pose = await firstPose(getClip(hero, action));
      assert.ok(Math.abs(pose.height / idle.height - 1) < (hero === 'bach_dien' && action === 'attack' ? 0.15 : 0.03), `${action} height ${pose.height} vs Idle ${idle.height}`);
      assert.ok(Math.abs(pose.footY - idle.footY) < 3, `${action} foot ${pose.footY} vs Idle ${idle.footY}`);
    }
  });
}

test('registration is constant through every clip; variants and decoded downsampling keep destination geometry', () => {
  for (const hero of ['linh_dong', 'bach_dien']) for (const action of ['idle', 'run', 'hurt', 'defeated', 'attack', 'ultimate']) {
    const clip = getClip(hero, action);
    assert.ok(clip.registration, `${hero}/${action}: missing registration`);
    const native = destination(clip).rect;
    assert.deepEqual(destination(clip, clip.frames - 1).rect, native);
    assert.deepEqual(destination({ ...clip, cellW: clip.cellW / 2, cellH: clip.cellH / 2 }).rect, native);
    assert.deepEqual(destination(clip, 0, false, { __hvAtlasScale: 0.5 }).rect, native);
    const enemy = destination(clip, 0, true);
    assert.deepEqual(enemy.rect, native);
    assert.deepEqual(enemy.calls.filter(c => c[0] === 'scale'), [['scale', -1, 1]]);
    assert.ok(Math.abs(native[2] / native[3] - 477 / 440) < 1e-10, 'uniform scale, no stretching');
  }
});

test('character registration does not resize the authored VFX', () => {
  for (const hero of ['linh_dong', 'bach_dien']) for (const action of ['skill1Vfx', 'ultimateVfx']) {
    const clip = getClip(hero, action);
    assert.equal(clip.registration, undefined);
    assert.deepEqual(destination(clip).rect, [-238.5, -376, 477, 440]);
  }
});
