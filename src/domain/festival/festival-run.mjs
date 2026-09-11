const festivalFail = (code, message) => ({ ok: false, code, message });

export const HOADANG_PER_DAY = 5;
export const HOADANG_COST = 100;
export const TAM_NGUYEN_GOLD = 150;
export const TAM_NGUYEN_GEMS = 5;
export const BACH_BAO_COST = 1;
export const BACH_BAO_SLOT_COUNT = 20;
export const FESTIVAL_STAM_CAP = 120;
export const FESTIVAL_EQUIP_SLOTS = Object.freeze(['weapon', 'armor', 'charm', 'boots']);
export const FESTIVAL_MOLD_IDS = Object.freeze(['strike', 'ward', 'tempo']);

export const HOADANG_WISHES = Object.freeze([
  'Mong mai dậy không mệt.',
  'Mong deadline tự xong.',
  'Mong ai đó ngủ ngon đêm nay.',
  'Mong nồi phở không bao giờ cạn.',
  'Mong wifi cả xóm chạy êm.',
  'Mong mưa xong trời có cầu vồng.',
  'Mong người đi xa gọi về.',
  'Mong giấc mơ xấu tan trước bình minh.',
  'Mong chợ đêm còn mở mãi.',
  'Mong thành phố sớm thức dậy.'
]);

export const LANTERN_THEMES = Object.freeze({
  ankhang: Object.freeze({
    id: 'ankhang',
    ic: '🍵',
    name: 'An Khang',
    desc: 'Ước cho sức khỏe và một đêm yên. Thiên về Thể Lực và vàng.',
    weights: Object.freeze([
      Object.freeze(['stam', 10, 40]),
      Object.freeze(['gold', 220, 35]),
      Object.freeze(['shard', 3, 15]),
      Object.freeze(['gems', 15, 10])
    ])
  }),
  duyenpho: Object.freeze({
    id: 'duyenpho',
    ic: '🧧',
    name: 'Duyên Phố',
    desc: 'Ước cho người và phố còn nhớ nhau. Thiên về mảnh tướng và ngọc.',
    weights: Object.freeze([
      Object.freeze(['shard', 3, 40]),
      Object.freeze(['gems', 15, 25]),
      Object.freeze(['gold', 220, 25]),
      Object.freeze(['stam', 10, 10])
    ])
  }),
  khailo: Object.freeze({
    id: 'khailo',
    ic: '🪁',
    name: 'Khai Lộ',
    desc: 'Ước cho con đường ngày mai rộng hơn. Cân bằng vàng, ngọc và tài nguyên.',
    weights: Object.freeze([
      Object.freeze(['gold', 220, 40]),
      Object.freeze(['gems', 15, 30]),
      Object.freeze(['stam', 10, 15]),
      Object.freeze(['shard', 3, 15])
    ])
  })
});

export const LANTERN_THEME_IDS = Object.freeze(Object.keys(LANTERN_THEMES));

export const FESTIVAL_MARKS = Object.freeze([
  Object.freeze({ n: 3, name: 'Người Giữ Đèn', reward: Object.freeze({ gold: 500, gems: 15 }) }),
  Object.freeze({ n: 7, name: 'Bạn Của Sông Mơ', reward: Object.freeze({ gold: 900, gems: 25 }) }),
  Object.freeze({ n: 12, name: 'Người Gọi Bình Minh', reward: Object.freeze({ gold: 1500, gems: 40 }) })
]);

export const FESTIVAL_MARK_KEYS = Object.freeze(FESTIVAL_MARKS.map(m => m.n));

