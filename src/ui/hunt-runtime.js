(() => {
  if (typeof document === 'undefined' || !document.body) return;
  if (typeof prepareHuntSettle !== 'function') return;

  function commitHunt(next, commandId, source) {
    const run = typeof hvRunCommittedTransaction === 'function' ? hvRunCommittedTransaction : null;
    const apply = player => {
      if (next.hunt) player.hunt = next.hunt;
      if (next.gold != null) player.gold = next.gold;
      if (next.gems != null) player.gems = next.gems;
      if (next.so != null) player.so = next.so;
      if (next.stamina != null) player.stamina = next.stamina;
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
      reason: 'hunt',
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
    return (typeof HUNT === 'object' && HUNT.cost) || HUNT_COST;
  }

  function heroName(id) {
    return DATA?.heroes?.[id]?.name || id || 'Kẻ Mất Ngủ';
  }

  function adoptDay() {
    const opened = prepareHuntDay(P, { day: dayNow() });
    if (opened.ok && opened.hunt) {
      P.hunt = opened.hunt;
      if (opened.refreshed) persist?.();
    }
    return P.hunt;
  }

  function deliver(result) {
    (result.toasts || []).forEach(t => toast?.(t));
    if (result.toast && !(result.toasts || []).includes(result.toast)) toast?.(result.toast);
    (result.mails || []).forEach(m => sendMail?.(m.from || 'Đội Săn Boss', m.title, m.body, { gold: m.gold || 0 }));
    (result.journals || []).forEach(line => addJournal?.(line));
    if (result.chat) chatSys?.(result.chat);
  }

  function battleSnapshot() {
    const foes = (typeof S === 'object' && Array.isArray(S.foes)) ? S.foes : [];
    const boss = foes.find(f => f.id === 'huntboss');
    if (!boss) return null;
    return {
      dmg: Math.max(0, (boss.hpMax || 0) - Math.max(0, boss.hp || 0)),
      killed: (boss.hp || 0) <= 0,
      addsDown: ['add1', 'add2'].every(id => {
        const x = foes.find(f => f.id === id);
        return !!x && x.hp <= 0;
      }),
      hpMax: boss.hpMax || 0
    };
  }

  function honVietSelect(id) {
    const result = prepareSelectContract(P, { id, day: dayNow() });
    if (!result.ok) {
      toast?.(result.message);
      return result;
    }
    if (commitHunt(result, 'hunt.contract:' + id + ':' + dayNow(), 'hunt.contract').ok) {
      renderHunt();
    }
    return result;
  }

  function honVietStart() {
    if (typeof refreshStamina === 'function') refreshStamina();
    const result = prepareHuntStart(P, {
      day: dayNow(),
      stamina: P.stamina,
      chapters: P.clearedChapters
    });
    if (!result.ok) {
      toast?.(result.message);
      return result;
    }
    if (!commitHunt(result, 'hunt.start:' + dayNow() + ':' + (P.hunt?.attempts || 0), 'hunt.start').ok) {
      return result;
    }
    questProgress?.('hunt', 1);
    refreshResbar?.();
    if (typeof DATA === 'object') DATA.encounters.__hunt = result.encounter;
    if (typeof ST === 'object') {
      ST.mode = 'hunt';
      ST.huntTurns = 0;
    }
    try { if (typeof bgmPlayer !== 'undefined' && bgmPlayer) bgmPlayer.pause(); window.HonVietAudio?.stopMusic?.(); } catch {}
    runBattle?.('__hunt', () => {
      huntSettle();
      if (typeof ST === 'object') ST.mode = null;
      navTo?.('hunt');
    });
    return result;
  }

  function honVietSettle(snap) {
    const shot = snap || battleSnapshot();
    if (!shot) return { ok: false, code: 'MISSING_SNAPSHOT' };
    const result = prepareHuntSettle(P, {
      day: dayNow(),
      dmg: shot.dmg,
      killed: shot.killed,
      addsDown: shot.addsDown,
      hpMax: shot.hpMax,
      chapters: P.clearedChapters
    });
    if (!result.ok) return result;
    // Owner 2026-10-25: hạ boss săn thì rơi 1 món trang bị (bảng riêng, tỉ lệ cao hơn phó bản).
    try {
      if (shot.killed && typeof rollHuntDrop === 'function' && typeof buildDropItem === 'function') {
        const day = dayNow();
        const bossId = todayBoss(day).id;
        P.gearPity = P.gearPity || {}; P.gearDay = P.gearDay || {};
        const key = bossId + ':' + day;
        const hits = Number(P.gearDay[key]) || 0;
        const roll = rollHuntDrop({ bossId, firstOfDay: hits === 0, pity: Number(P.gearPity.hunt) || 0, overCap: hits >= 1, rng: Math.random });
        P.gearPity.hunt = roll.pity;
        P.gearDay[key] = hits + 1;
        const slot = ['weapon', 'armor', 'charm', 'boots'][Math.floor(Math.random() * 4)];
        const item = buildDropItem({ uid: (Number(P.itemSeq) || 0) + 1, slot, rar: roll.rar, source: 'boss',
          rollAffixes: typeof rollAffixes === 'function' ? rollAffixes : null });
        if (item) { P.itemSeq = item.uid; P.inventory = P.inventory || []; P.inventory.push(item); result.gearDrop = item; }
      }
    } catch (_) {}
    if (result.gearDrop && typeof itemName === 'function') {
      result.toasts = result.toasts || [];
      result.toasts.push('🎁 Rơi trang bị: ' + itemName(result.gearDrop) + ' (' + String(result.gearDrop.rar).toUpperCase() + ')');
      // Owner 2026-11-04: do hiem tu boss -> chu chay + loa he thong
      try {
        const rr = String(result.gearDrop.rar || '').toLowerCase();
        if (rr === 'ss' || rr === 'ssr') {
          const bz = typeof todayBoss === 'function' ? todayBoss(dayNow()) : null;
          window.HV_MARQUEE?.announce('boss_drop', { item: itemName(result.gearDrop), boss: (bz && (bz.name || bz.title)) || 'Boss Săn', rarity: rr === 'ssr' ? 'legend' : 'epic' });
        }
      } catch (_) {}
    }
    if (commitHunt(result, 'hunt.settle:' + dayNow() + ':' + (shot.dmg || 0), 'hunt.settle').ok) {
      deliver(result);
      refreshResbar?.();
    }
    return result;
  }

  // Trạng thái sheet phải sống ngoài lần render: renderLacquer() bị gọi lại
  // (refreshStamina, chọn khế, đổi ngày...) nên nếu để trong closure thì sheet tự đóng.
  let hvhSheetOpen = false;

  function renderLacquer() {
    if (typeof document === 'undefined' || !document.body) return;
    // Lớp hunt-3d-runtime hoist #hvHuntRoot lên <body>. Vì mỗi lần render tạo root
    // mới trong #huntBody nên bản cũ bị bỏ lại trên body -> mỗi thao tác +1 bản sao.
    // Dọn sạch trước khi vẽ; lớp 3d sẽ hoist bản mới lên.
    document.querySelectorAll('#hvHuntRoot').forEach(el => el.remove());
    const screen = document.getElementById('huntScreen');
    const body = document.getElementById('huntBody');
    if (!body) return;
    screen?.classList.add('hv-hunt-live');
    adoptDay();
    const day = dayNow();
    const bz = todayBoss(day);
    const hunt = P.hunt || emptyHunt();
    const attempts = hunt.attempts ?? HUNT_ATTEMPTS_PER_DAY;
    const perDay = HUNT_ATTEMPTS_PER_DAY;
    const locked = attempts < perDay;
    const marks = huntMarkCount(hunt, bz.id);
    const best = Number((hunt.best && hunt.best[bz.id]) || 0);
    const hp = huntBossHp(P.clearedChapters);
    const dropName = heroName(bz.drop);
    const KH_NAMES = { break_core: 'Phá Lõi', clean_field: 'Quét Tinh', finisher: 'Đoạt Mệnh' };
    const contracts = HUNT_CONTRACT_IDS.map((id, i) => {
      const c = HUNT_CONTRACTS[id];
      const on = hunt.contract === id;
      const block = locked && !on;
      const shortKhe = KH_NAMES[id] || c.name;
      return `<button type="button" class="hvh-khe-btn hvh-k${i + 1}${on ? ' is-on' : ''}" data-hunt-contract="${id}" ${block ? 'disabled' : ''} aria-pressed="${on ? 'true' : 'false'}">
        <b>${shortKhe}</b>
        <small>+${c.marks} ấn</small>
        <em>${on ? 'Đang chọn' : 'Chọn khế'}</em>
      </button>`;
    }).join('');
    const contractsFull = HUNT_CONTRACT_IDS.map(id => {
      const c = HUNT_CONTRACTS[id];
      const on = hunt.contract === id;
      const block = locked && !on;
      return `<article class="hv-hunt-card${on ? ' is-on' : ''}">
        <b>${c.name} · +${c.marks} ấn</b>
        <small>${c.desc}</small>
        <span>${c.reward}</span>
        <button type="button" data-hunt-contract="${id}" ${block ? 'disabled' : ''}>${on ? 'Đang chọn khế này' : 'Chọn khế này'}</button>
      </article>`;
    }).join('');
    const miles = HUNT_MARK_KEYS.map(k => {
      const r = HUNT_MARK_MILESTONES[k];
      const on = marks >= k;
      return `<span class="hvh-mile${on ? ' is-on' : ''}" data-hunt-mile="${k}"><em>${k} ấn</em> ${r.label}${on ? ' · đã đạt' : ''}</span>`;
    }).join('');
    const canGo = attempts > 0 && !!hunt.contract;
    // Mẫu 3 (owner chốt 09/11): nút, khung, icon VẼ SẴN trong ảnh gpt_image
    // (assets/ui/hunt/hunt-full.webp, 941x1672). Ở đây chỉ đặt chữ + vùng bấm
    // trong suốt lên đúng toạ độ đo trên ảnh — giống Hành Tẩu.
    body.innerHTML = `
      <div id="hvHuntRoot" data-testid="hv-hunt" data-hunt-boss-id="${bz.id}">
        <div class="hvh-bg" aria-hidden="true"></div>
        <div class="hvh-stage">
          <button type="button" class="hvh-back" data-hunt-back aria-label="Về Thành Chính"></button>
          <span class="hvh-plaque">Săn Boss</span>
          <span class="hvh-chip-gold"><b data-hunt-gold>${fmt(P.gold)}</b></span>

          <section class="hvh-boss">
            <div class="hvh-bossname" data-hunt-boss>${bz.name}</div>
            <div class="hvh-kicker"><span data-hunt-title>Sổ Săn Đêm</span> · ${perDay} lượt/ngày</div>
          </section>

          <div class="hvh-stat hvh-s1"><span>Kỷ lục</span><b data-hunt-best>${fmt(best)}</b></div>
          <div class="hvh-stat hvh-s2"><span>Săn Ấn</span><b data-hunt-marks>${fmt(marks)}</b></div>
          <div class="hvh-stat hvh-s3"><span>Lượt săn</span><b data-hunt-attempts>${attempts}/${perDay}</b></div>

          <div class="hvh-khe" data-hunt-contracts>${contracts}</div>

          <button type="button" class="hvh-info" data-hunt-open-sheet aria-label="Sổ: khế săn và mốc ấn"></button>
          <button type="button" class="hvh-go" data-hunt-go ${canGo ? '' : 'disabled'}>
            <span>${canGo ? 'Vào săn · ' + cost() + ' nộ' : 'Chọn khế để săn'}</span>
          </button>
        </div>

        <div class="hvh-sheet" data-hunt-sheet${hvhSheetOpen ? '' : ' hidden'}>
          <div class="hvh-sheet-panel">
            <button type="button" class="hvh-sheet-x" data-hunt-sheet-x aria-label="Đóng"></button>
            <h2>Khế săn &amp; mốc ấn</h2>
            <p class="hvh-desc">${bz.desc}<br>
              Máu <b data-hunt-hp>${fmt(hp)}</b> · giới hạn ${HUNT_TURN_LIMIT} lượt — gây bao nhiêu tính bấy nhiêu.<br>
              Vàng theo sát thương · mỗi 6000 ST = 1 mảnh <b>${dropName}</b> · hạ gục +40 ngọc.
              ${hunt.contractDone ? '<br><b>Khế hôm nay đã xong.</b>' : ''}
            </p>
            <span class="hvh-sub">Mốc săn ấn</span>
            <div class="hvh-miles" data-hunt-miles>${miles}</div>
            <span class="hvh-sub">Khế săn</span>
            <div class="hvh-khe-full">${contractsFull}</div>
          </div>
        </div>
      </div>`;
    const root = body.querySelector('#hvHuntRoot');
    const sheet = root?.querySelector('[data-hunt-sheet]');
    const setSheet = open => { hvhSheetOpen = !!open; if (sheet) sheet.hidden = !hvhSheetOpen; };
    body.querySelector('[data-hunt-back]')?.addEventListener('click', () => navTo?.('hub'));
    body.querySelector('[data-hunt-open-sheet]')?.addEventListener('click', () => setSheet(true));
    body.querySelector('[data-hunt-sheet-x]')?.addEventListener('click', () => setSheet(false));
    sheet?.addEventListener('click', ev => { if (ev.target === sheet) setSheet(false); });
    body.querySelectorAll('[data-hunt-contract]').forEach(btn => {
      btn.addEventListener('click', () => {
        honVietSelect(btn.dataset.huntContract);
        setSheet(false);
        // Phải gọi renderHunt() (không phải renderLacquer) để lớp hunt-3d hoist root
        // lên <body>; gọi thẳng renderLacquer sẽ để root nằm trong #huntBody cao 0px.
        renderHunt();
      });
    });
    body.querySelector('[data-hunt-go]')?.addEventListener('click', () => honVietStart());
  }

  const baseMake = typeof makeCombatant === 'function' ? makeCombatant : null;
  if (baseMake) {
    makeCombatant = function honVietMakeCombatant(def, side, isHero) {
      const unit = baseMake(def, side, isHero);
      if (def && def.huntForm) {
        unit.huntForm = def.huntForm;
        unit.huntScale = Number(def.huntScale) || 1;
      }
      if (def && Number.isInteger(def.slot)) unit.slot = def.slot;
      return unit;
    };
  }

  const baseEnsure = typeof ensureHunt === 'function' ? ensureHunt : null;
  ensureHunt = function honVietEnsureHunt() {
    adoptDay();
    if (!P.hunt && baseEnsure) return baseEnsure();
  };

  const baseRender = typeof renderHunt === 'function' ? renderHunt : null;
  renderHunt = function honVietRenderHunt() {
    if (typeof refreshStamina === 'function') refreshStamina();
    renderLacquer();
    if (!document.getElementById('hvHuntRoot') && baseRender) baseRender();
  };

  const baseSelect = typeof selectHuntContract === 'function' ? selectHuntContract : null;
  selectHuntContract = function honVietSelectHuntContract(id) {
    const result = honVietSelect(id);
    if (!result.ok && baseSelect) return baseSelect(id);
    return result;
  };

  const baseStart = typeof startHunt === 'function' ? startHunt : null;
  startHunt = function honVietStartHunt() {
    const result = honVietStart();
    if (!result.ok && result.code !== 'NO_CONTRACT' && result.code !== 'NO_ATTEMPTS' && result.code !== 'INSUFFICIENT_STAMINA' && baseStart) {
      return baseStart();
    }
    return result;
  };

  const baseSettle = typeof huntSettle === 'function' ? huntSettle : null;
  huntSettle = function honVietHuntSettle() {
    const result = honVietSettle();
    if ((!result || !result.ok) && baseSettle) return baseSettle();
    return result;
  };

  window.HonVietHunt = {
    render: renderHunt,
    select: honVietSelect,
    start: honVietStart,
    settle: honVietSettle,
    applySettle(snap) {
      return honVietSettle(snap);
    }
  };
})();
