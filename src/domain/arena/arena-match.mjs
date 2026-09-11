const arenaFail = (code, message) => ({ ok: false, code, message });

export const ARENA_COST = 5;
export const ARENA_WIN_GOLD = 220;
export const ARENA_SO_WIN = 1;
export const SEASON_WIN_GOLD = 180;
export const SEASON_LEN = 35;
export const PVE_WIN_GOLD = 200;
export const PVE_STAGE_COUNT = 8;

export const ARENA_NAMES = Object.freeze([
  'Hội Cú Đêm', 'Băng Trắng Đêm', 'Nhóm Mất Ngủ Kinh Niên', 'Đội Trực Ca Ba',
  'Hội Sợ Chuông Báo Thức', 'Băng Ngáp Dài', 'Nhóm Đếm Cừu Thất Bại', 'Đội Cà Phê Nguội'
]);

export const ARENA_RIVALRY_MILESTONES = Object.freeze({
  3: Object.freeze({ gold: 300, gems: 5, label: 'Kẻ Mở Kèo' }),
  8: Object.freeze({ gold: 650, gems: 10, label: 'Người Giữ Hạng' }),
  15: Object.freeze({ gold: 1200, gems: 20, label: 'Tên Trên Bảng Đêm' }),
  25: Object.freeze({ gold: 2000, gems: 30, label: 'Kình Địch Thành Danh' })
});

export const ARENA_RANK_GEMS = Object.freeze([
  Object.freeze([800, 10]), Object.freeze([600, 15]), Object.freeze([400, 20]),
  Object.freeze([300, 30]), Object.freeze([200, 40]), Object.freeze([100, 60]),
  Object.freeze([50, 80]), Object.freeze([10, 120]), Object.freeze([1, 200])
]);

export const SEASON_LP_MILESTONES = Object.freeze({
  180: Object.freeze({ gems: 40, gold: 800 }),
  400: Object.freeze({ gems: 60, gold: 1200 }),
  700: Object.freeze({ gems: 80, gold: 1800 }),
  1000: Object.freeze({ gems: 100, gold: 2500 }),
  1400: Object.freeze({ gems: 160, gold: 4000 })
});

export const SEASON_LP_KEYS = Object.freeze([180, 400, 700, 1000, 1400]);

export const SEASON_RULES = Object.freeze([
  Object.freeze({ id: 'frontline', name: 'Tiên Phong', ic: '🛡', desc: 'Hàng trước +12% HP · hàng sau +8% Công.' }),
  Object.freeze({ id: 'rage_tide', name: 'Nộ Triều', ic: '🌊', desc: 'Khai trận +18 Nộ. Nhịp tung tuyệt kỹ đến sớm hơn.' }),
  Object.freeze({ id: 'counter', name: 'Khắc Hệ', ic: '⚔', desc: 'Khắc chế role được nhấn mạnh trong trận Mùa.' }),
  Object.freeze({ id: 'blood', name: 'Huyết Chiến', ic: '🩸', desc: 'Dưới 45% HP được +15% Công; hồi phục bị giảm 20%.' }),
  Object.freeze({ id: 'calm', name: 'Tĩnh Tâm', ic: '💠', desc: 'Khiên +20%; khống chế ngắn hơn để chống lock đội.' })
]);

