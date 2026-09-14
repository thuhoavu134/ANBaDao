import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LINH_DONG_CANONICAL_ID,
  LINH_DONG_REGISTRY,
  LINH_DONG_TIMELINE,
  buildLinhDongMarkerSequence,
  createLinhDongTimelineController,
  isLinhDongHeroId,
  normalizeLinhDongAction,
  normalizeLinhDongHeroId,
  toLegacyCombatAction
} from '../src/combat-domain/linh-dong-presentation.mjs';

test('Linh Đồng aliases normalize before registry and policy lookup', () => {
  for (const alias of ['linh_dong', 'linh-dong', 'hero_splus_linh_dong', 'LINH-DONG']) {
    assert.equal(normalizeLinhDongHeroId(alias), LINH_DONG_CANONICAL_ID);
    assert.equal(isLinhDongHeroId(alias), true);
  }
  assert.equal(normalizeLinhDongHeroId('luc_anh'), 'luc_anh');
});

test('legacy action aliases expose only ATK and Ultimate at runtime', () => {
  for (const alias of ['atk', 'basic', 'normal', 'skill', 'skill1']) assert.equal(normalizeLinhDongAction(alias), 'atk');
  for (const alias of ['ultimate', 'ult']) assert.equal(normalizeLinhDongAction(alias), 'ultimate');
  assert.equal(toLegacyCombatAction('skill1'), 'basic');
  assert.equal(toLegacyCombatAction('ultimate'), 'ultimate');
  assert.deepEqual(Object.keys(LINH_DONG_REGISTRY.actions), ['atk', 'ultimate']);
  assert.deepEqual(LINH_DONG_REGISTRY.states, ['idle', 'run', 'hit', 'fall']);
  for (const action of Object.values(LINH_DONG_REGISTRY.actions)) {
    assert.ok(action.character);
    assert.ok(action.combinedVfx);
    assert.ok(action.sfx);
    assert.equal('projectile' in action, false);
    assert.equal('impactVfx' in action, false);
    assert.equal('impactSfx' in action, false);
  }
});

test('authored durations and VFX recovery boundaries are preserved', () => {
  assert.equal(LINH_DONG_TIMELINE.atk.character.durationMs, 1496);
  assert.equal(LINH_DONG_TIMELINE.ultimate.character.durationMs, 1980);
  for (const action of ['atk', 'ultimate']) {
    const timeline = LINH_DONG_TIMELINE[action];
    assert.ok(timeline.releaseMs < timeline.impactMs);
    assert.ok(timeline.impactMs < timeline.recoveryEndMs);
    assert.equal(timeline.recoveryEndMs, timeline.character.durationMs);
    assert.equal(timeline.combinedVfx.sourceDurationMs, 4000);
    assert.notEqual(timeline.recoveryEndMs, timeline.combinedVfx.sourceDurationMs);
    assert.deepEqual(buildLinhDongMarkerSequence(action).map(marker => marker.type), ['animation:start', 'release', 'impact', 'recovery:end']);
  }
});

test('one monotonic elapsed clock dedupes all markers', () => {
  const seen = [];
  const controller = createLinhDongTimelineController('normal', { onMarker: marker => seen.push(marker.type) });
  controller.advance(0);
  controller.advance(900);
  controller.advance(500);
  controller.advance(1496);
  controller.advance(5000);
  assert.deepEqual(seen, ['animation:start', 'release', 'impact', 'recovery:end']);
  assert.equal(controller.elapsedMs(), 5000);
  assert.equal(controller.hasFired('impact'), true);
  assert.equal(controller.done(), true);
});

test('replay with the same clock samples yields the same marker sequence', () => {
  const samples = [0, 120, 420, 760, 1320, 1496];
  const replay = () => {
    const events = [];
    const controller = createLinhDongTimelineController('atk', { onMarker: marker => events.push([marker.type, marker.elapsedMs]) });
    for (const sample of samples) controller.advance(sample);
    return events;
  };
  assert.deepEqual(replay(), replay());
  assert.deepEqual(replay(), [['animation:start', 0], ['release', 420], ['impact', 1320], ['recovery:end', 1496]]);
});
