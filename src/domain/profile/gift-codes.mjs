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

export function normalizeItems(raw) {
  const out = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
  for (const [id, n] of Object.entries(raw)) {
    const iid = String(id || '').trim().toLowerCase().replace(/[^a-z0-9._-]/g, '');
    const c = Math.floor(Number(n) || 0);
    if (iid && c > 0) out[iid] = c;
  }
  return out;
}

export function normalizePets(raw) {
  const out = {};
  if (Array.isArray(raw)) {
    raw.forEach(id => {
      const p = String(id || '').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
      if (p) out[p] = 1;
    });
    return out;
  }
  return normalizeItems(raw);
}

export function normalizeShards(raw) {
  const out = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
  for (const [id, n] of Object.entries(raw)) {
    const hid = String(id || '').trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    const c = Math.floor(Number(n) || 0);
    if (hid && c > 0) out[hid] = c;
  }
  return out;
}

export function normalizeReward(v) {
  if (!v || typeof v !== 'object') {
    return { label: '', gold: 0, gems: 0, stam: 0, tinh: 0, hoat: 0, so: 0, essence: 0, shards: {}, items: {}, pets: {} };
  }
  return {
    label: String(v.label || ''),
    gold: Math.max(0, Number(v.gold) || 0),
    gems: Math.max(0, Number(v.gems) || 0),
    stam: Math.max(0, Number(v.stam) || 0),
    tinh: Math.max(0, Number(v.tinh) || 0),
    hoat: Math.max(0, Number(v.hoat) || 0),
    so: Math.max(0, Number(v.so) || 0),
    essence: Math.max(0, Number(v.essence) || 0),
    shards: normalizeShards(v.shards),
    items: normalizeItems(v.items),
    pets: normalizePets(v.pets)
  };
}

export function normalizeCatalog(obj) {
  const out = {};
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return out;
  for (const [k, v] of Object.entries(obj)) {
    const key = normalizeGiftKey(k);
    if (!key || !v || typeof v !== 'object') continue;
    const reward = normalizeReward(v);
    reward.label = reward.label || key;
    out[key] = reward;
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

export function applyGiftToPlayer(player, reward) {
  const g = normalizeReward(reward);
  const next = { ...(player || {}) };
  next.gold = (next.gold || 0) + g.gold;
  next.gems = (next.gems || 0) + g.gems;
  next.tinh = (next.tinh || 0) + g.tinh;
  next.hoat = (next.hoat || 0) + g.hoat;
  next.so = (next.so || 0) + g.so;
  if (g.stam) next.stamina = (next.stamina || 0) + g.stam;
  if (g.essence) {
    const econ = { ...(next.economy || {}) };
    econ.dreamEssence = (econ.dreamEssence || 0) + g.essence;
    next.economy = econ;
  }
  if (Object.keys(g.shards).length) {
    const shards = { ...(next.shards || {}) };
    for (const [id, n] of Object.entries(g.shards)) shards[id] = (shards[id] || 0) + n;
    next.shards = shards;
  }
  if (Object.keys(g.items).length) {
    const bag = { ...(next.bag || {}) };
    for (const [id, n] of Object.entries(g.items)) bag[id] = (bag[id] || 0) + n;
    next.bag = bag;
  }
  if (Object.keys(g.pets).length) {
    const pet = { ...(next.pet || {}) };
    const owned = { ...(pet.owned || {}) };
    for (const id of Object.keys(g.pets)) owned[id] = true;
    pet.owned = owned;
    next.pet = pet;
  }
  return { player: next, reward: g };
}

export function giftToast(reward) {
  const g = normalizeReward(reward);
  const bits = [g.label].filter(Boolean);
  if (g.gold) bits.push('🪙' + g.gold);
  if (g.gems) bits.push('💎' + g.gems);
  if (g.stam) bits.push('⚡' + g.stam);
  if (g.tinh) bits.push('⚗' + g.tinh);
  if (g.hoat) bits.push('🔥' + g.hoat);
  if (g.so) bits.push('🐚' + g.so);
  if (g.essence) bits.push('✨' + g.essence);
  for (const [id, n] of Object.entries(g.shards)) bits.push(id + ' ×' + n + ' mảnh');
  for (const [id, n] of Object.entries(g.items)) bits.push(id + ' ×' + n);
  for (const id of Object.keys(g.pets)) bits.push('pet:' + id);
  return bits.join(' · ');
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
  const applied = applyGiftToPlayer({ ...next, codes }, g);
  return {
    ok: true,
    key: k,
    ...applied.reward,
    player: applied.player
  };
}

export function validateNick(str) {
  const nick = String(str || '').trim();
  if (nick.length < 4 || nick.length > 14) return { ok: false, msg: 'Hãy nhập 4-14 ký tự' };
  if (/[<>&]/.test(nick)) return { ok: false, msg: 'Tên không hợp lệ.' };
  return { ok: true, nick };
}
