(() => {
  if (typeof document === 'undefined' || !document.body) return;
  if (typeof prepareTowerClimb !== 'function') return;

  function commitTower(next, commandId, source) {
    const run = typeof hvRunCommittedTransaction === 'function' ? hvRunCommittedTransaction : null;
    const apply = player => {
      if (next.tower) player.tower = next.tower;
      if (next.gold != null) player.gold = next.gold;
      if (next.gems != null) player.gems = next.gems;
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
      reason: 'tower',
      mutate: apply
    });
  }

  function ssrPool() {
    return typeof poolOf === 'function' ? poolOf('ssr') : [];
  }

  function fmt(n) {
    return Number(n || 0).toLocaleString('vi-VN');
  }

  function currentPower() {
    return typeof teamPower === 'function' ? Number(teamPower()) || 0 : 0;
  }

  function currentGate() {
    if (typeof towerPowerGate !== 'function') {
      const power = currentPower();
      return { power, required: power, effective: power, days: 0, pass: true, missing: 0 };
    }
    return towerPowerGate(P, { teamPower: currentPower(), now: Date.now() });
  }

  function powerHint(gate) {
    if (gate.pass) {
      if (gate.days) return 'Bù ngày đã đủ. Leo là qua tầng này.';
      return 'Đủ lực chiến. Leo là qua tầng này.';
    }
    const pct = Math.round((typeof TOWER_CATCHUP_PER_DAY === 'number' ? TOWER_CATCHUP_PER_DAY : 0.12) * 100);
    const cap = typeof TOWER_CATCHUP_MAX_DAYS === 'number' ? TOWER_CATCHUP_MAX_DAYS : 5;
    if (!gate.power) return 'Chưa đo được lực chiến đội.';
    const needDays = Math.ceil(((gate.required / gate.power) - 1) / ((typeof TOWER_CATCHUP_PER_DAY === 'number' ? TOWER_CATCHUP_PER_DAY : 0.12) || 0.12));
    const remain = Math.max(0, needDays - (gate.days || 0));
    if (needDays > cap) {
      return 'Thiếu ' + fmt(gate.missing) + '. Bù tối đa ' + cap + ' ngày (+' + (pct * cap) + '%) vẫn chưa đủ — phải tăng lực chiến.';
    }
    if (!gate.days) {
      return 'Thiếu ' + fmt(gate.missing) + '. Tăng lực ở Trợ trận / Rèn / sao tướng. Thử leo để bắt đầu đếm ngày bù (~' + remain + ' ngày).';
    }
    return 'Thiếu ' + fmt(gate.missing) + '. Đã kẹt ' + gate.days + ' ngày · bù +' + (pct * gate.days) + '% · còn khoảng ' + remain + ' ngày sẽ qua.';
  }

  function rewardLine(clear) {
    const bits = ['+🪙' + clear.goldGain];
    if (clear.gemsGain) bits.push('+💎' + clear.gemsGain);
    if (clear.shardsGain && clear.shardHero) {
      const name = DATA?.heroes?.[clear.shardHero]?.name || clear.shardHero;
      bits.push('+' + clear.shardsGain + ' mảnh ' + name);
    }
    if (clear.trial) {
      bits.push(clear.trialOk
        ? (clear.trial.name + ' +' + clear.trial.sigils + ' Tháp Ấn')
        : (clear.trial.name + ' chưa đạt'));
    }
    return 'Vượt tầng ' + clear.floorCleared + ': ' + bits.join(' · ');
  }

  function failLine(gate) {
    return 'Lực chiến chưa đủ. Cần ' + fmt(gate.required) + ' · đội ' + fmt(gate.effective) + (gate.days ? ' (gồm bù ' + gate.days + ' ngày)' : '') + '.';
  }

  function renderLacquer() {
    const screen = document.getElementById('towerScreen');
    const body = document.getElementById('towerBody');
    if (!body) return;
    screen?.classList.add('hv-tower-live');
    const tower = typeof normalizeTower === 'function' ? normalizeTower(P.tower) : (P.tower || { floor: 1 });
    P.tower = tower;
    const offer = typeof towerTrialOffer === 'function' ? towerTrialOffer(tower.floor) : [];
    const trials = (typeof TOWER_TRIALS === 'object' && TOWER_TRIALS) ? TOWER_TRIALS : {};
    const marks = typeof TOWER_SIGIL_MILESTONES === 'object' ? TOWER_SIGIL_MILESTONES : {};
    const stamina = Number(P.stamina || 0);
    const cost = typeof TOWER_CLIMB_STAMINA === 'number' ? TOWER_CLIMB_STAMINA : 5;
    const gate = currentGate();
    const ratio = gate.required ? Math.max(0, Math.min(1, gate.effective / gate.required)) : 1;
    body.innerHTML = `
      <div id="hvTowerRoot" data-testid="hv-tower">
        <div class="hv-tower-top">
          <button type="button" class="hv-tower-back" data-tower-back aria-label="Về Thành Chính">‹</button>
          <b>Tháp Trắng Đêm</b>
          <div class="hv-tower-chips">
            <span class="hv-tower-chip" data-tower-gold>🪙 ${fmt(P.gold)}</span>
            <span class="hv-tower-chip" data-tower-stam>⚡ ${stamina}</span>
          </div>
        </div>
        <div class="hv-tower-hero">
          <div class="hv-tower-kicker">Thử thách vô tận</div>
          <div class="hv-tower-floor" data-tower-floor>Tầng ${tower.floor}</div>
          <div class="hv-tower-best">Kỷ lục ${tower.best || 0} · Tháp Ấn ${tower.sigils || 0}</div>
          <div class="hv-tower-power${gate.pass ? ' is-ready' : ''}" data-tower-power>
            <div class="hv-tower-power-row">
              <span>Lực chiến</span>
              <b data-tower-power-have>${fmt(gate.effective)}</b>
              <span>/</span>
              <b data-tower-power-need>${fmt(gate.required)}</b>
            </div>
            <i class="hv-tower-power-bar"><b data-tower-power-fill style="width:${Math.round(ratio * 100)}%"></b></i>
            <small data-tower-power-hint>${powerHint(gate)}</small>
          </div>
        </div>
        <div class="hv-tower-panel">
          <p class="hv-tower-copy">Đủ lực chiến thì qua tầng. Thiếu thì phải tăng lực — kẹt vài ngày sẽ được bù. Thua không tụt tầng.</p>
          <div class="hv-tower-trials">
            ${offer.map(id => {
              const trial = trials[id] || { id, name: id, desc: '', goldBonus: 0, sigils: 0 };
              const on = tower.selectedTrial === id;
              const art = typeof towerArt === 'function' ? towerArt(id) : ('assets/ui/tower/seal-' + id + '.png');
              return `<button type="button" class="hv-tower-trial${on ? ' is-on' : ''}" data-tower-trial="${id}" aria-pressed="${on ? 'true' : 'false'}" aria-label="${trial.name}. ${trial.desc}">
                <img src="${art}" alt="">
                <b>${String(trial.name || '').replace(/^Ấn\s+/, '')}</b>
                <small>+${Math.round((trial.goldBonus || 0) * 100)}% vàng · +${trial.sigils || 0} Ấn</small>
              </button>`;
            }).join('')}
          </div>
          <div class="hv-tower-actions">
            <button type="button" class="hv-tower-team" data-tower-team>Đổi đội</button>
            <button type="button" class="hv-tower-climb" data-tower-climb ${stamina < cost ? 'disabled' : ''}>${gate.pass ? 'Leo tầng' : 'Thử leo'} ${tower.floor} · ${cost}⚡</button>
          </div>
          <div class="hv-tower-marks">
            <h3>Mốc Tháp Ấn</h3>
            <div class="hv-tower-marks-row">
              ${Object.entries(marks).map(([n, rw]) => {
                const mark = Number(n);
                const done = (tower.claimedSigils || []).includes(mark);
                const ready = !done && (tower.sigils || 0) >= mark;
                const label = (rw.gold ? '🪙' + rw.gold : '') + (rw.gems ? ' 💎' + rw.gems : '');
                return `<button type="button" class="hv-tower-mark${done ? ' is-done' : ready ? ' is-ready' : ''}" data-tower-mark="${mark}" ${!ready || done ? 'disabled' : ''}>${done ? '✓ ' : ''}${mark} Ấn<br>${label}</button>`;
              }).join('')}
            </div>
          </div>
        </div>
      </div>`;
    body.querySelector('[data-tower-back]')?.addEventListener('click', () => navTo('hub'));
    body.querySelector('[data-tower-team]')?.addEventListener('click', () => {
      ST.hvOpenFormation = true;
      navTo('team');
    });
    body.querySelector('[data-tower-climb]')?.addEventListener('click', () => startTower());
    body.querySelectorAll('[data-tower-trial]').forEach(btn => {
      btn.addEventListener('click', () => towerSelectTrial(btn.dataset.towerTrial));
    });
    body.querySelectorAll('[data-tower-mark]').forEach(btn => {
      btn.addEventListener('click', () => towerClaimSigilMilestone(Number(btn.dataset.towerMark)));
    });
  }

  function injectHubLandmark() {
    const host = document.querySelector('#hubScreen .art-center-links');
    if (!host || host.querySelector('[data-art-go="tower"]')) return;
    const locked = typeof featLocked === 'function' && featLocked('tower');
    const btn = document.createElement('button');
    btn.className = 'art-landmark tower' + (locked ? ' locked' : '');
    btn.dataset.artGo = 'tower';
    btn.setAttribute('aria-label', 'Tháp');
    const src = typeof towerArt === 'function' ? towerArt('hub') : 'assets/ui/tower/hub-icon.png';
    btn.innerHTML = `<img src="${src}" alt="" draggable="false"><span class="hv-tap-ring" aria-hidden="true"></span><span class="label">Tháp</span>`;
    btn.addEventListener('click', () => {
      if (locked) {
        const r = typeof JOURNEY_UNLOCK === 'object' ? JOURNEY_UNLOCK.tower : null;
        toast?.(`🔒 ${r?.label || 'Tháp Trắng Đêm'} mở sau khi vượt ${r?.ch || 1} chương.`);
        return;
      }
      navTo('tower');
    });
    host.appendChild(btn);
  }

  const baseRenderTower = typeof renderTower === 'function' ? renderTower : null;
  renderTower = function honVietTowerRender() {
    if (typeof refreshStamina === 'function') refreshStamina();
    if (typeof towerEnsure === 'function') towerEnsure();
    P.tower = typeof normalizeTower === 'function' ? normalizeTower(P.tower) : (P.tower || { floor: 1 });
    renderLacquer();
    if (!document.getElementById('hvTowerRoot') && baseRenderTower) baseRenderTower();
  };

  const baseSelect = typeof towerSelectTrial === 'function' ? towerSelectTrial : null;
  towerSelectTrial = function honVietTowerSelect(id) {
    const current = P.tower?.selectedTrial;
    const nextId = current === id ? null : id;
    const result = prepareTowerSelectTrial(P, nextId);
    if (!result.ok) {
      if (baseSelect) return baseSelect(id);
      toast?.(result.message);
      return;
    }
    if (commitTower(result, 'tower.trial:' + (nextId || 'none') + ':' + result.tower.floor, 'tower.trial').ok) {
      renderTower();
    }
  };

  const baseClaim = typeof towerClaimSigilMilestone === 'function' ? towerClaimSigilMilestone : null;
  towerClaimSigilMilestone = function honVietTowerClaim(n) {
    const result = prepareTowerClaimMilestone(P, n);
    if (!result.ok) {
      toast?.(result.message || 'Chưa nhận được mốc.');
      return;
    }
    if (commitTower(result, 'tower.sigil:' + result.mark, 'tower.sigil').ok) {
      refreshResbar?.();
      toast?.('🏮 Mốc ' + result.mark + ' Tháp Ấn: ' + (result.goldGain ? '🪙+' + result.goldGain : '') + (result.gemsGain ? ' 💎+' + result.gemsGain : ''));
      renderTower();
    } else if (baseClaim) baseClaim(n);
  };

  startTower = function honVietTowerStart() {
    if (typeof refreshStamina === 'function') refreshStamina();
    const attempt = typeof prepareTowerAttempt === 'function'
      ? prepareTowerAttempt(P, {
        teamPower: currentPower(),
        now: Date.now(),
        rng: Math.random.bind(Math),
        ssrPool: ssrPool()
      })
      : prepareTowerClimb(P);
    if (!attempt.ok) {
      toast?.(attempt.message);
      navTo?.('tower');
      return;
    }
    if (typeof spendStamina === 'function') {
      if (!spendStamina(attempt.spentStamina || 5)) {
        toast?.('Không đủ Độ Tỉnh Táo ⚡');
        return;
      }
    } else {
      P.stamina = attempt.stamina;
      persist?.();
    }
    if (commitTower(attempt, attempt.passed ? ('tower.clear:' + attempt.floorCleared) : ('tower.fail:' + attempt.tower.floor), attempt.passed ? 'tower.clear' : 'tower.fail').ok) {
      refreshResbar?.();
      if (attempt.passed) {
        if (attempt.floorCleared % 10 === 0) {
          addJournal?.('Đội leo tới tầng ' + attempt.floorCleared + ' Tháp Trắng Đêm. Gió trên đó không ngủ.');
          sendMail?.('Tháp Trắng Đêm', 'Tầng ' + attempt.floorCleared, 'Gió tầng ' + attempt.floorCleared + ' đã ghi tên anh.', { gems: 10 });
          chatSys?.('Tin tháp: đội anh chạm tầng ' + attempt.floorCleared + ' Tháp Trắng Đêm!');
        }
        questProgress?.('tower', 1);
        toast?.(rewardLine(attempt));
      } else {
        toast?.(failLine(attempt.gate || currentGate()));
      }
    }
    navTo('tower');
  };

  const baseRenderHub = typeof renderHub === 'function' ? renderHub : null;
  if (baseRenderHub) {
    renderHub = function honVietTowerHub() {
      baseRenderHub.apply(this, arguments);
      injectHubLandmark();
    };
  }

  window.HonVietTower = {
    render: renderTower,
    start: startTower
  };
  injectHubLandmark();
})();
