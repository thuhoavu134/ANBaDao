(() => {
  if (typeof document === 'undefined' || !document.body) return;
  if (typeof prepareReleaseLantern !== 'function') return;

  function commitFest(next, commandId, source) {
    const run = typeof hvRunCommittedTransaction === 'function' ? hvRunCommittedTransaction : null;
    const apply = player => {
      if (next.hoadang) player.hoadang = next.hoadang;
      if (next.bachBao) player.bachBao = next.bachBao;
      if (next.gold != null) player.gold = next.gold;
      if (next.gems != null) player.gems = next.gems;
      if (next.so != null) player.so = next.so;
      if (next.stamina != null) player.stamina = next.stamina;
      if (next.tinh != null) player.tinh = next.tinh;
      if (next.hoat != null) player.hoat = next.hoat;
      if (next.shards) player.shards = next.shards;
      if (next.inventory) player.inventory = next.inventory;
      if (next.itemSeq != null) player.itemSeq = next.itemSeq;
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
      reason: 'festival',
      mutate: apply
    });
  }

  function fmt(n) {
    return Number(n || 0).toLocaleString('vi-VN');
  }

  function dayNow() {
    return typeof today === 'function' ? today() : 0;
  }

  function catalog() {
    return (typeof DATA === 'object' && DATA.heroes) ? DATA.heroes : {};
  }

  function rosterIds() {
    if (typeof OFFICIAL_ROSTER_12_IDS !== 'undefined' && Array.isArray(OFFICIAL_ROSTER_12_IDS)) {
      return OFFICIAL_ROSTER_12_IDS.slice();
    }
    return Object.keys(catalog());
  }

  function openArgs() {
    return {
      day: dayNow(),
      heroes: catalog(),
      rosterIds: rosterIds(),
      rng: Math.random.bind(Math),
      stamCap: DATA?.daily?.stamCap || FESTIVAL_STAM_CAP,
      stamina: P.stamina
    };
  }

  function adoptDay() {
    const opened = prepareFestivalDay(P, { day: dayNow() });
    if (opened.ok && opened.hoadang) {
      P.hoadang = opened.hoadang;
      if (opened.bachBao) P.bachBao = opened.bachBao;
      if (opened.refreshed) persist?.();
    }
    return P.hoadang;
  }

  function deliver(result) {
    (result.toasts || []).forEach(t => toast?.(t));
    if (result.toast && !(result.toasts || []).includes(result.toast)) toast?.(result.toast);
    (result.journals || []).forEach(line => addJournal?.(line));
  }

  function honVietTheme(id) {
    const result = prepareSetTheme(P, { id, day: dayNow() });
    if (!result.ok) {
      toast?.(result.message);
      return result;
    }
    if (commitFest(result, 'festival.theme:' + id + ':' + dayNow() + ':' + (P.revision || 0), 'festival.theme').ok) {
      renderFestival();
    }
    return result;
  }

  function honVietRelease() {
    if (typeof refreshStamina === 'function') refreshStamina();
    const result = prepareReleaseLantern(P, openArgs());
    if (!result.ok) {
      toast?.(result.message);
      return result;
    }
    if (commitFest(result, 'festival.lantern:' + dayNow() + ':' + (result.hoadang?.count || 0), 'festival.lantern').ok) {
      questProgress?.('hoadang', 1);
      refreshResbar?.();
      deliver(result);
      renderFestival();
      const lw = document.querySelector('[data-fest-wish]');
      if (lw) lw.textContent = result.themeName + ' · “' + result.wish + '”' + (result.setBonus || '');
    }
    return result;
  }

  function paintStep(idx, final) {
    const cells = document.querySelectorAll('#hvFestivalRoot .hv-fest-cell');
    const n = cells.length || BACH_BAO_SLOT_COUNT;
    cells.forEach((el, i) => {
      el.classList.remove('is-hot', 'is-trail', 'is-win');
      if (i === idx) el.classList.add('is-hot');
      else if (i === (idx - 1 + n) % n || i === (idx - 2 + n) % n) el.classList.add('is-trail');
    });
    if (final) cells[idx]?.classList.add('is-win');
  }

  function delayFor(step, total) {
    const p = step / Math.max(1, total - 1);
    if (p < .55) return 38;
    if (p < .78) return 65 + Math.round((p - .55) * 180);
    return 115 + Math.round(Math.pow((p - .78) / .22, 1.65) * 210);
  }

  async function honVietSpinAnimated() {
    if (ST && ST.bachBaoSpinning) return;
    if (typeof refreshStamina === 'function') refreshStamina();
    const result = prepareSpin(P, openArgs());
    if (!result.ok) {
      toast?.(result.message);
      return result;
    }
    if (!commitFest(result, 'festival.spin:' + (result.bachBao?.spins || 0), 'festival.spin').ok) return result;
    questProgress?.('spin', 1);
    refreshResbar?.();
    if (typeof ST === 'object') ST.bachBaoSpinning = true;
    const btn = document.querySelector('[data-fest-spin]');
    if (btn) {
      btn.classList.add('is-spinning');
      btn.textContent = 'Đang quay…';
    }
    const status = document.querySelector('[data-fest-status]');
    if (status) status.innerHTML = 'Ánh sáng đang chạy… <strong>đừng chớp mắt.</strong>';
    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const total = reduced ? 1 : (BACH_BAO_SLOT_COUNT * 2 + result.idx + 1);
    for (let k = 0; k < total; k++) {
      const idx = reduced ? result.idx : k % BACH_BAO_SLOT_COUNT;
      paintStep(idx, k === total - 1);
      if (!reduced) await new Promise(resolve => setTimeout(resolve, delayFor(k, total)));
    }
    if (status) status.innerHTML = 'Dừng tại <strong>' + (result.slot?.l || '') + '</strong> · ' + (result.msg || '');
    if (btn) {
      btn.classList.remove('is-spinning');
      btn.textContent = 'QUAY · 1🐚';
    }
    toast?.('🎡 ' + (result.msg || ''));
    if (typeof ST === 'object') ST.bachBaoSpinning = false;
    setTimeout(() => renderFestival(), 900);
    return result;
  }

  function honVietOpen(kind) {
    const result = prepareOpenChest(P, { ...openArgs(), kind });
    if (!result.ok) {
      toast?.(result.message);
      return result;
    }
    if (commitFest(result, 'festival.open:' + kind + ':' + (result.bachBao?.opened || 0), 'festival.open').ok) {
      refreshResbar?.();
      deliver(result);
      renderFestival();
      const el = document.querySelector('[data-fest-reveal]');
      if (el) {
        el.innerHTML = '<div class="hv-fest-reveal"><img src="assets/festival/' + (kind === 'supreme' ? 'chest-supreme.jpg' : 'chest-bau.jpg') + '" alt=""><strong>' + (kind === 'supreme' ? 'RƯƠNG CHÍ BẢO' : 'RƯƠNG BÁU') + ' ĐÃ MỞ</strong><span>' + (result.msg || '') + '</span></div>';
      }
    }
    return result;
  }

  function renderLacquer() {
    const screen = document.getElementById('festivalScreen');
    const body = document.getElementById('festivalBody');
    if (!body) return;
    screen?.classList.add('hv-fest-live');
    adoptDay();
    const hd = P.hoadang || emptyHoadang();
    const bb = P.bachBao || emptyBachBao();
    const theme = LANTERN_THEMES[hd.theme] || LANTERN_THEMES.ankhang;
    const lamps = Array.from({ length: HOADANG_PER_DAY }, (_, i) =>
      '<span class="hv-fest-lamp' + (i < hd.count ? ' is-on' : '') + '">🏮</span>'
    ).join('');
    const themeBtns = LANTERN_THEME_IDS.map(id => {
      const x = LANTERN_THEMES[id];
      return '<button type="button" class="hv-fest-theme' + (hd.theme === id ? ' is-on' : '') + '" data-fest-theme="' + id + '"><b>' + x.ic + ' ' + x.name + '</b><small>' + x.desc + '</small></button>';
    }).join('');
    const miles = FESTIVAL_MARKS.map(m => {
      const on = hd.marks >= m.n;
      const done = (hd.claimedMarks || []).includes(m.n);
      return '<span class="hv-fest-mile' + (on ? ' is-on' : '') + '">' + (done ? '✓ ' : '') + m.n + ' Ấn · ' + m.name + '</span>';
    }).join('');
    const recent = (hd.wishLog || []).slice(0, 3).map(x => {
      const th = LANTERN_THEMES[x.theme] || LANTERN_THEMES.ankhang;
      return '<div>• ' + th.ic + ' <b>' + th.name + '</b> — “' + (x.wish || '') + '”</div>';
    }).join('') || '<div>Chưa có điều ước nào được ghi.</div>';
    const cells = BACH_BAO_SLOTS.map((z, i) =>
      '<div class="hv-fest-cell' + (z.t === 'chest' ? ' is-chest' : '') + (z.t === 'supreme' ? ' is-supreme' : '') + '" data-fest-cell="' + i + '" style="--a:' + (i * 18) + 'deg;--counter:-' + (i * 18) + 'deg"><div class="hv-fest-cell-inner"><span class="ic">' + z.ic + '</span><b>' + z.l + '</b></div></div>'
    ).join('');
    const hist = (bb.history || []).slice(0, 4).map(x => '<div>• ' + (x.label || '') + '</div>').join('') || '<div>Chưa có lượt quay nào.</div>';
    const canLamp = hd.count < HOADANG_PER_DAY;
    const canSpin = (P.so || 0) >= 1;
    body.innerHTML = `
      <div id="hvFestivalRoot" data-testid="hv-festival">
        <div class="hv-fest-top">
          <button type="button" class="hv-fest-back" data-fest-back aria-label="Về Thành Chính">‹</button>
          <b>Lễ Hội</b>
          <div class="hv-fest-chips">
            <span class="hv-fest-chip" data-fest-so>🐚 ${fmt(P.so)}</span>
            <span class="hv-fest-chip" data-fest-gold>🪙 ${fmt(P.gold)}</span>
          </div>
        </div>
        <div class="hv-fest-hero">
          <div class="hv-fest-kicker">Hoa đăng · Bách Bảo Luân</div>
          <div class="hv-fest-title" data-fest-title>Tam Nguyện Sông Mơ</div>
          <div class="hv-fest-best">Đèn ${hd.count}/${HOADANG_PER_DAY} · Lễ Ấn ${fmt(hd.marks)}</div>
        </div>
        <div class="hv-fest-panel">
          <p class="hv-fest-copy">Mỗi đèn là một điều ước. Dùng đủ cả 3 hướng trong ngày nhận 1 Lễ Ấn.</p>
          <div class="hv-fest-lamps" data-fest-count>${lamps} <b>${hd.count}/${HOADANG_PER_DAY}</b> · Tam Nguyện <b>${(hd.themesUsed || []).length}/3</b></div>
          <div class="hv-fest-themes">${themeBtns}</div>
          <div class="hv-fest-current"><b>${theme.ic} ${theme.name}</b><small>${theme.desc}</small></div>
          <button type="button" class="hv-fest-go" data-fest-release ${canLamp ? '' : 'disabled'}>Thả hoa đăng ${theme.ic}</button>
          <span class="hv-fest-wish" data-fest-wish></span>
          <div class="hv-fest-miles">${miles}</div>
          <div class="hv-fest-log"><b>Sổ Nguyện</b>${recent}</div>
          <div class="hv-fest-wheel-shell">
            <div class="hv-fest-wheel-head">
              <h3>Bách Bảo Luân</h3>
              <div class="hv-fest-badges">
                <span>🎁 ${bb.chests}</span>
                <span>👑 ${bb.supreme}</span>
                <span>Đã quay ${bb.spins}</span>
              </div>
            </div>
            <div class="hv-fest-stage">
              <div class="hv-fest-marker"></div>
              <div class="hv-fest-wheel" id="bbwGrid">${cells}</div>
              <div class="hv-fest-hub">
                <img src="assets/festival/chest-bau.jpg" alt="">
                <b>RƯƠNG BÁU</b>
              </div>
            </div>
            <div class="hv-fest-center">
              <div class="hv-fest-status" data-fest-status>Mục tiêu lớn: <strong>mảnh tướng SS/SSR</strong> · trang bị SSR · hai loại rương.</div>
              <button type="button" class="hv-fest-spin" data-fest-spin ${canSpin ? '' : 'disabled'}>QUAY · 1🐚</button>
            </div>
            <div class="hv-fest-chests">
              <div class="hv-fest-chest">
                <img src="assets/festival/chest-bau.jpg" alt="">
                <div><b>Rương Báu ×${bb.chests}</b><p>35% 30 SS · 33% 20 SSR · 22% SSR+5 · 10% 💎120</p></div>
                <button type="button" class="hv-fest-open" data-fest-open ${bb.chests < 1 ? 'disabled' : ''}>Mở rương</button>
              </div>
              <div class="hv-fest-chest">
                <img src="assets/festival/chest-supreme.jpg" alt="">
                <div><b>Rương Chí Bảo ×${bb.supreme}</b><p>45% 40 SSR · 40% SSR+10 · 15% 60 SSR</p></div>
                <button type="button" class="hv-fest-open" data-fest-open-supreme ${bb.supreme < 1 ? 'disabled' : ''}>Mở Chí Bảo</button>
              </div>
            </div>
            <div data-fest-reveal></div>
            <div class="hv-fest-hist"><b>Dấu vết</b>${hist}</div>
          </div>
        </div>
      </div>`;
    body.querySelector('[data-fest-back]')?.addEventListener('click', () => navTo?.('hub'));
    body.querySelectorAll('[data-fest-theme]').forEach(btn => {
      btn.addEventListener('click', () => honVietTheme(btn.dataset.festTheme));
    });
    body.querySelector('[data-fest-release]')?.addEventListener('click', () => honVietRelease());
    body.querySelector('[data-fest-spin]')?.addEventListener('click', () => honVietSpinAnimated());
    body.querySelector('[data-fest-open]')?.addEventListener('click', () => honVietOpen('normal'));
    body.querySelector('[data-fest-open-supreme]')?.addEventListener('click', () => honVietOpen('supreme'));
  }

  const baseEnsure = typeof ensureHoadang === 'function' ? ensureHoadang : null;
  ensureHoadang = function honVietEnsureHoadang() {
    adoptDay();
    if (!P.hoadang && baseEnsure) return baseEnsure();
  };

  const baseRender = typeof renderFestival === 'function' ? renderFestival : null;
  renderFestival = function honVietRenderFestival() {
    if (typeof refreshStamina === 'function') refreshStamina();
    renderLacquer();
    if (!document.getElementById('hvFestivalRoot') && baseRender) baseRender();
  };

  const baseTheme = typeof setLanternTheme === 'function' ? setLanternTheme : null;
  setLanternTheme = function honVietSetLanternTheme(id) {
    const result = honVietTheme(id);
    if (!result.ok && baseTheme) return baseTheme(id);
    return result;
  };

  const baseRelease = typeof releaseLantern === 'function' ? releaseLantern : null;
  releaseLantern = function honVietReleaseLantern() {
    const result = honVietRelease();
    if (!result.ok && result.code !== 'HOADANG_CAP' && result.code !== 'INSUFFICIENT_GOLD' && baseRelease) {
      return baseRelease();
    }
    return result;
  };

  const baseSpin = typeof spinBachBaoCore === 'function' ? spinBachBaoCore : null;
  spinBachBaoCore = function honVietSpinCore() {
    if (typeof refreshStamina === 'function') refreshStamina();
    const result = prepareSpin(P, openArgs());
    if (!result.ok) return { ok: false, msg: result.message };
    if (!commitFest(result, 'festival.spin:' + (result.bachBao?.spins || 0), 'festival.spin').ok) {
      return { ok: false, msg: result.message };
    }
    questProgress?.('spin', 1);
    refreshResbar?.();
    return { ok: true, idx: result.idx, msg: result.msg, z: result.slot };
  };

  const baseAnim = typeof spinBachBaoAnimated === 'function' ? spinBachBaoAnimated : null;
  spinBachBaoAnimated = function honVietSpinBachBaoAnimated() {
    return honVietSpinAnimated();
  };

  const baseOpen = typeof openBachBaoChest === 'function' ? openBachBaoChest : null;
  openBachBaoChest = function honVietOpenBachBaoChest(kind) {
    const result = honVietOpen(kind);
    if (!result.ok && baseOpen) return baseOpen(kind);
    return result.ok ? { msg: result.msg, ic: result.ic, kind: result.kind } : null;
  };

  window.HonVietFestival = {
    render: renderFestival,
    theme: honVietTheme,
    release: honVietRelease,
    spin: honVietSpinAnimated,
    open: honVietOpen
  };

  // Hoa đăng là sự kiện đêm đầu — mở từ Thành Chính như Chợ, không chờ Chương 1.
  if (typeof JOURNEY_UNLOCK === 'object' && JOURNEY_UNLOCK.festival) {
    JOURNEY_UNLOCK.festival.ch = 0;
  }
  document.querySelectorAll('.art-label-action[aria-label="Sự kiện"], .ebtn[data-go="festival"]').forEach(el => {
    el.classList.remove('is-locked', 'locked');
  });
  if (typeof ST === 'object' && ST.screen === 'hub' && typeof renderHub === 'function') {
    renderHub();
  }
})();
