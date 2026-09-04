/**
 * Authored Lục Ảnh idle runtime contract.
 *
 * The source pack contains 96 full-body frames. They are normalized into one
 * 8×12 WebP quality-100 atlas with 480 px cells so the same high-resolution
 * source can be used by the hero-detail canvas and the battle renderer. The
 * black chroma is cleaned at the edge and in enclosed background holes before
 * the atlas is encoded.
 */
export const LUC_ANH_IDLE_1080 = Object.freeze({
  src: 'assets/characters/luc-anh/idle-1080-atlas.webp',
  frames: 96,
  cols: 8,
  rows: 12,
  cellW: 480,
  cellH: 480,
  ms: 42,
  loop: true,
  cleanup: Object.freeze({
    background: 'edge-connected-black',
    edgeThreshold: 8,
    enclosedDarkMinArea: 2000,
    enclosedDarkMinX: 700,
    transparentEdgeColorBleed: true
  })
});

export const LUC_ANH_IDLE_1080_ATLAS = Object.freeze({
  width: LUC_ANH_IDLE_1080.cols * LUC_ANH_IDLE_1080.cellW,
  height: LUC_ANH_IDLE_1080.rows * LUC_ANH_IDLE_1080.cellH
});
