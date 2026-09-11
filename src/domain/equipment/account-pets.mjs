const petFail = (code, message) => ({ ok: false, code, message });

export const ACCOUNT_PETS = Object.freeze([
  Object.freeze({ id: 'kim-quy', name: 'Kim Quy', stat: 'def', column: 'left', order: 0 }),
  Object.freeze({ id: 'rong-lac', name: 'Rồng Lạc', stat: 'atk', column: 'left', order: 1 }),
  Object.freeze({ id: 'ho-thieng', name: 'Hổ Thiêng', stat: 'atk', column: 'left', order: 2 }),
  Object.freeze({ id: 'hac-trang', name: 'Hạc Trắng', stat: 'spd', column: 'right', order: 0 }),
  Object.freeze({ id: 'ca-chep', name: 'Cá Chép', stat: 'hp', column: 'right', order: 1 }),
  Object.freeze({ id: 'trau-vang', name: 'Trâu Vàng', stat: 'hp', column: 'right', order: 2 })
]);

export const PET_STAT_PER_LEVEL = Object.freeze({ hp: 16, atk: 3, def: 3, spd: 0.5 });
export const PET_MASTER_PER_LEVEL = Object.freeze({ hp: 16, atk: 2, def: 2, spd: 0.4 });
export const PET_SUPPORT_RATIO = 0.25;
export const PET_MAX_LEVEL = 15;
export const PET_DEFAULT_DEPLOYED = 'kim-quy';

const PET_IDS = ACCOUNT_PETS.map(pet => pet.id);

function clampLevel(value) {
  const n = Math.floor(Number(value) || 0);
  return Math.max(0, Math.min(PET_MAX_LEVEL, n));
}

function emptyLevels() {
  return Object.fromEntries(PET_IDS.map(id => [id, { lvl: 0 }]));
}

export function emptyAccountPets() {
  return { deployed: PET_DEFAULT_DEPLOYED, levels: emptyLevels() };
}

export function findAccountPet(id) {
  return ACCOUNT_PETS.find(pet => pet.id === id) || null;
}

export function normalizeAccountPets(pets) {
  const next = emptyAccountPets();
  if (!pets || typeof pets !== 'object') return next;
  const source = pets.levels && typeof pets.levels === 'object' ? pets.levels : pets;
  for (const id of PET_IDS) {
    next.levels[id] = { lvl: clampLevel(source[id]?.lvl) };
  }
  next.deployed = findAccountPet(pets.deployed)?.id || PET_DEFAULT_DEPLOYED;
  return next;
}

export function petEnhanceCost(level) {
  const n = Math.max(0, Math.min(PET_MAX_LEVEL, Number(level) || 0));
  return { gold: 60 + n * 30, hoat: 3 + Math.floor(n / 3) };
}

export function petArt(id) {
  return findAccountPet(id) ? ('assets/ui/account-pets/' + id + '.png') : '';
}

export function accountPetMasterLevel(pets) {
  const board = normalizeAccountPets(pets);
  let min = Infinity;
  for (const id of PET_IDS) {
    const level = board.levels[id].lvl;
    if (level <= 0) return 0;
    min = Math.min(min, level);
  }
  return min === Infinity ? 0 : min;
}

export function accountPetMasterBonus(level) {
  const n = Math.max(0, Math.min(PET_MAX_LEVEL, Number(level) || 0));
  return {
    hp: PET_MASTER_PER_LEVEL.hp * n,
    atk: PET_MASTER_PER_LEVEL.atk * n,
    def: PET_MASTER_PER_LEVEL.def * n,
    spd: PET_MASTER_PER_LEVEL.spd * n
  };
}

export function accountPetMasterProgress(pets) {
  const level = accountPetMasterLevel(pets);
  const next = level >= PET_MAX_LEVEL ? PET_MAX_LEVEL : level + 1;
  const board = normalizeAccountPets(pets);
  let ready = 0;
  for (const id of PET_IDS) {
    if (board.levels[id].lvl >= next) ready++;
  }
  return { level, next, ready, need: PET_IDS.length, max: PET_MAX_LEVEL, active: level > 0 };
}

function addStats(out, add) {
  if (!add) return;
  for (const key of ['hp', 'atk', 'def', 'spd']) {
    out[key] += Number(add[key]) || 0;
  }
}

export function accountPetBonus(pets) {
  const board = normalizeAccountPets(pets);
  const out = { hp: 0, atk: 0, def: 0, spd: 0 };
  for (const pet of ACCOUNT_PETS) {
    const level = board.levels[pet.id].lvl;
    if (level <= 0) continue;
    const ratio = board.deployed === pet.id ? 1 : PET_SUPPORT_RATIO;
    out[pet.stat] += (PET_STAT_PER_LEVEL[pet.stat] || 0) * level * ratio;
  }
  addStats(out, accountPetMasterBonus(accountPetMasterLevel(pets)));
  return out;
}

export function preparePetEnhance(player, { id, times = 1 } = {}) {
  const pet = findAccountPet(id);
  if (!pet) return petFail('INVALID_PET', 'Linh thú không hợp lệ.');
  const board = normalizeAccountPets(player?.pets);
  let gold = Math.max(0, Number(player?.gold) || 0);
  let hoat = Math.max(0, Number(player?.hoat) || 0);
  const steps = Math.max(1, Math.floor(Number(times) || 1));
  let raised = 0;
  let spentGold = 0;
  let spentHoat = 0;
  if (board.levels[id].lvl >= PET_MAX_LEVEL) return petFail('PET_MAX_LEVEL', 'Linh thú đã đạt cấp tối đa.');
  for (let step = 0; step < steps; step++) {
    if (board.levels[id].lvl >= PET_MAX_LEVEL) break;
    const cost = petEnhanceCost(board.levels[id].lvl);
    if (gold < cost.gold) {
      if (!raised) return petFail('INSUFFICIENT_GOLD', 'Không đủ vàng để cường hóa.');
      break;
    }
    if (hoat < cost.hoat) {
      if (!raised) return petFail('INSUFFICIENT_HOAT', 'Không đủ Hoạt Lực để cường hóa.');
      break;
    }
    gold -= cost.gold;
    hoat -= cost.hoat;
    spentGold += cost.gold;
    spentHoat += cost.hoat;
    board.levels[id] = { lvl: board.levels[id].lvl + 1 };
    raised++;
  }
  return {
    ok: true,
    pets: board,
    gold,
    hoat,
    id,
    raised,
    spentGold,
    spentHoat,
    level: board.levels[id].lvl
  };
}

export function preparePetDeploy(player, { id } = {}) {
  const pet = findAccountPet(id);
  if (!pet) return petFail('INVALID_PET', 'Linh thú không hợp lệ.');
  const board = normalizeAccountPets(player?.pets);
  board.deployed = pet.id;
  return { ok: true, pets: board, id: pet.id };
}
