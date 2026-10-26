// Owner 2026-10-26: cây Đột phá 4 mốc cho từng tướng.
// Mỗi mốc mở bằng cấp + số sao + vàng + tinh; cộng % vào chỉ số nền của tướng.
// Hàm thuần, không đụng state (caller truyền player), để test được và để file nhúng vào trang không cần import.

export const BREAKTHROUGH_STEPS = Object.freeze([
  Object.freeze({
    id: 1, name: 'Khai Mạch', level: 10, stars: 1, gold: 500, tinh: 5,
    bonus: Object.freeze({ hp: 0.08, atk: 0.05 }),
    note: '+8% máu · +5% công'
  }),
  Object.freeze({
    id: 2, name: 'Khai Khiếu', level: 18, stars: 2, gold: 1200, tinh: 12,
    bonus: Object.freeze({ def: 0.08, spd: 0.06 }),
    note: '+8% giáp · +6% tốc'
  }),
  Object.freeze({
    id: 3, name: 'Tẩy Cốt', level: 24, stars: 4, gold: 2600, tinh: 25,
    bonus: Object.freeze({ hp: 0.10, atk: 0.08, crit: 3 }),
    note: '+10% máu · +8% công · +3 bạo kích'
  }),
  Object.freeze({
    id: 4, name: 'Phá Cảnh', level: 30, stars: 6, gold: 5000, tinh: 50,
    bonus: Object.freeze({ hp: 0.15, atk: 0.12, def: 0.10, spd: 0.08 }),
    note: '+15% máu · +12% công · +10% giáp · +8% tốc'
  })
]);

export const BREAKTHROUGH_MAX = BREAKTHROUGH_STEPS.length;

const EMPTY_BONUS = Object.freeze({ hp: 0, atk: 0, def: 0, spd: 0, crit: 0 });

export function breakthroughLevel(player, heroId) {
  const raw = Number(player?.heroes?.[heroId]?.dp);
  if (!Number.isFinite(raw)) return 0;
  return Math.max(0, Math.min(BREAKTHROUGH_MAX, Math.floor(raw)));
}

/** Cộng dồn % của tất cả mốc đã mở. */
export function breakthroughBonus(player, heroId) {
  const level = breakthroughLevel(player, heroId);
  const out = { ...EMPTY_BONUS };
  for (const step of BREAKTHROUGH_STEPS) {
    if (step.id > level) break;
    for (const [key, value] of Object.entries(step.bonus)) out[key] += value;
  }
  return out;
}

/** Mốc kế tiếp, null nếu đã max. */
export function nextBreakthroughStep(player, heroId) {
  const level = breakthroughLevel(player, heroId);
  return BREAKTHROUGH_STEPS.find(step => step.id === level + 1) || null;
}

/**
 * Kiểm điều kiện mở mốc kế tiếp.
 * @returns {{ok:boolean, code?:string, message?:string, step?:object, bonus?:object}}
 */
export function canBreakthrough(player, heroId, { level = 1, stars = 1, gold = 0, tinh = 0 } = {}) {
  if (!player?.heroes?.[heroId]?.owned) return { ok: false, code: 'NOT_OWNED', message: 'Chưa sở hữu tướng này.' };
  const step = nextBreakthroughStep(player, heroId);
  if (!step) return { ok: false, code: 'MAX', message: 'Đã đột phá tới mốc cuối.' };
  if (level < step.level) return { ok: false, code: 'LEVEL', message: 'Cần cấp ' + step.level + ' (đang ' + level + ').', step };
  if (stars < step.stars) return { ok: false, code: 'STARS', message: 'Cần ' + step.stars + '★ (đang ' + stars + '★).', step };
  if (gold < step.gold) return { ok: false, code: 'GOLD', message: 'Thiếu vàng: cần ' + step.gold + '.', step };
  if (tinh < step.tinh) return { ok: false, code: 'TINH', message: 'Thiếu Tinh: cần ' + step.tinh + '.', step };
  return { ok: true, step, bonus: step.bonus };
}

/**
 * Chuẩn bị mở mốc: trả về phần thay đổi để caller ghi vào save.
 * Không tự sửa player để dùng được trong transaction.
 */
export function prepareBreakthrough(player, heroId, { level = 1, stars = 1, gold = 0, tinh = 0 } = {}) {
  const check = canBreakthrough(player, heroId, { level, stars, gold, tinh });
  if (!check.ok) return check;
  const step = check.step;
  return {
    ok: true,
    step,
    cost: { gold: step.gold, tinh: step.tinh },
    levelAfter: breakthroughLevel(player, heroId) + 1,
    message: 'Đột phá ' + step.name + ' thành công — ' + step.note
  };
}
