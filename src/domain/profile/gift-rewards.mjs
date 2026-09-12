import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { EQUIPMENT_ASSET_REGISTRY, FORGE_MATERIAL_ASSETS } from '../equipment/item-assets.mjs';
import { ACCOUNT_PETS } from '../equipment/account-pets.mjs';
import { extractCatalogFromRuntimeSource } from '../catalog/extract-catalog.mjs';

export const GIFT_CURRENCIES = Object.freeze(['gold', 'gems', 'stam', 'tinh', 'hoat', 'so', 'essence']);

export const STARTER_HERO_IDS = Object.freeze([
  'ong_hang_pho', 'thay_mo', 'lac_yen', 'cung_thu_tre', 'co_dao_ganh_hoi', 'phong_tu',
  'thuy_nuong_roi_nuoc', 'hong_lien_dao_nuong', 'thach_quyen', 'dinh_loi', 'luc_anh', 'to_diep'
]);

export function listEquipmentItemIds() {
  const ids = [];
  for (const slot of Object.keys(EQUIPMENT_ASSET_REGISTRY)) {
    for (const rar of Object.keys(EQUIPMENT_ASSET_REGISTRY[slot])) {
      const row = EQUIPMENT_ASSET_REGISTRY[slot][rar];
      if (row?.id) ids.push(row.id);
    }
  }
  for (const key of Object.keys(FORGE_MATERIAL_ASSETS)) {
    const row = FORGE_MATERIAL_ASSETS[key];
    if (row?.id) ids.push(row.id);
  }
  return ids;
}

export function listPetIds() {
  return ACCOUNT_PETS.map(p => p.id);
}

export function liveHeroIds(data = {}, { indexHtml, skipIndexFile } = {}) {
  const ids = new Set(STARTER_HERO_IDS);
  Object.keys(data.heroes || {}).forEach(id => ids.add(id));
  if (Array.isArray(data.playableIds)) data.playableIds.forEach(id => ids.add(id));
  if (typeof OFFICIAL_ROSTER_12_IDS !== 'undefined' && Array.isArray(OFFICIAL_ROSTER_12_IDS)) {
    OFFICIAL_ROSTER_12_IDS.forEach(id => ids.add(id));
  }
  let source = indexHtml;
  if (source == null && !skipIndexFile) {
    try { source = readFileSync(join(process.cwd(), 'index.html'), 'utf8'); } catch { source = ''; }
  }
  if (source) {
    try {
      const cat = extractCatalogFromRuntimeSource(source);
      (cat.playableIds || []).forEach(id => ids.add(id));
      Object.keys(cat.heroes || {}).forEach(id => ids.add(id));
    } catch {}
  }
  return [...ids].filter(Boolean).sort();
}

export function buildGiftRewardIndex(data = {}, opts = {}) {
  const items = new Set(listEquipmentItemIds());
  const defs = (data.items && (data.items.defs || data.items.catalog)) || {};
  Object.keys(defs).forEach(id => items.add(id));
  if (data.materials) Object.keys(data.materials).forEach(id => items.add(id));
  const pets = new Set(listPetIds());
  Object.keys(data.pets || data.pet || {}).forEach(id => pets.add(id));
  return {
    currencies: GIFT_CURRENCIES.slice(),
    heroes: liveHeroIds(data, opts),
    items: [...items].sort(),
    pets: [...pets].sort()
  };
}
