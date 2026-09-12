const fail = (code, message) => ({ ok: false, code, message });

/** Bậc mảnh trên UI — không dùng SR/SSR. */
export const RAR_UI = Object.freeze({ b: 'B', a: 'A', s: 'S', ss: 'S+', ssr: 'S+' });

/** Mảnh mở tướng lần đầu. */
export const UNLOCK_SHARDS = Object.freeze({ b: 10, a: 20, s: 30, ss: 50, ssr: 50 });

/** Sao 1→6 vẫn 20 × sao hiện tại = 300 mảnh. */
export const STAR_SHARD_MULT = 20;

/**
 * Nhỏ giọt Tinh/Hoạt vào daily — AFK 15/15 + craft 10/10 chưa đủ
 * 1 lần rèn (20) + cường (Hoạt) + 1 lần chế sò (25+25).
 */
export const DAILY_DRIP = Object.freeze({
  q_win: Object.freeze({ tinh: 4 }),
  q_train: Object.freeze({ hoat: 4 }),
  q_tower: Object.freeze({ tinh: 4 }),
  q_hunt: Object.freeze({ hoat: 6 }),
  q_arena: Object.freeze({ tinh: 4, hoat: 4 }),
  q_guild: Object.freeze({ tinh: 6 }),
  q_spin: Object.freeze({ hoat: 4 })
});

export const WEEKLY_DRIP = Object.freeze({
  w_win: Object.freeze({ tinh: 12, hoat: 12 }),
  w_hunt: Object.freeze({ hoat: 16 }),
  w_campaign: Object.freeze({ tinh: 16 })
});

export const JOB_DRIP = Object.freeze({
  ship_pho: Object.freeze({ tinh: 4 }),
  trong_quan: Object.freeze({ hoat: 6 }),
  don_kho: Object.freeze({ tinh: 10 }),
  tuoi_cay: Object.freeze({ hoat: 6 }),
  canh_den: Object.freeze({ tinh: 8, hoat: 8 }),
  do_rac_mo: Object.freeze({ tinh: 6 })
});

export const CHAPTER_DRIP = Object.freeze({ tinh: 20, hoat: 20 });

export function mergeReward(base, extra) {
  const out = { ...(base || {}) };
  if (!extra) return out;
  for (const k of Object.keys(extra)) {
    const n = Number(extra[k]);
    if (!Number.isFinite(n) || n === 0) continue;
    if (typeof extra[k] === 'string') out[k] = extra[k];
    else out[k] = (Number(out[k]) || 0) + n;
  }
  return out;
}

export function rarLabel(rar) {
  return RAR_UI[rar] || String(rar || 'B').toUpperCase();
}

export function applyDripTable(id, reward, table) {
  return mergeReward(reward, table && table[id]);
}

export { fail };
