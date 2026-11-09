const huntFail = (code, message) => ({ ok: false, code, message });

export const HUNT_COST = 6;
export const HUNT_ATTEMPTS_PER_DAY = 2;
export const HUNT_TURN_LIMIT = 60;
export const HUNT_BOSS_HP_BASE = 45000;
export const HUNT_BOSS_HP_PER_CHAPTER = 0.35;
export const HUNT_ATK_PER_CHAPTER = 0.15;
export const HUNT_GOLD_PER_DMG = 40;
export const HUNT_SHARD_PER_DMG = 6000;
export const HUNT_KILL_GEMS = 40;
export const HUNT_KILL_MAIL_GOLD = 300;
export const HUNT_SO_PER_HUNT = 1;
export const HUNT_ADD_HP = 900;
export const HUNT_CORE_RATIO = 0.3;
export const HUNT_CORE_GOLD_BONUS = 0.25;
export const HUNT_CLEAN_EXTRA_SHARDS = 1;
export const HUNT_FINISHER_GEMS = 20;

export const HUNT_BOSSES = Object.freeze([
  Object.freeze({
    id: 'ca_voi_nuot_trang',
    name: 'Bạch Hổ Rừng Trúc',
    col: '#5a7fd6',
    drop: 'hon_cay_bang',
    desc: 'Hổ trắng vằn vàng canh miếu đá giữa rừng trúc. Hắc Liên Giáo trói nó bằng bùa, nó đánh cả kẻ đến cứu.',
    mech: Object.freeze({ name: 'Hổ Gầm Trúc Lâm', fx: Object.freeze({ kind: 'shield', target: 'aoe_ally', power: 1.0 }) })
  }),
  Object.freeze({
    id: 'nhen_det_ac_mong',
    name: 'Hắc Xà Đầm Lầy',
    col: '#8a5fae',
    drop: 'ong_ke_that_nghiep',
    desc: 'Rắn đen trăm năm dưới đầm lầy, nọc độc làm người trúng sợ hãi run tay, không cầm nổi kiếm.',
    mech: Object.freeze({ name: 'Nọc Độc Hắc Xà', fx: Object.freeze({ kind: 'fear', target: 'aoe_enemy', power: 1.0 }) })
  }),
  Object.freeze({
    id: 'dong_ho_cat_vo',
    name: 'Thiết Giáp Ngưu',
    col: '#d6b45a',
    drop: 'ky_lan_ca_phe',
    desc: 'Trâu sắt luyện từ lò đan Hắc Liên. Càng đánh lâu, nó càng húc nhanh.',
    mech: Object.freeze({ name: 'Cuồng Ngưu Xung Trận', fx: Object.freeze({ kind: 'haste', target: 'aoe_ally', power: 1.0 }) })
  })
]);

export const HUNT_CONTRACTS = Object.freeze({
  break_core: Object.freeze({
    name: 'Phá Lõi',
    icon: '🎯',
    desc: 'Trong một lần săn, gây ít nhất 30% Máu tối đa của boss.',
    marks: 1,
    reward: 'Hoàn thành: +1 Săn Ấn · +25% vàng của lần săn.'
  }),
  clean_field: Object.freeze({
    name: 'Quét Tay Chân',
    icon: '🧹',
    desc: 'Hạ cả hai tay chân phụ trợ của boss trong cùng một lần săn.',
    marks: 1,
    reward: 'Hoàn thành: +1 Săn Ấn · +1 mảnh tướng boss.'
  }),
  finisher: Object.freeze({
    name: 'Đoạt Mệnh',
    icon: '☠️',
    desc: 'Hạ gục boss trong chính lần săn này.',
    marks: 2,
    reward: 'Hoàn thành: +2 Săn Ấn · +20 ngọc.'
  })
});

export const HUNT_CONTRACT_IDS = Object.freeze(Object.keys(HUNT_CONTRACTS));

export const HUNT_MARK_MILESTONES = Object.freeze({
  3: Object.freeze({ gold: 250, gems: 5, label: 'Đọc Nhịp' }),
  7: Object.freeze({ gold: 500, gems: 10, shards: 1, label: 'Bóc Mộng' }),
  12: Object.freeze({ gold: 900, gems: 20, shards: 2, label: 'Thợ Săn Đêm' })
});

