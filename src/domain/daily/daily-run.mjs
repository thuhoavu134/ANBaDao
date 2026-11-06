import { DAILY_DRIP, WEEKLY_DRIP, applyDripTable } from '../economy/balance.mjs';

const dailyFail = (code, message) => ({ ok: false, code, message });
const balancedQuests = (quests, table) => Object.freeze(quests.map(q => Object.freeze({
  ...q, reward: Object.freeze(applyDripTable(q.id, q.reward, table))
})));

export const DAILY_STAM_CAP = 120;
export const DAILY_REGEN_MS = 5 * 60 * 1000;
export const DAILY_NAP_GAIN = 50;
export const DAILY_NAP_NOON = Object.freeze({ start: 11, end: 14 });
export const DAILY_NAP_EVE = Object.freeze({ start: 18, end: 21 });
export const DAILY_IDLE_CAP_H = 12;
export const DAILY_IDLE_GOLD_PER_H = 60;
export const DAILY_IDLE_EXP_PER_H = 40;
export const DAILY_IDLE_MIN_H = 0.02;
export const DAILY_IDLE_PET_MULT = 1.15;
export const DAILY_SIGNIN_SO = 1;
export const DAILY_MEO_MUN_STAM = 2;
export const DAILY_JOURNAL_MAX = 40;
export const DAILY_CLAN_XP_PER_QUEST = 5;
export const DAILY_CALENDAR_DAYS = 28;

export const DAILY_QUESTS = balancedQuests([
  Object.freeze({ id: 'q_win', text: 'Thắng 3 trận', type: 'win', goal: 3, reward: Object.freeze({ gold: 200 }), pts: 15 }),
  Object.freeze({ id: 'q_skill', text: 'Dùng chiêu chữ ký 5 lần', type: 'skill', goal: 5, reward: Object.freeze({ gold: 150 }), pts: 10 }),
  Object.freeze({ id: 'q_idle', text: 'Nhận thưởng Ca Trực Đêm 1 lần', type: 'idle', goal: 1, reward: Object.freeze({ gems: 20 }), pts: 10 }),
  Object.freeze({ id: 'q_train', text: 'Luyện tập 2 trận', type: 'train', goal: 2, reward: Object.freeze({ gold: 180 }), pts: 10 }),
  Object.freeze({ id: 'q_level', text: 'Nâng cấp 1 anh hùng', type: 'level', goal: 1, reward: Object.freeze({ gold: 160 }), pts: 10 }),
  Object.freeze({ id: 'q_summon', text: 'Chiêu mộ 1 lần', type: 'summon', goal: 1, reward: Object.freeze({ gold: 150 }), pts: 10 }),
  Object.freeze({ id: 'q_tower', text: 'Leo Thông Thiên Tháp 1 tầng', type: 'tower', goal: 1, reward: Object.freeze({ gold: 180 }), pts: 10 }),
  Object.freeze({ id: 'q_shop', text: 'Mua 1 món ở Hắc Thị', type: 'shop', goal: 1, reward: Object.freeze({ gold: 150 }), pts: 10 }),
  Object.freeze({ id: 'q_arena', text: 'Khiêu chiến Đấu Trường 1 trận', type: 'arena', goal: 1, reward: Object.freeze({ gold: 200 }), pts: 10 }),
  Object.freeze({ id: 'q_hunt', text: 'Săn Boss Mộng 1 lượt', type: 'hunt', goal: 1, reward: Object.freeze({ gold: 200 }), pts: 10 }),
  Object.freeze({ id: 'q_hoadang', text: 'Thả 1 hoa đăng', type: 'hoadang', goal: 1, reward: Object.freeze({ gold: 150 }), pts: 10 }),
  Object.freeze({ id: 'q_spin', text: 'Quay sò 1 lần', type: 'spin', goal: 1, reward: Object.freeze({ gold: 150 }), pts: 10 }),
  Object.freeze({ id: 'q_craft', text: 'Rèn 1 món trang bị', type: 'craft', goal: 1, reward: Object.freeze({ gold: 120, tinh: 10, hoat: 10 }), pts: 10 }),
  Object.freeze({ id: 'q_guild', text: 'Cống hiến Bang Hội 1 lần', type: 'guild', goal: 1, reward: Object.freeze({ gold: 180 }), pts: 10 })
], DAILY_DRIP);

