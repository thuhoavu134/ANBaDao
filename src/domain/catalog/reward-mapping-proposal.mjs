export const L02B_REWARD_MAPPING_SCHEMA =
  'hon-viet-reward-mapping-proposal/v1';

const PRESERVED_REWARD_FIELDS = Object.freeze(['gold', 'gems', 'shards']);

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
}

const proposalRows = [
  {
    chapterId: 'ch1',
    chapterName: 'Giang Hồ',
    legacyRefs: [
      { field: 'reward.shardHero', id: 'ong_chu_wifi' },
      { field: 'unlockHero', id: 'ong_chu_wifi' }
    ],
    proposedReward: {
      gold: 900,
      gems: 80,
      shards: 40,
      shardHero: 'co_dao_ganh_hoi'
    },
    removeFields: ['unlockHero'],
    rationale:
      'Ông Chú Wifi giữ vai trò NPC hỗ trợ/giải hiệu ứng; Cô Đào là tướng playable gần nhất về hỗ trợ và điều nhịp.',
    saveImpact:
      'Giữ 900 vàng, 80 ngọc và 40 mảnh; save mới cộng mảnh Cô Đào, không tạo ownership key mới.'
  },
  {
    chapterId: 'ch2',
    chapterName: 'Rừng Deadline',
    legacyRefs: [
      { field: 'reward.shardHero', id: 'ky_lan_ca_phe' },
      { field: 'unlockHero', id: 'ky_lan_ca_phe' }
    ],
    proposedReward: {
      gold: 1100,
      gems: 100,
      shards: 40,
      shardHero: 'phong_tu'
    },
    removeFields: ['unlockHero'],
    rationale:
      'Kỳ Lân Cà Phê là legacy support/tăng tốc; Phong Tử là playable có bản sắc tốc độ và cắt lượt phù hợp Rừng Deadline.',
    saveImpact:
      'Giữ 1.100 vàng, 100 ngọc và 40 mảnh; không mở hoặc ghi nhận Kỳ Lân Cà Phê trong roster.'
  },
  {
    chapterId: 'ch3',
    chapterName: 'Biển Khô',
    legacyRefs: [
      { field: 'reward.shardHero', id: 'nang_tien_ca_can' },
      { field: 'unlockHero', id: 'ca_tre_biet_buon' }
    ],
    proposedReward: {
      gold: 1400,
      gems: 120,
      shards: 40,
      shardHero: 'thuy_nuong_roi_nuoc'
    },
    removeFields: ['unlockHero'],
    rationale:
      'Hai legacy ref đều thuộc tuyến nhân vật biển; Thủy Nương Rối Nước giữ chất liệu nước và là tướng playable chính thức.',
    saveImpact:
      'Giữ 1.400 vàng, 120 ngọc và 40 mảnh; hai legacy ref chỉ được thay ở claim chưa nhận, không thu hồi shard đã lưu.'
  },
  {
    chapterId: 'ch4',
    chapterName: 'Nhà Máy Giấc Ngủ',
    legacyRefs: [
      { field: 'reward.shardHero', id: 'chi_ve_chai_thien_ha' },
      { field: 'unlockHero', id: 'chi_ve_chai_thien_ha' }
    ],
    proposedReward: {
      gold: 1700,
      gems: 140,
      shards: 40,
      shardHero: 'luc_anh'
    },
    removeFields: ['unlockHero'],
    rationale:
      'Lục Ảnh là playable gắn trực tiếp với giấc mơ, hình nhân và sân khấu; Chị Ve Chai vẫn được giữ như lore/NPC.',
    saveImpact:
      'Giữ 1.700 vàng, 140 ngọc và 40 mảnh; save đã clear không bị cấp lại hoặc thu hồi phần thưởng cũ.'
  },
  {
    chapterId: 'ch5',
    chapterName: 'Vùng Quên',
    legacyRefs: [
      { field: 'reward.shardHero', id: 'hon_cay_bang' },
      { field: 'unlockHero', id: 'hon_cay_bang' }
    ],
    proposedReward: {
      gold: 2000,
      gems: 160,
      shards: 40,
      shardHero: 'to_diep'
    },
    removeFields: ['unlockHero'],
    rationale:
      'Tố Điệp với mộc bản và dấu ấn phù hợp chủ đề lưu giữ ký ức; Hồn Cây Bàng vẫn là nhân vật lore riêng.',
    saveImpact:
      'Giữ 2.000 vàng, 160 ngọc và 40 mảnh; không xóa ownership hoặc shard legacy trong save cũ.'
  },
  {
    chapterId: 'ch6',
    chapterName: 'Khaos',
    legacyRefs: [
      { field: 'reward.shardHero', id: 'thang_be_dieu_set' }
    ],
    proposedReward: {
      gold: 2600,
      gems: 220,
      shards: 40,
      shardHero: 'dinh_loi'
    },
    removeFields: [],
    rationale:
      'Đình Lôi là playable hộ vệ chính thức, phù hợp vai trò canh giữ trận cuối; Thằng Bé Diều Sét không bị xóa khỏi catalog lore.',
    saveImpact:
      'Giữ 2.600 vàng, 220 ngọc và 40 mảnh; không tự thêm legacy hero vào roster.'
  }
];

export const L02B_REWARD_MAPPING_PROPOSAL = deepFreeze(proposalRows);

