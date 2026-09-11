import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  ACCOUNT_PETS,
  PET_MAX_LEVEL,
  PET_STAT_PER_LEVEL,
  PET_SUPPORT_RATIO,
  accountPetBonus,
  accountPetMasterBonus,
  accountPetMasterLevel,
  emptyAccountPets,
  normalizeAccountPets,
  petEnhanceCost,
  preparePetDeploy,
  preparePetEnhance
} from '../src/domain/equipment/account-pets.mjs';

function player(extra = {}) {
  return {
    gold: 4000,
    hoat: 80,
    pets: emptyAccountPets(),
    ...extra
  };
}

test('L14-P1: six Vietnamese pets cover the four combat stats and empty board grants nothing', () => {
  assert.equal(ACCOUNT_PETS.length, 6);
  const stats = { hp: 0, atk: 0, def: 0, spd: 0 };
  const columns = { left: 0, right: 0 };
  for (const pet of ACCOUNT_PETS) {
    stats[pet.stat] += 1;
    columns[pet.column] += 1;
    assert.ok(pet.id && pet.name);
  }
  assert.equal(columns.left, 3);
  assert.equal(columns.right, 3);
  assert.ok(stats.hp >= 1 && stats.atk >= 1 && stats.def >= 1 && stats.spd >= 1);
  const empty = emptyAccountPets();
  assert.equal(empty.deployed, 'kim-quy');
  assert.equal(accountPetMasterLevel(empty), 0);
  assert.deepEqual(accountPetBonus(empty), { hp: 0, atk: 0, def: 0, spd: 0 });
});

test('L14-P2: enhance spends gold and hoat, stays immutable, and rejects max or missing funds', () => {
  const state = player();
  const first = preparePetEnhance(state, { id: 'kim-quy' });
  const cost = petEnhanceCost(0);
  assert.equal(first.ok, true);
  assert.equal(first.pets.levels['kim-quy'].lvl, 1);
  assert.equal(first.gold, 4000 - cost.gold);
  assert.equal(first.hoat, 80 - cost.hoat);
  assert.equal(state.pets.levels['kim-quy'].lvl, 0);
  assert.equal(state.gold, 4000);
  assert.equal(preparePetEnhance(state, { id: 'no-such' }).code, 'INVALID_PET');
  assert.equal(preparePetEnhance(player({ gold: 0, hoat: 80 }), { id: 'kim-quy' }).code, 'INSUFFICIENT_GOLD');
  assert.equal(preparePetEnhance(player({ gold: 4000, hoat: 0 }), { id: 'kim-quy' }).code, 'INSUFFICIENT_HOAT');
  const capped = player({
    pets: { deployed: 'kim-quy', levels: { ...emptyAccountPets().levels, 'kim-quy': { lvl: PET_MAX_LEVEL } } }
  });
  assert.equal(preparePetEnhance(capped, { id: 'kim-quy' }).code, 'PET_MAX_LEVEL');
  const burst = preparePetEnhance(state, { id: 'rong-lac', times: 3 });
  assert.equal(burst.ok, true);
  assert.equal(burst.raised, 3);
  assert.equal(burst.pets.levels['rong-lac'].lvl, 3);
});

test('L14-P3: deployed pet is full power, others are support, Bậc Thầy needs all six', () => {
  const pets = emptyAccountPets();
  pets.levels['kim-quy'] = { lvl: 4 };
  pets.levels['rong-lac'] = { lvl: 4 };
  pets.deployed = 'kim-quy';
  const mixed = accountPetBonus(pets);
  assert.equal(mixed.def, PET_STAT_PER_LEVEL.def * 4);
  assert.equal(mixed.atk, PET_STAT_PER_LEVEL.atk * 4 * PET_SUPPORT_RATIO);
  pets.deployed = 'rong-lac';
  const swapped = accountPetBonus(pets);
  assert.equal(swapped.atk, PET_STAT_PER_LEVEL.atk * 4);
  assert.equal(swapped.def, PET_STAT_PER_LEVEL.def * 4 * PET_SUPPORT_RATIO);
  const deploy = preparePetDeploy(player({ pets }), { id: 'hac-trang' });
  assert.equal(deploy.ok, true);
  assert.equal(deploy.pets.deployed, 'hac-trang');
  assert.equal(pets.deployed, 'rong-lac');
  assert.equal(preparePetDeploy(player(), { id: 'ghost' }).code, 'INVALID_PET');
  for (const pet of ACCOUNT_PETS) pets.levels[pet.id] = { lvl: 2 };
  pets.deployed = 'kim-quy';
  const armed = accountPetBonus(pets);
  const master = accountPetMasterBonus(2);
  assert.equal(accountPetMasterLevel(pets), 2);
  assert.ok(armed.hp >= master.hp);
  assert.ok(armed.atk >= master.atk);
  pets.levels['trau-vang'] = { lvl: 0 };
  assert.equal(accountPetMasterLevel(pets), 0);
});

const ui = readFileSync(new URL('../src/ui/account-gear-runtime.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/ui/account-gear-board.css', import.meta.url), 'utf8');
const inject = readFileSync(new URL('../scripts/account-gear-v1.mjs', import.meta.url), 'utf8');

test('L14-P4: wheel opens Linh Thú as a flanking pet board with deploy', () => {
  assert.match(ui, /open:\s*'pet'/);
  assert.match(ui, /data-gear-view="pet"/);
  assert.match(ui, /data-pet="/);
  assert.match(ui, /Bậc Thầy Linh Thú/);
  assert.match(ui, /Xuất chiến/);
  assert.match(ui, /openPet/);
  assert.match(ui, /assist === 'pet'/);
  assert.match(ui, /accountPetBonus/);
  assert.match(css, /\.hv-pet-slot/);
  assert.match(css, /\.hv-pet-col/);
  assert.match(inject, /account-pets\.mjs/);
  new Function(ui);
});
