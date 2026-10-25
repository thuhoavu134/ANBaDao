// Owner 2026-10-25: bảng rơi trang bị đã chốt - phó bản cày đều, Săn Boss Mộng ra đồ xịn hơn.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  STAGE_DROP, CHAPTER_BOSS_DROP, HUNT_GEAR_DROP, BOSS_PITY, HUNT_PITY,
  rollStageDrop, rollBossDrop, rollHuntDrop, buildDropItem
} from '../src/domain/equipment/gear-drops.mjs';

const seq = values => { let i = 0; return () => values[Math.min(i++, values.length - 1)]; };
const always = value => () => value;

test('bảng rơi khớp số đã duyệt', () => {
  assert.equal(STAGE_DROP.normal.chance, 0.30);
  assert.deepEqual({ ...STAGE_DROP.normal.table }, { b: 80, a: 20 });
  assert.equal(STAGE_DROP.elite.chance, 0.60);
  assert.deepEqual({ ...STAGE_DROP.elite.table }, { b: 55, a: 35, s: 10 });
  assert.equal(CHAPTER_BOSS_DROP.length, 6);
  assert.deepEqual({ ...CHAPTER_BOSS_DROP[0] }, { s: 80, ss: 18, ssr: 2 });
  assert.deepEqual({ ...CHAPTER_BOSS_DROP[5] }, { s: 32, ss: 45, ssr: 23 });
  assert.deepEqual({ ...HUNT_GEAR_DROP.ca_voi_nuot_trang }, { s: 55, ss: 35, ssr: 10 });
  assert.deepEqual({ ...HUNT_GEAR_DROP.dong_ho_cat_vo }, { s: 25, ss: 45, ssr: 30 });
  assert.equal(BOSS_PITY, 25);
  assert.equal(HUNT_PITY, 10);
});

test('quái thường: 30% rơi, chỉ ra b/a', () => {
  assert.equal(rollStageDrop({ kind: 'normal', rng: always(0.5) }), null, 'ngoài 30% thì không rơi');
  for (const r of [0.0, 0.1, 0.29]) {
    const rar = rollStageDrop({ kind: 'normal', rng: seq([r, r]) });
    assert.ok(rar === 'b' || rar === 'a', 'phải là b/a, nhận ' + rar);
  }
  // 10% đầu của bảng = 80% b
  assert.equal(rollStageDrop({ kind: 'normal', rng: seq([0.0, 0.5]) }), 'b');
  assert.equal(rollStageDrop({ kind: 'normal', rng: seq([0.0, 0.9]) }), 'a');
});

test('tinh anh: 60% rơi, có thể ra s', () => {
  assert.equal(rollStageDrop({ kind: 'elite', rng: always(0.7) }), null);
  assert.equal(rollStageDrop({ kind: 'elite', rng: seq([0.0, 0.95]) }), 's');
});

test('boss chương: ssr tăng dần, chương ngoài dải bị kẹp', () => {
  assert.equal(rollBossDrop({ chapter: 1, rng: always(0.999) }).rar, 'ssr');
  assert.notEqual(rollBossDrop({ chapter: 1, rng: always(0.0) }).rar, 'ssr');
  assert.equal(rollBossDrop({ chapter: 99, rng: always(0.999) }).rar, 'ssr');
  assert.equal(rollBossDrop({ chapter: 0, rng: always(0.0) }).rar, 's');
});

test('bảo hiểm boss chương: lần 25 chắc chắn ssr và reset', () => {
  // 25 lần trượt thì lần kế tiếp chắc chắn ssr (đúng ý chủ dự án: lần thứ 26)
  assert.equal(rollBossDrop({ chapter: 1, pity: BOSS_PITY - 1, rng: always(0.0) }).floor, false);
  const hit = rollBossDrop({ chapter: 1, pity: BOSS_PITY, rng: always(0.0) });
  assert.equal(hit.floor, true);
  assert.equal(hit.rar, 'ssr');
  assert.equal(hit.pity, 0);
  const miss = rollBossDrop({ chapter: 1, pity: 3, rng: always(0.0) });
  assert.equal(miss.pity, 4);
});

test('săn boss: lượt đầu ngày ít nhất ss, bảo hiểm 10 lượt, quá cap thì dễ xuống phẩm', () => {
  const low = rollHuntDrop({ bossId: 'dong_ho_cat_vo', firstOfDay: true, rng: seq([0.99, 0.9]) });
  assert.ok(['ss', 'ssr'].includes(low.rar), 'lượt đầu phải >= ss, nhận ' + low.rar);
  const floorHit = rollHuntDrop({ bossId: 'ca_voi_nuot_trang', pity: HUNT_PITY });
  assert.equal(floorHit.rar, 'ssr');
  assert.equal(floorHit.pity, 0);
  const overCap = rollHuntDrop({ bossId: 'dong_ho_cat_vo', firstOfDay: false, overCap: true, rng: seq([0.99, 0.1, 0.1]) });
  assert.notEqual(overCap.rar, 'ssr', 'quá cap thì dễ tụt phẩm');
});

test('buildDropItem: đồ phó bản 1 dòng, đồ săn boss 3 dòng', () => {
  const craft = (args) => (args.source === 'boss' ? [{ k: 'hp', v: 1, spec: false }, { k: 'def', v: 1, spec: false }, { k: 'crit', v: 1, spec: true }] : [{ k: 'hp', v: 1, spec: false }]);
  const stage = buildDropItem({ uid: 5, slot: 'weapon', rar: 'b', source: 'stage', rollAffixes: craft });
  assert.equal(stage.from, 'stage');
  assert.equal(stage.affixes.length, 1);
  const boss = buildDropItem({ uid: 6, slot: 'armor', rar: 'ssr', source: 'boss', rollAffixes: craft });
  assert.equal(boss.from, 'boss');
  assert.equal(boss.affixes.length, 3);
  assert.equal(boss.affixes.filter(a => a.spec).length, 1);
  assert.equal(buildDropItem({ uid: 0, slot: 'armor', rar: 'b' }), null);
  assert.equal(buildDropItem({ uid: 7, slot: 'armor', rar: 'la' }), null);
});
