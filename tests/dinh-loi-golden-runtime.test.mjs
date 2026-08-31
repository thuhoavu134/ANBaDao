import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const battle=fs.readFileSync(new URL('../battle.html',import.meta.url),'utf8');

test('Đình Lôi binds all fourteen authored asset layers',()=>{
  const files=['idle-atlas.png','run-atlas.png','hit-atlas.png','fall-atlas.png','basic-cast-atlas.png','basic-projectile-atlas.png','basic-impact-atlas.png','skill1-cast-atlas.png','skill1-wave-atlas.png','skill1-impact-atlas.png','skill1-shield-atlas.png','ultimate-cast-atlas.png','ultimate-vfx-atlas.png','ultimate-impact-atlas.png'];
  for(const file of files){assert.ok(battle.includes(file),file);assert.ok(fs.existsSync(new URL(`../assets/characters/dinh-loi/${file}`,import.meta.url)),file);}
});

test('Đình Lôi runtime uses native 2x atlases',()=>{
  const landscape=['idle-atlas.png','run-atlas.png','hit-atlas.png','fall-atlas.png','basic-cast-atlas.png','basic-projectile-atlas.png','basic-impact-atlas.png','skill1-cast-atlas.png','skill1-wave-atlas.png','skill1-impact-atlas.png','skill1-shield-atlas.png','ultimate-cast-atlas.png'];
  for(const file of landscape){const png=fs.readFileSync(new URL(`../assets/characters/dinh-loi/${file}`,import.meta.url));assert.equal(png.readUInt32BE(16),3840,`${file} width`);assert.equal(png.readUInt32BE(20),2160,`${file} height`);}
  for(const file of ['ultimate-vfx-atlas.png','ultimate-impact-atlas.png']){const png=fs.readFileSync(new URL(`../assets/characters/dinh-loi/${file}`,import.meta.url));assert.equal(png.readUInt32BE(16),2160,`${file} width`);assert.equal(png.readUInt32BE(20),3840,`${file} height`);}
});

test('Đình Lôi uses deterministic authored character states and separate VFX layers',()=>{
  assert.match(battle,/function drawDinhLoiHero\(/);
  assert.match(battle,/function drawDinhLoiFx\(/);
  assert.match(battle,/function drawDinhLoiPersistentShields\(/);
  for(const state of ['attack','skill1','ultimate','hurt','defeated','run','idle'])assert.ok(battle.includes(`key="${state}"`)||battle.includes(`unit.state==="${state}"`),state);
});



test('Đình Lôi reference adapter keeps attack distance readable and support casts on-screen',()=>{
  assert.match(battle,/const DINH_LOI_REFERENCE_SPACING = Object\.freeze/);
  assert.doesNotMatch(battle,/target\.x \+ side \* 205/);
  assert.doesNotMatch(battle,/return \{ x: side \* 42, y: actor\.y \};/);
  assert.match(battle,/basicMinStandoff:76/);
  assert.match(battle,/basicStandoff:112/);
  assert.match(battle,/distance\*DINH_LOI_REFERENCE_SPACING\.basicDistanceRatio/);
  assert.match(battle,/originX\+forward\*advance/);
  assert.match(battle,/castMidlineGap/);
  assert.match(battle,/tweenUnit\(actor,releasePoint\.x,releasePoint\.y,TIMING\.approach,battleId\)/);
});

test('Đình Lôi action choreography resolves at authored impact and returns home',()=>{
  assert.match(battle,/Đánh thường • Hồi văn bay/);
  assert.match(battle,/Kỹ năng nâng cấp • Hồi văn truyền khiên/);
  assert.match(battle,/Tuyệt kỹ • Lôi trận phủ sân/);
  assert.match(battle,/tweenUnit\(actor,origin\.x,origin\.y,520,battleId\)/);
});

test('Đình Lôi gameplay grants targeted shield, team shield, counter and enemy shock damage',()=>{
  assert.match(battle,/isDinhLoi\(actor\)&&action==="skill"/);
  assert.match(battle,/friend\.maxHp\*\.20/);
  assert.match(battle,/isDinhLoi\(actor\)&&action==="ultimate"/);
  assert.match(battle,/friend\.maxHp\*\.28/);
  assert.match(battle,/friend\.counterReady=true/);
  assert.match(battle,/foes\.forEach\(foe=>\{total\+=applyDamage/);
});

test('one-battle QA sequence covers Basic, Talent Skill and Ultimate',()=>{
  assert.match(battle,/qaRunDinhLoiShowcase:async/);
  assert.match(battle,/for\(const action of \["basic","skill","ultimate"\]\)/);
  assert.match(battle,/qaPreviewDinhLoiHit/);
  assert.match(battle,/qaPreviewDinhLoiFall/);
});
