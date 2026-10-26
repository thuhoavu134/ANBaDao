// Group the existing detail panels without recreating their command handlers
// or touching the player save. The roster wrapper still owns idle preservation.
(() => {
  const tabs = [['attributes', 'Thuộc tính'], ['skills', 'Kỹ năng'],
    ['equipment', 'Trang bị'], ['breakthrough', 'Đột phá'], ['bonds', 'Duyên phận'], ['mastery', 'Tinh thông']];
  const body = document.getElementById('hdBody');
  let currentHero = null, selected = 'attributes';

  function equipmentPanel(id) {
    const panel = document.createElement('section');
    panel.className = 'section hv-detail-equipment';
    const heading = document.createElement('h3');
    heading.textContent = 'Trang bị đang mặc'; panel.append(heading);
    const slots = document.createElement('div'); slots.className = 'hv-equipment-slots';
    for (const slot of DATA.items.slots) {
      const uid = P.equip?.[id]?.[slot];
      const item = uid == null ? null : (P.inventory || []).find(candidate => candidate.uid === uid);
      const cell = document.createElement('div'); cell.className = 'hv-equipment-slot';
      const label = document.createElement('b'); label.textContent = DATA.items.slotName[slot];
      if (item) {
        const art = document.createElement('img');
        art.className = 'hv-equipment-slot-art';
        art.src = globalThis.honVietEquipmentAssetFor?.(item) || 'assets/ui/menu-v3233/icons/forge.png';
        art.alt = itemName(item);
        art.loading = 'lazy';
        cell.append(art);
      }
      const copy = document.createElement('div'); copy.className = 'hv-equipment-copy';
      const name = document.createElement('span');
      name.textContent = item ? itemName(item) + ' +' + item.lvl : 'Chưa trang bị';
      copy.append(label, name);
      if (item) {
        const stat = document.createElement('small');
        stat.textContent = item.rar.toUpperCase() + ' · +' + itemStat(item) + ' ' + DATA.items.statName[slot];
        copy.append(stat);
      }
      cell.append(copy);
      slots.append(cell);
    }
    panel.append(slots);
    const set = document.createElement('p');
    // Existing set descriptions are authored HTML; preserve their formatting.
    set.innerHTML = setLine(id) || 'Chưa kích hoạt hiệu ứng bộ trang bị.';
    panel.append(set);
    const forge = document.createElement('button');
    forge.type = 'button'; forge.className = 'btn gold sm'; forge.textContent = 'Mở Rèn Mộng';
    forge.disabled = featLocked('forge');
    forge.addEventListener('click', () => navTo('forge'));
    panel.append(forge);
    const board = document.createElement('button');
    board.type = 'button'; board.className = 'btn sm'; board.textContent = 'Mở trang bị';
    board.addEventListener('click', () => {
      if (window.HonVietAccountGear?.openBoard) window.HonVietAccountGear.openBoard();
      else navTo('team');
    });
    panel.append(board);
    if (forge.disabled) {
      const gate = document.createElement('p');
      gate.textContent = 'Rèn Mộng mở sau khi vượt ' + (JOURNEY_UNLOCK.forge?.ch || 1) + ' chương.';
      panel.append(gate);
    }
    return panel;
  }

  // Owner 2026-10-26: cây Đột phá 4 mốc. Không tạo handler mới ngoài nút mở mốc.
  function breakthroughPanel(id) {
    const panel = document.createElement('section');
    panel.className = 'section hv-detail-breakthrough';
    const heading = document.createElement('h3');
    heading.textContent = 'Cây Đột phá';
    const opened = typeof breakthroughLevel === 'function' ? breakthroughLevel(P, id) : 0;
    const sub = document.createElement('p');
    sub.className = 'hv-dp-sub';
    sub.textContent = 'Đã mở ' + opened + '/4 mốc · mở bằng cấp, sao, vàng và Tinh.';
    panel.append(heading, sub);
    const list = document.createElement('div');
    list.className = 'hv-dp-list';
    const steps = typeof BREAKTHROUGH_STEPS !== 'undefined' ? BREAKTHROUGH_STEPS : [];
    const state = typeof canBreakthrough === 'function'
      ? canBreakthrough(P, id, { level: heroLevel(id), stars: heroStars(id), gold: P.gold, tinh: econ().tinh })
      : { ok: false, code: 'UNAVAILABLE', message: '' };
    for (const step of steps) {
      const done = step.id <= opened;
      const isNext = !!state.step && state.step.id === step.id;
      const row = document.createElement('div');
      row.className = 'hv-dp-step' + (done ? ' is-done' : '') + (isNext && state.ok ? ' is-ready' : '');
      const dot = document.createElement('span'); dot.className = 'hv-dp-dot'; dot.textContent = done ? '✓' : String(step.id);
      const copy = document.createElement('div'); copy.className = 'hv-dp-copy';
      const name = document.createElement('b'); name.textContent = step.name;
      const note = document.createElement('small'); note.textContent = step.note;
      const req = document.createElement('small'); req.className = 'hv-dp-req';
      req.textContent = 'Cấp ' + step.level + ' · ' + step.stars + '★ · 🪙' + step.gold + ' · ✨' + step.tinh;
      copy.append(name, note, req);
      row.append(dot, copy);
      if (!done && isNext) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'btn gold sm';
        button.textContent = state.ok ? 'Đột phá' : 'Chưa đủ';
        button.disabled = !state.ok;
        if (!state.ok && state.message) button.title = state.message;
        button.addEventListener('click', () => {
          if (typeof heroBreakthrough !== 'function') return;
          // heroBreakthrough tự render lại chi tiết tướng, không mount lần hai.
          heroBreakthrough(id);
        });
        row.append(button);
      }
      list.append(row);
    }
    panel.append(list);
    if (!state.ok && state.message) {
      const hint = document.createElement('p');
      hint.className = 'hv-dp-hint';
      hint.textContent = state.message;
      panel.append(hint);
    }
    return panel;
  }

  function mount(id) {
    if (id !== currentHero) { currentHero = id; selected = 'attributes'; }
    const children = Array.from(body.children), stage = body.querySelector('.hstage');
    const oldTabs = body.querySelector('.hero-art-tabs');
    const skills = children.filter(node => node.matches('.skillbox'));
    if (id === 'bach_dien') {
      // Player-facing wording; retain levels, costs, limits and counterplay.
      for (const skill of skills) {
        const heading = skill.querySelector('.sn');
        if (heading) heading.textContent = heading.textContent.replace('Basic —', 'Công thường —').replace('Ultimate —', 'Tuyệt kỹ —');
        const meta = skill.querySelector('.skill-meta');
        if (!meta) continue;
        const level = meta.textContent.match(/(?:Basic|Ultimate) Lv\.(\d+)/);
        if (level) meta.textContent = 'Cấp kỹ năng: ' + level[1];
        else meta.textContent = meta.textContent.replace('on_skill_or_dodge', 'khi tung chiêu hoặc né');
      }
    }
    const breakthrough = [breakthroughPanel(id)];
    const bonds = children.filter(node => node.matches('.lorebox,.relbox'));
    const mastery = [body.querySelector('#masteryPanel'), body.querySelector('#awBtn')?.closest('.section')].filter(Boolean);
    const medals = body.querySelector('.medalrow');
    const upgrades = body.querySelector('.upgrades');
    const assigned = new Set([stage, oldTabs, medals, upgrades, ...skills, ...bonds, ...mastery, ...breakthrough]);
    const attributes = children.filter(node => !assigned.has(node));
    const content = { attributes, skills, equipment: [equipmentPanel(id)], breakthrough, bonds, mastery };

    body.classList.add('hv-detail-tabs-layout');
    oldTabs?.remove();
    const workspace = document.createElement('div'); workspace.className = 'hv-detail-workspace';
    const strip = document.createElement('div');
    strip.className = 'hv-detail-tablist'; strip.setAttribute('role', 'tablist');
    strip.setAttribute('aria-label', 'Hồ sơ chiến binh');
    const buttons = new Map(), panels = new Map();
    workspace.append(strip);
    for (const [key, label] of tabs) {
      const button = document.createElement('button');
      button.type = 'button'; button.id = 'hero-tab-' + key;
      button.className = 'btn sm'; button.textContent = label; button.dataset.detailTab = key;
      button.setAttribute('role', 'tab'); button.setAttribute('aria-controls', 'hero-panel-' + key);
      const panel = document.createElement('div');
      panel.id = 'hero-panel-' + key; panel.className = 'hv-detail-panel';
      panel.setAttribute('role', 'tabpanel'); panel.setAttribute('aria-labelledby', button.id);
      panel.append(...content[key]);
      strip.append(button); workspace.append(panel);
      buttons.set(key, button); panels.set(key, panel);
    }
    // Move live nodes, including their original command listeners; never clone
    // the idle canvas or rebuild progression actions in the presentation layer.
    const dock = document.createElement('div'); dock.className = 'hv-scene-dock';
    dock.append(medals, upgrades);
    const shortcuts = document.createElement('div'); shortcuts.className = 'hv-scene-skills';
    shortcuts.setAttribute('aria-label', 'Chiêu thức của tướng');
    const labels = { basic: 'Công thường', ultimate: 'Tuyệt kỹ', passive: 'Nội tại' };
    for (const skill of skills) {
      const slot = skill.dataset.skillSlot;
      const button = document.createElement('button'); button.type = 'button';
      button.className = 'hv-scene-skill'; button.dataset.skillSlot = slot;
      const icon = document.createElement('span'); icon.className = 'hv-scene-skill-seal';
      icon.textContent = skill.dataset.skillIcon || '✦'; icon.setAttribute('aria-hidden', 'true');
      const label = document.createElement('span'); label.textContent = labels[slot] || 'Kỹ năng';
      button.setAttribute('aria-label', skill.querySelector('.sn')?.textContent || label.textContent);
      button.setAttribute('aria-controls', 'hero-panel-skills');
      button.append(icon, label);
      button.addEventListener('click', () => {
        activate('skills', true);
        skill.scrollIntoView({ block: 'nearest' });
      });
      shortcuts.append(button);
    }
    stage.append(shortcuts);
    const owned = OFFICIAL_ROSTER_12_IDS.filter(heroId => P.heroes[heroId]?.owned);
    if (owned.length > 1 && owned.includes(id)) {
      for (const [delta, label, glyph] of [[-1, 'Tướng trước', '‹'], [1, 'Tướng sau', '›']]) {
        const arrow = document.createElement('button'); arrow.type = 'button';
        arrow.className = 'hv-scene-arrow ' + (delta < 0 ? 'is-prev' : 'is-next');
        arrow.textContent = glyph; arrow.setAttribute('aria-label', label);
        arrow.addEventListener('click', () => {
          renderHeroDetail(owned[(owned.indexOf(id) + delta + owned.length) % owned.length]);
          body.querySelector(delta < 0 ? '.is-prev' : '.is-next')?.focus({ preventScroll: true });
        });
        stage.append(arrow);
      }
    }
    if (id === 'bach_dien') {
      // Real flex children: Safari can pin the action bar without display:contents.
      body.replaceChildren(stage, medals, workspace, upgrades);
    } else body.replaceChildren(stage, dock, workspace);

    function activate(key, focus = false) {
      if (!panels.has(key)) return;
      selected = key;
      for (const [name, button] of buttons) {
        const active = name === key;
        button.setAttribute('aria-selected', String(active)); button.tabIndex = active ? 0 : -1;
        button.classList.toggle('gold', active); button.classList.toggle('ghost', !active);
        panels.get(name).hidden = !active;
      }
      if (focus) buttons.get(key).focus({ preventScroll: true });
    }
    strip.addEventListener('click', event => {
      const button = event.target.closest('[data-detail-tab]');
      if (button) activate(button.dataset.detailTab);
    });
    strip.addEventListener('keydown', event => {
      const button = event.target.closest('[data-detail-tab]');
      if (!button || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const index = tabs.findIndex(([key]) => key === button.dataset.detailTab);
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1
        : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
      activate(tabs[next][0], true);
    });
    activate(selected);
  }

  const baseDetail = renderHeroDetail;
  renderHeroDetail = function renderTabbedHeroDetail(id) {
    baseDetail(id);
    mount(id);
  };
  if (ST.screen === 'heroDetail' && ST._heroDetailId) mount(ST._heroDetailId);
})();

