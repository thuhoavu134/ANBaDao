const fail = (code, message) => ({ ok: false, code, message });

export const BBR_BETS = Object.freeze([2, 10, 50]);
export const BBR_STAR_W = Object.freeze([0, 40, 26, 18, 10, 5, 1]);
export const BBR_CRAFT = Object.freeze({ tinh: 25, hoat: 25, so: 10, cap: 2 });
export const BBR_UNLOCK = Object.freeze({ b: 10, a: 20, s: 30, ss: 50, ssr: 50 });
export const BBR_PAY = Object.freeze({
  gold: Object.freeze([0, 180, 480, 1200, 3600, 10000, 36000]),
  gems: Object.freeze([0, 3, 8, 18, 48, 120, 400]),
  so: Object.freeze([0, 2, 5, 12, 30, 80, 250]),
  tinh: Object.freeze([0, 6, 14, 32, 80, 200, 560]),
  hoat: Object.freeze([0, 6, 14, 32, 80, 200, 560]),
  sh_ss: Object.freeze([0, 2, 4, 8, 18, 40, 90]),
  sh_ssr: Object.freeze([0, 1, 2, 5, 12, 28, 70]),
  stam: Object.freeze([0, 4, 10, 20, 40, 80, 160]),
  chest: Object.freeze([0, 1, 1, 1, 1, 2, 3]),
  supreme: Object.freeze([0, 1, 1, 1, 2, 2, 3])
});
export const BBR_SHOP = Object.freeze([
  Object.freeze({ id: 'ss8', pts: 100, sh_ss: 8, name: '8 mảnh SS' }),
  Object.freeze({ id: 'ssr12', pts: 250, sh_ssr: 12, name: '12 mảnh SSR' }),
  Object.freeze({ id: 'chest', pts: 400, chest: 1, name: 'Rương Báu' }),
  Object.freeze({ id: 'gems40', pts: 800, gems: 40, name: '40 Ngọc' }),
  Object.freeze({ id: 'supreme', pts: 1500, supreme: 1, name: 'Rương Chí Bảo' }),
  Object.freeze({ id: 'ssr40', pts: 3000, sh_ssr: 40, name: '40 mảnh SSR' })
]);

function asInt(v, f = 0) {
  const n = Math.floor(Number(v));
  return Number.isFinite(n) ? n : f;
}

function rng01(rng) {
  const r = typeof rng === 'function' ? Number(rng()) : Math.random();
  return Number.isFinite(r) ? Math.min(0.999999, Math.max(0, r)) : 0;
}

export function emptyBbr() {
  return {
    bet: 2, lastType: '', streak: 0, stars: 1, pts: 0, crafted: 0, craftDay: -1,
    pool: 12000, spins: 0, chests: 0, supreme: 0, opened: 0, history: [], pending: null
  };
}

export function normalizeBbr(raw, day = 0) {
  const s = { ...emptyBbr(), ...(raw && typeof raw === 'object' ? raw : {}) };
  s.bet = BBR_BETS.includes(asInt(s.bet, 2)) ? asInt(s.bet, 2) : 2;
  s.streak = Math.max(0, asInt(s.streak, 0));
  s.stars = Math.max(1, Math.min(6, asInt(s.stars, 1)));
  s.pts = Math.max(0, asInt(s.pts, 0));
  s.pool = Math.max(0, asInt(s.pool, 12000));
  s.crafted = asInt(s.craftDay, -1) === asInt(day, 0) ? asInt(s.crafted, 0) : 0;
  s.craftDay = asInt(day, 0);
  s.history = Array.isArray(s.history) ? s.history.slice(0, 12) : [];
  if (s.pending && typeof s.pending === 'object') {
    s.pending = { t: String(s.pending.t || 'gold'), stars: Math.max(1, Math.min(6, asInt(s.pending.stars, 1))), n: asInt(s.pending.n, 1) };
  } else s.pending = null;
  return s;
}

export function rollStars(rng, same) {
  const r = rng01(rng) * 100;
  let acc = 0;
  let s = 1;
  for (let i = 1; i <= 6; i++) {
    acc += BBR_STAR_W[i];
    if (r < acc) { s = i; break; }
  }
  if (same) s = Math.min(6, s + 1);
  return s;
}

export function betMult(bet) {
  const b = BBR_BETS.includes(bet) ? bet : 2;
  return b / 2;
}

export function payAt(type, stars, bet) {
  const row = BBR_PAY[type] || BBR_PAY.gold;
  const v = asInt(row[Math.max(1, Math.min(6, stars))], 0);
  return Math.round(v * betMult(bet));
}

