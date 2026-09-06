/* Samkok E11: one transaction owner for materials, instances, pity and progress. */
function forgeCommand(action, payload = {}, commandId) {
  const key = commandId || 'forge.' + action + ':' + (payload.uid || payload.slot || payload.mold || '') + ':' + (P.revision || 0);
  const duplicate = hvReceiptForCommand(key);
  if (duplicate) return duplicate;
  if (featLocked('forge')) return { ok: false, code: 'FORGE_LOCKED', message: 'Rèn Mộng chưa mở. Hãy tiếp tục Chinh Chiến.' };
  const change = prepareForgeCommand(P, {
    slots: DATA.items.slots, molds: FORGE_MOLDS, craftCost: CRAFT, dualCost: DUAL_FORGE, factors: RFAC
  }, action, payload);
  if (!change.ok || change.unchanged) return change;
  const options = {
    commandId: key, source: 'forge.' + action, reason: 'equipment', cost: change.cost,
    balances: { gold: P.gold, tinh: P.tinh || 0, hoat: P.hoat || 0 },
    mutate: state => {
      if (action === 'mold') { econ().forgeMold = change.mold; return { ok: true, mold: change.mold }; }
      if (action === 'dual') {
        const economy = econ();
        economy.forgePending = { id: key, slot: change.slot, mold: change.mold,
          candidates: [forgeCandidate(change.slot), forgeCandidate(change.slot)] };
        economy.forgeStats.dual++;
        return { ok: true, pending: economy.forgePending };
      }
      if (action === 'craft' || action === 'choose') {
        const item = action === 'craft'
          ? { ...forgeCandidate(change.slot), uid: change.uid, locked: false }
          : { ...change.item };
        state.itemSeq = item.uid;
        state.inventory.push(item);
        if (action === 'choose') { econ().forgePending = null; econ().forgeStats.chosen++; }
        questProgress('craft', 1, false);
        return { ok: true, item, pendingId: change.pendingId };
      }
      const item = state.inventory.find(candidate => candidate.uid === payload.uid);
      if (action === 'enhance') item.lvl = change.level;
      if (action === 'lock') {
        item.locked = change.locked;
        if ('lock' in item) item.lock = change.locked;
      }
      if (action === 'salvage') state.inventory = state.inventory.filter(candidate => candidate.uid !== payload.uid);
      return { ok: true, item: { ...item }, gain: change.gain };
    }
  };
  if (action === 'salvage') {
    options.reward = { tinh: change.gain };
    options.applyRewardFn = (reward, state) => { state.tinh = (state.tinh || 0) + reward.tinh; return true; };
  }
  return hvRunCommittedTransaction(options);
}

function forgeFeedback(result, message) {
  if (!result.ok) { toast(result.message || 'Chưa hoàn tất thao tác. Hãy thử lại.'); return false; }
  if (!result.duplicate && !result.unchanged) { refreshResbar(); toast(message(result.result)); }
  return true;
}

function setForgeMold(id, commandId) {
  return forgeFeedback(forgeCommand('mold', { mold: id }, commandId), () => 'Đã chọn ' + FORGE_MOLDS[id].name + '.');
}
function craftItem(slot, commandId) {
  const result = forgeCommand('craft', { slot }, commandId);
  return forgeFeedback(result, value => 'Ra lò [' + value.item.rar.toUpperCase() + '] ' + itemName(value.item)) ? result.result.item : null;
}
function startDualForge(slot, commandId) {
  const result = forgeCommand('dual', { slot }, commandId);
  if (result.ok && !result.duplicate) refreshResbar();
  return { ...result, msg: result.message };
}
function chooseDualForge(index, commandId, pendingId = forgePendingId(P)) {
  return forgeFeedback(forgeCommand('choose', { index, pendingId }, commandId || 'forge.choose:' + pendingId),
    value => 'Đã giữ ' + itemName(value.item) + ' · ' + FORGE_MOLDS[value.item.mold].name);
}
function enhanceItem(uid, commandId) {
  return forgeFeedback(forgeCommand('enhance', { uid }, commandId), value => itemName(value.item) + ' → +' + value.item.lvl
    + ' · ' + itemStat(value.item) + ' ' + DATA.items.statName[value.item.slot]);
}
function salvageItem(uid, commandId, quote) {
  return forgeFeedback(forgeCommand('salvage', { uid, quote }, commandId),
    value => '♻️ Phân giải ' + itemName(value.item) + ' → +' + value.gain + ' ⚗ Tinh Lực');
}
function setForgeItemLock(uid, locked, commandId) {
  return forgeFeedback(forgeCommand('lock', { uid, locked }, commandId), () => locked ? 'Đã khóa trang bị.' : 'Đã mở khóa trang bị.');
}

