export const HERO_SKILL_KIT_SCHEMA = 'hon-viet-skill-kit/v1';
export const HERO_SKILL_KIT_VERSION = 'samkok-v2.1';

const ACTION_KEYS = Object.freeze(['basic', 'ultimate']);

const ONG_HANG_PHO_KIT = Object.freeze({
  heroId: 'ong_hang_pho',
  kitId: 'ong_hang_pho.kit.samkok-v2.1',
  kitVersion: HERO_SKILL_KIT_VERSION,
  basicId: 'ong_hang_pho.basic.thiet-va',
  ultimateId: 'ong_hang_pho.ultimate.long-trieu',
  passiveIds: Object.freeze(['ong_hang_pho.passive.nem-vi']),
  actions: Object.freeze({
    basic: Object.freeze({
      id: 'ong_hang_pho.basic.thiet-va',
      slot: 'basic',
      name: 'Thiết Vá Chấn Kình',
      cost: 0,
      kind: 'stun',
      multiplier: 1.90,
      target: 'single_enemy',
      animation: 'ong-pho.skill1',
      vfx: 'ong-pho.nem-vi-impact',
      sfx: 'ong-pho.hammer-keng',
      description: 'Lao tới quét chiếc vá hai nhịp; mỗi lần chạm có thể bồi Nêm Vị và nhịp sau dễ choáng hơn.'
    }),
    ultimate: Object.freeze({
      id: 'ong_hang_pho.ultimate.long-trieu',
      slot: 'ultimate',
      name: 'Thiết Vá Long Triều',
      cost: 60,
      kind: 'aoe',
      multiplier: 1.38,
      target: 'all_enemies',
      animation: 'ong-pho.ultimate',
      vfx: 'ong-pho.long-trieu-reveal',
      sfx: 'ong-pho.hammer-keng',
      description: 'Quét toàn địch; mỗi tầng Nêm Vị tăng sát thương, đủ 3 tầng sẽ Tiêu Vị và Choáng.'
    })
  }),
  passives: Object.freeze([Object.freeze({
    id: 'ong_hang_pho.passive.nem-vi',
    name: 'Nêm Vị',
    trigger: 'on_basic_hit',
    limit: Object.freeze({ maxStacks: 3, durationTurns: 3, perTarget: true }),
    effect: 'Đánh Basic đặt 1 tầng Nêm Vị; mục tiêu nhiều tầng chịu nhịp vá mạnh hơn và mở Tiêu Vị ở tầng 3.',
    counterplay: 'Đổi mục tiêu hoặc giải Nêm Vị trước khi đủ 3 tầng để cắt nhịp Tiêu Vị.'
  })]),
  // A legacy save never loses its old Skill 1 investment: it becomes the
  // new Basic level while the original field remains available for audits.
  legacySkillMap: Object.freeze({
    skill1: 'ong_hang_pho.basic.thiet-va',
    skill: 'ong_hang_pho.basic.thiet-va',
    ultimate: 'ong_hang_pho.ultimate.long-trieu'
  }),
  assetRequirements: Object.freeze({
    background: Object.freeze({
      path: 'assets/ui/hero-detail/ong-pho-showcase-bg.png',
      status: 'generated-and-integrated',
      source: 'imagen'
    }),
    animation: Object.freeze({ path: 'assets/battle-runtime/embedded-15.png', status: 'existing-authored' }),
    vfx: Object.freeze({ path: 'assets/characters/ong-pho/ultimate-sheet-64-alpha-clean-v310.png', status: 'existing-authored' }),
    sfx: Object.freeze({
      id: 'ong-pho.hammer-keng',
      status: 'needs-user-created',
      brief: 'Keng đồng ngắn ở frame va chạm, âm sắc sáng, 2 lớp kim loại + đuôi vang dưới 240ms.'
    })
  })
});

