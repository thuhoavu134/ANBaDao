// Authored Linh Đồng combat kit. Isolated-pass RGBA from the 14/09 Drive pack.
// Character clips share one world scale and a bottom-center foot pivot.
// VFX clips share a second uniform scale. Never per-frame crop or black-key.

export const LINH_DONG_SCHEMA = 'hon-viet-linh-dong-atlas/v1';
export const LINH_DONG_ID = 'linh_dong';
export const LINH_DONG_SOURCE_IDS = Object.freeze(['linh_dong', 'hero_splus_linh_dong', 'linh-dong']);
export const LINH_DONG_ASSET_BASE = 'assets/characters/linh-dong/';
export const LINH_DONG_AUDIO_BASE = 'assets/audio/sfx/linh-dong/';

export const LINH_DONG_CHAR = Object.freeze({
  scale: 1,
  cellW: 480,
  cellH: 440,
  cols: 8,
  maxSourceW: 960,
  maxSourceH: 880,
  foot: 'bottom-center'
});

// Keep the existing gameplay footprint while supplying a native-size source cell,
// so the renderer downsamples the authored character instead of upscaling it.
const LINH_DONG_CELL_TO_FIELD = 1;
export const LINH_DONG_FIELD = Object.freeze({
  multiplier: LINH_DONG_CELL_TO_FIELD,
  drawW: 477,
  drawH: 440,
  baseline: 64
});

export const LINH_DONG_VFX = Object.freeze({
  scale: 440 / 1174,
  cellW: 440,
  cellH: 248,
  cols: 10,
  sourceW: 1174,
  sourceH: 662
});

export const LINH_DONG_CLIPS = Object.freeze({
  idle: { kind: 'char', file: 'idle-atlas.webp', frames: 96, fps: 24, ms: 42, loop: true, durationMs: 4000, source: 'Blender 5.1 master idle 1920x1080', sourceW: 960, sourceH: 880 },
  run: { kind: 'char', file: 'run-atlas.webp', frames: 96, fps: 24, ms: 42, loop: true, durationMs: 4000, source: 'Blender 5.1 master run 1920x1080', sourceW: 960, sourceH: 880 },
  hit: { kind: 'char', file: 'hit-atlas.webp', frames: 96, fps: 24, ms: 42, loop: false, durationMs: 4000, source: 'Blender 5.1 master hit 1920x1080', sourceW: 960, sourceH: 880 },
  fall: { kind: 'char', file: 'fall-atlas.webp', frames: 96, fps: 24, ms: 42, loop: false, durationMs: 4000, source: 'Blender 5.1 master fall 1920x1080', sourceW: 960, sourceH: 880 },
  attack: { kind: 'char', file: 'basic-atlas.webp', frames: 44, fps: 30, ms: 34, loop: false, durationMs: 1500, source: 'Blender 5.1 master ATK 1920x1080', sourceW: 960, sourceH: 880 },
  skill1: { kind: 'char', file: 'basic-atlas.webp', frames: 44, fps: 30, ms: 34, loop: false, durationMs: 1500, source: 'Blender 5.1 master ATK 1920x1080', sourceW: 960, sourceH: 880 },
  ultimate: { kind: 'char', file: 'ultimate-atlas.webp', frames: 60, fps: 30, ms: 33, loop: false, durationMs: 2000, source: 'Blender 5.1 master Ultimate 1920x1080', sourceW: 960, sourceH: 880 },
  skill1Vfx: { kind: 'vfx', file: 'skill1_vfx-atlas.webp', frames: 120, fps: 30, ms: 33, loop: false, durationMs: 4000, source: 'Blender 5.1 master VFX ATK 1920x1080', sourceW: 1174, sourceH: 662 },
  ultimateVfx: { kind: 'vfx', file: 'ultimate_vfx-atlas.webp', frames: 120, fps: 30, ms: 33, loop: false, durationMs: 4000, source: 'Blender 5.1 master VFX Ultimate 1920x1080', sourceW: 1174, sourceH: 662 }
});

export const LINH_DONG_STILLS = Object.freeze({
  portrait: { file: 'avatar.webp', source: 'avatar/ld_avatar_portrait_rgba.webp' },
  square: { file: 'avatar-square.png', source: 'avatar/ld_avatar_square_1024.png' },
  card: { file: 'card.webp', source: 'avatar/ld_avatar_square_1024.png' },
  master: { file: 'master.webp', source: 'avatar/ld_avatar_portrait_rgba.webp' }
});

export const LINH_DONG_AUDIO = Object.freeze({
  atk: ['atk.wav'],
  ult: ['ult.wav']
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