function normalizedIds(ids) {
  return [...new Set((Array.isArray(ids) ? ids : [])
    .map(id => String(id ?? '').trim())
    .filter(Boolean))];
}

function actualRewardRefs(chapter) {
  const refs = [];
  const shardHero = String(chapter?.reward?.shardHero ?? '').trim();
  const unlockHero = String(chapter?.unlockHero ?? '').trim();
  if (shardHero) refs.push({ field: 'reward.shardHero', id: shardHero });
  if (unlockHero) refs.push({ field: 'unlockHero', id: unlockHero });
  return refs;
}

function refKey(ref) {
  return ref.field + ':' + ref.id;
}

function numericRewardValue(reward, field) {
  const value = Number(reward?.[field] ?? 0);
  return Number.isFinite(value) ? value : null;
}

export function validateRewardMappingProposal({
  chapters = [],
  playableHeroIds = [],
  legacyHeroIds = [],
  proposal = L02B_REWARD_MAPPING_PROPOSAL
} = {}) {
  const errors = [];
  const rows = Array.isArray(proposal) ? proposal : [];
  const playable = new Set(normalizedIds(playableHeroIds));
  const legacy = new Set(normalizedIds(legacyHeroIds));
  const chapterList = Array.isArray(chapters) ? chapters : [];
  const chaptersById = new Map(
    chapterList
      .map(chapter => [String(chapter?.id ?? '').trim(), chapter])
      .filter(([id]) => id)
  );
  const expectedRefsByChapter = new Map();
  const allLegacyRefs = [];

  for (const chapter of chapterList) {
    const id = String(chapter?.id ?? '').trim();
    const refs = actualRewardRefs(chapter);
    if (!id || refs.length === 0) continue;
    expectedRefsByChapter.set(id, refs);
    allLegacyRefs.push(...refs.map(ref => ({ chapterId: id, ...ref })));
  }

  const seenChapterIds = new Set();
  const seenTargets = new Set();
  let coveredLegacyRefCount = 0;
  let noUnlockHeroCount = 0;

  for (const row of rows) {
    const chapterId = String(row?.chapterId ?? '').trim();
    const chapter = chaptersById.get(chapterId);
    if (!chapter) {
      errors.push({
        code: 'UNKNOWN_PROPOSAL_CHAPTER',
        chapterId
      });
      continue;
    }
    if (seenChapterIds.has(chapterId)) {
      errors.push({
        code: 'DUPLICATE_PROPOSAL_CHAPTER',
        chapterId
      });
    }
    seenChapterIds.add(chapterId);

    const actualRefs = expectedRefsByChapter.get(chapterId) || [];
    const declaredRefs = Array.isArray(row?.legacyRefs) ? row.legacyRefs : [];
    const declaredRefKeys = new Set(declaredRefs.map(ref => refKey(ref)));
    for (const ref of actualRefs) {
      if (!declaredRefKeys.has(refKey(ref))) {
        errors.push({
          code: 'UNLISTED_LEGACY_REWARD_REF',
          chapterId,
          field: ref.field,
          id: ref.id
        });
      } else {
        coveredLegacyRefCount++;
      }
    }

    const target = String(row?.proposedReward?.shardHero ?? '').trim();
    if (!target) {
      errors.push({
        code: 'MISSING_PROPOSED_HERO',
        chapterId
      });
    } else {
      if (!playable.has(target)) {
        errors.push({
          code: 'PROPOSED_HERO_NOT_PLAYABLE',
          chapterId,
          id: target
        });
      }
      if (legacy.has(target)) {
        errors.push({
          code: 'PROPOSED_HERO_IS_LEGACY',
          chapterId,
          id: target
        });
      }
      if (seenTargets.has(target)) {
        errors.push({
          code: 'DUPLICATE_PROPOSED_HERO',
          chapterId,
          id: target
        });
      }
      seenTargets.add(target);
    }

    if (row?.proposedReward?.unlockHero !== undefined &&
        row.proposedReward.unlockHero !== null) {
      errors.push({
        code: 'PROPOSED_UNLOCK_HERO_PRESENT',
        chapterId,
        id: String(row.proposedReward.unlockHero)
      });
    } else {
      noUnlockHeroCount++;
    }

    for (const field of PRESERVED_REWARD_FIELDS) {
      const actual = numericRewardValue(chapter.reward, field);
      const proposed = numericRewardValue(row.proposedReward, field);
      if (actual !== proposed) {
        errors.push({
          code: 'REWARD_VALUE_CHANGED',
          chapterId,
          field,
          actual,
          proposed
        });
      }
    }
  }

  const missingChapterIds = [...expectedRefsByChapter.keys()]
    .filter(chapterId => !seenChapterIds.has(chapterId));
  for (const chapterId of missingChapterIds) {
    errors.push({
      code: 'MISSING_PROPOSAL_CHAPTER',
      chapterId
    });
  }

  return {
    schema: L02B_REWARD_MAPPING_SCHEMA,
    ok: errors.length === 0,
    errors,
    summary: {
      chapterCount: chapterList.length,
      proposalCount: rows.length,
      legacyRewardRefCount: allLegacyRefs.length,
      coveredLegacyRefCount,
      missingChapterIds,
      proposedTargetIds: [...seenTargets],
      noUnlockHeroCount
    }
  };
}