export const HUNT_MARK_KEYS = Object.freeze([3, 7, 12]);

export const LIVE_HUNT = Object.freeze({
  cost: HUNT_COST,
  attemptsPerDay: HUNT_ATTEMPTS_PER_DAY,
  turnLimit: HUNT_TURN_LIMIT,
  bosses: HUNT_BOSSES.length,
  contracts: HUNT_CONTRACT_IDS.length
});

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

function cloneClaimed(src) {
  const out = {};
  if (src && typeof src === 'object') {
    for (const key of Object.keys(src)) {
      out[key] = Array.isArray(src[key]) ? src[key].slice() : [];
    }
  }
  return out;
}

export function emptyHunt() {
  return {
    day: -1,
    attempts: HUNT_ATTEMPTS_PER_DAY,
    contract: null,
    contractDone: false,
    best: {},
    marks: {},
    claimedMarks: {}
  };
}

export function normalizeHunt(src, day) {
  const h = src && typeof src === 'object' ? src : {};
  const next = {
    day: asInt(h.day, -1),
    attempts: Math.max(0, asInt(h.attempts, HUNT_ATTEMPTS_PER_DAY)),
    contract: HUNT_CONTRACTS[h.contract] ? h.contract : null,
    contractDone: !!h.contractDone,
    best: cloneMap(h.best),
    marks: cloneMap(h.marks),
    claimedMarks: cloneClaimed(h.claimedMarks)
  };
  const d = asInt(day, next.day);
  if (next.day !== d) {
    next.day = d;
    next.attempts = HUNT_ATTEMPTS_PER_DAY;
    next.contract = null;
    next.contractDone = false;
  }
  return next;
}

export function todayBoss(day = 0) {
  const n = HUNT_BOSSES.length;
  const idx = ((asInt(day, 0) % n) + n) % n;
  return HUNT_BOSSES[idx];
}

export function chapterCount(chapters) {
  return Array.isArray(chapters) ? chapters.length : asInt(chapters, 0);
}

export function huntBossHp(chapters) {
  return Math.round(HUNT_BOSS_HP_BASE * (1 + HUNT_BOSS_HP_PER_CHAPTER * chapterCount(chapters)));
}

export function huntAtkMult(chapters) {
  return 1 + HUNT_ATK_PER_CHAPTER * chapterCount(chapters);
}

export function huntEncounter(day, chapters) {
  const bz = todayBoss(day);
  const am = huntAtkMult(chapters);
  return Object.freeze([
    Object.freeze({
      id: 'add1',
      name: 'Tay Chân',
      col: '#6a6f9a',
      row: 'back',
      slot: 3,
      huntForm: 'crystal',
      huntScale: 0.38,
      skill: null,
      stats: Object.freeze({ hp: HUNT_ADD_HP, atk: Math.round(110 * am), def: 50, spd: 96 })
    }),
    Object.freeze({
      id: 'huntboss',
      name: bz.name,
      col: bz.col,
      row: 'front',
      slot: 1,
      role: 'Boss Mộng',
      huntForm: bz.id,
      huntScale: 2.45,
      stats: Object.freeze({
        hp: huntBossHp(chapters),
        atk: Math.round(150 * am),
        def: 95,
        spd: 85
      }),
      skill: bz.mech
    }),
    Object.freeze({
      id: 'add2',
      name: 'Tay Chân',
      col: '#6a6f9a',
      row: 'back',
      slot: 5,
      huntForm: 'crystal',
      huntScale: 0.38,
      skill: null,
      stats: Object.freeze({ hp: HUNT_ADD_HP, atk: Math.round(105 * am), def: 50, spd: 92 })
    })
  ]);
}

export function huntMarkCount(hunt, bossId) {
  return asInt(hunt && hunt.marks && hunt.marks[bossId], 0);
}

