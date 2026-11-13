const rogueFail = (code, message) => ({ ok: false, code, message });

export const ROGUE_MAX_FLOOR = 5;
export const ROGUE_REROLL_COST = 2;
export const ROGUE_REROLL_MAX = 1;
export const ROGUE_GOLD_BASE = 180;
export const ROGUE_GOLD_PER_FLOOR = 90;
export const ROGUE_CLEAR_GEMS = 80;
export const ROGUE_CLEAR_GEMS_PER_SIGIL = 2;
export const ROGUE_CLEAR_GEMS_SIGIL_CAP = 20;
export const ROGUE_SCALE_PER_FLOOR = 0.18;
export const ROGUE_SPD_PER_FLOOR = 0.025;

export const ROGUE_BLESSINGS = Object.freeze({
  blood: Object.freeze({ id: 'blood', name: 'Huyết Chiến', desc: '+14% Công toàn đội.', atk: 0.14 }),
  iron: Object.freeze({ id: 'iron', name: 'Thiết Trận', desc: '+18% HP và +10% Thủ.', hp: 0.18, def: 0.10 }),
  tempo: Object.freeze({ id: 'tempo', name: 'Tiên Cơ', desc: '+12% Tốc và +18 Nộ khai trận.', speed: 0.12, energy: 18 }),
  focus: Object.freeze({ id: 'focus', name: 'Tâm Nhãn', desc: '+12% Chính xác, +10% Bạo kích.', accuracy: 0.12, crit: 0.10 }),
  ember: Object.freeze({ id: 'ember', name: 'Dư Hỏa', desc: '+8% Công, +8% HP; cân bằng để đi sâu.', atk: 0.08, hp: 0.08 })
});

export const ROGUE_BLESSING_IDS = Object.freeze(Object.keys(ROGUE_BLESSINGS));

export const ROGUE_ROUTES = Object.freeze({
  steady: Object.freeze({
    id: 'steady',
    icon: '🛡',
    name: 'Lối Sáng',
    desc: 'Địch -5% Công. Thưởng vàng -10%. Không nhận Huyền Ấn.',
    enemyHp: 1,
    enemyAtk: 0.95,
    reward: 0.90,
    sigil: 0
  }),
  mist: Object.freeze({
    id: 'mist',
    icon: '🌫',
    name: 'Lối Sương',
    desc: 'Địch chuẩn. Thưởng vàng +10%. Thắng nhận 1 Huyền Ấn.',
    enemyHp: 1,
    enemyAtk: 1,
    reward: 1.10,
    sigil: 1
  }),
  rift: Object.freeze({
    id: 'rift',
    icon: '🌀',
    name: 'Lối Nứt',
    desc: 'Địch +10% HP, +8% Công. Thưởng vàng +30%. Thắng nhận 2 Huyền Ấn.',
    enemyHp: 1.10,
    enemyAtk: 1.08,
    reward: 1.30,
    sigil: 2
  })
});

export const ROGUE_ROUTE_IDS = Object.freeze(['steady', 'mist', 'rift']);

function asInt(value, fallback = 0) {
  const n = Math.floor(Number(value));
  return Number.isFinite(n) ? n : fallback;
}

export function emptyRogue() {
  return {
    active: false,
    floor: 0,
    maxFloor: ROGUE_MAX_FLOOR,
    blessings: [],
    wins: 0,
    best: 0,
    earnedGold: 0,
    pending: false,
    route: null,
    sigils: 0,
    rerolls: 0,
    offer: []
  };
}

export function findRogueBlessing(id) {
  return ROGUE_BLESSINGS[id] || null;
}

export function findRogueRoute(id) {
  return ROGUE_ROUTES[id] || null;
}

export function normalizeRogue(rogue) {
  const next = emptyRogue();
  if (!rogue || typeof rogue !== 'object') return next;
  next.active = !!rogue.active;
  next.floor = Math.max(0, asInt(rogue.floor, 0));
  next.maxFloor = ROGUE_MAX_FLOOR;
  next.blessings = Array.isArray(rogue.blessings)
    ? rogue.blessings.filter(id => findRogueBlessing(id))
    : [];
  next.wins = Math.max(0, asInt(rogue.wins, 0));
  next.best = Math.max(0, asInt(rogue.best, 0));
  next.earnedGold = Math.max(0, asInt(rogue.earnedGold, 0));
  next.pending = !!rogue.pending;
  next.route = findRogueRoute(rogue.route) ? rogue.route : null;
  next.sigils = Math.max(0, asInt(rogue.sigils, 0));
  next.rerolls = Math.max(0, asInt(rogue.rerolls, 0));
  next.offer = Array.isArray(rogue.offer)
    ? rogue.offer.filter(id => findRogueBlessing(id))
    : [];
  if (next.active && next.floor < 1) next.floor = 1;
  if (!next.active) {
    next.floor = 0;
    next.pending = false;
    next.route = null;
    next.offer = [];
  }
  if (next.pending && !next.offer.length) next.offer = makeRogueOffer(next);
  return next;
}

