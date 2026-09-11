const spiritFail = (code, message) => ({ ok: false, code, message });

export const ACCOUNT_SPIRITS = Object.freeze([
  Object.freeze({ id: 'son-tinh', name: 'Sơn Tinh', stat: 'def', set: 'son-thuy', row: 0, col: 0 }),
  Object.freeze({ id: 'thuy-tinh', name: 'Thủy Tinh', stat: 'spd', set: 'son-thuy', row: 0, col: 1 }),
  Object.freeze({ id: 'thanh-giong', name: 'Thánh Gióng', stat: 'atk', set: 'son-thuy', row: 0, col: 2 }),
  Object.freeze({ id: 'lieu-hanh', name: 'Liễu Hạnh', stat: 'hp', set: 'tien-thanh', row: 1, col: 0 }),
  Object.freeze({ id: 'chu-dong-tu', name: 'Chử Đồng Tử', stat: 'hp', set: 'tien-thanh', row: 1, col: 1 }),
  Object.freeze({ id: 'ba-chua-xu', name: 'Bà Chúa Xứ', stat: 'def', set: 'tien-thanh', row: 1, col: 2 }),
  Object.freeze({ id: 'lac-long-quan', name: 'Lạc Long Quân', stat: 'atk', set: 'hong-bang', row: 2, col: 0 }),
  Object.freeze({ id: 'au-co', name: 'Âu Cơ', stat: 'hp', set: 'hong-bang', row: 2, col: 1 }),
  Object.freeze({ id: 'than-sam', name: 'Thần Sấm', stat: 'spd', set: 'hong-bang', row: 2, col: 2 })
]);

export const SPIRIT_SETS = Object.freeze([
  Object.freeze({ id: 'son-thuy', name: 'Sơn Thủy', three: Object.freeze({ atk: 8, def: 8 }) }),
  Object.freeze({ id: 'tien-thanh', name: 'Tiên Thánh', three: Object.freeze({ hp: 60 }) }),
  Object.freeze({ id: 'hong-bang', name: 'Hồng Bàng', three: Object.freeze({ atk: 10, spd: 2 }) })
]);

export const SPIRIT_STAT_PER_LEVEL = Object.freeze({ hp: 14, atk: 2, def: 2, spd: 0.4 });
export const SPIRIT_MASTER_PER_LEVEL = Object.freeze({ hp: 14, atk: 2, def: 2, spd: 0.4 });
export const SPIRIT_MAX_LEVEL = 15;
export const SPIRIT_SLOT_COUNT = 3;

const SPIRIT_IDS = ACCOUNT_SPIRITS.map(spirit => spirit.id);
const DEFAULT_SLOTS = ACCOUNT_SPIRITS.filter(spirit => spirit.set === 'son-thuy').map(spirit => spirit.id);

function clampLevel(value) {
  const n = Math.floor(Number(value) || 0);
  return Math.max(0, Math.min(SPIRIT_MAX_LEVEL, n));
}

function emptyLevels() {
  return Object.fromEntries(SPIRIT_IDS.map(id => [id, { lvl: 0 }]));
}

export function emptyAccountSpirits() {
  return { slots: DEFAULT_SLOTS.slice(), levels: emptyLevels() };
}

export function findAccountSpirit(id) {
  return ACCOUNT_SPIRITS.find(spirit => spirit.id === id) || null;
}

export function normalizeAccountSpirits(spirits) {
  const next = emptyAccountSpirits();
  if (!spirits || typeof spirits !== 'object') return next;
  const source = spirits.levels && typeof spirits.levels === 'object' ? spirits.levels : spirits;
  for (const id of SPIRIT_IDS) {
    next.levels[id] = { lvl: clampLevel(source[id]?.lvl) };
  }
  const incoming = Array.isArray(spirits.slots) ? spirits.slots : DEFAULT_SLOTS;
  const used = new Set();
  next.slots = [0, 1, 2].map(index => {
    const id = incoming[index];
    if (!findAccountSpirit(id) || used.has(id)) return null;
    used.add(id);
    return id;
  });
  return next;
}

export function spiritEnhanceCost(level) {
  const n = Math.max(0, Math.min(SPIRIT_MAX_LEVEL, Number(level) || 0));
  return { gold: 50 + n * 25, hoat: 3 + Math.floor(n / 3) };
}

export function spiritArt(id) {
  return findAccountSpirit(id) ? ('assets/ui/account-spirits/' + id + '.png') : '';
}

export function accountSpiritMasterLevel(spirits) {
  const board = normalizeAccountSpirits(spirits);
  let min = Infinity;
  for (const id of SPIRIT_IDS) {
    const level = board.levels[id].lvl;
    if (level <= 0) return 0;
    min = Math.min(min, level);
  }
  return min === Infinity ? 0 : min;
}

