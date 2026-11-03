import { SPLUS_EXTRA_BY_ID, SPLUS_EXTRA_HEROES, resolveSplusExtraId } from './splus-extras.mjs';
import { SPLUS_PROFILE_BY_KEY, SPLUS_PROFILE_VERSION } from './splus-profile-data.mjs';
export const SPLUS_SCHEMA = 'luc-than-splus42/v2';
export const SPLUS_ELEMENTS = Object.freeze({metal:'Kim',soul:'Hỏa',water:'Thủy',fire:'Hỏa',wood:'Mộc',dream:'Thổ'});
// Numeric omissions are review defaults, not owner-approved balance. Explicit
// percentages in the authored descriptions are implemented by splus-mechanics.
export const SPLUS_REVIEW_DEFAULTS = Object.freeze({skillCooldown:2,skillCost:25,ultimateCost:60,basicRage:15,duration:2,markDuration:3,skillMultiplier:1.4,singleUltimateMultiplier:2.4,aoeUltimateMultiplier:1.2});
const rows = [
  [
    1,
    "co_trong",
    "Cơ Trọng",
    "metal",
    "support",
    [
      5
    ],
    "Bánh Răng Kim Cương",
    "Cỗ Cơ Quan Khí Đồng"
  ],
  [
    7,
    "cuong_dong",
    "Cường Đồng",
    "metal",
    "guardian",
    [
      1,
      2
    ],
    "Đồng Thuẫn Bất Hoại",
    "Đông Sơn Đại Đồng Thuẫn"
  ],
  [
    13,
    "lac_an",
    "Lạc An",
    "metal",
    "ranger",
    [
      4,
      6
    ],
    "Thần Xạ Mục Tiêu",
    "Kim Cổ Thần Nỏ"
  ],
  [
    19,
    "hac_pha",
    "Hạc Phá",
    "metal",
    "striker",
    [
      2,
      3
    ],
    "Cuồng Nộ Chim Lạc",
    "Lạc Điêu Kim Rìu"
  ],
  [
    25,
    "thiet_lanh",
    "Thiết Lãnh",
    "metal",
    "guardian",
    [
      1,
      2
    ],
    "Thép Nguội",
    "Bách Luyện Hắc Thiết Kiềm"
  ],
  [
    31,
    "minh_toa",
    "Minh Tỏa",
    "metal",
    "guardian",
    [
      1,
      2
    ],
    "Kim Thiết Trấn Khẩu",
    "Càn Khôn Đồng Khóa & Phá Ma Đại Thược"
  ],
  [
    37,
    "thiem_ngan",
    "Thiềm Ngân",
    "metal",
    "healer",
    [
      5
    ],
    "Ngân Lưu Tố Thể",
    "Ngân Đe & Kim Búa"
  ],
  [
    2,
    "linh_dong",
    "Linh Đồng",
    "soul",
    "mystic",
    [
      4
    ],
    "Oan Linh Tỏa",
    "Lạc Âm Song Chuông"
  ],
  [
    8,
    "tieu_hon",
    "Tiêu Hồn",
    "soul",
    "duelist",
    [
      6
    ],
    "Đoạt Phách Khúc",
    "Cốt Tiêu U Minh"
  ],
  [
    14,
    "thach_kinh",
    "Thạch Kinh",
    "soul",
    "guardian",
    [
      1,
      2
    ],
    "Oán Khí Cột Đá",
    "Trấn Hồn Thạch Trụ"
  ],
  [
    20,
    "han_nuong",
    "Hàn Nương",
    "soul",
    "mystic",
    [
      4,
      5
    ],
    "Tiền Trảm Hàn Khí",
    "Đoạn Hồn Kim Kéo"
  ],
  [
    26,
    "vong_co",
    "Vọng Cơ",
    "soul",
    "support",
    [
      5,
      6
    ],
    "Vong Niệm",
    "Vong Niệm Mộc Trượng"
  ],
  [
    32,
    "co_nuong",
    "Cổ Nương",
    "soul",
    "mystic",
    [
      4,
      6
    ],
    "Trùng Hồn Ký Sinh",
    "Cửu Xà Cốt Cầm"
  ],
  [
    40,
    "muc_chieu",
    "Mục Chiêu",
    "soul",
    "healer",
    [
      5
    ],
    "Hộ Mệnh Hồn Đăng",
    "Trúc Trượng Lạc Linh & Chiêu Hồn Bát"
  ],
  [
    3,
    "thuy_co",
    "Thủy Cơ",
    "water",
    "healer",
    [
      5
    ],
    "Lạc Thủy Gia Tốc",
    "Thủy Vân Tơ Lụa"
  ],
  [
    9,
    "ha_lang",
    "Hà Lãng",
    "water",
    "mystic",
    [
      4
    ],
    "Ba Động Đập Trùng",
    "Hải Loa Thần Khí"
  ],
  [
    15,
    "giang_quan",
    "Giang Quân",
    "water",
    "guardian",
    [
      1,
      2
    ],
    "Thiết Cọc Trấn Thủy",
    "Bạch Đằng Hắc Thiết Cọc"
  ],
  [
    21,
    "thuy_ngoc",
    "Thủy Ngọc",
    "water",
    "support",
    [
      5,
      6
    ],
    "Linh Châu Tụ Nộ",
    "Thủy Tinh Châu"
  ],
  [
    27,
    "hai_phong",
    "Hải Phong",
    "water",
    "striker",
    [
      2,
      3
    ],
    "Nộ Kình Hộ Thể",
    "Kình Lực Tam Xoa Kích & Lưới Chì"
  ],
  [
    35,
    "tram_chau",
    "Trầm Châu",
    "water",
    "guardian",
    [
      1,
      2
    ],
    "Bọt Châu Kháng Bạo",
    "Song Hạp Xà Cừ Khiên"
  ],
  [
    38,
    "da_xoa",
    "Dạ Xoa",
    "water",
    "duelist",
    [
      3,
      4
    ],
    "Huyết Kình Liệp Sát",
    "Kình Xỉ Cốt Dao"
  ],
  [
    4,
    "nung",
    "Nung",
    "fire",
    "guardian",
    [
      1,
      2
    ],
    "Lò Than Bốc Hỏa",
    "Bát Tràng Hỏa Gốm Bình"
  ],
  [
    10,
    "hoa_tieu",
    "Hỏa Tiêu",
    "fire",
    "ranger",
    [
      4,
      6
    ],
    "Pháo Hoa Mù Mắt",
    "Thần Cơ Hỏa Tiễn Ống"
  ],
  [
    16,
    "hoa_khieu",
    "Hỏa Khiêu",
    "fire",
    "support",
    [
      5
    ],
    "Than Hồng Cuồng Nhiệt",
    "Song Đoạn Hỏa Côn"
  ],
  [
    22,
    "cuu_tinh",
    "Cửu Tính",
    "fire",
    "ranger",
    [
      4,
      6
    ],
    "Nợ Máu",
    "Xích Hỏa Cửu Toán"
  ],
  [
    28,
    "hoa_bai",
    "Hỏa Bài",
    "fire",
    "mystic",
    [
      4,
      5
    ],
    "Bột Lửa Lưu Huỳnh",
    "Xích Hỏa Chày & Ma Nham Cối"
  ],
  [
    34,
    "hac_dao",
    "Hắc Đao",
    "fire",
    "striker",
    [
      2,
      3
    ],
    "Vết Thương Sâu",
    "Song Trảm Cốt Đao & Móc Treo Thịt"
  ],
  [
    41,
    "hoa_duc",
    "Hỏa Dực",
    "fire",
    "healer",
    [
      5
    ],
    "Đan Sa Tái Sinh",
    "Chu Sa Đan Hồ & Xích Đồng Phất Trần"
  ],
  [
    5,
    "mien_nuong",
    "Miên Nương",
    "wood",
    "healer",
    [
      5
    ],
    "Hương Hoa Nhài",
    "Bách Thảo Hoa Lam"
  ],
  [
    11,
    "tram_tue",
    "Trầm Tuệ",
    "wood",
    "mystic",
    [
      4
    ],
    "Trầm Mê Giảm Lực",
    "Trầm Hương Huân Lư"
  ],
  [
    17,
    "hac_hoa",
    "Hạc Hoa",
    "wood",
    "mystic",
    [
      6
    ],
    "Gai Mây Siết Thịt",
    "Kim Cương Mộc Tiên"
  ],
  [
    23,
    "tam_nuong",
    "Tằm Nương",
    "wood",
    "guardian",
    [
      2,
      3
    ],
    "Kén Vàng Hộ Thể",
    "Bách Niên Mộc Thoi"
  ],
  [
    29,
    "son_cuong",
    "Sơn Cương",
    "wood",
    "striker",
    [
      2,
      3
    ],
    "Chảy Máu Mủ Sơn",
    "Tróc Mộc Liêm Đao"
  ],
  [
    33,
    "tue_y",
    "Tuệ Y",
    "wood",
    "healer",
    [
      5
    ],
    "Nam Dược Thần Hiệu",
    "Bách Thảo Dược Tráp & Cửu Chuyển Ngân Châm"
  ],
  [
    42,
    "mang_xa",
    "Mãng Xà",
    "wood",
    "ranger",
    [
      4,
      6
    ],
    "Mãng Độc Tê Liệt",
    "Cửu Tiễn Độc Mộc Nỏ"
  ],
  [
    6,
    "khaos",
    "Khaos",
    "dream",
    "mystic",
    [
      3,
      4,
      5
    ],
    "Mặc Nhãn Phù Lục",
    "Đại Bút Thủy Mặc"
  ],
  [
    12,
    "kinh_nuong",
    "Kính Nương",
    "dream",
    "support",
    [
      5
    ],
    "Gương Soi Phản Pháo",
    "Chiếu Mộng Kính"
  ],
  [
    18,
    "hoi_anh",
    "Hồi Ảnh",
    "dream",
    "mystic",
    [
      4
    ],
    "Rối Hạp Loạn Mộng",
    "Huyễn Mộng Rối Hạp"
  ],
  [
    24,
    "van_phap",
    "Vân Pháp",
    "dream",
    "support",
    [
      5
    ],
    "Lạc Mộng Chuông Khiên",
    "Vạn Vân Mộng Lọng"
  ],
  [
    30,
    "cuu_trieu",
    "Cửu Triều",
    "dream",
    "mystic",
    [
      5
    ],
    "Thời Không Nhịp Điệu",
    "Cửu Long Phá Hư Cổ"
  ],
  [
    36,
    "thach_mong",
    "Thạch Mộng",
    "dream",
    "guardian",
    [
      1,
      2
    ],
    "Hư Giới Hấp Kình",
    "Nghê Thần Hư Không Thuẫn"
  ],
  [
    39,
    "to_linh",
    "Tố Linh",
    "dream",
    "mystic",
    [
      4,
      6
    ],
    "Mực Mộng Định Thân",
    "Càn Khôn Họa Quyển & Bách Linh Mặc Bút"
  ]
];

