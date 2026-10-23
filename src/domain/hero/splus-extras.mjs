import {BE_AN_HERO} from './be-an.mjs';
import {TIEU_PHONG_HERO} from './tieu-phong.mjs';
import {KY_VAN_HERO} from './ky-van.mjs';
import {TICH_DAO_HERO} from './tich-dao.mjs';
import {HONG_THUONG_HERO} from './hong-thuong.mjs';
import {VAN_PHONG_HERO} from './van-phong.mjs';
import {NGUYET_DIEP_HERO} from './nguyet-diep.mjs';
import {TINH_MAC_HERO} from './tinh-mac.mjs';
import {LANG_VAN_HERO} from './lang-van.mjs';
import {LANG_TIEU_HERO} from './lang-tieu.mjs';
import {LANG_NGUYET_HERO} from './lang-nguyet.mjs';
/* @scaffold:import (scripts/hero/scaffold.mjs adds one import per new hero above this line) */
// Authored S+ extras live outside the locked 42-hero / 7-per-element grid.
// Bạch Diện is Tướng 03 S+ by owner bible 15/09; Canvas Sprite Runtime pack TKT-0154.

const A = (name, shortName, target, description, effects, rules = {}) => ({
  name, shortName: shortName || name, target, description, effects, rules
});

const bachDienSkills = Object.freeze({
  passive: A(
    'Diện Khúc Luân Hồi',
    null,
    'Bản thân; khi tung kỹ năng, né đòn, hoặc nhận chí mạng',
    'Mỗi khi tung kỹ năng hoặc né đòn thành công, Bạch Diện đổi một chiếc mặt nạ trên mặt. Mặt Hỷ tăng 25% tỷ lệ bạo kích trong 2 hiệp. Mặt Nộ tăng 30% sát thương bạo kích và hút 15% sát thương gây ra thành máu trong 2 hiệp. Khi nhận đòn chí mạng, Thế Thân Chi Diện tiêu hao toàn bộ mặt nạ còn lại, miễn nhiễm đòn đó, tàng hình 1 hiệp rồi xuất hiện sau lưng kẻ vừa đánh.',
    ['Mặt Hỷ', 'Mặt Nộ', 'Thế Thân Chi Diện'],
    { joyCrit: 0.25, rageCritDamage: 0.3, rageLifesteal: 0.15, maskTurns: 2, masks: 3, vanishTurns: 1 }
  ),
  skill: A(
    'Huyễn Diện Trảm',
    null,
    'Tướng địch có lượng máu thấp nhất',
    'Bạch Diện vung mạnh quạt sắt, phóng luồng khí hình mặt quỷ trắng viền mực đen xé toạc không gian vào tướng địch có lượng máu thấp nhất. Gây 240% Công kích sát thương phép hệ Âm Hồn. Nếu mục tiêu đang dưới 40% máu, đòn đánh chắc chắn bạo kích và khiến nạn nhân rơi vào Mê Loạn, giảm 50% Giáp phép trong 2 hiệp.',
    ['Sát thương phép 240%', 'Bạo kích khi máu thấp', 'Mê Loạn'],
    { multiplier: 2.4, executeRatio: 0.4, magicArmorDown: 0.5, turns: 2 }
  ),
  ultimate: A(
    'Ly Hồn Đoạt Phách',
    null,
    'Tướng địch có Công kích cao nhất',
    'Bạch Diện ném chiếc mặt nạ chính diện bay vút ghim vào mặt tướng địch có Công kích cao nhất, tráo đổi một phần hồn phách. Gây 420% Công kích sát thương phép đơn mục tiêu, đánh cắp 25% Công kích của mục tiêu chuyển sang bản thân trong 2 hiệp, đồng thời khóa hành động, cấm hồi máu và cấm nhận buff trong 1 hiệp. Tốn 100 Nộ.',
    ['Sát thương phép 420%', 'Cắp Công', 'Khóa hành động'],
    { multiplier: 4.2, stealAtk: 0.25, turns: 2, lockTurns: 1, cost: 100 }
  )
});

const skill = (slot, id, cost, cooldown) => Object.freeze({ ...bachDienSkills[slot], id, cost, cooldown });

