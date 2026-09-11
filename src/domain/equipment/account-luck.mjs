const luckFail = (code, message) => ({ ok: false, code, message });

export const ACCOUNT_LUCKS = Object.freeze([
  Object.freeze({ id: 'van-phu', name: 'Vận Phú', stat: 'hp', cell: 0 }),
  Object.freeze({ id: 'van-quy', name: 'Vận Quý', stat: 'atk', cell: 1 }),
  Object.freeze({ id: 'van-tho', name: 'Vận Thọ', stat: 'def', cell: 2 }),
  Object.freeze({ id: 'van-khang', name: 'Vận Khang', stat: 'spd', cell: 3 }),
  Object.freeze({ id: 'van-ninh', name: 'Vận Ninh', stat: 'all', cell: 4 })
]);

export const LUCK_PCT_PER_LEVEL = Object.freeze({ hp: 0.005, atk: 0.005, def: 0.005, spd: 0.005 });
export const LUCK_ALL_PCT_PER_LEVEL = 0.002;
export const LUCK_MASTER_PCT_PER_LEVEL = 0.001;
export const LUCK_MAX_LEVEL = 15;

const LUCK_IDS = ACCOUNT_LUCKS.map(item => item.id);
const STATS = ['hp', 'atk', 'def', 'spd'];

function clampLevel(value) {
  const n = Math.floor(Number(value) || 0);
  return Math.max(0, Math.min(LUCK_MAX_LEVEL, n));
}

export function emptyAccountLuck() {
  return {
    chosen: null,
    levels: Object.fromEntries(LUCK_IDS.map(id => [id, { lvl: 0 }]))
  };
}

export function findAccountLuck(id) {
  return ACCOUNT_LUCKS.find(item => item.id === id) || null;
}

export function normalizeAccountLuck(luck) {
  const next = emptyAccountLuck();
  if (!luck || typeof luck !== 'object') return next;
  next.chosen = findAccountLuck(luck.chosen) ? luck.chosen : null;
  const levels = luck.levels && typeof luck.levels === 'object' ? luck.levels : luck;
  for (const id of LUCK_IDS) {
    next.levels[id] = { lvl: clampLevel(levels[id]?.lvl) };
  }
  return next;
}

export function luckEnhanceCost(level) {
  const n = Math.max(0, Math.min(LUCK_MAX_LEVEL, Number(level) || 0));
  return { gold: 60 + n * 30, hoat: 4 + Math.floor(n / 3) };
}

export function luckArt(id) {
  return findAccountLuck(id) ? ('assets/ui/account-luck/' + id + '.png') : '';
}

export function accountLuckMasterLevel(luck) {
  const board = normalizeAccountLuck(luck);
  let min = Infinity;
  for (const id of LUCK_IDS) {
    const level = board.levels[id].lvl;
    if (level <= 0) return 0;
    min = Math.min(min, level);
  }
  return min === Infinity ? 0 : min;
}

export function accountLuckMasterBonus(level) {
  const n = Math.max(0, Math.min(LUCK_MAX_LEVEL, Number(level) || 0));
  const pct = LUCK_MASTER_PCT_PER_LEVEL * n;
  return { hp: pct, atk: pct, def: pct, spd: pct };
}

export function accountLuckMasterProgress(luck) {
  const level = accountLuckMasterLevel(luck);
  const next = level >= LUCK_MAX_LEVEL ? LUCK_MAX_LEVEL : level + 1;
  const board = normalizeAccountLuck(luck);
  let ready = 0;
  for (const id of LUCK_IDS) {
    if (board.levels[id].lvl >= next) ready++;
  }
  return { level, next, ready, need: LUCK_IDS.length, max: LUCK_MAX_LEVEL, active: level > 0 };
}

function applySeal(out, seal, level) {
  if (level <= 0) return;
  if (seal.stat === 'all') {
    for (const stat of STATS) out[stat] += LUCK_ALL_PCT_PER_LEVEL * level;
    return;
  }
  out[seal.stat] += (LUCK_PCT_PER_LEVEL[seal.stat] || 0) * level;
}

export function accountLuckBonus(luck) {
  const board = normalizeAccountLuck(luck);
  const out = { hp: 0, atk: 0, def: 0, spd: 0 };
  const chosen = findAccountLuck(board.chosen);
  if (chosen) applySeal(out, chosen, board.levels[chosen.id].lvl);
  const master = accountLuckMasterBonus(accountLuckMasterLevel(luck));
  out.hp += master.hp;
  out.atk += master.atk;
  out.def += master.def;
  out.spd += master.spd;
  return out;
}

export function prepareLuckChoose(player, { id } = {}) {
  const board = normalizeAccountLuck(player?.luck);
  if (id == null || id === '') {
    board.chosen = null;
    return { ok: true, luck: board, id: null };
  }
  if (!findAccountLuck(id)) return luckFail('INVALID_LUCK', 'Vận không hợp lệ.');
  board.chosen = board.chosen === id ? null : id;
  return { ok: true, luck: board, id: board.chosen };
}

export function prepareLuckEnhance(player, { id, times = 1 } = {}) {
  const item = findAccountLuck(id);
  if (!item) return luckFail('INVALID_LUCK', 'Vận không hợp lệ.');
  const board = normalizeAccountLuck(player?.luck);
  let gold = Math.max(0, Number(player?.gold) || 0);
  let hoat = Math.max(0, Number(player?.hoat) || 0);
  const steps = Math.max(1, Math.floor(Number(times) || 1));
  let raised = 0;
  let spentGold = 0;
  let spentHoat = 0;
  if (board.levels[id].lvl >= LUCK_MAX_LEVEL) return luckFail('LUCK_MAX_LEVEL', 'Vận đã đạt cấp tối đa.');
  for (let step = 0; step < steps; step++) {
    if (board.levels[id].lvl >= LUCK_MAX_LEVEL) break;
    const cost = luckEnhanceCost(board.levels[id].lvl);
    if (gold < cost.gold) {
      if (!raised) return luckFail('INSUFFICIENT_GOLD', 'Không đủ vàng để cường hóa.');
      break;
    }
    if (hoat < cost.hoat) {
      if (!raised) return luckFail('INSUFFICIENT_HOAT', 'Không đủ Hoạt Lực để cường hóa.');
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
    luck: board,
    gold,
    hoat,
    id,
    raised,
    spentGold,
    spentHoat,
    level: board.levels[id].lvl
  };
}
