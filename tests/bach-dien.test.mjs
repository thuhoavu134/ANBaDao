import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { SPLUS_HEROES, validateSplusCatalog, getSplusHero } from '../src/domain/hero/splus-catalog.mjs';
import { SPLUS_EXTRA_HEROES } from '../src/domain/hero/splus-extras.mjs';
import { createSplusCombat } from '../src/domain/combat/splus-mechanics.mjs';
import { BACH_DIEN_CANONICAL_ID, isBachDienId, normalizeBachDienId } from '../src/domain/character/bach-dien.mjs';
import { SPLUS_PROFILES, SPLUS_SKILL_ICONS } from '../src/domain/hero/splus-profiles.mjs';

const root = new URL('../', import.meta.url);
const read = rel => fs.readFileSync(new URL(rel, root), 'utf8');
const exists = rel => fs.existsSync(new URL(rel, root));
const rng = () => 0.5;

function fixture(extra = {}) {
  const units = [
    { id: '1:0', sourceId: 'hero_splus_bach_dien', team: 1, slot: 4, maxHp: 100000, hp: 100000, atk: 1000, def: 0, speed: 100, energy: 100, crit: 0, critDamage: 1.5, accuracy: 100, evasion: 0, statuses: [], ...extra.self },
    { id: '2:0', sourceId: 'dummy', team: 2, slot: 0, maxHp: 100000, hp: 100000, atk: 5000, def: 0, speed: 80, energy: 40, crit: 0, critDamage: 1.5, accuracy: 100, evasion: 0, statuses: [], ...extra.highAtk },
    { id: '2:1', sourceId: 'dummy', team: 2, slot: 1, maxHp: 100000, hp: extra.lowHp ?? 20000, atk: 1000, def: 0, speed: 80, energy: 40, crit: 0, critDamage: 1.5, accuracy: 100, evasion: 0, statuses: [] },
    { id: '2:2', sourceId: 'dummy', team: 2, slot: 5, maxHp: 100000, hp: 80000, atk: 2000, def: 0, speed: 80, energy: 40, crit: 0, critDamage: 1.5, accuracy: 100, evasion: 0, statuses: [] }
  ];
  const e = createSplusCombat({ units, rng });
  e.start();
  return e;
}

test('L152-T1 aliases resolve extra Bạch Diện; 42 catalog and 7 soul stay locked', () => {
  assert.equal(BACH_DIEN_CANONICAL_ID, 'hero_splus_bach_dien');
  for (const id of ['hero_splus_bach_dien', 'bach_dien', 'bach-dien', 'BACH_DIEN']) {
    assert.equal(normalizeBachDienId(id), 'hero_splus_bach_dien', id);
    assert.equal(isBachDienId(id), true, id);
    assert.equal(getSplusHero(id)?.id, 'hero_splus_bach_dien', id);
  }
  const hero = getSplusHero('hero_splus_bach_dien');
  assert.equal(hero.name, 'Bạch Diện');
  assert.equal(hero.element, 'soul');
  assert.equal(hero.passiveName, 'Diện Khúc Luân Hồi');
  assert.equal(hero.weapon, 'Huyễn Hồn Phiến');
  assert.equal(hero.actions.skill.name, 'Huyễn Diện Trảm');
  assert.equal(hero.actions.ultimate.name, 'Ly Hồn Đoạt Phách');
  assert.equal(hero.actions.ultimate.cost, 100);
  assert.equal(hero.voice.lobby, 'Đời người như vở kịch ngắn ngủi... Đến khi hạ màn, ai mới là kẻ đeo mặt nạ?');
  assert.equal(hero.voice.ultimate, 'Mượn xác tráo hồn... Khúc ca tuyệt mệnh!');
  assert.equal(hero.voice.basic, 'Nhát quạt đoạn trần duyên!');
  assert.equal(hero.voice.skill, 'Hý biến vô thường... Xem ngươi diễn tiếp ra sao!');
  assert.equal(hero.voice.defeat, 'Mặt nạ... vỡ rồi...');
  assert.deepEqual(validateSplusCatalog().errors, []);
  assert.equal(SPLUS_HEROES.length, 42);
  assert.equal(SPLUS_HEROES.filter(h => h.element === 'soul').length, 7);
  assert.equal(SPLUS_HEROES.some(h => h.key === 'bach_dien'), false);
  assert.equal(SPLUS_EXTRA_HEROES.some(h => h.id === 'hero_splus_bach_dien'), true);
  assert.equal(SPLUS_PROFILES.length, 42);
  assert.equal(SPLUS_SKILL_ICONS.length, 126);
});

