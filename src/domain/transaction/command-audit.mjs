export const COMMAND_AUDIT_SCHEMA = 'hon-viet-command-audit/v1';

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
}

const inventoryRows = [
  {
    id: 'hero.level-up',
    family: 'hero',
    functionName: 'levelUpHero',
    entrypoint: 'levelUpHero(id)',
    scope: 'deep-slice',
    cost: 'gold via levelCost(id)',
    credit: 'P.heroes[id].level++',
    persist: ['questProgress(level)', 'persist()'],
    event: ['questProgress(level,1)', 'weeklyProgress via helper'],
    receipt: 'none',
    transaction: 'none',
    atomicity: 'not-atomic',
    finding: 'questProgress có thể persist trước persist cuối của levelUpHero; không có rollback/receipt.',
    sourceMarkers: [
      'function levelUpHero(id)',
      'P.gold-=c',
      'P.heroes[id].level++',
      "questProgress('level',1)",
      'persist()'
    ]
  },
  {
    id: 'hero.star-up',
    family: 'hero',
    functionName: 'starUpHero',
    entrypoint: 'starUpHero(id)',
    scope: 'inventory',
    cost: 'shards[id] via starCost(id)',
    credit: 'P.heroes[id].stars++',
    persist: ['persist()'],
    event: [],
    receipt: 'none',
    transaction: 'none',
    atomicity: 'direct-mutate',
    finding: 'Trừ shard và tăng sao trực tiếp, chưa có receipt.',
    sourceMarkers: [
      'function starUpHero(id)',
      'P.shards[id]=have-c',
      'P.heroes[id].stars++',
      'persist()'
    ]
  },
  {
    id: 'reward.apply',
    family: 'reward',
    functionName: 'applyReward',
    entrypoint: 'applyReward(rw)',
    scope: 'shared-helper',
    cost: 'none',
    credit: 'gold/gems/tinh/hoat/shards',
    persist: [],
    event: [],
    receipt: 'none',
    transaction: 'none',
    atomicity: 'caller-owned',
    finding: 'Helper mutate state nhưng không tự ghi receipt; caller quyết định persist.',
    sourceMarkers: [
      'function applyReward(rw)',
      'P.gold+=rw.gold',
      'P.shards[rw.shardHero]'
    ]
  },
  {
    id: 'campaign.start',
    family: 'campaign',
    functionName: 'startChapter',
    entrypoint: 'startChapter(idx,options)',
    scope: 'inventory',
    cost: 'stamina via spendStamina(costCampaign)',
    credit: 'P.campaignStages[idx] / cleared chapter',
    persist: ['spendStamina()', 'stage transition persist()', 'endChapter persist()'],
    event: ['runBattle callback'],
    receipt: 'none',
    transaction: 'none',
    atomicity: 'multi-persist',
    finding: 'Một lượt campaign có nhiều boundary persist trước settlement cuối.',
    sourceMarkers: [
      'function startChapter(idx,options={})',
      'spendStamina(DATA.daily.costCampaign)',
      'P.campaignStages[idx]=',
      'endChapter({referenceLoop:true,autoContinue:true})'
    ]
  },
  {
    id: 'chapter.clear',
    family: 'campaign',
    functionName: 'endChapter',
    entrypoint: 'endChapter(options)',
    scope: 'inventory',
    cost: 'none',
    credit: 'chapter gold/gems/shards + unlockHero',
    persist: ['weeklyProgress()', 'persist()'],
    event: ['worldChronicle', 'journal', 'mail', 'chat', 'clan XP'],
    receipt: 'none',
    transaction: 'none',
    atomicity: 'multi-side-effect',
    finding: 'Reward, unlock, progress và side effect cùng mutate trực tiếp; chưa có chapter receipt.',
    sourceMarkers: [
      'function endChapter(options={})',
      'P.clearedChapters.push(idx)',
      'applyReward(rr)',
      'P.unlockedChapters.push(idx+1)',
      'persist()'
    ]
  },
  {
    id: 'quest.progress',
    family: 'quest',
    functionName: 'questProgress',
    entrypoint: 'questProgress(type,amt)',
    scope: 'deep-slice',
    cost: 'none',
    credit: 'P.daily.quests progress',
    persist: ['weeklyProgress()', 'if(ch)persist()'],
    event: ['weeklyProgress(type,amt)'],
    receipt: 'none',
    transaction: 'none',
    atomicity: 'nested-persist',
    finding: 'Opening level-up gọi helper này sau mutate hero; helper có persist riêng.',
    sourceMarkers: [
      'function questProgress(type,amt)',
      'weeklyProgress(type,amt)',
      'if(ch)persist()'
    ]
  },
  {
    id: 'quest.claim',
    family: 'quest',
    functionName: 'claimQuest',
    entrypoint: 'claimQuest(id)',
    scope: 'inventory',
    cost: 'none',
    credit: 'daily reward via applyReward',
    persist: ['persist()'],
    event: ['clanAddXp(5)'],
    receipt: 'none',
    transaction: 'none',
    atomicity: 'direct-mutate',
    finding: 'Đánh dấu claimed, credit reward và activity point trong cùng hàm nhưng chưa có receipt.',
    sourceMarkers: [
      'function claimQuest(id)',
      'q.claimed=true',
      'applyReward(def.reward)',
      'persist()'
    ]
  },
  {
    id: 'weekly.progress',
    family: 'quest',
    functionName: 'weeklyProgress',
    entrypoint: 'weeklyProgress(type,amt)',
    scope: 'inventory',
    cost: 'none',
    credit: 'P.weekly.quests progress',
    persist: ['if(ch)persist()'],
    event: [],
    receipt: 'none',
    transaction: 'none',
    atomicity: 'direct-mutate',
    finding: 'Progress tuần tự persist, chưa gắn commandId.',
    sourceMarkers: [
      'function weeklyProgress(type,amt=1)',
      'P.weekly.quests.forEach',
      'if(ch)persist()'
    ]
  },
  {
    id: 'weekly.claim',
    family: 'quest',
    functionName: 'claimWeeklyQuest',
    entrypoint: 'claimWeeklyQuest(id)',
    scope: 'inventory',
    cost: 'none',
    credit: 'weekly points + reward',
    persist: ['persist()'],
    event: [],
    receipt: 'none',
    transaction: 'none',
    atomicity: 'direct-mutate',
    finding: 'Claim reward tuần chưa có receipt.',
    sourceMarkers: [
      'function claimWeeklyQuest(id)',
      'q.claimed=true',
      'applyReward(d.reward)',
      'persist()'
    ]
  },
  {
    id: 'weekly.milestone',
    family: 'quest',
    functionName: 'claimWeeklyMilestone',
    entrypoint: 'claimWeeklyMilestone(p)',
    scope: 'inventory',
    cost: 'none',
    credit: 'weekly milestone reward',
    persist: ['persist()'],
    event: [],
    receipt: 'none',
    transaction: 'none',
    atomicity: 'direct-mutate',
    finding: 'Claim milestone tuần chưa có receipt.',
    sourceMarkers: [
      'function claimWeeklyMilestone(p)',
      'P.weekly.claimed.includes(p)',
      'applyReward(m.reward)',
      'persist()'
    ]
  },
  {
    id: 'activity.milestone',
    family: 'quest',
    functionName: 'claimActMilestone',
    entrypoint: 'claimActMilestone(p)',
    scope: 'inventory',
    cost: 'none',
    credit: 'daily activity reward',
    persist: ['persist()'],
    event: [],
    receipt: 'none',
    transaction: 'none',
    atomicity: 'direct-mutate',
    finding: 'Claim mốc hoạt động ngày chưa có receipt.',
    sourceMarkers: [
      'function claimActMilestone(p)',
      'P.daily.actClaimed.includes(p)',
      'applyReward(m.reward)',
      'persist()'
    ]
  },
  {
    id: 'idle.claim',
    family: 'idle',
    functionName: 'claimIdle',
    entrypoint: 'claimIdle()',
    scope: 'inventory',
    cost: 'none',
    credit: 'idle gold',
    persist: ['questProgress()', 'clanDutyProgress()', 'persist()'],
    event: ['journal'],
    receipt: 'none',
    transaction: 'none',
    atomicity: 'nested-persist',
    finding: 'Idle gold và activity side effects có nhiều helper mutate/persist.',
    sourceMarkers: [
      'function claimIdle()',
      'P.gold+=p.gold',
      "questProgress('idle',1)",
      'persist()'
    ]
  },
  {
    id: 'signin.claim',
    family: 'daily',
    functionName: 'claimSignIn',
    entrypoint: 'claimSignIn()',
    scope: 'inventory',
    cost: 'none',
    credit: 'sign-in gold/gems/stamina',
    persist: ['persist()'],
    event: ['journal', 'petBondActivity'],
    receipt: 'none',
    transaction: 'none',
    atomicity: 'direct-mutate',
    finding: 'Claim ngày và reward trực tiếp mutate, chưa có receipt.',
    sourceMarkers: [
      'function claimSignIn()',
      'applyReward(rw)',
      'P.daily.signInClaimedDay=d',
      'persist()'
    ]
  },
  {
    id: 'mail.claim',
    family: 'mail',
    functionName: 'claimMail',
    entrypoint: 'claimMail(id)',
    scope: 'inventory',
    cost: 'none',
    credit: 'mail reward',
    persist: ['persist()'],
    event: [],
    receipt: 'none',
    transaction: 'none',
    atomicity: 'direct-mutate',
    finding: 'Đánh dấu mail claimed và apply reward chưa có receipt.',
    sourceMarkers: [
      'function claimMail(id)',
      'applyReward(m.reward)',
      'm.claimed=true',
      'persist()'
    ]
  },
  {
    id: 'mail.claim-all',
    family: 'mail',
    functionName: 'claimAllMail',
    entrypoint: 'claimAllMail()',
    scope: 'inventory',
    cost: 'none',
    credit: 'nhiều mail reward',
    persist: ['persist()'],
    event: [],
    receipt: 'none',
    transaction: 'none',
    atomicity: 'batch-direct-mutate',
    finding: 'Batch claim không có commandId/receipt cho từng mail hoặc batch.',
    sourceMarkers: [
      'function claimAllMail()',
      'P.mail.forEach',
      'applyReward(m.reward)',
      'persist()'
    ]
  },
  {
    id: 'gift-code.redeem',
    family: 'reward',
    functionName: 'redeemCode',
    entrypoint: 'redeemCode(str)',
    scope: 'inventory',
    cost: 'none',
    credit: 'gold/gems/stamina',
    persist: ['persist()'],
    event: [],
    receipt: 'codes array only',
    transaction: 'none',
    atomicity: 'direct-mutate',
    finding: 'Codes array là guard nghiệp vụ, chưa phải transaction receipt.',
    sourceMarkers: [
      'function redeemCode(str)',
      'P.codes.push(k)',
      'P.gold+=g.gold',
      'persist()'
    ]
  },
  {
    id: 'forge.mold',
    family: 'forge',
    functionName: 'setForgeMold',
    entrypoint: 'setForgeMold(id)',
    scope: 'inventory',
    cost: 'none',
    credit: 'P.economy.forgeMold',
    persist: ['persist()'],
    event: [],
    receipt: 'none',
    transaction: 'none',
    atomicity: 'direct-mutate',
    finding: 'Đổi khuôn mutate trực tiếp; không phải reward nhưng có state command.',
    sourceMarkers: [
      'function setForgeMold(id)',
      'econ().forgeMold=id',
      'persist()'
    ]
  },
  {
    id: 'forge.dual-start',
    family: 'forge',
    functionName: 'startDualForge',
    entrypoint: 'startDualForge(slot)',
    scope: 'inventory',
    cost: 'tinh + gold',
    credit: 'forgePending/candidates',
    persist: ['persist()'],
    event: [],
    receipt: 'none',
    transaction: 'none',
    atomicity: 'direct-mutate',
    finding: 'Trừ hai resource và tạo pending trực tiếp, chưa có receipt.',
    sourceMarkers: [
      'function startDualForge(slot)',
      'P.tinh-=DUAL_FORGE.tinh',
      'P.gold-=DUAL_FORGE.gold',
      'persist()'
    ]
  },
  {
    id: 'forge.dual-choose',
    family: 'forge',
    functionName: 'chooseDualForge',
    entrypoint: 'chooseDualForge(i)',
    scope: 'inventory',
    cost: 'pending forge đã trả trước',
    credit: 'P.inventory.push(item)',
    persist: ['questProgress()', 'persist()'],
    event: [],
    receipt: 'none',
    transaction: 'none',
    atomicity: 'nested-persist',
    finding: 'Chọn phôi và quest progress cùng mutate, chưa có receipt.',
    sourceMarkers: [
      'function chooseDualForge(i)',
      'P.inventory.push(it)',
      "questProgress('craft',1)",
      'persist()'
    ]
  },
  {
    id: 'forge.craft',
    family: 'forge',
    functionName: 'craftItem',
    entrypoint: 'craftItem(slot)',
    scope: 'inventory',
    cost: 'tinh + gold',
    credit: 'P.inventory.push(item)',
    persist: ['questProgress()', 'persist()'],
    event: [],
    receipt: 'none',
    transaction: 'none',
    atomicity: 'nested-persist',
    finding: 'Trừ cost, tạo item và quest progress chưa cùng receipt.',
    sourceMarkers: [
      'function craftItem(slot)',
      'P.tinh-=CRAFT.tinh',
      'P.gold-=CRAFT.gold',
      'P.inventory.push(it)',
      'persist()'
    ]
  },
  {
    id: 'forge.enhance',
    family: 'forge',
    functionName: 'enhanceItem',
    entrypoint: 'enhanceItem(uid)',
    scope: 'inventory',
    cost: 'gold + hoat',
    credit: 'it.lvl++',
    persist: ['persist()'],
    event: [],
    receipt: 'none',
    transaction: 'none',
    atomicity: 'direct-mutate',
    finding: 'Trừ cost và tăng level item trực tiếp, chưa có receipt.',
    sourceMarkers: [
      'function enhanceItem(uid)',
      'P.gold-=c.gold',
      'P.hoat-=c.hoat',
      'it.lvl++',
      'persist()'
    ]
  },
  {
    id: 'forge.salvage',
    family: 'forge',
    functionName: 'salvageItem',
    entrypoint: 'salvageItem(uid)',
    scope: 'inventory',
    cost: 'item removal',
    credit: 'P.tinh += gain',
    persist: ['persist()'],
    event: [],
    receipt: 'none',
    transaction: 'none',
    atomicity: 'direct-mutate',
    finding: 'Xóa item và cộng Tinh Lực trực tiếp, chưa có receipt.',
    sourceMarkers: [
      'function salvageItem(uid)',
      'P.tinh=(P.tinh||0)+gain',
      'P.inventory=P.inventory.filter',
      'persist()'
    ]
  },
  {
    id: 'hero.unlock',
    family: 'hero',
    functionName: 'unlockHero',
    entrypoint: 'unlockHero(id)',
    scope: 'shared-helper',
    cost: 'none',
    credit: 'P.heroes[id].owned=true',
    persist: ['persist()'],
    event: [],
    receipt: 'none',
    transaction: 'none',
    atomicity: 'caller-owned',
    finding: 'Helper có thể mở cả legacy hero nếu caller đưa ID tồn tại trong DATA.',
    sourceMarkers: [
      'function unlockHero(id)',
      'P.heroes[id].owned=true',
      'persist()'
    ]
  }
];

