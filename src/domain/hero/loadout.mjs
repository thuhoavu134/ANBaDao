// Prepare changes without touching the player; the transaction owns mutation/save.
const loadoutFailure = (code, message) => ({ ok: false, code, message });
const loadoutOwn = (value, key) => value != null && Object.prototype.hasOwnProperty.call(value, key);

function uniqueFormationSlots(squad) {
  const used = new Set();
  for (const pick of squad) {
    const slot = Number(pick?.slot);
    if (!Number.isInteger(slot) || slot < 0 || slot > 5 || used.has(slot)) return false;
    used.add(slot);
  }
  return true;
}

export function prepareFormationChange(player, catalog, squad, { allowPartial = false } = {}) {
  const picks = Array.isArray(squad) ? squad.filter(pick => pick && typeof pick.id === 'string') : null;
  if (!picks || picks.length > 6 || picks.length < (allowPartial ? 1 : 6)) {
    return loadoutFailure('INVALID_FORMATION_SIZE', allowPartial ? 'Chọn từ 1 đến 6 tướng để xuất chiến.' : 'Cần chọn đủ 6 tướng khác nhau.');
  }
  const seen = new Set();
  const keepSlots = uniqueFormationSlots(picks);
  for (const pick of picks) {
    const id = pick?.id;
    if (typeof id !== 'string' || !loadoutOwn(catalog, id) || !loadoutOwn(player?.heroes, id) || !player.heroes[id].owned) {
      return loadoutFailure('HERO_NOT_OWNED', 'Chỉ có thể xếp tướng đã sở hữu.');
    }
    if (seen.has(id)) return loadoutFailure('DUPLICATE_HERO', 'Một tướng chỉ được đứng ở một vị trí.');
    if (!['front', 'back'].includes(pick.row)) return loadoutFailure('INVALID_ROW', 'Hãy chọn hàng trước hoặc hàng sau.');
    seen.add(id);
  }
  return {
    ok: true,
    squad: picks.map(({ id, row, slot }) => keepSlots ? { id, row, slot: Number(slot) } : { id, row })
  };
}

export function prepareEquipmentChange(player, catalog, slots, { uid, heroId, action = 'equip' } = {}) {
  if (!['equip', 'unequip'].includes(action)) return loadoutFailure('INVALID_EQUIP_ACTION', 'Thao tác trang bị không hợp lệ.');
  if (!loadoutOwn(catalog, heroId) || !loadoutOwn(player?.heroes, heroId) || !player.heroes[heroId].owned) {
    return loadoutFailure('HERO_NOT_OWNED', 'Không tìm thấy tướng đã sở hữu.');
  }
  const matches = (player.inventory || []).filter(item => item.uid === uid);
  if (matches.length !== 1 || !slots.includes(matches[0].slot)) {
    return loadoutFailure('INVALID_EQUIPMENT', 'Không tìm thấy trang bị hợp lệ trong kho.');
  }
  const item = matches[0];
  const equip = JSON.parse(JSON.stringify(player.equip || {}));
  const owners = Object.entries(equip).flatMap(([id, entries]) =>
    Object.entries(entries || {}).filter(([, value]) => value === uid).map(([slot]) => ({ heroId: id, slot })));
  if (action === 'unequip' && equip[heroId]?.[item.slot] !== uid) {
    return loadoutFailure('EQUIPMENT_NOT_WORN', 'Tướng này không mặc món trang bị đó.');
  }
  const unchanged = action === 'equip' && owners.length === 1 && owners[0].heroId === heroId && owners[0].slot === item.slot;
  const replacedUid = action === 'equip' ? equip[heroId]?.[item.slot] ?? null : null;
  // Inventory stores every instance, including worn items. Only links move.
  for (const owner of owners) equip[owner.heroId][owner.slot] = null;
  if (action === 'equip') {
    equip[heroId] = equip[heroId] || {};
    equip[heroId][item.slot] = uid;
  }
  return { ok: true, equip, unchanged, uid, heroId, slot: item.slot, replacedUid, previousOwners: owners, action };
}
