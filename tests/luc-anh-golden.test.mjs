import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const index=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const battle=fs.readFileSync(new URL('../battle.html',import.meta.url),'utf8');

const required=[
  'assets/characters/luc-anh/master.webp','assets/characters/luc-anh/avatar.webp','assets/characters/luc-anh/card.webp',
  'assets/characters/luc-anh/idle-atlas.webp','assets/characters/luc-anh/run-atlas.webp','assets/characters/luc-anh/hit-atlas.webp','assets/characters/luc-anh/fall-atlas.webp',
  'assets/characters/luc-anh/basic-atlas.webp','assets/characters/luc-anh/basic_projectile-atlas.webp','assets/characters/luc-anh/basic_impact-atlas.webp',
  'assets/characters/luc-anh/skill1-atlas.webp','assets/characters/luc-anh/skill1_vfx-atlas.webp','assets/characters/luc-anh/ultimate-atlas.webp','assets/characters/luc-anh/ultimate_vfx-atlas.webp',
  'assets/audio/voice-luc-anh-hero.mp3','assets/audio/voice-luc-anh-ultimate.mp3',
  'assets/audio/bgm-lac-than-hub.mp3','assets/audio/bgm-combat.mp3','assets/audio/bgm-challenge.mp3'
];

test('Lục Ảnh golden runtime binds every authored visual and requested audio surface',()=>{
  for(const rel of required) assert.ok(fs.existsSync(new URL(`../${rel}`,import.meta.url)),rel);
  assert.match(index,/luc_anh:\{slug:'luc-anh'/);
  assert.match(index,/Kéo Đèn Lục Ảnh/);
  assert.match(index,/Độc Vân Phủ Thế/);
  assert.match(index,/voice-luc-anh-hero\.mp3/);
  assert.match(battle,/voice-luc-anh-ultimate\.mp3/);
});

test('Lục Ảnh Skill 1 uses six-slot effigy VFX and Ultimate uses exact 3x full-team poison cloud',()=>{
  assert.match(battle,/skill1Vfx.*units\.filter\(u=>u\.team===enemyTeam\)/s);
  assert.match(battle,/exact 3x source-cell display: 320x220 -> 960x660/);
  assert.match(battle,/drawLucAnhAtlas\(context,key,frame,cx,cy\+255,960,660/);
  assert.match(battle,/type:"poison",turns:3,power:dot/);
  assert.match(battle,/Math\.round\(foe\.maxHp\*\.06\)/);
});

test('BGM routes hub/features, battles, and traversal modes to the three supplied tracks',()=>{
  assert.match(index,/maincity:'assets\/audio\/bgm-lac-than-hub\.mp3'/);
  assert.match(index,/combat:'assets\/audio\/bgm-combat\.mp3'/);
  assert.match(index,/challenge:'assets\/audio\/bgm-challenge\.mp3'/);
  assert.match(index,/if\(name==='battle'\)return 'combat'/);
  assert.match(index,/\['tower','expedition','campaign','journey'\]\.includes\(name\)/);
});
