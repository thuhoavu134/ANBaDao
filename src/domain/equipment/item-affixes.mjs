// Owner 2026-10-25: dòng thuộc tính phụ trên trang bị.
// - Tầng 1 (dòng thường): máu, giáp, tốc, công. Đồ rơi phó bản (b/a) 1 dòng, đồ chế (s/ss/ssr) 2 dòng.
// - Tầng 2 (dòng đặc biệt): bạo kích, chính xác, kháng bạo, né tránh, hút máu, phản đòn.
//   Chỉ đồ săn boss mới có, và đó là dòng thứ 3.
// Giá trị random trong khoảng theo phẩm (owner: "random trong khoảng").
// Món cũ không có `affixes` đọc ra 0, không cần migrate.


export const AFFIX_TIER1 = Object.freeze({
  hp: Object.freeze({
    key: 'hp', label: 'Máu', short: 'HP', stat: 'hp', kind: 'flat',
    range: Object.freeze({ b: [40, 70], a: [50, 90], s: [80, 140], ss: [160, 260], ssr: [300, 420] })
  }),
  def: Object.freeze({
    key: 'def', label: 'Giáp', short: 'DEF', stat: 'def', kind: 'flat',
    range: Object.freeze({ b: [3, 6], a: [4, 7], s: [7, 12], ss: [14, 22], ssr: [26, 38] })
  }),
  spd: Object.freeze({
    key: 'spd', label: 'Tốc', short: 'SPD', stat: 'spd', kind: 'flat',
    range: Object.freeze({ b: [1, 2], a: [1, 2], s: [2, 3], ss: [3, 5], ssr: [5, 8] })
  }),
  atk: Object.freeze({
    key: 'atk', label: 'Công', short: 'ATK', stat: 'atk', kind: 'flat',
    range: Object.freeze({ b: [4, 7], a: [5, 9], s: [8, 14], ss: [16, 26], ssr: [30, 44] })
  })
});

export const AFFIX_TIER2 = Object.freeze({
  crit: Object.freeze({
    key: 'crit', label: 'Bạo kích', short: 'CRIT', stat: 'crit', kind: 'pct', special: true,
    range: Object.freeze({ s: [2, 3], ss: [3, 5], ssr: [5, 8] })
  }),
  accuracy: Object.freeze({
    key: 'accuracy', label: 'Chính xác', short: 'ACC', stat: 'accuracy', kind: 'pct', special: true,
    range: Object.freeze({ s: [3, 5], ss: [5, 8], ssr: [8, 12] })
  }),
  critRes: Object.freeze({
    key: 'critRes', label: 'Kháng bạo', short: 'CRES', stat: 'critRes', kind: 'pct', special: true,
    range: Object.freeze({ s: [2, 3], ss: [3, 5], ssr: [5, 8] })
  }),
  evasion: Object.freeze({
    key: 'evasion', label: 'Né tránh', short: 'EVA', stat: 'evasion', kind: 'pct', special: true,
    range: Object.freeze({ s: [1, 2], ss: [2, 4], ssr: [3, 6] })
  }),
  lifesteal: Object.freeze({
    key: 'lifesteal', label: 'Hút máu', short: 'LS', stat: 'lifesteal', kind: 'pct', special: true,
    range: Object.freeze({ s: [2, 3], ss: [4, 6], ssr: [7, 10] })
  }),
  counter: Object.freeze({
    key: 'counter', label: 'Phản đòn', short: 'CTR', stat: 'counter', kind: 'pct', special: true,
    range: Object.freeze({ s: [5, 7], ss: [10, 14], ssr: [18, 25] })
  }),
  // Owner 2026-10-25: hai dòng hệ, chỉ có nghĩa khi giao tranh đúng chiều khắc hệ.
  khangHe: Object.freeze({
    key: 'khangHe', label: 'Kháng hệ khắc', short: 'KHE', stat: 'khangHe', kind: 'pct', special: true,
    range: Object.freeze({ s: [3, 5], ss: [5, 8], ssr: [8, 12] })
  }),
  satHe: Object.freeze({
    key: 'satHe', label: 'Sát thương hệ khắc', short: 'SHE', stat: 'satHe', kind: 'pct', special: true,
    range: Object.freeze({ s: [3, 5], ss: [5, 8], ssr: [8, 12] })
  }),
  // Owner 2026-10-25:
  //  bỏ qua kháng = đánh xuyên hệ số kháng/giáp của đối thủ
  //  sát thương chuẩn = phần sát thương ăn thẳng vào máu, không qua giáp/kháng
  //  bỏ qua né = tăng tỉ lệ đánh trúng tướng né cao
  boQuaKhang: Object.freeze({
    key: 'boQuaKhang', label: 'Bỏ qua kháng', short: 'BQK', stat: 'boQuaKhang', kind: 'pct', special: true,
    range: Object.freeze({ s: [6, 9], ss: [12, 16], ssr: [20, 26] })
  }),
  stChuan: Object.freeze({
    key: 'stChuan', label: 'Sát thương chuẩn', short: 'STC', stat: 'stChuan', kind: 'pct', special: true,
    range: Object.freeze({ s: [3, 4], ss: [6, 8], ssr: [10, 14] })
  }),
  boQuaNe: Object.freeze({
    key: 'boQuaNe', label: 'Bỏ qua né', short: 'BQN', stat: 'boQuaNe', kind: 'pct', special: true,
    range: Object.freeze({ s: [8, 12], ss: [15, 20], ssr: [25, 32] })
  })
});

