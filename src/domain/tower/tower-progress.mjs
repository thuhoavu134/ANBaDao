const towerFail = (code, message) => ({ ok: false, code, message });

export const TOWER_CLIMB_STAMINA = 5;
export const TOWER_GOLD_BASE = 120;
export const TOWER_GOLD_PER_FLOOR = 30;
export const TOWER_GEMS_EVERY = 5;
export const TOWER_GEMS_AMOUNT = 15;
export const TOWER_SHARDS_EVERY = 10;
export const TOWER_SHARDS_AMOUNT = 8;
export const TOWER_POWER_BASE = 3800;
export const TOWER_POWER_PER_FLOOR = 420;
export const TOWER_CATCHUP_PER_DAY = 0.12;
export const TOWER_CATCHUP_MAX_DAYS = 5;
export const TOWER_DAY_MS = 86400000;

export const TOWER_TRIALS = Object.freeze({
  intact: Object.freeze({
    id: 'intact',
    name: 'Ấn Vẹn Đội',
    desc: 'Thắng khi còn ít nhất 5 chiến binh sống.',
    sigils: 1,
    goldBonus: 0.2
  }),
  swift: Object.freeze({
    id: 'swift',
    name: 'Ấn Tốc Kết',
    desc: 'Kết thúc chiến thắng không quá lượt 4.',
    sigils: 1,
    goldBonus: 0.25
  }),
  self: Object.freeze({
    id: 'self',
    name: 'Ấn Tự Lực',
    desc: 'Thắng mà không gọi Viện Tướng.',
    sigils: 1,
    goldBonus: 0.15
  }),
  reserve: Object.freeze({
    id: 'reserve',
    name: 'Ấn Dư Nộ',
    desc: 'Thắng với Nộ trung bình của người sống sót ≥ 25.',
    sigils: 2,
    goldBonus: 0.25
  })
});

export const TOWER_TRIAL_IDS = Object.freeze(Object.keys(TOWER_TRIALS));

export const TOWER_SIGIL_MILESTONES = Object.freeze({
  3: Object.freeze({ gold: 500 }),
  8: Object.freeze({ gems: 25, gold: 800 }),
  15: Object.freeze({ gems: 40, gold: 1200 }),
  25: Object.freeze({ gems: 70, gold: 1800 })
});

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function asInt(value, fallback = 0) {
  const n = Math.floor(Number(value));
  return Number.isFinite(n) ? n : fallback;
}

export function emptyTower() {
  return {
    floor: 1,
    best: 0,
    sigils: 0,
    selectedTrial: null,
    mastery: {},
    claimedSigils: [],
    stuckFloor: 0,
    stuckSince: 0
  };
}

export function findTowerTrial(id) {
  return TOWER_TRIALS[id] || null;
}

export function normalizeTower(tower) {
  const next = emptyTower();
  if (!tower || typeof tower !== 'object') return next;
  next.floor = Math.max(1, asInt(tower.floor, 1));
  next.best = Math.max(0, asInt(tower.best, 0));
  next.sigils = Math.max(0, asInt(tower.sigils, 0));
  next.selectedTrial = findTowerTrial(tower.selectedTrial) ? tower.selectedTrial : null;
  next.mastery = tower.mastery && typeof tower.mastery === 'object' && !Array.isArray(tower.mastery)
    ? clone(tower.mastery)
    : {};
  next.claimedSigils = Array.isArray(tower.claimedSigils)
    ? tower.claimedSigils.map(n => asInt(n, 0)).filter(n => n > 0)
    : [];
  next.stuckFloor = Math.max(0, asInt(tower.stuckFloor, 0));
  next.stuckSince = Math.max(0, asInt(tower.stuckSince, 0));
  return next;
}

export function towerArt(kind) {
  if (kind === 'hub') return 'assets/ui/tower/hub-icon.png';
  if (kind === 'stage') return 'assets/ui/tower/night-pagoda.webp';
  if (findTowerTrial(kind)) return 'assets/ui/tower/seal-' + kind + '.png';
  return '';
}

export function towerTrialOffer(floor) {
  const ids = TOWER_TRIAL_IDS;
  const k = (Math.max(1, asInt(floor, 1)) - 1) % ids.length;
  return [ids[k], ids[(k + 1) % 4], ids[(k + 2) % 4]];
}

export function towerTrialMet(trial, report) {
  if (!trial || !report || !report.win) return false;
  if (trial.id === 'intact') {
    return asInt(report.playerAlive, 0) >= Math.min(5, asInt(report.playerTotal, 6) || 6);
  }
  if (trial.id === 'swift') return asInt(report.round, 99) <= 4;
  if (trial.id === 'self') return !(report.supportCall && report.supportCall.used);
  if (trial.id === 'reserve') return asInt(report.endEnergyAvg, 0) >= 25;
  return false;
}

export function towerFloorGold(floor) {
  return TOWER_GOLD_BASE + Math.max(1, asInt(floor, 1)) * TOWER_GOLD_PER_FLOOR;
}