/** 1/2/3 cục cùng loại. Tiếp cộng cục = sao (2+3=5★). */
export const BBR_BOARD = Object.freeze([
  Object.freeze({ t: 'gold', n: 1 }), Object.freeze({ t: 'gold', n: 2 }), Object.freeze({ t: 'gold', n: 3 }),
  Object.freeze({ t: 'gems', n: 1 }), Object.freeze({ t: 'gems', n: 2 }), Object.freeze({ t: 'gems', n: 3 }),
  Object.freeze({ t: 'so', n: 1 }), Object.freeze({ t: 'so', n: 2 }),
  Object.freeze({ t: 'tinh', n: 1 }), Object.freeze({ t: 'tinh', n: 2 }), Object.freeze({ t: 'tinh', n: 3 }),
  Object.freeze({ t: 'hoat', n: 1 }), Object.freeze({ t: 'hoat', n: 2 }), Object.freeze({ t: 'hoat', n: 3 }),
  Object.freeze({ t: 'sh_ss', n: 1 }), Object.freeze({ t: 'sh_ss', n: 2 }),
  Object.freeze({ t: 'sh_ssr', n: 1 }), Object.freeze({ t: 'sh_ssr', n: 2 }),
  Object.freeze({ t: 'chest', n: 1 }), Object.freeze({ t: 'chest', n: 2 }),
  Object.freeze({ t: 'supreme', n: 1 }), Object.freeze({ t: 'gold', n: 1 }),
  Object.freeze({ t: 'gems', n: 1 }), Object.freeze({ t: 'tinh', n: 1 })
]);

export function spinStep(player, { bet, rng, day, board } = {}) {
  const stake = BBR_BETS.includes(asInt(bet, 2)) ? asInt(bet, 2) : 2;
  const so = asInt(player?.so, 0);
  if (so < stake) return fail('INSUFFICIENT_SO', 'Không đủ sò. Cược ' + stake + '.');
  const list = Array.isArray(board) && board.length ? board : BBR_BOARD;
  const idx = Math.floor(rng01(rng) * list.length) % list.length;
  const cell = list[idx] || { t: 'gold', n: 1 };
  const bbr = normalizeBbr(player?.bachBao, day);
  const n = Math.max(1, Math.min(3, asInt(cell.n, 1)));
  const type = cell.t || 'gold';
  const same = !!(bbr.pending && bbr.pending.t === type);
  const stars = same ? Math.min(6, asInt(bbr.pending.stars, 1) + n) : n;
  bbr.pending = { t: type, stars, n };
  bbr.lastType = type;
  bbr.stars = stars;
  bbr.bet = stake;
  bbr.spins = asInt(bbr.spins, 0) + 1;
  bbr.pool += stake;
  return {
    ok: true,
    idx,
    cell,
    type,
    n,
    stars,
    same,
    stake,
    so: so - stake,
    bachBao: bbr,
    msg: (same ? 'Cộng ' + n + ' → ' : '') + stars + '★ ' + type
  };
}

export function takeBbr(player, { day } = {}) {
  const bbr = normalizeBbr(player?.bachBao, day);
  if (!bbr.pending) return fail('NO_PENDING', 'Chưa có lượt để nhận.');
  const type = bbr.pending.t;
  const stars = bbr.pending.stars;
  const stake = bbr.bet || 2;
  const qty = payAt(type, stars, stake);
  let gold = asInt(player?.gold, 0);
  let gems = asInt(player?.gems, 0);
  let tinh = asInt(player?.tinh, 0);
  let hoat = asInt(player?.hoat, 0);
  let stam = asInt(player?.stamina, 0);
  let soOut = asInt(player?.so, 0);
  const shards = { ...(player?.shards || {}) };
  if (type === 'gold') gold += qty;
  if (type === 'gems') gems += qty;
  if (type === 'so') soOut += qty;
  if (type === 'tinh') tinh += qty;
  if (type === 'hoat') hoat += qty;
  if (type === 'stam') stam += qty;
  if (type === 'sh_ss' || type === 'sh_ssr') {
    const hid = player?.shardHero || 'ong_hang_pho';
    shards[hid] = asInt(shards[hid], 0) + qty;
  }
  if (type === 'chest') bbr.chests = asInt(bbr.chests, 0) + qty;
  if (type === 'supreme') bbr.supreme = asInt(bbr.supreme, 0) + qty;
  if (stars >= 6 && type === 'gold') {
    const jack = Math.floor(bbr.pool * 0.2);
    gold += jack;
    bbr.pool = Math.max(0, bbr.pool - jack);
  }
  if (stars >= 3) bbr.pts += Math.max(1, payAt('so', stars, stake));
  const label = stars + '★ ' + type + ' · +' + qty;
  bbr.history.unshift({ kind: 'take', label, t: Date.now() });
  if (bbr.history.length > 12) bbr.history.length = 12;
  bbr.pending = null;
  return {
    ok: true, type, stars, qty, stake,
    gold, gems, so: soOut, tinh, hoat, stamina: stam, shards, bachBao: bbr,
    msg: label
  };
}