export const DAILY_QUEST_IDS = Object.freeze(DAILY_QUESTS.map(q => q.id));
export const DAILY_QUEST_COUNT = DAILY_QUESTS.length;

export const ACT_MILESTONES = Object.freeze([
  Object.freeze({ p: 20, reward: Object.freeze({ gold: 200 }) }),
  Object.freeze({ p: 40, reward: Object.freeze({ gems: 20 }) }),
  Object.freeze({ p: 60, reward: Object.freeze({ gold: 400 }) }),
  Object.freeze({ p: 80, reward: Object.freeze({ gems: 50 }) })
]);

export const WEEKLY_QUESTS = balancedQuests([
  Object.freeze({ id: 'w_win', text: 'Thắng 12 trận', type: 'win', goal: 12, pts: 25, reward: Object.freeze({ gold: 650 }) }),
  Object.freeze({ id: 'w_rogue', text: 'Vượt 6 tầng Mộng Lộ', type: 'rogue', goal: 6, pts: 30, reward: Object.freeze({ gems: 45 }) }),
  Object.freeze({ id: 'w_hunt', text: 'Săn Boss Mộng 4 lượt', type: 'hunt', goal: 4, pts: 20, reward: Object.freeze({ gold: 500 }) }),
  Object.freeze({ id: 'w_build', text: 'Đổi build trước trận 3 lần', type: 'build', goal: 3, pts: 15, reward: Object.freeze({ gold: 360 }) }),
  Object.freeze({ id: 'w_campaign', text: 'Hoàn thành 3 chương/trận chiến dịch', type: 'campaign', goal: 3, pts: 20, reward: Object.freeze({ gems: 30 }) })
], WEEKLY_DRIP);

export const WEEKLY_QUEST_IDS = Object.freeze(WEEKLY_QUESTS.map(q => q.id));
export const WEEKLY_QUEST_COUNT = WEEKLY_QUESTS.length;

export const WEEKLY_MILESTONES = Object.freeze([
  Object.freeze({ p: 25, reward: Object.freeze({ gold: 500 }) }),
  Object.freeze({ p: 50, reward: Object.freeze({ gems: 40 }) }),
  Object.freeze({ p: 75, reward: Object.freeze({ gold: 900 }) }),
  Object.freeze({ p: 100, reward: Object.freeze({ gems: 90 }) })
]);

export const DAILY_JOURNAL_TPL = Object.freeze({
  ong_hang_pho: Object.freeze([
    'Ông Phở hầm một nồi xuyên đêm. Sáng ra, nước dùng thơm cả khu mộng.',
    'Có kẻ khóc bên gánh phở đêm. Ông múc thêm một vá, không lấy tiền.'
  ]),
  ong_chu_wifi: Object.freeze([
    'Chú Wifi ngồi canh cột sóng cả ca. Cả đội không ai bị rớt mạng giữa mơ.',
    'Đường truyền đêm nay mượt lạ. Chắc chú lại thức.'
  ]),
  meo_9_deadline: Object.freeze([
    'Con Mèo 9 chạy hết chín việc trước bình minh. Rồi lăn ra thở.',
    'Nghe tiếng gõ phím suốt đêm. Mèo lại đua deadline của ai đó.'
  ]),
  ky_lan_ca_phe: Object.freeze([
    'Kỳ Lân khuấy cà phê tới sáng, canh cho cả đội đừng chìm vào giấc.',
    'Mùi espresso lởn vởn cả ca trực. Ai đó nhờ vậy mà tỉnh.'
  ]),
  _default: Object.freeze([
    'Một đêm trực yên. Mộng Giới bớt tối đi một chút.',
    'Ca đêm trôi qua. Ai đó ngoài kia ngủ ngon hơn nhờ đội mình.'
  ])
});

