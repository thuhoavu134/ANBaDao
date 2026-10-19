// Khaos (Thủy Mặc kit, owner-approved 2026-10-19). Presentation lives in
// assets/characters/khaos/hero.json; rules live in splus-mechanics AUTHORED_HIT.khaos;
// player-facing text lives in splus-profiles/dream.mjs. Keep the three in sync.
export const KHAOS_KIT = Object.freeze({
  id: 'hero_splus_khaos',
  key: 'khaos',
  passive: Object.freeze({ name: 'Mặc Nhãn Phù Lục', maxStacks: 3, turns: 3, speedDown: 0.15, armorDown: 0.10, stunTurns: 1 }),
  basic: Object.freeze({ name: 'Điểm Mặc Tiễn', cost: 0, hits: 1, multiplier: 1.4, inkStacks: 1 }),
  ultimate: Object.freeze({ name: 'Vạn Tượng Thủy Mặc', cost: 60, hits: 2, multiplier: 1.5, detonatePerStack: 0.25, magicArmorDown: 0.3, turns: 2 })
});
