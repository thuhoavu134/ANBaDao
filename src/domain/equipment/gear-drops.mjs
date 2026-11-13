// Owner 2026-10-25: bảng rơi trang bị (đã chốt với chủ dự án).
// Phó bản là nơi cày đều (b/a là rác phân giải), Săn Boss là nơi đánh đổi lượt lấy đồ xịn.
// Hàm thuần, rng tiêm được để test; không đụng state.

export const STAGE_DROP = Object.freeze({
  normal: Object.freeze({ chance: 0.30, table: Object.freeze({ b: 80, a: 20 }) }),
  elite: Object.freeze({ chance: 0.60, table: Object.freeze({ b: 55, a: 35, s: 10 }) })
});

// Boss chương 1..6: % theo phẩm.
export const CHAPTER_BOSS_DROP = Object.freeze([
  Object.freeze({ s: 80, ss: 18, ssr: 2 }),
  Object.freeze({ s: 72, ss: 24, ssr: 4 }),
  Object.freeze({ s: 62, ss: 31, ssr: 7 }),
  Object.freeze({ s: 52, ss: 37, ssr: 11 }),
  Object.freeze({ s: 42, ss: 42, ssr: 16 }),
  Object.freeze({ s: 32, ss: 45, ssr: 23 })
]);

export const HUNT_GEAR_DROP = Object.freeze({
  ca_voi_nuot_trang: Object.freeze({ s: 55, ss: 35, ssr: 10 }),
  nhen_det_ac_mong: Object.freeze({ s: 40, ss: 42, ssr: 18 }),
  dong_ho_cat_vo: Object.freeze({ s: 25, ss: 45, ssr: 30 })
});

export const BOSS_PITY = 25;
export const HUNT_PITY = 10;
export const BOSS_FULL_DROP_PER_DAY = 1;

const GEAR_DROP_RAR_ORDER = Object.freeze(['b', 'a', 's', 'ss', 'ssr']);

function atLeast(rar, floor) {
  return GEAR_DROP_RAR_ORDER.indexOf(rar) >= GEAR_DROP_RAR_ORDER.indexOf(floor);
}

function pickWeighted(table, rng) {
  const total = Object.values(table).reduce((sum, weight) => sum + weight, 0);
  if (!(total > 0)) return null;
  let roll = rng() * total;
  for (const [rar, weight] of Object.entries(table)) {
    roll -= weight;
    if (roll < 0) return rar;
  }
  return Object.keys(table).pop() || null;
}

/** Quái thường / tinh anh: trả phẩm rơi hoặc null. */
export function rollStageDrop({ kind = 'normal', rng = Math.random } = {}) {
  const rule = STAGE_DROP[kind] || STAGE_DROP.normal;
  if (rng() >= rule.chance) return null;
  return pickWeighted(rule.table, rng);
}

/** Boss chương: trả {rar, pity}. pity là số lần đã trượt ssr sau lần này. */
export function rollBossDrop({ chapter = 1, pity = 0, rng = Math.random } = {}) {
  const index = Math.max(0, Math.min(CHAPTER_BOSS_DROP.length - 1, Math.floor(Number(chapter) || 1) - 1));
  const table = CHAPTER_BOSS_DROP[index];
  const streak = Math.max(0, Math.floor(Number(pity) || 0));
  if (streak >= BOSS_PITY) return { rar: 'ssr', pity: 0, floor: true };
  const rar = pickWeighted(table, rng) || 's';
  return { rar, pity: rar === 'ssr' ? 0 : streak + 1, floor: false };
}

/**
 * Săn Boss: mỗi lần hạ boss chắc chắn 1 món.
 * - lượt hạ đầu tiên trong ngày: ít nhất ss
 * - bảo hiểm 10 lượt không ra ssr
 * - quá 1 món/ngày thì tỉ lệ giảm nửa, nhân đôi trọng số phẩm thấp
 */
export function rollHuntDrop({ bossId, firstOfDay = true, pity = 0, overCap = false, rng = Math.random } = {}) {
  const table = HUNT_GEAR_DROP[bossId] || HUNT_GEAR_DROP.ca_voi_nuot_trang;
  const streak = Math.max(0, Math.floor(Number(pity) || 0));
  if (streak >= HUNT_PITY) return { rar: 'ssr', pity: 0, floor: true };
  let rar = pickWeighted(table, rng) || 'ss';
  if (overCap && rng() < 0.5) {
    const lower = Object.keys(table).filter(key => GEAR_DROP_RAR_ORDER.indexOf(key) < GEAR_DROP_RAR_ORDER.indexOf(rar));
    if (lower.length) rar = lower[lower.length - 1];
  }
  if (firstOfDay && !atLeast(rar, 'ss')) {
    rar = rng() < ((table.ssr || 0) / Math.max(1, (table.ss || 0) + (table.ssr || 0))) ? 'ssr' : 'ss';
  }
  return { rar, pity: rar === 'ssr' ? 0 : streak + 1, floor: false };
}

/** Món đồ hoàn chỉnh từ một lần rơi (dòng thuộc tính do caller cấp để tránh phụ thuộc vòng). */
export function buildDropItem({ uid, slot, rar, source, rollAffixes }) {
  if (!Number.isSafeInteger(uid) || uid <= 0) return null;
  if (!slot || !GEAR_DROP_RAR_ORDER.includes(rar)) return null;
  const affixes = typeof rollAffixes === 'function' ? rollAffixes({ source, rar }) : [];
  return { uid, slot, rar, lvl: 0, mold: 'strike', from: source === 'stage' ? 'stage' : 'boss', affixes };
}

export const _internal = Object.freeze({ pickWeighted, atLeast, GEAR_DROP_RAR_ORDER });
