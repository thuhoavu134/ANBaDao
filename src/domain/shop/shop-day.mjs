const shopFail = (code, message) => ({ ok: false, code, message });

export const SHOP_STAM_CAP = 120;
export const SHOP_STALL_COUNT = 8;

export const SHOP_STALLS = Object.freeze([
  Object.freeze({ k: 'sh10', type: 'shards', qty: 10, gold: 320, gems: 0, name: 'Gói ký ức bỏ quên', pool: 'nonSsr' }),
  Object.freeze({ k: 'sh5ssr', type: 'shards', qty: 5, gold: 0, gems: 60, name: 'Mảnh mộng hiếm', pool: 'ssr' }),
  Object.freeze({ k: 'stam', type: 'stam', qty: 20, gold: 160, gems: 0, name: 'Cà phê muối lúc nửa đêm' }),
  Object.freeze({ k: 'gold', type: 'gold', qty: 450, gold: 0, gems: 40, name: 'Heo đất ai đánh rơi' }),
  Object.freeze({ k: 'craft', type: 'craftpack', tinh: 25, hoat: 25, gold: 220, gems: 0, name: 'Túi đồ nghề thợ mộng' }),
  Object.freeze({ k: 'binh_tinh', type: 'craftpack', tinh: 30, hoat: 0, gold: 280, gems: 0, name: 'Bình Tinh' }),
  Object.freeze({ k: 'lo_hoat', type: 'craftpack', tinh: 0, hoat: 30, gold: 280, gems: 0, name: 'Lò Hoạt' }),
  Object.freeze({ k: 'goi_ngoc', type: 'craftpack', tinh: 80, hoat: 80, gold: 0, gems: 50, name: 'Gói Tinh Hỏa' })
]);

export const SHOP_STALL_KEYS = Object.freeze(SHOP_STALLS.map(s => s.k));

function asInt(value, fallback = 0) {
  const n = Math.floor(Number(value));
  return Number.isFinite(n) ? n : fallback;
}

export function shopDayIndex(now = Date.now(), tzOffsetMin = new Date().getTimezoneOffset()) {
  return Math.floor((Number(now) - asInt(tzOffsetMin, 0) * 60000) / 86400000);
}

export function emptyShop() {
  return { day: -1, stock: [], bought: [] };
}

export function shopHasCombatGoods(stalls = SHOP_STALLS) {
  return stalls.some(s => s && (s.atk || s.hp || s.def || s.spd || s.power));
}

function cloneStall(stall, hero) {
  const next = {
    k: stall.k,
    type: stall.type,
    name: stall.name
  };
  if (stall.qty) next.qty = stall.qty;
  if (stall.gold) next.gold = stall.gold;
  if (stall.gems) next.gems = stall.gems;
  if (stall.tinh) next.tinh = stall.tinh;
  if (stall.hoat) next.hoat = stall.hoat;
  if (stall.type === 'shards') next.hero = hero || null;
  return next;
}

function pickId(list, rng) {
  const arr = Array.isArray(list) ? list.filter(Boolean) : [];
  if (!arr.length) return null;
  const roll = typeof rng === 'function' ? Number(rng()) : 0;
  const n = Number.isFinite(roll) ? Math.min(0.999999, Math.max(0, roll)) : 0;
  return arr[(n * arr.length) | 0];
}

function heroPools(heroes) {
  const list = Array.isArray(heroes)
    ? heroes
    : (heroes && typeof heroes === 'object'
      ? [...(heroes.nonSsr || []), ...(heroes.ssr || [])].map(id => (
        typeof id === 'string' ? { id, rarity: (heroes.ssr || []).includes(id) ? 'ssr' : 'r' } : id
      ))
      : []);
  const rows = list.map(h => {
    if (!h) return null;
    if (typeof h === 'string') return { id: h, rarity: 'r' };
    return { id: h.id, rarity: h.rarity || 'r' };
  }).filter(h => h && h.id);
  return {
    nonSsr: rows.filter(h => h.rarity !== 'ssr').map(h => h.id),
    ssr: rows.filter(h => h.rarity === 'ssr').map(h => h.id)
  };
}

export function makeShopStock({ heroes, rng } = {}) {
  const pools = heroPools(heroes);
  return SHOP_STALLS.map(stall => {
    if (stall.type !== 'shards') return cloneStall(stall);
    const pool = stall.pool === 'ssr' ? pools.ssr : pools.nonSsr;
    return cloneStall(stall, pickId(pool, rng));
  });
}

