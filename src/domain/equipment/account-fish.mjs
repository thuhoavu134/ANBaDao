const fishFail = (code, message) => ({ ok: false, code, message });

export const ACCOUNT_FISHES = Object.freeze([
  Object.freeze({ id: 'ca-loc', name: 'Cá Lóc', stat: 'hp', cell: 0 }),
  Object.freeze({ id: 'ca-tre', name: 'Cá Trê', stat: 'def', cell: 1 }),
  Object.freeze({ id: 'ca-ro', name: 'Cá Rô', stat: 'spd', cell: 2 }),
  Object.freeze({ id: 'ca-ngu', name: 'Cá Ngừ', stat: 'atk', cell: 3 }),
  Object.freeze({ id: 'tom-cang', name: 'Tôm Càng', stat: 'atk', cell: 4 }),
  Object.freeze({ id: 'cua-dong', name: 'Cua Đồng', stat: 'def', cell: 5 }),
  Object.freeze({ id: 'ca-dua', name: 'Cá Dứa', stat: 'spd', cell: 6 }),
  Object.freeze({ id: 'ca-guom', name: 'Cá Hồ Gươm', stat: 'hp', cell: 7 })
]);

export const FISH_STAT_PER_LEVEL = Object.freeze({ hp: 10, atk: 2, def: 1, spd: 0.15 });
export const FISH_MASTER_PER_LEVEL = Object.freeze({ hp: 8, atk: 1, def: 1, spd: 0.1 });
export const FISH_MAX_LEVEL = 15;
export const FISH_CAST_COST = Object.freeze({ gold: 50, hoat: 3 });

const FISH_IDS = ACCOUNT_FISHES.map(item => item.id);

function clampLevel(value) {
  const n = Math.floor(Number(value) || 0);
  return Math.max(0, Math.min(FISH_MAX_LEVEL, n));
}

export function emptyAccountFish() {
  return Object.fromEntries(FISH_IDS.map(id => [id, { lvl: 0 }]));
}

export function findAccountFish(id) {
  return ACCOUNT_FISHES.find(item => item.id === id) || null;
}

export function normalizeAccountFish(fish) {
  const next = emptyAccountFish();
  if (!fish || typeof fish !== 'object') return next;
  for (const id of FISH_IDS) {
    next[id] = { lvl: clampLevel(fish[id]?.lvl) };
  }
  return next;
}

export function fishArt(id) {
  return findAccountFish(id) ? ('assets/ui/account-fish/' + id + '.png') : '';
}

export function accountFishMasterLevel(fish) {
  const board = normalizeAccountFish(fish);
  let min = Infinity;
  for (const id of FISH_IDS) {
    const level = board[id].lvl;
    if (level <= 0) return 0;
    min = Math.min(min, level);
  }
  return min === Infinity ? 0 : min;
}

export function accountFishMasterBonus(level) {
  const n = Math.max(0, Math.min(FISH_MAX_LEVEL, Number(level) || 0));
  return {
    hp: FISH_MASTER_PER_LEVEL.hp * n,
    atk: FISH_MASTER_PER_LEVEL.atk * n,
    def: FISH_MASTER_PER_LEVEL.def * n,
    spd: FISH_MASTER_PER_LEVEL.spd * n
  };
}

export function accountFishMasterProgress(fish) {
  const level = accountFishMasterLevel(fish);
  const next = level >= FISH_MAX_LEVEL ? FISH_MAX_LEVEL : level + 1;
  const board = normalizeAccountFish(fish);
  let ready = 0;
  for (const id of FISH_IDS) {
    if (board[id].lvl >= next) ready++;
  }
  return { level, next, ready, need: FISH_IDS.length, max: FISH_MAX_LEVEL, active: level > 0 };
}

export function accountFishBonus(fish) {
  const board = normalizeAccountFish(fish);
  const out = { hp: 0, atk: 0, def: 0, spd: 0 };
  for (const item of ACCOUNT_FISHES) {
    const level = board[item.id].lvl;
    if (level <= 0) continue;
    out[item.stat] += (FISH_STAT_PER_LEVEL[item.stat] || 0) * level;
  }
  const master = accountFishMasterBonus(accountFishMasterLevel(fish));
  out.hp += master.hp;
  out.atk += master.atk;
  out.def += master.def;
  out.spd += master.spd;
  return out;
}

export function prepareFishCast(player, { rng } = {}) {
  const board = normalizeAccountFish(player?.fish);
  const open = FISH_IDS.filter(id => board[id].lvl < FISH_MAX_LEVEL);
  if (!open.length) return fishFail('FISH_MAX_LEVEL', 'Đồ giám cá đã đầy.');
  const gold = Math.max(0, Number(player?.gold) || 0);
  const hoat = Math.max(0, Number(player?.hoat) || 0);
  if (gold < FISH_CAST_COST.gold) return fishFail('INSUFFICIENT_GOLD', 'Không đủ vàng để câu.');
  if (hoat < FISH_CAST_COST.hoat) return fishFail('INSUFFICIENT_HOAT', 'Không đủ Hoạt Lực để câu.');
  const roll = typeof rng === 'function' ? Number(rng()) : Math.random();
  const pick = open[Math.min(open.length - 1, Math.max(0, Math.floor((Number.isFinite(roll) ? roll : 0) * open.length)))];
  board[pick] = { lvl: board[pick].lvl + 1 };
  return {
    ok: true,
    fish: board,
    gold: gold - FISH_CAST_COST.gold,
    hoat: hoat - FISH_CAST_COST.hoat,
    id: pick,
    level: board[pick].lvl,
    spentGold: FISH_CAST_COST.gold,
    spentHoat: FISH_CAST_COST.hoat
  };
}
