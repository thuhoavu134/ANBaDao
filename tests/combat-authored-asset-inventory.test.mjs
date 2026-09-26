import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const exists = path => existsSync(new URL(path, root));
const read = path => readFileSync(new URL(path, root), 'utf8');

const authoredManifestHeroes = ['luc-anh','dinh-loi','thay-mo','linh-dong','bach-dien'];
const actions = ['basic','skill1','ultimate'];

test('combat authored inventory is explicit: 15 manifests across five heroes', () => {
  const manifests = [];
  for (const hero of authoredManifestHeroes) for (const action of actions) {
    const path = `assets/characters/${hero}/${action}/skill.json`;
    assert.ok(exists(path), path);
    const json = JSON.parse(read(path));
    assert.equal(json.schema, 'hon-viet-skill/v1', path);
    assert.equal(json.heroId, hero, path);
    manifests.push(path);
  }
  assert.equal(manifests.length, 15);
  const found=[];
  const visit=path=>{
    for(const e of readdirSync(new URL(path,root),{withFileTypes:true})){
      const child=path+e.name;
      if(e.isDirectory())visit(child+'/');
      else if(e.name==='skill.json'&&JSON.parse(read(child)).schema==='hon-viet-skill/v1')found.push(child);
    }
  };
  visit('assets/');
  assert.deepEqual(found.sort(),manifests.sort(),'new authored packs require inventory and runtime review');
});

test('all authored production VFX/animation packs physically exist', () => {
  const required = [
    // Lục Ảnh
    'assets/characters/luc-anh/idle-atlas.webp',
    'assets/characters/luc-anh/run-atlas.webp',
    'assets/characters/luc-anh/hit-atlas.webp',
    'assets/characters/luc-anh/fall-atlas.webp',
    'assets/characters/luc-anh/basic-atlas.webp',
    'assets/characters/luc-anh/basic_projectile-atlas.webp',
    'assets/characters/luc-anh/basic_impact-atlas.webp',
    'assets/characters/luc-anh/skill1-atlas.webp',
    'assets/characters/luc-anh/skill1_vfx-atlas.webp',
    'assets/characters/luc-anh/ultimate-atlas.webp',
    'assets/characters/luc-anh/ultimate_vfx-atlas.webp',
    // Đình Lôi
    'assets/characters/dinh-loi/idle-atlas.png',
    'assets/characters/dinh-loi/run-atlas.png',
    'assets/characters/dinh-loi/hit-atlas.png',
    'assets/characters/dinh-loi/fall-atlas.png',
    'assets/characters/dinh-loi/basic-cast-atlas.png',
    'assets/characters/dinh-loi/basic-projectile-atlas.png',
    'assets/characters/dinh-loi/basic-impact-atlas.png',
    'assets/characters/dinh-loi/skill1-cast-atlas.png',
    'assets/characters/dinh-loi/skill1-wave-atlas.png',
    'assets/characters/dinh-loi/skill1-impact-atlas.png',
    'assets/characters/dinh-loi/skill1-shield-atlas.png',
    'assets/characters/dinh-loi/ultimate-cast-atlas.png',
    'assets/characters/dinh-loi/ultimate-vfx-atlas.png',
    'assets/characters/dinh-loi/ultimate-impact-atlas.png',
    // Thầy Mo
    'assets/characters/thay-mo/idle-v3193-atlas.png',
    'assets/characters/thay-mo/hit-v3218-atlas.png',
    'assets/characters/thay-mo/basic-cast-v3198-atlas.png',
    'assets/characters/thay-mo/projectile-v3201-atlas.png',
    'assets/characters/thay-mo/impact-v3200-atlas.png',
    'assets/characters/thay-mo/skill1-cast-v3204-atlas.png',
    'assets/characters/thay-mo/skill1-wave-v3205-atlas.png',
    'assets/characters/thay-mo/skill1-impact-v3206-atlas.png',
    'assets/characters/thay-mo/ultimate-cast-v3210-atlas.png',
    'assets/characters/thay-mo/ultimate-vfx-v3212-atlas.png',
    // Linh Đồng
    'assets/characters/linh-dong/idle-atlas.webp',
    'assets/characters/linh-dong/run-atlas.webp',
    'assets/characters/linh-dong/hit-atlas.webp',
    'assets/characters/linh-dong/fall-atlas.webp',
    'assets/characters/linh-dong/basic-atlas.webp',
    'assets/characters/linh-dong/skill1_vfx-atlas.webp',
    'assets/characters/linh-dong/ultimate-atlas.webp',
    'assets/characters/linh-dong/ultimate_vfx-atlas.webp',
    // Bạch Diện
    'assets/characters/bach-dien/idle-atlas.webp',
    'assets/characters/bach-dien/run-atlas.webp',
    'assets/characters/bach-dien/hit-atlas.webp',
    'assets/characters/bach-dien/fall-atlas.webp',
    'assets/characters/bach-dien/basic-atlas.webp',
    'assets/characters/bach-dien/skill1_vfx-atlas.webp',
    'assets/characters/bach-dien/ultimate-atlas.webp',
    'assets/characters/bach-dien/ultimate_vfx-atlas.webp',
    // Ông Phở legacy authored owner
    'assets/characters/ong-pho/ultimate-sheet-64-alpha-clean-v310.png',
    ...[11,12,13,14,15].map(n=>`assets/battle-runtime/embedded-${n}.png`)
  ];
  for (const path of required) assert.ok(exists(path), path);
});