export const LIVE_DAILY = Object.freeze({
  stamCap: DAILY_STAM_CAP,
  regenMs: DAILY_REGEN_MS,
  napGain: DAILY_NAP_GAIN,
  idleCapH: DAILY_IDLE_CAP_H,
  idleGoldPerH: DAILY_IDLE_GOLD_PER_H,
  idleExpPerH: DAILY_IDLE_EXP_PER_H,
  questCount: DAILY_QUEST_COUNT,
  journalMax: DAILY_JOURNAL_MAX,
  act: Object.freeze(ACT_MILESTONES.map(m => m.p)),
  weekly: Object.freeze(WEEKLY_MILESTONES.map(m => m.p))
});

export const LICH_LUYEN_SPOKES = Object.freeze([
  Object.freeze({ key: 'campaign', label: 'Qua Ải Mộng', sub: 'Trảm Tướng', go: 'campaign', ch: 0, angle: 0, icon: 'campaign' }),
  Object.freeze({ key: 'train', label: 'Giáo Trường', sub: 'Luyện Tâm', go: 'train', ch: 0, angle: 33, icon: 'train' }),
  Object.freeze({ key: 'tower', label: 'Thông Thiên Tháp', sub: 'Bảo Vệ', go: 'tower', ch: 1, angle: 65, icon: 'tower' }),
  Object.freeze({ key: 'hold', label: 'Trì Thủ Phố Đêm', sub: 'Sắp mở', go: null, ch: 99, angle: 98, icon: 'hold' }),
  Object.freeze({ key: 'arena', label: 'Đấu Trường', sub: 'Đoạt Kỳ', go: 'arena', ch: 3, angle: 131, icon: 'arena' }),
  Object.freeze({ key: 'expedition', label: 'Mộng Lộ', sub: 'Khám Phá', go: 'expedition', ch: 2, angle: 164, icon: 'expedition' }),
  Object.freeze({ key: 'forgegate', label: 'Lò Ải Thiên Công', sub: 'Sắp mở', go: null, ch: 99, angle: 196, icon: 'forgegate' }),
  Object.freeze({ key: 'hunt', label: 'Săn Boss', sub: 'Bí Mật', go: 'hunt', ch: 3, angle: 229, icon: 'hunt' }),
  Object.freeze({ key: 'abyss', label: 'Vực Sâu Tiềm Long', sub: 'Sắp mở', go: null, ch: 99, angle: 262, icon: 'abyss' }),
  Object.freeze({ key: 'palace', label: 'Vận Cơ Thiên Cung', sub: 'Sắp mở', go: null, ch: 99, angle: 295, icon: 'palace' }),
  Object.freeze({ key: 'drill', label: 'Chỉnh Lý Liệt Binh', sub: 'Sắp mở', go: null, ch: 99, angle: 327, icon: 'drill' })
]);

export const LICH_LUYEN_SPOKE_COUNT = LICH_LUYEN_SPOKES.length;
export const LICH_LUYEN_KEYS = Object.freeze(LICH_LUYEN_SPOKES.map(s => s.key));

export function lichSpokeLocked(spoke, clearedCount = 0) {
  if (!spoke || spoke.go == null) return true;
  return asInt(clearedCount, 0) < asInt(spoke.ch, 0);
}

export function prepareLichEnter(player, key) {
  const spoke = LICH_LUYEN_SPOKES.find(s => s.key === key);
  if (!spoke) return dailyFail('UNKNOWN_GATE', 'Cổng ải này không có trên bánh xe.');
  const n = Array.isArray(player?.clearedChapters) ? player.clearedChapters.length : 0;
  if (lichSpokeLocked(spoke, n)) {
    const need = asInt(spoke.ch, 1);
    const msg = spoke.go == null
      ? ('🔒 ' + spoke.label + ' — sắp mở.')
      : ('🔒 ' + spoke.label + ' mở sau khi vượt ' + need + ' chương.');
    return dailyFail('LOCKED', msg);
  }
  return {
    ok: true,
    spoke,
    go: spoke.go,
    clearedChapters: Array.isArray(player?.clearedChapters) ? player.clearedChapters.slice() : []
  };
}

function asInt(value, fallback = 0) {
  const n = Math.floor(Number(value));
  return Number.isFinite(n) ? n : fallback;
}

export function dailyDayIndex(now = Date.now(), tzOffsetMin = new Date().getTimezoneOffset()) {
  return Math.floor((Number(now) - asInt(tzOffsetMin, 0) * 60000) / 86400000);
}

