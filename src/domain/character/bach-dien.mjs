// Bạch Diện Thần Quân — authored extra S+ (not one of the locked 42).
// Canvas sprite runtime from the q90-480 agent pack. "spine 2D" is style only.

export const BACH_DIEN_SCHEMA = 'hon-viet-bach-dien-atlas/v1';
export const BACH_DIEN_CANONICAL_ID = 'hero_splus_bach_dien';
export const BACH_DIEN_SOURCE_IDS = Object.freeze([
  'bach_dien',
  'hero_splus_bach_dien',
  'bach-dien'
]);
export const BACH_DIEN_ASSET_BASE = 'assets/characters/bach-dien/';
export const BACH_DIEN_AUDIO_BASE = 'assets/audio/sfx/bach-dien/';

export const BACH_DIEN_CHAR = Object.freeze({
  scale: 1,
  cellW: 480,
  cellH: 440,
  cols: 8,
  frames: 94,
  fps: 30,
  foot: 'bottom-center'
});

export const BACH_DIEN_FIELD = Object.freeze({
  multiplier: 1,
  drawW: 477,
  drawH: 440,
  baseline: 64
});

export const BACH_DIEN_VFX = Object.freeze({
  cellW: 440,
  cellH: 248,
  cols: 10,
  frames: 94,
  fps: 30
});

export function normalizeBachDienId(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const lower = raw.toLowerCase().replace(/-/g, '_');
  if (lower === 'bach_dien' || lower === 'hero_splus_bach_dien') return BACH_DIEN_CANONICAL_ID;
  return raw;
}

export function isBachDienId(value) {
  const id = String(value || '').trim();
  if (BACH_DIEN_SOURCE_IDS.includes(id)) return true;
  return normalizeBachDienId(id) === BACH_DIEN_CANONICAL_ID;
}