export const PVE_STAGES = Object.freeze([
  Object.freeze({ i: 1, name: 'Vỡ Lòng Mộng', desc: 'Đội tân binh B — làm quen võ đài', lvl: 1, stars: 1, team: Object.freeze(['ga_gay_nham_gio', 'loa_phuong_cu', 'meo_muop_lang_thang', 'den_duong_nhap_nhay', 'dom_dom_thanh_pho', 'chuot_cong_trieu_phu']), reward: Object.freeze({ gems: 20 }) }),
  Object.freeze({ i: 2, name: 'Bức Tường Ngáy', desc: 'Toàn đỡ đòn — thử độ lì', lvl: 5, stars: 1, team: Object.freeze(['robot_trong_rau', 'ong_giu_xe_dem', 'chu_bao_ve_giac_mo', 'bac_xich_lo_mua', 'ong_hang_pho', 'ba_ban_che_khuya']), reward: Object.freeze({ gems: 25 }) }),
  Object.freeze({ i: 3, name: 'Cơn Lũ Tốc Độ', desc: 'Đội siêu nhanh — ai ra tay trước?', lvl: 8, stars: 2, team: Object.freeze(['meo_9_deadline', 'ky_lan_ca_phe', 'thang_be_dieu_set', 'cun_con_so_sam', 'em_on_thi_cuoi', 'chu_tai_xe_chuyen_cuoi']), reward: Object.freeze({ gems: 30 }) }),
  Object.freeze({ i: 4, name: 'Dàn Loa Ác Mộng', desc: 'Sát thương diện rộng dồn dập', lvl: 11, stars: 2, team: Object.freeze(['ca_tre_biet_buon', 'co_lao_cong_khuya', 'loa_phuong_cu', 'co_ban_bao_som', 'co_ban_hoa_dem', 'ong_ke_that_nghiep']), reward: Object.freeze({ gems: 35, shards: 6, shardHero: 'ca_tre_biet_buon' }) }),
  Object.freeze({ i: 5, name: 'Vòng Tay Không Gục', desc: 'Đội hồi máu — trận đánh dai', lvl: 14, stars: 3, team: Object.freeze(['ong_hang_pho', 'ba_banh_mi_khuya', 'co_y_ta_truc_dem', 'anh_tra_da_via_he', 'dom_dom_thanh_pho', 'hon_cay_bang']), reward: Object.freeze({ gems: 40, shards: 6, shardHero: 'hon_cay_bang' }) }),
  Object.freeze({ i: 6, name: 'Đêm Của Dấu', desc: 'Đánh dấu và khống chế tứ phía', lvl: 17, stars: 3, team: Object.freeze(['nang_tien_ca_can', 'be_ve_so_chieu', 'thung_thu_khong_dia_chi', 'chu_tho_khoa_gia', 'ba_dong_nat_ky_uc', 'ong_dia_lac_duong']), reward: Object.freeze({ gems: 50, shards: 8, shardHero: 'nang_tien_ca_can' }) }),
  Object.freeze({ i: 7, name: 'Bộ Sậu SSR', desc: 'Sáu SSR đứng chung một đài', lvl: 20, stars: 4, team: Object.freeze(['ong_hang_pho', 'robot_trong_rau', 'thang_be_dieu_set', 'ky_lan_ca_phe', 'ong_ke_that_nghiep', 'meo_9_deadline']), reward: Object.freeze({ gems: 60, shards: 10, shardHero: 'thang_be_dieu_set' }) }),
  Object.freeze({ i: 8, name: 'Tấm Gương Mộng', desc: 'Đấu với BẢN SAO đội của chính anh', lvl: 24, stars: 4, team: null, reward: Object.freeze({ gems: 100, shards: 10, shardHero: 'ong_hang_pho' }) })
]);

function asInt(value, fallback = 0) {
  const n = Math.floor(Number(value));
  return Number.isFinite(n) ? n : fallback;
}

function cloneMap(src) {
  const out = {};
  if (src && typeof src === 'object') {
    for (const key of Object.keys(src)) {
      const val = src[key];
      out[key] = val && typeof val === 'object' && !Array.isArray(val) ? { ...val } : val;
    }
  }
  return out;
}

export function emptyArena() {
  return { rank: 1000, best: 1000, claimed: [], rivals: [] };
}

export function emptyRivalry() {
  return { day: -1, deeds: [], marks: 0, claimed: [], grudges: {}, wins: 0, losses: 0, revenges: 0, leaps: 0 };
}

export function emptySeason(index = 0) {
  return {
    index: asInt(index, 0),
    lp: 0, bestLp: 0, wins: 0, losses: 0, streak: 0, bestStreak: 0,
    defense: [], claimed: [], badges: [], uniqueWinTeams: [], draftWins: 0
  };
}

export function emptyArenaPvE() {
  return { stage: 1, cleared: [] };
}

export function normalizeArena(src) {
  const base = emptyArena();
  const row = src && typeof src === 'object' ? src : {};
  return {
    rank: Math.max(1, asInt(row.rank, base.rank)),
    best: Math.max(1, asInt(row.best, base.best)),
    claimed: Array.isArray(row.claimed) ? row.claimed.map(n => asInt(n, 0)) : [],
    rivals: Array.isArray(row.rivals) ? row.rivals.map(r => ({ ...r })) : []
  };
}