export function weeklyWeekIndex(day) {
  return Math.floor(asInt(day, 0) / 7);
}

export function signInReward(n) {
  const day = asInt(n, 0);
  if (day % 28 === 0) return { gems: 120, label: '💎 120' };
  if (day % 14 === 0) return { gems: 60, label: '💎 60' };
  if (day % 7 === 0) return { gems: 30, label: '💎 30' };
  return { gold: 120, label: '🪙 120' };
}

export function napWindowOpen(which, hour) {
  const h = asInt(hour, -1);
  if (which === 'noon') return h >= DAILY_NAP_NOON.start && h < DAILY_NAP_NOON.end;
  if (which === 'eve') return h >= DAILY_NAP_EVE.start && h < DAILY_NAP_EVE.end;
  return false;
}

export function rollQuests() {
  return DAILY_QUESTS.map(q => ({ id: q.id, progress: 0, claimed: false }));
}

export function weeklyQuestState() {
  return WEEKLY_QUESTS.map(q => ({ id: q.id, progress: 0, claimed: false }));
}

export function emptyDaily() {
  return {
    dayIndex: -1,
    lastLoginDay: -1,
    signInDay: 0,
    signInClaimedDay: -1,
    streak: 1,
    quests: [],
    activityPoints: 0,
    actClaimed: [],
    napNoon: false,
    napEve: false
  };
}

export function emptyWeekly(weekIndex = -1) {
  return {
    weekIndex: asInt(weekIndex, -1),
    points: 0,
    claimed: [],
    quests: weeklyQuestState()
  };
}

function cloneQuests(list, catalog) {
  const src = Array.isArray(list) ? list : [];
  const byId = new Map(src.map(q => [q && q.id, q]));
  return catalog.map(def => {
    const raw = byId.get(def.id);
    return {
      id: def.id,
      progress: Math.max(0, asInt(raw && raw.progress, 0)),
      claimed: !!(raw && raw.claimed),
      ...(raw?.variant === 'accessible' ? { variant: 'accessible' } : {})
    };
  });
}

export function normalizeDaily(daily) {
  const next = emptyDaily();
  if (!daily || typeof daily !== 'object') return next;
  next.dayIndex = asInt(daily.dayIndex, -1);
  next.lastLoginDay = asInt(daily.lastLoginDay, -1);
  next.signInDay = Math.max(0, asInt(daily.signInDay, 0));
  next.signInClaimedDay = asInt(daily.signInClaimedDay, -1);
  next.streak = Math.max(0, asInt(daily.streak, 1));
  next.quests = cloneQuests(daily.quests, DAILY_QUESTS);
  next.activityPoints = Math.max(0, asInt(daily.activityPoints, 0));
  next.actClaimed = Array.isArray(daily.actClaimed)
    ? daily.actClaimed.map(p => asInt(p, 0)).filter(p => ACT_MILESTONES.some(m => m.p === p))
    : [];
  next.napNoon = !!daily.napNoon;
  next.napEve = !!daily.napEve;
  return next;
}

export function normalizeWeekly(weekly) {
  const next = emptyWeekly();
  if (!weekly || typeof weekly !== 'object') return next;
  next.weekIndex = asInt(weekly.weekIndex, -1);
  next.points = Math.max(0, asInt(weekly.points, 0));
  next.claimed = Array.isArray(weekly.claimed)
    ? weekly.claimed.map(p => asInt(p, 0)).filter(p => WEEKLY_MILESTONES.some(m => m.p === p))
    : [];
  next.quests = cloneQuests(weekly.quests, WEEKLY_QUESTS);
  return next;
}

function cloneDaily(daily) {
  return normalizeDaily(daily);
}

function cloneWeekly(weekly) {
  return normalizeWeekly(weekly);
}

function cloneGuild(guild) {
  if (!guild || typeof guild !== 'object') return null;
  const next = { ...guild };
  next.bought = Array.isArray(guild.bought) ? guild.bought.slice() : [];
  return next;
}

