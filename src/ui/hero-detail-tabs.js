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
      button.setAttribute('aria-controls', 'hero-panel-skills');
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
      const sheetTitle = document.createElement('h2'); sheetTitle.id = 'vc-sheet-heading'; sheetTitle.textContent = 'Chi tiết tướng';
      const close = document.createElement('button'); close.type = 'button'; close.textContent = 'Đóng'; close.className = 'vc-sheet-close';
      close.setAttribute('aria-label', 'Đóng chi tiết');
      sheetHeader.append(sheetTitle, close);
      let sheetOpener = null;
      const reveal = (key, target, opener) => {
        activate(key); sheetOpener = opener || detailTrigger;
        if (!sheet.open) sheet.showModal();
        detailTrigger.setAttribute('aria-expanded', 'true');
        buttons.get(key)?.focus({preventScroll:true});
        if (target) target.scrollIntoView({block:'nearest'});
      };
      revealBachDetails = reveal;
      close.addEventListener('click', () => sheet.close());
      sheet.addEventListener('close', () => {
        detailTrigger.setAttribute('aria-expanded', 'false');
        if (sheetOpener?.isConnected) sheetOpener.focus({preventScroll:true});
      });
      sheet.addEventListener('click', event => {
        if (event.target !== sheet) return;
        const rect = sheet.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) sheet.close();
      });
      const detailTrigger = feature('Chi tiết', 'details', () => reveal(selected));
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
      advancedTitle.textContent = 'Thăng sao & bồi dưỡng';
      advanced.append(advancedTitle, upgrades);
      workspace.append(advanced);
      const profileCopy = document.createElement('section'); profileCopy.className = 'section';
      const quote = stage.querySelector('.hsepi');
      if (quote) profileCopy.append(quote);
      const affinityCopy = document.createElement('p'); affinityCopy.textContent = element?.title || element?.textContent || '';
      profileCopy.append(affinityCopy); panels.get('attributes').prepend(profileCopy);
      sheet.append(sheetHeader, workspace);
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

