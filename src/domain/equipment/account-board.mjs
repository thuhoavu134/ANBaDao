const failure = (code, message) => ({ ok: false, code, message });

export const ACCOUNT_GEAR_SLOTS = Object.freeze([
  Object.freeze({ id: 'I', roman: 'I', kind: 'armor', name: 'Nón', priority: 1 }),
  Object.freeze({ id: 'II', roman: 'II', kind: 'charm', name: 'Đai', priority: 1 }),
  Object.freeze({ id: 'III', roman: 'III', kind: 'charm', name: 'Dây chuyền', priority: 2 }),
  Object.freeze({ id: 'IV', roman: 'IV', kind: 'charm', name: 'Nhẫn', priority: 3 }),
  Object.freeze({ id: 'V', roman: 'V', kind: 'armor', name: 'Giáp', priority: 2 }),
  Object.freeze({ id: 'VI', roman: 'VI', kind: 'weapon', name: 'Túi', priority: 2 }),
  Object.freeze({ id: 'VII', roman: 'VII', kind: 'boots', name: 'Giày', priority: 1 }),
  Object.freeze({ id: 'VIII', roman: 'VIII', kind: 'armor', name: 'Khôi', priority: 3 }),
  Object.freeze({ id: 'IX', roman: 'IX', kind: 'boots', name: 'Hộ uyển', priority: 2 }),
  Object.freeze({ id: 'X', roman: 'X', kind: 'weapon', name: 'Khăn', priority: 3 }),
  Object.freeze({ id: 'XI', roman: 'XI', kind: 'boots', name: 'Ngọc bội', priority: 3 }),
  Object.freeze({ id: 'XII', roman: 'XII', kind: 'weapon', name: 'Vũ khí', priority: 1 })
]);

const SLOT_IDS = ACCOUNT_GEAR_SLOTS.map(slot => slot.id);

export function emptyAccountGear() {
  return Object.fromEntries(SLOT_IDS.map(id => [id, null]));
}

export function findAccountGearSlot(id) {
  return ACCOUNT_GEAR_SLOTS.find(slot => slot.id === id) || null;
}

export function normalizeAccountGear(gear) {
  const next = emptyAccountGear();
  if (!gear || typeof gear !== 'object') return next;
  for (const id of SLOT_IDS) {
    const uid = gear[id];
    next[id] = Number.isSafeInteger(uid) && uid > 0 ? uid : null;
  }
  return next;
}

export function rankGearItem(item, rarOrder = {}) {
  const rarity = 5 - Number(rarOrder[item?.rar] ?? 4);
  const level = Number(item?.lvl) || 0;
  return rarity * 1000 + level;
}

function inventoryItem(player, uid) {
  const matches = (player?.inventory || []).filter(item => item.uid === uid);
  return matches.length === 1 ? matches[0] : null;
}

function wornUids(gear, exceptSlot = null) {
  const used = new Set();
  const board = normalizeAccountGear(gear);
  for (const id of SLOT_IDS) {
    if (id === exceptSlot || board[id] == null) continue;
    used.add(board[id]);
  }
  return used;
}

export function candidatesForGearSlot(player, slotId, { rarOrder = {} } = {}) {
  const slot = findAccountGearSlot(slotId);
  if (!slot) return [];
  const used = wornUids(player?.gear);
  return (player?.inventory || [])
    .filter(item => item && item.slot === slot.kind && Number.isSafeInteger(item.uid) && !used.has(item.uid))
    .slice()
    .sort((a, b) => rankGearItem(b, rarOrder) - rankGearItem(a, rarOrder) || a.uid - b.uid);
}