function purseOf(player) {
  return {
    gold: Math.max(0, asInt(player?.gold, 0)),
    gems: Math.max(0, asInt(player?.gems, 0)),
    tinh: Math.max(0, asInt(player?.tinh, 0)),
    hoat: Math.max(0, asInt(player?.hoat, 0)),
    so: Math.max(0, asInt(player?.so, 0)),
    stamina: Math.max(0, asInt(player?.stamina, 0))
  };
}

function applyReward(purse, rw) {
  const next = { ...purse };
  if (!rw || typeof rw !== 'object') return next;
  if (rw.gold) next.gold += asInt(rw.gold, 0);
  if (rw.gems) next.gems += asInt(rw.gems, 0);
  if (rw.tinh) next.tinh += asInt(rw.tinh, 0);
  if (rw.hoat) next.hoat += asInt(rw.hoat, 0);
  return next;
}

function chaptersOf(player) {
  return Array.isArray(player?.clearedChapters) ? player.clearedChapters.slice() : [];
}

// Keep each quest's receipt ID, reward and points. A replacement is locked for
// its day/week so unlocking a district cannot change a partially completed goal.
const QUEST_ACCESS = Object.freeze({
  q_summon: { feature: 'summon', ch: 1, type: 'win', goal: 1, text: 'Thắng 1 trận để dựng đội' },
  q_tower: { feature: 'tower', ch: 1, type: 'win', goal: 1, text: 'Thắng 1 trận chuẩn bị leo Tháp' },
  q_arena: { feature: 'arena', ch: 3, type: 'train', goal: 1, text: 'Luyện tập 1 trận chuẩn bị Đấu Trường' },
  q_hunt: { feature: 'hunt', ch: 3, type: 'win', goal: 2, text: 'Thắng 2 trận chuẩn bị săn Boss' },
  q_craft: { feature: 'forge', ch: 1, type: 'train', goal: 1, text: 'Luyện tập 1 trận tích nguyên liệu Rèn' },
  q_guild: { feature: 'guild', ch: 4, type: 'train', goal: 1, text: 'Luyện tập 1 trận chuẩn bị vào Bang' },
  q_hoadang: { feature: 'festival', ch: 0, type: 'train', goal: 1, text: 'Luyện tập 1 trận' },
  q_spin: { feature: 'festival', ch: 0, type: 'train', goal: 1, text: 'Luyện tập 1 trận tích nguyên liệu' },
  q_level: { type: 'win', goal: 1, text: 'Thắng 1 trận với đội đã đạt cấp tối đa' },
  w_rogue: { feature: 'expedition', ch: 2, type: 'win', goal: 6, text: 'Thắng 6 trận chuẩn bị Mộng Lộ' },
  w_hunt: { feature: 'hunt', ch: 3, type: 'win', goal: 4, text: 'Thắng 4 trận chuẩn bị săn Boss' }
});

function accessibleDefinition(catalog, state, id) {
  const def = catalog.find(q => q.id === id);
  if (!def) return null;
  const q = state?.quests?.find(q => q.id === id), alt = QUEST_ACCESS[id];
  return q?.variant === 'accessible' && alt
    ? { ...def, type: alt.type, goal: alt.goal, text: alt.text } : def;
}

export function dailyQuestDefinition(player, id) {
  return accessibleDefinition(DAILY_QUESTS, player?.daily, id);
}

export function weeklyQuestDefinition(player, id) {
  return accessibleDefinition(WEEKLY_QUESTS, player?.weekly, id);
}

function assignAccessibleQuests(state, player, opts) {
  let changed = false;
  const owned = Object.values(player?.heroes || {}).filter(h => h?.owned);
  for (const q of state.quests) {
    const alt = QUEST_ACCESS[q.id];
    if (!alt || q.variant || q.claimed || q.progress > 0) continue;
    const configured = opts.featureUnlocks?.[alt.feature]?.ch;
    const needed = Number.isFinite(Number(configured)) ? Number(configured) : alt.ch;
    const unavailable = alt.feature
      ? chaptersOf(player).length < needed
      : owned.length > 0 && owned.every(h => asInt(h.level, 1) >= 30);
    if (unavailable) { q.variant = 'accessible'; changed = true; }
  }
  return changed;
}

