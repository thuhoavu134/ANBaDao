(() => {
  if (typeof document === 'undefined' || !document.body) return;
  const slots = typeof ACCOUNT_GEAR_SLOTS !== 'undefined' ? ACCOUNT_GEAR_SLOTS : [];
  const rarOrder = typeof RAR_ORDER === 'object' && RAR_ORDER ? RAR_ORDER : { ssr: 0, ss: 1, s: 2, a: 3, b: 4 };
  const traySize = typeof SMELT_TRAY_SIZE === 'number' ? SMELT_TRAY_SIZE : 8;
  const SMELT_FILTERS = [
    { kind: 'all', label: 'Tất cả' },
    { kind: 'weapon', label: 'Vũ khí' },
    { kind: 'armor', label: 'Giáp' },
    { kind: 'charm', label: 'Phụ kiện' },
    { kind: 'boots', label: 'Giày' }
  ];
  const ICONS = {
    relic: '<path d="M12 3l2.2 5.4H20l-4.6 3.4 1.8 5.5L12 14.2 6.8 17.3l1.8-5.5L4 8.4h5.8z"/>',
    gear: '<path d="M13 3l1.2 4.2 3.6-2.4-2.4 3.6L20 10l-4.2 1.2 2.4 3.6-3.6-2.4L13 17l-1.2-4.2-3.6 2.4 2.4-3.6L6 10l4.2-1.2-2.4-3.6 3.6 2.4z"/><path d="M8 20h3l7-16h-3z"/>',
    fish: '<path d="M3 12c5-7 13-7 16-1 0 0 3-1 4-3v8c-1-2-4-3-4-3-3 6-11 6-16-1zm6-1a1.2 1.2 0 1 0 0-2.4A1.2 1.2 0 0 0 9 11z"/>',
    pet: '<path d="M7.5 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm9 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM6 13c1.4 5 10.6 5 12 0-3.2 3.4-8.8 3.4-12 0z"/>',
    spirit: '<path d="M13 3a8 8 0 1 0 8 11A9 9 0 0 1 13 3z"/>',
    divine: '<path d="M12 2l1.5 6.5H20l-5.2 3.8 2 6.7L12 15.6 7.2 19l2-6.7L4 8.5h6.5z"/>',
    star: '<path d="M12 3l2.4 6.5H21l-5.2 4 2 6.5L12 16.5 6.2 20l2-6.5L3 9.5h6.6z"/>',
    antique: '<path d="M8 6h8l1.2 3.5H6.8zm1.4 3.5h5.2V17H9.4zM9 18h6v2H9z"/>',
    luck: '<path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm0 3a6 6 0 1 1 0 12 6 6 0 0 1 0-12zm0 2.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z"/>',
    illusion: '<path d="M12 5c5.4 0 9 7 9 7s-3.6 7-9 7-9-7-9-7 3.6-7 9-7zm0 3.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z"/>',
    formation: '<path d="M12 3l8 4v6.2c0 4.6-3.4 7.2-8 8.8-4.6-1.6-8-4.2-8-8.8V7z"/>'
  };
  const WHEEL = [
    { key: 'relic', label: 'Bảo Vật', angle: -90 },
    { key: 'gear', label: 'Trang bị', angle: -55, open: 'board' },
    { key: 'fish', label: 'Đồ Giám Cẩu Cá', angle: -18 },
    { key: 'pet', label: 'Linh Thú', angle: 22 },
    { key: 'spirit', label: 'Cửu Ứ Chiến Linh', angle: 58 },
    { key: 'divine', label: 'Thần Binh', angle: 90 },
    { key: 'star', label: 'Tướng Tinh', angle: 122 },
    { key: 'antique', label: 'Cổ Vật', angle: 158 },
    { key: 'luck', label: 'Tuệ Vận', angle: 198 },
    { key: 'illusion', label: 'Ảo Hình', angle: 234 },
    { key: 'formation', label: 'Quân Trận', angle: 270, open: 'formation' }
  ];

  function spokeGlyph(key) {
    return `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[key] || ICONS.relic}</svg>`;
  }

  const root = document.createElement('div');
  root.id = 'hvGearRoot';
  root.hidden = true;
  root.innerHTML = `
    <section class="hv-gear-screen" data-gear-view="wheel">
      <div class="hv-gear-top"><button type="button" class="hv-gear-back" data-gear-close aria-label="Đóng">‹</button><b>Trợ trận</b><span></span></div>
      <div class="hv-assist-stage">
        <img class="hv-assist-hero" alt="" data-gear-hero>
        <div class="hv-assist-wheel">
          <div class="hv-assist-core">Trợ trận</div>
          ${WHEEL.map(item => `<button type="button" class="hv-assist-spoke${item.open === 'board' ? ' is-on' : ''}${item.open ? '' : ' is-locked'}" data-assist="${item.key}" style="transform:rotate(${item.angle}deg) translate(0, calc(-1 * var(--wheel-r))) rotate(${-item.angle}deg)"><span>${spokeGlyph(item.key)}</span><small>${item.label}</small></button>`).join('')}
        </div>
      </div>
    </section>
    <section class="hv-gear-screen" data-gear-view="board">
      <div class="hv-gear-stage">
        <img class="hv-gear-hero" alt="" data-gear-hero>
        <div class="hv-gear-float" data-gear-float hidden></div>
      </div>
      <div class="hv-gear-top">
        <button type="button" class="hv-gear-back" data-gear-wheel aria-label="Quay lại">‹</button>
        <div class="hv-gear-chips">
          <span class="hv-gear-chip"><img src="assets/items/materials/gold.png" alt=""><b data-gear-gold>0</b></span>
          <span class="hv-gear-chip"><img src="assets/items/materials/hoat-luc.png" alt=""><b data-gear-hoat>0</b></span>
        </div>
        <button type="button" class="hv-gear-smelt" data-gear-smelt>Dung luyện</button>
      </div>
      <div class="hv-gear-panel">
        <div class="hv-gear-power" data-gear-power></div>
        <h2 class="hv-gear-title">Bậc Thầy Trang Bị: Lv<span data-gear-master>0</span></h2>
        <p class="hv-gear-copy">Tất cả trang bị đạt cùng mức độ bồi dưỡng sẽ kích hoạt</p>
        <div class="hv-gear-slots">
          <button type="button" class="hv-gear-slot" data-gear-slot="I" aria-label="Nón"><b class="roman">I</b><img alt=""><i class="plus">+</i><small class="lvl" hidden></small></button>
          <button type="button" class="hv-gear-slot" data-gear-slot="II" aria-label="Đai"><b class="roman">II</b><img alt=""><i class="plus">+</i><small class="lvl" hidden></small></button>
          <button type="button" class="hv-gear-slot" data-gear-slot="III" aria-label="Dây chuyền"><b class="roman">III</b><img alt=""><i class="plus">+</i><small class="lvl" hidden></small></button>
          <button type="button" class="hv-gear-slot" data-gear-slot="IV" aria-label="Nhẫn"><b class="roman">IV</b><img alt=""><i class="plus">+</i><small class="lvl" hidden></small></button>
          <button type="button" class="hv-gear-slot" data-gear-slot="V" aria-label="Giáp"><b class="roman">V</b><img alt=""><i class="plus">+</i><small class="lvl" hidden></small></button>
          <button type="button" class="hv-gear-slot" data-gear-slot="VI" aria-label="Túi"><b class="roman">VI</b><img alt=""><i class="plus">+</i><small class="lvl" hidden></small></button>
          <button type="button" class="hv-gear-slot" data-gear-slot="VII" aria-label="Giày"><b class="roman">VII</b><img alt=""><i class="plus">+</i><small class="lvl" hidden></small></button>
          <button type="button" class="hv-gear-slot" data-gear-slot="VIII" aria-label="Khôi"><b class="roman">VIII</b><img alt=""><i class="plus">+</i><small class="lvl" hidden></small></button>
          <button type="button" class="hv-gear-slot" data-gear-slot="IX" aria-label="Hộ uyển"><b class="roman">IX</b><img alt=""><i class="plus">+</i><small class="lvl" hidden></small></button>
          <button type="button" class="hv-gear-slot" data-gear-slot="X" aria-label="Khăn"><b class="roman">X</b><img alt=""><i class="plus">+</i><small class="lvl" hidden></small></button>
          <button type="button" class="hv-gear-slot" data-gear-slot="XI" aria-label="Ngọc bội"><b class="roman">XI</b><img alt=""><i class="plus">+</i><small class="lvl" hidden></small></button>
          <button type="button" class="hv-gear-slot" data-gear-slot="XII" aria-label="Vũ khí"><b class="roman">XII</b><img alt=""><i class="plus">+</i><small class="lvl" hidden></small></button>
        </div>
        <div class="hv-gear-tab-body" data-gear-tab-body></div>
        <div class="hv-gear-tabs">
          <button type="button" data-gear-tab="enhance">Cường hóa</button>
          <button type="button" data-gear-tab="wear">Trang bị</button>
        </div>
      </div>
      <div class="hv-gear-picker" data-gear-picker>
        <div class="hv-gear-sheet">
          <h3>Mặc trang bị</h3>
          <p>Hãy chọn trang bị trong danh sách</p>
          <div data-gear-choices></div>
          <button type="button" data-gear-picker-close>Đóng</button>
        </div>
      </div>
    </section>
    <section class="hv-gear-screen hv-smelt-screen" data-gear-view="smelt">
      <div class="hv-gear-top">
        <button type="button" class="hv-gear-back" data-gear-board aria-label="Quay lại">‹</button>
        <div class="hv-gear-chips">
          <span class="hv-gear-chip"><img src="assets/items/materials/gold.png" alt=""><b data-gear-gold>0</b></span>
          <span class="hv-gear-chip"><img src="assets/items/materials/hoat-luc.png" alt=""><b data-gear-hoat>0</b></span>
          <span class="hv-gear-chip"><img src="assets/items/materials/tinh-luc.png" alt=""><b data-gear-tinh>0</b></span>
        </div>
        <span class="hv-gear-smelt">Dung luyện</span>
      </div>
      <div class="hv-smelt-body">
        <h2 class="hv-gear-title">Chọn trang bị</h2>
        <div class="hv-smelt-tray" data-smelt-tray></div>
        <p class="hv-smelt-gain" data-smelt-gain></p>
        <div class="hv-smelt-filters">
          ${SMELT_FILTERS.map(item => `<button type="button" data-smelt-kind="${item.kind}">${item.label}</button>`).join('')}
        </div>
        <div class="hv-smelt-bag" data-smelt-bag></div>
      </div>
      <div class="hv-smelt-foot">
        <div class="hv-gear-actions" data-smelt-actions></div>
        <div class="hv-gear-tabs">
          <button type="button" data-smelt-tab="smelt">Dung luyện</button>
          <button type="button" data-smelt-tab="enhance">Cường hóa</button>
        </div>
      </div>
    </section>
  `;
  document.body.append(root);

  const state = { view: 'wheel', tab: 'enhance', slot: 'I', picker: null, smeltTab: 'smelt', smeltKind: 'all', smeltPicks: [] };

  function leadId() {
    return P?.squad?.[0]?.id || Object.keys(P?.heroes || {}).find(id => P.heroes[id]?.owned) || null;
  }
  function portrait() {
    const id = leadId();
    if (!id || typeof portraitSrc !== 'function') return '';
    return portraitSrc(id, 'master') || portraitSrc(id, 'card') || portraitSrc(id, 'avatar') || '';
  }
  function board() {
    P.gear = normalizeAccountGear(P.gear);
    return P.gear;
  }
  function itemOf(uid) {
    return (P.inventory || []).find(item => item.uid === uid) || null;
  }
  function selectedItem() {
    return itemOf(board()[state.slot]);
  }
  function artFor(item) {
    return globalThis.honVietEquipmentAssetFor?.(item) || 'assets/ui/menu-v3233/icons/forge.png';
  }
  function commit(gear, commandId, source) {
    const run = typeof hvRunCommittedTransaction === 'function' ? hvRunCommittedTransaction : null;
    if (!run) { P.gear = gear; persist?.(); return { ok: true }; }
    return run({
      commandId: commandId || (source + ':' + (P.revision || 0)),
      source, reason: 'account-gear',
      mutate: player => { player.gear = gear; return { ok: true }; }
    });
  }
  function bonus() {
    return accountGearBonus(board(), P.inventory || [], {
      statMap: DATA?.items?.statMap || { weapon: 'atk', armor: 'hp', charm: 'def', boots: 'spd' },
      itemStat: typeof itemStat === 'function' ? itemStat : (() => 0)
    });
  }
  function teamHp() {
    return (typeof normalizeSquad === 'function' ? normalizeSquad(P.squad, P, true) : (P.squad || []))
      .reduce((sum, pick) => sum + (typeof heroStats === 'function' ? heroStats(pick.id).hp : 0), 0);
  }
  function fillChips() {
    root.querySelectorAll('[data-gear-gold]').forEach(node => { node.textContent = Number(P.gold || 0).toLocaleString('vi-VN'); });
    root.querySelectorAll('[data-gear-hoat]').forEach(node => { node.textContent = Number(P.hoat || 0).toLocaleString('vi-VN'); });
    root.querySelectorAll('[data-gear-tinh]').forEach(node => { node.textContent = Number(P.tinh || 0).toLocaleString('vi-VN'); });
  }
  function isWornUid(uid) {
    if (Object.values(board()).includes(uid)) return true;
    return Object.values(P.equip || {}).some(links => Object.values(links || {}).includes(uid));
  }
  function itemCell(item, selected) {
    if (!item) return '<span class="hv-smelt-cell is-empty"><i class="plus">+</i></span>';
    const name = typeof itemName === 'function' ? itemName(item) : item.slot;
    const worn = isWornUid(item.uid) ? '<em>Mặc</em>' : '';
    return `<button type="button" class="hv-smelt-cell rar-${item.rar || 'b'}${selected ? ' is-on' : ''}" data-smelt-item="${item.uid}" aria-label="${name}"><img src="${artFor(item)}" alt=""><small class="lvl">+${item.lvl}</small>${worn}</button>`;
  }

  function renderWheel() {
    root.querySelectorAll('[data-gear-hero]').forEach(img => { img.src = portrait(); img.alt = DATA?.heroes?.[leadId()]?.name || ''; });
  }

  function renderBoard() {
    const gear = board();
    const master = accountGearMasterLevel(gear, P.inventory || []);
    root.querySelector('[data-gear-master]').textContent = String(master);
    fillChips();
    const power = typeof teamPower === 'function' ? teamPower() : 0;
    root.querySelector('[data-gear-power]').innerHTML = '<i class="hv-gear-power-ico"></i>' + power.toLocaleString('vi-VN');
    root.querySelectorAll('[data-gear-hero]').forEach(img => { img.src = portrait(); });
    for (const slot of slots) {
      const button = root.querySelector('[data-gear-slot="' + slot.id + '"]');
      if (!button) continue;
      const item = itemOf(gear[slot.id]);
      button.classList.toggle('is-on', state.slot === slot.id);
      button.classList.toggle('is-empty', !item);
      button.classList.remove('rar-ssr', 'rar-ss', 'rar-s', 'rar-a', 'rar-b');
      if (item?.rar) button.classList.add('rar-' + item.rar);
      const img = button.querySelector('img');
      const lvl = button.querySelector('.lvl');
      const plus = button.querySelector('.plus');
      img.hidden = !item;
      plus.hidden = !!item;
      if (item) {
        img.src = artFor(item);
        img.alt = typeof itemName === 'function' ? itemName(item) : slot.name;
        lvl.hidden = false;
        lvl.textContent = '+' + item.lvl;
      } else {
        img.removeAttribute('src');
        img.alt = '';
        lvl.hidden = true;
      }
    }
    root.querySelectorAll('[data-gear-tab]').forEach(button => button.classList.toggle('is-on', button.dataset.gearTab === state.tab));
    const body = root.querySelector('[data-gear-tab-body]');
    const item = selectedItem();
    const add = bonus();
    if (state.tab === 'wear') {
      body.innerHTML = `<div class="hv-gear-stats">
        <div>HP <b>${Number(add.hp).toLocaleString('vi-VN')}</b></div><div>Tấn công <b>${Number(add.atk).toLocaleString('vi-VN')}</b></div>
        <div>Vật thủ <b>${Number(add.def).toLocaleString('vi-VN')}</b></div><div>Tốc <b>${Number(add.spd).toLocaleString('vi-VN')}</b></div>
      </div><p class="hv-gear-copy">Buff thuộc tính có hiệu lực với toàn thể tướng</p>
      <div class="hv-gear-actions"><button type="button" class="ghost" data-gear-unequip-all>Tháo nhanh</button><button type="button" data-gear-equip-all>Mặc nhanh</button></div>`;
    } else {
      const cost = item && typeof enhCost === 'function' ? enhCost(item) : { gold: 0, hoat: 0 };
      const now = teamHp();
      let next = now;
      if (item && item.lvl < 15) {
        try { item.lvl += 1; next = teamHp(); } finally { item.lvl -= 1; }
      }
      body.innerHTML = `<div class="hv-gear-cost"><span>Lv ${item ? item.lvl : 0} → ${item ? Math.min(15, item.lvl + 1) : 1}</span><span>HP ${now} → ${next}</span></div>
        <div class="hv-gear-cost"><span><img src="assets/items/materials/gold.png" alt="">${cost.gold}</span><span><img src="assets/items/materials/hoat-luc.png" alt="">${cost.hoat}</span></div>
        <div class="hv-gear-actions"><button type="button" data-gear-enhance ${item && item.lvl < 15 ? '' : 'disabled'}>Cường hóa</button><button type="button" data-gear-enhance-all ${item ? '' : 'disabled'}>Cường hóa nhanh</button></div>`;
    }
  }

  function renderSmelt() {
    fillChips();
    const smelting = state.smeltTab !== 'enhance';
    const bag = smelting
      ? smeltCandidates(P, { kind: state.smeltKind })
      : (P.inventory || []).filter(item => item && Number.isSafeInteger(item.uid) && (!state.smeltKind || state.smeltKind === 'all' || item.slot === state.smeltKind));
    const picks = state.smeltPicks.map(uid => itemOf(uid)).filter(Boolean);
    state.smeltPicks = picks.map(item => item.uid);
    const tray = root.querySelector('[data-smelt-tray]');
    const cells = [];
    for (let index = 0; index < traySize; index++) {
      const item = picks[index];
      cells.push(item
        ? `<button type="button" class="hv-smelt-cell is-on rar-${item.rar || 'b'}" data-smelt-item="${item.uid}"><img src="${artFor(item)}" alt=""><small class="lvl">+${item.lvl}</small></button>`
        : '<span class="hv-smelt-cell is-empty"><i class="plus">+</i></span>');
    }
    tray.innerHTML = cells.join('');
    const quoted = smelting && picks.length ? prepareSmeltSelection(P, state.smeltPicks) : null;
    root.querySelector('[data-smelt-gain]').textContent = quoted?.ok ? ('Nhận +' + quoted.gain + ' Tinh Lực') : '';
    root.querySelectorAll('[data-smelt-kind]').forEach(button => button.classList.toggle('is-on', button.dataset.smeltKind === state.smeltKind));
    const bagBox = root.querySelector('[data-smelt-bag]');
    const selected = new Set(state.smeltPicks);
    const shown = bag.map(item => itemCell(item, selected.has(item.uid)));
    while (shown.length < 16) shown.push('<span class="hv-smelt-cell is-empty"></span>');
    bagBox.innerHTML = shown.join('');
    root.querySelectorAll('[data-smelt-tab]').forEach(button => button.classList.toggle('is-on', button.dataset.smeltTab === state.smeltTab));
    root.querySelector('[data-smelt-actions]').innerHTML = smelting
      ? '<button type="button" class="ghost" data-smelt-once>Dung luyện x1</button><button type="button" data-smelt-all>Dung luyện</button>'
      : '<button type="button" class="ghost" data-smelt-enhance>Cường hóa x1</button><button type="button" data-smelt-enhance-all>Cường hóa nhanh</button>';
  }

  function show(view) {
    state.view = view;
    root.hidden = false;
    root.classList.add('is-open');
    root.querySelectorAll('.hv-gear-screen').forEach(screen => screen.classList.toggle('is-active', screen.dataset.gearView === view));
    if (view === 'wheel') renderWheel();
    else if (view === 'smelt') renderSmelt();
    else renderBoard();
  }
  function hide() {
    root.hidden = true;
    root.classList.remove('is-open');
    closePicker();
  }
  function openAssistWheel() { show('wheel'); }
  function openBoard() { if (!state.slot) state.slot = 'I'; show('board'); }
  function openSmelt() {
    closePicker();
    state.smeltTab = state.smeltTab || 'smelt';
    state.smeltKind = state.smeltKind || 'all';
    if (!Array.isArray(state.smeltPicks)) state.smeltPicks = [];
    show('smelt');
  }
  function closePicker() {
    root.querySelector('[data-gear-picker]').classList.remove('is-open');
    state.picker = null;
  }
  function openPicker(slotId) {
    state.slot = slotId;
    state.picker = slotId;
    const list = candidatesForGearSlot(P, slotId, { rarOrder });
    const box = root.querySelector('[data-gear-choices]');
    if (!list.length) {
      box.innerHTML = `<div class="hv-gear-empty"><p>Chưa có trang bị!</p><button type="button" data-gear-go="forge">Đi nhận thưởng</button></div>`;
    } else {
      box.innerHTML = list.map(item => `<button type="button" class="hv-gear-choice" data-gear-pick="${item.uid}"><img src="${artFor(item)}" alt=""><span>${typeof itemName === 'function' ? itemName(item) : item.slot} +${item.lvl}<small style="display:block">${String(item.rar).toUpperCase()}</small></span><b>Mặc</b></button>`).join('');
    }
    root.querySelector('[data-gear-picker]').classList.add('is-open');
    renderBoard();
  }
  function toggleSmeltPick(uid) {
    const index = state.smeltPicks.indexOf(uid);
    if (index >= 0) {
      state.smeltPicks.splice(index, 1);
      return;
    }
    if (state.smeltTab === 'enhance') {
      state.smeltPicks = [uid];
      return;
    }
    if (state.smeltPicks.length >= traySize) {
      toast?.('Chỉ dung luyện tối đa 8 món.');
      return;
    }
    state.smeltPicks.push(uid);
  }
  function runSmelt(limit) {
    const uids = state.smeltPicks.slice(0, limit);
    const prepared = prepareSmeltSelection(P, uids);
    if (!prepared.ok) { toast?.(prepared.message || 'Hãy chọn trang bị!'); return; }
    if (typeof forgeCommand !== 'function') { toast?.('Chưa dung luyện được.'); return; }
    let gained = 0;
    for (const quote of prepared.quotes) {
      const result = forgeCommand('salvage', { uid: quote.uid, quote }, 'forge.salvage:' + quote.uid + ':' + (P.revision || 0));
      if (!result.ok) { toast?.(result.message || 'Chưa dung luyện được.'); break; }
      gained += quote.gain;
    }
    state.smeltPicks = state.smeltPicks.filter(uid => itemOf(uid));
    if (gained) toast?.('Dung luyện → +' + gained + ' Tinh Lực');
    if (typeof refreshResbar === 'function') refreshResbar();
    renderSmelt();
  }
  function runEnhance(fast) {
    const uid = state.smeltPicks[0];
    if (!uid || !itemOf(uid)) { toast?.('Hãy chọn trang bị!'); return; }
    if (typeof enhanceItem !== 'function') return;
    if (!fast) { enhanceItem(uid); renderSmelt(); return; }
    let n = 0;
    while (n < 15 && enhanceItem(uid)) n++;
    if (!n) toast?.('Không đủ nguyên liệu để cường hóa.');
    renderSmelt();
  }

  root.addEventListener('click', event => {
    const close = event.target.closest('[data-gear-close]');
    if (close) { hide(); if (typeof navTo === 'function') navTo('hub'); return; }
    if (event.target.closest('[data-gear-wheel]')) { closePicker(); show('wheel'); return; }
    if (event.target.closest('[data-gear-board]')) { show('board'); return; }
    if (event.target.closest('[data-gear-picker-close]')) { closePicker(); return; }
    if (event.target.matches('[data-gear-picker]')) { closePicker(); return; }
    const smelt = event.target.closest('[data-gear-smelt]');
    if (smelt) { openSmelt(); return; }
    const smeltTab = event.target.closest('[data-smelt-tab]');
    if (smeltTab) {
      state.smeltTab = smeltTab.dataset.smeltTab;
      state.smeltPicks = [];
      renderSmelt();
      return;
    }
    const kind = event.target.closest('[data-smelt-kind]');
    if (kind) { state.smeltKind = kind.dataset.smeltKind; renderSmelt(); return; }
    const smeltItem = event.target.closest('[data-smelt-item]');
    if (smeltItem) {
      toggleSmeltPick(+smeltItem.dataset.smeltItem);
      renderSmelt();
      return;
    }
    if (event.target.closest('[data-smelt-once]')) { runSmelt(1); return; }
    if (event.target.closest('[data-smelt-all]')) { runSmelt(traySize); return; }
    if (event.target.closest('[data-smelt-enhance]')) { runEnhance(false); return; }
    if (event.target.closest('[data-smelt-enhance-all]')) { runEnhance(true); return; }
    const assist = event.target.closest('[data-assist]');
    if (assist) {
      if (assist.dataset.assist === 'gear') { openBoard(); return; }
      if (assist.dataset.assist === 'formation') {
        hide();
        ST.hvOpenFormation = true;
        navTo('team');
        return;
      }
      toast?.('Khu này chưa mở.');
      return;
    }
    const slotButton = event.target.closest('[data-gear-slot]');
    if (slotButton) {
      const id = slotButton.dataset.gearSlot;
      const worn = itemOf(board()[id]);
      if (!worn) { state.slot = id; openPicker(id); return; }
      if (state.slot === id && state.tab === 'wear') { openPicker(id); return; }
      state.slot = id;
      renderBoard();
      return;
    }
    const pick = event.target.closest('[data-gear-pick]');
    if (pick) {
      const change = prepareAccountGearChange(P, { slotId: state.picker, uid: +pick.dataset.gearPick, action: 'equip' });
      if (!change.ok) { toast?.(change.message || 'Không mặc được.'); return; }
      const saved = commit(change.gear, 'gear.equip:' + change.uid + ':' + change.slotId, 'gear.equip');
      if (saved.ok) { closePicker(); renderBoard(); toast?.('Đã mặc trang bị.'); }
      return;
    }
    const go = event.target.closest('[data-gear-go]');
    if (go) { hide(); navTo(go.dataset.gearGo); return; }
    if (event.target.closest('[data-gear-equip-all]')) {
      const change = prepareQuickEquip(P, { rarOrder });
      if (!change.changed) { toast?.(change.message); return; }
      if (commit(change.gear, 'gear.quick-equip:' + (P.revision || 0), 'gear.quick-equip').ok) {
        renderBoard(); toast?.('Đã mặc trang bị tốt nhất.');
      }
      return;
    }
    if (event.target.closest('[data-gear-unequip-all]')) {
      if (commit(prepareQuickUnequip(P).gear, 'gear.quick-unequip:' + (P.revision || 0), 'gear.quick-unequip').ok) {
        renderBoard(); toast?.('Đã tháo toàn bộ trang bị.');
      }
      return;
    }
    const enhanceOnce = () => {
      const item = selectedItem();
      if (!item || typeof enhanceItem !== 'function') return false;
      const before = typeof teamPower === 'function' ? teamPower() : 0;
      const ok = enhanceItem(item.uid);
      if (ok) {
        const gained = (typeof teamPower === 'function' ? teamPower() : 0) - before;
        const floater = root.querySelector('[data-gear-float]');
        if (gained && floater) {
          floater.hidden = false;
          floater.textContent = '+' + gained;
          floater.replaceWith(floater.cloneNode(true));
        }
      }
      return ok;
    };
    if (event.target.closest('[data-gear-enhance]')) { enhanceOnce(); renderBoard(); return; }
    if (event.target.closest('[data-gear-enhance-all]')) {
      let n = 0; while (n < 15 && enhanceOnce()) n++;
      if (!n) toast?.('Không đủ nguyên liệu để cường hóa.');
      renderBoard();
      return;
    }
    const tab = event.target.closest('[data-gear-tab]');
    if (tab) { state.tab = tab.dataset.gearTab; renderBoard(); }
  });

  const baseNav = typeof navTo === 'function' ? navTo : null;
  if (baseNav) {
    navTo = function accountGearNavTo(name) {
      if (name === 'gear') { openBoard(); return; }
      if (name === 'team' && !ST.hvOpenFormation) { openAssistWheel(); return; }
      ST.hvOpenFormation = false;
      hide();
      return baseNav(name);
    };
  }
  if (typeof heroStats === 'function') {
    const baseStats = heroStats;
    heroStats = function accountGearHeroStats(id) {
      const stats = baseStats(id);
      const add = bonus();
      return { ...stats, hp: stats.hp + add.hp, atk: stats.atk + add.atk, def: stats.def + add.def, spd: stats.spd + add.spd };
    };
  }

  window.HonVietAccountGear = { openAssistWheel, openBoard, openSmelt, close: hide, slots };
})();