export function towerRequiredPower(floor) {
  const f = Math.max(1, asInt(floor, 1));
  return TOWER_POWER_BASE + (f - 1) * TOWER_POWER_PER_FLOOR;
}

export function towerStuckDays(tower, now = Date.now()) {
  const t = normalizeTower(tower);
  if (!t.stuckSince || t.stuckFloor !== t.floor) return 0;
  const days = Math.floor((asInt(now, Date.now()) - t.stuckSince) / TOWER_DAY_MS);
  return Math.max(0, Math.min(TOWER_CATCHUP_MAX_DAYS, days));
}

export function towerEffectivePower(teamPower, days) {
  const power = Math.max(0, asInt(teamPower, 0));
  const d = Math.max(0, Math.min(TOWER_CATCHUP_MAX_DAYS, asInt(days, 0)));
  return Math.round(power * (1 + TOWER_CATCHUP_PER_DAY * d));
}

export function towerPowerGate(player, { teamPower, now } = {}) {
  const tower = normalizeTower(player?.tower);
  const required = towerRequiredPower(tower.floor);
  const power = Math.max(0, asInt(teamPower, 0));
  const days = towerStuckDays(tower, now);
  const effective = towerEffectivePower(power, days);
  return {
    floor: tower.floor,
    required,
    power,
    days,
    effective,
    pass: effective >= required,
    missing: Math.max(0, required - effective)
  };
}

export function towerPowerWinReport() {
  return {
    win: true,
    playerAlive: 6,
    playerTotal: 6,
    round: 3,
    supportCall: { used: false },
    endEnergyAvg: 40
  };
}

export function towerEncounterUnits(floor) {
  const f = Math.max(1, asInt(floor, 1));
  const hm = 1 + (f - 1) * 0.12;
  const am = 1 + (f - 1) * 0.09;
  const dm = 1 + (f - 1) * 0.05;
  const mk = (n, base, row) => ({
    id: 'tw' + n,
    name: 'Bóng Tầng ' + f,
    row,
    stats: {
      hp: Math.round(base.hp * hm),
      atk: Math.round(base.atk * am),
      def: Math.round(base.def * dm),
      spd: base.spd + Math.min(30, f)
    }
  });
  const units = [
    mk(1, { hp: 620, atk: 98, def: 44, spd: 92 }, 'front'),
    mk(2, { hp: 620, atk: 96, def: 44, spd: 88 }, 'front'),
    mk(3, { hp: 580, atk: 94, def: 42, spd: 96 }, 'back')
  ];
  if (f % 5 === 0) {
    units.push({
      id: 'twb',
      name: 'Chúa Tầng ' + f,
      row: 'front',
      stats: {
        hp: Math.round(1600 * hm),
        atk: Math.round(118 * am),
        def: Math.round(70 * dm),
        spd: 70 + Math.min(30, f)
      }
    });
  } else {
    units.push(mk(4, { hp: 580, atk: 92, def: 42, spd: 90 }, 'back'));
  }
  return units;
}

function shardsOf(player) {
  const next = {};
  const src = player?.shards && typeof player.shards === 'object' ? player.shards : {};
  for (const [id, value] of Object.entries(src)) next[id] = Math.max(0, asInt(value, 0));
  return next;
}

export function prepareTowerSelectTrial(player, id) {
  const tower = normalizeTower(player?.tower);
  if (id == null || id === '') {
    tower.selectedTrial = null;
    return { ok: true, tower };
  }
  if (!findTowerTrial(id)) return towerFail('UNKNOWN_TRIAL', 'Ấn thử không hợp lệ.');
  if (!towerTrialOffer(tower.floor).includes(id)) {
    return towerFail('TRIAL_NOT_OFFERED', 'Ấn này không mở ở tầng hiện tại.');
  }
  tower.selectedTrial = id;
  return { ok: true, tower };
}

export function prepareTowerClimb(player) {
  const tower = normalizeTower(player?.tower);
  const stamina = Math.max(0, asInt(player?.stamina, 0));
  if (stamina < TOWER_CLIMB_STAMINA) {
    return towerFail('INSUFFICIENT_STAMINA', 'Không đủ Độ Tỉnh Táo ⚡');
  }
  return {
    ok: true,
    tower,
    stamina: stamina - TOWER_CLIMB_STAMINA,
    spentStamina: TOWER_CLIMB_STAMINA,
    floor: tower.floor,
    trial: findTowerTrial(tower.selectedTrial),
    encounter: towerEncounterUnits(tower.floor)
  };
}

export function prepareTowerFail(player, { now } = {}) {
  const tower = normalizeTower(player?.tower);
  const ts = asInt(now, Date.now());
  if (tower.stuckFloor !== tower.floor || !tower.stuckSince) {
    tower.stuckFloor = tower.floor;
    tower.stuckSince = ts;
  }
  return { ok: true, passed: false, tower };
}