export function dailyRewardItems(reward = {}) {
  return [
    ['gold', '🪙', 'Vàng'], ['gems', '💎', 'Ngọc'], ['tinh', '✦', 'Tinh'],
    ['hoat', '✧', 'Hoạt'], ['so', '🐚', 'Sò'], ['stamina', '⚡', 'Thể lực'],
    ['playerXp', '✹', 'EXP tài khoản']
  ].filter(([key]) => asInt(reward[key], 0) > 0)
    .map(([key, icon, label]) => ({ icon, label, value: asInt(reward[key], 0) }));
}

export function chapterMultOf(player) {
  return 1 + chaptersOf(player).length * 0.5;
}

export function idlePreview(player, opts = {}) {
  const now = Number(opts.now);
  const claimedAt = Number(player?.idle?.claimedAt);
  const tNow = Number.isFinite(now) ? now : Date.now();
  const tClaim = Number.isFinite(claimedAt) ? claimedAt : tNow;
  const hrs = Math.min(Math.max(0, (tNow - tClaim) / 3600000), DAILY_IDLE_CAP_H);
  const chapterMult = chapterMultOf(player);
  const guild = Number(opts.guildIdleMult);
  const clan = Number(opts.clanIdleMult);
  const gMult = Number.isFinite(guild) ? guild : 1;
  const cMult = Number.isFinite(clan) ? clan : 1;
  const gold = Math.floor(hrs * DAILY_IDLE_GOLD_PER_H * chapterMult * gMult * cMult);
  return { hrs, gold, chapterMult };
}

export function prepareDailyOpen(player, opts = {}) {
  const day = asInt(opts.day, dailyDayIndex(opts.now, opts.tzOffsetMin));
  const weekIndex = asInt(opts.weekIndex, weeklyWeekIndex(day));
  const daily = normalizeDaily(player?.daily);
  const weekly = normalizeWeekly(player?.weekly);
  let nextDaily = daily;
  let nextWeekly = weekly;
  let nextGuild = cloneGuild(player?.guild);
  let refreshed = false;
  if (daily.dayIndex !== day) {
    nextDaily = {
      dayIndex: day,
      lastLoginDay: day,
      signInDay: daily.signInDay,
      signInClaimedDay: -1,
      streak: daily.streak,
      quests: rollQuests(),
      activityPoints: 0,
      actClaimed: [],
      napNoon: false,
      napEve: false
    };
    if (nextGuild) {
      nextGuild.donated = false;
      nextGuild.bought = [];
    }
    refreshed = true;
  }
  if (weekly.weekIndex !== weekIndex) {
    nextWeekly = emptyWeekly(weekIndex);
    refreshed = true;
  }
  const dailyAssignmentsChanged = assignAccessibleQuests(nextDaily, player, opts);
  const weeklyAssignmentsChanged = assignAccessibleQuests(nextWeekly, player, opts);
  return {
    ok: true,
    daily: nextDaily,
    weekly: nextWeekly,
    guild: nextGuild,
    refreshed,
    assignmentsChanged: dailyAssignmentsChanged || weeklyAssignmentsChanged,
    day,
    weekIndex,
    clearedChapters: chaptersOf(player)
  };
}

function openedState(player, opts) {
  const opened = prepareDailyOpen(player, opts);
  return {
    ...opened,
    daily: cloneDaily(opened.daily),
    weekly: cloneWeekly(opened.weekly),
    guild: opened.guild ? cloneGuild(opened.guild) : null
  };
}

export function prepareSignIn(player, opts = {}) {
  const opened = openedState(player, opts);
  const day = opened.day;
  const daily = opened.daily;
  if (daily.signInClaimedDay === day) {
    return dailyFail('ALREADY_CLAIMED', 'Đã điểm danh hôm nay.');
  }
  const n = daily.signInDay + 1;
  const rw = signInReward(n);
  const purse = applyReward(purseOf(player), rw);
  purse.so += DAILY_SIGNIN_SO;
  const stamCap = Math.max(1, asInt(opts.stamCap, DAILY_STAM_CAP));
  if (opts.petMeoMun) {
    purse.stamina = Math.min(stamCap, purse.stamina + DAILY_MEO_MUN_STAM);
  }
  daily.signInDay = n;
  daily.signInClaimedDay = day;
  daily.streak = (daily.streak || 0) + 1;
  return {
    ok: true,
    daily,
    weekly: opened.weekly,
    guild: opened.guild,
    gold: purse.gold,
    gems: purse.gems,
    tinh: purse.tinh,
    hoat: purse.hoat,
    so: purse.so,
    stamina: purse.stamina,
    n,
    rw,
    journals: [`Điểm danh ngày ${n} · nhận ${rw.label}.`],
    refreshed: opened.refreshed,
    clearedChapters: opened.clearedChapters
  };
}

