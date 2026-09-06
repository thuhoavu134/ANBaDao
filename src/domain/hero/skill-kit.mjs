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

export const HERO_SKILL_KIT_REGISTRY = Object.freeze({
  ong_hang_pho: ONG_HANG_PHO_KIT,
  luc_anh: LUC_ANH_KIT
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
