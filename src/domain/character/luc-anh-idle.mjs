/**
 * Authored Lục Ảnh idle runtime contract.
 *
 * The source pack contains 96 full-body frames. They are normalized into one
 * 8×12 lossless WebP atlas with 480 px cells. The re-uploaded IDLE(2).rar
 * contains authored RGBA; the older RGB upload must never be keyed again or
 * substituted. A fixed square crop preserves scale and baseline across frames.
 */
export const LUC_ANH_IDLE_1080 = Object.freeze({
  src: 'assets/characters/luc-anh/idle-rgba-v1-atlas.webp',
  frames: 96,
  cols: 8,
  rows: 12,
  cellW: 480,
  cellH: 480,
  ms: 42,
  loop: true,
  encoding: 'webp-lossless',
  source: Object.freeze({
    archive: 'IDLE(2).rar',
    archiveSha256: 'b6eec16bfb8b01fcf57c16af7ab1d4a869265deec6651323793e90ee79ff64d0',
    width: 1510,
    height: 1004,
    alpha: 'preserve-authored-rgba',
    crop: Object.freeze({ left: 230, top: 7, width: 976, height: 976 })
  })
});

export const LUC_ANH_IDLE_1080_ATLAS = Object.freeze({
  width: LUC_ANH_IDLE_1080.cols * LUC_ANH_IDLE_1080.cellW,
  height: LUC_ANH_IDLE_1080.rows * LUC_ANH_IDLE_1080.cellH
});


/**
 * Combat-only derivative of the verified RGBA idle atlas.
 *
 * The source stays 480 px per cell for hero detail/result presentation.
 * Battle uses 240 px per cell so the native atlas cache can keep movement/VFX
 * resident without falling back to the older RGB/black-keyed source.
 */
export const LUC_ANH_IDLE_BATTLE = Object.freeze({
  ...LUC_ANH_IDLE_1080,
  src: 'assets/characters/luc-anh/idle-rgba-v1-battle-atlas.webp',
  cellW: 240,
  cellH: 240,
  encoding: 'webp-lossless-derived-0.5',
  derivedFrom: LUC_ANH_IDLE_1080.src
});

export const LUC_ANH_IDLE_BATTLE_ATLAS = Object.freeze({
  width: LUC_ANH_IDLE_BATTLE.cols * LUC_ANH_IDLE_BATTLE.cellW,
  height: LUC_ANH_IDLE_BATTLE.rows * LUC_ANH_IDLE_BATTLE.cellH
});
