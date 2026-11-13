(() => {
  if (typeof document === 'undefined' || !document.body) return;
  if (typeof prepareRogueStart !== 'function') return;

  function commitRogue(next, commandId, source) {
    const run = typeof hvRunCommittedTransaction === 'function' ? hvRunCommittedTransaction : null;
    const apply = player => {
      if (next.rogue) player.rogue = next.rogue;
      if (next.gold != null) player.gold = next.gold;
      if (next.gems != null) player.gems = next.gems;
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
      reason: 'expedition',
      mutate: apply
    });
  }

  function fmt(n) {
    return Number(n || 0).toLocaleString('vi-VN');
  }

  function current() {
    return typeof normalizeRogue === 'function' ? normalizeRogue(P.rogue) : (P.rogue || { floor: 0, active: false, maxFloor: 5 });
  }

  function heroList() {
    const data = typeof DATA === 'object' && DATA?.heroes ? DATA.heroes : {};
    return Object.keys(data).slice(0, 18).map(id => {
      const h = data[id];
      return h ? { id, name: h.name, col: h.col, row: h.row, role: h.role, skill: h.skill, stats: h.stats } : null;
    }).filter(Boolean);
  }

  function blessingDef(id) {
    if (typeof findRogueBlessing === 'function') return findRogueBlessing(id);
    return (typeof ROGUE_BLESSINGS === 'object' && ROGUE_BLESSINGS[id]) || { id, name: id, desc: '' };
  }

  function routeList() {
    if (typeof ROGUE_ROUTES === 'object' && ROGUE_ROUTES) {
      const ids = typeof ROGUE_ROUTE_IDS !== 'undefined' ? ROGUE_ROUTE_IDS : Object.keys(ROGUE_ROUTES);
      return ids.map(id => ROGUE_ROUTES[id]).filter(Boolean);
    }
    return [];
  }

  function pathMarks(rogue) {
    const max = rogue.maxFloor || 5;
    const floor = rogue.active ? rogue.floor : 0;
    return Array.from({ length: max }, (_, i) => {
      const n = i + 1;
      const state = !rogue.active ? '' : n < floor ? ' is-done' : n === floor ? ' is-now' : '';
      const label = n === max ? 'Chủ' : String(n);
      return `<i class="hv-exp-node${state}" data-expedition-node="${n}">${label}</i>`;
    }).join('<span class="hv-exp-line"></span>');
  }

  function renderLacquer() {
    const screen = document.getElementById('expeditionScreen');
    const body = document.getElementById('expeditionBody');
    if (!body) return;
    screen?.classList.add('hv-exp-live');
    const rogue = current();
    P.rogue = rogue;
    const boss = rogue.active && rogue.floor >= (rogue.maxFloor || 5);
    const routes = routeList();
    const offer = (rogue.offer || []).map(blessingDef).filter(Boolean);
    const worn = (rogue.blessings || []).map(blessingDef).filter(Boolean);
    const kicker = rogue.pending ? 'Chọn Phúc Duyên' : boss ? 'Đầu Lĩnh' : rogue.active ? ('Tầng ' + rogue.floor + ' / ' + rogue.maxFloor) : 'Chưa lên đường';
    body.innerHTML = `
      <div id="hvExpeditionRoot" data-testid="hv-expedition">
        <div class="hv-exp-top">
          <button type="button" class="hv-exp-back" data-expedition-back aria-label="Về Thành Chính">‹</button>
          <b>Hành Tẩu</b>
          <div class="hv-exp-chips">
            <span class="hv-exp-chip" data-expedition-gold>🪙 ${fmt(P.gold)}</span>
            <span class="hv-exp-chip" data-expedition-sigil>🔹 ${rogue.sigils || 0}</span>
          </div>
        </div>
        <div class="hv-exp-hero">
          <div class="hv-exp-kicker">Lộ trình biến ảo</div>
          <div class="hv-exp-floor" data-expedition-floor>${kicker}</div>
          <div class="hv-exp-best">Kỷ lục ${rogue.best || 0}/5 · Vàng chuyến này 🪙 ${fmt(rogue.earnedGold || 0)}</div>
          <div class="hv-exp-path" data-expedition-path>${pathMarks(rogue)}</div>
        </div>
        <div class="hv-exp-panel">
          <p class="hv-exp-copy">${rogue.pending
            ? 'Chọn 1 trong 3 Phúc. 2 Huyền Ấn đổi bộ một lần mỗi tầng.'
            : boss
              ? 'Tầng cuối. Thắng là phá Hành Tẩu. Thua thì chuyến đi khép, kỷ lục giữ.'
              : rogue.active
                ? 'Chọn Ngã Rẽ rồi xuất chiến. Liều càng sâu, thưởng càng lớn. Thua không mất kỷ lục.'
                : 'Một chuyến, năm tầng. Mỗi tầng một quyết định rủi ro. Chuyến đang đi được lưu — quay lại là tiếp.'}</p>
          ${rogue.pending ? `
            <div class="hv-exp-offers" data-expedition-offer>
              ${offer.map(b => `<button type="button" class="hv-exp-card" data-expedition-bless="${b.id}">
                <b>${b.name}</b><small>${b.desc}</small>
              </button>`).join('')}
            </div>
            <button type="button" class="hv-exp-reroll" data-expedition-reroll ${(rogue.sigils >= 2 && (rogue.rerolls || 0) < 1) ? '' : 'disabled'}>Đổi bộ Phúc · 2 Huyền Ấn</button>
          ` : rogue.active && !boss ? `
            <div class="hv-exp-routes">
              ${routes.map(x => {
                const on = rogue.route === x.id;
                return `<button type="button" class="hv-exp-route${on ? ' is-on' : ''}" data-expedition-route="${x.id}" aria-pressed="${on ? 'true' : 'false'}">
                  <span>${x.icon}</span><b>${x.name}</b><small>${x.desc}</small>
                </button>`;
              }).join('')}
            </div>
          ` : ''}
          <div class="hv-exp-actions">
            ${rogue.active
              ? `<button type="button" class="hv-exp-abort" data-expedition-abort>Rời Hành Tẩu</button>
                 <button type="button" class="hv-exp-fight" data-expedition-fight>${boss ? 'Phá Đầu Lĩnh' : ('Xuất chiến tầng ' + rogue.floor)}</button>`
              : `<button type="button" class="hv-exp-start" data-expedition-start>Bắt đầu Hành Tẩu</button>`}
          </div>
          <div class="hv-exp-worn" data-expedition-worn>
            <h3>Phúc đang mang</h3>
            <div>${worn.length ? worn.map(b => `<span>${b.name}</span>`).join('') : '<small>Chưa có — vượt tầng đầu để chọn.</small>'}</div>
          </div>
        </div>
      </div>`;
    body.querySelector('[data-expedition-back]')?.addEventListener('click', () => navTo('hub'));
    body.querySelector('[data-expedition-start]')?.addEventListener('click', () => startRogueRun());
    body.querySelector('[data-expedition-abort]')?.addEventListener('click', () => abandonRogue());
    body.querySelector('[data-expedition-fight]')?.addEventListener('click', () => startRogueBattle());
    body.querySelector('[data-expedition-reroll]')?.addEventListener('click', () => rogueReroll());
    body.querySelectorAll('[data-expedition-route]').forEach(btn => {
      btn.addEventListener('click', () => rogueChooseRoute(btn.dataset.expeditionRoute));
    });
    body.querySelectorAll('[data-expedition-bless]').forEach(btn => {
      btn.addEventListener('click', () => rogueChooseBlessing(btn.dataset.expeditionBless));
    });
  }

  const baseRender = typeof renderExpedition === 'function' ? renderExpedition : null;
  renderExpedition = function honVietExpeditionRender() {
    P.rogue = current();
    renderLacquer();
    if (!document.getElementById('hvExpeditionRoot') && baseRender) baseRender();
  };

  startRogueRun = function honVietRogueStart() {
    const result = prepareRogueStart(P);
    if (!result.ok) {
      toast?.(result.message);
      return;
    }
    if (commitRogue(result, 'rogue.start:' + (P.revision || 0), 'rogue.start').ok) {
      renderExpedition();
    }
  };

  abandonRogue = function honVietRogueAbandon() {
    const result = prepareRogueAbandon(P);
    if (!result.ok) return;
    if (commitRogue(result, 'rogue.abort:' + (P.revision || 0), 'rogue.abort').ok) {
      toast?.('Đã gác Hành Tẩu. Kỷ lục còn đó.');
      renderExpedition();
    }
  };

  rogueChooseRoute = function honVietRogueRoute(id) {
    // Owner 07/11: ma lenh phai khac nhau moi lan doi loi (A->B->A), neu khong lan chon lai bi coi la lenh trung va bi bo qua
    const fromRoute = (P && P.rogue && P.rogue.route) || 'none';
    const result = prepareRogueChooseRoute(P, id);
    if (!result.ok) {
      toast?.(result.message);
      return;
    }
    if (commitRogue(result, 'rogue.route:' + fromRoute + '>' + id + ':' + result.rogue.floor + ':' + Date.now().toString(36), 'rogue.route').ok) {
      renderExpedition();
    }
  };

  rogueChooseBlessing = function honVietRogueBless(id) {
    const result = prepareRogueChooseBlessing(P, id);
    if (!result.ok) {
      toast?.(result.message);
      return;
    }
    if (commitRogue(result, 'rogue.bless:' + id + ':' + result.rogue.floor, 'rogue.bless').ok) {
      toast?.('Nhận ' + (result.blessing?.name || 'Phúc Duyên') + '. Lên tầng ' + result.rogue.floor + '.');
      renderExpedition();
    }
  };

  rogueReroll = function honVietRogueReroll() {
    const result = prepareRogueReroll(P);
    if (!result.ok) {
      toast?.(result.message);
      return;
    }
    if (commitRogue(result, 'rogue.reroll:' + result.rogue.floor + ':' + result.rogue.rerolls, 'rogue.reroll').ok) {
      renderExpedition();
    }
  };

  const baseBattle = typeof startRogueBattle === 'function' ? startRogueBattle : null;
  startRogueBattle = function honVietRogueBattle() {
    const fight = prepareRogueFight({ ...P, heroList: heroList() });
    if (!fight.ok) {
      toast?.(fight.message);
      return;
    }
    if (typeof DATA === 'object' && DATA) {
      DATA.encounters = DATA.encounters || {};
      DATA.encounters.__rogue = fight.encounter;
    }
    if (typeof ST === 'object' && ST) ST.mode = 'rogue';
    const floor = fight.floor;
    const routeId = fight.route?.id || null;
    const run = typeof runBattle === 'function' ? runBattle : null;
    if (!run) {
      toast?.('Chưa mở được trận Hành Tẩu.');
      return;
    }
    run('__rogue', win => {
      const result = win
        ? prepareRogueWin(P, { floor, routeId })
        : prepareRogueLose(P);
      if (!result.ok) {
        toast?.(result.message);
        if (typeof ST === 'object') ST.mode = null;
        navTo?.('expedition');
        return;
      }
      if (commitRogue(result, win ? ('rogue.win:' + floor) : ('rogue.lose:' + floor), win ? 'rogue.win' : 'rogue.lose').ok) {
        refreshResbar?.();
        if (win && result.cleared) {
          weeklyProgress?.('rogue', 1);
          addJournal?.('Phá Hành Tẩu 5 tầng — một giấc mơ dài đã khép lại.');
          toast?.('Phá Hành Tẩu! +💎' + result.gemsGain + ' · 🪙' + result.rogue.earnedGold);
        } else if (win) {
          weeklyProgress?.('rogue', 1);
          toast?.('Vượt tầng ' + floor + ' · nhận ' + (result.sigilGain || 0) + ' Huyền Ấn · chọn một Phúc Duyên.');
        } else {
          toast?.('Hành Tẩu khép lại. Giữ kỷ lục, bắt đầu chuyến mới khi sẵn sàng.');
        }
      } else if (baseBattle) {
        return;
      }
      if (typeof ST === 'object') ST.mode = null;
      navTo?.('expedition');
    });
  };

  window.HonVietExpedition = {
    render: renderExpedition,
    start: startRogueRun
  };
})();
