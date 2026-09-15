import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { LINH_DONG_CLIPS, LINH_DONG_CHAR, LINH_DONG_VFX, isLinhDongId } from '../src/domain/character/linh-dong.mjs';
import { getSplusHero } from '../src/domain/hero/splus-catalog.mjs';
import { SPLUS_REVIEW_DEFAULTS } from '../src/domain/hero/splus-catalog.mjs';

const root = new URL('../', import.meta.url);
const read = rel => fs.readFileSync(new URL(rel, root), 'utf8');
const exists = rel => fs.existsSync(new URL(rel, root));

const requiredAtlases = [
  'assets/characters/linh-dong/idle-atlas.webp',
  'assets/characters/linh-dong/run-atlas.webp',
  'assets/characters/linh-dong/hit-atlas.webp',
  'assets/characters/linh-dong/fall-atlas.webp',
  'assets/characters/linh-dong/basic-atlas.webp',
  'assets/characters/linh-dong/ultimate-atlas.webp',
  'assets/characters/linh-dong/skill1_vfx-atlas.webp',
  'assets/characters/linh-dong/ultimate_vfx-atlas.webp',
  'assets/characters/linh-dong/avatar.webp',
  'assets/characters/linh-dong/card.webp',
  'assets/characters/linh-dong/master.webp',
  'assets/audio/sfx/linh-dong/atk.ogg',
  'assets/audio/sfx/linh-dong/atk.wav',
  'assets/audio/sfx/linh-dong/ult.ogg',
  'assets/audio/sfx/linh-dong/ult.wav'
];

test('L139-T1 Linh Dong authored atlases, portraits and SFX exist', () => {
  for (const rel of requiredAtlases) assert.ok(exists(rel), rel);
});