export function prepareTowerClear(player, { floor, report, rng, ssrPool, now, trialId } = {}) {
  const tower = normalizeTower(player?.tower);
  const fought = Math.max(1, asInt(floor, tower.floor));
  if (tower.floor !== fought) {
    return towerFail('STALE_FLOOR', 'Tầng này đã được chốt.');
  }
  if (!report || !report.win) {
    return towerFail('NOT_A_WIN', 'Chưa thắng tầng này.');
  }
  const chapters = Array.isArray(player?.clearedChapters) ? player.clearedChapters.slice() : [];
  const trial = findTowerTrial(trialId !== undefined ? trialId : tower.selectedTrial);
  const trialOk = towerTrialMet(trial, report);
  let goldGain = towerFloorGold(fought);
  let sigilsGain = 0;
  if (trialOk && trial) {
    goldGain += Math.round(towerFloorGold(fought) * trial.goldBonus);
    sigilsGain = trial.sigils;
    tower.sigils += trial.sigils;
    tower.mastery[String(fought)] = {
      trial: trial.id,
      ok: true,
      at: asInt(now, Date.now())
    };
  } else if (trial) {
    tower.mastery[String(fought)] = {
      trial: trial.id,
      ok: false,
      at: asInt(now, Date.now())
    };
  }
  const gemsGain = fought % TOWER_GEMS_EVERY === 0 ? TOWER_GEMS_AMOUNT : 0;
  let shardsGain = 0;
  let shardHero = null;
  const shards = shardsOf(player);
  if (fought % TOWER_SHARDS_EVERY === 0) {
    const pool = Array.isArray(ssrPool) ? ssrPool.filter(id => typeof id === 'string' && id) : [];
    if (pool.length) {
      const roll = typeof rng === 'function' ? Number(rng()) : 0;
      const idx = Math.min(pool.length - 1, Math.max(0, Math.floor((Number.isFinite(roll) ? roll : 0) * pool.length)));
      shardHero = pool[idx];
      shardsGain = TOWER_SHARDS_AMOUNT;
      shards[shardHero] = (shards[shardHero] || 0) + shardsGain;
    }
  }
  tower.floor = fought + 1;
  tower.best = Math.max(tower.best, fought);
  tower.selectedTrial = null;
  tower.stuckFloor = 0;
  tower.stuckSince = 0;
  return {
    ok: true,
    tower,
    gold: Math.max(0, asInt(player?.gold, 0)) + goldGain,
    gems: Math.max(0, asInt(player?.gems, 0)) + gemsGain,
    shards,
    goldGain,
    gemsGain,
    shardsGain,
    shardHero,
    trial,
    trialOk,
    floorCleared: fought,
    nextFloor: tower.floor,
    clearedChapters: chapters
  };
}

export function prepareTowerAttempt(player, { teamPower, now, rng, ssrPool, trialId } = {}) {
  const climb = prepareTowerClimb(player);
  if (!climb.ok) return climb;
  const gate = towerPowerGate(player, { teamPower, now });
  if (!gate.pass) {
    const fail = prepareTowerFail(player, { now });
    return {
      ok: true,
      passed: false,
      stamina: climb.stamina,
      spentStamina: climb.spentStamina,
      tower: fail.tower,
      gold: Math.max(0, asInt(player?.gold, 0)),
      gems: Math.max(0, asInt(player?.gems, 0)),
      shards: shardsOf(player),
      gate,
      clearedChapters: Array.isArray(player?.clearedChapters) ? player.clearedChapters.slice() : []
    };
  }
  const clear = prepareTowerClear(player, {
    floor: climb.floor,
    trialId: trialId !== undefined ? trialId : climb.trial?.id,
    report: towerPowerWinReport(),
    rng,
    ssrPool,
    now
  });
  if (!clear.ok) return clear;
  return {
    ...clear,
    passed: true,
    stamina: climb.stamina,
    spentStamina: climb.spentStamina,
    gate
  };
}

export function prepareTowerClaimMilestone(player, n) {
  const tower = normalizeTower(player?.tower);
  const mark = asInt(n, 0);
  const reward = TOWER_SIGIL_MILESTONES[mark];
  if (!reward) return towerFail('UNKNOWN_MILESTONE', 'Mốc Tháp Ấn không tồn tại.');
  if (tower.sigils < mark) return towerFail('NOT_ENOUGH_SIGILS', 'Chưa đủ Tháp Ấn.');
  if (tower.claimedSigils.includes(mark)) return towerFail('ALREADY_CLAIMED', 'Mốc này đã nhận.');
  tower.claimedSigils = tower.claimedSigils.concat(mark);
  return {
    ok: true,
    tower,
    gold: Math.max(0, asInt(player?.gold, 0)) + asInt(reward.gold, 0),
    gems: Math.max(0, asInt(player?.gems, 0)) + asInt(reward.gems, 0),
    goldGain: asInt(reward.gold, 0),
    gemsGain: asInt(reward.gems, 0),
    mark
  };
}
