(() => {
  if (typeof document === 'undefined' || !document.body) return;
  if (typeof prepareSignIn !== 'function') return;

  function commitDaily(next, commandId, source) {
    const run = typeof hvRunCommittedTransaction === 'function' ? hvRunCommittedTransaction : null;
    const apply = player => {
      if (next.daily) player.daily = next.daily;
      if (next.weekly) player.weekly = next.weekly;
      if (next.guild) player.guild = next.guild;
      if (next.idle) player.idle = next.idle;
      if (next.gold != null) player.gold = next.gold;
      if (next.gems != null) player.gems = next.gems;
      if (next.so != null) player.so = next.so;
      if (next.stamina != null) player.stamina = next.stamina;
      if (next.tinh != null) player.tinh = next.tinh;
      if (next.hoat != null) player.hoat = next.hoat;
      return { ok: true };
    };
    if (!run) {
      apply(P);
      persist?.();
      return { ok: true };
    }
    const tx = run({
      commandId: commandId || (source + ':' + (P.revision || 0)),
      source,
      reason: 'daily',
      mutate: apply
    });
    if (!tx.ok) toast?.(tx.message || 'Chưa lưu được phần thưởng. Anh thử lại nhé.');
    return tx;
  }

  function fmt(n) {
    return Number(n || 0).toLocaleString('vi-VN');
  }

  function dayNow() {
    return typeof today === 'function' ? today() : (typeof dailyDayIndex === 'function' ? dailyDayIndex() : 0);
  }

  function openArgs() {
    return {
      day: dayNow(),
      weekIndex: Math.floor(dayNow() / 7),
      now: Date.now(),
      stamCap: DATA?.daily?.stamCap || DAILY_STAM_CAP,
      guildIdleMult: typeof guildIdleMult === 'function' ? guildIdleMult() : 1,
      clanIdleMult: typeof clanIdleMult === 'function' ? clanIdleMult() : 1,
      petMeoMun: typeof petActive === 'function' ? petActive('meo_mun') : false,
      petGaBaoThuc: typeof petActive === 'function' ? petActive('ga_bao_thuc') : false,
      rng: Math.random.bind(Math),
      featureUnlocks: typeof JOURNEY_UNLOCK === 'object' ? JOURNEY_UNLOCK : undefined
    };
  }

  function deliver(result) {
    (result.journals || []).forEach(line => addJournal?.(line, result.journalHeroId || null));
  }

  function hourNow() {
    return new Date().getHours();
  }

  function rewardLabel(rw) {
    return dailyRewardItems(rw).map(it => '+' + fmt(it.value) + ' ' + it.label).join(' · ');
  }

  function presentReward(title, reward, tx, major = false) {
    const items = dailyRewardItems({ ...reward, playerXp: tx?.result?.playerXp || 0 });
    if (major && typeof showRewardCeremony === 'function') {
      showRewardCeremony(title, 'Đã cộng vào tài khoản.', items, '🎁', 'Phần thưởng');
    } else {
      const detail = items.map(it => '+' + fmt(it.value) + ' ' + it.label).join(' · ');
      if (typeof showProgressBurst === 'function') showProgressBurst(title, detail);
      else toast?.(title + ': ' + detail);
    }
  }

  function adoptOpen() {
    const opened = prepareDailyOpen(P, openArgs());
    if (!opened?.ok) return false;
    if (opened.refreshed || opened.assignmentsChanged) {
      const assignmentKey = [...opened.daily.quests, ...opened.weekly.quests]
        .filter(q => q.variant).map(q => q.id).join(',');
      const key = opened.refreshed ? 'daily.reset:' + opened.day + ':' + opened.weekIndex
        : 'daily.assign:' + opened.day + ':' + opened.weekIndex + ':' + assignmentKey;
      const tx = commitDaily(opened, key, opened.refreshed ? 'daily.reset' : 'daily.assign');
      if (!tx.ok) return false;
      if (opened.refreshed && !tx.duplicate && typeof dailyFlavorMail === 'function') dailyFlavorMail();
    }
    else {
      if (opened.daily) P.daily = opened.daily;
      if (opened.weekly) P.weekly = opened.weekly;
    }
    return true;
  }

  function renderLacquer() {
    const screen = document.getElementById('dailyScreen');
    const body = document.getElementById('dailyBody');
    if (!body) return;
    screen?.classList.add('hv-daily-live');
    if (!adoptOpen()) return;
    const d = P.daily || emptyDaily();
    const w = P.weekly || emptyWeekly(Math.floor(dayNow() / 7));
    const claimedToday = d.signInClaimedDay === dayNow();
    const posDone = d.signInDay > 0 ? (((d.signInDay - 1) % DAILY_CALENDAR_DAYS) + 1) : 0;
    let cal = '';
    for (let i = 1; i <= DAILY_CALENDAR_DAYS; i++) {
      const rw = signInReward(i);
      const ms = (i % 7 === 0);
      const isToday = (!claimedToday && i === posDone + 1) || (claimedToday && i === posDone);
      cal += `<button type="button" class="hv-daily-day${i <= posDone ? ' is-claimed' : ''}${isToday ? ' is-today' : ''}${ms ? ' is-mile' : ''}" data-daily-day="${i}" disabled><b>${i}</b><small>${rw.label}</small></button>`;
    }
    const idleP = idlePreview(P, openArgs());
    const h = hourNow();
    const noonOpen = napWindowOpen('noon', h);
    const eveOpen = napWindowOpen('eve', h);
    const pts = d.activityPoints || 0;
    const wpts = w.points || 0;
    const quests = (d.quests || []).map(q => {
      const def = dailyQuestDefinition(P, q.id);
      if (!def) return '';
      const done = q.progress >= def.goal;
      const pct = Math.min(100, (q.progress / def.goal) * 100);
      return `<div class="hv-daily-quest" data-daily-quest="${q.id}">
        <div class="hv-daily-qt"><b>${def.text}</b><small class="hv-daily-reward">${rewardLabel(def.reward)}</small><i style="width:${pct}%"></i></div>
        <span>${Math.min(q.progress, def.goal)}/${def.goal}</span>
        <button type="button" class="hv-daily-claim" data-daily-claim="${q.id}" ${(!done || q.claimed) ? 'disabled' : ''}>${q.claimed ? '✓' : 'Nhận'}</button>
      </div>`;
    }).join('');
    const weekly = (w.quests || []).map(q => {
      const def = weeklyQuestDefinition(P, q.id);
      if (!def) return '';
      const done = q.progress >= def.goal;
      const pct = Math.min(100, (q.progress / def.goal) * 100);
      return `<div class="hv-daily-quest" data-daily-week="${q.id}">
        <div class="hv-daily-qt"><b>${def.text}</b><small class="hv-daily-reward">${rewardLabel(def.reward)}</small><i style="width:${pct}%"></i></div>
        <span>${Math.min(q.progress, def.goal)}/${def.goal}</span>
        <button type="button" class="hv-daily-claim" data-daily-wclaim="${q.id}" ${(!done || q.claimed) ? 'disabled' : ''}>${q.claimed ? '✓' : 'Nhận'}</button>
      </div>`;
    }).join('');
    const acts = ACT_MILESTONES.map(m => {
      const on = pts >= m.p && !(d.actClaimed || []).includes(m.p);
      const got = (d.actClaimed || []).includes(m.p);
      return `<button type="button" class="hv-daily-mile${got ? ' is-got' : ''}" data-daily-act="${m.p}" ${on ? '' : 'disabled'}>${m.p}đ · ${got ? '✓' : rewardLabel(m.reward)}</button>`;
    }).join('');
    const weeks = WEEKLY_MILESTONES.map(m => {
      const on = wpts >= m.p && !(w.claimed || []).includes(m.p);
      const got = (w.claimed || []).includes(m.p);
      return `<button type="button" class="hv-daily-mile${got ? ' is-got' : ''}" data-daily-weekm="${m.p}" ${on ? '' : 'disabled'}>${m.p}đ · ${got ? '✓' : rewardLabel(m.reward)}</button>`;
    }).join('');
    const journal = (P.journal || []).slice(0, 8).map(j => `<div class="hv-daily-j">☾ ${j.text}</div>`).join('')
      || '<div class="hv-daily-j">Chưa có dòng nào. Điểm danh và nhận Ca Trực Đêm để nhật ký tự viết.</div>';
    body.innerHTML = `
      <div id="hvDailyRoot" data-testid="hv-daily">
        <div class="hv-daily-top">
          <button type="button" class="hv-daily-back" data-daily-back aria-label="Về Thành Chính">‹</button>
          <b>Nhật Ký Mơ</b>
          <div class="hv-daily-chips">
            <span class="hv-daily-chip" data-daily-gold>🪙 ${fmt(P.gold)}</span>
            <span class="hv-daily-chip" data-daily-gems>💎 ${fmt(P.gems)}</span>
          </div>
        </div>
        <div class="hv-daily-hero">
          <div class="hv-daily-kicker">Điểm danh · Ca trực · Việc vặt</div>
          <div class="hv-daily-title" data-daily-title>Nhật Ký Mơ</div>
          <div class="hv-daily-best">Chuỗi ${fmt(d.streak || 1)} ngày · 🐚 ${fmt(P.so || 0)}</div>
        </div>
        <div class="hv-daily-panel">
          <section class="hv-daily-sec">
            <h3>📅 Điểm danh</h3>
            <div class="hv-daily-cal" data-daily-cal>${cal}</div>
            <button type="button" class="hv-daily-go" data-daily-sign ${claimedToday ? 'disabled' : ''}>${claimedToday ? 'Đã điểm danh hôm nay ✓' : 'Điểm danh nhận thưởng'}</button>
          </section>
          <section class="hv-daily-sec">
            <h3>😴 Chợp Mắt — +${DAILY_NAP_GAIN}⚡</h3>
            <div class="hv-daily-naps">
              <button type="button" class="hv-daily-nap" data-daily-nap="noon" ${(!noonOpen || d.napNoon) ? 'disabled' : ''}>Trưa 11–14h ${d.napNoon ? '✓' : (noonOpen ? '' : '(chưa tới giờ)')}</button>
              <button type="button" class="hv-daily-nap" data-daily-nap="eve" ${(!eveOpen || d.napEve) ? 'disabled' : ''}>Tối 18–21h ${d.napEve ? '✓' : (eveOpen ? '' : '(chưa tới giờ)')}</button>
            </div>
          </section>
          <section class="hv-daily-sec">
            <h3>🌙 Ca Trực Đêm</h3>
            <p class="hv-daily-copy">Tích luỹ <b>${idleP.hrs.toFixed(1)}h</b>/${DAILY_IDLE_CAP_H}h · sẵn nhận <b>🪙 ${fmt(idleP.gold)}</b> <small>×${idleP.chapterMult.toFixed(1)}</small></p>
            <button type="button" class="hv-daily-go" data-daily-idle ${idleP.gold < 1 ? 'disabled' : ''}>Nhận ca trực</button>
          </section>
          <section class="hv-daily-sec">
            <h3>📝 Việc Vặt Trong Mơ</h3>
            <div class="hv-daily-track"><span>Sôi Nổi ${pts}/100</span><div class="hv-daily-bar"><i style="width:${Math.min(100, pts)}%"></i></div></div>
            <div class="hv-daily-miles">${acts}</div>
            <div data-daily-quests>${quests}</div>
          </section>
          <section class="hv-daily-sec">
            <h3>🏮 Việc Tuần</h3>
            <div class="hv-daily-track"><span>Danh Vọng ${wpts}/100</span><div class="hv-daily-bar"><i style="width:${Math.min(100, wpts)}%"></i></div></div>
            <div class="hv-daily-miles">${weeks}</div>
            <div data-daily-weekly>${weekly}</div>
          </section>
          <section class="hv-daily-sec">
            <h3>📖 Nhật Ký Mơ</h3>
            <div class="hv-daily-journal" data-daily-journal>${journal}</div>
          </section>
        </div>
      </div>`;
    body.querySelector('[data-daily-back]')?.addEventListener('click', () => navTo?.('hub'));
    body.querySelector('[data-daily-sign]')?.addEventListener('click', () => honVietSignIn());
    body.querySelectorAll('[data-daily-nap]').forEach(btn => {
      btn.addEventListener('click', () => honVietNap(btn.dataset.dailyNap));
    });
    body.querySelector('[data-daily-idle]')?.addEventListener('click', () => honVietIdle());
    body.querySelectorAll('[data-daily-claim]').forEach(btn => {
      btn.addEventListener('click', () => honVietQuest(btn.dataset.dailyClaim));
    });
    body.querySelectorAll('[data-daily-act]').forEach(btn => {
      btn.addEventListener('click', () => honVietAct(+btn.dataset.dailyAct));
    });
    body.querySelectorAll('[data-daily-wclaim]').forEach(btn => {
      btn.addEventListener('click', () => honVietWeekly(btn.dataset.dailyWclaim));
    });
    body.querySelectorAll('[data-daily-weekm]').forEach(btn => {
      btn.addEventListener('click', () => honVietWeekm(+btn.dataset.dailyWeekm));
    });
  }

  function honVietSignIn() {
    if (typeof refreshStamina === 'function') refreshStamina();
    const result = prepareSignIn(P, openArgs());
    if (!result.ok) {
      toast?.(result.message);
      return null;
    }
    const reward = { ...result.rw, so: result.so - (P.so || 0), stamina: result.stamina - (P.stamina || 0) };
    const tx = commitDaily(result, 'daily.sign:' + result.n + ':' + result.daily.signInClaimedDay, 'daily.sign');
    if (tx.ok && !tx.duplicate) {
      deliver(result);
      if (typeof petBondActivity === 'function') result.petBond = petBondActivity('signin', { day: result.n });
      refreshResbar?.();
      presentReward('Điểm danh ngày ' + result.n, reward, tx, result.n % 7 === 0);
      renderDaily();
      return { n: result.n, rw: result.rw, petBond: result.petBond };
    }
    return null;
  }

  function honVietNap(which) {
    if (typeof refreshStamina === 'function') refreshStamina();
    const result = prepareNap(P, which, openArgs());
    if (!result.ok) {
      toast?.(result.message);
      return false;
    }
    if (commitDaily(result, 'daily.nap:' + which + ':' + dayNow(), 'daily.nap').ok) {
      toast?.('+' + DAILY_NAP_GAIN + '⚡ — chợp mắt ' + (which === 'noon' ? 'trưa' : 'tối'));
      refreshResbar?.();
      renderDaily();
      return true;
    }
    return false;
  }

  function honVietIdle() {
    const result = prepareClaimIdle(P, openArgs());
    if (!result.ok) {
      toast?.(result.message);
      return null;
    }
    const tx = commitDaily(result, 'daily.idle:' + result.idle.claimedAt, 'daily.idle');
    if (tx.ok && !tx.duplicate) {
      deliver(result);
      questProgress?.('idle', 1);
      if (typeof clanDutyProgress === 'function') clanDutyProgress('idle', 1);
      if (typeof petBondActivity === 'function') result.petBond = petBondActivity('idle', { hours: result.hrs, gold: result.goldGain });
      refreshResbar?.();
      presentReward('Đã nhận Ca Trực Đêm', { gold: result.goldGain }, tx);
      renderDaily();
      return { hrs: result.hrs, gold: result.goldGain, petBond: result.petBond };
    }
    return null;
  }

  function honVietQuest(id) {
    const result = prepareClaimQuest(P, id, openArgs());
    if (!result.ok) {
      toast?.(result.message);
      return false;
    }
    const tx = commitDaily(result, 'daily.quest:' + id + ':' + dayNow(), 'daily.quest');
    if (tx.ok && !tx.duplicate) {
      if (typeof clanAddXp === 'function') clanAddXp(result.clanXp || 5);
      refreshResbar?.();
      const rw = result.def?.reward || {};
      presentReward('Hoàn thành việc vặt', rw, tx);
      renderDaily();
      return true;
    }
    return false;
  }

  function honVietAct(p) {
    const result = prepareClaimActMilestone(P, p, openArgs());
    if (!result.ok) {
      toast?.(result.message);
      return false;
    }
    const tx = commitDaily(result, 'daily.act:' + p + ':' + dayNow(), 'daily.act');
    if (tx.ok && !tx.duplicate) {
      refreshResbar?.();
      presentReward('Mốc Sôi Nổi ' + p + ' điểm', result.reward, tx, p === 80);
      renderDaily();
      return true;
    }
    return false;
  }

  function honVietWeekly(id) {
    const result = prepareClaimWeeklyQuest(P, id, openArgs());
    if (!result.ok) {
      toast?.(result.message);
      return false;
    }
    const tx = commitDaily(result, 'daily.weekly:' + id + ':' + result.weekly.weekIndex, 'daily.weekly');
    if (tx.ok && !tx.duplicate) {
      refreshResbar?.();
      const rw = result.def?.reward || {};
      presentReward('Hoàn thành việc tuần', rw, tx);
      renderDaily();
      return true;
    }
    return false;
  }

  function honVietWeekm(p) {
    const result = prepareClaimWeeklyMilestone(P, p, openArgs());
    if (!result.ok) {
      toast?.(result.message);
      return false;
    }
    const tx = commitDaily(result, 'daily.weekm:' + p + ':' + result.weekly.weekIndex, 'daily.weekm');
    if (tx.ok && !tx.duplicate) {
      refreshResbar?.();
      presentReward('Mốc Danh Vọng ' + p + ' điểm', result.reward, tx, p === 100);
      renderDaily();
      return true;
    }
    return false;
  }

  checkDailyReset = function honVietCheckDailyReset() {
    if (typeof petNormalize === 'function') petNormalize(P);
    return adoptOpen();
  };

  const baseRender = typeof renderDaily === 'function' ? renderDaily : null;
  renderDaily = function honVietRenderDaily() {
    if (typeof refreshStamina === 'function') refreshStamina();
    renderLacquer();
    if (!document.getElementById('hvDailyRoot') && baseRender) baseRender();
  };

  claimSignIn = function honVietClaimSignIn() {
    return honVietSignIn();
  };

  nap = function honVietNapWrap(which) {
    return honVietNap(which);
  };

  const baseIdlePending = typeof idlePending === 'function' ? idlePending : null;
  idlePending = function honVietIdlePending() {
    if (typeof idlePreview === 'function') return idlePreview(P, openArgs());
    return baseIdlePending ? baseIdlePending() : { hrs: 0, gold: 0 };
  };

  claimIdle = function honVietClaimIdle() {
    return honVietIdle();
  };

  claimQuest = function honVietClaimQuest(id) {
    return honVietQuest(id);
  };

  claimActMilestone = function honVietClaimAct(p) {
    return honVietAct(p);
  };

  claimWeeklyQuest = function honVietClaimWeekly(id) {
    return honVietWeekly(id);
  };

  claimWeeklyMilestone = function honVietClaimWeekm(p) {
    return honVietWeekm(p);
  };

  window.HonVietDailyQuests = Object.freeze({ daily: dailyQuestDefinition, weekly: weeklyQuestDefinition });
  // Initialize assignments before the first activity can increment counters.
  adoptOpen();

  window.HonVietDaily = {
    render: renderDaily,
    sign: honVietSignIn,
    nap: honVietNap,
    idle: honVietIdle,
    quest: honVietQuest,
    openLich: openLichWheel,
    closeLich: hideLichWheel
  };

  function spokeIcon(spoke) {
    const name = spoke.key || spoke.icon || 'campaign';
    return 'assets/daily/spokes/' + name + '.jpg';
  }

  function clearedN() {
    return Array.isArray(P?.clearedChapters) ? P.clearedChapters.length : 0;
  }

  function fillLichChips(root) {
    const gold = root.querySelector('[data-lich-gold]');
    const gems = root.querySelector('[data-lich-gems]');
    const stam = root.querySelector('[data-lich-stam]');
    if (gold) gold.textContent = '🪙 ' + fmt(P.gold);
    if (gems) gems.textContent = '💎 ' + fmt(P.gems);
    if (stam) stam.textContent = '⚡ ' + fmt(P.stamina);
  }

  function paintLichWheel() {
    const root = document.getElementById('hvLichRoot');
    const ring = root?.querySelector('[data-lich-ring]');
    if (!ring || typeof LICH_LUYEN_SPOKES === 'undefined') return;
    const n = clearedN();
    ring.innerHTML = LICH_LUYEN_SPOKES.map(spoke => {
      const locked = typeof lichSpokeLocked === 'function' ? lichSpokeLocked(spoke, n) : true;
      return '<button type="button" class="hv-lich-spoke' + (locked ? ' is-locked' : '') + (spoke.key === 'campaign' ? ' is-on' : '') + '" data-lich-spoke="' + spoke.key + '" style="transform:rotate(' + spoke.angle + 'deg) translate(0, calc(-1 * var(--lich-r))) rotate(-' + spoke.angle + 'deg)" aria-label="' + spoke.label + '"><span><img src="' + spokeIcon(spoke) + '" alt=""></span>' + (locked ? '<i class="hv-lich-lock" aria-hidden="true"></i>' : '') + '<small><b>' + spoke.label + '</b>' + spoke.sub + '</small></button>';
    }).join('');
    fillLichChips(root);
  }

  function ensureLichRoot() {
    let root = document.getElementById('hvLichRoot');
    if (root) return root;
    root = document.createElement('div');
    root.id = 'hvLichRoot';
    root.hidden = true;
    root.innerHTML = '<section class="hv-lich-screen">'
      + '<div class="hv-lich-top">'
      + '<button type="button" class="hv-lich-back" data-lich-back aria-label="Về Thành Chính">‹</button>'
      + '<b>Lịch luyện</b>'
      + '<div class="hv-lich-chips">'
      + '<span class="hv-lich-chip" data-lich-gold>🪙 0</span>'
      + '<span class="hv-lich-chip" data-lich-gems>💎 0</span>'
      + '<span class="hv-lich-chip" data-lich-stam>⚡ 0</span>'
      + '</div></div>'
      + '<div class="hv-lich-stage">'
      + '<div class="hv-lich-wheel" data-testid="hv-lich">'
      + '<div class="hv-lich-ring" data-lich-ring></div>'
      + '<div class="hv-lich-core" data-lich-core><b data-lich-title>Lịch luyện</b></div>'
      + '</div></div></section>';
    document.body.appendChild(root);
    root.addEventListener('click', event => {
      if (event.target.closest('[data-lich-back]')) {
        hideLichWheel();
        return;
      }
      const spoke = event.target.closest('[data-lich-spoke]');
      if (spoke) enterLichSpoke(spoke.dataset.lichSpoke);
    });
    return root;
  }

  function markDockDaily(on) {
    document.querySelectorAll('#hubScreen .art-dock [data-art-go]').forEach(el => {
      el.classList.toggle('active', on ? el.dataset.artGo === 'daily' : el.dataset.artGo === 'hub');
    });
  }

  function openLichWheel() {
    const root = ensureLichRoot();
    if (typeof refreshStamina === 'function') refreshStamina();
    paintLichWheel();
    root.hidden = false;
    root.classList.add('is-open');
    document.body.classList.add('hv-lich-open');
    markDockDaily(true);
  }

  function hideLichWheel() {
    const root = document.getElementById('hvLichRoot');
    if (!root) return;
    root.hidden = true;
    root.classList.remove('is-open');
    document.body.classList.remove('hv-lich-open');
    markDockDaily(false);
  }

  function enterLichSpoke(key) {
    const result = typeof prepareLichEnter === 'function'
      ? prepareLichEnter(P, key)
      : { ok: false, message: 'Chưa mở cổng ải.' };
    if (!result.ok) {
      toast?.(result.message);
      return;
    }
    hideLichWheel();
    if (result.go === 'train') {
      if (typeof startTraining === 'function') startTraining();
      else toast?.('Giáo Trường Luyện Tâm.');
      return;
    }
    navTo?.(result.go);
  }

  document.addEventListener('click', event => {
    const dockDaily = event.target.closest('#hubScreen .art-dock [data-art-go="daily"]');
    if (dockDaily) {
      event.preventDefault();
      event.stopImmediatePropagation();
      openLichWheel();
      return;
    }
    const dockHub = event.target.closest('#hubScreen .art-dock [data-art-go="hub"]');
    if (dockHub) hideLichWheel();
  }, true);

  const baseNav = typeof navTo === 'function' ? navTo : null;
  if (baseNav) {
    navTo = function honVietLichNav(name) {
      hideLichWheel();
      // Cloud login may replace P after script initialization; route entry also
      // catches day/week rollover before the next activity can make progress.
      if (!adoptOpen()) return;
      return baseNav(name);
    };
  }
})();