export function prepareNap(player, which, opts = {}) {
  const slot = which === 'noon' ? 'noon' : (which === 'eve' ? 'eve' : null);
  if (!slot) return dailyFail('UNKNOWN_WINDOW', 'Khung chợp mắt không đúng.');
  const opened = openedState(player, opts);
  const daily = opened.daily;
  if (slot === 'noon' && daily.napNoon) return dailyFail('NAP_DONE', 'Đã chợp mắt trưa hôm nay.');
  if (slot === 'eve' && daily.napEve) return dailyFail('NAP_DONE', 'Đã chợp mắt tối hôm nay.');
  const stamCap = Math.max(1, asInt(opts.stamCap, DAILY_STAM_CAP));
  const stam = Math.max(0, asInt(player?.stamina, 0));
  const nextStam = Math.min(stamCap, stam + DAILY_NAP_GAIN);
  if (slot === 'noon') daily.napNoon = true;
  else daily.napEve = true;
  return {
    ok: true,
    daily,
    weekly: opened.weekly,
    guild: opened.guild,
    stamina: nextStam,
    which: slot,
    gain: nextStam - stam,
    refreshed: opened.refreshed,
    clearedChapters: opened.clearedChapters
  };
}

function pickIdleJournal(player, rng) {
  const squad = Array.isArray(player?.squad) ? player.squad.map(s => s && s.id).filter(Boolean) : [];
  const roll = typeof rng === 'function' ? Number(rng()) : 0;
  const n = Number.isFinite(roll) ? Math.min(0.999999, Math.max(0, roll)) : 0;
  const id = squad.length ? squad[(n * squad.length) | 0] : null;
  const tpl = (id && DAILY_JOURNAL_TPL[id]) || DAILY_JOURNAL_TPL._default;
  const line = tpl[(n * tpl.length) | 0];
  return { text: line, heroId: id };
}

export function prepareClaimIdle(player, opts = {}) {
  const preview = idlePreview(player, opts);
  if (preview.hrs < DAILY_IDLE_MIN_H) {
    return dailyFail('IDLE_TOO_EARLY', 'Ca trực chưa đủ lâu.');
  }
  let goldGain = preview.gold;
  if (opts.petGaBaoThuc) goldGain = Math.round(goldGain * DAILY_IDLE_PET_MULT);
  const now = Number(opts.now);
  const tNow = Number.isFinite(now) ? now : Date.now();
  const purse = purseOf(player);
  const journal = pickIdleJournal(player, opts.rng);
  const opened = openedState(player, opts);
  return {
    ok: true,
    daily: opened.daily,
    weekly: opened.weekly,
    guild: opened.guild,
    idle: { claimedAt: tNow },
    gold: purse.gold + goldGain,
    goldGain,
    hrs: preview.hrs,
    chapterMult: preview.chapterMult,
    journals: journal.text ? [journal.text] : [],
    journalHeroId: journal.heroId,
    refreshed: opened.refreshed,
    clearedChapters: opened.clearedChapters
  };
}

export function prepareClaimQuest(player, id, opts = {}) {
  const opened = openedState(player, opts);
  const daily = opened.daily;
  const key = String(id || '');
  const q = daily.quests.find(x => x.id === key);
  const def = dailyQuestDefinition({ daily }, key);
  if (!q || !def) return dailyFail('UNKNOWN_QUEST', 'Việc vặt này không có trong sổ.');
  if (q.claimed) return dailyFail('ALREADY_CLAIMED', 'Đã nhận việc này.');
  if (q.progress < def.goal) return dailyFail('NOT_DONE', 'Chưa làm xong việc này.');
  q.claimed = true;
  daily.activityPoints = (daily.activityPoints || 0) + def.pts;
  const purse = applyReward(purseOf(player), def.reward);
  return {
    ok: true,
    daily,
    weekly: opened.weekly,
    guild: opened.guild,
    gold: purse.gold,
    gems: purse.gems,
    tinh: purse.tinh,
    hoat: purse.hoat,
    clanXp: DAILY_CLAN_XP_PER_QUEST,
    def,
    refreshed: opened.refreshed,
    clearedChapters: opened.clearedChapters
  };
}

