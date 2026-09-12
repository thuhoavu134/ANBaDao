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
    <button type="button" class="x" data-gsheet-x aria-label="Đóng">‹</button>
    <h3 data-gsheet-title></h3>
    <div data-gsheet-body></div>
  </div>
  <div class="hv-guild-stage"></div>`;
  root.querySelector('.hv-guild-stage').append(body);
  document.body.append(root);

  const TILES = [
    { id: 'clan', name: 'Gia Tộc', img: 'assets/ui/guild/tiles/gia-toc.jpg' },
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

  function g() { return (typeof myGuild === 'function' && myGuild()) || null; }

  function openSheet(title, html) {
    sheetTitle.textContent = title;
    sheetBody.innerHTML = html;
    sheet.hidden = false;
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
        `<button type="button" class="hv-gtile" data-gact="join:${x.id}"><img src="assets/ui/guild/tiles/gia-toc.jpg" alt=""><b>${x.ic} ${x.name}</b></button>`
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

  function htmlTech() {
    const p = P.guild || {};
    return Object.entries(typeof GUILD_TECH === 'object' ? GUILD_TECH : {}).map(([k, t]) => {
      const lv = (p.tech && p.tech[k]) || 0;
      const cost = lv < 5 && t.cost ? t.cost(lv) : 0;
      return `<div class="card">${t.ic} ${t.name} Lv.${lv}/5<br>${t.desc}
        <button type="button" class="act" data-gact="tech:${k}" ${lv >= 5 ? 'disabled' : ''}>${lv >= 5 ? 'MAX' : 'Nâng · ' + cost + ' CN'}</button></div>`;
    }).join('');
  }
  function htmlMissions() {
    const m = (P.guild && P.guild.missions) || {};
    return (typeof GUILD_MISSIONS !== 'undefined' ? GUILD_MISSIONS : []).map(d => {
      const v = Math.min(d.goal, m[d.id] || 0);
      const done = (m.claimed || []).includes(d.id);
      return `<div class="card">${d.name} · ${v}/${d.goal}
        <button type="button" class="act" data-gact="mission:${d.id}" ${done || v < d.goal ? 'disabled' : ''}>${done ? 'Đã nhận' : 'Nhận'}</button></div>`;
    }).join('');
  }
  function htmlShop() {
    return (typeof GUILD_SHOP !== 'undefined' ? GUILD_SHOP : []).map(s =>
      `<button type="button" class="act" data-gact="buy:${s.k}">${s.label} — ${s.cost}đ</button>`
    ).join('');
  }
  function htmlCamp() {
    const p = P.guild || {};
    return (typeof GUILD_CAMPAIGN !== 'undefined' ? GUILD_CAMPAIGN : []).map(d => {
      const done = (p.campaign && p.campaign.claimed || []).includes(d.n);
      const ok = (p.dailyEarned || 0) >= d.need;
      return `<button type="button" class="act" data-gact="camp:${d.n}" ${done || !ok ? 'disabled' : ''}>${d.n}. ${d.name} · cần ${d.need}</button>`;
    }).join('');
  }
  function htmlWar() {
    const att = (P.guild && P.guild.war && P.guild.war.attempts) || 0;
    return (typeof GUILD_WAR_RIVALS !== 'undefined' ? GUILD_WAR_RIVALS : []).map(r =>
      `<button type="button" class="act" data-gact="war:${r.id}" ${att >= 3 ? 'disabled' : ''}>⚔ ${r.name} · ${r.rating}</button>`
    ).join('');
  }
  function htmlList() {
    const mine = g();
    return (typeof GUILDS !== 'undefined' ? GUILDS : []).map(x =>
      `<div class="card">${x.ic} <b>${x.name}</b><br>${x.desc}
        ${mine && mine.id === x.id ? '<i>Bang của anh</i>' : `<button type="button" class="act" data-gact="join:${x.id}">${mine ? 'Chuyển bang 🪙500' : 'Gia nhập'}</button>`}</div>`
    ).join('');
  }
  function htmlBoss() {
    const b = (P.guild && P.guild.boss) || {};
    if ((b.phase || 1) > 3) return '<div class="card">Đã hạ đủ 3 phase hôm nay.</div>';
    return `<div class="card">Phase ${b.phase || 1}/3 · lượt ${b.attempts || 0}/2
      <button type="button" class="act" data-gact="boss">Đánh Hổ Trấn</button></div>`;
  }

  function openTile(id) {
    if (id === 'clan') { navTo('clan'); return; }
    if (id === 'tech') openSheet('Võ Đường', htmlTech());
    if (id === 'shop' || id === 'honor') openSheet('Bang Thương', htmlShop());
    if (id === 'boss') openSheet('Hổ Trấn', htmlBoss());
    if (id === 'campaign') openSheet('Chiến Dịch', htmlCamp());
    if (id === 'war') openSheet('Bang Chiến', htmlWar());
    if (id === 'mission') openSheet('Công Vụ', htmlMissions());
  }

  function handle(act) {
    const [k, v] = String(act).split(':');
    let ok = false;
    if (k === 'list') { openSheet('Danh sách bang', htmlList()); return; }
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
      if (k === 'tech') openSheet('Võ Đường', htmlTech());
      if (k === 'mission') openSheet('Công Vụ', htmlMissions());
      if (k === 'buy') openSheet('Bang Thương', htmlShop());
      if (k === 'camp') openSheet('Chiến Dịch', htmlCamp());
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
      if (id === 'log') openSheet('Nhật ký · Công Vụ', htmlMissions());
      if (id === 'manage') openSheet('Quản lý',
        `<button type="button" class="act" data-gact="donate">🪙300 → +30 điểm</button>
         <button type="button" class="act" data-gact="lock">Khóa đội phòng thủ</button>`);
      if (id === 'info') openSheet('Thông tin', htmlList());
      return;
    }
    const tile = ev.target.closest('[data-gtile]');
    if (tile) { openTile(tile.getAttribute('data-gtile')); return; }
    const act = ev.target.closest('[data-gact]');
    if (act) handle(act.getAttribute('data-gact'));
  });
  syncOpen(typeof ST === 'object' ? ST.screen : '');
})();
