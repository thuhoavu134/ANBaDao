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
    (result.mails || []).forEach(m => sendMail?.(m.from || 'Đội Săn Mộng', m.title, m.body, { gold: m.gold || 0 }));
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
    if (commitHunt(result, 'hunt.settle:' + dayNow() + ':' + (shot.dmg || 0), 'hunt.settle').ok) {
      deliver(result);
      refreshResbar?.();
    }
    return result;
  }

  function renderLacquer() {
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
    const contracts = HUNT_CONTRACT_IDS.map(id => {
      const c = HUNT_CONTRACTS[id];
      const on = hunt.contract === id;
      const block = locked && !on;
      return `<button type="button" class="hv-hunt-card${on ? ' is-on' : ''}" data-hunt-contract="${id}" ${block ? 'disabled' : ''}>
        <b>${c.icon} ${c.name}</b>
        <small>${c.desc}</small>
        <span>${c.reward}</span>
      </button>`;
    }).join('');
    const miles = HUNT_MARK_KEYS.map(k => {
      const r = HUNT_MARK_MILESTONES[k];
      const on = marks >= k;
      return `<span class="hv-hunt-mile${on ? ' is-on' : ''}" data-hunt-mile="${k}">${on ? '✓ ' : ''}${k} Ấn · ${r.label}</span>`;
    }).join('');
    const canGo = attempts > 0 && !!hunt.contract;
    body.innerHTML = `
      <div id="hvHuntRoot" data-testid="hv-hunt">
        <div class="hv-hunt-top">
          <button type="button" class="hv-hunt-back" data-hunt-back aria-label="Về Thành Chính">‹</button>
          <b>Săn Boss</b>
          <div class="hv-hunt-chips">
            <span class="hv-hunt-chip" data-hunt-attempts>⚔ ${attempts}/${perDay}</span>
            <span class="hv-hunt-chip" data-hunt-gold>🪙 ${fmt(P.gold)}</span>
          </div>
        </div>
        <div class="hv-hunt-hero">
          <div class="hv-hunt-kicker">Săn Boss Mộng · 2 lượt/ngày</div>
          <div class="hv-hunt-title" data-hunt-title>Sổ Săn Đêm</div>
          <div class="hv-hunt-best" data-hunt-boss style="color:${bz.col}">${bz.name}</div>
        </div>
        <div class="hv-hunt-panel">
          <p class="hv-hunt-copy">${bz.desc}<br>
            Máu <b data-hunt-hp>${fmt(hp)}</b> · giới hạn ${HUNT_TURN_LIMIT} lượt — gây bao nhiêu tính bấy nhiêu.<br>
            🪙 theo sát thương · mỗi 6000 ST = 1 mảnh <b>${dropName}</b> · hạ gục +💎40.<br>
            Kỷ lục <b data-hunt-best>${fmt(best)}</b> ST · Săn Ấn <b data-hunt-marks>${fmt(marks)}</b>
            ${hunt.contractDone ? ' · <b>Khế đã xong</b>' : ''}
          </p>
          <div class="hv-hunt-miles" data-hunt-miles>${miles}</div>
          <div class="hv-hunt-list" data-hunt-contracts>${contracts}</div>
          <button type="button" class="hv-hunt-go" data-hunt-go ${canGo ? '' : 'disabled'}>Vào săn — ${cost()}⚡</button>
        </div>
      </div>`;
    body.querySelector('[data-hunt-back]')?.addEventListener('click', () => navTo?.('hub'));
    body.querySelectorAll('[data-hunt-contract]').forEach(btn => {
      btn.addEventListener('click', () => honVietSelect(btn.dataset.huntContract));
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