export function normalizeRivalry(src, day) {
  const base = emptyRivalry();
  const row = src && typeof src === 'object' ? src : {};
  const next = {
    day: asInt(row.day, base.day),
    deeds: Array.isArray(row.deeds) ? row.deeds.slice() : [],
    marks: Math.max(0, asInt(row.marks, 0)),
    claimed: Array.isArray(row.claimed) ? row.claimed.map(n => asInt(n, 0)) : [],
    grudges: cloneMap(row.grudges),
    wins: Math.max(0, asInt(row.wins, 0)),
    losses: Math.max(0, asInt(row.losses, 0)),
    revenges: Math.max(0, asInt(row.revenges, 0)),
    leaps: Math.max(0, asInt(row.leaps, 0))
  };
  if (day != null && next.day !== asInt(day, next.day)) {
    next.day = asInt(day, 0);
    next.deeds = [];
  }
  return next;
}

export function normalizeSeason(src, index) {
  const base = emptySeason(index);
  const row = src && typeof src === 'object' ? src : {};
  const idx = asInt(index, asInt(row.index, 0));
  if (asInt(row.index, idx) !== idx) {
    const badges = Array.isArray(row.badges) ? row.badges.slice() : [];
    const oldTier = seasonTier(asInt(row.bestLp, 0));
    badges.push({ season: asInt(row.index, 0), tier: oldTier.name, lp: asInt(row.bestLp, 0) });
    return {
      ...emptySeason(idx),
      badges: badges.slice(-12),
      defense: Array.isArray(row.defense) ? row.defense.map(x => ({ ...x })) : []
    };
  }
  return {
    index: idx,
    lp: Math.max(0, asInt(row.lp, 0)),
    bestLp: Math.max(0, asInt(row.bestLp, 0)),
    wins: Math.max(0, asInt(row.wins, 0)),
    losses: Math.max(0, asInt(row.losses, 0)),
    streak: Math.max(0, asInt(row.streak, 0)),
    bestStreak: Math.max(0, asInt(row.bestStreak, 0)),
    defense: Array.isArray(row.defense) ? row.defense.map(x => ({ ...x })) : [],
    claimed: Array.isArray(row.claimed) ? row.claimed.map(n => asInt(n, 0)) : [],
    badges: Array.isArray(row.badges) ? row.badges.slice() : [],
    uniqueWinTeams: Array.isArray(row.uniqueWinTeams) ? row.uniqueWinTeams.slice() : [],
    draftWins: Math.max(0, asInt(row.draftWins, 0))
  };
}

export function normalizeArenaPvE(src) {
  const row = src && typeof src === 'object' ? src : {};
  return {
    stage: Math.max(1, asInt(row.stage, 1)),
    cleared: Array.isArray(row.cleared) ? row.cleared.map(n => asInt(n, 0)) : []
  };
}

export function rivalPower(rank) {
  const lvl = Math.max(1, Math.min(30, 1 + Math.floor((1000 - asInt(rank, 1000)) / 33)));
  const stars = Math.max(1, Math.min(6, 1 + Math.floor((1000 - asInt(rank, 1000)) / 200)));
  return { lvl, stars };
}

export function rankCandidates(my) {
  const n = Math.max(1, asInt(my, 1000));
  return [...new Set([
    Math.max(1, Math.floor(n * 0.78)),
    Math.max(1, Math.floor(n * 0.9)),
    Math.max(1, n - 1)
  ])];
}

export function seasonLpDelta(myRank, rivalRank, win) {
  const my = asInt(myRank, 1000);
  const diff = Math.max(-300, Math.min(300, my - asInt(rivalRank, my)));
  const base = win ? 34 : -18;
  return win ? Math.round(base + diff / 30) : Math.round(base - Math.max(0, -diff) / 55);
}

export function seasonIndex(day) {
  return Math.floor(asInt(day, 0) / SEASON_LEN);
}

export function seasonDay(day) {
  const d = asInt(day, 0);
  return ((d % SEASON_LEN) + SEASON_LEN) % SEASON_LEN;
}

export function seasonWeek(day) {
  return Math.min(4, Math.floor(seasonDay(day) / 7));
}

