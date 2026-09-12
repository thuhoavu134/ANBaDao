import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const EXTRA_GIFTCODES = Object.freeze({
  LUCTHAN: { label: 'Lục Thần khai ấn', gold: 5000, gems: 300, stam: 40 },
  THANHCHINH: { label: 'Cổng Thành Chính', gold: 2200, gems: 180, stam: 25 }
});

export function normalizeGiftKey(str) {
  return String(str || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function readJsonFile(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return {};
  }
}

export function parseGiftEnv(raw) {
  if (!raw) return {};
  if (typeof raw === 'object' && !Array.isArray(raw)) return normalizeCatalog(raw);
  try {
    return normalizeCatalog(JSON.parse(String(raw)));
  } catch {
    return {};
  }
}

export function normalizeCatalog(obj) {
  const out = {};
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return out;
  for (const [k, v] of Object.entries(obj)) {
    const key = normalizeGiftKey(k);
    if (!key || !v || typeof v !== 'object') continue;
    out[key] = {
      label: String(v.label || key),
      gold: Math.max(0, Number(v.gold) || 0),
      gems: Math.max(0, Number(v.gems) || 0),
      stam: Math.max(0, Number(v.stam) || 0)
    };
  }
  return out;
}

export function loadFileCatalog() {
  const here = dirname(fileURLToPath(import.meta.url));
  const nested = readJsonFile(join(here, 'gift-catalog.json'));
  const root = readJsonFile(join(process.cwd(), 'gift-codes.json'));
  return { ...EXTRA_GIFTCODES, ...normalizeCatalog(nested), ...normalizeCatalog(root) };
}

export function loadGiftCatalog({ file, envRaw } = {}) {
  return {
    ...EXTRA_GIFTCODES,
    ...normalizeCatalog(file),
    ...loadFileCatalog(),
    ...parseGiftEnv(envRaw)
  };
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
