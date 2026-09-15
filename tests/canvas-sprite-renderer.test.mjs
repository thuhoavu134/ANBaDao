import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

function recordingContext() {
  const calls = [];
  const ctx = {
    imageSmoothingEnabled: false,
    imageSmoothingQuality: 'low',
    save() { calls.push(['save']); },
    restore() { calls.push(['restore']); },
    translate(...args) { calls.push(['translate', ...args]); },
    scale(...args) { calls.push(['scale', ...args]); },
    drawImage(...args) { calls.push(['drawImage', ...args]); }
  };
  Object.defineProperty(ctx, 'globalAlpha', {
    get() { return this._alpha ?? 1; },
    set(v) { this._alpha = v; calls.push(['alpha', v]); }
  });
  Object.defineProperty(ctx, 'globalCompositeOperation', {
    get() { return this._blend ?? 'source-over'; },
    set(v) { this._blend = v; calls.push(['blend', v]); }
  });
  return { ctx, calls };
}

const clip = {
  frames: 44,
  cols: 8,
  rows: 6,
  cellW: 480,
  cellH: 440,
  pivot: { x: 240, y: 440 },
  logicalSize: { w: 480, h: 440 }
};

test('L151-T4 source rects for first, middle and last frame come from metadata', async () => {
  const { sourceRectForFrame, drawCanvasSprite } = await import('../src/render/canvas-sprite-renderer.mjs');
  assert.deepEqual(sourceRectForFrame(clip, 0), { sx: 0, sy: 0, sw: 480, sh: 440 });
  assert.deepEqual(sourceRectForFrame(clip, 8), { sx: 0, sy: 440, sw: 480, sh: 440 });
  assert.deepEqual(sourceRectForFrame(clip, 43), { sx: 3 * 480, sy: 5 * 440, sw: 480, sh: 440 });
  const image = { naturalWidth: 3840, naturalHeight: 2640 };
  const { ctx, calls } = recordingContext();
  const drawn = drawCanvasSprite(ctx, {
    image, clip, frame: 0, x: 100, y: 200, width: 477, height: 440, baseline: 64
  });
  assert.equal(drawn, true);
  const draw = calls.find(c => c[0] === 'drawImage');
  assert.deepEqual(draw.slice(2), [0, 0, 480, 440, -477 / 2, -440 + 64, 477, 440]);
  assert.equal(ctx.imageSmoothingEnabled, true);
  assert.equal(ctx.imageSmoothingQuality, 'high');
});

test('L151-T4 enemy flip, source-over blend, destination aspect', async () => {
  const { drawCanvasSprite } = await import('../src/render/canvas-sprite-renderer.mjs');
  const image = { naturalWidth: 3840, naturalHeight: 2640 };
  const { ctx, calls } = recordingContext();
  drawCanvasSprite(ctx, {
    image, clip, frame: 1, x: 10, y: 20, width: 477, height: 440,
    flip: true, alpha: 0.94, blendMode: 'source-over', baseline: 64
  });
  assert.ok(calls.some(c => c[0] === 'scale' && c[1] === -1 && c[2] === 1));
  assert.ok(calls.some(c => c[0] === 'blend' && c[1] === 'source-over'));
  assert.ok(calls.some(c => c[0] === 'alpha' && c[1] === 0.94));
  const draw = calls.find(c => c[0] === 'drawImage');
  assert.equal(Math.abs(draw[8] / draw[9] - 477 / 440) < 1e-9, true);
  assert.equal(draw[4], 480);
  assert.equal(draw[5], 440);
});

test('L151-T4 renderer never hard-codes old cell sizes or naturalWidth/4', () => {
  const source = read('src/render/canvas-sprite-renderer.mjs');
  assert.doesNotMatch(source, /\b347\b/);
  assert.doesNotMatch(source, /\b320\b/);
  assert.doesNotMatch(source, /\b694\b/);
  assert.doesNotMatch(source, /\b640\b/);
  assert.doesNotMatch(source, /naturalWidth\s*\/\s*4/);
  assert.doesNotMatch(source, /\bnew Image\b/);
  assert.doesNotMatch(source, /\bfetch\s*\(/);
  assert.doesNotMatch(source, /spine/i);
});

test('L151-T5 FrameClock loops, clamps, and replays the same elapsedMs', async () => {
  const { createFrameClock, frameAt } = await import('../src/assets/frame-clock.mjs');
  const loop = { frames: 96, ms: 42, loop: true, fps: 24, durationMs: 4032 };
  const once = { frames: 44, ms: 34, loop: false, durationMs: 1496 };
  assert.equal(frameAt(loop, 0), 0);
  assert.equal(frameAt(loop, 42), 1);
  assert.equal(frameAt(loop, 42 * 8), 8);
  assert.equal(frameAt(loop, 42 * 96), 0);
  assert.equal(frameAt(once, 0), 0);
  assert.equal(frameAt(once, 34 * 43), 43);
  assert.equal(frameAt(once, 34 * 80), 43);
  const clock = createFrameClock({ now: () => 1000 });
  const a = [0, 120, 420, 1496].map(ms => clock.frameAt(once, ms));
  const b = [0, 120, 420, 1496].map(ms => clock.frameAt(once, ms));
  assert.deepEqual(a, b);
  assert.equal(clock.frameAt(once, 1320), clock.frameAt(once, 1320));
});

test('L151-T6 battle adapter keeps 477×440 destination and combined VFX source-over', () => {
  const patch = read('scripts/linh-dong-timing-main-v1.mjs');
  assert.match(patch, /drawCanvasSprite/);
  assert.match(patch, /477,440/);
  assert.match(patch, /baseline:64/);
  assert.match(patch, /blend:'source-over'|blend:"source-over"/);
  assert.doesNotMatch(patch, /Object\.keys\(LINH_DONG_CLIPS\)\.forEach\(linhDongImage\)/);
  const domain = read('src/domain/character/linh-dong.mjs');
  assert.match(domain, /drawW: 477/);
  assert.match(domain, /drawH: 440/);
  assert.doesNotMatch(read('src/domain/combat/splus-mechanics.mjs'), /canvas-sprite-runtime/);
});