export function prepareClaimActMilestone(player, p, opts = {}) {
  const opened = openedState(player, opts);
  const daily = opened.daily;
  const mark = asInt(p, 0);
  const m = ACT_MILESTONES.find(x => x.p === mark);
  if (!m) return dailyFail('UNKNOWN_MILESTONE', 'Mốc Sôi Nổi không đúng.');
  if (daily.activityPoints < mark) return dailyFail('NOT_ENOUGH_POINTS', 'Chưa đủ điểm Sôi Nổi.');
  if (daily.actClaimed.includes(mark)) return dailyFail('ALREADY_CLAIMED', 'Đã nhận mốc này.');
  daily.actClaimed = daily.actClaimed.concat(mark);
  const purse = applyReward(purseOf(player), m.reward);
  return {
    ok: true,
    daily,
    weekly: opened.weekly,
    guild: opened.guild,
    gold: purse.gold,
    gems: purse.gems,
    tinh: purse.tinh,
    hoat: purse.hoat,
    p: mark,
    reward: m.reward,
    refreshed: opened.refreshed,
    clearedChapters: opened.clearedChapters
  };
}

export function prepareClaimWeeklyQuest(player, id, opts = {}) {
  const opened = openedState(player, opts);
  const weekly = opened.weekly;
  const key = String(id || '');
  const q = weekly.quests.find(x => x.id === key);
  const def = weeklyQuestDefinition({ weekly }, key);
  if (!q || !def) return dailyFail('UNKNOWN_QUEST', 'Việc tuần này không có trong sổ.');
  if (q.claimed) return dailyFail('ALREADY_CLAIMED', 'Đã nhận việc tuần này.');
  if (q.progress < def.goal) return dailyFail('NOT_DONE', 'Chưa làm xong việc tuần.');
  q.claimed = true;
  weekly.points = (weekly.points || 0) + def.pts;
  const purse = applyReward(purseOf(player), def.reward);
  return {
    ok: true,
    daily: opened.daily,
    weekly,
    guild: opened.guild,
    gold: purse.gold,
    gems: purse.gems,
    tinh: purse.tinh,
    hoat: purse.hoat,
    def,
    refreshed: opened.refreshed,
    clearedChapters: opened.clearedChapters
  };
}

export function prepareClaimWeeklyMilestone(player, p, opts = {}) {
  const opened = openedState(player, opts);
  const weekly = opened.weekly;
  const mark = asInt(p, 0);
  const m = WEEKLY_MILESTONES.find(x => x.p === mark);
  if (!m) return dailyFail('UNKNOWN_MILESTONE', 'Mốc Danh Vọng không đúng.');
  if (weekly.points < mark) return dailyFail('NOT_ENOUGH_POINTS', 'Chưa đủ điểm Danh Vọng.');
  if (weekly.claimed.includes(mark)) return dailyFail('ALREADY_CLAIMED', 'Đã nhận mốc tuần này.');
  weekly.claimed = weekly.claimed.concat(mark);
  const purse = applyReward(purseOf(player), m.reward);
  return {
    ok: true,
    daily: opened.daily,
    weekly,
    guild: opened.guild,
    gold: purse.gold,
    gems: purse.gems,
    tinh: purse.tinh,
    hoat: purse.hoat,
    p: mark,
    reward: m.reward,
    refreshed: opened.refreshed,
    clearedChapters: opened.clearedChapters
  };
}

export function appendJournal(journal, entry, max = DAILY_JOURNAL_MAX) {
  const list = Array.isArray(journal) ? journal.slice() : [];
  list.unshift(entry);
  if (list.length > max) list.length = max;
  return list;
}
