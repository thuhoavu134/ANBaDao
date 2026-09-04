const BACKGROUND_ROOT = 'assets/battle/backgrounds-v1';

/**
 * The authored battle-stage set from the Hồn Việt / Mộng Giới background pack.
 * Keep this data independent from the HTML patch so campaign, QA and future
 * battle modes can select the same deterministic artwork.
 */
export const BATTLE_BACKGROUND_ENTRIES = Object.freeze([
  { index: 1, key: 'thanh-truc-suong-lam', label: 'Thung lũng trúc sương lam', source: `${BACKGROUND_ROOT}/01-thanh-truc-suong-lam.png` },
  { index: 2, key: 'thac-bac-ngan-son', label: 'Thác Bạc Ngân Sơn', source: `${BACKGROUND_ROOT}/02-thac-bac-ngan-son.png` },
  { index: 3, key: 'ho-lien-nguyet', label: 'Hồ Liên Nguyệt', source: `${BACKGROUND_ROOT}/03-ho-lien-nguyet.png` },
  { index: 4, key: 'quan-ai-phong-diep', label: 'Quán Ải Phong Diệp', source: `${BACKGROUND_ROOT}/04-quan-ai-phong-diep.png` },
  { index: 5, key: 'bac-thang-mua-gat', label: 'Bậc thang mùa gặt', source: `${BACKGROUND_ROOT}/05-bac-thang-mua-gat.png` },
  { index: 6, key: 'ben-song-den-hoa', label: 'Bến sông đèn hoa', source: `${BACKGROUND_ROOT}/06-ben-song-den-hoa.png` },
  { index: 7, key: 'son-tu-van-hai', label: 'Sơn tự Vân Hải', source: `${BACKGROUND_ROOT}/07-son-tu-van-hai.png` },
  { index: 8, key: 'co-moc-dinh-lang', label: 'Cổ Mộc Đình Làng', source: `${BACKGROUND_ROOT}/08-co-moc-dinh-lang.png` },
  { index: 9, key: 'thung-lung-da-lam', label: 'Thung lũng đá lam', source: `${BACKGROUND_ROOT}/09-thung-lung-da-lam.png` },
  { index: 10, key: 'dao-nguyen-xuan', label: 'Đào Nguyên Xuân', source: `${BACKGROUND_ROOT}/10-dao-nguyen-xuan.png` },
  { index: 11, key: 'lang-lo-dong', label: 'Làng Lò Đồng', source: `${BACKGROUND_ROOT}/11-lang-lo-dong.png` },
  { index: 12, key: 'den-vu-loi', label: 'Đền Vũ Lôi', source: `${BACKGROUND_ROOT}/12-den-vu-loi.png` },
  { index: 13, key: 'lang-hai-nhai', label: 'Làng Hải Nhai', source: `${BACKGROUND_ROOT}/13-lang-hai-nhai.png` },
  { index: 14, key: 'tung-tuyet-co-son', label: 'Tùng Tuyết Cổ Sơn', source: `${BACKGROUND_ROOT}/14-tung-tuyet-co-son.png` },
  { index: 15, key: 'tim-hoang-hon', label: 'Miền tím hoàng hôn', source: `${BACKGROUND_ROOT}/15-tim-hoang-hon.png` },
  { index: 16, key: 'hang-van-nhu', label: 'Hang Vạn Nhũ', source: `${BACKGROUND_ROOT}/16-hang-van-nhu.png` },
  { index: 17, key: 'doi-tra-may', label: 'Đồi Trà Mây', source: `${BACKGROUND_ROOT}/17-doi-tra-may.png` },
  { index: 18, key: 'co-thanh-da', label: 'Cổ Thành Đá', source: `${BACKGROUND_ROOT}/18-co-thanh-da.png` },
  { index: 19, key: 'vuon-thuy-truc', label: 'Vườn Thủy Trúc', source: `${BACKGROUND_ROOT}/19-vuon-thuy-truc.png` },
  { index: 20, key: 'san-hoi-mua-vang', label: 'Sân hội mùa vàng', source: `${BACKGROUND_ROOT}/20-san-hoi-mua-vang.png` }
].map((entry) => Object.freeze(entry)));

// The first campaign encounters get authored themes in sequence. Training and
// the stable fallback reserve the final two themes, while unknown IDs use a
// deterministic hash so newly added encounters still receive variety.
export const BATTLE_BACKGROUND_ID_ORDER = Object.freeze([
  'ch01_fight_street_mobs',
  'ch01_boss_chungcu',
  'ch02_fight_email_bay',
  'ch02_fight_bao_cao_song',
  'ch02_boss_sep_tong',
  'ch03_fight_vo_so_rong',
  'ch03_fight_tau_ma',
  'ch03_boss_cua_hoang_de',
  'ch04_fight_day_chuyen',
  'ch04_fight_quan_ly_ca_dem',
  'ch04_boss_giam_doc',
  'ch05_fight_sinh_nhat_trong',
  'ch05_fight_thu_chua_gui',
  'ch05_boss_ban_the_bi_quen',
  'ch06_fight_tang_may',
  'ch06_boss_phase_1',
  'ch06_boss_phase_2',
  'ch06_boss_phase_3',
  'luyen_tap',
  'default'
]);

export const BATTLE_BACKGROUND_BY_BATTLE_ID = Object.freeze(
  Object.fromEntries(BATTLE_BACKGROUND_ID_ORDER.map((battleId, index) => [battleId, BATTLE_BACKGROUND_ENTRIES[index]]))
);

function stableHash(value) {
  return [...String(value)].reduce((hash, character) => (
    ((hash * 31) + character.codePointAt(0)) >>> 0
  ), 17);
}

export function selectBattleBackground(battleId = '') {
  const normalizedId = String(battleId || '').trim();
  if (BATTLE_BACKGROUND_BY_BATTLE_ID[normalizedId]) return BATTLE_BACKGROUND_BY_BATTLE_ID[normalizedId];
  if (!normalizedId) return BATTLE_BACKGROUND_BY_BATTLE_ID.default;
  return BATTLE_BACKGROUND_ENTRIES[stableHash(normalizedId) % BATTLE_BACKGROUND_ENTRIES.length];
}