export function currentSeasonRule(day) {
  return SEASON_RULES[seasonWeek(day)] || SEASON_RULES[0];
}

export function seasonTier(lp) {
  const L = asInt(lp, 0);
  if (L >= 1400) return { name: 'Mộng Vương', ic: '👑', next: null };
  if (L >= 1000) return { name: 'Kim Cương', ic: '💎', next: 1400 };
  if (L >= 700) return { name: 'Bạch Kim', ic: '🔷', next: 1000 };
  if (L >= 400) return { name: 'Vàng', ic: '🥇', next: 700 };
  if (L >= 180) return { name: 'Bạc', ic: '🥈', next: 400 };
  return { name: 'Đồng', ic: '🥉', next: 180 };
}

export function seasonPveScore({ towerBest = 0, rogueBest = 0, challengeStars = {} } = {}) {
  const tower = Math.max(0, asInt(towerBest, 0)) * 18;
  const rogue = Math.max(0, asInt(rogueBest, 0)) * 45;
  let stars = 0;
  if (challengeStars && typeof challengeStars === 'object') {
    Object.values(challengeStars).forEach(v => { stars += Number(v || 0); });
  }
  return tower + rogue + stars * 25;
}

export function arenaRivalKey(rival) {
  if (!rival) return '';
  const ids = (rival.team || []).map(x => typeof x === 'string' ? x : (x?.id || '')).join(',');
  return `${rival.net ? 'net' : 'local'}|${rival.user || rival.name || ''}|${rival.rank || 0}|${ids}`;
}

export function findPveStage(i) {
  return PVE_STAGES.find(st => st.i === asInt(i, 0)) || null;
}

function applyRankGems(arena, gems, mails, toasts) {
  let nextGems = gems;
  const claimed = arena.claimed.slice();
  for (const [t, g] of ARENA_RANK_GEMS) {
    if (arena.rank <= t && !claimed.includes(t)) {
      claimed.push(t);
      nextGems += g;
      toasts.push('🏅 Đạt hạng ' + t + ': +💎' + g);
      mails.push({
        from: 'Đấu Trường Mộng',
        title: 'Đạt hạng ' + t,
        body: 'Bảng xếp hạng đêm nay có tên anh.',
        gold: 200
      });
    }
  }
  arena.claimed = claimed;
  return nextGems;
}

function applyRivalryMilestones(rivalry, gold, gems, mails, toasts) {
  let nextGold = gold;
  let nextGems = gems;
  const claimed = rivalry.claimed.slice();
  for (const [mk, rw] of Object.entries(ARENA_RIVALRY_MILESTONES)) {
    const n = Number(mk);
    if (rivalry.marks >= n && !claimed.includes(n)) {
      claimed.push(n);
      nextGold += rw.gold;
      nextGems += rw.gems;
      toasts.push(`🏟 ${rw.label}: +🪙${rw.gold} · +💎${rw.gems}`);
      mails.push({
        from: 'Đấu Trường Mộng',
        title: rw.label,
        body: `Đạt ${n} Vinh Ấn tại Đấu Trường.`,
        gold: Math.round(rw.gold * 0.2)
      });
    }
  }
  rivalry.claimed = claimed;
  return { gold: nextGold, gems: nextGems };
}

function addDeed(rivalry, id, marks, label, toasts) {
  if (rivalry.deeds.includes(id)) return false;
  rivalry.deeds.push(id);
  rivalry.marks += marks;
  toasts.push(`🏅 Chiến Công: ${label} · +${marks} Vinh Ấn`);
  return true;
}

export function prepareRivalsLocal(player, { names, teams } = {}) {
  const arena = normalizeArena(player?.arena);
  const cand = rankCandidates(arena.rank);
  const nm = Array.isArray(names) && names.length ? names : ARENA_NAMES;
  const tm = Array.isArray(teams) ? teams : [];
  arena.rivals = cand.map((rk, i) => ({
    rank: rk,
    name: nm[i % nm.length],
    team: Array.isArray(tm[i]) ? tm[i].slice(0, 6) : []
  }));
  return {
    ok: true,
    arena,
    clearedChapters: Array.isArray(player?.clearedChapters) ? player.clearedChapters.slice() : []
  };
}