export const BACH_BAO_SLOTS = Object.freeze([
  Object.freeze({ t: 'gold', v: 260, ic: '🪙', l: '260 Vàng' }),
  Object.freeze({ t: 'gems', v: 18, ic: '💎', l: '18 Ngọc' }),
  Object.freeze({ t: 'sh_ss', v: 8, ic: '🧩', l: '8 mảnh SS' }),
  Object.freeze({ t: 'tinh', v: 25, ic: '⚗️', l: '25 Tinh Lực' }),
  Object.freeze({ t: 'gold', v: 420, ic: '🪙', l: '420 Vàng' }),
  Object.freeze({ t: 'stam', v: 22, ic: '⚡', l: '22 Tỉnh Táo' }),
  Object.freeze({ t: 'chest', ic: '🎁', l: 'Rương Báu', chest: 1 }),
  Object.freeze({ t: 'sh_ssr', v: 10, ic: '🌟', l: '10 mảnh SSR' }),
  Object.freeze({ t: 'hoat', v: 26, ic: '🔥', l: '26 Hoạt Lực' }),
  Object.freeze({ t: 'gems', v: 28, ic: '💎', l: '28 Ngọc' }),
  Object.freeze({ t: 'gold', v: 520, ic: '🪙', l: '520 Vàng' }),
  Object.freeze({ t: 'sh_ss', v: 12, ic: '🧩', l: '12 mảnh SS' }),
  Object.freeze({ t: 'chest', ic: '🎁', l: 'Rương Báu', chest: 1 }),
  Object.freeze({ t: 'tinh', v: 40, ic: '⚗️', l: '40 Tinh Lực' }),
  Object.freeze({ t: 'gems', v: 36, ic: '💎', l: '36 Ngọc' }),
  Object.freeze({ t: 'sh_ssr', v: 14, ic: '🌟', l: '14 mảnh SSR' }),
  Object.freeze({ t: 'stam', v: 35, ic: '⚡', l: '35 Tỉnh Táo' }),
  Object.freeze({ t: 'gold', v: 680, ic: '🪙', l: '680 Vàng' }),
  Object.freeze({ t: 'hoat', v: 40, ic: '🔥', l: '40 Hoạt Lực' }),
  Object.freeze({ t: 'supreme', ic: '👑', l: 'Rương Chí Bảo', chest: 2 })
]);