function confirmForgeSalvage(uid, opener) {
  const body = document.getElementById('forgeBody');
  if (body.querySelector('.forge-salvage-dialog')) return;
  const preview = previewForgeSalvage(P, uid, DATA.items.slots);
  if (!preview.ok) { toast(preview.message); return; }
  const dialog = document.createElement('dialog');
  dialog.className = 'forge-salvage-dialog';
  dialog.setAttribute('aria-labelledby', 'forgeSalvageTitle');
  dialog.innerHTML = '<h3 id="forgeSalvageTitle">Phân giải trang bị?</h3><p class="forge-salvage-item"></p>'
    + '<p class="forge-salvage-gain"></p><p>Món này sẽ bị tiêu hủy. Không thể hoàn tác.</p>'
    + '<p class="forge-salvage-error" role="alert"></p><div class="econ-actions">'
    + '<button class="btn ghost" data-forge-cancel autofocus>Giữ lại</button>'
    + '<button class="btn gold" data-forge-confirm>Xác nhận phân giải</button></div>';
  dialog.querySelector('.forge-salvage-item').textContent = '[' + preview.item.rar.toUpperCase() + '] '
    + itemName(preview.item) + ' +' + preview.item.lvl;
  dialog.querySelector('.forge-salvage-gain').textContent = 'Nhận: +' + preview.quote.gain + ' ⚗ Tinh Lực';
  const commandId = 'forge.salvage:' + uid + ':' + (P.revision || 0);
  dialog.querySelector('[data-forge-cancel]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => { dialog.remove(); if (opener?.isConnected) opener.focus(); }, { once: true });
  const confirmButton = dialog.querySelector('[data-forge-confirm]');
  confirmButton.addEventListener('click', () => {
    if (confirmButton.disabled) return;
    confirmButton.disabled = true;
    const result = forgeCommand('salvage', { uid, quote: preview.quote }, commandId);
    if (!result.ok) {
      confirmButton.disabled = false;
      dialog.querySelector('.forge-salvage-error').textContent = result.message || 'Chưa phân giải được. Hãy thử lại.';
      return;
    }
    forgeFeedback(result, value => '♻️ Phân giải ' + itemName(value.item) + ' → +' + value.gain + ' ⚗ Tinh Lực');
    dialog.close(); renderForge();
  });
  body.append(dialog);
  if (typeof dialog.showModal !== 'function') { dialog.remove(); toast('Trình duyệt chưa mở được xác nhận phân giải.'); return; }
  dialog.showModal();
}

function bindForgeCommands(body) {
  const revision = P.revision || 0, pendingId = forgePendingId(P);
  const bind = (selector, action) => body.querySelectorAll(selector).forEach(button => {
    button.addEventListener('click', () => {
      if (button.disabled) return;
      button.disabled = true;
      if (action(button)) renderForge(); else button.disabled = false;
    });
  });
  bind('.moldbtn', button => setForgeMold(button.dataset.m, 'forge.mold:' + button.dataset.m + ':' + revision));
  bind('.craftb', button => craftItem(button.dataset.s, 'forge.craft:' + button.dataset.s + ':' + revision));
  bind('.dualb', button => {
    const result = startDualForge(button.dataset.s, 'forge.dual:' + button.dataset.s + ':' + revision);
    if (!result.duplicate) toast(result.ok ? '🔥 Song Rèn đã ra hai phôi — chọn một.' : result.msg);
    return result.ok;
  });
  bind('.dualpick', button => chooseDualForge(+button.dataset.i, 'forge.choose:' + pendingId, pendingId));
  bind('.enh', button => enhanceItem(+button.dataset.u, 'forge.enhance:' + button.dataset.u + ':' + revision));
  bind('.itemlock', button => setForgeItemLock(+button.dataset.u, button.dataset.locked !== 'true', 'forge.lock:' + button.dataset.u + ':' + revision));
  bind('.uneqp', button => unequipItem(+button.dataset.u, button.dataset.h, 'forge.unequip:' + button.dataset.u + ':' + revision));
  bind('.eqp', button => { ST.equipPick = +button.dataset.u; return true; });
  bind('.eqto', button => {
    if (!equipItem(ST.equipPick, button.dataset.h, 'forge.equip:' + ST.equipPick + ':' + button.dataset.h + ':' + revision)) return false;
    ST.equipPick = null; return true;
  });
  bind('.salv', button => { confirmForgeSalvage(+button.dataset.u, button); return false; });
  bind('#eqCancel', () => { ST.equipPick = null; return true; });
}