export function prepareAccountGearChange(player, { slotId, uid, action = 'equip' } = {}) {
  const slot = findAccountGearSlot(slotId);
  if (!slot) return failure('INVALID_SLOT', 'Ô trang bị không hợp lệ.');
  const gear = normalizeAccountGear(player?.gear);
  if (action === 'unequip') {
    if (gear[slotId] !== uid) return failure('EQUIPMENT_NOT_WORN', 'Ô này không mặc món đó.');
    gear[slotId] = null;
    return { ok: true, gear, slotId, uid, action };
  }
  if (action !== 'equip') return failure('INVALID_EQUIP_ACTION', 'Thao tác trang bị không hợp lệ.');
  const item = inventoryItem(player, uid);
  if (!item) return failure('INVALID_EQUIPMENT', 'Không tìm thấy trang bị hợp lệ trong kho.');
  if (item.slot !== slot.kind) return failure('WRONG_SLOT_KIND', 'Món này không đúng loại ô.');
  if (gear[slotId] === uid) return { ok: true, gear, unchanged: true, slotId, uid, action };
  for (const id of SLOT_IDS) if (gear[id] === uid) gear[id] = null;
  gear[slotId] = uid;
  return { ok: true, gear, slotId, uid, action };
}

export function prepareQuickEquip(player, { rarOrder = {} } = {}) {
  const gear = normalizeAccountGear(player?.gear);
  let changed = 0;
  const kinds = ['weapon', 'armor', 'charm', 'boots'];
  for (const kind of kinds) {
    const slots = ACCOUNT_GEAR_SLOTS.filter(slot => slot.kind === kind).sort((a, b) => a.priority - b.priority);
    const bag = (player?.inventory || [])
      .filter(item => item && item.slot === kind)
      .slice()
      .sort((a, b) => rankGearItem(b, rarOrder) - rankGearItem(a, rarOrder) || a.uid - b.uid);
    const assigned = new Set();
    for (let index = 0; index < slots.length; index++) {
      const slot = slots[index];
      const current = gear[slot.id] == null ? null : bag.find(item => item.uid === gear[slot.id]) || null;
      const next = bag.find(item => !assigned.has(item.uid) && item !== current);
      const best = [current, next].filter(Boolean).sort((a, b) => rankGearItem(b, rarOrder) - rankGearItem(a, rarOrder) || a.uid - b.uid)[0];
      if (!best) continue;
      assigned.add(best.uid);
      if (gear[slot.id] !== best.uid) {
        for (const id of SLOT_IDS) if (gear[id] === best.uid) gear[id] = null;
        gear[slot.id] = best.uid;
        changed++;
      }
    }
  }
  return {
    ok: true,
    gear,
    changed,
    message: changed ? null : 'Không có trang bị tốt hơn để mang'
  };
}

export function prepareQuickUnequip(player) {
  return { ok: true, gear: emptyAccountGear(), changed: true };
}

export function accountGearMasterLevel(gear, inventory) {
  const board = normalizeAccountGear(gear);
  const bag = Array.isArray(inventory) ? inventory : [];
  let min = Infinity;
  for (const id of SLOT_IDS) {
    const uid = board[id];
    if (uid == null) return 0;
    const item = bag.find(entry => entry.uid === uid);
    if (!item) return 0;
    min = Math.min(min, Number(item.lvl) || 0);
  }
  return min === Infinity ? 0 : min;
}

export const MASTER_BONUS_PER_LEVEL = Object.freeze({ hp: 40, atk: 4, def: 3, spd: 1 });
const MASTER_MAX_LEVEL = 15;

export function accountGearMasterBonus(level) {
  const n = Math.max(0, Math.min(MASTER_MAX_LEVEL, Number(level) || 0));
  return {
    hp: MASTER_BONUS_PER_LEVEL.hp * n,
    atk: MASTER_BONUS_PER_LEVEL.atk * n,
    def: MASTER_BONUS_PER_LEVEL.def * n,
    spd: MASTER_BONUS_PER_LEVEL.spd * n
  };
}

