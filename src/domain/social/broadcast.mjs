// Owner 2026-11-04: loa he thong + chu chay. Server tu dung cau chu tu su kien trong danh sach cho phep;
// client KHONG gui chu tu do qua kenh nay (chong gia mao / spam).
export const BROADCAST_COOLDOWN_MS = 30_000;
export const CHAT_CHANNELS = ['world', 'guild', 'clan', 'sys'];
export const CHANNEL_LABELS = { world: 'Thế Giới', guild: 'Bang Hội', clan: 'Gia Tộc', sys: 'Hệ Thống' };

const clean = (v, max = 24) => String(v == null ? '' : v).replace(/[<>&"'`\u0000-\u001f]/g, '').replace(/\s+/g, ' ').trim().slice(0, max);
const pick = (arr, seed) => arr[Math.abs(seed | 0) % arr.length];

const RARE = { ssr: 'SSR', sr: 'SR', legend: 'Thần Thoại', epic: 'Truyền Thuyết', rare: 'Hiếm' };

export const BROADCAST_EVENTS = {
  ssr(d, who, seed) {
    const names = (Array.isArray(d.heroes) ? d.heroes : []).map(n => clean(n, 20)).filter(Boolean).slice(0, 10);
    if (!names.length) return null;
    const tag = n => `【SSR】${n}`;
    if (names.length === 1) {
      return pick([
        `✦ Thiên mệnh chiếu rọi! ${who} đã chiêu mộ thành công ${tag(names[0])} — kỳ tài hiếm có, giang hồ chấn động! ✦`,
        `✦ Long ngâm cửu thiên! ${tag(names[0])} đã đầu quân dưới trướng ${who} — chúc mừng duyên trời định! ✦`
      ], seed);
    }
    if (names.length === 2) {
      return `✦ Song long xuất thế! ${who} cùng lúc chiêu mộ ${tag(names[0])} và ${tag(names[1])} — vạn hùng cúi đầu, giang hồ dậy sóng! ✦`;
    }
    return `✦ Quần hùng tụ hội! ${who} chiêu mộ ${names.length} tướng SSR: ${names.map(tag).join(', ')} — Thiên Mệnh đã chọn! ✦`;
  },
  boss_drop(d, who) {
    const item = clean(d.item), boss = clean(d.boss) || 'Boss';
    const rar = RARE[String(d.rarity || '').toLowerCase()] || '';
    if (!item || !rar) return null;
    return `✦ ${who} hạ gục ${boss}, nhận được báu vật 【${rar}】${item}! ✦`;
  },
  bbr_jackpot(d, who) {
    const prize = clean(d.prize, 30);
    if (!prize) return null;
    return `✦ Vận may tột đỉnh! ${who} quay Bách Bảo Rương trúng ${prize}! ✦`;
  },
  enhance(d, who) {
    const item = clean(d.item), lv = Math.floor(Number(d.level));
    if (!item || !Number.isFinite(lv) || lv < 10 || lv > 30) return null;
    return `✦ Thần binh hiện thế! ${who} cường hoá ${item} lên +${lv}! ✦`;
  }
};

export function buildBroadcast(event, data, who, seed = Date.now()) {
  const fn = BROADCAST_EVENTS[event];
  if (!fn) return { ok: false, code: 'BAD_EVENT' };
  const text = fn(data && typeof data === 'object' ? data : {}, clean(who, 20) || 'Đại hiệp', seed);
  if (!text) return { ok: false, code: 'BAD_DATA' };
  return { ok: true, text: text.slice(0, 220), event };
}

export function cleanGuildName(name) {
  const n = clean(name, 18);
  return n.length >= 2 ? n : '';
}
