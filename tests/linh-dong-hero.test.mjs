import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { getHeroSkillKit, validateHeroSkillKit, HERO_SKILL_KIT_REGISTRY } from '../src/domain/hero/skill-kit.mjs';
import { STAR_ROSTER_IDS } from '../src/domain/hero/account-stars.mjs';

const root = new URL('../', import.meta.url);
const read = rel => fs.readFileSync(new URL(rel, root), 'utf8');
const exists = rel => fs.existsSync(new URL(rel, root));

test('L141-T1 DATA.heroes.linh_dong and CHARACTER_MANIFEST surfaces match Lục Ảnh', () => {
  const index = read('index.html');
  assert.match(index, /linh_dong:\{he:'mong'/);
  assert.match(index, /name:"Linh Đồng"/);
  assert.match(index, /skill:\{name:"Nhiễu Loạn Âm Ty"/);
  assert.match(index, /ultimate:\{name:"Bách Quỷ Dạ Hành"/);
  assert.match(index, /stats:\{hp:900/);
  assert.match(index, /linh_dong:\{slug:'linh-dong'/);
  assert.match(index, /surfaces:\['roster','formation','hero-detail','battle'/);
  assert.match(index, /detailBackground:'assets\/ui\/hero-detail\/linh-dong-showcase-bg\.jpg'/);
  assert.equal(exists('assets/ui/hero-detail/linh-dong-showcase-bg.jpg'), true);
});

test('L141-T2 official ids, default owned, stars include Linh Đồng', () => {
  const index = read('index.html');
  assert.match(index, /OFFICIAL_ROSTER_12_IDS=Object\.freeze\(\[[^\]]*linh_dong/);
  assert.match(index, /\["ong_hang_pho","thay_mo"[^\]]+"linh_dong"[^\]]*\]\.forEach\(id=>\{ if\(heroes\[id\]\) heroes\[id\]\.owned=true; \}\);/);
  assert.match(index, /officialRoster12=\[.*linh_dong/);
  assert.equal(STAR_ROSTER_IDS.includes('linh_dong'), true);
  assert.equal(STAR_ROSTER_IDS.includes('luc_anh'), true);
});

test('L141-T3 skill kit v2 is valid and names match authored skill.json', () => {
  const kit = getHeroSkillKit('linh_dong');
  assert.notEqual(kit, null);
  assert.equal(validateHeroSkillKit(kit).ok, true);
  assert.equal(kit.actions.basic.name, 'Lạc Hồn Tiếng Chuông');
  assert.equal(kit.actions.ultimate.name, 'Bách Quỷ Dạ Hành');
  assert.equal(kit.passives[0].name, 'Ấn Âm Ty');
  assert.equal(HERO_SKILL_KIT_REGISTRY.linh_dong, kit);
  const basic = JSON.parse(read('assets/characters/linh-dong/basic/skill.json'));
  const ult = JSON.parse(read('assets/characters/linh-dong/ultimate/skill.json'));
  assert.equal(kit.actions.basic.name, basic.name);
  assert.equal(kit.actions.ultimate.name, ult.name);
});

test('L141-T4 roster tap opens hero detail with idle canvas, not trial battle', () => {
  const runtime = read('src/ui/hero-roster-runtime.js');
  const index = read('index.html');
  assert.doesNotMatch(runtime, /if \(id === 'linh_dong'\)/);
  assert.doesNotMatch(runtime, /qaSplus42=hero_splus_linh_dong/);
  assert.match(runtime, /renderHeroDetail\(id\); showScreen\('heroDetail'\)/);
  assert.match(index, /id="linhDongDetailIdle"/);
  assert.match(index, /function startLinhDongDetailIdle\(/);
  assert.match(index, /if\(id==='linh_dong'\)\{ startLinhDongDetailIdle/);
  const idleIdx = index.indexOf('function startLinhDongDetailIdle(');
  const detailIdx = index.indexOf('function renderHeroDetail(');
  assert.ok(idleIdx > detailIdx, 'idle lives after renderHeroDetail so luc-anh patches cannot swallow it');
});

test('L141-T4 dist keeps startLinhDongDetailIdle after luc-anh idle patches', () => {
  const dist = read('dist/index.html');
  assert.match(dist, /function startLinhDongDetailIdle\(/);
  const idleIdx = dist.indexOf('function startLinhDongDetailIdle(');
  const lucIdx = dist.indexOf('function startLucAnhDetailIdle(');
  const detailIdx = dist.indexOf('function renderHeroDetail(');
  assert.ok(lucIdx >= 0 && detailIdx > lucIdx, 'luc idle still precedes renderHeroDetail');
  assert.ok(idleIdx > detailIdx, 'dist idle after renderHeroDetail');
});

test('L141-T5 campaign battle draws atlas and authored skills; 6v6 slices stay', () => {
  const battle = read('battle.html');
  const index = read('index.html');
  assert.match(battle, /function isLinhDong\(/);
  assert.match(battle, /function drawLinhDongHero\(/);
  assert.match(battle, /if\(isLinhDong\(actor\)&&action==="skill"\)/);
  assert.match(battle, /if\(isLinhDong\(actor\)&&action==="ultimate"\)/);
  assert.match(battle, /const usesLinhDong = isLinhDong\(actor\)/);
  assert.match(battle, /startLinhDongFx/);
  assert.match(index, /OFFICIAL_ROSTER_12_IDS\.slice\(0,6\)/);
  assert.match(index, /OFFICIAL_ROSTER_12_IDS\.slice\(6,12\)/);
  const ui = read('src/ui/bach-bao-ruong-runtime.js');
  assert.match(ui, /const BETS = \[2, 10, 50\]/);
});
