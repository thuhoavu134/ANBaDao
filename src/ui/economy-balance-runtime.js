(() => {
  if (typeof document === 'undefined' || !document.body) return;
  if (typeof applyReward !== 'function') return;

  const RAR_UI = { b: 'B', a: 'A', s: 'S', ss: 'S+', ssr: 'S+' };
  const DAILY_DRIP = {
    q_win: { tinh: 4 },
    q_train: { hoat: 4 },
    q_tower: { tinh: 4 },
    q_hunt: { hoat: 6 },
    q_arena: { tinh: 4, hoat: 4 },
    q_guild: { tinh: 6 },
    q_spin: { hoat: 4 }
  };
  const WEEKLY_DRIP = {
    w_win: { tinh: 12, hoat: 12 },
    w_hunt: { hoat: 16 },
    w_campaign: { tinh: 16 }
  };
  const JOB_DRIP = {
    ship_pho: { tinh: 4 },
    trong_quan: { hoat: 6 },
    don_kho: { tinh: 10 },
    tuoi_cay: { hoat: 6 },
    canh_den: { tinh: 8, hoat: 8 },
    do_rac_mo: { tinh: 6 }
  };
  const CHAPTER_DRIP = { tinh: 20, hoat: 20 };

  function merge(base, extra) {
    const out = Object.assign({}, base || {});
    if (!extra) return out;
    Object.keys(extra).forEach(k => {
      const n = Number(extra[k]);
      if (Number.isFinite(n) && typeof extra[k] !== 'string') out[k] = (Number(out[k]) || 0) + n;
      else out[k] = extra[k];
    });
    return out;
  }

  function patchObjReward(obj, extra) {
    if (!obj || !extra) return;
    try {
      obj.reward = merge(obj.reward, extra);
    } catch (_) { /* frozen */ }
  }

  if (DATA && DATA.daily && Array.isArray(DATA.daily.quests)) {
    DATA.daily.quests.forEach(q => patchObjReward(q, DAILY_DRIP[q.id]));
  }
  if (typeof WEEKLY_QUESTS !== 'undefined' && Array.isArray(WEEKLY_QUESTS)) {
    WEEKLY_QUESTS.forEach(q => patchObjReward(q, WEEKLY_DRIP[q.id]));
  }
  if (DATA && Array.isArray(DATA.jobs)) {
    DATA.jobs.forEach(j => patchObjReward(j, JOB_DRIP[j.id]));
  }
  if (DATA && Array.isArray(DATA.chapters)) {
    DATA.chapters.forEach(ch => patchObjReward(ch, CHAPTER_DRIP));
  }

  const baseApply = applyReward;
  applyReward = function applyRewardBalanced(rw) {
    baseApply(rw);
    if (rw && rw.shards && rw.shardHero && P.heroes && P.heroes[rw.shardHero] && !P.heroes[rw.shardHero].owned) {
      const rar = (DATA.heroes[rw.shardHero] && DATA.heroes[rw.shardHero].rarity) || 's';
      const need = { b: 10, a: 20, s: 30, ss: 50, ssr: 50 }[rar] || 30;
      if ((P.shards[rw.shardHero] || 0) >= need) {
        P.heroes[rw.shardHero].owned = true;
        P.shards[rw.shardHero] -= need;
      }
    }
  };

  function relabel(root) {
    if (!root) return;
    root.querySelectorAll && root.querySelectorAll('*').forEach(el => {
      if (!el.childNodes) return;
      el.childNodes.forEach(n => {
        if (n.nodeType === 3 && /SSR|SR\b/.test(n.textContent)) {
          n.textContent = n.textContent.replace(/SSR/g, 'S+').replace(/\bSR\b/g, 'S');
        }
      });
    });
  }

  if (typeof renderDaily === 'function') {
    const base = renderDaily;
    renderDaily = function renderDailyBalanced() {
      base.apply(this, arguments);
      relabel(document.getElementById('dailyBody') || document.getElementById('dailyScreen'));
    };
  }
  if (typeof renderFestival === 'function') {
    const base = renderFestival;
    renderFestival = function renderFestivalRar() {
      base.apply(this, arguments);
      relabel(document.getElementById('hvFestivalRoot') || document.getElementById('festivalBody'));
    };
  }
  if (typeof renderArena === 'function') {
    const base = renderArena;
    renderArena = function renderArenaRar() {
      base.apply(this, arguments);
      relabel(document.getElementById('hvArenaRoot') || document.getElementById('arenaBody'));
    };
  }

  window.HonVietEcon = { rar: r => RAR_UI[r] || r, merge };
})();
