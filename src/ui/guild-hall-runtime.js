(() => {
  if (typeof document === 'undefined' || !document.body) return;
  const body = document.getElementById('guildBody');
  if (!body || document.getElementById('hvGuildRoot')) return;

  const root = document.createElement('section');
  root.id = 'hvGuildRoot';
  root.setAttribute('aria-label', 'Bang Hội');
  root.innerHTML = `<header class="hv-guild-top">
    <button type="button" class="hv-guild-back" data-guild-close aria-label="Đóng">‹</button>
    <b>Bang Hội</b>
    <span></span>
  </header>
  <div class="hv-guild-hero" data-ghero></div>
  <div class="hv-guild-ranks" data-granks></div>
  <div class="hv-guild-city" data-gcity></div>
  <nav class="hv-guild-dock">
    <button type="button" data-gdock="log">Nhật ký</button>
    <button type="button" data-gdock="manage">Quản lý</button>
    <button type="button" data-gdock="info">Thông tin</button>
  </nav>
  <div class="hv-guild-sheet" hidden data-gsheet>
    <div class="gs-dim" data-gsheet-x></div>
    <section class="gs-panel">
      <div class="gs-ribbon"><h3 data-gsheet-title></h3></div>
      <button type="button" class="x" data-gsheet-x aria-label="Đóng"></button>
      <div class="gs-res" data-gsheet-res hidden></div>
      <div class="gs-body" data-gsheet-body></div>
    </section>
  </div>
  <div class="hv-guild-stage"></div>`;
  root.querySelector('.hv-guild-stage').append(body);
  document.body.append(root);

  const TILES = [
    { id: 'tech', name: 'Võ Đường', img: 'assets/ui/guild/tiles/vo-duong.jpg' },
    { id: 'shop', name: 'Kho Bảo', img: 'assets/ui/guild/tiles/kho-bao.jpg' },
    { id: 'boss', name: 'Hổ Trấn', img: 'assets/ui/guild/tiles/ho-tran.jpg' },
    { id: 'campaign', name: 'Chiến Dịch', img: 'assets/ui/guild/tiles/chien-dich.jpg' },
    { id: 'war', name: 'Bang Chiến', img: 'assets/ui/guild/tiles/bang-chien.jpg' },
    { id: 'mission', name: 'Công Vụ', img: 'assets/ui/guild/tiles/cong-vu.jpg' },
    { id: 'honor', name: 'Bang Thương', img: 'assets/ui/guild/tiles/bang-thuong.jpg' }
  ];

  const sheet = root.querySelector('[data-gsheet]');
  const sheetTitle = root.querySelector('[data-gsheet-title]');
  const sheetBody = root.querySelector('[data-gsheet-body]');
  const sheetRes = root.querySelector('[data-gsheet-res]');

  function g() { return (typeof myGuild === 'function' && myGuild()) || null; }

  function openSheet(title, html, resHtml) {
    const keep = (!sheet.hidden && sheetTitle.textContent === title) ? sheetBody.scrollTop : 0;
    sheetTitle.textContent = title;
    sheetBody.innerHTML = html;
    sheetRes.innerHTML = resHtml || '';
    sheetRes.hidden = !resHtml;
    sheet.hidden = false;
    sheetBody.scrollTop = keep;
  }
  function closeSheet() { sheet.hidden = true; }

  function paintCity() {
    if (typeof renderGuild === 'function') renderGuild();
    const mine = g();
    const hero = root.querySelector('[data-ghero]');
    const ranks = root.querySelector('[data-granks]');
    const city = root.querySelector('[data-gcity]');
    if (!mine) {
      hero.innerHTML = `<div class="nm">Chưa có mái bang</div>
        <div class="sub">Gia nhập để mở võ đường, hổ trấn, chiến dịch.</div>
        <div class="row"><button type="button" data-gact="list">Danh sách bang</button></div>`;
      ranks.innerHTML = '';
      city.innerHTML = (typeof GUILDS !== 'undefined' ? GUILDS : []).map(x =>
        `<button type="button" class="hv-gtile" data-gact="join:${x.id}"><img src="assets/ui/guild/tiles/chien-dich.jpg" alt=""><b>${x.ic} ${x.name}</b></button>`
      ).join('');
      return;
    }
    if (typeof ensureGuildDepth === 'function') ensureGuildDepth();
    const p = typeof P === 'object' ? P.guild : {};
    hero.innerHTML = `<div class="nm">${mine.ic} ${mine.name}</div>
      <div class="sub">Cấp ${p.level || 1} · ${p.contrib || 0} cống · Bang Chiến ${p.war?.rating || 1000}</div>
      <div class="row">
        <button type="button" data-gact="list">Danh sách</button>
        <button type="button" data-gdock="log">Phần thưởng</button>
      </div>`;
    const tech = p.tech || {};
    ranks.innerHTML = `<span>Võ ${tech.war || 0}</span><span>Hộ ${tech.guard || 0}</span><span>Hậu ${tech.supply || 0}</span><span>XP ${p.xp || 0}</span><span>${p.dailyEarned || 0}/120</span>`;
    const bossDot = (p.boss && p.boss.attempts < 2 && (p.boss.phase || 1) <= 3);
    city.innerHTML = TILES.map(t =>
      `<button type="button" class="hv-gtile${t.id === 'boss' && bossDot ? ' is-dot' : ''}" data-gtile="${t.id}"><img src="${t.img}" alt=""><b>${t.name}</b></button>`
    ).join('');
  }

  // ---- Bảng chức năng (mẫu B owner 13/11): icon/khung/nút là asset GPT trong assets/ui/guild/sheet, code chỉ đặt dữ liệu.
  const IC = n => 'assets/ui/guild/sheet/icons/' + String(n).padStart(2, '0') + '.webp';
  const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const num = n => Number(n || 0).toLocaleString('vi-VN');
  const gp = () => { try { if (typeof ensureGuildDepth === 'function') ensureGuildDepth(); } catch (_) {} return (typeof P === 'object' && P.guild) || {}; };
  const pips = (lv, max) => '<span class="gs-pips">' + Array.from({ length: max }, (_, i) => '<i class="' + (i < lv ? 'on' : '') + '"></i>').join('') + '</span>';
  const bar = (v, goal) => '<span class="gs-bar"><i style="width:' + Math.max(0, Math.min(100, goal ? v / goal * 100 : 100)) + '%"></i></span>';
  const res = (icon, label, value) => '<img class="gs-rico" src="' + IC(icon) + '" alt=""><span>' + label + '</span><b>' + value + '</b>';
  const RW = { gold: 'vàng', tinh: 'Tinh Lực', hoat: 'Hoạt Lực', gems: 'Ngọc' };
  const rewardText = r => Object.entries(r || {}).map(([k, v]) => v + ' ' + (RW[k] || k)).join(' + ');

  function row(o) {
    const btn = o.act
      ? '<button type="button" class="act' + (o.cls ? ' ' + o.cls : '') + '" data-gact="' + o.act + '"' + (o.disabled ? ' disabled' : '') + '>' + o.label + '</button>'
      : (o.note ? '<span class="gs-note">' + o.note + '</span>' : '');
    return '<article class="gs-row"><img class="gs-ic" src="' + IC(o.icon) + '" alt=""><div class="gs-copy"><b>' + o.name + '</b><small>' + (o.desc || '') + '</small>' + (o.extra || '') + '</div>' + btn + '</article>';
  }

  function htmlTech() {
    const p = gp(), ICN = { war: 1, guard: 2, supply: 3 };
    return Object.entries(typeof GUILD_TECH === 'object' ? GUILD_TECH : {}).map(([k, t]) => {
      const lv = (p.tech && p.tech[k]) || 0, max = lv >= 5, cost = max ? 0 : t.cost(lv), lack = !max && (p.techPts || 0) < cost;
      return row({ icon: ICN[k] || 1, name: esc(t.name) + ' Lv.' + lv + '/5', desc: esc(t.desc), extra: pips(lv, 5), act: 'tech:' + k, label: max ? 'Tối đa' : 'Nâng cấp ' + cost, disabled: max, cls: max ? 'done' : (lack ? 'lack' : '') });
    }).join('');
  }
  function htmlMissions() {
    const p = gp(), m = p.missions || {}, ICN = { battle: 8, win: 9, donate: 10 };
    return (typeof GUILD_MISSIONS !== 'undefined' ? GUILD_MISSIONS : []).map(d => {
      const v = Math.min(d.goal, m[d.id] || 0), done = (m.claimed || []).includes(d.id);
      return row({ icon: ICN[d.id] || 8, name: esc(d.name), desc: v + '/' + d.goal + ' · thưởng +' + d.reward + ' cống hiến', extra: bar(v, d.goal), act: 'mission:' + d.id, label: done ? 'Đã nhận' : (v < d.goal ? 'Chưa đủ' : 'Nhận'), disabled: done || v < d.goal, cls: done ? 'done' : '' });
    }).join('');
  }
  const SHOP_NAME = { sh: '5 mảnh hero ngẫu nhiên', tinh: '30 Tinh Lực', hoat: '30 Hoạt Lực', gems: '20 Ngọc' };
  function htmlShop() {
    const p = gp(), ICN = { sh: 4, tinh: 5, hoat: 6, gems: 7 };
    return (typeof GUILD_SHOP !== 'undefined' ? GUILD_SHOP : []).map(s => {
      const bought = (p.bought || []).includes(s.k), lack = !bought && (p.contrib || 0) < s.cost;
      return row({ icon: ICN[s.k] || 7, name: SHOP_NAME[s.k] || esc(s.label), desc: bought ? 'Mai mới có lại' : 'Giá ' + s.cost + ' cống hiến · 1 lần mỗi ngày', act: 'buy:' + s.k, label: bought ? 'Đã đổi' : 'Đổi ' + s.cost, disabled: bought, cls: bought ? 'done' : (lack ? 'lack' : '') });
    }).join('');
  }
  function htmlCamp() {
    const p = gp();
    return (typeof GUILD_CAMPAIGN !== 'undefined' ? GUILD_CAMPAIGN : []).map(d => {
      const done = ((p.campaign && p.campaign.claimed) || []).includes(d.n), earned = p.dailyEarned || 0, ok = earned >= d.need;
      return row({ icon: 10 + d.n, name: d.n + '. ' + esc(d.name), desc: esc(d.desc) + ' · thưởng ' + rewardText(d.reward), extra: d.need ? bar(Math.min(earned, d.need), d.need) : '', act: 'camp:' + d.n, label: done ? 'Đã nhận' : (ok ? 'Nhận' : 'Cần ' + d.need), disabled: done || !ok, cls: done ? 'done' : '' });
    }).join('');
  }
  function htmlWar() {
    const att = (gp().war && gp().war.attempts) || 0, ICN = { tram_suong: 17, hoang_hon: 18, mat_trang: 19 };
    return (typeof GUILD_WAR_RIVALS !== 'undefined' ? GUILD_WAR_RIVALS : []).map(r =>
      row({ icon: ICN[r.id] || 17, name: esc(r.name), desc: 'Điểm ' + r.rating + ' · ' + esc(r.bonus), act: 'war:' + r.id, label: 'Khiêu chiến', disabled: att >= 3, cls: att >= 3 ? 'lack' : '' })).join('');
  }
  function htmlBoss() {
    const b = gp().boss || {}, ph = b.phase || 1, at = b.attempts || 0;
    if (ph > 3) return row({ icon: 16, name: 'Hổ Trấn', desc: 'Đã hạ đủ 3 phase hôm nay.', note: 'Hoàn thành' });
    return '<div class="gs-hero"><div class="hv-gtile"><img src="assets/ui/guild/tiles/ho-tran.jpg" alt=""><b>Hổ Trấn</b></div></div>' + row({ icon: 16, name: 'Hổ Trấn · Phase ' + ph + '/3', desc: 'Lượt ' + at + '/2 hôm nay', extra: pips(Math.min(3, ph - 1), 3), act: 'boss', label: 'Đánh Hổ Trấn', disabled: at >= 2, cls: at >= 2 ? 'lack' : '' });
  }
  function htmlList() {
    const mine = g(), ICN = { cu_dem: 21, gac_giac: 22, ca_ba: 23, mo_cham: 24 };
    return (typeof GUILDS !== 'undefined' ? GUILDS : []).map(x => {
      const own = !!(mine && mine.id === x.id);
      return row({ icon: ICN[x.id] || 21, name: esc(x.name), desc: esc(x.desc) + (mine && !own ? ' · đổi bang phí 500 vàng' : ''), act: own ? '' : 'join:' + x.id, label: mine ? 'Chuyển bang' : 'Gia nhập', note: own ? 'Bang của anh' : '' });
    }).join('');
  }
  function htmlManage() {
    const donated = !!gp().donated;
    return row({ icon: 10, name: 'Cống hiến vàng', desc: donated ? 'Hôm nay đã cống hiến' : '300 vàng → +30 điểm đóng góp', act: 'donate', label: donated ? 'Đã góp' : 'Cống hiến', disabled: donated, cls: donated ? 'done' : '' })
      + row({ icon: 20, name: 'Khóa đội phòng thủ', desc: 'Lưu đội hình hiện tại làm đội thủ Bang Chiến', act: 'lock', label: 'Khóa đội' });
  }

  const SHEETS = {
    tech: () => ['Võ Đường', htmlTech(), res(1, 'Điểm Công Nghệ', num(gp().techPts))],
    shop: () => ['Bang Thương', htmlShop(), res(10, 'Cống hiến', num(gp().contrib))],
    boss: () => ['Hổ Trấn', htmlBoss(), res(16, 'Lượt đánh hôm nay', (gp().boss && gp().boss.attempts || 0) + '/2')],
    camp: () => ['Chiến Dịch', htmlCamp(), res(10, 'Đóng góp hôm nay', num(gp().dailyEarned))],
    war: () => ['Bang Chiến', htmlWar(), res(17, 'Điểm Bang Chiến', num((gp().war && gp().war.rating) || 1000) + ' · lượt ' + ((gp().war && gp().war.attempts) || 0) + '/3')],
    mission: () => ['Công Vụ', htmlMissions(), res(10, 'Cống hiến', num(gp().contrib))],
    log: () => ['Nhật ký · Công Vụ', htmlMissions(), res(10, 'Cống hiến', num(gp().contrib))],
    manage: () => ['Quản lý', htmlManage(), res(10, 'Cống hiến', num(gp().contrib))],
    list: () => ['Danh sách bang', htmlList(), res(21, 'Bang của anh', (g() && esc(g().name)) || 'Chưa vào bang')],
    info: () => ['Thông tin', htmlList(), res(21, 'Bang của anh', (g() && esc(g().name)) || 'Chưa vào bang')]
  };
  function show(kind) { const f = SHEETS[kind]; if (f) openSheet.apply(null, f()); }

  const TILE_SHEET = { tech: 'tech', shop: 'shop', honor: 'shop', boss: 'boss', campaign: 'camp', war: 'war', mission: 'mission' };
  function openTile(id) { if (TILE_SHEET[id]) show(TILE_SHEET[id]); }

  function handle(act) {
    const [k, v] = String(act).split(':');
    let ok = false;
    if (k === 'list') { show('list'); return; }
    if (k === 'join' && typeof joinGuild === 'function') ok = joinGuild(v);
    if (k === 'donate' && typeof guildDonate === 'function') ok = guildDonate();
    if (k === 'lock' && typeof saveGuildDefense === 'function') { saveGuildDefense(); ok = true; }
    if (k === 'tech' && typeof guildUpgradeTech === 'function') ok = guildUpgradeTech(v);
    if (k === 'mission' && typeof guildClaimMission === 'function') ok = guildClaimMission(v);
    if (k === 'buy' && typeof guildBuy === 'function') ok = guildBuy(v);
    if (k === 'camp' && typeof guildCampaignClaim === 'function') ok = guildCampaignClaim(Number(v));
    if (k === 'war' && typeof startGuildWar === 'function') { startGuildWar(v); return; }
    if (k === 'boss' && typeof startGuildBoss === 'function') { startGuildBoss(); return; }
    paintCity();
    if (ok) {
      if (k === 'tech') show('tech');
      if (k === 'mission') show('mission');
      if (k === 'buy') show('shop');
      if (k === 'camp') show('camp');
      if (k === 'donate') show('manage');
      if (k === 'join') closeSheet();
    }
  }

  const syncOpen = name => {
    const open = name === 'guild';
    root.hidden = !open;
    root.classList.toggle('is-open', open);
    document.body.classList.toggle('guild-hall-active', open);
    if (open) { closeSheet(); paintCity(); }
  };

  const baseShowScreen = showScreen;
  showScreen = function showScreenWithGuildHall(name) {
    baseShowScreen(name);
    syncOpen(ST.screen);
  };

  root.querySelector('[data-guild-close]').addEventListener('click', () => navTo('hub'));
  root.addEventListener('click', ev => {
    if (ev.target.closest('[data-gsheet-x]')) { closeSheet(); return; }
    const dock = ev.target.closest('[data-gdock]');
    if (dock) {
      const id = dock.getAttribute('data-gdock');
      if (SHEETS[id]) show(id);
      return;
    }
    const tile = ev.target.closest('[data-gtile]');
    if (tile) { openTile(tile.getAttribute('data-gtile')); return; }
    const act = ev.target.closest('[data-gact]');
    if (act) handle(act.getAttribute('data-gact'));
  });
  syncOpen(typeof ST === 'object' ? ST.screen : '');
})();
