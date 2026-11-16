import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { getClip } from '../src/assets/asset-catalog.mjs';
import { drawCanvasSprite } from '../src/render/canvas-sprite-renderer.mjs';
import { battleCharacterScaleForViewport, battleCharacterDepthScale } from '../scripts/battle-formation-scale-v1.mjs';

async function visibleHeight(src, cellW, cellH, frame = 0, cols = 8) {
  const { data } = await sharp(src).extract({ left: (frame % cols) * cellW, top: Math.floor(frame / cols) * cellH, width: cellW, height: cellH })
    .ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let top = cellH, bottom = 0;
  for (let y = 0; y < cellH; y++) for (let x = 0; x < cellW; x++) {
    if (data[(y * cellW + x) * 4 + 3] > 100) { top = Math.min(top, y); bottom = Math.max(bottom, y + 1); }
  }
  return bottom - top;
}

test('real Linh Đồng/Bạch Diện bodies match mixed-roster peers at the same depth, in both teams and viewports', async () => {
  // Compare character height, not alpha-box diagonal: hats, bells and stray
  // particles can widen a clip without making its body taller.
  const peers = [
    { id: 'ong_pho', height: await visibleHeight('dist/assets/battle-runtime/embedded-12.png', 240, 135) * (620 / 240) },
    { id: 'dinh_loi', height: await visibleHeight('assets/characters/dinh-loi/idle-atlas.png', 480, 270) * (348 / 270) }
  ];
  for (const hero of ['linh_dong', 'bach_dien']) for (const action of ['idle', 'attack', 'ultimate']) {
    const clip = getClip(hero, action);
    let destH;
    drawCanvasSprite({ save() {}, restore() {}, translate() {}, scale() {}, drawImage(...args) { destH = args[8]; } },
      { image: {}, clip, width: 477, height: 440, baseline: 64 });
    const body = await visibleHeight(clip.src, clip.cellW, clip.cellH) * destH / clip.cellH;
    for (const team of ['player', 'enemy']) for (const baseY of [340, 520, 700]) {
      const unit = { id: `${team}-slot`, sourceId: `${team}-arena`, sourceHeroId: hero, team, baseY, y: 400 };
      for (const [width, height] of [[390, 739], [393, 747], [430, 827], [1280, 800]]) {
        const actual = body * battleCharacterScaleForViewport(unit, width, height) * battleCharacterDepthScale(unit);
        for (const peer of peers) {
          const expected = peer.height * battleCharacterScaleForViewport(peer.id, width, height) * battleCharacterDepthScale(unit);
          const ratio = actual / expected;
          // Owner 2026-11-16: Ong Pho (golden carry) is deliberately drawn larger than the
          // roster; S+ bodies must match regular peers and never exceed Ong Pho.
          if (peer.id === 'ong_pho') { assert.ok(ratio <= 1, `${hero}/${action}/${team}/${baseY}/${width}: ${ratio.toFixed(3)} of ${peer.id}`); continue; }
          assert.ok(ratio >= .95 && ratio <= 1.08, `${hero}/${action}/${team}/${baseY}/${width}: ${ratio.toFixed(3)} of ${peer.id}`);
        }
      }
    }
  }
});
