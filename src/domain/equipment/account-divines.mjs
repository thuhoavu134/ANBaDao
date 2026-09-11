const divineFail = (code, message) => ({ ok: false, code, message });

export const ACCOUNT_DIVINES = Object.freeze([
  Object.freeze({ id: 'cam-quan', name: 'Cấm Quân', stat: 'def', cell: 0 }),
  Object.freeze({ id: 'no-binh', name: 'Nỏ Binh', stat: 'atk', cell: 1 }),
  Object.freeze({ id: 'voi-chien', name: 'Voi Chiến', stat: 'hp', cell: 2 }),
  Object.freeze({ id: 'thuy-quan', name: 'Thủy Quân', stat: 'spd', cell: 3 })
]);

export const DIVINE_PCT_PER_LEVEL = Object.freeze({ hp: 0.004, atk: 0.004, def: 0.004, spd: 0.004 });
export const DIVINE_MASTER_PCT_PER_LEVEL = 0.002;
export const DIVINE_MAX_LEVEL = 15;

const DIVINE_IDS = ACCOUNT_DIVINES.map(troop => troop.id);

function clampLevel(value) {
  const n = Math.floor(Number(value) || 0);
  return Math.max(0, Math.min(DIVINE_MAX_LEVEL, n));
}

export function emptyAccountDivines() {
  return Object.fromEntries(DIVINE_IDS.map(id => [id, { lvl: 0 }]));
}

export function findAccountDivine(id) {
  return ACCOUNT_DIVINES.find(troop => troop.id === id) || null;
}

export function normalizeAccountDivines(divines) {
  const next = emptyAccountDivines();
  if (!divines || typeof divines !== 'object') return next;
  for (const id of DIVINE_IDS) {
    next[id] = { lvl: clampLevel(divines[id]?.lvl) };
  }
  return next;
}

export function divineEnhanceCost(level) {
  const n = Math.max(0, Math.min(DIVINE_MAX_LEVEL, Number(level) || 0));
  return { gold: 70 + n * 35, hoat: 4 + Math.floor(n / 3) };
}

export function divineArt(id) {
  return findAccountDivine(id) ? ('assets/ui/account-divines/' + id + '.png') : '';
}

export function accountDivineMasterLevel(divines) {
  const board = normalizeAccountDivines(divines);
  let min = Infinity;
  for (const id of DIVINE_IDS) {
    const level = board[id].lvl;
    if (level <= 0) return 0;
    min = Math.min(min, level);
  }
  return min === Infinity ? 0 : min;
}

export function accountDivineMasterBonus(level) {
  const n = Math.max(0, Math.min(DIVINE_MAX_LEVEL, Number(level) || 0));
  const pct = DIVINE_MASTER_PCT_PER_LEVEL * n;
  return { hp: pct, atk: pct, def: pct, spd: pct };
}

export function accountDivineMasterProgress(divines) {
  const level = accountDivineMasterLevel(divines);
  const next = level >= DIVINE_MAX_LEVEL ? DIVINE_MAX_LEVEL : level + 1;
  const board = normalizeAccountDivines(divines);
  let ready = 0;
  for (const id of DIVINE_IDS) {
    if (board[id].lvl >= next) ready++;
  }
  return { level, next, ready, need: DIVINE_IDS.length, max: DIVINE_MAX_LEVEL, active: level > 0 };
}

export function accountDivineBonus(divines) {
  const board = normalizeAccountDivines(divines);
  const out = { hp: 0, atk: 0, def: 0, spd: 0 };
  for (const troop of ACCOUNT_DIVINES) {
    const level = board[troop.id].lvl;
    if (level <= 0) continue;
    out[troop.stat] += (DIVINE_PCT_PER_LEVEL[troop.stat] || 0) * level;
  }
  const master = accountDivineMasterBonus(accountDivineMasterLevel(divines));
  out.hp += master.hp;
  out.atk += master.atk;
  out.def += master.def;
  out.spd += master.spd;
  return out;
}

export function prepareDivineEnhance(player, { id, times = 1 } = {}) {
  const troop = findAccountDivine(id);
  if (!troop) return divineFail('INVALID_DIVINE', 'Thần binh không hợp lệ.');
  const board = normalizeAccountDivines(player?.divines);
  let gold = Math.max(0, Number(player?.gold) || 0);
  let hoat = Math.max(0, Number(player?.hoat) || 0);
  const steps = Math.max(1, Math.floor(Number(times) || 1));
  let raised = 0;
  let spentGold = 0;
  let spentHoat = 0;
  if (board[id].lvl >= DIVINE_MAX_LEVEL) return divineFail('DIVINE_MAX_LEVEL', 'Thần binh đã đạt cấp tối đa.');
  for (let step = 0; step < steps; step++) {
    if (board[id].lvl >= DIVINE_MAX_LEVEL) break;
    const cost = divineEnhanceCost(board[id].lvl);
    if (gold < cost.gold) {
      if (!raised) return divineFail('INSUFFICIENT_GOLD', 'Không đủ vàng để cường hóa.');
      break;
    }
    if (hoat < cost.hoat) {
      if (!raised) return divineFail('INSUFFICIENT_HOAT', 'Không đủ Hoạt Lực để cường hóa.');
      break;
    }
    gold -= cost.gold;
    hoat -= cost.hoat;
    spentGold += cost.gold;
    spentHoat += cost.hoat;
    board[id] = { lvl: board[id].lvl + 1 };
    raised++;
  }
  return {
    ok: true,
    divines: board,
    gold,
    hoat,
    id,
    raised,
    spentGold,
    spentHoat,
    level: board[id].lvl
  };
}
