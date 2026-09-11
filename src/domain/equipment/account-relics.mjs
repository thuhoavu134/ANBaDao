const relicFail = (code, message) => ({ ok: false, code, message });

export const ACCOUNT_RELICS = Object.freeze([
  Object.freeze({ id: 'trong-dong', name: 'Trống Đồng', set: 'lac-viet', stat: 'hp', column: 'left', order: 0 }),
  Object.freeze({ id: 'cuu-dinh', name: 'Cửu Đỉnh', set: 'lac-viet', stat: 'hp', column: 'left', order: 1 }),
  Object.freeze({ id: 'luoi-cay', name: 'Lưỡi Cày', set: 'lac-viet', stat: 'def', column: 'left', order: 2 }),
  Object.freeze({ id: 'chuong-dong', name: 'Chuông Đồng', set: 'lac-viet', stat: 'spd', column: 'left', order: 3 }),
  Object.freeze({ id: 'no-than', name: 'Nỏ Thần', set: 'de-vuong', stat: 'atk', column: 'right', order: 0 }),
  Object.freeze({ id: 'kiem-ngoc', name: 'Kiếm Ngọc', set: 'de-vuong', stat: 'atk', column: 'right', order: 1 }),
  Object.freeze({ id: 'an-vang', name: 'Ấn Vàng', set: 'de-vuong', stat: 'def', column: 'right', order: 2 }),
  Object.freeze({ id: 'ngoc-bich', name: 'Ngọc Bích', set: 'de-vuong', stat: 'spd', column: 'right', order: 3 })
]);

export const RELIC_SETS = Object.freeze([
  Object.freeze({ id: 'lac-viet', name: 'Lạc Việt', two: Object.freeze({ hp: 40 }), four: Object.freeze({ hp: 80, def: 8 }) }),
  Object.freeze({ id: 'de-vuong', name: 'Đế Vương', two: Object.freeze({ atk: 6 }), four: Object.freeze({ atk: 12, spd: 2 }) })
]);

export const RELIC_STAT_PER_LEVEL = Object.freeze({ hp: 12, atk: 2, def: 2, spd: 0.4 });
export const RELIC_MASTER_PER_LEVEL = Object.freeze({ hp: 20, atk: 2, def: 2, spd: 0.5 });
export const RELIC_MAX_LEVEL = 15;

const RELIC_IDS = ACCOUNT_RELICS.map(relic => relic.id);

function clampLevel(value) {
  const n = Math.floor(Number(value) || 0);
  return Math.max(0, Math.min(RELIC_MAX_LEVEL, n));
}

export function emptyAccountRelics() {
  return Object.fromEntries(RELIC_IDS.map(id => [id, { lvl: 0 }]));
}

export function findAccountRelic(id) {
  return ACCOUNT_RELICS.find(relic => relic.id === id) || null;
}

export function normalizeAccountRelics(relics) {
  const next = emptyAccountRelics();
  if (!relics || typeof relics !== 'object') return next;
  for (const id of RELIC_IDS) {
    next[id] = { lvl: clampLevel(relics[id]?.lvl) };
  }
  return next;
}

export function relicEnhanceCost(level) {
  const n = Math.max(0, Math.min(RELIC_MAX_LEVEL, Number(level) || 0));
  return { gold: 80 + n * 40, hoat: 4 + Math.floor(n / 3) };
}

export function relicArt(id) {
  return findAccountRelic(id) ? ('assets/ui/account-relics/' + id + '.png') : '';
}

export function accountRelicMasterLevel(relics) {
  const board = normalizeAccountRelics(relics);
  let min = Infinity;
  for (const id of RELIC_IDS) {
    const level = board[id].lvl;
    if (level <= 0) return 0;
    min = Math.min(min, level);
  }
  return min === Infinity ? 0 : min;
}

export function accountRelicMasterBonus(level) {
  const n = Math.max(0, Math.min(RELIC_MAX_LEVEL, Number(level) || 0));
  return {
    hp: RELIC_MASTER_PER_LEVEL.hp * n,
    atk: RELIC_MASTER_PER_LEVEL.atk * n,
    def: RELIC_MASTER_PER_LEVEL.def * n,
    spd: RELIC_MASTER_PER_LEVEL.spd * n
  };
}

export function accountRelicMasterProgress(relics) {
  const level = accountRelicMasterLevel(relics);
  const next = level >= RELIC_MAX_LEVEL ? RELIC_MAX_LEVEL : level + 1;
  const board = normalizeAccountRelics(relics);
  let ready = 0;
  for (const id of RELIC_IDS) {
    if (board[id].lvl >= next) ready++;
  }
  return { level, next, ready, need: RELIC_IDS.length, max: RELIC_MAX_LEVEL, active: level > 0 };
}

function addStats(out, add) {
  if (!add) return;
  for (const key of ['hp', 'atk', 'def', 'spd']) {
    out[key] += Number(add[key]) || 0;
  }
}

export function accountRelicBonus(relics) {
  const board = normalizeAccountRelics(relics);
  const out = { hp: 0, atk: 0, def: 0, spd: 0 };
  const setReady = Object.fromEntries(RELIC_SETS.map(set => [set.id, 0]));
  for (const relic of ACCOUNT_RELICS) {
    const level = board[relic.id].lvl;
    if (level <= 0) continue;
    out[relic.stat] += (RELIC_STAT_PER_LEVEL[relic.stat] || 0) * level;
    setReady[relic.set] += 1;
  }
  for (const set of RELIC_SETS) {
    const ready = setReady[set.id] || 0;
    if (ready >= 2) addStats(out, set.two);
    if (ready >= 4) addStats(out, set.four);
  }
  addStats(out, accountRelicMasterBonus(accountRelicMasterLevel(relics)));
  return out;
}

export function prepareRelicEnhance(player, { id, times = 1 } = {}) {
  const relic = findAccountRelic(id);
  if (!relic) return relicFail('INVALID_RELIC', 'Bảo vật không hợp lệ.');
  const board = normalizeAccountRelics(player?.relics);
  let gold = Math.max(0, Number(player?.gold) || 0);
  let hoat = Math.max(0, Number(player?.hoat) || 0);
  const steps = Math.max(1, Math.floor(Number(times) || 1));
  let raised = 0;
  let spentGold = 0;
  let spentHoat = 0;
  if (board[id].lvl >= RELIC_MAX_LEVEL) return relicFail('RELIC_MAX_LEVEL', 'Bảo vật đã đạt cấp tối đa.');
  for (let step = 0; step < steps; step++) {
    if (board[id].lvl >= RELIC_MAX_LEVEL) break;
    const cost = relicEnhanceCost(board[id].lvl);
    if (gold < cost.gold) {
      if (!raised) return relicFail('INSUFFICIENT_GOLD', 'Không đủ vàng để cường hóa.');
      break;
    }
    if (hoat < cost.hoat) {
      if (!raised) return relicFail('INSUFFICIENT_HOAT', 'Không đủ Hoạt Lực để cường hóa.');
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
    relics: board,
    gold,
    hoat,
    id,
    raised,
    spentGold,
    spentHoat,
    level: board[id].lvl
  };
}
