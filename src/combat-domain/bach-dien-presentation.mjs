// Bạch Diện presentation contract. Combat math stays in splus-mechanics.
// Timing comes from the agent pack: 94 frames at 30fps, duration 3133.333ms.
// Combined ATK/Ultimate VFX, no projectile/impact split, no Spine.

export const BACH_DIEN_CANONICAL_ID = 'hero_splus_bach_dien';
export const BACH_DIEN_HERO_ALIASES = Object.freeze([
  'bach_dien',
  'bach-dien',
  'hero_splus_bach_dien'
]);

export const BACH_DIEN_ACTION_ALIASES = Object.freeze({
  atk: 'atk',
  basic: 'atk',
  normal: 'atk',
  skill: 'atk',
  skill1: 'atk',
  ultimate: 'ultimate',
  ult: 'ultimate'
});

const PACK_FPS = 30;
const PACK_FRAMES = 94;
const PACK_MS = 1000 / PACK_FPS;
const PACK_DURATION_MS = 3133.333;

export const BACH_DIEN_TIMELINE = Object.freeze({
  atk: Object.freeze({
    character: Object.freeze({
      file: 'basic-atlas.webp',
      frames: PACK_FRAMES,
      frameMs: PACK_MS,
      durationMs: PACK_DURATION_MS
    }),
    combinedVfx: Object.freeze({
      file: 'skill1_vfx-atlas.webp',
      frames: PACK_FRAMES,
      frameMs: PACK_MS,
      sourceDurationMs: PACK_DURATION_MS
    }),
    sfx: 'assets/audio/sfx/bach-dien/atk.wav',
    releaseMs: 800,
    impactMs: 1600,
    recoveryEndMs: PACK_DURATION_MS
  }),
  ultimate: Object.freeze({
    character: Object.freeze({
      file: 'ultimate-atlas.webp',
      frames: PACK_FRAMES,
      frameMs: PACK_MS,
      durationMs: PACK_DURATION_MS
    }),
    combinedVfx: Object.freeze({
      file: 'ultimate_vfx-atlas.webp',
      frames: PACK_FRAMES,
      frameMs: PACK_MS,
      sourceDurationMs: PACK_DURATION_MS
    }),
    sfx: 'assets/audio/sfx/bach-dien/ult.wav',
    releaseMs: 800,
    impactMs: 1600,
    recoveryEndMs: PACK_DURATION_MS
  })
});

export const BACH_DIEN_REGISTRY = Object.freeze({
  id: BACH_DIEN_CANONICAL_ID,
  states: Object.freeze(['idle', 'run', 'hit', 'fall']),
  actions: Object.freeze({
    atk: Object.freeze({
      character: 'assets/characters/bach-dien/basic-atlas.webp',
      combinedVfx: 'assets/characters/bach-dien/skill1_vfx-atlas.webp',
      sfx: 'assets/audio/sfx/bach-dien/atk.wav',
      timeline: BACH_DIEN_TIMELINE.atk
    }),
    ultimate: Object.freeze({
      character: 'assets/characters/bach-dien/ultimate-atlas.webp',
      combinedVfx: 'assets/characters/bach-dien/ultimate_vfx-atlas.webp',
      sfx: 'assets/audio/sfx/bach-dien/ult.wav',
      timeline: BACH_DIEN_TIMELINE.ultimate
    })
  })
});

export function normalizeBachDienHeroId(value) {
  const raw = String(value ?? '').trim();
  return /^(?:bach_dien|bach-dien|hero_splus_bach_dien)$/i.test(raw) ? BACH_DIEN_CANONICAL_ID : raw;
}

export function normalizeBachDienAction(value) {
  const token = String(value ?? '').trim().toLowerCase();
  return BACH_DIEN_ACTION_ALIASES[token] || null;
}

export function createBachDienTimelineController(action, options = {}) {
  const timeline = options.timeline || BACH_DIEN_TIMELINE[action];
  if (!timeline) throw new Error('Missing Bạch Diện timeline for ' + action);
  let elapsedMs = 0;
  const onMarker = options.onMarker;
  const markers = [
    { type: 'release', at: timeline.releaseMs },
    { type: 'impact', at: timeline.impactMs },
    { type: 'recovery:end', at: timeline.recoveryEndMs }
  ];
  const fired = new Set();
  return {
    elapsedMs() { return elapsedMs; },
    advance(nextElapsed) {
      elapsedMs = Math.max(0, Number(nextElapsed) || 0);
      for (const marker of markers) {
        if (elapsedMs >= marker.at && !fired.has(marker.type)) {
          fired.add(marker.type);
          onMarker?.(marker);
        }
      }
      return elapsedMs;
    }
  };
}