export function prepareArenaSettle(player, { win, rival, day } = {}) {
  if (!rival || typeof rival !== 'object') return arenaFail('NO_RIVAL', 'Không có đối thủ.');
  if (rival.net) return arenaFail('NET', 'Kèo mạng không đi qua domain local.');
  const arena = normalizeArena(player?.arena);
  const rivalry = normalizeRivalry(player?.arena?.rivalry, day);
  const oldRank = arena.rank;
  const key = arenaRivalKey(rival);
  const toasts = [];
  const mails = [];
  let gold = Math.max(0, asInt(player?.gold, 0));
  let gems = Math.max(0, asInt(player?.gems, 0));
  let so = Math.max(0, asInt(player?.so, 0));
  if (win) {
    rivalry.wins += 1;
    addDeed(rivalry, 'first', 1, 'Khai Trận Thắng', toasts);
    const jump = Math.max(0, oldRank - asInt(rival.rank, oldRank));
    const need = Math.max(25, Math.ceil(oldRank * 0.12));
    if (jump >= need) {
      rivalry.leaps += 1;
      addDeed(rivalry, 'leap', 2, `Bứt Hạng ${jump}`, toasts);
    }
    if (key && rivalry.grudges[key]) {
      delete rivalry.grudges[key];
      rivalry.revenges += 1;
      addDeed(rivalry, 'revenge', 2, 'Phục Hận Kình Địch', toasts);
    }
    arena.rank = Math.min(oldRank, asInt(rival.rank, oldRank));
    arena.best = Math.min(arena.best, arena.rank);
    gold += ARENA_WIN_GOLD;
    so += ARENA_SO_WIN;
    gems = applyRankGems(arena, gems, mails, toasts);
    toasts.push('Thắng ' + (rival.name || 'đối thủ') + '! Hạng ' + oldRank + ' → ' + arena.rank + ' · +🪙220');
  } else {
    rivalry.losses += 1;
    if (key) rivalry.grudges[key] = Date.now();
    toasts.push('Thua ' + (rival.name || 'đối thủ') + ' — đối thủ đã được ghi vào Kình Địch. Thắng lại chính kèo này để hoàn thành Phục Hận.');
  }
  const miles = applyRivalryMilestones(rivalry, gold, gems, mails, toasts);
  arena.rivalry = rivalry;
  return {
    ok: true,
    win: !!win,
    oldRank,
    arena,
    gold: miles.gold,
    gems: miles.gems,
    so,
    toasts,
    mails,
    refreshRivals: !!win,
    clearedChapters: Array.isArray(player?.clearedChapters) ? player.clearedChapters.slice() : []
  };
}

export function prepareSeasonSettle(player, { win, rival, squadIds, day } = {}) {
  const idx = seasonIndex(day);
  const season = normalizeSeason(player?.season, idx);
  const my = asInt(player?.arena?.rank, 1000);
  const delta = seasonLpDelta(my, rival?.rank, win);
  const old = season.lp;
  season.lp = Math.max(0, old + delta);
  season.bestLp = Math.max(season.bestLp, season.lp);
  let gold = Math.max(0, asInt(player?.gold, 0));
  if (win) {
    season.wins += 1;
    season.streak += 1;
    season.bestStreak = Math.max(season.bestStreak, season.streak);
    season.draftWins += 1;
    const sig = Array.isArray(squadIds) ? squadIds.slice().sort().join('|') : '';
    if (sig && !season.uniqueWinTeams.includes(sig)) season.uniqueWinTeams.push(sig);
    gold += SEASON_WIN_GOLD;
  } else {
    season.losses += 1;
    season.streak = 0;
  }
  const addBadge = (id, name) => {
    if (!season.badges.some(x => x && x.id === id && x.season === season.index)) {
      season.badges.push({ id, name, season: season.index });
    }
  };
  if (season.bestStreak >= 5) addBadge('streak5', 'Bất Bại Ngũ Trận');
  if (season.uniqueWinTeams.length >= 3) addBadge('flex3', 'Bách Biến Đội Hình');
  if (season.draftWins >= 10) addBadge('draft10', 'Kỳ Thủ Cấm Chọn');
  const tier = seasonTier(season.lp);
  return {
    ok: true,
    season,
    gold,
    lpDelta: delta,
    toast: `${win ? '🏆 Thắng' : '💤 Thua'} trận Mùa · LP ${old} → ${season.lp} (${delta >= 0 ? '+' : ''}${delta}) · ${tier.ic} ${tier.name}`,
    clearedChapters: Array.isArray(player?.clearedChapters) ? player.clearedChapters.slice() : []
  };
}

