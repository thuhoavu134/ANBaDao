const antiqueFail = (code, message) => ({ ok: false, code, message });

export const ACCOUNT_ANTIQUES = Object.freeze([
  Object.freeze({ id: 'bia-tien-si', name: 'Bia Tiến Sĩ', stat: 'def', cell: 0 }),
  Object.freeze({ id: 'riu-da', name: 'Rìu Đá', stat: 'atk', cell: 1 }),
  Object.freeze({ id: 'chuong-mot-cot', name: 'Chuông Một Cột', stat: 'hp', cell: 2 }),
  Object.freeze({ id: 'gom-cham', name: 'Gốm Chăm', stat: 'spd', cell: 3 }),
  Object.freeze({ id: 'sach-thien-nam', name: 'Thiên Nam Dư Hạ', stat: 'atk', cell: 4 }),
  Object.freeze({ id: 'lu-huong', name: 'Lư Hương', stat: 'hp', cell: 5 })
]);

export const ANTIQUE_STAT_PER_LEVEL = Object.freeze({ hp: 36, atk: 7, def: 5, spd: 0.6 });
export const ANTIQUE_MASTER_PER_LEVEL = Object.freeze({ hp: 12, atk: 2, def: 2, spd: 0.2 });
export const ANTIQUE_MAX_LEVEL = 15;

const ANTIQUE_IDS = ACCOUNT_ANTIQUES.map(item => item.id);

function clampLevel(value) {
  const n = Math.floor(Number(value) || 0);
  return Math.max(0, Math.min(ANTIQUE_MAX_LEVEL, n));
}

export function emptyAccountAntiques() {
  return {
    equipped: null,
    levels: Object.fromEntries(ANTIQUE_IDS.map(id => [id, { lvl: 0 }]))
  };
}

export function findAccountAntique(id) {
  return ACCOUNT_ANTIQUES.find(item => item.id === id) || null;
}

export function normalizeAccountAntiques(antiques) {
  const next = emptyAccountAntiques();
  if (!antiques || typeof antiques !== 'object') return next;
  const equipped = antiques.equipped;
  next.equipped = findAccountAntique(equipped) ? equipped : null;
  const levels = antiques.levels && typeof antiques.levels === 'object' ? antiques.levels : antiques;
  for (const id of ANTIQUE_IDS) {
    next.levels[id] = { lvl: clampLevel(levels[id]?.lvl) };
  }
  return next;
}

export function antiqueEnhanceCost(level) {
  const n = Math.max(0, Math.min(ANTIQUE_MAX_LEVEL, Number(level) || 0));
  return { gold: 80 + n * 40, hoat: 5 + Math.floor(n / 3) };
}

export function antiqueArt(id) {
  return findAccountAntique(id) ? ('assets/ui/account-antiques/' + id + '.png') : '';
}

export function accountAntiqueMasterLevel(antiques) {
  const board = normalizeAccountAntiques(antiques);
  let min = Infinity;
  for (const id of ANTIQUE_IDS) {
    const level = board.levels[id].lvl;
    if (level <= 0) return 0;
    min = Math.min(min, level);
  }
  return min === Infinity ? 0 : min;
}

export function accountAntiqueMasterBonus(level) {
  const n = Math.max(0, Math.min(ANTIQUE_MAX_LEVEL, Number(level) || 0));
  return {
    hp: ANTIQUE_MASTER_PER_LEVEL.hp * n,
    atk: ANTIQUE_MASTER_PER_LEVEL.atk * n,
    def: ANTIQUE_MASTER_PER_LEVEL.def * n,
    spd: ANTIQUE_MASTER_PER_LEVEL.spd * n
  };
}

export function accountAntiqueMasterProgress(antiques) {
  const level = accountAntiqueMasterLevel(antiques);
  const next = level >= ANTIQUE_MAX_LEVEL ? ANTIQUE_MAX_LEVEL : level + 1;
  const board = normalizeAccountAntiques(antiques);
  let ready = 0;
  for (const id of ANTIQUE_IDS) {
    if (board.levels[id].lvl >= next) ready++;
  }
  return { level, next, ready, need: ANTIQUE_IDS.length, max: ANTIQUE_MAX_LEVEL, active: level > 0 };
}

export function accountAntiqueBonus(antiques) {
  const board = normalizeAccountAntiques(antiques);
  const out = { hp: 0, atk: 0, def: 0, spd: 0 };
  const equipped = findAccountAntique(board.equipped);
  if (equipped) {
    const level = board.levels[equipped.id].lvl;
    if (level > 0) out[equipped.stat] += (ANTIQUE_STAT_PER_LEVEL[equipped.stat] || 0) * level;
  }
  const master = accountAntiqueMasterBonus(accountAntiqueMasterLevel(antiques));
  out.hp += master.hp;
  out.atk += master.atk;
  out.def += master.def;
  out.spd += master.spd;
  return out;
}

export function prepareAntiqueEquip(player, { id } = {}) {
  const board = normalizeAccountAntiques(player?.antiques);
  if (id == null || id === '') {
    board.equipped = null;
    return { ok: true, antiques: board, id: null };
  }
  if (!findAccountAntique(id)) return antiqueFail('INVALID_ANTIQUE', 'Cổ vật không hợp lệ.');
  board.equipped = board.equipped === id ? null : id;
  return { ok: true, antiques: board, id: board.equipped };
}

export function prepareAntiqueEnhance(player, { id, times = 1 } = {}) {
  const item = findAccountAntique(id);
  if (!item) return antiqueFail('INVALID_ANTIQUE', 'Cổ vật không hợp lệ.');
  const board = normalizeAccountAntiques(player?.antiques);
  let gold = Math.max(0, Number(player?.gold) || 0);
  let hoat = Math.max(0, Number(player?.hoat) || 0);
  const steps = Math.max(1, Math.floor(Number(times) || 1));
  let raised = 0;
  let spentGold = 0;
  let spentHoat = 0;
  if (board.levels[id].lvl >= ANTIQUE_MAX_LEVEL) return antiqueFail('ANTIQUE_MAX_LEVEL', 'Cổ vật đã đạt cấp tối đa.');
  for (let step = 0; step < steps; step++) {
    if (board.levels[id].lvl >= ANTIQUE_MAX_LEVEL) break;
    const cost = antiqueEnhanceCost(board.levels[id].lvl);
    if (gold < cost.gold) {
      if (!raised) return antiqueFail('INSUFFICIENT_GOLD', 'Không đủ vàng để cường hóa.');
      break;
    }
    if (hoat < cost.hoat) {
      if (!raised) return antiqueFail('INSUFFICIENT_HOAT', 'Không đủ Hoạt Lực để cường hóa.');
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
    antiques: board,
    gold,
    hoat,
    id,
    raised,
    spentGold,
    spentHoat,
    level: board.levels[id].lvl
  };
}
