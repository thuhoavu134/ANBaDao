import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { LINH_DONG_CHAR, LINH_DONG_FIELD, LINH_DONG_CLIPS, LINH_DONG_VFX } from '../src/domain/character/linh-dong.mjs';

const root = new URL('../', import.meta.url);
const read = rel => fs.readFileSync(new URL(rel, root), 'utf8');
const bytes = rel => fs.readFileSync(new URL(rel, root));
const sha = rel => createHash('sha256').update(bytes(rel)).digest('hex');
const OLD_IDLE_SHA = 'c4137fb31e0aad0128d0b5ac1df23ce5ffcaf8c9e5674e4bfa83a74bd9930a44';

test('L143-T1 Blender native-size clips pack into 480×440 runtime cells', () => {
  assert.equal(LINH_DONG_CHAR.scale, 1);
  assert.equal(LINH_DONG_CHAR.maxSourceW, 960);
  assert.equal(LINH_DONG_CHAR.maxSourceH, 880);
  assert.equal(LINH_DONG_CHAR.cellW, 480);
  assert.equal(LINH_DONG_CHAR.cellH, 440);
  assert.equal(LINH_DONG_CHAR.foot, 'bottom-center');
  assert.equal(LINH_DONG_CLIPS.idle.sourceW, 960);
  assert.equal(LINH_DONG_CLIPS.idle.sourceH, 880);
  assert.equal(LINH_DONG_CLIPS.run.sourceW, 960);
  assert.equal(LINH_DONG_CLIPS.hit.sourceW, 960);
  assert.equal(LINH_DONG_CLIPS.fall.sourceW, 960);
  assert.equal(LINH_DONG_CLIPS.attack.sourceW, 960);
  assert.equal(LINH_DONG_CLIPS.attack.sourceH, 880);
  assert.equal(LINH_DONG_CLIPS.ultimate.sourceW, 960);
  assert.equal(LINH_DONG_CLIPS.ultimate.sourceH, 880);
  assert.equal(LINH_DONG_VFX.sourceW, 1174);
  assert.equal(LINH_DONG_VFX.sourceH, 662);
  assert.equal(LINH_DONG_CLIPS.idle.frames, 96);
  assert.equal(LINH_DONG_CLIPS.attack.frames, 44);
  assert.equal(LINH_DONG_CLIPS.ultimate.frames, 60);
  assert.equal(LINH_DONG_CLIPS.skill1Vfx.frames, 120);
});

test('L143-T2 atlases are blender-rekeyed; idle sha leaves ffmpeg colorkey pack', () => {
  const meta = JSON.parse(read('assets/characters/linh-dong/runtime-meta.json'));
  assert.match(meta.source, /blender/i);
  assert.equal(meta.perFrameCrop, false);
  assert.equal(meta.blackKeyForbidden, true);
  assert.equal(meta.char.cellW, 480);
  assert.equal(meta.packed[0].file, 'idle-atlas.webp');
  assert.equal(meta.packed[0].cellW, 480);
  assert.notEqual(sha('assets/characters/linh-dong/idle-atlas.webp'), OLD_IDLE_SHA);
  assert.notEqual(meta.packed[0].sha256, OLD_IDLE_SHA);
  assert.ok(fs.existsSync(new URL('assets/characters/linh-dong/avatar.webp', root)));
  assert.ok(fs.existsSync(new URL('assets/audio/sfx/linh-dong/atk.wav', root)));
  const asset = read('assets/characters/linh-dong/ASSET.md');
  assert.match(asset, /Blender/i);
});

test('L143-T3 battle draw uses 477×440; VFX source-over; SFX wav', () => {
  assert.equal(LINH_DONG_FIELD.drawW, 477);
  assert.equal(LINH_DONG_FIELD.drawH, 440);
  assert.equal(LINH_DONG_FIELD.baseline, 64);
  const battle = read('battle.html');
  assert.match(battle, /w:480,h:440/);
  assert.match(battle, /w:440,h:248/);
  assert.match(battle, /drawLinhDongAtlas\(context,key,frame,0,0,477,440,\{baseline:64\}\)/);
  assert.match(battle, /blend:"source-over"/);
  assert.match(battle, /HonVietSfx\?\.play\(action==='ultimate'\?'linh-dong-ult':'linh-dong-atk'/);
  const sfx = read('src/ui/audio-sfx-runtime.js');
  assert.match(sfx, /'linh-dong-atk': 'linh-dong\/atk\.wav'/);
  const ui = read('src/ui/bach-bao-ruong-runtime.js');
  assert.match(ui, /const BETS = \[2, 10, 50\]/);
});

test('L143-T4 hero-detail high-resolution atlas uses 480×440 cells', () => {
  const index = read('index.html');
  assert.match(index, /idle:\{src:'assets\/characters\/linh-dong\/idle-atlas\.webp',frames:96,cols:8,w:480,h:440,ms:42,loop:true\}/);
  assert.match(index, /ultimate:\{src:'assets\/characters\/linh-dong\/ultimate-atlas\.webp',frames:60,cols:8,w:480,h:440,ms:33\}/);
});