export const SPLUS_HEROES = Object.freeze(rows.map(([number,key,name,element,role,slots,passiveName,weapon])=>{
  const p=SPLUS_PROFILE_BY_KEY[key];
  const skill=(slot,id,cost,cooldown)=>Object.freeze({...p.skills[slot],id,cost,cooldown});
  const art=key==='linh_dong'
    ? Object.freeze({status:'authored-rgba-v1',facing:'three-quarter-right',feet:'flat-clean-floor',portrait:'assets/characters/linh-dong/avatar.webp',atlas:'assets/characters/linh-dong/idle-atlas.webp'})
    : key==='co_nuong'
      ? Object.freeze({status:'authored-rgba-v1',facing:'three-quarter-right',feet:'flat-clean-floor',portrait:'assets/characters/co-nuong/avatar.webp',atlas:'assets/characters/co-nuong/idle.webp'})
      : Object.freeze({status:'awaiting-authored-assets',facing:'three-quarter-right',feet:'flat-clean-floor',portrait:null,atlas:null});
  return Object.freeze({id:`hero_splus_${key}`,key,number,name,rarity:'S+',element,elementName:SPLUS_ELEMENTS[element],role,
    recommendedSlots:Object.freeze(slots.map(slot=>slot-1)),weapon,profileVersion:SPLUS_PROFILE_VERSION,
    gender:p.gender,age:p.age,introduction:p.introduction,voice:Object.freeze(p.voice),
    art,
    iconId:`splus.${key}.passive`,passiveName,
    actions:Object.freeze({basic:Object.freeze({id:`${key}.basic`,name:key==='co_nuong'?'Cầm Âm Gieo Cổ':'Đánh thường',description:key==='co_nuong'?'Gây 100% Công sát thương Âm Hồn lên kẻ có Máu Tối Đa cao nhất ở hàng trước hợp lệ; nếu mục tiêu mất Máu, gieo 1 tầng Trùng Hồn.':'Đòn đánh thường kích hoạt nội tại khi trúng.',cost:0}),
      skill:skill('skill',`${key}.skill1`,key==='co_nuong'?0:25,2),ultimate:skill('ultimate',`${key}.ultimate`,60,0)}),
    passive:skill('passive',`${key}.passive`,0,0),reviewDefaults:SPLUS_REVIEW_DEFAULTS});
}));
export const SPLUS_HERO_BY_ID = Object.freeze(Object.fromEntries(SPLUS_HEROES.map(hero=>[hero.id,hero])));
export { SPLUS_EXTRA_HEROES, SPLUS_EXTRA_BY_ID };
export function getSplusHero(id) {
  const raw=String(id||'');
  if(Object.hasOwn(SPLUS_HERO_BY_ID,raw))return SPLUS_HERO_BY_ID[raw];
  const extraId=resolveSplusExtraId(raw);
  if(Object.hasOwn(SPLUS_EXTRA_BY_ID,extraId))return SPLUS_EXTRA_BY_ID[extraId];
  return null;
}

export function validateSplusCatalog(heroes=SPLUS_HEROES) {
  const errors=[];const ids=new Set();const numbers=new Set();
  for(const h of heroes){
    if(ids.has(h.id))errors.push(`DUPLICATE_ID:${h.id}`);ids.add(h.id);
    if(numbers.has(h.number))errors.push(`DUPLICATE_NUMBER:${h.number}`);numbers.add(h.number);
    if(!SPLUS_ELEMENTS[h.element])errors.push(`UNKNOWN_ELEMENT:${h.id}`);
    if(!h.recommendedSlots.length||h.recommendedSlots.some(s=>!Number.isInteger(s)||s<0||s>5))errors.push(`INVALID_SLOT:${h.id}`);
    if(!h.passive?.description||['basic','skill','ultimate'].some(a=>!h.actions[a]?.description))errors.push(`INCOMPLETE_KIT:${h.id}`);
  }
  if(heroes.length!==42)errors.push('EXPECTED_42_HEROES');
  for(const element of Object.keys(SPLUS_ELEMENTS))if(heroes.filter(h=>h.element===element).length!==7)errors.push(`EXPECTED_7:${element}`);
  return {ok:!errors.length,errors,count:heroes.length};
}