export function makeRogueOffer(rogue) {
  const r = rogue && typeof rogue === 'object' ? rogue : emptyRogue();
  const owned = new Set(Array.isArray(r.blessings) ? r.blessings : []);
  const pool = ROGUE_BLESSING_IDS.filter(id => !owned.has(id));
  if (!pool.length) return [];
  const shift = (asInt(r.floor, 0) + asInt(r.wins, 0) + asInt(r.rerolls, 0)) % pool.length;
  const n = Math.min(3, pool.length);
  return Array.from({ length: n }, (_, i) => pool[(shift + i) % pool.length]);
}

export function rogueGoldGain(floor, route) {
  const f = Math.max(1, asInt(floor, 1));
  const base = ROGUE_GOLD_BASE + f * ROGUE_GOLD_PER_FLOOR;
  const mult = route && Number.isFinite(Number(route.reward)) ? Number(route.reward) : 1;
  return Math.round(base * mult);
}

export function rogueClearGems(sigils) {
  return ROGUE_CLEAR_GEMS + Math.min(
    ROGUE_CLEAR_GEMS_SIGIL_CAP,
    Math.max(0, asInt(sigils, 0)) * ROGUE_CLEAR_GEMS_PER_SIGIL
  );
}

export function rogueBlessingMods(blessingIds) {
  const mods = { hp: 0, atk: 0, def: 0, speed: 0, energy: 0, accuracy: 0, crit: 0 };
  const ids = Array.isArray(blessingIds) ? blessingIds : [];
  for (const id of ids) {
    const b = findRogueBlessing(id);
    if (!b) continue;
    mods.hp += b.hp || 0;
    mods.atk += b.atk || 0;
    mods.def += b.def || 0;
    mods.speed += b.speed || 0;
    mods.energy += b.energy || 0;
    mods.accuracy += b.accuracy || 0;
    mods.crit += b.crit || 0;
  }
  return mods;
}

export function rogueEncounterUnits(rogue, heroes) {
  const r = normalizeRogue(rogue);
  const floor = Math.max(1, r.floor || 1);
  const list = Array.isArray(heroes) ? heroes.filter(h => h && h.stats) : [];
  const scale = 1 + (floor - 1) * ROGUE_SCALE_PER_FLOOR;
  const boss = floor >= r.maxFloor;
  const route = boss ? { enemyHp: 1, enemyAtk: 1 } : (findRogueRoute(r.route) || ROGUE_ROUTES.mist);
  const count = boss ? 4 : 6;
  return Array.from({ length: count }, (_, i) => {
    const hero = list.length ? list[(floor * 3 + i) % list.length] : {
      id: 'shadow',
      name: 'Bóng Hắc Liên',
      col: '#6a5a40',
      row: i < 3 ? 'front' : 'back',
      role: 'warrior',
      skill: null,
      stats: { hp: 600, atk: 90, def: 40, spd: 90 }
    };
    const st = hero.stats;
    const isLord = boss && i === 1;
    return {
      id: 'rogue_' + floor + '_' + i + '_' + (hero.id || 'x'),
      sourceHeroId: hero.id || null,
      name: isLord ? ('Đầu Lĩnh · ' + hero.name) : hero.name,
      col: hero.col,
      row: i < 3 ? 'front' : 'back',
      role: hero.role,
      skill: isLord
        ? { name: 'Hắc Ám Chồng Tầng', fx: { kind: 'fear', target: 'aoe_enemy', power: 1.05 } }
        : hero.skill,
      stats: {
        hp: Math.round(st.hp * scale * (isLord ? 2.2 : 1) * (route.enemyHp || 1)),
        atk: Math.round(st.atk * scale * (isLord ? 1.25 : 1) * (route.enemyAtk || 1)),
        def: Math.round(st.def * scale),
        spd: Math.round(st.spd * (1 + (floor - 1) * ROGUE_SPD_PER_FLOOR))
      }
    };
  });
}

export function prepareRogueStart(player) {
  const prev = normalizeRogue(player?.rogue);
  const rogue = emptyRogue();
  rogue.active = true;
  rogue.floor = 1;
  rogue.best = prev.best;
  return { ok: true, rogue };
}

export function prepareRogueAbandon(player) {
  const prev = normalizeRogue(player?.rogue);
  const rogue = emptyRogue();
  rogue.best = prev.best;
  return { ok: true, rogue };
}

export function prepareRogueChooseRoute(player, id) {
  const rogue = normalizeRogue(player?.rogue);
  if (!rogue.active || rogue.pending || rogue.floor >= rogue.maxFloor) {
    return rogueFail('ROUTE_LOCKED', 'Không đổi Ngã Rẽ lúc này.');
  }
  if (!findRogueRoute(id)) return rogueFail('UNKNOWN_ROUTE', 'Ngã Rẽ không hợp lệ.');
  rogue.route = id;
  return { ok: true, rogue };
}