export function accountGearMasterProgress(gear, inventory) {
  const level = accountGearMasterLevel(gear, inventory);
  const next = level >= MASTER_MAX_LEVEL ? MASTER_MAX_LEVEL : level + 1;
  const board = normalizeAccountGear(gear);
  const bag = Array.isArray(inventory) ? inventory : [];
  let ready = 0;
  for (const id of SLOT_IDS) {
    const uid = board[id];
    if (uid == null) continue;
    const item = bag.find(entry => entry.uid === uid);
    if (!item) continue;
    if ((Number(item.lvl) || 0) >= next) ready++;
  }
  return { level, next, ready, need: SLOT_IDS.length, max: MASTER_MAX_LEVEL, active: level > 0 };
}

export function accountGearBonus(gear, inventory, { statMap = {}, itemStat = () => 0 } = {}) {
  const out = { hp: 0, atk: 0, def: 0, spd: 0 };
  const board = normalizeAccountGear(gear);
  const bag = Array.isArray(inventory) ? inventory : [];
  for (const id of SLOT_IDS) {
    const uid = board[id];
    if (uid == null) continue;
    const item = bag.find(entry => entry.uid === uid);
    if (!item) continue;
    const key = statMap[item.slot];
    if (!key || out[key] == null) continue;
    out[key] += Number(itemStat(item)) || 0;
  }
  const master = accountGearMasterBonus(accountGearMasterLevel(gear, inventory));
  out.hp += master.hp;
  out.atk += master.atk;
  out.def += master.def;
  out.spd += master.spd;
  return out;
}

export const SMELT_GAIN = Object.freeze({ b: 5, a: 8, s: 12, ss: 18, ssr: 28 });
export const SMELT_TRAY_SIZE = 8;

function isLockedItem(item) {
  return Boolean(item?.locked || item?.lock);
}

function allWornUids(player) {
  const used = wornUids(player?.gear);
  for (const links of Object.values(player?.equip || {})) {
    for (const uid of Object.values(links || {})) {
      if (Number.isSafeInteger(uid) && uid > 0) used.add(uid);
    }
  }
  return used;
}

function smeltGainFor(item) {
  if (!item || !Object.hasOwn(SMELT_GAIN, item.rar)) return null;
  return SMELT_GAIN[item.rar] + (Number(item.lvl) || 0) * 2;
}

export function smeltCandidates(player, { kind = 'all' } = {}) {
  const used = allWornUids(player);
  return (player?.inventory || []).filter(item => {
    if (!item || !Number.isSafeInteger(item.uid) || used.has(item.uid) || isLockedItem(item)) return false;
    if (smeltGainFor(item) == null) return false;
    if (kind && kind !== 'all' && item.slot !== kind) return false;
    return true;
  });
}

export function prepareSmeltSelection(player, uids) {
  const unique = [];
  const seen = new Set();
  for (const raw of Array.isArray(uids) ? uids : []) {
    const uid = Number(raw);
    if (!Number.isSafeInteger(uid) || uid <= 0 || seen.has(uid)) continue;
    seen.add(uid);
    unique.push(uid);
  }
  if (!unique.length) return failure('NO_SELECTION', 'Hãy chọn trang bị!');
  if (unique.length > SMELT_TRAY_SIZE) return failure('TOO_MANY_SELECTED', 'Chỉ dung luyện tối đa 8 món.');
  const used = allWornUids(player);
  const quotes = [];
  for (const uid of unique) {
    const item = inventoryItem(player, uid);
    const gain = smeltGainFor(item);
    if (!item || gain == null) return failure('INVALID_EQUIPMENT', 'Không tìm thấy trang bị hợp lệ trong kho.');
    if (isLockedItem(item)) return failure('ITEM_LOCKED', 'Mở khóa trang bị trước khi dung luyện.');
    if (used.has(uid)) return failure('EQUIPMENT_WORN', 'Tháo trang bị trước khi dung luyện.');
    quotes.push({ uid, slot: item.slot, rar: item.rar, lvl: item.lvl, gain });
  }
  return {
    ok: true,
    uids: unique,
    quotes,
    gain: quotes.reduce((sum, quote) => sum + quote.gain, 0)
  };
}