function snapshot(player, day) {
  const p = player && typeof player === 'object' ? player : {};
  return {
    gold: asInt(p.gold, 0),
    gems: asInt(p.gems, 0),
    so: asInt(p.so, 0),
    stamina: asInt(p.stamina, 0),
    shards: cloneMap(p.shards),
    clearedChapters: Array.isArray(p.clearedChapters) ? p.clearedChapters.slice() : [],
    hunt: normalizeHunt(p.hunt, day)
  };
}

function withHunt(base, hunt, extra) {
  return {
    ok: true,
    gold: base.gold,
    gems: base.gems,
    so: base.so,
    stamina: base.stamina,
    shards: cloneMap(base.shards),
    clearedChapters: base.clearedChapters.slice(),
    hunt,
    toasts: [],
    mails: [],
    journals: [],
    chat: null,
    toast: '',
    ...extra
  };
}

export function prepareHuntDay(player, { day } = {}) {
  const src = player && typeof player === 'object' ? player : {};
  const prevDay = src.hunt && typeof src.hunt === 'object' ? asInt(src.hunt.day, -1) : -1;
  const d = asInt(day, prevDay);
  const hunt = normalizeHunt(src.hunt, d);
  const refreshed = prevDay !== d;
  return withHunt(snapshot(player, d), hunt, { refreshed });
}

export function prepareSelectContract(player, { id, day } = {}) {
  const d = asInt(day, 0);
  const base = snapshot(player, d);
  if (!HUNT_CONTRACTS[id]) return huntFail('UNKNOWN_CONTRACT', 'Săn Khế không tồn tại.');
  if (base.hunt.attempts < HUNT_ATTEMPTS_PER_DAY) {
    return huntFail('CONTRACT_LOCKED', 'Săn Khế đã khóa sau khi bắt đầu lần săn đầu tiên.');
  }
  const hunt = normalizeHunt(base.hunt, d);
  hunt.contract = id;
  hunt.contractDone = false;
  return withHunt(base, hunt, { contract: id });
}

export function prepareHuntStart(player, { day, stamina, chapters } = {}) {
  const d = asInt(day, 0);
  const base = snapshot(player, d);
  if (stamina != null) base.stamina = asInt(stamina, 0);
  if (chapters) base.clearedChapters = Array.isArray(chapters) ? chapters.slice() : base.clearedChapters;
  if (base.hunt.attempts <= 0) {
    return huntFail('NO_ATTEMPTS', 'Hết lượt săn hôm nay — mai boss lại trở mình.');
  }
  if (!base.hunt.contract) {
    return huntFail('NO_CONTRACT', 'Chọn một Săn Khế trước khi vào săn.');
  }
  if (base.stamina < HUNT_COST) {
    return huntFail('INSUFFICIENT_STAMINA', 'Không đủ Độ Tỉnh Táo ⚡');
  }
  const hunt = normalizeHunt(base.hunt, d);
  hunt.attempts -= 1;
  return withHunt(base, hunt, {
    stamina: base.stamina - HUNT_COST,
    encounter: huntEncounter(d, base.clearedChapters),
    boss: todayBoss(d)
  });
}

function pushMilestone(result, bz, key) {
  const rw = HUNT_MARK_MILESTONES[key];
  if (!rw) return;
  result.gold += rw.gold;
  result.gems += rw.gems;
  if (rw.shards) {
    result.shards[bz.drop] = asInt(result.shards[bz.drop], 0) + rw.shards;
  }
  result.mails.push({
    from: 'Đội Săn Mộng',
    title: `Mốc ${key} Săn Ấn — ${rw.label}`,
    body: `Kinh nghiệm săn ${bz.name} đã được ghi vào sổ đêm.`,
    gold: Math.round(rw.gold / 2)
  });
  result.toasts.push(`🏅 ${rw.label}: +🪙${rw.gold} · +💎${rw.gems}${rw.shards ? ` · +${rw.shards} mảnh` : ''}`);
}

