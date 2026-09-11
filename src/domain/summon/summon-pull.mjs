const summonFail = (code, message) => ({ ok: false, code, message });

export const GACHA_COST1 = 80;
export const GACHA_COST10 = 720;
export const GACHA_PITY_AT = 60;
export const SPARK_SELECT = 120;
export const SPARK_OWNED_SHARDS = 30;
export const SPARK_OWNED_ESSENCE = 8;
export const TEN_PULL_FLOOR = Object.freeze(['s', 'ss', 'ssr']);

export const GACHA_RATES = Object.freeze([
  Object.freeze(['ssr', 3]),
  Object.freeze(['ss', 9]),
  Object.freeze(['s', 18]),
  Object.freeze(['a', 30]),
  Object.freeze(['b', 40])
]);

export const GACHA_DUP_SHARDS = Object.freeze({ ssr: 15, ss: 10, s: 6, a: 4, b: 3 });
export const ESSENCE_BY_RARITY = Object.freeze({ ssr: 12, ss: 8, s: 5, a: 3, b: 2 });

export const LIVE_GACHA = Object.freeze({
  cost1: GACHA_COST1,
  cost10: GACHA_COST10,
  rates: GACHA_RATES,
  pityAt: GACHA_PITY_AT,
  dupShards: GACHA_DUP_SHARDS
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

export function gachaRatesSum(rates = GACHA_RATES) {
  return rates.reduce((sum, [, weight]) => sum + Number(weight || 0), 0);
}

export function validateSummonBanner(rates = GACHA_RATES, poolFor, guaranteedTiers = ['ssr', 's']) {
  if (!Array.isArray(rates) || !rates.length) return { ok: false, reason: 'INVALID_RATES' };
  if (rates.some(([tier, weight]) => !tier || !Number.isFinite(weight) || weight < 0) ||
      Math.abs(gachaRatesSum(rates) - 100) > 0.0001) {
    return { ok: false, reason: 'INVALID_RATES' };
  }
  const fn = typeof poolFor === 'function' ? poolFor : () => [];
  const required = new Set([...rates.filter(([, weight]) => weight > 0).map(([tier]) => tier), ...guaranteedTiers]);
  const empty = [...required].filter(tier => !Array.isArray(fn(tier)) || !fn(tier).length);
  return empty.length ? { ok: false, reason: 'EMPTY_POOL', tiers: empty } : { ok: true };
}

export function poolOfCatalog(rosterIds, heroes, tier) {
  const ids = Array.isArray(rosterIds) ? rosterIds : Object.keys(heroes || {});
  return ids.filter(id => heroes?.[id]?.rarity === tier);
}

export function rollTier({ pity = 0, rng, rates = GACHA_RATES, pityAt = GACHA_PITY_AT } = {}) {
  const nextPity = asInt(pity, 0) + 1;
  if (nextPity >= asInt(pityAt, GACHA_PITY_AT)) return { tier: 'ssr', pity: 0 };
  const roll = typeof rng === 'function' ? Number(rng()) : 0;
  const r = (Number.isFinite(roll) ? Math.min(0.999999, Math.max(0, roll)) : 0) * 100;
  let acc = 0;
  for (const [tier, weight] of rates) {
    acc += Number(weight);
    if (r < acc) return { tier, pity: tier === 'ssr' ? 0 : nextPity };
  }
  return { tier: 'b', pity: nextPity };
}

function pickId(list, rng) {
  const arr = Array.isArray(list) ? list.filter(Boolean) : [];
  if (!arr.length) return null;
  const roll = typeof rng === 'function' ? Number(rng()) : 0;
  const n = Number.isFinite(roll) ? Math.min(0.999999, Math.max(0, roll)) : 0;
  return arr[(n * arr.length) | 0];
}

function economyOf(player) {
  const src = player?.economy && typeof player.economy === 'object' ? player.economy : {};
  return {
    dreamEssence: Math.max(0, asInt(src.dreamEssence, 0)),
    spark: Math.max(0, asInt(src.spark, 0)),
    craftPity: Math.max(0, asInt(src.craftPity, 0)),
    awakeningSpent: Math.max(0, asInt(src.awakeningSpent, 0)),
    forgeMold: src.forgeMold || 'strike',
    forgePending: src.forgePending ?? null,
    forgeStats: src.forgeStats && typeof src.forgeStats === 'object'
      ? { dual: asInt(src.forgeStats.dual, 0), chosen: asInt(src.forgeStats.chosen, 0) }
      : { dual: 0, chosen: 0 }
  };
}

export function prepareSummonPull(player, opts = {}) {
  const n = asInt(opts.n, 0);
  const free = !!opts.free;
  if (![1, 10].includes(n) || (free && n !== 1)) {
    return summonFail('INVALID_COUNT', 'Chỉ gọi ×1 hoặc ×10.');
  }
  const heroesCatalog = opts.heroes || {};
  const rosterIds = opts.rosterIds || Object.keys(heroesCatalog);
  const poolFor = tier => poolOfCatalog(rosterIds, heroesCatalog, tier);
  const rates = opts.rates || GACHA_RATES;
  const banner = validateSummonBanner(rates, poolFor);
  if (!banner.ok) {
    return summonFail(banner.reason, 'Gọi Mộng tạm khóa: danh sách tướng chưa khớp cấu hình triệu hồi. Ngọc, bảo hiểm và lượt miễn phí được giữ nguyên.');
  }
  const day = asInt(opts.day, 0);
  if (free && asInt(player?.freePullDay, -1) === day) {
    return summonFail('FREE_USED', 'Mai lại có lượt miễn phí nghen.');
  }
  const gems = Math.max(0, asInt(player?.gems, 0));
  const cost = free ? 0 : (n === 10 ? GACHA_COST10 : GACHA_COST1);
  if (!free && gems < cost) {
    return summonFail('NOT_ENOUGH_GEMS', 'Không đủ 💎 — kiếm từ chương, điểm danh, mốc Sôi Nổi.');
  }
  const rng = typeof opts.rng === 'function' ? opts.rng : () => 0;
  let pity = Math.max(0, asInt(player?.pity, 0));
  const tiers = [];
  for (let i = 0; i < n; i++) {
    const rolled = rollTier({ pity, rng, rates, pityAt: opts.pityAt || GACHA_PITY_AT });
    pity = rolled.pity;
    tiers.push(rolled.tier);
  }
  if (n === 10 && !tiers.some(t => TEN_PULL_FLOOR.includes(t))) tiers[n - 1] = 's';
  const heroState = cloneMap(player?.heroes);
  const shards = cloneMap(player?.shards);
  const economy = economyOf(player);
  const pulls = [];
  for (const tier of tiers) {
    const pool = poolFor(tier);
    const id = pickId(pool, rng);
    if (!id) return summonFail('EMPTY_POOL', 'Gọi Mộng tạm khóa: danh sách tướng chưa khớp cấu hình triệu hồi. Ngọc, bảo hiểm và lượt miễn phí được giữ nguyên.');
    const row = heroState[id] && typeof heroState[id] === 'object' ? { ...heroState[id] } : { owned: false };
    let dup = false;
    let sh = 0;
    if (row.owned) {
      dup = true;
      sh = asInt(GACHA_DUP_SHARDS[tier], 0);
      shards[id] = asInt(shards[id], 0) + sh;
      economy.dreamEssence += asInt(ESSENCE_BY_RARITY[tier], 2);
    } else {
      row.owned = true;
    }
    heroState[id] = row;
    pulls.push({ id, t: tier, dup, sh });
  }
  economy.spark += n;
  return {
    ok: true,
    pulls,
    gems: gems - cost,
    gemsSpent: cost,
    pity,
    heroes: heroState,
    shards,
    economy,
    summonCount: asInt(player?.summonCount, 0) + n,
    freePullDay: free ? day : asInt(player?.freePullDay, -1),
    clearedChapters: Array.isArray(player?.clearedChapters) ? player.clearedChapters.slice() : []
  };
}

export function prepareSparkSelect(player, heroId, opts = {}) {
  const economy = economyOf(player);
  if (economy.spark < SPARK_SELECT) {
    return summonFail('NOT_ENOUGH_SPARK', 'Chưa đủ Hồi Ức (' + SPARK_SELECT + ').');
  }
  const id = String(heroId || '');
  const catalog = opts.heroes || {};
  const def = catalog[id];
  if (!def || def.rarity !== 'ssr') return summonFail('NOT_SSR', 'Chỉ chọn SSR.');
  economy.spark -= SPARK_SELECT;
  const heroState = cloneMap(player?.heroes);
  const shards = cloneMap(player?.shards);
  const row = heroState[id] && typeof heroState[id] === 'object' ? { ...heroState[id] } : { owned: false };
  let msg = '';
  let ownedBefore = !!row.owned;
  if (row.owned) {
    shards[id] = asInt(shards[id], 0) + SPARK_OWNED_SHARDS;
    economy.dreamEssence += SPARK_OWNED_ESSENCE;
    msg = '+30 mảnh +8 Mộng Tủy';
  } else {
    row.owned = true;
    msg = 'SSR mới gia nhập';
  }
  heroState[id] = row;
  return {
    ok: true,
    heroId: id,
    ownedBefore,
    msg,
    heroes: heroState,
    shards,
    economy,
    gems: Math.max(0, asInt(player?.gems, 0)),
    pity: Math.max(0, asInt(player?.pity, 0)),
    clearedChapters: Array.isArray(player?.clearedChapters) ? player.clearedChapters.slice() : []
  };
}