test('L152-T2 mask swaps Joy then Rage on skill; incoming miss also swaps', () => {
  const e = fixture();
  assert.equal(e.unit('1:0').splus.memory.masks, 3);
  assert.equal(e.act('1:0', 'skill').ok, true);
  assert.equal(e.unit('1:0').splus.memory.maskFace, 'joy');
  assert.equal(e.modifiers('1:0').crit, 0.25);
  assert.equal(e.unit('1:0').statuses.some(s => s.type === 'joyMask'), true);
  assert.equal(e.unit('1:0').splus.memory.masks, 3);
  e.beginRound(3);
  e.unit('1:0').energy = 100;
  assert.equal(e.act('1:0', 'skill').ok, true);
  assert.equal(e.unit('1:0').splus.memory.maskFace, 'rage');
  assert.equal(e.modifiers('1:0').critDamage, 0.3);
  assert.equal(e.modifiers('1:0').lifesteal, 0.15);
  assert.equal(e.unit('1:0').statuses.some(s => s.type === 'joyMask'), false);
  assert.equal(e.unit('1:0').statuses.some(s => s.type === 'rageMask'), true);

  const f = fixture();
  f.unit('2:0').accuracy = 0;
  f.damage('2:0', '1:0');
  assert.equal(f.events.some(x => x.type === 'miss'), true);
  assert.equal(f.unit('1:0').splus.memory.maskFace, 'joy');
  assert.equal(f.modifiers('1:0').crit, 0.25);
});

test('L152-T3 World-Substitute eats incoming crit then spends all masks', () => {
  const e = fixture();
  e.act('1:0', 'skill');
  assert.equal(e.unit('1:0').splus.memory.masks, 3);
  const hp = e.unit('1:0').hp;
  const dealt = e.damage('2:0', '1:0', { raw: 8000, critical: true });
  assert.equal(dealt, 0);
  assert.equal(e.unit('1:0').hp, hp);
  assert.equal(e.unit('1:0').splus.memory.masks, 0);
  assert.equal(e.unit('1:0').splus.memory.maskFace, null);
  assert.equal(e.unit('1:0').statuses.some(s => s.type === 'stealth'), true);
  assert.equal(e.unit('1:0').statuses.some(s => s.type === 'joyMask' || s.type === 'rageMask'), false);
  assert.equal(e.events.some(x => x.type === 'worldSubstitute'), true);
  const second = e.damage('2:0', '1:0', { raw: 8000, critical: true });
  assert.equal(second, 8000);
  assert.equal(e.unit('1:0').hp, hp - 8000);
});

test('L152-T4 S1 hits lowest HP, execute crit and Mê Loạn under 40%', () => {
  const e = fixture();
  e.events.length = 0;
  assert.deepEqual(e.targets('1:0', 'skill').map(u => u.id), ['2:1']);
  assert.equal(e.act('1:0', 'skill').ok, true);
  const hits = e.events.filter(x => x.type === 'damage' && !x.secondary);
  assert.equal(hits.length, 1);
  assert.equal(hits[0].targetId, '2:1');
  assert.equal(hits[0].critical, true);
  assert.equal(hits[0].damageType, 'elemental');
  const chaos = e.unit('2:1').statuses.find(s => s.type === 'magicArmorDown');
  assert.equal(chaos.power, 0.5);
  assert.equal(e.canUse('1:0', 'skill'), false);
  e.beginRound(3);
  e.unit('1:0').energy = 25;
  assert.equal(e.canUse('1:0', 'skill'), true);

  const full = fixture({ lowHp: 50000 });
  full.events.length = 0;
  full.act('1:0', 'skill');
  const fullHit = full.events.filter(x => x.type === 'damage' && !x.secondary)[0];
  assert.equal(fullHit.targetId, '2:1');
  assert.equal(fullHit.critical, false);
  assert.equal(full.unit('2:1').statuses.some(s => s.type === 'magicArmorDown'), false);
});

test('L152-T5 Ult costs 100, hits highest ATK, steals and locks', () => {
  const e = fixture();
  e.unit('1:0').energy = 99;
  assert.equal(e.canUse('1:0', 'ultimate'), false);
  e.unit('1:0').energy = 100;
  assert.equal(e.canUse('1:0', 'ultimate'), true);
  assert.deepEqual(e.targets('1:0', 'ultimate').map(u => u.id), ['2:0']);
  e.events.length = 0;
  assert.equal(e.act('1:0', 'ultimate').ok, true);
  assert.equal(e.unit('1:0').energy, 0);
  const hits = e.events.filter(x => x.type === 'damage' && !x.secondary);
  assert.equal(hits.length, 1);
  assert.equal(hits[0].targetId, '2:0');
  assert.equal(hits[0].damageType, 'elemental');
  assert.equal(e.unit('2:0').statuses.find(s => s.type === 'attackDown').power, 0.25);
  assert.equal(e.modifiers('1:0').attack, 1.25);
  // Survivor of Ly Hồn Đoạt Phách panics (Hoảng loạn): loses its next turn.
  assert.equal(e.unit('2:0').statuses.some(s => s.type === 'fear'), true);
  assert.equal(e.canUse('2:0', 'basic'), false);
  assert.equal(e.unit('2:0').statuses.find(s => s.type === 'antiHeal').power, 1);
  assert.equal(e.unit('2:0').statuses.some(s => s.type === 'buffBan'), true);
  assert.equal(e.canUse('2:0', 'basic'), false);
  const before = e.unit('2:0').hp;
  e.heal('2:0', '2:0', 5000);
  assert.equal(e.unit('2:0').hp, before);
});