export const LIVE_FESTIVAL = Object.freeze({
  perDay: HOADANG_PER_DAY,
  lanternCost: HOADANG_COST,
  themes: LANTERN_THEME_IDS.length,
  marks: FESTIVAL_MARK_KEYS.slice(),
  wheel: BACH_BAO_SLOT_COUNT,
  spinCost: BACH_BAO_COST,
  chestBau: Object.freeze({ ss30: 35, ssr20: 33, equip5: 22, gems120: 10 }),
  chestSupreme: Object.freeze({ ssr40: 45, equip10: 40, ssr60: 15 })
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

function cloneList(src) {
  return Array.isArray(src) ? src.map(item => (item && typeof item === 'object' ? { ...item } : item)) : [];
}

function rng01(rng) {
  const n = typeof rng === 'function' ? Number(rng()) : Math.random();
  if (!Number.isFinite(n)) return 0;
  return Math.min(0.999999999, Math.max(0, n));
}

function pickId(list, rng) {
  const arr = Array.isArray(list) ? list.filter(Boolean) : [];
  if (!arr.length) return null;
  return arr[(rng01(rng) * arr.length) | 0];
}

function heroName(catalog, id) {
  const row = catalog && catalog[id];
  return (row && row.name) || id || 'Kẻ Mất Ngủ';
}

function heroPools(heroes, rosterIds) {
  const catalog = heroes && typeof heroes === 'object' && !Array.isArray(heroes) ? heroes : {};
  const all = Object.keys(catalog);
  const roster = Array.isArray(rosterIds) && rosterIds.length ? rosterIds.filter(id => catalog[id]) : all;
  return {
    catalog,
    all,
    ss: roster.filter(id => catalog[id] && catalog[id].rarity === 'ss'),
    ssr: roster.filter(id => catalog[id] && catalog[id].rarity === 'ssr')
  };
}

export function emptyHoadang() {
  return {
    day: -1,
    count: 0,
    theme: 'ankhang',
    themesUsed: [],
    marks: 0,
    claimedMarks: [],
    wishLog: [],
    setClaimed: false
  };
}

export function emptyBachBao() {
  return { spins: 0, chests: 0, supreme: 0, opened: 0, history: [] };
}

export function normalizeHoadang(src, day) {
  const h = src && typeof src === 'object' ? src : {};
  const next = {
    day: asInt(h.day, -1),
    count: Math.max(0, asInt(h.count, 0)),
    theme: LANTERN_THEMES[h.theme] ? h.theme : 'ankhang',
    themesUsed: Array.isArray(h.themesUsed) ? h.themesUsed.filter(id => LANTERN_THEMES[id]) : [],
    marks: Math.max(0, asInt(h.marks, 0)),
    claimedMarks: Array.isArray(h.claimedMarks) ? h.claimedMarks.map(n => asInt(n, 0)).filter(n => n > 0) : [],
    wishLog: cloneList(h.wishLog).slice(0, 12),
    setClaimed: !!h.setClaimed
  };
  const d = asInt(day, next.day);
  if (next.day !== d) {
    next.day = d;
    next.count = 0;
    next.themesUsed = [];
    next.setClaimed = false;
  }
  return next;
}

export function normalizeBachBao(src) {
  const b = src && typeof src === 'object' ? src : {};
  return {
    spins: Math.max(0, asInt(b.spins, 0)),
    chests: Math.max(0, asInt(b.chests, 0)),
    supreme: Math.max(0, asInt(b.supreme, 0)),
    opened: Math.max(0, asInt(b.opened, 0)),
    history: cloneList(b.history).slice(0, 12)
  };
}

function snapshot(player, day) {
  const p = player && typeof player === 'object' ? player : {};
  return {
    gold: asInt(p.gold, 0),
    gems: asInt(p.gems, 0),
    so: asInt(p.so, 0),
    stamina: asInt(p.stamina, 0),
    tinh: asInt(p.tinh, 0),
    hoat: asInt(p.hoat, 0),
    shards: cloneMap(p.shards),
    inventory: cloneList(p.inventory),
    itemSeq: asInt(p.itemSeq, 0),
    clearedChapters: Array.isArray(p.clearedChapters) ? p.clearedChapters.slice() : [],
    hoadang: normalizeHoadang(p.hoadang, day),
    bachBao: normalizeBachBao(p.bachBao)
  };
}

function withFest(base, extra) {
  return {
    ok: true,
    gold: base.gold,
    gems: base.gems,
    so: base.so,
    stamina: base.stamina,
    tinh: base.tinh,
    hoat: base.hoat,
    shards: cloneMap(base.shards),
    inventory: cloneList(base.inventory),
    itemSeq: base.itemSeq,
    clearedChapters: base.clearedChapters.slice(),
    hoadang: normalizeHoadang(base.hoadang, base.hoadang.day),
    bachBao: normalizeBachBao(base.bachBao),
    toasts: [],
    journals: [],
    toast: '',
    ...extra
  };
}

function pushHistory(bachBao, row, now) {
  const next = normalizeBachBao(bachBao);
  next.history.unshift({ kind: row.kind, label: row.label, t: asInt(now, Date.now()) });
  if (next.history.length > 12) next.history.length = 12;
  return next;
}

export function rollWeighted(weights, rng) {
  const arr = Array.isArray(weights) ? weights : [];
  const total = arr.reduce((sum, row) => sum + asInt(row && row[2], 0), 0);
  let r = rng01(rng) * (total || 1);
  let pick = arr[0] || ['gold', 0, 1];
  for (const row of arr) {
    if (r < row[2]) {
      pick = row;
      break;
    }
    r -= row[2];
  }
  return pick;
}

export function rollLanternGrant(theme, rng, pools) {
  const t = theme && theme.weights ? theme : LANTERN_THEMES.ankhang;
  const picked = rollWeighted(t.weights, rng);
  const type = picked[0];
  const val = picked[1];
  if (type === 'gold') return { type: 'gold', qty: val, label: '🪙 ' + val };
  if (type === 'gems') return { type: 'gems', qty: val, label: '💎 ' + val };
  if (type === 'stam') return { type: 'stam', qty: val, label: '⚡ ' + val };
  const heroId = pickId((pools && pools.all) || [], rng) || pickId((pools && pools.ssr) || [], rng);
  return {
    type: 'shards',
    qty: val,
    rarity: 'any',
    heroId,
    label: val + ' mảnh ' + heroName(pools && pools.catalog, heroId)
  };
}

export function pickBachBaoIndex(rng) {
  return Math.floor(rng01(rng) * BACH_BAO_SLOTS.length);
}

function giveHeroShards(rarity, qty, rng, pools) {
  const pool = rarity === 'ssr' ? (pools.ssr || []) : (pools.ss || []);
  const heroId = pickId(pool, rng) || pickId(pools.all, rng);
  const tag = rarity === 'ssr' ? ' (SSR)' : '';
  return {
    type: 'shards',
    rarity,
    qty,
    heroId,
    label: qty + ' mảnh ' + heroName(pools.catalog, heroId) + tag
  };
}

function giveEquip(lvl, rng) {
  const slot = pickId(FESTIVAL_EQUIP_SLOTS, rng) || 'weapon';
  const mold = pickId(FESTIVAL_MOLD_IDS, rng) || 'strike';
  return {
    type: 'equip',
    rar: 'ssr',
    lvl,
    slot,
    mold,
    label: 'SSR +' + lvl + ' · ' + slot + ' · ' + mold
  };
}

export function rollChestTable(kind, rng, pools) {
  const r = rng01(rng) * 100;
  if (kind === 'supreme') {
    if (r < 45) return giveHeroShards('ssr', 40, rng, pools);
    if (r < 85) return giveEquip(10, rng);
    return giveHeroShards('ssr', 60, rng, pools);
  }
  if (r < 35) return giveHeroShards('ss', 30, rng, pools);
  if (r < 68) return giveHeroShards('ssr', 20, rng, pools);
  if (r < 90) return giveEquip(5, rng);
  return { type: 'gems', qty: 120, label: '120 Ngọc' };
}

function applyGrant(result, grant, stamCap) {
  if (!grant) return;
  if (grant.type === 'gold') result.gold += grant.qty;
  else if (grant.type === 'gems') result.gems += grant.qty;
  else if (grant.type === 'stam') {
    result.stamina = Math.min(asInt(stamCap, FESTIVAL_STAM_CAP), result.stamina + grant.qty);
  } else if (grant.type === 'tinh') result.tinh += grant.qty;
  else if (grant.type === 'hoat') result.hoat += grant.qty;
  else if (grant.type === 'shards' && grant.heroId) {
    result.shards[grant.heroId] = asInt(result.shards[grant.heroId], 0) + grant.qty;
  } else if (grant.type === 'equip') {
    result.itemSeq += 1;
    result.inventory.push({
      uid: result.itemSeq,
      slot: grant.slot,
      rar: 'ssr',
      lvl: grant.lvl,
      mold: grant.mold
    });
  }
}

function slotGrant(slot, rng, pools) {
  if (slot.t === 'gold') return { type: 'gold', qty: slot.v, label: '🪙 ' + slot.v + ' Vàng' };
  if (slot.t === 'gems') return { type: 'gems', qty: slot.v, label: '💎 ' + slot.v + ' Ngọc' };
  if (slot.t === 'stam') return { type: 'stam', qty: slot.v, label: '⚡ ' + slot.v + ' Độ Tỉnh Táo' };
  if (slot.t === 'tinh') return { type: 'tinh', qty: slot.v, label: '⚗ ' + slot.v + ' Tinh Lực' };
  if (slot.t === 'hoat') return { type: 'hoat', qty: slot.v, label: '🔥 ' + slot.v + ' Hoạt Lực' };
  if (slot.t === 'sh_ss') return giveHeroShards('ss', slot.v, rng, pools);
  if (slot.t === 'sh_ssr') return giveHeroShards('ssr', slot.v, rng, pools);
  if (slot.t === 'chest') return { type: 'chest', qty: 1, label: '🎁 Rương Báu ×1 — mở rương để nhận bảo vật' };
  return { type: 'supreme', qty: 1, label: '👑 Rương Chí Bảo ×1 — có thể ra trang bị SSR cực phẩm' };
}

function claimMilestones(result) {
  const got = [];
  const claimed = result.hoadang.claimedMarks;
  for (const mark of FESTIVAL_MARKS) {
    if (result.hoadang.marks >= mark.n && !claimed.includes(mark.n)) {
      claimed.push(mark.n);
      result.gold += mark.reward.gold;
      result.gems += mark.reward.gems;
      got.push(mark);
      result.toasts.push('🏅 ' + mark.name + ': +🪙' + mark.reward.gold + ' · +💎' + mark.reward.gems);
    }
  }
  return got;
}

export function prepareFestivalDay(player, opts) {
  const args = opts || {};
  const src = player && typeof player === 'object' ? player : {};
  const prevDay = src.hoadang && typeof src.hoadang === 'object' ? asInt(src.hoadang.day, -1) : -1;
  const d = asInt(args.day, prevDay);
  const base = snapshot(player, d);
  return withFest(base, { refreshed: prevDay !== d });
}

export function prepareSetTheme(player, opts) {
  const args = opts || {};
  if (!LANTERN_THEMES[args.id]) return festivalFail('UNKNOWN_THEME', 'Hướng hoa đăng không tồn tại.');
  const d = asInt(args.day, 0);
  const base = snapshot(player, d);
  const hoadang = normalizeHoadang(base.hoadang, d);
  hoadang.theme = args.id;
  return withFest(base, { hoadang, theme: args.id });
}

export function prepareReleaseLantern(player, opts) {
  const args = opts || {};
  const d = asInt(args.day, 0);
  const base = snapshot(player, d);
  if (args.stamina != null) base.stamina = asInt(args.stamina, base.stamina);
  const hoadang = normalizeHoadang(base.hoadang, d);
  if (hoadang.count >= HOADANG_PER_DAY) {
    return festivalFail('HOADANG_CAP', 'Hôm nay đã thả đủ ' + HOADANG_PER_DAY + ' hoa đăng.');
  }
  const free = hoadang.count === 0;
  if (!free && base.gold < HOADANG_COST) {
    return festivalFail('INSUFFICIENT_GOLD', 'Không đủ vàng (' + HOADANG_COST + '/đèn).');
  }
  const theme = LANTERN_THEMES[hoadang.theme] || LANTERN_THEMES.ankhang;
  const pools = heroPools(args.heroes, args.rosterIds);
  const grant = rollLanternGrant(theme, args.rng, pools);
  const wish = pickId(HOADANG_WISHES, args.rng) || HOADANG_WISHES[0];
  const result = withFest(base, {
    gold: free ? base.gold : base.gold - HOADANG_COST,
    hoadang,
    free,
    grant,
    wish,
    themeId: theme.id,
    themeName: theme.name
  });
  applyGrant(result, grant, args.stamCap);
  hoadang.count += 1;
  if (!hoadang.themesUsed.includes(hoadang.theme)) hoadang.themesUsed.push(hoadang.theme);
  hoadang.wishLog.unshift({ day: d, theme: hoadang.theme, wish, t: asInt(args.now, Date.now()) });
  if (hoadang.wishLog.length > 12) hoadang.wishLog.length = 12;
  result.journals.push('Thả hoa đăng ' + theme.name + ': “' + wish + '”');
  let setBonus = '';
  let milestones = [];
  if (hoadang.themesUsed.length >= 3 && !hoadang.setClaimed) {
    hoadang.setClaimed = true;
    hoadang.marks += 1;
    result.gold += TAM_NGUYEN_GOLD;
    result.gems += TAM_NGUYEN_GEMS;
    setBonus = ' · 🎑 Đủ Tam Nguyện: +1 Lễ Ấn, +🪙150, +💎5';
    milestones = claimMilestones(result);
  }
  result.setBonus = setBonus;
  result.milestones = milestones;
  result.toast = theme.ic + ' ' + theme.name + ' · ' + grant.label
    + (free ? ' (đèn đầu miễn phí)' : '')
    + setBonus
    + (milestones.length ? ' · Mốc: ' + milestones.map(m => m.name).join(', ') : '');
  result.toasts.unshift(result.toast);
  return result;
}

export function prepareSpin(player, opts) {
  const args = opts || {};
  const d = asInt(args.day, 0);
  const base = snapshot(player, d);
  if (args.stamina != null) base.stamina = asInt(args.stamina, base.stamina);
  if (base.so < BACH_BAO_COST) {
    return festivalFail('INSUFFICIENT_SO', 'Hết Sò Mộng — kiếm từ điểm danh, săn boss và PvP.');
  }
  const pools = heroPools(args.heroes, args.rosterIds);
  const idx = pickBachBaoIndex(args.rng);
  const slot = BACH_BAO_SLOTS[idx];
  const grant = slotGrant(slot, args.rng, pools);
  const result = withFest(base, {
    so: base.so - BACH_BAO_COST,
    idx,
    slot,
    grant,
    z: slot
  });
  applyGrant(result, grant, args.stamCap);
  const bb = normalizeBachBao(result.bachBao);
  bb.spins += 1;
  if (grant.type === 'chest') bb.chests += 1;
  if (grant.type === 'supreme') bb.supreme += 1;
  result.bachBao = pushHistory(bb, { kind: 'spin', label: grant.label }, args.now);
  result.msg = grant.label;
  result.toast = '🎡 ' + grant.label;
  result.toasts.unshift(result.toast);
  return result;
}

export function prepareOpenChest(player, opts) {
  const args = opts || {};
  const kind = args.kind === 'supreme' ? 'supreme' : 'normal';
  const d = asInt(args.day, 0);
  const base = snapshot(player, d);
  const bb = normalizeBachBao(base.bachBao);
  if (kind === 'supreme') {
    if (bb.supreme < 1) return festivalFail('NO_SUPREME', 'Chưa có Rương Chí Bảo.');
    bb.supreme -= 1;
  } else {
    if (bb.chests < 1) return festivalFail('NO_CHEST', 'Chưa có Rương Báu.');
    bb.chests -= 1;
  }
  const pools = heroPools(args.heroes, args.rosterIds);
  const grant = rollChestTable(kind, args.rng, pools);
  const result = withFest(base, { grant, kind, ic: kind === 'supreme' ? '👑' : '🎁' });
  applyGrant(result, grant, args.stamCap);
  bb.opened += 1;
  const prefix = kind === 'supreme' ? 'Chí Bảo: ' : 'Rương Báu: ';
  result.bachBao = pushHistory(bb, { kind: 'open', label: prefix + grant.label }, args.now);
  result.msg = grant.label;
  result.toast = (kind === 'supreme' ? '👑 ' : '🎁 ') + grant.label;
  result.toasts.unshift(result.toast);
  return result;
}
