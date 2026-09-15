import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { LINH_DONG_CHAR, LINH_DONG_FIELD, LINH_DONG_CLIPS } from '../src/domain/character/linh-dong.mjs';

const root = new URL('../', import.meta.url);
const read = rel => fs.readFileSync(new URL(rel, root), 'utf8');

test('L142-T1 battle draws Linh Dong at authored cell aspect and Luc Anh idle multiplier', () => {
  assert.equal(LINH_DONG_CHAR.cellW, 480);
  assert.equal(LINH_DONG_CHAR.cellH, 440);
  assert.equal(LINH_DONG_CHAR.scale, 1);
  assert.equal(LINH_DONG_FIELD.drawW, 477);
  assert.equal(LINH_DONG_FIELD.drawH, 440);
  assert.equal(LINH_DONG_FIELD.baseline, 64);
  const battle = read('battle.html');
  assert.match(battle, /drawLinhDongAtlas\(context,key,frame,0,0,477,440,\{baseline:64\}\)/);
  assert.doesNotMatch(battle, /drawLinhDongAtlas\(context,key,frame,0,0,340,332/);
});

test('L142-T2 VFX uses frames.json display size and source-over, not screen', () => {
  const battle = read('battle.html');
  const skill = JSON.parse(read('assets/characters/linh-dong/skill1/vfx/frames.json'));
  const ult = JSON.parse(read('assets/characters/linh-dong/ultimate/vfx/frames.json'));
  assert.equal(skill.display.width, 360);
  assert.equal(skill.display.height, 202);
  assert.equal(skill.display.blendMode, 'source-over');
  assert.equal(ult.display.width, 720);
  assert.equal(ult.display.height, 405);
  assert.equal(ult.display.blendMode, 'source-over');
  assert.match(battle, /drawLinhDongAtlas\(context,fx\.kind,frame,x,y,360,202,\{baseline:101/);
  assert.match(battle, /drawLinhDongAtlas\(context,fx\.kind,frame,cx,cy,720,405,\{baseline:202/);
  assert.doesNotMatch(battle, /drawLinhDongAtlas\(context,fx\.kind[\s\S]{0,180}screen:true/);
  assert.match(battle, /if\(options\.blend\)context\.globalCompositeOperation=options\.blend/);
  assert.match(battle, /blend:"source-over"/);
});

test('L142-T3 authored SFX ride HonVietSfx wav, not new Audio ogg', () => {
  const battle = read('battle.html');
  const sfx = read('src/ui/audio-sfx-runtime.js');
  const basic = JSON.parse(read('assets/characters/linh-dong/basic/skill.json'));
  const skill1 = JSON.parse(read('assets/characters/linh-dong/skill1/skill.json'));
  const ult = JSON.parse(read('assets/characters/linh-dong/ultimate/skill.json'));
  assert.match(sfx, /'linh-dong-atk': 'linh-dong\/atk\.wav'/);
  assert.match(sfx, /'linh-dong-ult': 'linh-dong\/ult\.wav'/);
  assert.match(battle, /HonVietSfx\?\.play\(action==='ultimate'\?'linh-dong-ult':'linh-dong-atk'/);
  assert.match(battle, /window.drawLinhDongHero=drawLinhDongHero/);
  assert.doesNotMatch(battle, /new Audio\(src\)/);
  assert.doesNotMatch(battle, /sfx\/linh-dong\/atk\.ogg/);
  assert.doesNotMatch(battle, /sfx\/linh-dong\/ult\.ogg/);
  assert.equal(basic.audio.cast, 'assets/audio/sfx/linh-dong/atk.wav');
  assert.equal(skill1.audio.cast, 'assets/audio/sfx/linh-dong/atk.wav');
  assert.equal(ult.audio.cast, 'assets/audio/sfx/linh-dong/ult.wav');
  if (fs.existsSync(new URL('dist/battle.html', root))) {
    assert.doesNotMatch(read('dist/battle.html'), /sfx\/linh-dong\/atk\.ogg/);
    assert.doesNotMatch(read('dist/battle.html'), /sfx\/linh-dong\/ult\.ogg/);
    assert.match(read('dist/battle.html'), /window.drawLinhDongHero=drawLinhDongHero/);
  }
});

test('L142-T4 hurt\/fall timing matches pack; S\+ token uses campaign identityScale', () => {
  assert.equal(LINH_DONG_CLIPS.hit.ms, 42);
  assert.equal(LINH_DONG_CLIPS.fall.ms, 42);
  const battle = read('battle.html');
  const bridge = read('src/runtime/splus-battle-bridge.js');
  assert.match(battle, /hurt:\{file:"hit-atlas\.webp",frames:96,cols:8,w:480,h:440,ms:42/);
  assert.match(battle, /defeated:\{file:"fall-atlas\.webp",frames:96,cols:8,w:480,h:440,ms:42/);
  assert.match(bridge, /identityScale=\(innerWidth<600\?0\.52:0\.74\)/);
  assert.match(bridge, /context\.scale\(depthScale\*identityScale,depthScale\*identityScale\)/);
});

test('L142-T5 dist patch skips idle bob and lean on Linh Dong like Luc Anh', () => {
  const patch = read('scripts/runtime-mobile-render-sfx-v1.mjs');
  assert.match(patch, /isLucAnh\(unit\) \|\| isLinhDong\(unit\)/);
  assert.match(patch, /!isLucAnh\(unit\) && !isLinhDong\(unit\)/);
});
