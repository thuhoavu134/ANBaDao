import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { getHeroSkillKit, validateHeroSkillKit, HERO_SKILL_KIT_REGISTRY } from '../src/domain/hero/skill-kit.mjs';
import { STAR_ROSTER_IDS } from '../src/domain/hero/account-stars.mjs';

const root = new URL('../', import.meta.url);
const read = rel => fs.readFileSync(new URL(rel, root), 'utf8');
const exists = rel => fs.existsSync(new URL(rel, root));

test('L156-T1 DATA.heroes.bach_dien and CHARACTER_MANIFEST surfaces match Linh Đồng', () => {
  const index = read('index.html');
  assert.match(index, /bach_dien:\{he:'soul'/);
  assert.match(index, /name:"Bạch Diện"/);
  assert.match(index, /skill:\{name:"Huyễn Diện Trảm"/);
  assert.match(index, /ultimate:\{name:"Ly Hồn Đoạt Phách"/);
  assert.match(index, /stats:\{hp:860/);
  assert.match(index, /bach_dien:\{slug:'bach-dien'/);
  assert.match(index, /surfaces:\['roster','formation','hero-detail','battle'/);
  assert.match(index, /detailBackground:'assets\/ui\/hero-detail\/bach-dien-showcase-bg\.jpg'/);
  assert.equal(exists('assets/ui/hero-detail/bach-dien-showcase-bg.jpg'), true);
  assert.match(index, /soul:\{ic:'🎭',nm:'Âm Hồn'\}/);
});

test('L156-T2 official ids, default owned, stars include Bạch Diện and keep Linh Đồng', () => {
  const index = read('index.html');
  assert.match(index, /OFFICIAL_ROSTER_12_IDS=Object\.freeze\(\[[^\]]*linh_dong/);
  assert.match(index, /OFFICIAL_ROSTER_12_IDS=Object\.freeze\(\[[^\]]*bach_dien/);
  assert.match(index, /\["ong_hang_pho","thay_mo"[^\]]+"bach_dien"\]\.forEach\(id=>\{ if\(heroes\[id\]\) heroes\[id\]\.owned=true; \}\);/);
  assert.match(index, /officialRoster12=\[.*bach_dien/);
  assert.match(index, /officialRoster12=\[.*linh_dong/);
  assert.equal(STAR_ROSTER_IDS.includes('bach_dien'), true);
  assert.equal(STAR_ROSTER_IDS.includes('linh_dong'), true);
  assert.equal(STAR_ROSTER_IDS.includes('luc_anh'), true);
});

test('L156-T3 skill kit v2 is valid and names match authored skill.json', () => {
  const kit = getHeroSkillKit('bach_dien');
  assert.notEqual(kit, null);
  assert.equal(validateHeroSkillKit(kit).ok, true);
  assert.equal(kit.actions.basic.name, 'Nhát quạt đoạn trần duyên');
  assert.equal(kit.actions.ultimate.name, 'Ly Hồn Đoạt Phách');
  assert.equal(kit.passives[0].name, 'Diện Khúc Luân Hồi');
  assert.equal(HERO_SKILL_KIT_REGISTRY.bach_dien, kit);
  const basic = JSON.parse(read('assets/characters/bach-dien/basic/skill.json'));
  const ult = JSON.parse(read('assets/characters/bach-dien/ultimate/skill.json'));
  assert.equal(kit.actions.basic.name, basic.name);
  assert.equal(kit.actions.ultimate.name, ult.name);
});

test('L156-T4 roster tap opens hero detail with idle canvas, not trial battle', () => {
  const runtime = read('src/ui/hero-roster-runtime.js');
  const index = read('index.html');
  assert.doesNotMatch(runtime, /if \(id === 'bach_dien'\)/);
  assert.doesNotMatch(runtime, /qaSplus42=hero_splus_bach_dien/);
  assert.doesNotMatch(runtime, /extras: \[BACH_DIEN_ROSTER_PREVIEW\]/);
  assert.match(runtime, /'bach_dien', 'linh_dong'/);
  assert.match(runtime, /renderHeroDetail\(id\); showScreen\('heroDetail'\)/);
  assert.match(index, /id="bachDienDetailIdle"/);
  assert.match(index, /function startBachDienDetailIdle\(/);
  assert.match(index, /if\(id==='bach_dien'\)\{ startBachDienDetailIdle/);
  const idleIdx = index.indexOf('function startBachDienDetailIdle(');
  const detailIdx = index.indexOf('function renderHeroDetail(');
  assert.ok(idleIdx > detailIdx, 'idle lives after renderHeroDetail so luc-anh patches cannot swallow it');
});

test('L156-T4 dist keeps startBachDienDetailIdle after luc-anh idle patches', () => {
  const dist = read('dist/index.html');
  assert.match(dist, /function startBachDienDetailIdle\(/);
  const idleIdx = dist.indexOf('function startBachDienDetailIdle(');
  const lucIdx = dist.indexOf('function startLucAnhDetailIdle(');
  const detailIdx = dist.indexOf('function renderHeroDetail(');
  assert.ok(lucIdx >= 0 && detailIdx > lucIdx, 'luc idle still precedes renderHeroDetail');
  assert.ok(idleIdx > detailIdx, 'dist idle after renderHeroDetail');
});

test('L156-T5 encyclopedia 42 and 6v6 slices stay; BETS frozen', () => {
  const encyclopedia = read('src/ui/splus-encyclopedia.js');
  assert.match(encyclopedia, /data\.profiles\?\.length!==42/);
  assert.match(encyclopedia, /data\.skillIcons\?\.length!==126/);
  const index = read('index.html');
  assert.match(index, /OFFICIAL_ROSTER_12_IDS\.slice\(0,6\)/);
  assert.match(index, /OFFICIAL_ROSTER_12_IDS\.slice\(6,12\)/);
  const ui = read('src/ui/bach-bao-ruong-runtime.js');
  assert.match(ui, /const BETS = \[2, 10, 50\]/);
});