test('real combat audio inventory is not confused with design-only SFX ids', () => {
  for (const path of [
    'assets/audio/sfx/201800_se_atk.wav',
    'assets/audio/sfx/201800_se_s1.wav',
    'assets/audio/sfx/201800_se_s2.wav',
    'assets/audio/sfx/linh-dong/atk.wav',
    'assets/audio/sfx/linh-dong/ult.wav',
    'assets/audio/sfx/bach-dien/atk.wav',
    'assets/audio/sfx/bach-dien/ult.wav',
    'assets/audio/voice-luc-anh-ultimate.mp3'
  ]) assert.ok(exists(path), path);

  const audio = read('src/ui/audio-sfx-runtime.js');
  assert.match(audio, /'linh-dong-atk': 'linh-dong\/atk\.wav'/);
  assert.match(audio, /'bach-dien-ult': 'bach-dien\/ult\.wav'/);
  const kits = read('src/domain/hero/skill-kit.mjs');
  assert.match(kits, /id: 'ong-pho\.hammer-keng',[\s\S]*status: 'needs-user-created'/);
  assert.match(kits, /id: 'luc-anh\.ultimate-voice-impact',[\s\S]*status: 'needs-user-created'/);
});

test('eight remaining official identities have no authored skill manifest pack to restore', () => {
  const genericOnly = [
    'lac-yen','cung-thu-tre','co-dao-ganh-hoi','phong-tu',
    'thuy-nuong-roi-nuoc','hong-lien-dao-nuong','thach-quyen','to-diep'
  ];
  for (const hero of genericOnly) for (const action of actions) {
    assert.equal(exists(`assets/characters/${hero}/${action}/skill.json`), false, `${hero}/${action} unexpectedly became authored; update inventory and runtime owner`);
  }
});

test('Thầy Mo authored production owner is applied after final battle rewrite owners', () => {
  const build = read('scripts/build-static.mjs');
  const formation = build.indexOf("await import('./battle-formation-scale-v1.mjs');");
  const authored = build.indexOf("await import('./thay-mo-authored-production-v1.mjs');");
  const embed = build.indexOf('let embeddedIndex = readFileSync');
  assert.ok(formation >= 0 && authored > formation && embed > authored);

  const patch = read('scripts/thay-mo-authored-production-v1.mjs');
  for (const token of [
    'THAY_MO_AUTHORED_PRODUCTION_V1',
    'THAY_MO_SKILL1_CAST_IMAGE()',
    'THAY_MO_SKILL1_WAVE_IMAGE()',
    'THAY_MO_SKILL1_IMPACT_IMAGE()',
    'THAY_MO_ULTIMATE_CAST_IMAGE()',
    'THAY_MO_ULTIMATE_VFX_IMAGE()',
    'drawThayMoAuthoredFx(ctx,time)',
    'THAY_MO_PRODUCTION_ANCHOR:impact-owner:',
    "if(!usesThayMoAuthored && "
  ]) assert.ok(patch.includes(token), token);
});