export function craftShells(player, { day } = {}) {
  const tinh = asInt(player?.tinh, 0);
  const hoat = asInt(player?.hoat, 0);
  const so = asInt(player?.so, 0);
  const bbr = normalizeBbr(player?.bachBao, day);
  if (bbr.crafted >= BBR_CRAFT.cap) return fail('CRAFT_CAP', 'Hôm nay đã chế đủ sò.');
  if (tinh < BBR_CRAFT.tinh || hoat < BBR_CRAFT.hoat) {
    return fail('CRAFT_MAT', 'Cần ' + BBR_CRAFT.tinh + ' Tinh + ' + BBR_CRAFT.hoat + ' Hoạt.');
  }
  bbr.crafted += 1;
  return {
    ok: true,
    tinh: tinh - BBR_CRAFT.tinh,
    hoat: hoat - BBR_CRAFT.hoat,
    so: so + BBR_CRAFT.so,
    bachBao: bbr,
    gained: BBR_CRAFT.so
  };
}

export function spinBbr(player, { bet, rng, day, slots } = {}) {
  const stake = BBR_BETS.includes(asInt(bet, 2)) ? asInt(bet, 2) : 2;
  const so = asInt(player?.so, 0);
  if (so < stake) return fail('INSUFFICIENT_SO', 'Không đủ vỏ sò. Cược ' + stake + '🐚.');
  const list = Array.isArray(slots) && slots.length ? slots : [];
  const n = Math.max(1, list.length);
  const idx = Math.floor(rng01(rng) * n) % n;
  const slot = list[idx] || { t: 'gold', v: 180, l: 'Vàng' };
  const type = slot.t || 'gold';
  const bbr = normalizeBbr(player?.bachBao, day);
  const same = !!(bbr.lastType && bbr.lastType === type);
  const stars = rollStars(rng, same);
  bbr.lastType = type;
  bbr.streak = same ? Math.min(6, bbr.streak + 1) : 1;
  bbr.stars = stars;
  bbr.bet = stake;
  bbr.spins = asInt(bbr.spins, 0) + 1;
  bbr.pool += stake;
  const qty = payAt(type, stars, stake);
  let gold = asInt(player?.gold, 0);
  let gems = asInt(player?.gems, 0);
  let tinh = asInt(player?.tinh, 0);
  let hoat = asInt(player?.hoat, 0);
  let stam = asInt(player?.stamina, 0);
  let soOut = so - stake;
  const shards = { ...(player?.shards || {}) };
  if (type === 'gold') gold += qty;
  if (type === 'gems') gems += qty;
  if (type === 'so') soOut += qty;
  if (type === 'tinh') tinh += qty;
  if (type === 'hoat') hoat += qty;
  if (type === 'stam') stam += qty;
  if (type === 'sh_ss' || type === 'sh_ssr') {
    const hid = (player?.shardHero) || 'ong_hang_pho';
    shards[hid] = asInt(shards[hid], 0) + qty;
  }
  if (type === 'chest') bbr.chests = asInt(bbr.chests, 0) + qty;
  if (type === 'supreme') bbr.supreme = asInt(bbr.supreme, 0) + qty;
  if (stars >= 6 && type === 'gold') {
    const jack = Math.floor(bbr.pool * 0.2);
    gold += jack;
    bbr.pool = Math.max(0, bbr.pool - jack);
  }
  if (stars >= 3) bbr.pts += Math.max(1, payAt('so', stars, stake));
  const label = stars + '★ ' + (slot.l || type) + ' ×' + betMult(stake);
  bbr.history.unshift({ kind: 'spin', label, t: Date.now() });
  if (bbr.history.length > 12) bbr.history.length = 12;
  return {
    ok: true, idx, slot, type, stars, same, qty, stake,
    gold, gems, so: soOut, tinh, hoat, stamina: stam, shards, bachBao: bbr,
    msg: label + ' · +' + qty
  };
}

export function buyBbrShop(player, id) {
  const item = BBR_SHOP.find(x => x.id === id);
  if (!item) return fail('NO_ITEM', 'Không có món này.');
  const bbr = normalizeBbr(player?.bachBao);
  if (bbr.pts < item.pts) return fail('NO_PTS', 'Thiếu điểm Bách Bảo.');
  bbr.pts -= item.pts;
  const next = {
    ok: true, bachBao: bbr,
    gems: asInt(player?.gems, 0) + asInt(item.gems, 0),
    shards: { ...(player?.shards || {}) }
  };
  if (item.chest) next.bachBao.chests = asInt(bbr.chests, 0) + item.chest;
  if (item.supreme) next.bachBao.supreme = asInt(bbr.supreme, 0) + item.supreme;
  if (item.sh_ss || item.sh_ssr) {
    const hid = player?.shardHero || 'ong_hang_pho';
    next.shards[hid] = asInt(next.shards[hid], 0) + asInt(item.sh_ss || item.sh_ssr, 0);
  }
  return next;
}
