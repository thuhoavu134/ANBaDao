// Group the existing detail panels without recreating their command handlers
// or touching the player save. The roster wrapper still owns idle preservation.
(() => {
  const tabs = [['attributes', 'Thuộc tính'], ['skills', 'Kỹ năng'],
    ['equipment', 'Trang bị'], ['breakthrough', 'Đột phá'], ['bonds', 'Duyên phận'], ['mastery', 'Tinh thông']];
  // Owner 2026-10-27: mọi tướng dùng CHUNG mẫu hồ sơ Bạch Diện (PR #382). Mỗi tướng chỉ khai
  // phần trình bày riêng: 3 icon kỹ năng. Tên, hệ, nghề, chỉ số luôn đọc từ dữ liệu thật.
  // skillIcons: 'reference-v3' = bộ crop gốc của Bạch Diện; object = đường dẫn từng slot.
  // job: nhãn nghề NGẮN cho khung Nghề (dữ liệu role gốc nhiều tướng là câu mô tả dài, tràn khung).
  // skillIcons null = chưa có icon -> ấn chữ tạm (chờ bộ icon AI owner duyệt).
  const VC_HERO_PROFILES = Object.freeze({
    bach_dien: { job: 'Sát thủ phép', skillIcons: 'reference-v3' },
    be_an: { idleH: 55.07, idleShiftU: -27, job: 'Pháp sư', skillIcons: { basic: 'assets/ui/skills/be-an-basic.webp', ultimate: 'assets/ui/skills/be-an-ultimate.webp', passive: 'assets/ui/skills/be-an-passive.webp' } },
    co_nuong: { job: 'Pháp sư', skillIcons: { basic: 'assets/ui/skills/co-nuong-basic.webp', ultimate: 'assets/ui/skills/co-nuong-ultimate.webp', passive: 'assets/ui/skills/co-nuong-passive.webp' } },
    dinh_loi: { idleH: 43.27, idleShiftU: 73, job: 'Hộ vệ', skillIcons: { basic: 'assets/ui/skills/dinh-loi-basic.webp', ultimate: 'assets/ui/skills/dinh-loi-ultimate.webp', passive: 'assets/ui/skills/dinh-loi-passive.webp' } },
    hong_thuong: { idleH: 62.02, idleShiftU: -203, job: 'Đấu sĩ', skillIcons: { basic: 'assets/ui/skills/hong-thuong-basic.webp', ultimate: 'assets/ui/skills/hong-thuong-ultimate.webp', passive: 'assets/ui/skills/hong-thuong-passive.webp' } },
    khaos: { idleShiftU: 66, job: 'Pháp sư', skillIcons: { basic: 'assets/ui/skills/khaos-basic.webp', ultimate: 'assets/ui/skills/khaos-ultimate.webp', passive: 'assets/ui/skills/khaos-passive.webp' } },
    ky_van: { idleShiftXU: 0, idleH: 48.7, idleShiftU: 0, job: 'Lôi Châm Sư', skillIcons: { basic: 'assets/ui/skills/ky-van-basic.webp', ultimate: 'assets/ui/skills/ky-van-ultimate.webp', passive: 'assets/ui/skills/ky-van-passive.webp' } },
    lang_chan: { job: 'Sát thủ', skillIcons: { basic: 'assets/ui/skills/lang-chan-basic.webp', ultimate: 'assets/ui/skills/lang-chan-ultimate.webp', passive: 'assets/ui/skills/lang-chan-passive.webp' } },
    lang_nguyet: { idleShiftU: 202, job: 'Xạ thủ', skillIcons: { basic: 'assets/ui/skills/lang-nguyet-basic.webp', ultimate: 'assets/ui/skills/lang-nguyet-ultimate.webp', passive: 'assets/ui/skills/lang-nguyet-passive.webp' } },
    lang_tieu: { idleShiftU: 47, job: 'Xạ thủ', skillIcons: { basic: 'assets/ui/skills/lang-tieu-basic.webp', ultimate: 'assets/ui/skills/lang-tieu-ultimate.webp', passive: 'assets/ui/skills/lang-tieu-passive.webp' } },
    lang_van: { idleShiftU: 51, job: 'Đấu sĩ', skillIcons: { basic: 'assets/ui/skills/lang-van-basic.webp', ultimate: 'assets/ui/skills/lang-van-ultimate.webp', passive: 'assets/ui/skills/lang-van-passive.webp' } },
    linh_dong: { idleH: 38.94, idleShiftU: 150, job: 'Pháp sư', skillIcons: { basic: 'assets/ui/skills/linh-dong-basic.webp', ultimate: 'assets/ui/skills/linh-dong-ultimate.webp', passive: 'assets/ui/skills/linh-dong-passive.webp' } },
    luc_anh: { idleH: 37.5, idleShiftU: 213, job: 'Huyền thuật sư', skillIcons: { basic: 'assets/ui/skills/luc-anh-basic.webp', ultimate: 'assets/ui/skills/luc-anh-ultimate.webp', passive: 'assets/ui/skills/luc-anh-passive.webp' } },
    nguyet_diep: { idleShiftU: 49, job: 'Pháp sư', skillIcons: { basic: 'assets/ui/skills/nguyet-diep-basic.webp', ultimate: 'assets/ui/skills/nguyet-diep-ultimate.webp', passive: 'assets/ui/skills/nguyet-diep-passive.webp' } },
    ong_hang_pho: { job: 'Đấu sĩ', skillIcons: { basic: 'assets/ui/skills/ong-pho-basic.webp', ultimate: 'assets/ui/skills/ong-pho-ultimate.webp', passive: 'assets/ui/skills/ong-pho-passive.webp' } },
    thay_mo: { idleH: 43.27, idleShiftU: 72, job: 'Pháp sư', skillIcons: { basic: 'assets/ui/skills/thay-mo-basic.webp', ultimate: 'assets/ui/skills/thay-mo-ultimate.webp', passive: 'assets/ui/skills/thay-mo-passive.webp' } },
    tich_dao: { idleH: 57.98, idleShiftU: -154, job: 'Sát thủ', skillIcons: { basic: 'assets/ui/skills/tich-dao-basic.webp', ultimate: 'assets/ui/skills/tich-dao-ultimate.webp', passive: 'assets/ui/skills/tich-dao-passive.webp' } },
    tieu_linh: { idleShiftU: 65, job: 'Hỗ trợ', skillIcons: { basic: 'assets/ui/skills/tieu-linh-basic.webp', ultimate: 'assets/ui/skills/tieu-linh-ultimate.webp', passive: 'assets/ui/skills/tieu-linh-passive.webp' } },
    tieu_phong: { idleShiftXU: 0, idleH: 48.7, idleShiftU: 0, job: 'Ngự Phong', skillIcons: { basic: 'assets/ui/skills/tieu-phong-basic.webp', ultimate: 'assets/ui/skills/tieu-phong-ultimate.webp', passive: 'assets/ui/skills/tieu-phong-passive.webp' } },
    tinh_mac: { idleShiftU: 38, job: 'Đấu sĩ', skillIcons: { basic: 'assets/ui/skills/tinh-mac-basic.webp', ultimate: 'assets/ui/skills/tinh-mac-ultimate.webp', passive: 'assets/ui/skills/tinh-mac-passive.webp' } },
    van_phong: { idleShiftU: 131, job: 'Pháp sư', skillIcons: { basic: 'assets/ui/skills/van-phong-basic.webp', ultimate: 'assets/ui/skills/van-phong-ultimate.webp', passive: 'assets/ui/skills/van-phong-passive.webp' } }
  });
  // Co chữ cho vừa khung: giữ một dòng, giảm cỡ chữ tới tối đa 55% thay vì xuống dòng/cắt chữ.
  const vcFitText = el => {
    if (!el || !el.isConnected) return;
    el.style.fontSize = '';
    const base = parseFloat(getComputedStyle(el).fontSize) || 16;
    let size = base;
    for (let i = 0; i < 12 && el.scrollWidth > el.clientWidth + 1 && size > base * 0.55; i++) {
      size *= 0.94;
      el.style.setProperty('font-size', size.toFixed(2) + 'px', 'important');
    }
  };
  const vcEnabled = id => Object.prototype.hasOwnProperty.call(VC_HERO_PROFILES, id);
  const VC_ELEMENT_KEY = Object.freeze({ 'Hỏa': 'hoa', 'Thủy': 'thuy', 'Thổ': 'tho', 'Kim': 'kim', 'Mộc': 'moc' });
  const vcElementKey = id => {
    const he = DATA.heroes[id]?.he;
    const nm = (typeof HE === 'object' && HE[he]) ? HE[he].nm : '';
    return VC_ELEMENT_KEY[nm] || '';
  };
  globalThis.HV_VC_HERO_PROFILES = VC_HERO_PROFILES;
  const body = document.getElementById('hdBody');
  let currentHero = null, selected = 'attributes', bachUpgradeCount = 1;
  const vcNode = (tag, cls, text) => {
    const node = document.createElement(tag); node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  };
  function vcStatTable(stats, next = null) {
    const table = vcNode('div', 'vc-attribute-table');
    const rows = [['hp','♥','HP'],['atk','⚔','Công'],['def','◈','Thủ'],['spd','➟','Tốc độ']];
    if (!next) rows.push(['crit','✧','Bạo kích'],['evasion','◇','Né tránh']);
    for (const [key, icon, label] of rows) {
      const row = vcNode('div', 'vc-attribute-row');
      const value = Number(stats[key]) || 0;
      const percent = key === 'crit' || key === 'evasion';
      row.append(vcNode('i', '', icon), vcNode('span', '', label),
        vcNode('b', '', value.toLocaleString('vi-VN') + (percent ? '%' : '')));
      if (next) {
        const after = Number(next[key]) || 0, gain = after - value;
        row.append(vcNode('span', 'vc-stat-arrow', '→'),
          vcNode('b', 'vc-stat-after', after.toLocaleString('vi-VN')),
          vcNode('small', 'vc-stat-gain', (gain >= 0 ? '+' : '') + gain.toLocaleString('vi-VN')));
      }
      table.append(row);
    }
    return table;
  }
  // Mirror the canonical star-dependent base term; never modify P for a preview.
  function vcNextStarStats(id) {
    const base = DATA.heroes[id]?.stats;
    if (!base || typeof heroStats !== 'function') return null;
    const stars = heroStars(id), lm = 1 + .08 * (heroLevel(id) - 1);
    const sm = 1 + .12 * (stars - 1), nextSm = stars >= 6 ? sm : sm + .12;
    const sp = typeof setPcts === 'function' ? setPcts(id) : {pct:0};
    const fm = typeof forgeMoldBonus === 'function' ? forgeMoldBonus(id) : {};
    const guild = typeof guildPct === 'function' ? guildPct() : {};
    const gt = typeof guildTechCombat === 'function' ? guildTechCombat() : {};
    const rb = typeof relationshipStatBonus === 'function' ? relationshipStatBonus(id) : {};
    const mb = typeof masteryBonus === 'function' ? masteryBonus(id) : {};
    const dp = typeof breakthroughBonus === 'function' ? breakthroughBonus(P,id) : {};
    const am = 1 + .02 * (typeof awakeningRank === 'function' ? awakeningRank(id) : 0);
    const delta = {};
    for (const key of ['hp','atk','def']) {
      const clan = key === 'hp' && typeof clanPct === 'function' ? clanPct() :
        key === 'atk' && typeof clanAtkBonus === 'function' ? clanAtkBonus() : 0;
      const pct = (sp.pct || 0) + (fm[key] || 0) + (guild.stat === key ? guild.pct || 0 : 0) +
        clan + (gt[key] || 0) + (rb[key] || 0) + (mb[key] || 0) + (dp[key] || 0);
      const term = (Number(base[key]) || 0) * lm * (1 + pct) * am;
      delta[key] = Math.round(term * nextSm) - Math.round(term * sm);
    }
    const projected = window.HonVietAccountGear?.heroDetailGear?.previewBaseDelta?.(id, delta);
    return projected || null;
  }

  function equipmentPanel(id) {
    const panel = document.createElement('section');
    panel.className = 'section hv-detail-equipment';
    const el = (tag, cls, text) => {
      const node = document.createElement(tag); node.className = cls;
      if (text != null) node.textContent = text;
      return node;
    };
    const gearAPI = window.HonVietAccountGear?.heroDetailGear;
    const slots = gearAPI?.slots || window.HonVietAccountGear?.slots || [];
    let selectedSlot = slots[0]?.id;
    let mode = 'info';
    const layout = el('div', 'hv-equipment-layout');
    const left = el('div', 'hv-equipment-side is-left');
    const right = el('div', 'hv-equipment-side is-right');
    const center = el('div', 'hv-equipment-center');
    center.dataset.heroPreview = id;
    layout.append(left, center, right);
    const details = el('div', 'vc-item-details');
    const note = el('p', 'vc-screen-note', 'Trang bị toàn đội');
    panel.append(note, layout, details);
    const itemOf = uid => (P.inventory || []).find(item => item.uid === uid);
    const artFor = (slot, item) => {
      const names = { I:'non', II:'dai', III:'day-chuyen', IV:'nhan', VI:'quan', VIII:'gang', IX:'ho-uyen', X:'khan' };
      return names[slot] && item ? 'assets/items/equipment/slots/' + names[slot] + '-' + item.rar + '.webp'
        : globalThis.honVietEquipmentAssetFor?.(item) || 'assets/ui/menu-v3233/icons/forge.png';
    };
    const button = (text, action, disabled = false) => {
      const node = el('button', 'btn', text); node.type = 'button'; node.disabled = disabled;
      node.addEventListener('click', action); return node;
    };
    const change = (uid, action) => {
      const saved = gearAPI?.change(selectedSlot, uid, action);
      if (!saved) { toast('Trang bị chưa sẵn sàng.'); return; }
      if (!saved.ok) { toast(saved.message || 'Chưa lưu được trang bị.'); return; }
      panel.dataset.changed = 'true';
      mode = 'info'; refreshResbar(); render();
    };
    function render() {
      left.replaceChildren(); right.replaceChildren(); details.replaceChildren();
      slots.forEach((slot, index) => {
        const item = itemOf(P.gear?.[slot.id]);
        const cell = button('', () => { selectedSlot = slot.id; mode = item ? 'info' : 'pick'; render(); });
        const glow = item && typeof enhGlowTier === 'function' ? enhGlowTier(item.lvl, item.rar) : '';
        cell.className = 'hv-equipment-slot hv-gear-slot' + (glow ? ' hv-glow-' + glow : '') + (selectedSlot === slot.id ? ' is-selected' : '');
        if (glow) cell.dataset.glow = glow;
        cell.setAttribute('aria-label', slot.name + (item ? ' · ' + itemName(item) : ' · Chưa trang bị'));
        cell.setAttribute('aria-pressed', String(selectedSlot === slot.id));
        if (item) { const img = el('img', 'hv-equipment-slot-art'); img.src = gearAPI?.art(slot.id, item) || artFor(slot.id, item); img.alt = ''; cell.append(img); }
        else cell.append(el('span', 'vc-empty-slot', '+'));
        cell.append(el('span', 'hv-equipment-copy', slot.name));
        (index < 6 ? left : right).append(cell);
      });
      const slot = slots.find(value => value.id === selectedSlot);
      if (!slot) { details.append(el('p', '', 'Chưa có dữ liệu trang bị.')); return; }
      const item = itemOf(P.gear?.[selectedSlot]);
      try { window.HV_ENH_FX && window.HV_ENH_FX.attach(panel); } catch (_) {}
      details.append(el('h3', '', slot.name));
      if (mode === 'pick') {
        const list = gearAPI?.candidates(selectedSlot) || [];
        if (!list.length) details.append(el('p', '', 'Chưa có trang bị phù hợp trong kho.'));
        for (const candidate of list) {
          const choice = button(itemName(candidate) + ' +' + candidate.lvl, () => change(candidate.uid, 'equip'));
          const art = el('img', 'vc-choice-art'); art.src = gearAPI.art(selectedSlot, candidate); art.alt = '';
          choice.prepend(art); details.append(choice);
        }
        details.append(button('Quay lại', () => { mode = 'info'; render(); }));
        return;
      }
      if (!item) {
        details.append(el('p', '', 'Ô trống · chọn trang bị từ kho để mặc.'));
        details.append(button('Chọn trang bị', () => { mode = 'pick'; render(); }));
        return;
      }
      details.append(el('h4', '', itemName(item) + ' +' + item.lvl + ' · ' + item.rar.toUpperCase()));
      const selectedArt = el('img', 'vc-selected-item-art');
      selectedArt.src = gearAPI?.art(selectedSlot, item) || artFor(selectedSlot, item); selectedArt.alt = '';
      details.prepend(selectedArt);
      const stat = DATA.items.statName[item.slot] || '';
      details.append(el('p', '', stat + ' +' + itemStat(item)));
      if (mode === 'enhance') {
        const max = gearMaxLvl(item), cost = enhCost(item);
        const capped = item.lvl >= max;
        details.append(el('p', 'vc-next-stat', capped ? 'Đã đạt cấp tối đa' :
          stat + ' +' + itemStat(item) + ' → +' + itemStat({...item, lvl:item.lvl + 1})));
        details.append(el('p', '', capped ? '' : 'Chi phí: ' + cost.gold + ' bạc · ' + cost.hoat + ' Hoạt lực'));
        details.append(button('Cường hoá', () => {
          if (enhanceItem(item.uid)) { panel.dataset.changed = 'true'; refreshResbar(); render(); }
        }, capped || P.gold < cost.gold || (P.hoat || 0) < cost.hoat));
        details.append(button('Quay lại', () => { mode = 'info'; render(); }));
      } else {
        details.append(button('Cường hoá', () => { mode = 'enhance'; render(); }));
        details.append(button('Thay đồ', () => { mode = 'pick'; render(); }));
        details.append(button('Tháo', () => change(item.uid, 'unequip')));
      }
    }
    render();
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
    if (id !== currentHero) { currentHero = id; selected = 'attributes'; bachUpgradeCount = 1; }
    const vcRoot = document.getElementById('hvHeroDetailRoot');
    vcRoot?.toggleAttribute('data-vc-layout', vcEnabled(id));
    if (vcRoot) {
      if (vcEnabled(id)) {
        vcRoot.dataset.vcElement = vcElementKey(id);
        vcRoot.style.setProperty('--vc-idle-shift-u', String(VC_HERO_PROFILES[id].idleShiftU || 0));
        vcRoot.style.setProperty('--vc-idle-scale', String(VC_HERO_PROFILES[id].idleScale || 1));
        // Canvas riêng của từng tướng: ép vào khung sân khấu chung (cao theo % khung) để không lệch khi đổi cỡ màn hình.
        vcRoot.style.setProperty('--vc-idle-shift-x-u', String(VC_HERO_PROFILES[id].idleShiftXU || 0));
        if (VC_HERO_PROFILES[id].idleH) vcRoot.style.setProperty('--vc-idle-h', VC_HERO_PROFILES[id].idleH + '%');
        else vcRoot.style.removeProperty('--vc-idle-h');
      } else { delete vcRoot.dataset.vcElement; vcRoot.style.removeProperty('--vc-idle-shift-u'); vcRoot.style.removeProperty('--vc-idle-scale'); vcRoot.style.removeProperty('--vc-idle-h'); vcRoot.style.removeProperty('--vc-idle-shift-x-u'); }
    }
    const children = Array.from(body.children), stage = body.querySelector('.hstage');
    const oldTabs = body.querySelector('.hero-art-tabs');
    const skills = children.filter(node => node.matches('.skillbox'));
    if (vcEnabled(id)) {
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
    let revealBachDetails;
    const labels = { basic: 'Công thường', ultimate: 'Tuyệt kỹ', passive: 'Nội tại' };
    for (const skill of skills) {
      const slot = skill.dataset.skillSlot;
      const button = document.createElement('button'); button.type = 'button';
      button.className = 'hv-scene-skill'; button.dataset.skillSlot = slot;
      const icon = document.createElement('span'); icon.className = 'hv-scene-skill-seal';
      icon.textContent = skill.dataset.skillIcon || '✦'; icon.setAttribute('aria-hidden', 'true');
      const label = document.createElement('span'); label.textContent = labels[slot] || 'Kỹ năng';
      button.setAttribute('aria-label', skill.querySelector('.sn')?.textContent || label.textContent);
      button.setAttribute('aria-controls', vcEnabled(id) ? 'vc-detail-content' : 'hero-panel-skills');
      button.append(icon, label);
      button.addEventListener('click', () => {
        if (vcEnabled(id) && revealBachDetails) revealBachDetails('skills', skill, button);
        else activate('skills', true);
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
    if (vcEnabled(id)) {
      // Compact approved profile. Move existing live command nodes into Chi tiết;
      // the main Upgrade command delegates to the original button, never mutations.
      const originalButtons = Array.from(upgrades.querySelectorAll('button'));
      const one = upgrades.querySelector('#lvBtn') || originalButtons.find(button =>
        /nâng cấp|lên cấp/i.test(button.textContent || ''));
      const five = upgrades.querySelector('#lv5Btn, #lv5, #lvFiveBtn, #lv5xBtn') ||
        originalButtons.find(button => button !== one &&
          /(?:[×x+]\s*5|5\s*(?:cấp|lần))/i.test(button.textContent || ''));
      const overview = document.createElement('div');
      overview.className = 'vc-overview';
      const selector = document.createElement('div');
      selector.className = 'vc-upgrade-mode';
      selector.setAttribute('role', 'group');
      selector.setAttribute('aria-label', 'Số cấp nâng');
      const price = document.createElement('div');
      price.className = 'vc-upgrade-price';
      price.setAttribute('aria-live', 'polite');
      const primary = document.createElement('button');
      primary.type = 'button'; primary.className = 'btn vc-primary-upgrade';
      primary.textContent = 'Nâng cấp';
      let count = bachUpgradeCount;
      const modeButtons = [];
      const updateUpgrade = () => {
        const source = count === 5 ? five : one;
        const available = !!source && !source.disabled;
        price.classList.toggle('is-batch', count === 5);
        primary.disabled = !available;
        primary.title = source?.title || '';
        // Owner layout 2026-10-26: one coin pill, cost read from the live button.
        const sourceText = (source?.textContent || '').trim();
        const cost = sourceText.match(/(\d[\d.,]*)\s*$/);
        const coin = document.createElement('i');
        coin.className = 'vc-coin'; coin.setAttribute('aria-hidden', 'true');
        if (!source) price.textContent = 'Chưa có lệnh nâng cấp ' + count + ' cấp';
        else if (cost && count === 1) price.replaceChildren(coin, cost[1] + ' bạc');
        else {
          const firstCost = (one?.textContent || '').match(/(\d[\d.,]*)\s*$/);
          price.replaceChildren(coin, count === 5 && firstCost ? 'Từ ' + firstCost[1] + ' bạc/cấp' : sourceText);
        }
        for (const option of modeButtons) {
          const active = Number(option.dataset.count) === count;
          option.setAttribute('aria-pressed', String(active));
          option.classList.toggle('is-active', active);
        }
      };
      for (const amount of [1, 5]) {
        const option = document.createElement('button');
        option.type = 'button'; option.className = 'vc-mode-btn';
        option.dataset.count = String(amount); option.textContent = '×' + amount;
        option.disabled = amount === 5 && !five;
        option.addEventListener('click', () => { count = amount; bachUpgradeCount = amount; updateUpgrade(); });
        selector.append(option); modeButtons.push(option);
      }
      primary.addEventListener('click', () => {
        const source = count === 5 ? five : one;
        if (!source || source.disabled) return;
        // Existing level-up transaction/receipt handler remains the only owner.
        source.click();
      });
      // Hide only the original duplicated level buttons; other command handlers
      // (star-up, reset and related advancement) remain accessible below.
      if (one) one.classList.add('vc-proxy-source');
      if (five) five.classList.add('vc-proxy-source');
      overview.append(price, selector, primary);
      updateUpgrade();

      const features = document.createElement('nav');
      features.className = 'vc-feature-menu';
      features.setAttribute('aria-label', 'Chức năng của tướng');
      const ICONS = 'assets/ui/hero-detail/reference-v3/'; // Exact crops replace assets/ui/hero-detail/bach-dien-icons/
      const iconImg = name => {
        const img = document.createElement('img');
        img.src = ICONS + name + '.png'; img.alt = ''; img.decoding = 'async';
        img.draggable = false;
        return img;
      };
      // Header chips, power capsule, stat captions and skill seals (owner mock).
      const hero = DATA.heroes[id] || {};
      // Tên: chỉ tên chính, bỏ danh hiệu sau ' — ' (vd 'Đình Lôi — Vệ Binh Trống Đồng').
      const vcTitle = document.querySelector('#hvHeroDetailRoot [data-hd-title]');
      if (vcTitle) {
        vcTitle.textContent = String(hero.name || vcTitle.textContent || '').split(' — ')[0].trim();
        vcTitle.title = hero.name || '';
        setTimeout(() => vcFitText(vcTitle), 0);
      }
      const stars = stage.querySelector('.hsrar .stars');
      if (stars) {
        const n = Math.max(0, Math.min(6, heroStars(id)));
        stars.replaceChildren(); stars.setAttribute('aria-label', n + ' sao');
        for (let i = 0; i < 6; i++) {
          const star = document.createElement('i'); star.className = 'vc-star' + (i < n ? ' is-filled' : '');
          star.setAttribute('aria-hidden', 'true'); stars.append(star);
        }
      }
      const element = stage.querySelector('.hshe');
      if (element && typeof HE === 'object' && HE[hero.he]) {
        element.title = element.textContent.trim();
        element.textContent = 'Hệ ' + HE[hero.he].nm;
      }
      const power = stage.querySelector('.hspow');
      if (power) {
        const row = document.createElement('div'); row.className = 'vc-power-row';
        const role = document.createElement('span'); role.className = 'vc-role';
        role.textContent = VC_HERO_PROFILES[id]?.job || hero.role || '';
        role.title = hero.role || '';
        setTimeout(() => vcFitText(role), 0);
        const value = document.createElement('span'); value.className = 'vc-power';
        const glyph = document.createElement('i'); glyph.textContent = '⚔'; glyph.setAttribute('aria-hidden', 'true');
        const amount = document.createElement('b');
        amount.textContent = (power.textContent || '').replace(/[^\d.,]/g, '');
        value.append(glyph, ' Lực chiến ', amount);
        row.append(role, value);
        power.replaceWith(row);
      }
      // Stat bar: colored icon left, value over caption right (owner mock).
      const STAT_SVG = [
        '<path fill="#e5393b" d="M12 21s-7.2-4.5-9.4-8.7C1 9 3.1 5 6.7 5c2 0 3.4 1.1 4.3 2.5C12 6.1 13.4 5 15.4 5 19 5 21 9 20.9 12.3 18.9 16.5 12 21 12 21z"/>',
        '<path d="M4.5 4.5l10 10M19.5 4.5l-10 10M6.5 17.5l-2.5 2.5M17.5 17.5l2.5 2.5M8.5 15.5l-3-3M15.5 15.5l3-3" stroke="#dfe3ea" stroke-width="2.2" stroke-linecap="round" fill="none"/>',
        '<path fill="#3b7fd8" stroke="#bcd8ff" stroke-width="1.3" d="M12 2.5l8 3v6c0 5-3.4 8.7-8 10.5-4.6-1.8-8-5.5-8-10.5v-6z"/>',
        '<path d="M3 9h11a3 3 0 1 0-3-3M3 13h15a3 3 0 1 1-3 3M3 17h7" stroke="#5db9ff" stroke-width="2.3" fill="none" stroke-linecap="round"/>'
      ];
      ['HP', 'Công', 'Thủ', 'Tốc độ'].forEach((caption, index) => {
        const cell = medals?.querySelectorAll('.mstat')[index];
        if (!cell || cell.querySelector('.vc-stat-ico')) return;
        const value = cell.querySelector('b');
        const ico = document.createElement('span'); ico.className = 'vc-stat-ico';
        ico.setAttribute('aria-hidden', 'true'); ico.dataset.stat = String(index);
        ico.innerHTML = '<svg viewBox="0 0 24 24">' + STAT_SVG[index] + '</svg>';
        const copy = document.createElement('span'); copy.className = 'vc-stat-copy';
        const small = document.createElement('small'); small.textContent = caption;
        copy.append(value, small);
        cell.replaceChildren(ico, copy);
        cell.setAttribute('aria-label', caption + ' ' + (value?.textContent || ''));
      });
      const medal = medals?.querySelector('.medal');
      if (medal && !medal.querySelector('.vc-lv-cap')) {
        const level = medal.querySelector('b')?.textContent || '';
        const max = ((medal.querySelector('small')?.textContent || '').match(/\d+/) || ['30'])[0];
        const top = document.createElement('small'); top.className = 'vc-lv-cap'; top.textContent = 'Cấp';
        const val = document.createElement('b'); val.textContent = level;
        const cap = document.createElement('span'); cap.textContent = '/' + max;
        val.append(cap);
        medal.replaceChildren(top, val);
        medal.setAttribute('aria-label', 'Cấp ' + level + ' trên ' + max);
      }
      for (const seal of shortcuts.querySelectorAll('.hv-scene-skill-seal')) {
        const slot = seal.closest('.hv-scene-skill')?.dataset.skillSlot;
        if (!['basic', 'ultimate', 'passive'].includes(slot)) continue;
        const skillArt = VC_HERO_PROFILES[id]?.skillIcons;
        if (skillArt === 'reference-v3') { seal.textContent = ''; seal.append(iconImg(slot)); seal.classList.add('has-art'); }
        // Mỗi tướng dùng icon riêng của mình, không bao giờ mượn icon Bạch Diện.
        else if (skillArt && skillArt[slot]) {
          const img = document.createElement('img');
          img.src = skillArt[slot];
          img.alt = '';
          img.decoding = 'async';
          seal.replaceChildren(img);
          seal.classList.remove('vc-native-skill');
          seal.classList.add('has-art');
        } else {
          // Chưa có icon riêng: ấn chữ đầu tên kỹ năng (tạm thời, KHÔNG dùng emoji).
          const skillNode = skills.find(skill => skill.dataset.skillSlot === slot);
          const title = (skillNode?.querySelector('.sn')?.textContent || '').replace(/^[^—]*—\s*/, '').trim();
          seal.textContent = (title.match(/\p{L}/u) || [''])[0].toUpperCase();
          seal.classList.add('vc-native-skill', 'vc-letter-seal');
        }
      }
      const feature = (label, symbol, action) => {
        const button = document.createElement('button');
        button.type = 'button'; button.className = 'vc-feature';
        const art = document.createElement('span');
        art.className = 'vc-feature-symbol';
        art.append(iconImg(symbol));
        art.setAttribute('aria-hidden', 'true');
        const caption = document.createElement('span');
        caption.textContent = label;
        button.append(art, caption); button.addEventListener('click', action);
        return button;
      };
      const sheet = document.createElement('dialog');
      sheet.className = 'vc-detail-sheet';
      sheet.setAttribute('aria-labelledby', 'vc-sheet-heading');
      const sheetHeader = document.createElement('header'); sheetHeader.className = 'vc-sheet-header';
      const sheetIcon = document.createElement('span'); sheetIcon.className = 'vc-sheet-icon'; sheetIcon.setAttribute('aria-hidden', 'true');
      const sheetTitle = document.createElement('h2'); sheetTitle.id = 'vc-sheet-heading'; sheetTitle.textContent = 'Chi tiết tướng';
      const close = document.createElement('button'); close.type = 'button'; close.textContent = 'Đóng'; close.className = 'vc-sheet-close';
      close.setAttribute('aria-label', 'Đóng chi tiết');
      sheetHeader.append(sheetIcon, sheetTitle, close);
      const brandBar = document.createElement('div'); brandBar.className = 'vc-brand-bar';
      const brandLogo = document.createElement('img'); brandLogo.src = 'assets/ui/an-ba-dao/logo-v1.webp'; brandLogo.alt = 'An Bá Đạo';
      const wallet = document.createElement('div'); wallet.className = 'vc-wallet';
      brandBar.append(brandLogo, wallet);
      const skillChoices = document.createElement('nav'); skillChoices.className = 'vc-popup-skills'; skillChoices.setAttribute('aria-label', 'Chọn kỹ năng');
      for (const original of stage.querySelectorAll('.hv-scene-skill')) {
        const choice = original.cloneNode(true); choice.removeAttribute('id');
        choice.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'));
        choice.addEventListener('click', () => original.click()); skillChoices.append(choice);
      }
      const understood = document.createElement('button'); understood.type = 'button'; understood.className = 'btn vc-skill-understood'; understood.textContent = 'Đã hiểu'; understood.addEventListener('click', () => sheet.close());
      let sheetOpener = null;
      let skillPopupTarget = null;
      // Render a still of the current hero without moving or duplicating its live idle.
      const updatePreview = container => {
        if (!container) return;
        container.replaceChildren();
        const source = stage.querySelector('canvas');
        if (source?.width && source?.height) {
          const preview = document.createElement('canvas');
          let crop = {x:0,y:0,w:source.width,h:source.height};
          try {
            const pixels = source.getContext('2d').getImageData(0,0,source.width,source.height).data;
            let x0=source.width,y0=source.height,x1=0,y1=0;
            for (let y=0;y<source.height;y+=2) for (let x=0;x<source.width;x+=2) {
              if (pixels[(y*source.width+x)*4+3] < 24) continue;
              x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);
            }
            if (x1>x0 && y1>y0) crop={x:x0,y:y0,w:Math.min(source.width-x0,x1-x0+3),h:Math.min(source.height-y0,y1-y0+3)};
          } catch (_) { /* cross-origin canvas: retain the original frame */ }
          preview.width = crop.w; preview.height = crop.h;
          preview.getContext('2d').drawImage(source,crop.x,crop.y,crop.w,crop.h,0,0,crop.w,crop.h);
          preview.setAttribute('aria-label', hero.name || 'Tướng');
          container.append(preview);
        } else if (typeof portraitSrc === 'function') {
          const image = document.createElement('img');
          image.src = portraitSrc(id, 'master') || portraitSrc(id, 'card');
          image.alt = hero.name || 'Tướng'; container.append(image);
        }
      };
      const restoreSkillPopup = () => {
        if (!skillPopupTarget) return;
        for (const node of panels.get('skills')?.children || []) node.hidden = false;
        strip.hidden = false;
        workspace.classList.remove('is-skill-popup');
        skillPopupTarget = null;
      };
      const reveal = (key, target, opener) => {
        restoreSkillPopup();
        activate(key); sheetOpener = opener || detailTrigger;
        sheet.dataset.sheetView = target === upgrades ? 'star' : key;
        skillChoices.hidden = key !== 'skills'; understood.hidden = key !== 'skills';
        [...skillChoices.children].forEach((choice,index) => choice.setAttribute('aria-pressed', String(stage.querySelectorAll('.hv-scene-skill')[index] === opener)));
        wallet.replaceChildren();
        for (const [icon, amount, label] of [['◉', P.gold, 'Vàng'], ['◈', P.gems, 'Ngọc']]) {
          const chip = document.createElement('span'); chip.setAttribute('aria-label', label);
          chip.textContent = icon + ' ' + Number(amount || 0).toLocaleString('vi-VN'); wallet.append(chip);
        }
        strip.hidden = key === 'equipment' || target === upgrades || (key === 'skills' && !!target);
        const advancedSection = workspace.querySelector('.vc-advanced-actions');
        if (advancedSection) advancedSection.hidden = target !== upgrades;
        const summary = workspace.querySelector('.vc-profile-summary');
        if (summary) summary.hidden = target === upgrades || key === 'equipment' || key === 'skills';
        if (target === upgrades) {
          for (const panel of panels.values()) panel.hidden = true;
        }
        for (const [tabKey, tabButton] of buttons) {
          tabButton.hidden = !['attributes', 'breakthrough', 'bonds', 'mastery'].includes(tabKey);
        }
        if (key === 'equipment') {
          const equipment = panels.get('equipment');
          equipment.replaceChildren(equipmentPanel(id));
          updatePreview(equipment.querySelector('[data-hero-preview]'));
        }
        if (target === upgrades) updatePreview(starPreview);
        if (key === 'skills' && target) {
          skillPopupTarget = target;
          for (const node of panels.get('skills')?.children || []) node.hidden = node !== target;
          strip.hidden = true;
          workspace.classList.add('is-skill-popup');
          const name = target.querySelector('.sn, h3, h4, strong')?.textContent?.trim();
          const sourceIcon = opener?.querySelector('.hv-scene-skill-seal');
          sheetIcon.replaceChildren();
          const sourceImage = sourceIcon?.querySelector('img');
          if (sourceImage) {
            const image = document.createElement('img'); image.src = sourceImage.src; image.alt = '';
            sheetIcon.append(image);
          } else sheetIcon.textContent = sourceIcon?.textContent || '✦';
          sheetIcon.style.backgroundImage = sourceIcon ? getComputedStyle(sourceIcon).backgroundImage : '';
          sheetIcon.dataset.skillSlot = target.dataset.skillSlot || '';
          sheetIcon.hidden = false;
          sheetTitle.textContent = name ? name.replace(/^.*?—\s*/, '').replace(/\s*·\s*\d+\s*MP$/, '') : 'Kỹ năng';
        } else {
          sheetIcon.hidden = true;
          sheetIcon.textContent = '';
          sheetIcon.style.backgroundImage = '';
          sheetIcon.dataset.skillSlot = '';
          sheetTitle.textContent = key === 'equipment' ? 'Trang bị' : target === upgrades ? 'Thăng sao' : 'Chi tiết';
        }
        if (!sheet.open) sheet.showModal();
        sheetOpener.setAttribute('aria-expanded', 'true');
        workspace.scrollTop = 0;
        close.focus({preventScroll:true});
      };
      revealBachDetails = reveal;
      close.addEventListener('click', () => sheet.close());
      sheet.addEventListener('close', () => {
        // A queued close event must not reset a newly reopened skill popup.
        if (sheet.open) return;
        restoreSkillPopup();
        sheet.dataset.sheetView = '';
        sheetIcon.hidden = true;
        sheetIcon.style.backgroundImage = '';
        sheetTitle.textContent = 'Chi tiết tướng';
        sheetOpener?.setAttribute('aria-expanded', 'false');
        if (sheetOpener?.isConnected) sheetOpener.focus({preventScroll:true});
        if (panels.get('equipment').querySelector('[data-changed="true"]')) {
          renderHeroDetail(id);
          body.querySelector('.vc-feature')?.focus({preventScroll:true});
        }
      });
      sheet.addEventListener('click', event => {
        if (event.target !== sheet) return;
        const rect = sheet.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) sheet.close();
      });
      const detailTrigger = feature('Chi tiết', 'details', () => reveal('attributes', null, detailTrigger));
      detailTrigger.setAttribute('aria-controls', 'vc-detail-content');
      detailTrigger.setAttribute('aria-expanded', 'false');
      detailTrigger.setAttribute('aria-haspopup', 'dialog');
      const gearTrigger = feature('Trang bị', 'equipment', () => reveal('equipment', null, gearTrigger));
      const starTrigger = feature('Thăng sao', 'star', () => reveal('attributes', upgrades, starTrigger));
      gearTrigger.setAttribute('aria-haspopup', 'dialog'); starTrigger.setAttribute('aria-haspopup', 'dialog');
      features.append(gearTrigger, starTrigger, detailTrigger);
      workspace.id = 'vc-detail-content';
      workspace.hidden = false;
      // Do not clone or replace .upgrades: listeners, ids, costs and guards survive.
      const advanced = document.createElement('section');
      advanced.className = 'vc-advanced-actions';
      const advancedTitle = document.createElement('h3');
      advancedTitle.textContent = '';
      advancedTitle.hidden = true;
      const starPreview = document.createElement('div'); starPreview.className = 'vc-star-preview';
      const starTrack = document.createElement('div'); starTrack.className = 'vc-star-track';
      const countStars = Math.max(0, heroStars(id));
      const starCommand = upgrades.querySelector('#stBtn');
      starTrack.textContent = '★'.repeat(countStars) + (countStars >= 6 ? ' · Tối đa' : ' → ' + '★'.repeat(countStars + 1));
      const shardCopy = document.createElement('p'); shardCopy.className = 'vc-shard-copy';
      const haveShards = Number(P.shards?.[id] || 0);
      const needShards = typeof starCost === 'function' ? starCost(id) :
        Number((starCommand?.textContent || '').match(/(\d+)\s*mảnh/)?.[1]) || 20 * countStars;
      if (starCommand) {
        starCommand.disabled = starCommand.disabled || countStars >= 6 || haveShards < needShards;
        starCommand.title = countStars >= 6 ? 'Đã đạt 6 sao' : 'Cần ' + needShards + ' mảnh hồn';
        starCommand.textContent = countStars >= 6 ? 'Đã tối đa' : haveShards < needShards ? 'Chưa đủ mảnh' : 'Thăng sao';
      }
      shardCopy.textContent = 'Mảnh ' + String(hero.name || '').split(' — ')[0] + ': ' + haveShards +
        (needShards == null ? '' : '/' + needShards);
      const starHelp = document.createElement('p'); starHelp.className = 'vc-screen-note';
      starHelp.textContent = '';
      starHelp.hidden = true;
      const fragment = vcNode('div', 'vc-fragment-card');
      const fragmentArt = vcNode('img', '');
      if (typeof portraitSrc === 'function') fragmentArt.src = portraitSrc(id, 'card') || '';
      fragmentArt.alt = '';
      const fragmentInfo = vcNode('div', '');
      const progress = vcNode('progress', '');
      progress.max = needShards || 1; progress.value = Math.min(haveShards, needShards);
      progress.setAttribute('aria-label', 'Mảnh thăng sao');
      fragmentInfo.append(shardCopy, progress);
      fragment.append(fragmentArt, fragmentInfo);
      advanced.append(advancedTitle, starPreview, starTrack);
      if (typeof heroStats === 'function') {
        const stats = heroStats(id), next = vcNextStarStats(id);
        advanced.append(vcStatTable(stats, next || stats));
      }
      advanced.append(fragment);
      // Keep the original guarded command and its listener, isolate it from level/reset actions.
      if (starCommand) advanced.append(starCommand);
      else advanced.append(document.createTextNode('Chưa thể thăng sao.'));
      const sources = vcNode('button', 'btn vc-shard-source', 'Nguồn mảnh'); sources.type = 'button';
      const sourceList = vcNode('div', 'vc-shard-sources'); sourceList.hidden = true;
      sourceList.append(vcNode('p', '', 'Nhận mảnh hồn qua Chiêu mộ và phần thưởng Chinh chiến.'));
      for (const [route, text] of [['summon','Chiêu mộ'],['campaign','Chinh chiến']]) {
        const go = vcNode('button', 'btn', text); go.type = 'button';
        go.addEventListener('click', () => { sheet.close(); navTo(route); }); sourceList.append(go);
      }
      sources.addEventListener('click', () => {
        sourceList.hidden = !sourceList.hidden;
        sources.setAttribute('aria-expanded', String(!sourceList.hidden));
      });
      sources.setAttribute('aria-expanded', 'false');
      advanced.append(sources, sourceList);
      upgrades.classList.add('vc-secondary-progression');
      panels.get('mastery').append(upgrades);
      workspace.append(advanced);
      const profileCopy = document.createElement('section'); profileCopy.className = 'section';
      profileCopy.classList.add('vc-profile-summary');
      const profileArt = vcNode('img', 'vc-profile-portrait');
      if (typeof portraitSrc === 'function') profileArt.src = portraitSrc(id, 'card') || '';
      profileArt.alt = '';
      const profileText = vcNode('div', 'vc-profile-text');
      profileText.append(vcNode('h3', '', String(hero.name || '').split(' — ')[0]),
        vcNode('p', '', (VC_HERO_PROFILES[id]?.job || '') + ' · ' + (element?.textContent || '')),
        vcNode('p', 'vc-profile-stars', '★'.repeat(countStars)));
      profileCopy.append(profileArt, profileText);
      const quote = stage.querySelector('.hsepi');
      if (quote) profileText.append(quote);
      const affinityCopy = document.createElement('p'); affinityCopy.textContent = element?.title || element?.textContent || '';
      profileText.append(affinityCopy);
      if (typeof heroStats === 'function') {
        for (const node of panels.get('attributes').children) {
          if (!node.querySelector('button,input,select')) node.classList.add('vc-legacy-info');
        }
        panels.get('attributes').prepend(vcStatTable(heroStats(id)));
      }
      workspace.insertBefore(profileCopy, strip);
      sheet.append(brandBar, skillChoices, sheetHeader, workspace, understood);
      body.replaceChildren(stage, medals, overview, features, sheet);
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
      const visibleTabs = tabs.filter(([key]) => !buttons.get(key).hidden);
      const index = visibleTabs.findIndex(([key]) => key === button.dataset.detailTab);
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? visibleTabs.length - 1
        : (index + (event.key === 'ArrowRight' ? 1 : -1) + visibleTabs.length) % visibleTabs.length;
      activate(visibleTabs[next][0], true);
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