export function accountSpiritMasterBonus(level) {
  const n = Math.max(0, Math.min(SPIRIT_MAX_LEVEL, Number(level) || 0));
  return {
    hp: SPIRIT_MASTER_PER_LEVEL.hp * n,
    atk: SPIRIT_MASTER_PER_LEVEL.atk * n,
    def: SPIRIT_MASTER_PER_LEVEL.def * n,
    spd: SPIRIT_MASTER_PER_LEVEL.spd * n
  };
}

export function accountSpiritMasterProgress(spirits) {
  const level = accountSpiritMasterLevel(spirits);
  const next = level >= SPIRIT_MAX_LEVEL ? SPIRIT_MAX_LEVEL : level + 1;
  const board = normalizeAccountSpirits(spirits);
  let ready = 0;
  for (const id of SPIRIT_IDS) {
    if (board.levels[id].lvl >= next) ready++;
  }
  return { level, next, ready, need: SPIRIT_IDS.length, max: SPIRIT_MAX_LEVEL, active: level > 0 };
}

function addStats(out, add) {
  if (!add) return;
  for (const key of ['hp', 'atk', 'def', 'spd']) {
    out[key] += Number(add[key]) || 0;
  }
}

export function accountSpiritBonus(spirits) {
  const board = normalizeAccountSpirits(spirits);
  const out = { hp: 0, atk: 0, def: 0, spd: 0 };
  const slotted = [];
  for (const id of board.slots) {
    const spirit = findAccountSpirit(id);
    if (!spirit) continue;
    const level = board.levels[spirit.id].lvl;
    if (level <= 0) continue;
    out[spirit.stat] += (SPIRIT_STAT_PER_LEVEL[spirit.stat] || 0) * level;
    slotted.push(spirit);
  }
  if (slotted.length === 3) {
    const setId = slotted[0].set;
    if (slotted.every(item => item.set === setId)) {
      const set = SPIRIT_SETS.find(item => item.id === setId);
      addStats(out, set?.three);
    }
  }
  addStats(out, accountSpiritMasterBonus(accountSpiritMasterLevel(spirits)));
  return out;
}

export function prepareSpiritEnhance(player, { id, times = 1 } = {}) {
  const spirit = findAccountSpirit(id);
  if (!spirit) return spiritFail('INVALID_SPIRIT', 'Chiến linh không hợp lệ.');
  const board = normalizeAccountSpirits(player?.spirits);
  let gold = Math.max(0, Number(player?.gold) || 0);
  let hoat = Math.max(0, Number(player?.hoat) || 0);
  const steps = Math.max(1, Math.floor(Number(times) || 1));
  let raised = 0;
  let spentGold = 0;
  let spentHoat = 0;
  if (board.levels[id].lvl >= SPIRIT_MAX_LEVEL) return spiritFail('SPIRIT_MAX_LEVEL', 'Chiến linh đã đạt cấp tối đa.');
  for (let step = 0; step < steps; step++) {
    if (board.levels[id].lvl >= SPIRIT_MAX_LEVEL) break;
    const cost = spiritEnhanceCost(board.levels[id].lvl);
    if (gold < cost.gold) {
      if (!raised) return spiritFail('INSUFFICIENT_GOLD', 'Không đủ vàng để cường hóa.');
      break;
    }
    if (hoat < cost.hoat) {
      if (!raised) return spiritFail('INSUFFICIENT_HOAT', 'Không đủ Hoạt Lực để cường hóa.');
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
    spirits: board,
    gold,
    hoat,
    id,
    raised,
    spentGold,
    spentHoat,
    level: board.levels[id].lvl
  };
}

export function prepareSpiritSlot(player, { slot, id } = {}) {
  const index = Math.floor(Number(slot));
  if (index < 0 || index >= SPIRIT_SLOT_COUNT) return spiritFail('INVALID_SLOT', 'Ô an vị không hợp lệ.');
  const spirit = findAccountSpirit(id);
  if (!spirit) return spiritFail('INVALID_SPIRIT', 'Chiến linh không hợp lệ.');
  const board = normalizeAccountSpirits(player?.spirits);
  const current = board.slots.indexOf(spirit.id);
  if (current === index) return { ok: true, spirits: board, slot: index, id: spirit.id };
  if (current >= 0) {
    const swapped = board.slots[index];
    board.slots[index] = spirit.id;
    board.slots[current] = swapped;
  } else {
    board.slots[index] = spirit.id;
  }
  return { ok: true, spirits: board, slot: index, id: spirit.id };
}