function claimMilestones(result, bz) {
  const n = huntMarkCount(result.hunt, bz.id);
  const got = result.hunt.claimedMarks[bz.id] || [];
  result.hunt.claimedMarks[bz.id] = got;
  const claimed = [];
  for (const k of HUNT_MARK_KEYS) {
    if (n < k || got.includes(k)) continue;
    got.push(k);
    pushMilestone(result, bz, k);
    claimed.push(k);
  }
  return claimed;
}

export function prepareHuntSettle(player, { day, dmg, killed, addsDown, hpMax, chapters } = {}) {
  if (hpMax == null && dmg == null) return huntFail('MISSING_SNAPSHOT', 'Không có dữ liệu lần săn.');
  const d = asInt(day, 0);
  const base = snapshot(player, d);
  if (chapters) base.clearedChapters = Array.isArray(chapters) ? chapters.slice() : base.clearedChapters;
  const bz = todayBoss(d);
  const hunt = normalizeHunt(base.hunt, d);
  const damage = Math.max(0, asInt(dmg, 0));
  const maxHp = Math.max(1, asInt(hpMax, huntBossHp(base.clearedChapters)));
  const didKill = !!killed;
  const fieldClear = !!addsDown;
  let goldGain = Math.floor(damage / HUNT_GOLD_PER_DMG);
  let shardGain = Math.floor(damage / HUNT_SHARD_PER_DMG);
  const cid = hunt.contract;
  const contract = HUNT_CONTRACTS[cid];
  let contractOK = false;
  let contractBonus = '';
  if (!hunt.contractDone && cid === 'break_core') contractOK = damage >= maxHp * HUNT_CORE_RATIO;
  if (!hunt.contractDone && cid === 'clean_field') contractOK = fieldClear;
  if (!hunt.contractDone && cid === 'finisher') contractOK = didKill;
  const result = withHunt(base, hunt, {
    gold: base.gold,
    gems: base.gems,
    so: base.so + HUNT_SO_PER_HUNT,
    dmg: damage,
    killed: didKill,
    addsDown: fieldClear,
    boss: bz,
    contractId: cid || null,
    contractOK: false
  });
  if (contractOK && contract) {
    hunt.contractDone = true;
    hunt.marks[bz.id] = huntMarkCount(hunt, bz.id) + (contract.marks || 0);
    if (cid === 'break_core') {
      const bonus = Math.floor(goldGain * HUNT_CORE_GOLD_BONUS);
      goldGain += bonus;
      contractBonus = ` · Săn Khế +🪙${bonus}`;
    }
    if (cid === 'clean_field') {
      shardGain += HUNT_CLEAN_EXTRA_SHARDS;
      contractBonus = ' · Săn Khế +1 mảnh';
    }
    if (cid === 'finisher') {
      result.gems += HUNT_FINISHER_GEMS;
      contractBonus = ' · Săn Khế +💎20';
    }
    result.journals.push(`Hoàn thành Săn Khế ${contract.name} trước ${bz.name}.`);
    result.contractOK = true;
  }
  result.gold += goldGain;
  if (shardGain > 0) result.shards[bz.drop] = asInt(result.shards[bz.drop], 0) + shardGain;
  if (didKill) {
    result.gems += HUNT_KILL_GEMS;
    result.journals.push('Đội hạ ' + bz.name + '. Đêm nay thành phố dễ thở hơn một chút.');
    result.mails.push({
      from: 'Đội Săn Mộng',
      title: 'Đã hạ ' + bz.name,
      body: 'Chiến lợi phẩm chia phần anh.',
      gold: HUNT_KILL_MAIL_GOLD
    });
    result.chat = bz.name + ' đã ngã trước đội của anh!';
  }
  hunt.best[bz.id] = Math.max(asInt(hunt.best[bz.id], 0), damage);
  result.milestones = claimMilestones(result, bz);
  result.goldGain = goldGain;
  result.shardGain = shardGain;
  result.toast = 'Săn xong: ' + damage + ' sát thương · +🪙' + goldGain
    + (shardGain ? (' · +' + shardGain + ' mảnh') : '')
    + (didKill ? ' · HẠ GỤC! +💎40' : '')
    + (result.contractOK ? contractBonus : '');
  result.toasts.unshift(result.toast);
  return result;
}
