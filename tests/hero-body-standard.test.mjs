import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BATTLE_HERO_BODY_HEIGHT,
  battleCharacterScaleForViewport,
  battleCharacterDepthScale
} from '../scripts/battle-formation-scale-v1.mjs';

// Fixed standing-body measurements, not current-pose alpha bounds. These
// heights are the painters' common local body space after clip registration.
const authored = [
  ['bach_dien', 395], ['linh_dong', 335], ['ky_van', 413],
  ['tieu_phong', 413], ['tich_dao', 423], ['hong_thuong', 423],
  ['luc_anh',330*199/240], ['thay_mo',348*250/264],
  ['ong_hang_pho',103*348.75/135], ['dinh_loi',117*348/135]
];
for (const [id, nativeBodyHeight] of authored) {
  test(`${id}: idle, attack and ultimate share the Bạch Diện battle stature`, () => {
    for (const [width, height, viewportScale] of [[390, 739, .34], [1280, 528, .74]]) {
      for (const team of ['player', 'enemy']) {
        const unit = { id: `${team}-slot-0`, sourceId: 'arena-temporary-id', sourceHeroId: id, team, baseY: 520 };
        const expected = BATTLE_HERO_BODY_HEIGHT * viewportScale * battleCharacterDepthScale(unit);
        for (const [state, y] of [['idle', 520], ['attack', 340], ['ultimate', 700]]) {
          const moving = { ...unit, state, y };
          const actual = nativeBodyHeight * battleCharacterScaleForViewport(moving, width, height) * battleCharacterDepthScale(moving);
          assert.ok(Math.abs(actual - expected) < 1e-7, `${id} ${state}: body ${actual}, reference ${expected}`);
        }
      }
    }
  });
}
