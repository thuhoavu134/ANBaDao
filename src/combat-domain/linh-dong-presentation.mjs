// Canonical Linh Đồng presentation contract.
// Combat math remains owned by the existing domain; this module only maps the
// authored animation/VFX/SFX channels to one deterministic presentation clock.

export const LINH_DONG_CANONICAL_ID = 'hero_splus_linh_dong';
export const LINH_DONG_HERO_ALIASES = Object.freeze([
  'linh_dong',
  'linh-dong',
  'hero_splus_linh_dong'
]);

export const LINH_DONG_ACTION_ALIASES = Object.freeze({
  atk: 'atk',
  basic: 'atk',
  normal: 'atk',
  skill: 'atk',
  skill1: 'atk',
  ultimate: 'ultimate',
  ult: 'ultimate'
});

// The source atlases are 1.496s and 1.980s in the canonical q82 pack. The
// VFX atlases retain their source frame grids, but runtime presentation ends
// at recoveryEndMs instead of playing the four-second source duration.
export const LINH_DONG_TIMELINE = Object.freeze({
  atk: Object.freeze({
    character: Object.freeze({
      file: 'basic-atlas.webp',
      frames: 44,
      frameMs: 34,
      durationMs: 1496
    }),
    combinedVfx: Object.freeze({
      file: 'skill1_vfx-atlas.webp',
      frames: 120,
      frameMs: 33,
      sourceDurationMs: 4000
    }),
    sfx: 'assets/audio/sfx/linh-dong/atk.wav',
    releaseMs: 420,
    impactMs: 1320,
    recoveryEndMs: 1496
  }),
  ultimate: Object.freeze({
    character: Object.freeze({
      file: 'ultimate-atlas.webp',
      frames: 60,
      frameMs: 33,
      durationMs: 1980
    }),
    combinedVfx: Object.freeze({
      file: 'ultimate_vfx-atlas.webp',
      frames: 120,
      frameMs: 33,
      sourceDurationMs: 4000
    }),
    sfx: 'assets/audio/sfx/linh-dong/ult.wav',
    releaseMs: 400,
    impactMs: 1600,
    recoveryEndMs: 1980
  })
});

export const LINH_DONG_REGISTRY = Object.freeze({
  id: LINH_DONG_CANONICAL_ID,
  states: Object.freeze(['idle', 'run', 'hit', 'fall']),
  actions: Object.freeze({
    atk: Object.freeze({
      character: 'assets/characters/linh-dong/basic-atlas.webp',
      combinedVfx: 'assets/characters/linh-dong/skill1_vfx-atlas.webp',
      sfx: 'assets/audio/sfx/linh-dong/atk.wav',
      timeline: LINH_DONG_TIMELINE.atk
    }),
    ultimate: Object.freeze({
      character: 'assets/characters/linh-dong/ultimate-atlas.webp',
      combinedVfx: 'assets/characters/linh-dong/ultimate_vfx-atlas.webp',
      sfx: 'assets/audio/sfx/linh-dong/ult.wav',
      timeline: LINH_DONG_TIMELINE.ultimate
    })
  })
});

const normalizeToken = value => String(value ?? '').trim().toLowerCase();

export function normalizeLinhDongHeroId(value) {
  const raw = String(value ?? '').trim();
  return LINH_DONG_HERO_ALIASES.includes(normalizeToken(raw))
    ? LINH_DONG_CANONICAL_ID
    : raw;
}

export function isLinhDongHeroId(value) {
  return normalizeLinhDongHeroId(value) === LINH_DONG_CANONICAL_ID;
}

export function normalizeLinhDongAction(value) {
  return LINH_DONG_ACTION_ALIASES[normalizeToken(value)] ?? null;
}

export function toLegacyCombatAction(value) {
  const action = normalizeLinhDongAction(value);
  return action === 'atk' ? 'basic' : action;
}

export function buildLinhDongMarkerSequence(action) {
  const normalized = normalizeLinhDongAction(action);
  if (!normalized) return [];
  const timeline = LINH_DONG_TIMELINE[normalized];
  return Object.freeze([
    Object.freeze({ type: 'animation:start', elapsedMs: 0 }),
    Object.freeze({ type: 'release', elapsedMs: timeline.releaseMs, channels: Object.freeze(['sfx', 'combinedVfx']) }),
    Object.freeze({ type: 'impact', elapsedMs: timeline.impactMs, channels: Object.freeze(['damage', 'status']) }),
    Object.freeze({ type: 'recovery:end', elapsedMs: timeline.recoveryEndMs, channels: Object.freeze(['character', 'combinedVfx']) })
  ]);
}

export function createLinhDongTimelineController(action, { timeline, onMarker } = {}) {
  const normalized = normalizeLinhDongAction(action);
  const spec = timeline ?? (normalized ? LINH_DONG_TIMELINE[normalized] : null);
  if (!normalized || !spec) throw new Error(`Unsupported Linh Đồng action: ${action}`);
  let lastElapsedMs = 0;
  const fired = new Set();
  const events = buildLinhDongMarkerSequence(normalized);
  return {
    action: normalized,
    events,
    elapsedMs: () => lastElapsedMs,
    advance(elapsedMs) {
      const next = Math.max(lastElapsedMs, Math.max(0, Number(elapsedMs) || 0));
      lastElapsedMs = next;
      for (const marker of events) {
        if (marker.elapsedMs > next || fired.has(marker.type)) continue;
        fired.add(marker.type);
        onMarker?.(marker, next);
      }
      return lastElapsedMs;
    },
    hasFired(type) {
      return fired.has(type);
    },
    done() {
      return lastElapsedMs >= spec.recoveryEndMs;
    }
  };
}

