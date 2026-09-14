// Authored Linh Đồng combat kit. Isolated-pass RGBA from the 14/09 Drive pack.
// Character clips share one world scale and a bottom-center foot pivot.
// VFX clips share a second uniform scale. Never per-frame crop or black-key.

export const LINH_DONG_SCHEMA = 'hon-viet-linh-dong-atlas/v1';
export const LINH_DONG_ID = 'linh_dong';
export const LINH_DONG_SOURCE_IDS = Object.freeze(['linh_dong', 'hero_splus_linh_dong', 'linh-dong']);
export const LINH_DONG_ASSET_BASE = 'assets/characters/linh-dong/';
export const LINH_DONG_AUDIO_BASE = 'assets/audio/sfx/linh-dong/';

export const LINH_DONG_CHAR = Object.freeze({
  scale: 0.5,
  cellW: 328,
  cellH: 320,
  cols: 8,
  maxSourceW: 654,
  maxSourceH: 640,
  foot: 'bottom-center'
});

export const LINH_DONG_VFX = Object.freeze({
  scale: 320 / 854,
  cellW: 320,
  cellH: 180,
  cols: 10,
  sourceW: 854,
  sourceH: 480
});

export const LINH_DONG_CLIPS = Object.freeze({
  idle: { kind: 'char', file: 'idle-atlas.webp', frames: 96, fps: 24, ms: 42, loop: true, durationMs: 4000, source: 'idle/ld_idle_char_24fps_4p0s_h480.webp', sourceW: 398, sourceH: 480 },
  run: { kind: 'char', file: 'run-atlas.webp', frames: 96, fps: 24, ms: 42, loop: true, durationMs: 4000, source: 'run/ld_run_char_24fps_4p0s_h480.webp', sourceW: 396, sourceH: 480 },
  hit: { kind: 'char', file: 'hit-atlas.webp', frames: 96, fps: 24, ms: 42, loop: false, durationMs: 4000, source: 'hit/ld_hit_char_24fps_4p0s_h480.webp', sourceW: 486, sourceH: 480 },
  fall: { kind: 'char', file: 'fall-atlas.webp', frames: 96, fps: 24, ms: 42, loop: false, durationMs: 4000, source: 'fall_die/ld_fall_die_char_24fps_4p0s_h480.webp', sourceW: 564, sourceH: 480 },
  attack: { kind: 'char', file: 'basic-atlas.webp', frames: 44, fps: 30, ms: 34, loop: false, durationMs: 1500, source: 'atk/ld_atk_char_30fps_1p5s.webp', sourceW: 624, sourceH: 640 },
  skill1: { kind: 'char', file: 'basic-atlas.webp', frames: 44, fps: 30, ms: 34, loop: false, durationMs: 1500, source: 'atk/ld_atk_char_30fps_1p5s.webp', sourceW: 624, sourceH: 640 },
  ultimate: { kind: 'char', file: 'ultimate-atlas.webp', frames: 60, fps: 30, ms: 33, loop: false, durationMs: 2000, source: 'ult/ld_ult_char_30fps_2p0s.webp', sourceW: 654, sourceH: 640 },
  skill1Vfx: { kind: 'vfx', file: 'skill1_vfx-atlas.webp', frames: 120, fps: 30, ms: 33, loop: false, durationMs: 4000, source: 'vfx_sfx_atk/ld_atk_vfx_30fps_4p0s_h480.webp', sourceW: 854, sourceH: 480 },
  ultimateVfx: { kind: 'vfx', file: 'ultimate_vfx-atlas.webp', frames: 120, fps: 30, ms: 33, loop: false, durationMs: 4000, source: 'vfx_sfx_ult/ld_ult_vfx_30fps_4p0s_h480.webp', sourceW: 854, sourceH: 480 }
});

export const LINH_DONG_STILLS = Object.freeze({
  portrait: { file: 'avatar.webp', source: 'avatar/ld_avatar_portrait_rgba.webp' },
  square: { file: 'avatar-square.png', source: 'avatar/ld_avatar_square_1024.png' },
  card: { file: 'card.webp', source: 'avatar/ld_avatar_square_1024.png' },
  master: { file: 'master.webp', source: 'avatar/ld_avatar_portrait_rgba.webp' }
});

export const LINH_DONG_AUDIO = Object.freeze({
  atk: ['atk.wav', 'atk.ogg'],
  ult: ['ult.wav', 'ult.ogg']
});

export function linhDongMeta(key) {
  const clip = LINH_DONG_CLIPS[key];
  if (!clip) return null;
  const geom = clip.kind === 'vfx' ? LINH_DONG_VFX : LINH_DONG_CHAR;
  return Object.freeze({
    file: clip.file,
    frames: clip.frames,
    cols: geom.cols,
    rows: Math.ceil(clip.frames / geom.cols),
    w: geom.cellW,
    h: geom.cellH,
    ms: clip.ms,
    loop: !!clip.loop,
    durationMs: clip.durationMs
  });
}

export function isLinhDongId(value) {
  const id = String(value || '').trim();
  return LINH_DONG_SOURCE_IDS.includes(id);
}