test('L152-T6 reference art exists; TKT-0154 binds authored atlases', () => {
  for (const rel of [
    'assets/characters/bach-dien/ASSET.md',
    'assets/characters/bach-dien/PROMPTS.md',
    'assets/characters/bach-dien/avatar.webp',
    'assets/characters/bach-dien/card.webp',
    'assets/characters/bach-dien/hud-icon.webp',
    'assets/characters/bach-dien/basic/skill.json',
    'assets/characters/bach-dien/skill1/skill.json',
    'assets/characters/bach-dien/ultimate/skill.json'
  ]) assert.ok(exists(rel), rel);
  const skill1 = JSON.parse(read('assets/characters/bach-dien/skill1/skill.json'));
  const ult = JSON.parse(read('assets/characters/bach-dien/ultimate/skill.json'));
  assert.equal(skill1.schema, 'hon-viet-skill/v1');
  assert.equal(skill1.id, 'bach-dien.skill1');
  assert.equal(skill1.status, 'authored-pack-v1');
  assert.equal(ult.id, 'bach-dien.ultimate');
  assert.equal(ult.audio.cast, 'assets/audio/sfx/bach-dien/ult.wav');
  const prompts = read('assets/characters/bach-dien/PROMPTS.md');
  assert.match(prompts, /#00FF00/);
  assert.match(prompts, /Huyễn Diện Trảm|iron fan/i);
  assert.doesNotMatch(prompts, /Spine runtime|spine runtime/i);
});

test('L152-T7 encyclopedia 42 stays closed; playable roster now includes Bạch Diện', () => {
  const index = read('index.html');
  assert.match(index, /OFFICIAL_ROSTER_12_IDS=Object\.freeze\(\[[^\]]*bach_dien/);
  assert.match(index, /bach_dien:\{slug:'bach-dien'/);
  const encyclopedia = read('src/ui/splus-encyclopedia.js');
  assert.match(encyclopedia, /data\.profiles\?\.length!==42/);
  assert.match(encyclopedia, /data\.skillIcons\?\.length!==126/);
});

function killFixture(roll) {
  const units = [
    { id: '1:0', sourceId: 'hero_splus_bach_dien', team: 1, slot: 4, maxHp: 100000, hp: 100000, atk: 1000, def: 0, speed: 100, energy: 100, crit: 0, critDamage: 1.5, accuracy: 100, evasion: 0, statuses: [] },
    { id: '2:0', sourceId: 'dummy', team: 2, slot: 0, maxHp: 100000, hp: 100, atk: 5000, def: 0, speed: 80, energy: 40, crit: 0, critDamage: 1.5, accuracy: 100, evasion: 0, statuses: [] },
    { id: '2:1', sourceId: 'dummy', team: 2, slot: 1, maxHp: 100000, hp: 100000, atk: 1000, def: 0, speed: 80, energy: 40, crit: 0, critDamage: 1.5, accuracy: 100, evasion: 0, statuses: [] },
    { id: '2:2', sourceId: 'dummy', team: 2, slot: 5, maxHp: 100000, hp: 100000, atk: 2000, def: 0, speed: 80, energy: 40, crit: 0, critDamage: 1.5, accuracy: 100, evasion: 0, statuses: [] }
  ];
  const e = createSplusCombat({ units, rng: label => label === 'splus.bach-dien-panic' ? roll : 0.5 });
  e.start();
  return e;
}

test('Ly Hồn Đoạt Phách kill: every surviving ally panics — 70% loses the turn, 30% strikes its own side', () => {
  const skip = killFixture(0.69);
  assert.equal(skip.act('1:0', 'ultimate').ok, true);
  assert.equal(skip.unit('2:0').hp, 0);
  for (const id of ['2:1', '2:2']) {
    assert.equal(skip.unit(id).statuses.some(s => s.type === 'fear'), true, id);
    assert.equal(skip.canUse(id, 'basic'), false, id);
  }
  assert.equal(skip.events.some(x => x.type === 'massPanic'), true);
  const betray = killFixture(0.7);
  assert.equal(betray.act('1:0', 'ultimate').ok, true);
  for (const id of ['2:1', '2:2']) {
    const c = betray.unit(id).statuses.find(s => s.type === 'confusion');
    assert.ok(c, id); assert.equal(c.chance, 1);
    assert.equal(betray.unit(id).statuses.some(s => s.type === 'fear'), false, id);
  }
});
