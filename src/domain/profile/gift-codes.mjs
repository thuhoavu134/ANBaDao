export const EXTRA_GIFTCODES = Object.freeze({
  LUCTHAN: { label: 'Lục Thần khai ấn', gold: 5000, gems: 300, stam: 40 },
  THANHCHINH: { label: 'Cổng Thành Chính', gold: 2200, gems: 180, stam: 25 }
});

export function normalizeGiftKey(str) {
  return String(str || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function redeemGiftCode(player, str, catalog) {
  const k = normalizeGiftKey(str);
  if (!k) return { ok: false, msg: 'Chưa nhập mã.' };
  const g = catalog && catalog[k];
  if (!g) return { ok: false, msg: 'Mã không tồn tại hoặc đã hết hạn.' };
  const next = player || {};
  const codes = Array.isArray(next.codes) ? next.codes.slice() : [];
  if (codes.includes(k)) return { ok: false, msg: 'Mã này đã nhận rồi.' };
  codes.push(k);
  return {
    ok: true,
    key: k,
    label: g.label,
    gold: g.gold || 0,
    gems: g.gems || 0,
    stam: g.stam || 0,
    player: {
      ...next,
      codes,
      gold: (next.gold || 0) + (g.gold || 0),
      gems: (next.gems || 0) + (g.gems || 0)
    }
  };
}

export function validateNick(str) {
  const nick = String(str || '').trim();
  if (nick.length < 4 || nick.length > 14) return { ok: false, msg: 'Hãy nhập 4-14 ký tự' };
  if (/[<>&]/.test(nick)) return { ok: false, msg: 'Tên không hợp lệ.' };
  return { ok: true, nick };
}