const LUC_ANH_KIT = Object.freeze({
  heroId: 'luc_anh',
  kitId: 'luc_anh.kit.samkok-v2.1',
  kitVersion: HERO_SKILL_KIT_VERSION,
  basicId: 'luc_anh.basic.anh-dang',
  ultimateId: 'luc_anh.ultimate.doc-van-phu-the',
  passiveIds: Object.freeze(['luc_anh.passive.anh-dan']),
  actions: Object.freeze({
    basic: Object.freeze({
      id: 'luc_anh.basic.anh-dang',
      slot: 'basic',
      name: 'Ảnh Đăng Phóng',
      cost: 0,
      kind: 'damage',
      multiplier: 1,
      target: 'single_enemy',
      animation: 'luc-anh.basic',
      vfx: 'luc-anh.basic-projectile-impact',
      sfx: 'combat-projectile',
      description: 'Giữ vị trí, phóng ảnh đăng vào một mục tiêu và đặt 1 tầng Ảnh Dẫn.'
    }),
    ultimate: Object.freeze({
      id: 'luc_anh.ultimate.doc-van-phu-the',
      slot: 'ultimate',
      name: 'Độc Vân Phủ Thế',
      cost: 60,
      kind: 'aoe',
      multiplier: 1.32,
      target: 'all_enemies',
      animation: 'luc-anh.ultimate',
      vfx: 'luc-anh.ultimate-poison-cloud',
      sfx: 'luc-anh.ultimate-voice-impact',
      description: 'Phủ độc vân lên toàn địch; mỗi tầng Ảnh Dẫn trên mục tiêu tăng 8% sát thương rồi được giải.'
    })
  }),
  passives: Object.freeze([Object.freeze({
    id: 'luc_anh.passive.anh-dan',
    name: 'Ảnh Dẫn',
    trigger: 'on_basic_hit',
    limit: Object.freeze({ maxStacks: 3, durationTurns: 3, perTarget: true }),
    effect: 'Basic đặt 1 tầng Ảnh Dẫn. Ultimate khai thác tối đa 3 tầng, tăng sát thương theo từng mục tiêu rồi tiêu dấu.',
    counterplay: 'Đổi mục tiêu, giải dấu hoặc ép Lục Ảnh dùng Ultimate sớm để giảm phần cộng dồn.'
  })]),
  // The old six-effigy Skill 1 remains addressable for audits and asset QA;
  // it is deliberately not invented as a third v2 action.
  legacySkillMap: Object.freeze({
    skill1: 'luc_anh.basic.anh-dang',
    skill: 'luc_anh.basic.anh-dang',
    ultimate: 'luc_anh.ultimate.doc-van-phu-the'
  }),
  legacyAssets: Object.freeze({
    skill1: Object.freeze({
      id: 'luc_anh.legacy.skill1.six-effigies',
      path: 'assets/characters/luc-anh/skill1_vfx-atlas.webp',
      status: 'preserved-legacy-asset'
    })
  }),
  assetRequirements: Object.freeze({
    background: Object.freeze({
      path: 'assets/ui/hero-detail/luc-anh-showcase-bg.png',
      status: 'generated-and-integrated',
      source: 'imagen'
    }),
    animation: Object.freeze({ path: 'assets/characters/luc-anh/basic-atlas.webp', status: 'existing-authored' }),
    vfx: Object.freeze({ path: 'assets/characters/luc-anh/ultimate_vfx-atlas.webp', status: 'existing-authored' }),
    sfx: Object.freeze({
      id: 'luc-anh.ultimate-voice-impact',
      status: 'needs-user-created',
      brief: 'Một tiếng rung đèn kim loại trầm, lớp gió hút ngắn và đuôi độc vân mềm; đồng bộ frame phủ sân dưới 420ms.'
    })
  })
});

const makeKit = spec => Object.freeze({
  heroId: spec.heroId,
  kitId: `${spec.heroId}.kit.samkok-v2.1`,
  kitVersion: HERO_SKILL_KIT_VERSION,
  basicId: `${spec.heroId}.basic.${spec.basicSlug}`,
  ultimateId: `${spec.heroId}.ultimate.${spec.ultSlug}`,
  passiveIds: Object.freeze([`${spec.heroId}.passive.${spec.passiveSlug}`]),
  actions: Object.freeze({
    basic: Object.freeze({
      id: `${spec.heroId}.basic.${spec.basicSlug}`,
      slot: 'basic',
      name: spec.basicName,
      cost: 0,
      kind: spec.basicKind,
      multiplier: spec.basicMult,
      target: spec.basicTarget,
      animation: spec.animation,
      vfx: spec.basicVfx,
      sfx: spec.sfx,
      description: spec.basicDesc
    }),
    ultimate: Object.freeze({
      id: `${spec.heroId}.ultimate.${spec.ultSlug}`,
      slot: 'ultimate',
      name: spec.ultName,
      cost: spec.ultCost,
      kind: spec.ultKind,
      multiplier: spec.ultMult,
      target: spec.ultTarget,
      animation: spec.animation,
      vfx: spec.ultVfx,
      sfx: spec.sfx,
      description: spec.ultDesc
    })
  }),
  passives: Object.freeze([Object.freeze({
    id: `${spec.heroId}.passive.${spec.passiveSlug}`,
    name: spec.passiveName,
    trigger: spec.passiveTrigger,
    limit: Object.freeze({ maxStacks: spec.maxStacks || 3, durationTurns: spec.durationTurns || 3, perTarget: true }),
    effect: spec.passiveEffect,
    counterplay: spec.counterplay
  })]),
  legacySkillMap: Object.freeze({
    skill1: `${spec.heroId}.basic.${spec.basicSlug}`,
    skill: `${spec.heroId}.basic.${spec.basicSlug}`,
    ultimate: `${spec.heroId}.ultimate.${spec.ultSlug}`
  })
});

