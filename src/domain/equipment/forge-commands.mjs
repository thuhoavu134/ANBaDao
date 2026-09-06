export const FORGE_MAX_LEVEL = 15;
const FORGE_SALVAGE_BASE = Object.freeze({ b: 5, a: 8, s: 12, ss: 18, ssr: 28 });

function forgeFailure(code, message) { return { ok: false, code, message }; }

export function isForgeItemLocked(item) { return Boolean(item?.locked || item?.lock); }

export function forgeEnhanceCost(item, factors) {
  return { gold: Math.round(80 * (item.lvl + 1) * factors[item.rar]), hoat: 4 * (item.lvl + 1) };
}

function validForgeItem(item, slots) {
  return item && slots.includes(item.slot) && Object.hasOwn(FORGE_SALVAGE_BASE, item.rar)
    && Number.isInteger(item.lvl) && item.lvl >= 0 && item.lvl <= FORGE_MAX_LEVEL;
}

function findForgeItem(state, uid, slots) {
  const matches = (state.inventory || []).filter(item => item.uid === uid);
  if (!Number.isSafeInteger(uid) || uid <= 0 || matches.length !== 1 || !validForgeItem(matches[0], slots)) {
    return forgeFailure('INVALID_EQUIPMENT', 'Không tìm thấy trang bị hợp lệ.');
  }
  return { ok: true, item: matches[0] };
}

function nextForgeUid(state) {
  let seq = state.itemSeq ?? 0;
  if (!Number.isSafeInteger(seq) || seq < 0) return null;
  for (const item of state.inventory || []) {
    if (!Number.isSafeInteger(item.uid) || item.uid <= 0) return null;
    seq = Math.max(seq, item.uid);
  }
  return Number.isSafeInteger(seq + 1) ? seq + 1 : null;
}

export function forgePendingId(state) {
  const pending = state.economy?.forgePending;
  if (!pending) return null;
  // Old saves have no pending ID. Keep their existing candidates without rerolling.
  return pending.id || 'legacy:' + (state.economy.forgeStats?.dual || 0) + ':' + pending.slot;
}

export function previewForgeSalvage(state, uid, slots) {
  const found = findForgeItem(state, uid, slots);
  if (!found.ok) return found;
  const item = found.item;
  if (isForgeItemLocked(item)) return forgeFailure('ITEM_LOCKED', 'Mở khóa trang bị trước khi phân giải.');
  if (Object.values(state.equip || {}).some(links => Object.values(links || {}).includes(uid))) {
    return forgeFailure('EQUIPMENT_WORN', 'Tháo trang bị trước khi phân giải.');
  }
  const gain = FORGE_SALVAGE_BASE[item.rar] + item.lvl * 2;
  return { ok: true, item: { ...item }, quote: { uid, slot: item.slot, rar: item.rar, lvl: item.lvl, gain } };
}

export function prepareForgeCommand(state, config, action, payload = {}) {
  const { slots, molds, craftCost, dualCost, factors } = config;
  const economy = state.economy || {};
  if (!Array.isArray(state.inventory)) return forgeFailure('INVALID_INVENTORY', 'Kho trang bị chưa sẵn sàng.');
  if (action === 'mold') {
    if (!Object.hasOwn(molds, payload.mold)) return forgeFailure('INVALID_MOLD', 'Khuôn rèn không hợp lệ.');
    return { ok: true, cost: {}, mold: payload.mold, unchanged: economy.forgeMold === payload.mold };
  }
  if (action === 'craft' || action === 'dual') {
    if (!slots.includes(payload.slot)) return forgeFailure('INVALID_SLOT', 'Loại trang bị không hợp lệ.');
    const mold = economy.forgeMold || 'strike';
    if (!Object.hasOwn(molds, mold)) return forgeFailure('INVALID_MOLD', 'Khuôn rèn không hợp lệ.');
    if (action === 'dual' && economy.forgePending) return forgeFailure('FORGE_PENDING', 'Hãy chọn một phôi đang chờ trước.');
    if (!Number.isSafeInteger(economy.craftPity ?? 0) || (economy.craftPity ?? 0) < 0) {
      return forgeFailure('INVALID_PITY', 'Dữ liệu bảo hiểm rèn không hợp lệ.');
    }
    const uid = nextForgeUid(state);
    if (!uid) return forgeFailure('INVALID_ITEM_SEQUENCE', 'Chưa thể tạo mã trang bị mới.');
    return { ok: true, cost: { ...(action === 'dual' ? dualCost : craftCost) }, slot: payload.slot, mold, uid };
  }
  if (action === 'choose') {
    const pending = economy.forgePending;
    if (!pending) return forgeFailure('NO_FORGE_PENDING', 'Không có phôi đang chờ.');
    if (payload.pendingId !== forgePendingId(state)) return forgeFailure('STALE_FORGE_PENDING', 'Phôi đang chờ đã thay đổi. Hãy mở lại Rèn Mộng.');
    if (![0, 1].includes(payload.index) || pending.candidates?.length !== 2) return forgeFailure('INVALID_CANDIDATE', 'Phôi đã chọn không hợp lệ.');
    const item = pending.candidates[payload.index];
    if (!validForgeItem(item, slots) || item.slot !== pending.slot || !Object.hasOwn(molds, item.mold)) {
      return forgeFailure('INVALID_CANDIDATE', 'Phôi đã chọn không hợp lệ.');
    }
    const uid = nextForgeUid(state);
    if (!uid) return forgeFailure('INVALID_ITEM_SEQUENCE', 'Chưa thể tạo mã trang bị mới.');
    return { ok: true, cost: {}, item: { ...item, uid, locked: false }, pendingId: payload.pendingId };
  }
  const found = findForgeItem(state, payload.uid, slots);
  if (!found.ok) return found;
  const item = found.item;
  if (action === 'enhance') {
    if (item.lvl >= FORGE_MAX_LEVEL) return forgeFailure('ITEM_MAX_LEVEL', 'Món này đã +15 tối đa.');
    return { ok: true, cost: forgeEnhanceCost(item, factors), uid: item.uid, level: item.lvl + 1 };
  }
  if (action === 'lock') {
    if (typeof payload.locked !== 'boolean') return forgeFailure('INVALID_LOCK', 'Trạng thái khóa không hợp lệ.');
    return { ok: true, cost: {}, uid: item.uid, locked: payload.locked, unchanged: isForgeItemLocked(item) === payload.locked };
  }
  if (action === 'salvage') {
    const preview = previewForgeSalvage(state, payload.uid, slots);
    if (!preview.ok) return preview;
    if (!payload.quote) return forgeFailure('CONFIRMATION_REQUIRED', 'Hãy xem và xác nhận vật liệu phân giải.');
    if (Object.keys(preview.quote).some(key => preview.quote[key] !== payload.quote[key])) {
      return forgeFailure('STALE_SALVAGE_QUOTE', 'Trang bị đã thay đổi. Hãy xem lại vật liệu phân giải.');
    }
    const balance = state.tinh ?? 0;
    if (!Number.isSafeInteger(balance) || balance < 0 || !Number.isSafeInteger(balance + preview.quote.gain)) {
      return forgeFailure('INVALID_BALANCE', 'Số dư Tinh Lực không hợp lệ.');
    }
    return { ...preview, cost: {}, gain: preview.quote.gain };
  }
  return forgeFailure('INVALID_FORGE_ACTION', 'Thao tác rèn không hợp lệ.');
}
