/* Samkok E10/E11: player loadout commands use the R07 transaction owner. */
function hvApplyLoadoutOpeningEvent(state, eventId, detail) {
  return window.HonVietOpeningLoop?.applyToState?.(state, eventId, {
    ...detail, periodKey: 'permanent', transactionStatus: 'success'
  });
}

function saveFormationCommand(squad, commandId, options = {}) {
  const commandKey = commandId || 'formation.save:' + (P.revision || 0);
  const duplicate = hvReceiptForCommand(commandKey);
  if (duplicate) return duplicate;
  const change = prepareFormationChange(P, DATA.heroes, squad, options);
  if (!change.ok) return change;
  return hvRunCommittedTransaction({
    commandId: commandKey, source: 'formation.save', reason: 'formation',
    mutate: state => {
      state.squad = change.squad.map(pick => ({ ...pick }));
      hvApplyLoadoutOpeningEvent(state, 'formation.save', { sourceId: 'starter-formation', route: { screen: 'team' } });
      return { ok: true, squad: change.squad };
    }
  });
}

function changeEquipmentCommand(uid, heroId, action = 'equip', commandId) {
  const commandKey = commandId || 'hero.' + action + ':' + heroId + ':' + uid + ':' + (P.revision || 0);
  const duplicate = hvReceiptForCommand(commandKey);
  if (duplicate) return duplicate;
  const change = prepareEquipmentChange(P, DATA.heroes, DATA.items.slots, { uid, heroId, action });
  if (!change.ok || change.unchanged) return change;
  return hvRunCommittedTransaction({
    commandId: commandKey, source: 'hero.' + action, reason: 'equipment',
    mutate: state => {
      state.equip = change.equip;
      if (action === 'equip') hvApplyLoadoutOpeningEvent(state, 'hero.equip', {
        sourceId: heroId + ':' + uid, route: { screen: 'forge' }
      });
      return { ok: true, heroId, uid, action, replacedUid: change.replacedUid, previousOwners: change.previousOwners };
    }
  });
}

function equipItem(uid, heroId, commandId) {
  const result = changeEquipmentCommand(uid, heroId, 'equip', commandId);
  if (!result.ok) { toast(result.message || 'Chưa lưu được trang bị. Hãy thử lại.'); return false; }
  if (!result.duplicate && !result.unchanged) {
    const item = P.inventory.find(candidate => candidate.uid === uid);
    toast('Đã mặc ' + itemName(item) + ' cho ' + DATA.heroes[heroId].name + '.');
  }
  return true;
}

function unequipItem(uid, heroId, commandId) {
  const result = changeEquipmentCommand(uid, heroId, 'unequip', commandId);
  if (!result.ok) { toast(result.message || 'Chưa tháo được trang bị. Hãy thử lại.'); return false; }
  if (!result.duplicate) toast('Đã tháo trang bị về kho.');
  return true;
}