const THAY_MO_KIT = makeKit({
  heroId: 'thay_mo', basicSlug: 'chuong-chan-phach', ultSlug: 'tran-anh-phong-mon', passiveSlug: 'an-tran',
  basicName: 'Chuông Chấn Phách', basicKind: 'debuff', basicMult: 1.02, basicTarget: 'all_enemies',
  ultName: 'Trận Ảnh Phong Môn', ultKind: 'aoe', ultMult: 1.32, ultTarget: 'all_enemies', ultCost: 60,
  animation: 'thay-mo.skill', basicVfx: 'thay-mo.bell-wave', ultVfx: 'thay-mo.seal-burst', sfx: 'combat-cast',
  basicDesc: 'Rung chuông tạo sóng chấn phách, gây sát thương diện rộng và giảm nhịp địch.',
  ultDesc: 'Dựng đại trận đánh toàn bộ sáu vị trí địch và kích nổ Ấn Trấn.',
  passiveName: 'Ấn Trấn', passiveTrigger: 'on_basic_hit',
  passiveEffect: 'Basic đặt Ấn Trấn; Ultimate kích nổ ấn trên mỗi mục tiêu.',
  counterplay: 'Giải ấn hoặc đổi mục tiêu trước khi Trận Ảnh Phong Môn nổ.'
});
const LAC_YEN_KIT = makeKit({
  heroId: 'lac_yen', basicSlug: 'mui-no-pha-giap', ultSlug: 'thien-no-truy-hon', passiveSlug: 'pha-giap',
  basicName: 'Mũi Nỏ Phá Giáp', basicKind: 'debuff', basicMult: 1.48, basicTarget: 'single_enemy',
  ultName: 'Thiên Nỏ Truy Hồn', ultKind: 'execute', ultMult: 2.55, ultTarget: 'single_enemy', ultCost: 60,
  animation: 'lac-yen.skill', basicVfx: 'lac-yen.bolt', ultVfx: 'lac-yen.execute', sfx: 'combat-projectile',
  basicDesc: 'Bắn bolt nặng phá giáp mục tiêu; có thể xuyên sang tuyến sau.',
  ultDesc: 'Khóa mục tiêu có phần trăm máu thấp nhất và tung phát kết liễu.',
  passiveName: 'Phá Giáp', passiveTrigger: 'on_basic_hit',
  passiveEffect: 'Basic giảm phòng; Ultimate ưu tiên mục tiêu máu thấp.',
  counterplay: 'Giữ khiên hoặc đổi mục tiêu thấp máu ra sau hàng.'
});
const CUNG_THU_TRE_KIT = makeKit({
  heroId: 'cung_thu_tre', basicSlug: 'truc-tien-xuyen-hang', ultSlug: 'van-truc-lac-vu', passiveSlug: 'ghim',
  basicName: 'Trúc Tiễn Xuyên Hàng', basicKind: 'debuff', basicMult: 1.36, basicTarget: 'single_enemy',
  ultName: 'Vạn Trúc Lạc Vũ', ultKind: 'aoe', ultMult: 1.28, ultTarget: 'all_enemies', ultCost: 60,
  animation: 'cung-thu-tre.skill', basicVfx: 'cung-thu-tre.arrow', ultVfx: 'cung-thu-tre.arrow-rain', sfx: 'combat-projectile',
  basicDesc: 'Tên tre xuyên trục trước–sau và ghim giảm tốc mục tiêu.',
  ultDesc: 'Mưa tên tre phủ toàn bộ đội địch.',
  passiveName: 'Ghim Tre', passiveTrigger: 'on_basic_hit',
  passiveEffect: 'Basic ghim giảm tốc; Ultimate phủ mưa tên lên toàn địch.',
  counterplay: 'Né tuyến thẳng hoặc giải chậm trước mưa tên.'
});
const CO_DAO_GANH_HOI_KIT = makeKit({
  heroId: 'co_dao_ganh_hoi', basicSlug: 'doi-vai-giu-nhip', ultSlug: 'hoi-lang-rop-co', passiveSlug: 'giu-nhip',
  basicName: 'Đổi Vai Giữ Nhịp', basicKind: 'haste', basicMult: 0, basicTarget: 'all_allies',
  ultName: 'Hội Làng Rợp Cờ', ultKind: 'aoe', ultMult: 1.12, ultTarget: 'all_enemies', ultCost: 60,
  animation: 'co-dao.skill', basicVfx: 'co-dao.haste', ultVfx: 'co-dao.festival', sfx: 'combat-cast',
  basicDesc: 'Tăng nhịp và cấp khiên cho đồng minh đang thiếu nộ.',
  ultDesc: 'Gây sát thương toàn địch và tăng tốc toàn đội.',
  passiveName: 'Giữ Nhịp', passiveTrigger: 'on_basic_cast',
  passiveEffect: 'Basic giữ nhịp đồng minh; Ultimate vừa đánh vừa tăng tốc đội.',
  counterplay: 'Cắt nộ Cô Đào hoặc làm câm trước Hội Làng.'
});
const PHONG_TU_KIT = makeKit({
  heroId: 'phong_tu', basicSlug: 'hoan-phong-doat-nhip', ultSlug: 'bat-phong-doan-anh', passiveSlug: 'doat-nhip',
  basicName: 'Hoán Phong Đoạt Nhịp', basicKind: 'strip', basicMult: 1.42, basicTarget: 'single_enemy',
  ultName: 'Bát Phong Đoạn Ảnh', ultKind: 'multi', ultMult: 0.72, ultTarget: 'random_enemy', ultCost: 60,
  animation: 'phong-tu.skill', basicVfx: 'phong-tu.wind', ultVfx: 'phong-tu.multi', sfx: 'combat-slash',
  basicDesc: 'Dash chém mục tiêu, gỡ nhịp tăng tốc và hất lùi lượt.',
  ultDesc: 'Chuỗi dash lướt qua nhiều mục tiêu rồi trở về đúng vị trí.',
  passiveName: 'Đoạt Nhịp', passiveTrigger: 'on_basic_hit',
  passiveEffect: 'Basic gỡ tăng tốc địch; Ultimate dash nhiều nhịp.',
  counterplay: 'Khiên hoặc taunt chặn dash, giữ tốc sau khi bị strip.'
});
const THUY_NUONG_KIT = makeKit({
  heroId: 'thuy_nuong_roi_nuoc', basicSlug: 'keo-man-thuy-dinh', ultSlug: 'thuy-dinh-van-tuong', passiveSlug: 'roi-nuoc',
  basicName: 'Kéo Màn Thủy Đình', basicKind: 'debuff', basicMult: 0.94, basicTarget: 'all_enemies',
  ultName: 'Thủy Đình Vạn Tượng', ultKind: 'aoe', ultMult: 1.26, ultTarget: 'all_enemies', ultCost: 60,
  animation: 'thuy-nuong.skill', basicVfx: 'thuy-nuong.water-stage', ultVfx: 'thuy-nuong.puppet-stage', sfx: 'combat-cast',
  basicDesc: 'Dựng sân nước, gây sát thương và kéo lùi nhịp mục tiêu.',
  ultDesc: 'Rối nước phủ sân khấu, gây AOE và làm chậm toàn địch.',
  passiveName: 'Rối Nước', passiveTrigger: 'on_basic_hit',
  passiveEffect: 'Basic kéo lùi nhịp; Ultimate phủ chậm toàn sân.',
  counterplay: 'Giải chậm hoặc miễn khống trước Thủy Đình.'
});
const HONG_LIEN_KIT = makeKit({
  heroId: 'hong_lien_dao_nuong', basicSlug: 'hong-lien-pha-tuyen', ultSlug: 'cuu-lien-phan-tran', passiveSlug: 'thieu-dot',
  basicName: 'Hồng Liên Phá Tuyến', basicKind: 'damage', basicMult: 1.62, basicTarget: 'single_enemy',
  ultName: 'Cửu Liên Phần Trận', ultKind: 'aoe', ultMult: 1.42, ultTarget: 'all_enemies', ultCost: 60,
  animation: 'hong-lien.skill', basicVfx: 'hong-lien.lotus-slash', ultVfx: 'hong-lien.lotus-field', sfx: 'combat-slash',
  basicDesc: 'Dash xuyên tuyến và thiêu đốt mục tiêu ở contact cuối.',
  ultDesc: 'Chín cánh Hồng Liên quét toàn đội địch.',
  passiveName: 'Thiêu Đốt', passiveTrigger: 'on_basic_hit',
  passiveEffect: 'Basic thiêu đốt contact cuối; Ultimate quét cháy cả sân.',
  counterplay: 'Hàng trước dày máu hoặc giải đốt trước Cửu Liên.'
});
const THACH_QUYEN_KIT = makeKit({
  heroId: 'thach_quyen', basicSlug: 'dia-chan-lien-quyen', ultSlug: 'son-quyen-tran-dia', passiveSlug: 'chan-dong',
  basicName: 'Địa Chấn Liên Quyền', basicKind: 'debuff', basicMult: 1.55, basicTarget: 'single_enemy',
  ultName: 'Sơn Quyền Trấn Địa', ultKind: 'aoe', ultMult: 1.34, ultTarget: 'all_enemies', ultCost: 60,
  animation: 'thach-quyen.skill', basicVfx: 'thach-quyen.shockwave', ultVfx: 'thach-quyen.ground-impact', sfx: 'combat-impact',
  basicDesc: 'Đấm mục tiêu chính, phá thế và phát sóng chấn động sang mục tiêu cạnh bên.',
  ultDesc: 'Đập đất gây sát thương hàng trước và lan ra hàng sau.',
  passiveName: 'Chấn Động', passiveTrigger: 'on_basic_hit',
  passiveEffect: 'Basic lan sóng cạnh bên; Ultimate đập đất cả hai hàng.',
  counterplay: 'Tách đội hình, không đứng kề mục tiêu chính.'
});
const DINH_LOI_KIT = makeKit({
  heroId: 'dinh_loi', basicSlug: 'hoi-van-ho-tran', ultSlug: 'dong-son-loi-tran', passiveSlug: 'ho-tran',
  basicName: 'Hồi Văn Hộ Trận', basicKind: 'shield', basicMult: 0.2, basicTarget: 'ally',
  ultName: 'Đông Sơn Lôi Trận', ultKind: 'shield', ultMult: 0.28, ultTarget: 'all_allies', ultCost: 60,
  animation: 'dinh-loi.skill', basicVfx: 'dinh-loi.bronze-shield', ultVfx: 'dinh-loi.bronze-drum', sfx: 'combat-drum',
  basicDesc: 'Cấp khiên cho đồng minh yếu nhất và bản thân, dựng thế phản vệ.',
  ultDesc: 'Gióng trống đồng, dựng khiên toàn đội và chấn động quân địch.',
  passiveName: 'Hộ Trận', passiveTrigger: 'on_basic_cast',
  passiveEffect: 'Basic khiên đồng minh yếu; Ultimate khiên toàn đội.',
  counterplay: 'Phá khiên hoặc bỏ qua Đình Lôi để dồn xạ thủ.'
});
const TO_DIEP_KIT = makeKit({
  heroId: 'to_diep', basicSlug: 'khac-ban-sao-the', ultSlug: 'van-ban-dong-khac', passiveSlug: 'sao-an',
  basicName: 'Khắc Bản Sao Thế', basicKind: 'shield', basicMult: 0.18, basicTarget: 'all_allies',
  ultName: 'Vạn Bản Đồng Khắc', ultKind: 'debuff', ultMult: 1.16, ultTarget: 'all_enemies', ultCost: 60,
  animation: 'to-diep.skill', basicVfx: 'to-diep.woodblock', ultVfx: 'to-diep.ink-field', sfx: 'combat-cast',
  basicDesc: 'In bản suy giảm của tăng ích cho đồng minh yếu nhất; không có thì cấp khiên mực.',
  ultDesc: 'Trải mộc bản lớn, gây AOE và khuếch đại dấu ấn có hại.',
  passiveName: 'Sao Ấn', passiveTrigger: 'on_basic_cast',
  passiveEffect: 'Basic sao ấn hỗ trợ; Ultimate khuếch đại dấu hại trên địch.',
  counterplay: 'Giải dấu trước Vạn Bản hoặc cắt nộ Tố Điệp.'
});