function normalizeStock(stock) {
  if (!Array.isArray(stock) || !stock.length) return [];
  const byKey = new Map(stock.map(it => [it && it.k, it]));
  return SHOP_STALLS.map(stall => {
    const raw = byKey.get(stall.k);
    if (!raw || typeof raw !== 'object') return cloneStall(stall);
    const item = cloneStall(stall, raw.hero);
    if (stall.type === 'shards') item.hero = raw.hero || null;
    return item;
  });
}

export function normalizeShop(shop) {
  const next = emptyShop();
  if (!shop || typeof shop !== 'object') return next;
  next.day = asInt(shop.day, -1);
  next.bought = Array.isArray(shop.bought)
    ? shop.bought.filter(k => SHOP_STALL_KEYS.includes(k))
    : [];
  next.stock = normalizeStock(shop.stock);
  return next;
}

export function prepareShopOpen(player, { day, heroes, rng } = {}) {
  const shop = normalizeShop(player?.shop);
  const d = asInt(day, shopDayIndex());
  if (shop.day === d && shop.stock.length === SHOP_STALL_COUNT) {
    return { ok: true, shop, refreshed: false };
  }
  const next = emptyShop();
  next.day = d;
  next.bought = [];
  next.stock = makeShopStock({ heroes, rng });
  return { ok: true, shop: next, refreshed: true };
}

function cloneMap(src) {
  const out = {};
  if (src && typeof src === 'object') {
    for (const key of Object.keys(src)) out[key] = src[key];
  }
  return out;
}

export function prepareShopBuy(player, key, opts = {}) {
  const opened = prepareShopOpen(player, opts);
  if (!opened.ok) return opened;
  const shop = {
    day: opened.shop.day,
    stock: opened.shop.stock.map(it => ({ ...it })),
    bought: opened.shop.bought.slice()
  };
  const k = String(key || '');
  const item = shop.stock.find(it => it.k === k);
  if (!item) return shopFail('UNKNOWN_ITEM', 'Món này không có trên quầy hôm nay.');
  if (shop.bought.includes(k)) return shopFail('ALREADY_BOUGHT', 'Món này hết hàng hôm nay.');
  if (item.type === 'shards' && !item.hero) return shopFail('UNKNOWN_HERO', 'Gói ký ức chưa chọn được tướng.');
  const gold = Math.max(0, asInt(player?.gold, 0));
  const gems = Math.max(0, asInt(player?.gems, 0));
  const costGold = asInt(item.gold, 0);
  const costGems = asInt(item.gems, 0);
  if (costGold && gold < costGold) return shopFail('NOT_ENOUGH_GOLD', 'Không đủ vàng.');
  if (costGems && gems < costGems) return shopFail('NOT_ENOUGH_GEMS', 'Không đủ 💎.');
  let nextGold = gold - costGold;
  let nextGems = gems - costGems;
  const shards = cloneMap(player?.shards);
  let stamina = Math.max(0, asInt(player?.stamina, 0));
  let tinh = Math.max(0, asInt(player?.tinh, 0));
  let hoat = Math.max(0, asInt(player?.hoat, 0));
  const cap = Math.max(1, asInt(opts.stamCap, SHOP_STAM_CAP));
  if (item.type === 'shards') shards[item.hero] = asInt(shards[item.hero], 0) + asInt(item.qty, 0);
  else if (item.type === 'stam') stamina = Math.min(cap, stamina + asInt(item.qty, 0));
  else if (item.type === 'gold') nextGold += asInt(item.qty, 0);
  else if (item.type === 'craftpack') {
    tinh += asInt(item.tinh, 0);
    hoat += asInt(item.hoat, 0);
  } else {
    return shopFail('UNKNOWN_TYPE', 'Món này không đổi được.');
  }
  shop.bought = shop.bought.concat(k);
  return {
    ok: true,
    shop,
    item,
    gold: nextGold,
    gems: nextGems,
    shards,
    stamina,
    tinh,
    hoat,
    goldSpent: costGold,
    gemsSpent: costGems,
    refreshed: opened.refreshed,
    clearedChapters: Array.isArray(player?.clearedChapters) ? player.clearedChapters.slice() : []
  };
}