export const L03A_COMMAND_INVENTORY = deepFreeze(inventoryRows);

function functionBodies(source) {
  const result = [];
  const declaration = /function\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*\([^)]*\)\s*\{/g;
  let match;
  while ((match = declaration.exec(source))) {
    const open = declaration.lastIndex - 1;
    let depth = 0;
    let quote = null;
    let escaped = false;
    let lineComment = false;
    let blockComment = false;
    let close = -1;
    for (let index = open; index < source.length; index += 1) {
      const character = source[index];
      const next = source[index + 1];
      if (lineComment) {
        if (character === '\n') lineComment = false;
        continue;
      }
      if (blockComment) {
        if (character === '*' && next === '/') {
          blockComment = false;
          index += 1;
        }
        continue;
      }
      if (quote) {
        if (escaped) escaped = false;
        else if (character === '\\') escaped = true;
        else if (character === quote) quote = null;
        continue;
      }
      if (character === '/' && next === '/') {
        lineComment = true;
        index += 1;
        continue;
      }
      if (character === '/' && next === '*') {
        blockComment = true;
        index += 1;
        continue;
      }
      if (character === '"' || character === "'" || character === String.fromCharCode(96)) {
        quote = character;
        continue;
      }
      if (character === '{') depth += 1;
      else if (character === '}') {
        depth -= 1;
        if (depth === 0) {
          close = index;
          break;
        }
      }
    }
    if (close < 0) continue;
    const body = source.slice(match.index, close + 1);
    const signals = [];
    if (new RegExp('\\bP\\.[A-Za-z_$][A-Za-z0-9_$]*(?:(?:\\.[A-Za-z_$][A-Za-z0-9_$]*)|(?:\\[[^\\]]+\\]))*\\s*(?:\\+\\+|--|[+*/%\\-]?=)').test(body)) {
      signals.push('direct-player-write');
    }
    if (/\bpersist\s*\(/.test(body)) signals.push('persist-call');
    if (/\bapplyReward\s*\(/.test(body)) signals.push('reward-credit-call');
    if (/\bspendStamina\s*\(/.test(body)) signals.push('stamina-debit-call');
    if (/\b(?:executeLocalTransaction|settleRewardTransaction|HonVietTransaction)\b/.test(body)) {
      signals.push('receipt-aware-call');
    }
    result.push({
      name: match[1],
      start: match.index,
      end: close + 1,
      body,
      signals
    });
  }
  return result;
}

function openingSequence(source, bodies) {
  const level = bodies.find(entry => entry.name === 'levelUpHero');
  const quest = bodies.find(entry => entry.name === 'questProgress');
  const weekly = bodies.find(entry => entry.name === 'weeklyProgress');
  const indexOf = (body, marker) => body ? body.indexOf(marker) : -1;
  const levelOrder = [
    { step: 'hero-mutation', marker: 'P.heroes[id].level++', offset: indexOf(level?.body, 'P.heroes[id].level++') },
    { step: 'quest-progress', marker: "questProgress('level',1)", offset: indexOf(level?.body, "questProgress('level',1)") },
    { step: 'outer-persist', marker: 'persist()', offset: indexOf(level?.body, 'persist()') }
  ];
  const orderValid = levelOrder.every(entry => entry.offset >= 0) &&
    levelOrder[0].offset < levelOrder[1].offset &&
    levelOrder[1].offset < levelOrder[2].offset;
  const transactionBoundaryPresent =
    /\b(?:executeLocalTransaction|settleRewardTransaction|HonVietTransaction)\b/.test(
      level?.body || ''
    );
  return {
    chain: ['levelUpHero', 'questProgress', 'weeklyProgress'],
    order: levelOrder,
    orderValid,
    questProgressPersistsInternally: /\bpersist\s*\(/.test(quest?.body || ''),
    weeklyProgressPersistsInternally: /\bpersist\s*\(/.test(weekly?.body || ''),
    transactionBoundaryPresent,
    atomicity: orderValid && !transactionBoundaryPresent
      ? 'not-atomic'
      : transactionBoundaryPresent ? 'transaction-boundary-present' : 'unverified',
    requiredFailureTest: 'Inject failure after questProgress and before the outer persist; verify state/quest remain all-old or all-new.'
  };
}

export function auditCommandInventory({
  source,
  inventory = L03A_COMMAND_INVENTORY
} = {}) {
  if (typeof source !== 'string' || !source.trim()) {
    throw new TypeError('Runtime source must be a non-empty string.');
  }
  const rows = Array.isArray(inventory) ? inventory : [];
  const bodies = functionBodies(source);
  const bodyByName = new Map(bodies.map(entry => [entry.name, entry]));
  const errors = [];
  const audited = rows.map(row => {
    const body = bodyByName.get(row.functionName);
    const missingMarkers = (Array.isArray(row.sourceMarkers) ? row.sourceMarkers : [])
      .filter(marker => !source.includes(marker));
    if (!body) {
      errors.push({
        code: 'MISSING_ENTRYPOINT',
        id: row.id,
        functionName: row.functionName
      });
    }
    if (missingMarkers.length) {
      errors.push({
        code: 'MISSING_SOURCE_MARKER',
        id: row.id,
        markers: missingMarkers
      });
    }
    return {
      ...row,
      sourceVerified: Boolean(body) && missingMarkers.length === 0,
      actualSignals: body?.signals || []
    };
  });
  const candidates = bodies
    .filter(entry => entry.signals.length > 0)
    .map(entry => ({
      functionName: entry.name,
      sourceOffset: entry.start,
      signals: [...entry.signals]
    }));
  const opening = openingSequence(source, bodies);
  return {
    schema: COMMAND_AUDIT_SCHEMA,
    ok: errors.length === 0,
    transactionRuntimeWired: /\b(?:executeLocalTransaction|settleRewardTransaction|HonVietTransaction)\b/.test(source),
    errors,
    inventory: audited,
    candidates,
    opening,
    summary: {
      declaredFunctionCount: bodies.length,
      auditedCommandCount: audited.length,
      verifiedCommandCount: audited.filter(entry => entry.sourceVerified).length,
      candidateMutationFunctionCount: candidates.length,
      receiptAwareCandidateCount: candidates.filter(entry =>
        entry.signals.includes('receipt-aware-call')
      ).length,
      missingSourceMarkerCount: errors.filter(error => error.code === 'MISSING_SOURCE_MARKER').length,
      missingEntrypointCount: errors.filter(error => error.code === 'MISSING_ENTRYPOINT').length
    }
  };
}
