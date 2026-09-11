const illusionFail = (code, message) => ({ ok: false, code, message });

export const ACCOUNT_ILLUSIONS = Object.freeze([
  Object.freeze({ id: 'hon-trang', name: 'Hồn Trăng', stat: 'spd', cell: 0 }),
  Object.freeze({ id: 'mat-na-tuong', name: 'Mặt Nạ Tuồng', stat: 'atk', cell: 1 }),
  Object.freeze({ id: 'bong-cheo', name: 'Bóng Chèo', stat: 'def', cell: 2 }),
  Object.freeze({ id: 'khoi-den', name: 'Khói Đền', stat: 'hp', cell: 3 }),
  Object.freeze({ id: 'rong-may', name: 'Rồng Mây', stat: 'atk', cell: 4 }),
  Object.freeze({ id: 'anh-son-mai', name: 'Ánh Sơn Mài', stat: 'hp', cell: 5 })
]);

export const ILLUSION_STAT_PER_LEVEL = Object.freeze({ hp: 28, atk: 5, def: 4, spd: 0.5 });
export const ILLUSION_MASTER_PER_LEVEL = Object.freeze({ hp: 10, atk: 2, def: 1, spd: 0.2 });
export const ILLUSION_SUPPORT_RATE = 0.5;
export const ILLUSION_SLOT_COUNT = 2;
export const ILLUSION_MAX_LEVEL = 15;

const ILLUSION_IDS = ACCOUNT_ILLUSIONS.map(item => item.id);

function clampLevel(value) {
  const n = Math.floor(Number(value) || 0);
  return Math.max(0, Math.min(ILLUSION_MAX_LEVEL, n));
}

export function emptyAccountIllusions() {
  return {
    slots: [null, null],
    levels: Object.fromEntries(ILLUSION_IDS.map(id => [id, { lvl: 0 }]))
  };
}

export function findAccountIllusion(id) {
  return ACCOUNT_ILLUSIONS.find(item => item.id === id) || null;
}

export function normalizeAccountIllusions(illusions) {
  const next = emptyAccountIllusions();
  if (!illusions || typeof illusions !== 'object') return next;
  const levels = illusions.levels && typeof illusions.levels === 'object' ? illusions.levels : illusions;
  for (const id of ILLUSION_IDS) {
    next.levels[id] = { lvl: clampLevel(levels[id]?.lvl) };
  }
  const seen = new Set();
  const slots = Array.isArray(illusions.slots) ? illusions.slots : [];
  next.slots = [0, 1].map(index => {
    const id = slots[index];
    if (!findAccountIllusion(id) || seen.has(id)) return null;
    seen.add(id);
    return id;
  });
  return next;
}

export function illusionEnhanceCost(level) {
  const n = Math.max(0, Math.min(ILLUSION_MAX_LEVEL, Number(level) || 0));
  return { gold: 65 + n * 32, hoat: 4 + Math.floor(n / 3) };
}

export function illusionArt(id) {
  return findAccountIllusion(id) ? ('assets/ui/account-illusions/' + id + '.png') : '';
}

export function accountIllusionMasterLevel(illusions) {
  const board = normalizeAccountIllusions(illusions);
  let min = Infinity;
  for (const id of ILLUSION_IDS) {
    const level = board.levels[id].lvl;
    if (level <= 0) return 0;
    min = Math.min(min, level);
  }
  return min === Infinity ? 0 : min;
}

export function accountIllusionMasterBonus(level) {
  const n = Math.max(0, Math.min(ILLUSION_MAX_LEVEL, Number(level) || 0));
  return {
    hp: ILLUSION_MASTER_PER_LEVEL.hp * n,
    atk: ILLUSION_MASTER_PER_LEVEL.atk * n,
    def: ILLUSION_MASTER_PER_LEVEL.def * n,
    spd: ILLUSION_MASTER_PER_LEVEL.spd * n
  };
}

export function accountIllusionMasterProgress(illusions) {
  const level = accountIllusionMasterLevel(illusions);
  const next = level >= ILLUSION_MAX_LEVEL ? ILLUSION_MAX_LEVEL : level + 1;
  const board = normalizeAccountIllusions(illusions);
  let ready = 0;
  for (const id of ILLUSION_IDS) {
    if (board.levels[id].lvl >= next) ready++;
  }
  return { level, next, ready, need: ILLUSION_IDS.length, max: ILLUSION_MAX_LEVEL, active: level > 0 };
}

export function accountIllusionBonus(illusions) {
  const board = normalizeAccountIllusions(illusions);
  const out = { hp: 0, atk: 0, def: 0, spd: 0 };
  board.slots.forEach((id, index) => {
    const item = findAccountIllusion(id);
    if (!item) return;
    const level = board.levels[item.id].lvl;
    if (level <= 0) return;
    const rate = index === 0 ? 1 : ILLUSION_SUPPORT_RATE;
    out[item.stat] += (ILLUSION_STAT_PER_LEVEL[item.stat] || 0) * level * rate;
  });
  const master = accountIllusionMasterBonus(accountIllusionMasterLevel(illusions));
  out.hp += master.hp;
  out.atk += master.atk;
  out.def += master.def;
  out.spd += master.spd;
  return out;
}

export function prepareIllusionSlot(player, { id } = {}) {
  const item = findAccountIllusion(id);
  if (!item) return illusionFail('INVALID_ILLUSION', 'Ảo hình không hợp lệ.');
  const board = normalizeAccountIllusions(player?.illusions);
  const current = board.slots.indexOf(item.id);
  if (current >= 0) {
    board.slots[current] = null;
    return { ok: true, illusions: board, id: item.id, slots: board.slots };
  }
  const empty = board.slots.findIndex(slot => !slot);
  if (empty >= 0) board.slots[empty] = item.id;
  else board.slots[1] = item.id;
  return { ok: true, illusions: board, id: item.id, slots: board.slots };
}

export function prepareIllusionEnhance(player, { id, times = 1 } = {}) {
  const item = findAccountIllusion(id);
  if (!item) return illusionFail('INVALID_ILLUSION', 'Ảo hình không hợp lệ.');
  const board = normalizeAccountIllusions(player?.illusions);
  let gold = Math.max(0, Number(player?.gold) || 0);
  let hoat = Math.max(0, Number(player?.hoat) || 0);
  const steps = Math.max(1, Math.floor(Number(times) || 1));
  let raised = 0;
  let spentGold = 0;
  let spentHoat = 0;
  if (board.levels[id].lvl >= ILLUSION_MAX_LEVEL) return illusionFail('ILLUSION_MAX_LEVEL', 'Ảo hình đã đạt cấp tối đa.');
  for (let step = 0; step < steps; step++) {
    if (board.levels[id].lvl >= ILLUSION_MAX_LEVEL) break;
    const cost = illusionEnhanceCost(board.levels[id].lvl);
    if (gold < cost.gold) {
      if (!raised) return illusionFail('INSUFFICIENT_GOLD', 'Không đủ vàng để cường hóa.');
      break;
    }
    if (hoat < cost.hoat) {
      if (!raised) return illusionFail('INSUFFICIENT_HOAT', 'Không đủ Hoạt Lực để cường hóa.');
      break;
    }
    gold -= cost.gold;
    hoat -= cost.hoat;
    spentGold += cost.gold;
    spentHoat += cost.hoat;
    board.levels[id] = { lvl: board.levels[id].lvl + 1 };
    raised++;
  }
  return {
    ok: true,
    illusions: board,
    gold,
    hoat,
    id,
    raised,
    spentGold,
    spentHoat,
    level: board.levels[id].lvl
  };
}