export const HERO_SKILL_KIT_REGISTRY = Object.freeze({
  ong_hang_pho: ONG_HANG_PHO_KIT,
  luc_anh: LUC_ANH_KIT,
  thay_mo: THAY_MO_KIT,
  lac_yen: LAC_YEN_KIT,
  cung_thu_tre: CUNG_THU_TRE_KIT,
  co_dao_ganh_hoi: CO_DAO_GANH_HOI_KIT,
  phong_tu: PHONG_TU_KIT,
  thuy_nuong_roi_nuoc: THUY_NUONG_KIT,
  hong_lien_dao_nuong: HONG_LIEN_KIT,
  thach_quyen: THACH_QUYEN_KIT,
  dinh_loi: DINH_LOI_KIT,
  to_diep: TO_DIEP_KIT
});


const clampLevel = (value) => Math.max(1, Math.min(5, Math.round(Number(value) || 1)));

export function getHeroSkillKit(heroId) {
  return HERO_SKILL_KIT_REGISTRY[String(heroId || '')] || null;
}

export function validateHeroSkillKit(kit) {
  const errors = [];
  if (!kit || typeof kit !== 'object') errors.push('KIT_NOT_OBJECT');
  if (typeof kit?.heroId !== 'string' || !kit.heroId) errors.push('HERO_ID_REQUIRED');
  if (kit?.kitVersion !== HERO_SKILL_KIT_VERSION) errors.push('KIT_VERSION_UNSUPPORTED');
  if (typeof kit?.basicId !== 'string' || !kit.basicId) errors.push('BASIC_ID_REQUIRED');
  if (typeof kit?.ultimateId !== 'string' || !kit.ultimateId) errors.push('ULTIMATE_ID_REQUIRED');
  for (const action of ACTION_KEYS) {
    const entry = kit?.actions?.[action];
    if (!entry || typeof entry !== 'object') {
      errors.push(`${action.toUpperCase()}_ACTION_REQUIRED`);
      continue;
    }
    if (entry.id !== kit[`${action}Id`]) errors.push(`${action.toUpperCase()}_ID_MISMATCH`);
    if (entry.slot !== action) errors.push(`${action.toUpperCase()}_SLOT_MISMATCH`);
    if (typeof entry.name !== 'string' || !entry.name) errors.push(`${action.toUpperCase()}_NAME_REQUIRED`);
    if (!Number.isFinite(Number(entry.cost)) || Number(entry.cost) < 0) errors.push(`${action.toUpperCase()}_COST_INVALID`);
  }
  if (!Array.isArray(kit?.passiveIds) || kit.passiveIds.length < 1) errors.push('PASSIVE_REQUIRED');
  if (!Array.isArray(kit?.passives) || kit.passives.length < 1) errors.push('PASSIVE_DEFINITION_REQUIRED');
  for (const passive of kit?.passives || []) {
    if (!passive?.id || !kit.passiveIds.includes(passive.id)) errors.push('PASSIVE_ID_MISMATCH');
    if (!passive?.trigger) errors.push('PASSIVE_TRIGGER_REQUIRED');
    if (!Number.isFinite(Number(passive?.limit?.maxStacks)) || Number(passive.limit.maxStacks) < 1) errors.push('PASSIVE_STACK_LIMIT_INVALID');
  }
  if (kit?.legacySkillMap?.skill1 !== kit?.basicId) errors.push('LEGACY_SKILL1_MAPPING_REQUIRED');
  if (kit?.legacySkillMap?.ultimate !== kit?.ultimateId) errors.push('LEGACY_ULTIMATE_MAPPING_REQUIRED');
  return errors.length ? { ok: false, errors } : { ok: true, kit };
}

export function resolveSkillProgression(heroId, progression = {}) {
  const raw = progression?.skillLevels || {};
  const legacySkillLevels = Object.freeze({
    basic: clampLevel(raw.basic),
    skill: clampLevel(raw.skill),
    ultimate: clampLevel(raw.ultimate)
  });
  const kit = getHeroSkillKit(heroId);
  if (!kit) {
    return {
      kitVersion: 'legacy-v1',
      mapped: false,
      legacySkillLevels,
      skillLevels: { ...legacySkillLevels }
    };
  }
  return {
    kitVersion: kit.kitVersion,
    mapped: true,
    sourceKitVersion: progression?.kitVersion || 'legacy-v1',
    legacySkillLevels,
    skillLevels: {
      // The old Skill 1 level is carried into Basic so a migration never
      // silently lowers a player's investment.
      basic: Math.max(legacySkillLevels.basic, legacySkillLevels.skill),
      skill: legacySkillLevels.skill,
      ultimate: legacySkillLevels.ultimate
    },
    mapping: { ...kit.legacySkillMap }
  };
}