test('L139-T2 CHARACTER_MANIFEST binds Linh Dong art; TKT-0141 opens roster identity', () => {
  const index = read('index.html');
  assert.match(index, /linh_dong:\{slug:'linh-dong'/);
  assert.match(index, /assets\/characters\/linh-dong\/avatar\.webp/);
  assert.match(index, /assets\/characters\/linh-dong\/card\.webp/);
  assert.match(index, /OFFICIAL_ROSTER_12_IDS=Object\.freeze\(\[/);
  assert.match(index, /OFFICIAL_ROSTER_12_IDS=Object\.freeze\(\[[^\]]*linh_dong/);
});

test('L139-T3 battle runtime draws Linh Dong atlas and S+ token delegates', () => {
  const battle = read('battle.html');
  const bridge = read('src/runtime/splus-battle-bridge.js');
  assert.match(battle, /function isLinhDong\(/);
  assert.match(battle, /function drawLinhDongHero\(/);
  assert.match(battle, /function drawLinhDongFx\(/);
  assert.match(battle, /function startLinhDongFx\(/);
  assert.match(battle, /LINH_DONG_ASSET_BASE="assets\/characters\/linh-dong\/"/);
  assert.match(battle, /idle:\{file:"idle-atlas\.webp"/);
  assert.match(battle, /drawOngPhoGifHero[\s\S]*drawLinhDongHero/);
  assert.match(bridge, /isLinhDong\(unit\)/);
  assert.match(bridge, /drawLinhDongHero\(context,unit,time\)/);
  assert.match(bridge, /emitLinhDongRelease\(/);
  assert.match(bridge, /waitLinhDongMarker\(/);
  const encyclopedia = read('src/ui/splus-encyclopedia.js');
  assert.match(encyclopedia, /h\.art\?\.portrait/);
  assert.match(encyclopedia, /img\.src=h\.art\.portrait/);
  assert.doesNotMatch(bridge, /S\+ · Đang thử cơ chế.*linh/);
});

test('L139-T4 skill manifests register isolated ATK and ULT passes', () => {
  const basic = JSON.parse(read('assets/characters/linh-dong/basic/skill.json'));
  const skill1 = JSON.parse(read('assets/characters/linh-dong/skill1/skill.json'));
  const ult = JSON.parse(read('assets/characters/linh-dong/ultimate/skill.json'));
  assert.equal(basic.schema, 'hon-viet-skill/v1');
  assert.equal(basic.id, 'linh-dong.basic');
  assert.equal(basic.heroId, 'linh-dong');
  assert.equal(skill1.id, 'linh-dong.skill1');
  assert.equal(ult.id, 'linh-dong.ultimate');
  assert.equal(basic.audio.cast, 'assets/audio/sfx/linh-dong/atk.wav');
  assert.equal(ult.audio.cast, 'assets/audio/sfx/linh-dong/ult.wav');
  const vfx = JSON.parse(read('assets/characters/linh-dong/ultimate/vfx/frames.json'));
  assert.equal(vfx.schema, 'hon-viet-vfx-atlas/v1');
  assert.equal(vfx.layout.cellWidth, LINH_DONG_VFX.cellW);
  assert.equal(vfx.layout.cellHeight, LINH_DONG_VFX.cellH);
  assert.equal(vfx.layout.frameCount, LINH_DONG_CLIPS.ultimateVfx.frames);
});

test('L139-T5 catalog art is authored; combat numbers stay frozen', () => {
  const hero = getSplusHero('hero_splus_linh_dong');
  assert.equal(hero.key, 'linh_dong');
  assert.equal(hero.art.status, 'authored-rgba-v1');
  assert.equal(hero.art.portrait, 'assets/characters/linh-dong/avatar.webp');
  assert.equal(hero.art.atlas, 'assets/characters/linh-dong/idle-atlas.webp');
  const mechanics = read('src/domain/combat/splus-mechanics.mjs');
  assert.match(mechanics, /case 'linh_dong':D\(opp\);B\(opp,'confusion',0,1,\{chance:rules\(actor,action\)\.confusionChance\}\);return;/);
  assert.match(mechanics, /case 'linh_dong':D\(all\);B\(all,'silence',0,1\);return;/);
  assert.match(mechanics, /healDown',\.2/);
  assert.equal(SPLUS_REVIEW_DEFAULTS.skillCost, 25);
  assert.equal(SPLUS_REVIEW_DEFAULTS.ultimateCost, 60);
  const soul = read('src/domain/hero/splus-profiles/soul.mjs');
  assert.match(soul, /confusionChance:\.5/);
});

test('L139-T6 uniform cells, RGBA pack contract, BETS frozen', () => {
  assert.equal(LINH_DONG_CHAR.cellW, 480);
  assert.equal(LINH_DONG_CHAR.cellH, 440);
  assert.equal(LINH_DONG_CHAR.scale, 1);
  assert.equal(LINH_DONG_VFX.cellW, 440);
  assert.equal(LINH_DONG_VFX.cellH, 248);
  assert.equal(LINH_DONG_CLIPS.idle.frames, 96);
  assert.equal(LINH_DONG_CLIPS.attack.frames, 44);
  assert.equal(LINH_DONG_CLIPS.ultimate.frames, 60);
  assert.equal(LINH_DONG_CLIPS.skill1Vfx.frames, 120);
  assert.ok(isLinhDongId('hero_splus_linh_dong'));
  assert.ok(isLinhDongId('linh_dong'));
  assert.equal(isLinhDongId('luc_anh'), false);
  const meta = JSON.parse(read('assets/characters/linh-dong/runtime-meta.json'));
  assert.equal(meta.perFrameCrop, false);
  assert.equal(meta.blackKeyForbidden, true);
  assert.equal(meta.encoding, 'webp-lossless-rgba');
  const ui = read('src/ui/bach-bao-ruong-runtime.js');
  assert.match(ui, /const BETS = \[2, 10, 50\]/);
  assert.doesNotMatch(ui, /document\.addEventListener\(['"](?:click|pointerdown)/);
});
