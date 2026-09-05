// Group the existing detail panels without recreating their command handlers
// or touching the player save. The roster wrapper still owns idle preservation.
(() => {
  const tabs = [['attributes', 'Thuộc tính'], ['skills', 'Kỹ năng'],
    ['equipment', 'Trang bị'], ['bonds', 'Duyên phận'], ['mastery', 'Tinh thông']];
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
      const name = document.createElement('span');
      name.textContent = item ? itemName(item) + ' +' + item.lvl : 'Chưa trang bị';
      cell.append(label, name);
      if (item) {
        const stat = document.createElement('small');
        stat.textContent = item.rar.toUpperCase() + ' · +' + itemStat(item) + ' ' + DATA.items.statName[slot];
        cell.append(stat);
      }
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
    if (forge.disabled) {
      const gate = document.createElement('p');
      gate.textContent = 'Rèn Mộng mở sau khi vượt ' + (JOURNEY_UNLOCK.forge?.ch || 1) + ' chương.';
      panel.append(gate);
    }
    return panel;
  }

  function mount(id) {
    if (id !== currentHero) { currentHero = id; selected = 'attributes'; }
    const children = Array.from(body.children), stage = body.querySelector('.hstage');
    const oldTabs = body.querySelector('.hero-art-tabs');
    const skills = children.filter(node => node.matches('.skillbox'));
    const bonds = children.filter(node => node.matches('.lorebox,.relbox'));
    const mastery = [body.querySelector('#masteryPanel'), body.querySelector('#awBtn')?.closest('.section')].filter(Boolean);
    const assigned = new Set([stage, oldTabs, ...skills, ...bonds, ...mastery]);
    const attributes = children.filter(node => !assigned.has(node));
    const content = { attributes, skills, equipment: [equipmentPanel(id)], bonds, mastery };

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
    body.replaceChildren(stage, workspace);

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
