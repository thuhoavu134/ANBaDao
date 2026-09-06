const RARITIES = Object.freeze(['b', 'a', 's', 'ss', 'ssr']);
const freezeRecord = value => Object.freeze({ ...value });

export const EQUIPMENT_ASSET_SCHEMA = 'hon-viet-equipment-assets/v1';
export const EQUIPMENT_ASSET_VERSION = 'e11-imagen-v1';

const item = (slot, rarity, name) => freezeRecord({
  id: `equipment.${slot}.${rarity}`,
  slot,
  rarity,
  name,
  path: `assets/items/equipment/${slot}-${rarity}.png`,
  source: 'imagen',
  status: 'integrated'
});

export const EQUIPMENT_ASSET_REGISTRY = Object.freeze({
  weapon: Object.freeze({
    b: item('weapon', 'b', 'Đũa Tre Gõ Nồi'),
    a: item('weapon', 'a', 'Muôi Đồng Ký Ức'),
    s: item('weapon', 's', 'Dao Thái Sương Mù'),
    ss: item('weapon', 'ss', 'Cán Chổi Quét Mộng'),
    ssr: item('weapon', 'ssr', 'Vá Múc Ngân Hà')
  }),
  armor: Object.freeze({
    b: item('armor', 'b', 'Áo Mưa Giấy'),
    a: item('armor', 'a', 'Áo Khoác Ca Đêm'),
    s: item('armor', 's', 'Giáp Thùng Xốp Ép'),
    ss: item('armor', 'ss', 'Chăn Bông Ký Túc'),
    ssr: item('armor', 'ssr', 'Áo Choàng Dệt Từ Ngáy')
  }),
  charm: Object.freeze({
    b: item('charm', 'b', 'Nút Chai May Mắn'),
    a: item('charm', 'a', 'Vé Số Trượt Ép Nhựa'),
    s: item('charm', 's', 'Chuông Gió Lặng'),
    ss: item('charm', 'ss', 'Tem Thư Chưa Gửi'),
    ssr: item('charm', 'ssr', 'Mảnh Trăng Cá Voi Nhả')
  }),
  boots: Object.freeze({
    b: item('boots', 'b', 'Dép Tổ Ong Mòn'),
    a: item('boots', 'a', 'Giày Vải Ga Tàu'),
    s: item('boots', 's', 'Guốc Gỗ Không Tiếng'),
    ss: item('boots', 'ss', 'Dép Lào Phi Hành'),
    ssr: item('boots', 'ssr', 'Hài Mây Cà Phê')
  })
});

export const FORGE_MATERIAL_ASSETS = Object.freeze({
  tinh: freezeRecord({ id: 'material.tinh-luc', name: 'Tinh Lực', path: 'assets/items/materials/tinh-luc.png', source: 'imagen', status: 'integrated' }),
  hoat: freezeRecord({ id: 'material.hoat-luc', name: 'Hoạt Lực', path: 'assets/items/materials/hoat-luc.png', source: 'imagen', status: 'integrated' }),
  gold: freezeRecord({ id: 'material.gold', name: 'Vàng', path: 'assets/items/materials/gold.png', source: 'imagen', status: 'integrated' })
});

export function getEquipmentAsset(slot, rarity) {
  return EQUIPMENT_ASSET_REGISTRY[String(slot || '')]?.[String(rarity || '').toLowerCase()] || null;
}

export function getForgeMaterialAsset(id) {
  return FORGE_MATERIAL_ASSETS[String(id || '')] || null;
}

export function validateEquipmentAssetRegistry(registry = EQUIPMENT_ASSET_REGISTRY) {
  const errors = [];
  for (const slot of ['weapon', 'armor', 'charm', 'boots']) {
    for (const rarity of RARITIES) {
      const entry = registry?.[slot]?.[rarity];
      if (!entry?.path || entry.name !== undefined && !String(entry.name).trim()) errors.push(`${slot}.${rarity}`);
    }
  }
  for (const id of ['tinh', 'hoat', 'gold']) {
    if (!registry || !FORGE_MATERIAL_ASSETS[id]?.path) errors.push(`material.${id}`);
  }
  return { ok: errors.length === 0, errors };
}