export const SPLUS_EXTRA_HEROES = Object.freeze([
  Object.freeze({
    id: 'hero_splus_bach_dien',
    key: 'bach_dien',
    number: null,
    catalogKind: 'authored-extra',
    name: 'Bạch Diện',
    fullName: 'Bạch Diện Thần Quân',
    rarity: 'S+',
    element: 'soul',
    elementName: 'Âm Hồn',
    role: 'duelist',
    recommendedSlots: Object.freeze([4, 5]),
    weapon: 'Huyễn Hồn Phiến',
    profileVersion: 'splus-extra/2026-09-15-bach-dien',
    gender: 'Nam dạng / phi nhị nguyên',
    age: 'Thanh niên · khoảng 24 tuổi',
    introduction: 'Nghệ nhân hí kịch mang mặt nạ trắng sứ, quạt sắt Huyễn Hồn Phiến và ba mặt nạ gỗ hí nộ. Sát thủ phép hàng sau: tráo hồn phách, dồn sát thương đơn mục tiêu, né đòn rồi phản phệ.',
    voice: Object.freeze({
      lobby: 'Đời người như vở kịch ngắn ngủi... Đến khi hạ màn, ai mới là kẻ đeo mặt nạ?',
      basic: 'Nhát quạt đoạn trần duyên!',
      skill: 'Hý biến vô thường... Xem ngươi diễn tiếp ra sao!',
      ultimate: 'Mượn xác tráo hồn... Khúc ca tuyệt mệnh!',
      defeat: 'Mặt nạ... vỡ rồi...'
    }),
    art: Object.freeze({
      status: 'canvas-sprite-runtime-v2',
      facing: 'three-quarter-right',
      feet: 'flat-clean-floor',
      portrait: 'assets/characters/bach-dien/avatar.webp',
      card: 'assets/characters/bach-dien/card.webp',
      hudIcon: 'assets/characters/bach-dien/hud-icon.webp',
      atlas: 'assets/characters/bach-dien/idle-atlas.webp'
    }),
    iconId: 'splus.bach_dien.passive',
    passiveName: 'Diện Khúc Luân Hồi',
    actions: Object.freeze({
      basic: Object.freeze({ id: 'bach_dien.basic', name: 'Đánh thường', description: 'Nhát quạt đoạn trần duyên. Đòn đánh thường của Bạch Diện.', cost: 0 }),
      skill: skill('skill', 'bach_dien.skill1', 25, 2),
      ultimate: skill('ultimate', 'bach_dien.ultimate', 100, 0)
    }),
    passive: skill('passive', 'bach_dien.passive', 0, 0)
  }),
  KY_VAN_HERO, TIEU_PHONG_HERO, TICH_DAO_HERO, HONG_THUONG_HERO, BE_AN_HERO, VAN_PHONG_HERO, NGUYET_DIEP_HERO, TINH_MAC_HERO, LANG_VAN_HERO, LANG_TIEU_HERO, LANG_NGUYET_HERO
  /* @scaffold:hero (one entry per new hero above this line) */
]);

export const SPLUS_EXTRA_BY_ID = Object.freeze(Object.fromEntries(SPLUS_EXTRA_HEROES.map(h => [h.id, h])));

export const BACH_DIEN_ALIASES = Object.freeze({
  bach_dien: 'hero_splus_bach_dien',
  'bach-dien': 'hero_splus_bach_dien',
  hero_splus_bach_dien: 'hero_splus_bach_dien'
});

export function resolveSplusExtraId(id) {
  const raw = String(id || '').trim();
  if (!raw) return '';
  if (/^(?:hero_splus_)?be[_-]an$/i.test(raw)) return 'hero_splus_be_an';
  if (/^(?:hero_splus_)?tieu[_-]phong$/i.test(raw)) return 'hero_splus_tieu_phong';
  if (/^(?:hero_splus_)?ky[_-]van$/i.test(raw)) return 'hero_splus_ky_van';
  if (/^(?:hero_splus_)?tich[_-]dao$/i.test(raw)) return 'hero_splus_tich_dao';
  if (/^(?:hero_splus_)?hong[_-]thuong$/i.test(raw)) return 'hero_splus_hong_thuong';
  if (/^(?:hero_splus_)?(?:bach[_-]y[_-])?van[_-]phong$/i.test(raw)) return 'hero_splus_van_phong';
  // Any extra hero resolves by its key (with or without hero_splus_, '-' or '_'): no per-hero regex needed.
  const byKey = SPLUS_EXTRA_HEROES.find(h => h.key === raw.toLowerCase().replace(/^hero_splus_/, '').replace(/-/g, '_'));
  if (byKey) return byKey.id;
  if (Object.hasOwn(BACH_DIEN_ALIASES, raw)) return BACH_DIEN_ALIASES[raw];
  const lower = raw.toLowerCase();
  if (Object.hasOwn(BACH_DIEN_ALIASES, lower)) return BACH_DIEN_ALIASES[lower];
  const underscored = lower.replace(/-/g, '_');
  if (Object.hasOwn(BACH_DIEN_ALIASES, underscored)) return BACH_DIEN_ALIASES[underscored];
  return raw;
}


