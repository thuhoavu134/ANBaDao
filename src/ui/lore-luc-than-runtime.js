(() => {
  if (typeof document === 'undefined' || !document.body) return;

  const CHAPTERS = [
    { name: 'Ấn Phố', desc: 'Ấn thứ nhất nứt giữa phố. Ông Phở gánh nồi — đỉnh giữ ấn — bước ra tìm Tàn Ảnh.' },
    { name: 'Ấn Rừng', desc: 'Ấn mộc nứt. Rừng thề chưa xong mọc từ lời hứa bỏ dở, nuốt người trễ hẹn.' },
    { name: 'Ấn Biển', desc: 'Ấn thủy rút. Biển khô một đêm. Ai đang uống nước mắt Lục Châu?' },
    { name: 'Ấn Lò', desc: 'Ấn lửa bị nhốt trong lò. Giấc ngủ đóng hộp, dán nhãn, bán đi.' },
    { name: 'Ấn Quên', desc: 'Ấn phong xoá tên. Mọi thứ bị lãng quên trôi về một miền không bản đồ.' },
    { name: 'Lục Thần', desc: 'Năm ấn đã khép. Kẻ Trộm Ấn tự xưng thần thứ bảy đang chờ ở tầng cuối.' }
  ];

  const SCENE = {
    ch01_intro_01: 'Đêm ấn thứ nhất nứt. Phố không ngủ — vì ấn giữ giấc đã vỡ.',
    ch01_intro_02: 'Chỉ Người Giữ Ấn còn đứng. Ông Phở gánh nồi: nồi ấy từng là đỉnh giữ ấn phố.',
    ch01_intro_06: 'Lục Châu hả? Kệ. Ở đâu có người đói, ở đó là địa bàn của ông.',
    ch01_epi_03: 'Ai đó bẻ ấn của cả phố này. Mình đi tìm cái đứa đó.',
    ch01_epi_04: 'Phía chân trời, rừng thề chưa xong mọc lên. Chương sau: Ấn Rừng.',
    ch02_intro_01: 'Ấn mộc nứt. Rừng này không mọc từ đất. Nó mọc từ lời thề người ta bỏ dở.',
    ch06_intro_01: 'Muốn lên tầng cuối của Lục Châu, phải mang năm ấn đã khép. Và phải biết kẻ tự xưng thần thứ bảy.'
  };

  function rewrite(s) {
    return String(s)
      .replace(/Hồn Việt:\s*Mộng Giới/g, 'Lục Thần')
      .replace(/Hồn Việt/g, 'Lục Thần')
      .replace(/Mộng Giới/g, 'Lục Châu')
      .replace(/Kẻ Mất Ngủ/g, 'Người Giữ Ấn')
      .replace(/Người Dẫn Mộng/g, 'Người Kể Ấn')
      .replace(/Người Gác Mộng/g, 'Kẻ Trộm Ấn')
      .replace(/Hết Mộng Châu/g, 'Đóng đủ sáu ấn')
      .replace(/Hết Lục Châu/g, 'Đóng đủ sáu ấn')
      .replace(/Chợ Đêm Mộng/g, 'Hắc Thị')
      .replace(/Chợ Đêm/g, 'Hắc Thị')
      .replace(/Shop điểm/gi, 'Tụ Bảo Các')
      .replace(/Chợ Mộng/g, 'Chợ Lục Châu')
      .replace(/Mảnh mộng hiếm/g, 'Mảnh S+')
      .replace(/thợ mộng/gi, 'thợ rèn')
      .replace(/Rèn Mộng/g, 'Rèn Ấn')
      .replace(/Xưởng Mộng/g, 'Xưởng Ấn')
      .replace(/Mộng Lộ/g, 'Lộ Ấn')
      .replace(/Boss Mộng/g, 'Boss')
      .replace(/Săn Boss/g, 'Săn')
      .replace(/Bách Bảo Luân/g, 'Bách Bảo Rương')
      .replace(/Tam Nguyện Sông Mơ/g, 'Hoa Đăng Lục Châu')
      .replace(/Bóng Mộng/g, 'Bóng Ấn');
  }

  function patchData() {
    if (typeof DATA === 'object' && Array.isArray(DATA.chapters)) {
      DATA.chapters.forEach((ch, i) => {
        if (!CHAPTERS[i]) return;
        ch.name = CHAPTERS[i].name;
        ch.desc = CHAPTERS[i].desc;
      });
    }
    if (typeof DATA === 'object' && DATA.daily && Array.isArray(DATA.daily.quests)) {
      DATA.daily.quests.forEach(q => { if (q && typeof q.text === 'string') q.text = rewrite(q.text); });
    }
    const bags = [];
    if (typeof DATA === 'object' && DATA.scenes) bags.push(DATA.scenes);
    if (typeof SCENES === 'object') bags.push(SCENES);
    bags.forEach(bag => {
      Object.keys(SCENE).forEach(id => {
        if (bag[id] && typeof bag[id].text === 'string') bag[id].text = SCENE[id];
      });
      Object.keys(bag).forEach(id => {
        const sc = bag[id];
        if (sc && typeof sc.text === 'string') sc.text = rewrite(sc.text);
        if (sc && typeof sc.desc === 'string') sc.desc = rewrite(sc.desc);
        if (sc && typeof sc.title === 'string') sc.title = rewrite(sc.title);
      });
    });
    if (typeof NPC === 'object') {
      if (NPC.narrator) NPC.narrator.name = 'Người Kể Ấn';
      if (NPC.boss_nguoi_gac_mong) NPC.boss_nguoi_gac_mong.name = 'Kẻ Trộm Ấn';
    }
  }

  function paintBrand() {
    document.title = 'An Bá Đạo';
    document.querySelectorAll('.hv-brandcopy strong, .v4-name, .rr-name, .v3-name').forEach(el => {
      el.textContent = 'An Bá Đạo';
    });
    document.querySelectorAll('.hv-brandcopy small').forEach(el => {
      el.textContent = 'Võ các · Bộ sưu tập tướng';
    });
    document.querySelectorAll('.hv-seal').forEach(el => { el.textContent = 'ABĐ'; });
    document.querySelectorAll('#hubScreen .scnm, #hubScreen .hv-land b, #hubScreen [data-art-go]').forEach(el => {
      if (el && el.childNodes) {
        el.childNodes.forEach(n => {
          if (n.nodeType === 3) n.textContent = rewrite(n.textContent);
        });
      }
    });
  }

  const SEAL_STAGES = 18;

  function mul(n, m) {
    return Math.max(1, Math.round(Number(n || 0) * m));
  }

  function cloneWave(foes, ch, stage, tag) {
    const m = 1 + ch * 0.22 + stage * 0.05;
    return (foes || []).map((f, i) => ({
      ...f,
      id: tag + '_' + i,
      stats: {
        hp: mul(f.stats && f.stats.hp, m),
        atk: mul(f.stats && f.stats.atk, m),
        def: mul(f.stats && f.stats.def, m * 0.92),
        spd: (f.stats && f.stats.spd) || 90
      }
    }));
  }

  function stageLoot(ch, stage) {
    const last = stage === SEAL_STAGES - 1;
    return {
      gold: Math.round(80 * (1 + ch * 0.4 + stage * 0.08)),
      gems: ((stage + 1) % 5 === 0 && !last) ? (6 + ch * 2) : 0,
      shards: (!last && (stage + 1) % 4 === 0) ? (4 + ch) : 0
    };
  }

  function previewStageLoot(battleId, context) {
    const ch = context?.chapterIdx, stage = context?.campaignBattleIndex;
    if (context?.mode !== 'campaign' || !Number.isInteger(ch) || ch < 0 || ch >= CHAPTERS.length ||
        !Number.isInteger(stage) || stage < 0 || stage >= SEAL_STAGES ||
        battleId !== 'lt_seal_' + ch + '_' + stage) return {};
    return stageLoot(ch, stage);
  }

  // The result transaction owns awards for iframe and full-page battles.
  // Preview is read-only; retain the same shard draw while a save retries.
  let pendingLoot = null;
  window.HonVietSealLoot = Object.freeze({
    preview: previewStageLoot,
    prepare(battleId, context, commandId) {
      const reward = previewStageLoot(battleId, context);
      if (!reward.gold) return reward;
      if (pendingLoot?.commandId === commandId && commandId) return { ...pendingLoot.reward };
      if (reward.shards) {
        const pool = Object.keys(DATA.heroes || {});
        if (pool.length) reward.shardHero = pool[(Math.random() * pool.length) | 0];
        else reward.shards = 0;
      }
      if (commandId) pendingLoot = { commandId, reward: { ...reward } };
      return reward;
    }
  });

  function expandSeals() {
    if (typeof DATA !== 'object' || !DATA.encounters) return;
    if (typeof chapterBattleSequence !== 'function') return;
    const baseSeq = chapterBattleSequence;
    chapterBattleSequence = function lucThanSealSequence(idx) {
      const ch = Math.max(0, Math.min(5, Number(idx) || 0));
      const cachedIds = Array.from({length:SEAL_STAGES}, (_,s) => 'lt_seal_' + ch + '_' + s);
      if(cachedIds.every(id => Array.isArray(DATA.encounters[id])))return cachedIds;
      const authored = baseSeq(ch) || [];
      const templates = authored.map(id => {
        const encounter=DATA.encounters[id];
        return typeof encounter === 'function' ? encounter() : encounter;
      }).filter(Array.isArray);
      // The authored final encounter is the chapter boss. Keep it out of
      // regular-wave rotation; boss checkpoints remain 6, 12 and 18.
      const regularTemplates = templates.length > 1 ? templates.slice(0, -1) : templates;
      const fallback = DATA.encounters.luyen_tap || DATA.encounters.ch01_fight_street_mobs || [];
      const out = [];
      for (let s = 0; s < SEAL_STAGES; s++) {
        const id = 'lt_seal_' + ch + '_' + s;
        if (!DATA.encounters[id]) {
          const isBoss = s === SEAL_STAGES - 1 || (s + 1) % 6 === 0;
          const src = isBoss && templates.length
            ? templates[templates.length - 1]
            : (regularTemplates[s % Math.max(1, regularTemplates.length)] || fallback);
          DATA.encounters[id] = cloneWave(src, ch, s, id);
        }
        out.push(id);
      }
      return out;
    };
  }

  function pickShardHero() {
    const pool = (DATA && DATA.heroes) ? Object.keys(DATA.heroes) : [];
    return pool[(Math.random() * pool.length) | 0];
  }

  function boostCompete() {
    if (typeof runBattle === 'function') {
      const prev = runBattle;
      runBattle = function runBattleCompeteLoot(battleId, cb) {
        return prev(battleId, win => {
          if (win && typeof P === 'object' && typeof ST === 'object') {
            if (ST.mode === 'guildBoss') {
              P.gold = (P.gold || 0) + 850;
              P.gems = (P.gems || 0) + 40;
              const hid = pickShardHero();
              if (hid) { P.shards = P.shards || {}; P.shards[hid] = (P.shards[hid] || 0) + 8; }
              if (typeof persist === 'function') persist();
              if (typeof refreshResbar === 'function') refreshResbar();
              if (typeof toast === 'function') toast('Hổ Trấn · +🪙1200 +💎40 +🧩8');
            }
            if (ST.mode === 'guildWar') {
              P.gold = (P.gold || 0) + 580;
              P.gems = (P.gems || 0) + 20;
              const hid = pickShardHero();
              if (hid) { P.shards = P.shards || {}; P.shards[hid] = (P.shards[hid] || 0) + 4; }
              if (typeof persist === 'function') persist();
              if (typeof refreshResbar === 'function') refreshResbar();
              if (typeof toast === 'function') toast('Bang Chiến · +🪙800 +💎20 +🧩4');
            }
          }
          if (typeof cb === 'function') cb(win);
        });
      };
    }
    if (typeof prepareHuntSettle === 'function') {
      const baseHunt = prepareHuntSettle;
      prepareHuntSettle = function prepareHuntSettleValuable(player, opts) {
        const r = baseHunt(player, opts);
        if (!r || r.ok === false) return r;
        if (r.killed) {
          r.gems = (r.gems || 0) + 40;
          r.gold = (r.gold || 0) + 400;
          r.goldGain = (r.goldGain || 0) + 400;
        }
        return r;
      };
    }
    if (typeof prepareArenaSettle === 'function') {
      const baseAr = prepareArenaSettle;
      prepareArenaSettle = function prepareArenaSettleValuable(player, opts) {
        const r = baseAr(player, opts);
        if (!r || r.ok === false) return r;
        if (opts && opts.win) {
          r.gold = (r.gold || 0) + 180;
          r.gems = (r.gems || 0) + 8;
        }
        return r;
      };
    }
  }

  patchData();
  expandSeals();
  boostCompete();
  paintBrand();

  const login = document.getElementById('hvLoginRoot');
  if (login && !login.querySelector('.hv-lore-title')) {
    const t = document.createElement('p');
    t.className = 'hv-lore-title';
    t.textContent = 'Lục Thần';
    login.querySelector('.hv-login-stage')?.prepend(t);
  }

  const baseShow = typeof showScreen === 'function' ? showScreen : null;
  if (baseShow) {
    showScreen = function showScreenWithLucThanLore(name) {
      baseShow(name);
      paintBrand();
    };
  }
  if (typeof renderHub === 'function') {
    const baseHub = renderHub;
    renderHub = function renderHubWithLucThan() {
      baseHub.apply(this, arguments);
      paintBrand();
    };
  }
  if (typeof renderCampaign === 'function') {
    const baseCamp = renderCampaign;
    renderCampaign = function renderCampaignWithLucThan() {
      baseCamp.apply(this, arguments);
      paintBrand();
    };
  }
  if (typeof renderHeroes === 'function') {
    const baseHeroes = renderHeroes;
    renderHeroes = function renderHeroesWithLucThan() {
      baseHeroes.apply(this, arguments);
      paintBrand();
    };
  }
})();