export function prepareSeasonClaim(player, lp, { day } = {}) {
  const need = asInt(lp, 0);
  const rw = SEASON_LP_MILESTONES[need];
  if (!rw) return arenaFail('NO_MILESTONE', 'Không có mốc LP này.');
  const season = normalizeSeason(player?.season, seasonIndex(day));
  if (season.lp < need) return arenaFail('NOT_ENOUGH_LP', 'Chưa đủ LP mốc này.');
  if (season.claimed.includes(need)) return arenaFail('CLAIMED', 'Đã nhận mốc này.');
  season.claimed = season.claimed.concat(need);
  return {
    ok: true,
    season,
    gems: Math.max(0, asInt(player?.gems, 0)) + rw.gems,
    gold: Math.max(0, asInt(player?.gold, 0)) + rw.gold,
    toast: `🎖 Mốc Mùa ${need} LP: +💎${rw.gems} · +🪙${rw.gold}`,
    clearedChapters: Array.isArray(player?.clearedChapters) ? player.clearedChapters.slice() : []
  };
}

export function prepareSeasonDefense(player, squad, { day } = {}) {
  const season = normalizeSeason(player?.season, seasonIndex(day));
  const list = Array.isArray(squad) ? squad : [];
  season.defense = list.map(x => ({
    id: x.id,
    row: x.row,
    build: x.build || 'balanced'
  }));
  return {
    ok: true,
    season,
    toast: '🛡 Đã khóa đội phòng thủ Mùa. Đổi đội tấn công sẽ không làm thay đổi snapshot này.',
    clearedChapters: Array.isArray(player?.clearedChapters) ? player.clearedChapters.slice() : []
  };
}

export function preparePveSettle(player, { win, stage } = {}) {
  const st = stage && typeof stage === 'object' ? stage : findPveStage(stage);
  if (!st) return arenaFail('NO_STAGE', 'Không có võ đài này.');
  const pve = normalizeArenaPvE(player?.arenaPvE);
  if (st.i > pve.stage) return arenaFail('LOCKED', 'Vượt võ đài trước đã.');
  if (!win) {
    return {
      ok: true,
      win: false,
      arenaPvE: pve,
      toast: 'Chưa qua ' + st.name + ' — nâng đội rồi phục thù.',
      clearedChapters: Array.isArray(player?.clearedChapters) ? player.clearedChapters.slice() : []
    };
  }
  let gold = Math.max(0, asInt(player?.gold, 0)) + PVE_WIN_GOLD;
  let gems = Math.max(0, asInt(player?.gems, 0));
  const shards = cloneMap(player?.shards);
  let msg = 'Vượt ' + st.name + ' · +🪙200';
  const first = !pve.cleared.includes(st.i);
  if (first) {
    pve.cleared = pve.cleared.concat(st.i);
    const rw = st.reward || {};
    if (rw.gems) {
      gems += asInt(rw.gems, 0);
      msg += ' · Lần đầu: 💎' + rw.gems;
    }
    if (rw.shards && rw.shardHero) {
      shards[rw.shardHero] = asInt(shards[rw.shardHero], 0) + asInt(rw.shards, 0);
      msg += (rw.gems ? '' : ' · Lần đầu:') + ' +' + rw.shards + ' mảnh';
    }
    pve.stage = Math.min(PVE_STAGES.length + 1, Math.max(pve.stage, st.i + 1));
  }
  return {
    ok: true,
    win: true,
    first,
    arenaPvE: pve,
    gold,
    gems,
    shards,
    toast: msg,
    clearedChapters: Array.isArray(player?.clearedChapters) ? player.clearedChapters.slice() : []
  };
}

export const LIVE_ARENA = Object.freeze({
  cost: ARENA_COST,
  winGold: ARENA_WIN_GOLD,
  seasonWinGold: SEASON_WIN_GOLD,
  pveWinGold: PVE_WIN_GOLD,
  seasonLen: SEASON_LEN,
  pveStages: PVE_STAGE_COUNT
});