export function prepareRogueChooseBlessing(player, id) {
  const rogue = normalizeRogue(player?.rogue);
  if (!rogue.active || !rogue.pending) {
    return rogueFail('NOT_PENDING', 'Chưa đến lúc chọn Phúc Duyên.');
  }
  if (!rogue.offer.includes(id) || !findRogueBlessing(id)) {
    return rogueFail('UNKNOWN_BLESSING', 'Phúc này không nằm trong bộ đang mở.');
  }
  rogue.blessings = rogue.blessings.concat(id);
  rogue.pending = false;
  rogue.offer = [];
  rogue.floor += 1;
  rogue.route = null;
  rogue.rerolls = 0;
  return { ok: true, rogue, blessing: findRogueBlessing(id) };
}

export function prepareRogueReroll(player) {
  const rogue = normalizeRogue(player?.rogue);
  if (!rogue.active || !rogue.pending) {
    return rogueFail('NOT_PENDING', 'Chưa đến lúc đổi Phúc Duyên.');
  }
  if (rogue.rerolls >= ROGUE_REROLL_MAX) {
    return rogueFail('REROLL_USED', 'Mỗi tầng chỉ đổi Phúc một lần.');
  }
  if (rogue.sigils < ROGUE_REROLL_COST) {
    return rogueFail('NOT_ENOUGH_SIGILS', 'Cần 2 Huyền Ấn để đổi bộ Phúc.');
  }
  rogue.sigils -= ROGUE_REROLL_COST;
  rogue.rerolls += 1;
  rogue.offer = makeRogueOffer(rogue);
  return { ok: true, rogue };
}

export function prepareRogueFight(player) {
  const rogue = normalizeRogue(player?.rogue);
  if (!rogue.active || rogue.pending) {
    return rogueFail('NOT_READY', 'Chưa thể xuất chiến.');
  }
  const boss = rogue.floor >= rogue.maxFloor;
  if (!boss && !rogue.route) {
    return rogueFail('NEED_ROUTE', 'Chọn một Ngã Rẽ trước khi xuất chiến.');
  }
  const route = boss ? null : findRogueRoute(rogue.route);
  return {
    ok: true,
    rogue,
    floor: rogue.floor,
    boss,
    route,
    encounter: rogueEncounterUnits(rogue, player?.heroList)
  };
}

export function prepareRogueWin(player, { floor, routeId } = {}) {
  const rogue = normalizeRogue(player?.rogue);
  const fought = Math.max(1, asInt(floor, rogue.floor));
  if (!rogue.active) return rogueFail('NO_RUN', 'Không có run đang mở.');
  if (rogue.pending) return rogueFail('ALREADY_PENDING', 'Tầng này đã thắng, hãy chọn Phúc.');
  if (rogue.floor !== fought) return rogueFail('STALE_FLOOR', 'Tầng này đã được chốt.');
  const boss = fought >= rogue.maxFloor;
  const route = boss ? null : (findRogueRoute(routeId !== undefined ? routeId : rogue.route) || findRogueRoute(rogue.route));
  const goldGain = rogueGoldGain(fought, route);
  const sigilGain = route ? route.sigil : 0;
  rogue.earnedGold += goldGain;
  rogue.sigils += sigilGain;
  rogue.wins += 1;
  rogue.best = Math.max(rogue.best, fought);
  rogue.route = null;
  rogue.rerolls = 0;
  let gemsGain = 0;
  let cleared = false;
  if (boss) {
    gemsGain = rogueClearGems(rogue.sigils);
    rogue.active = false;
    rogue.floor = 0;
    rogue.pending = false;
    rogue.offer = [];
    cleared = true;
  } else {
    rogue.pending = true;
    rogue.offer = makeRogueOffer(rogue);
  }
  return {
    ok: true,
    passed: true,
    cleared,
    rogue,
    gold: Math.max(0, asInt(player?.gold, 0)) + goldGain,
    gems: Math.max(0, asInt(player?.gems, 0)) + gemsGain,
    goldGain,
    gemsGain,
    sigilGain,
    floorCleared: fought,
    route,
    clearedChapters: Array.isArray(player?.clearedChapters) ? player.clearedChapters.slice() : []
  };
}

export function prepareRogueLose(player) {
  const prev = normalizeRogue(player?.rogue);
  if (!prev.active) return rogueFail('NO_RUN', 'Không có run đang mở.');
  const rogue = emptyRogue();
  rogue.best = prev.best;
  rogue.wins = prev.wins;
  rogue.earnedGold = prev.earnedGold;
  rogue.sigils = prev.sigils;
  rogue.blessings = prev.blessings.slice();
  return {
    ok: true,
    passed: false,
    rogue,
    gold: Math.max(0, asInt(player?.gold, 0)),
    gems: Math.max(0, asInt(player?.gems, 0)),
    clearedChapters: Array.isArray(player?.clearedChapters) ? player.clearedChapters.slice() : []
  };
}