export const AFFIX_KEYS = Object.freeze({ ...AFFIX_TIER1, ...AFFIX_TIER2 });
export const AFFIX_SOURCES = Object.freeze(['craft', 'stage', 'boss']);

// Số dòng: đồ rơi phó bản 1 dòng, đồ chế 2 dòng, đồ săn boss 3 dòng (2 thường + 1 đặc biệt).
export function affixCountFor(source, rar) {
  const key = String(rar || '').toLowerCase();
  if (source === 'boss') return key === 's' || key === 'ss' || key === 'ssr' ? 3 : 1;
  if (source === 'craft') return key === 's' || key === 'ss' || key === 'ssr' ? 2 : 1;
  return 1;
}

function rollIn(range, rng) {
  const [lo, hi] = range;
  if (hi <= lo) return lo;
  return lo + Math.floor(rng() * (hi - lo + 1));
}

function pickOne(keys, taken, rng) {
  const pool = keys.filter(key => !taken.includes(key));
  if (!pool.length) return null;
  return pool[Math.floor(rng() * pool.length)];
}

/** Sinh danh sách dòng cho một món. `rng` cho phép test tất định. */
export function rollAffixes({ source = 'craft', rar = 'b', rng = Math.random } = {}) {
  const key = String(rar || '').toLowerCase();
  const total = affixCountFor(source, key);
  const out = [];
  const taken = [];
  const hasTier2 = key === 's' || key === 'ss' || key === 'ssr';
  const wantSpecial = source === 'boss' && total === 3 && hasTier2;
  const common = total - (wantSpecial ? 1 : 0);
  for (let i = 0; i < common; i++) {
    const pick = pickOne(Object.keys(AFFIX_TIER1), taken, rng);
    if (!pick) break;
    const def = AFFIX_TIER1[pick];
    const range = def.range[key];
    if (!range) continue;
    taken.push(pick);
    out.push({ k: pick, v: rollIn(range, rng), spec: false });
  }
  if (wantSpecial) {
    const pick = pickOne(Object.keys(AFFIX_TIER2), taken, rng);
    const def = AFFIX_TIER2[pick];
    const range = def.range[key];
    if (pick && range) out.push({ k: pick, v: rollIn(range, rng), spec: true });
  }
  return out;
}

/** Món cũ không có affixes → mảng rỗng. Chỉ giữ dòng hợp lệ để save hỏng không phá chỉ số. */
export function normalizeAffixes(item) {
  const raw = Array.isArray(item?.affixes) ? item.affixes : [];
  const out = [];
  const seen = new Set();
  for (const entry of raw) {
    const key = typeof entry === 'string' ? entry : entry?.k;
    if (!Object.hasOwn(AFFIX_KEYS, key) || seen.has(key)) continue;
    const value = Number(typeof entry === 'string' ? 0 : entry.v);
    if (!Number.isFinite(value) || value <= 0) continue;
    seen.add(key);
    out.push({ k: key, v: Math.round(value), spec: Boolean(AFFIX_KEYS[key].special) });
  }
  return out;
}

/** Tổng chỉ số phụ của một món, luôn trả đủ khoá để cộng dồn an toàn. */
export function affixSum(item) {
  const out = { hp: 0, def: 0, spd: 0, atk: 0, crit: 0, accuracy: 0, critRes: 0, evasion: 0, lifesteal: 0, counter: 0,
    khangHe: 0, satHe: 0, boQuaKhang: 0, stChuan: 0, boQuaNe: 0 };
  for (const affix of normalizeAffixes(item)) {
    const def = AFFIX_KEYS[affix.k];
    if (!def) continue;
    out[def.stat] += affix.v;
  }
  return out;
}

/** Dữ liệu cho UI: nhãn, giá trị đã format, và cờ dòng đặc biệt (in màu khác). */
export function affixLines(item) {
  return normalizeAffixes(item).map(affix => {
    const def = AFFIX_KEYS[affix.k];
    const suffix = def.kind === 'pct' ? '%' : '';
    return {
      key: affix.k,
      label: def.label,
      short: def.short,
      value: affix.v,
      text: '+' + affix.v + suffix + ' ' + def.label,
      special: Boolean(def.special)
    };
  });
}

