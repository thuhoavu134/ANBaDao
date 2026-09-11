(() => {
  if (typeof document === 'undefined' || !document.body) return;
  if (typeof prepareArenaSettle !== 'function') return;

  function commitArena(next, commandId, source) {
    const run = typeof hvRunCommittedTransaction === 'function' ? hvRunCommittedTransaction : null;
    const apply = player => {
      if (next.arena) player.arena = next.arena;
      if (next.arenaPvE) player.arenaPvE = next.arenaPvE;
      if (next.season) player.season = next.season;
      if (next.gold != null) player.gold = next.gold;
      if (next.gems != null) player.gems = next.gems;
      if (next.so != null) player.so = next.so;
      if (next.shards) player.shards = next.shards;
      return { ok: true };
    };
    if (!run) {
      apply(P);
      persist?.();
      return { ok: true };
    }
    return run({
      commandId: commandId || (source + ':' + (P.revision || 0)),
      source,
      reason: 'arena',
      mutate: apply
    });
  }

  function fmt(n) {
    return Number(n || 0).toLocaleString('vi-VN');
  }

  function dayNow() {
    return typeof today === 'function' ? today() : 0;
  }

  function cost() {
    return (typeof ARENA === 'object' && ARENA.cost) || ARENA_COST;
  }

  function heroName(id) {
    return DATA?.heroes?.[id]?.name || id || '?';
  }

  function heroCol(id) {
    return DATA?.heroes?.[id]?.col || '#8d672e';
  }

  function deliver(result) {
    (result.toasts || []).forEach(t => toast?.(t));
    if (result.toast) toast?.(result.toast);
    (result.mails || []).forEach(m => sendMail?.(m.from || 'Đấu Trường Mộng', m.title, m.body, { gold: m.gold || 0 }));
  }

  function currentTab() {
    return (typeof ST === 'object' && ST.arenaTab) || 'season';
  }

  function setTab(tab) {
    if (typeof ST === 'object') ST.arenaTab = tab;
    renderArena();
  }

  function ensureRivals() {
    if (P.arena?.rivals?.length) return;
    if (typeof genRivals === 'function') genRivals();
    else if (typeof genRivalsLocal === 'function') genRivalsLocal();
  }

  function paintSeason(root) {
    const day = dayNow();
    const idx = seasonIndex(day);
    if (typeof ensureSeason === 'function') ensureSeason();
    const season = typeof normalizeSeason === 'function' ? normalizeSeason(P.season, idx) : (P.season || emptySeason(idx));
    const rule = typeof currentSeasonRule === 'function'
      ? (currentSeasonRule.length ? currentSeasonRule(day) : currentSeasonRule())
      : SEASON_RULES[0];
    const tier = seasonTier(season.lp || 0);
    const remain = SEASON_LEN - seasonDay(day);
    const pve = typeof seasonPveScore === 'function'
      ? seasonPveScore({ towerBest: P.tower?.best, rogueBest: P.rogue?.best, challengeStars: P.challenge?.stars })
      : 0;
    const rivals = P.arena?.rivals || [];
    const miles = SEASON_LP_KEYS.map(m => {
      const ready = season.lp >= m && !(season.claimed || []).includes(m);
      const done = (season.claimed || []).includes(m);
      return `<button type="button" class="hv-ar-mile${ready ? ' is-ready' : ''}" data-arena-lp="${m}" ${ready ? '' : 'disabled'}>${done ? '✓ ' : ''}${m}</button>`;
    }).join('');
    const def = (season.defense || []).map(x => heroName(x.id)).filter(Boolean).join(' · ') || 'Chưa lưu';
    const cards = rivals.map((r, i) => {
      const ids = (r.team || []).map(x => typeof x === 'string' ? x : x.id).filter(id => DATA?.heroes?.[id]);
      const bans = ids.map(id => `<button type="button" class="hv-ar-mile" data-arena-ban="${id}" data-i="${i}">🚫 ${heroName(id)}</button>`).join('');
      const pw = rivalPower(r.rank);
      return `<article class="hv-ar-card" data-arena-rival="${i}">
        <b>${r.name}</b>
        <small>Hạng nền ${r.rank} · Cấp ${pw.lvl} · ${'★'.repeat(pw.stars)}</small>
        <div class="hv-ar-bans">${bans || 'Chưa có đội'}</div>
      </article>`;
    }).join('');
    root.innerHTML = `
      <p class="hv-ar-copy">${tier.ic} Mùa ${(season.index || 0) + 1} · ${tier.name} · <b data-arena-lp-now>${fmt(season.lp)}</b> LP · còn ${remain} ngày · PvE ${fmt(pve)}</p>
      <div class="hv-ar-rule"><b>${rule.ic} Luật tuần: ${rule.name}</b><small>${rule.desc}</small></div>
      <div class="hv-ar-miles" data-arena-miles>${miles}</div>
      <div class="hv-ar-card"><b>🛡 Đội phòng thủ</b><small data-arena-defense>${def}</small>
        <button type="button" class="hv-ar-fight is-ghost" data-arena-defense-save>Lưu đội hiện tại</button></div>
      <div class="hv-ar-list" data-arena-season-list>${cards}</div>`;
    root.querySelectorAll('[data-arena-lp]').forEach(btn => {
      btn.addEventListener('click', () => honVietSeasonClaim(Number(btn.dataset.arenaLp)));
    });
    root.querySelector('[data-arena-defense-save]')?.addEventListener('click', honVietSeasonDefense);
    root.querySelectorAll('[data-arena-ban]').forEach(btn => {
      btn.addEventListener('click', () => seasonDraftStart(+btn.dataset.i, btn.dataset.arenaBan));
    });
  }

  function paintPvp(root) {
    const rivalry = typeof normalizeRivalry === 'function'
      ? normalizeRivalry(P.arena?.rivalry, dayNow())
      : (P.arena?.rivalry || emptyRivalry());
    const rivals = P.arena?.rivals || [];
    const deeds = [
      ['first', '⚔️', 'Khai Trận Thắng', 1],
      ['leap', '🚀', 'Bứt Hạng', 2],
      ['revenge', '🔥', 'Phục Hận', 2]
    ].map(([id, ic, name, marks]) => {
      const done = (rivalry.deeds || []).includes(id);
      return `<span class="hv-ar-mile">${done ? '✓ ' : ''}${ic} ${name} +${marks}</span>`;
    }).join('');
    const cards = rivals.map((r, i) => {
      const pw = rivalPower(r.rank);
      const key = arenaRivalKey(r);
      const grudge = !!(rivalry.grudges && rivalry.grudges[key]);
      return `<article class="hv-ar-card" data-arena-card="${i}">
        <b>${r.name}${grudge ? ' · 🔥 Kình Địch' : ''}</b>
        <small>Hạng ${r.rank} · Cấp ${pw.lvl} · ${'★'.repeat(pw.stars)}</small>
        <button type="button" class="hv-ar-fight" data-arena-fight="${i}">Khiêu chiến — ${cost()}⚡</button>
      </article>`;
    }).join('');
    root.innerHTML = `
      <p class="hv-ar-copy">Thắng ai, chiếm hạng người đó. Thua không tụt hạng. Hạng <b data-arena-rank>${fmt(P.arena?.rank || 1000)}</b> · cao nhất ${fmt(P.arena?.best || 1000)} · Vinh Ấn ${fmt(rivalry.marks || 0)}</p>
      <div class="hv-ar-deeds">${deeds}</div>
      <button type="button" class="hv-ar-btn" data-arena-refresh>Đổi đối thủ</button>
      <div class="hv-ar-list" data-arena-pvp-list>${cards}</div>`;
    root.querySelectorAll('[data-arena-fight]').forEach(btn => {
      btn.addEventListener('click', () => startArena(+btn.dataset.arenaFight));
    });
    root.querySelector('[data-arena-refresh]')?.addEventListener('click', () => {
      genRivals?.();
      renderArena();
    });
  }

  function paintPve(root) {
    const pve = typeof normalizeArenaPvE === 'function' ? normalizeArenaPvE(P.arenaPvE) : (P.arenaPvE || emptyArenaPvE());
    const rows = PVE_STAGES.map(st => {
      const cl = (pve.cleared || []).includes(st.i);
      const open = st.i <= pve.stage;
      const rw = (st.reward.gems ? ('💎' + st.reward.gems) : '') + (st.reward.shards ? (' + ' + st.reward.shards + ' mảnh') : '');
      const btn = cl
        ? `<button type="button" class="hv-ar-fight is-ghost" data-arena-pve="${st.i}">Đánh lại ${cost()}⚡</button>`
        : open
          ? `<button type="button" class="hv-ar-fight" data-arena-pve="${st.i}">Thách đấu ${cost()}⚡</button>`
          : '<small>KHOÁ</small>';
      return `<article class="hv-ar-stage" data-arena-stage="${st.i}">
        <span class="num">${st.i}</span>
        <div><b>${st.name}${cl ? ' · đã qua' : ''}</b><small>${st.desc} · Lv ${st.lvl} · Lần đầu: ${rw}</small></div>
        ${btn}
      </article>`;
    }).join('');
    root.innerHTML = `<p class="hv-ar-copy">Võ Đài Thí Luyện · điểm cộng PvE Score Mùa. Phần thưởng lần đầu giữ nguyên.</p>
      <div class="hv-ar-list" data-arena-pve-list>${rows}</div>`;
    root.querySelectorAll('[data-arena-pve]').forEach(btn => {
      btn.addEventListener('click', () => startArenaPvE(+btn.dataset.arenaPve));
    });
  }

  function renderLacquer() {
    const screen = document.getElementById('arenaScreen');
    const body = document.getElementById('arenaBody');
    if (!body) return;
    screen?.classList.add('hv-arena-live');
    ensureRivals();
    const tab = currentTab();
    const lp = P.season?.lp || 0;
    body.innerHTML = `
      <div id="hvArenaRoot" data-testid="hv-arena">
        <div class="hv-ar-top">
          <button type="button" class="hv-ar-back" data-arena-back aria-label="Về Thành Chính">‹</button>
          <b>Đấu Trường</b>
          <div class="hv-ar-chips">
            <span class="hv-ar-chip" data-arena-rank-chip>🏟 ${fmt(P.arena?.rank || 1000)}</span>
            <span class="hv-ar-chip" data-arena-lp-chip>LP ${fmt(lp)}</span>
          </div>
        </div>
        <div class="hv-ar-hero">
          <div class="hv-ar-kicker">Võ đài đêm · thắng ai chiếm hạng</div>
          <div class="hv-ar-title" data-arena-title>Võ Đài Kẻ Mất Ngủ</div>
          <div class="hv-ar-best">3 nhánh · 5⚡ / trận · không tụt hạng khi thua</div>
        </div>
        <div class="hv-ar-panel">
          <div class="hv-ar-tabs">
            <button type="button" class="hv-ar-tab${tab === 'season' ? ' is-on' : ''}" data-arena-tab="season">🌙 Mùa</button>
            <button type="button" class="hv-ar-tab${tab === 'pvp' ? ' is-on' : ''}" data-arena-tab="pvp">⚔ Đấu Hạng</button>
            <button type="button" class="hv-ar-tab${tab === 'pve' ? ' is-on' : ''}" data-arena-tab="pve">🛡 Võ Đài</button>
          </div>
          <div data-arena-pane></div>
        </div>
      </div>`;
    body.querySelector('[data-arena-back]')?.addEventListener('click', () => navTo('hub'));
    body.querySelectorAll('[data-arena-tab]').forEach(btn => {
      btn.addEventListener('click', () => setTab(btn.dataset.arenaTab));
    });
    const pane = body.querySelector('[data-arena-pane]');
    if (tab === 'pvp') paintPvp(pane);
    else if (tab === 'pve') paintPve(pane);
    else paintSeason(pane);
  }

  function honVietSeasonClaim(lp) {
    const result = prepareSeasonClaim(P, lp, { day: dayNow() });
    if (!result.ok) {
      toast?.(result.message);
      return;
    }
    if (commitArena(result, 'arena.season.claim:' + lp, 'arena.season.claim').ok) {
      deliver(result);
      refreshResbar?.();
      renderArena();
    }
  }

  function honVietSeasonDefense() {
    const squad = (P.squad || []).map(x => ({
      id: x.id,
      row: x.row,
      build: (P.heroBuilds && P.heroBuilds[x.id]) || 'balanced'
    }));
    const result = prepareSeasonDefense(P, squad, { day: dayNow() });
    if (!result.ok) return;
    if (commitArena(result, 'arena.season.defense', 'arena.season.defense').ok) {
      deliver(result);
      renderArena();
    }
  }

  const baseEnsure = typeof ensureSeason === 'function' ? ensureSeason : null;
  ensureSeason = function honVietEnsureSeason() {
    const idx = seasonIndex(dayNow());
    const next = normalizeSeason(P.season, idx);
    if (!next.defense.length && (P.squad || []).length) {
      next.defense = (P.squad || []).map(x => ({
        id: x.id,
        row: x.row,
        build: (P.heroBuilds && P.heroBuilds[x.id]) || 'balanced'
      }));
    }
    const rolled = !P.season || P.season.index !== next.index;
    P.season = next;
    if (rolled) persist?.();
    return P.season;
  };

  const baseRender = typeof renderArena === 'function' ? renderArena : null;
  renderArena = function honVietRenderArena() {
    if (typeof refreshStamina === 'function') refreshStamina();
    renderLacquer();
    if (!document.getElementById('hvArenaRoot') && baseRender) baseRender();
  };

  const baseSettle = typeof arenaSettle === 'function' ? arenaSettle : null;
  arenaSettle = function honVietArenaSettle(win) {
    const r = typeof ST === 'object' ? ST.rival : null;
    if (r?.net) return baseSettle ? baseSettle(win) : null;
    const result = prepareArenaSettle(P, { win, rival: r, day: dayNow() });
    if (!result.ok) return baseSettle ? baseSettle(win) : null;
    if (commitArena(result, 'arena.pvp:' + (r?.rank || 0) + ':' + (P.arena?.rank || 0), 'arena.pvp').ok) {
      deliver(result);
      if (typeof ST === 'object') ST.rival = null;
      if (result.refreshRivals) genRivals?.();
      persist?.();
    }
  };

  const baseSeasonSettle = typeof seasonSettle === 'function' ? seasonSettle : null;
  seasonSettle = function honVietSeasonSettle(win, r) {
    const squadIds = (P.squad || []).map(x => x.id);
    const result = prepareSeasonSettle(P, { win, rival: r, squadIds, day: dayNow() });
    if (!result.ok) return baseSeasonSettle ? baseSeasonSettle(win, r) : null;
    if (commitArena(result, 'arena.season:' + (P.season?.lp || 0), 'arena.season').ok) {
      deliver(result);
      if (typeof ST === 'object') {
        ST.seasonMatch = false;
        ST.seasonEnemyBan = null;
        ST.seasonPlayerBan = null;
        ST.seasonRival = null;
        ST.rival = null;
      }
      persist?.();
    }
  };

  const baseClaim = typeof seasonClaimMilestone === 'function' ? seasonClaimMilestone : null;
  seasonClaimMilestone = function honVietSeasonClaimMilestone(lp) {
    honVietSeasonClaim(lp);
    if (!document.getElementById('hvArenaRoot') && baseClaim) return baseClaim(lp);
  };

  const baseDef = typeof saveSeasonDefense === 'function' ? saveSeasonDefense : null;
  saveSeasonDefense = function honVietSaveSeasonDefense() {
    honVietSeasonDefense();
    if (!document.getElementById('hvArenaRoot') && baseDef) return baseDef();
  };

  const basePve = typeof pveSettle === 'function' ? pveSettle : null;
  pveSettle = function honVietPveSettle(win, st) {
    const result = preparePveSettle(P, { win, stage: st });
    if (!result.ok) {
      toast?.(result.message);
      return;
    }
    if (commitArena(result, 'arena.pve:' + (st?.i || 0) + ':' + (result.first ? 'first' : 'rematch'), 'arena.pve').ok) {
      deliver(result);
      refreshResbar?.();
      persist?.();
    } else if (basePve) {
      return basePve(win, st);
    }
  };

  const baseRivals = typeof genRivalsLocal === 'function' ? genRivalsLocal : null;
  genRivalsLocal = function honVietGenRivalsLocal() {
    const names = ((typeof ARENA === 'object' && ARENA.names) || ARENA_NAMES).slice().sort(() => Math.random() - 0.5);
    const ids = Object.keys((typeof DATA === 'object' && DATA.heroes) || {});
    const teams = [0, 1, 2].map(() => ids.slice().sort(() => Math.random() - 0.5).slice(0, 6));
    const result = prepareRivalsLocal(P, { names, teams });
    if (result.ok) commitArena(result, 'arena.rivals:' + (P.arena?.rank || 0), 'arena.rivals');
    else if (baseRivals) return baseRivals();
  };

  window.HonVietArena = {
    render: renderArena,
    settle: (win, rival) => prepareArenaSettle(P, { win, rival, day: dayNow() }),
    applyWin(rival) {
      const result = prepareArenaSettle(P, { win: true, rival, day: dayNow() });
      if (result.ok && commitArena(result, 'arena.pvp.qa:' + (rival?.rank || 0), 'arena.pvp').ok) {
        deliver(result);
        if (result.refreshRivals) genRivals?.();
      }
      return result;
    },
    claim: honVietSeasonClaim
  };
})();
