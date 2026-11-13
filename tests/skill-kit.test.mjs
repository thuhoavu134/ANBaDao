import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import {
  HERO_SKILL_KIT_VERSION,
  HERO_SKILL_KIT_REGISTRY,
  getHeroSkillKit,
  resolveSkillProgression,
  validateHeroSkillKit
} from '../src/domain/hero/skill-kit.mjs';
import {
  EQUIPMENT_ASSET_REGISTRY,
  EQUIPMENT_ASSET_VERSION,
  FORGE_MATERIAL_ASSETS,
  getEquipmentAsset,
  validateEquipmentAssetRegistry
} from '../src/domain/equipment/item-assets.mjs';

test('Ông Phở kit v2 has exactly Basic, Ultimate and a bounded passive', () => {
  const kit = getHeroSkillKit('ong_hang_pho');
  assert.equal(validateHeroSkillKit(kit).ok, true);
  assert.equal(kit.kitVersion, HERO_SKILL_KIT_VERSION);
  assert.deepEqual(Object.keys(kit.actions), ['basic', 'ultimate']);
  assert.equal(kit.basicId, kit.actions.basic.id);
  assert.equal(kit.ultimateId, kit.actions.ultimate.id);
  assert.equal(kit.passives[0].limit.maxStacks, 3);
  assert.equal(kit.legacySkillMap.skill1, kit.basicId);
});

test('legacy Skill 1 investment maps into Basic without losing the source levels', () => {
  const resolved = resolveSkillProgression('ong_hang_pho', {
    skillLevels: { basic: 2, skill: 4, ultimate: 3 }
  });
  assert.equal(resolved.kitVersion, HERO_SKILL_KIT_VERSION);
  assert.equal(resolved.mapped, true);
  assert.deepEqual(resolved.skillLevels, { basic: 4, skill: 4, ultimate: 3 });
  assert.deepEqual(resolved.legacySkillLevels, { basic: 2, skill: 4, ultimate: 3 });
  assert.equal(resolved.mapping.skill, 'ong_hang_pho.basic.thiet-va');
});

test('unknown heroes remain legacy and retain all three saved levels', () => {
  const resolved = resolveSkillProgression('not_a_hero', {
    skillLevels: { basic: 2, skill: 4, ultimate: 3 }
  });
  assert.equal(resolved.kitVersion, 'legacy-v1');
  assert.equal(resolved.mapped, false);
  assert.deepEqual(resolved.skillLevels, { basic: 2, skill: 4, ultimate: 3 });
});

test('Lục Ảnh kit uses existing Basic/Ultimate assets and keeps six effigies legacy', () => {
  const kit = getHeroSkillKit('luc_anh');
  assert.equal(validateHeroSkillKit(kit).ok, true);
  assert.equal(kit.actions.basic.animation, 'luc-anh.basic');
  assert.equal(kit.actions.ultimate.vfx, 'luc-anh.ultimate-poison-cloud');
  assert.equal(kit.passives[0].limit.maxStacks, 3);
  assert.equal(kit.legacyAssets.skill1.id, 'luc_anh.legacy.skill1.six-effigies');
  assert.equal(kit.legacyAssets.skill1.status, 'preserved-legacy-asset');
});

test('L35-T1 registry covers the live 12 plus Linh Đồng and freezes Ông Phở + Lục Ảnh', () => {
  const ids = ['ong_hang_pho', 'luc_anh', 'thay_mo', 'lac_yen', 'cung_thu_tre', 'co_dao_ganh_hoi', 'phong_tu', 'thuy_nuong_roi_nuoc', 'hong_lien_dao_nuong', 'thach_quyen', 'dinh_loi', 'to_diep', 'linh_dong', 'bach_dien'];
  assert.deepEqual(Object.keys(HERO_SKILL_KIT_REGISTRY).sort(), [...ids].sort());
  assert.equal(getHeroSkillKit('ong_hang_pho').basicId, 'ong_hang_pho.basic.thiet-va');
  assert.equal(getHeroSkillKit('luc_anh').ultimateId, 'luc_anh.ultimate.doc-van-phu-the');
  assert.equal(getHeroSkillKit('not_a_hero'), null);
  const invalid = { ...getHeroSkillKit('ong_hang_pho'), actions: { basic: getHeroSkillKit('ong_hang_pho').actions.basic } };
  assert.equal(validateHeroSkillKit(invalid).ok, false);
});

test('L35-T2/T3 every official kit has basic, ultimate, passive and legacySkillMap', () => {
  const ids = ['ong_hang_pho', 'luc_anh', 'thay_mo', 'lac_yen', 'cung_thu_tre', 'co_dao_ganh_hoi', 'phong_tu', 'thuy_nuong_roi_nuoc', 'hong_lien_dao_nuong', 'thach_quyen', 'dinh_loi', 'to_diep', 'linh_dong', 'bach_dien'];
  for (const id of ids) {
    const kit = getHeroSkillKit(id);
    assert.notEqual(kit, null, id);
    assert.equal(validateHeroSkillKit(kit).ok, true, id);
    assert.ok(kit.actions.basic && kit.actions.ultimate);
    assert.ok(kit.passives.length >= 1);
    assert.equal(kit.legacySkillMap.skill1, kit.basicId);
    assert.equal(kit.legacySkillMap.ultimate, kit.ultimateId);
  }
});

test('Rèn Binh asset registry covers every item model and material deterministically', () => {
  assert.equal(validateEquipmentAssetRegistry().ok, true);
  assert.equal(EQUIPMENT_ASSET_VERSION, 'e11-imagen-v1');
  for (const slot of ['weapon', 'armor', 'charm', 'boots']) {
    for (const rarity of ['b', 'a', 's', 'ss', 'ssr']) {
      const entry = getEquipmentAsset(slot, rarity);
      assert.equal(entry.slot, slot);
      assert.equal(entry.rarity, rarity);
      assert.equal(entry.status, 'integrated');
      assert.ok(entry.path.endsWith(`${slot}-${rarity}.png`));
      assert.equal(existsSync(new URL('../' + entry.path, import.meta.url)), true);
      assert.ok(statSync(new URL('../' + entry.path, import.meta.url)).size > 1000);
    }
  }
  for (const material of Object.values(FORGE_MATERIAL_ASSETS)) {
    assert.equal(material.status, 'integrated');
    assert.equal(existsSync(new URL('../' + material.path, import.meta.url)), true);
  }
  assert.deepEqual(Object.keys(EQUIPMENT_ASSET_REGISTRY), ['weapon', 'armor', 'charm', 'boots']);
});

test('hero detail background and skill kit runtime are shipped together', () => {
  const sourceIndex = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const sourceCss = readFileSync(new URL('../src/ui/hero-detail-tabs.css', import.meta.url), 'utf8');
  const builtIndex = readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8');
  const builtBattle = readFileSync(new URL('../dist/battle.html', import.meta.url), 'utf8');
  const builtForgeAssets = readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8');
  const sourceAsset = new URL('../assets/ui/hero-detail/ong-pho-showcase-bg.png', import.meta.url);
  const builtAsset = new URL('../dist/assets/ui/hero-detail/ong-pho-showcase-bg.png', import.meta.url);
  const lucSourceAsset = new URL('../assets/ui/hero-detail/luc-anh-showcase-bg.png', import.meta.url);
  const lucBuiltAsset = new URL('../dist/assets/ui/hero-detail/luc-anh-showcase-bg.png', import.meta.url);
  const thaySourceAsset = new URL('../assets/ui/hero-detail/thay-mo-showcase-bg.png', import.meta.url);
  const thayBuiltAsset = new URL('../dist/assets/ui/hero-detail/thay-mo-showcase-bg.png', import.meta.url);
  const linhSourceAsset = new URL('../assets/ui/hero-detail/linh-dong-showcase-bg.jpg', import.meta.url);
  const linhBuiltAsset = new URL('../dist/assets/ui/hero-detail/linh-dong-showcase-bg.jpg', import.meta.url);

  assert.match(sourceIndex, /detailBackground:'assets\/ui\/hero-detail\/ong-pho-showcase-bg\.png'/);
  assert.match(sourceIndex, /detailBackground:'assets\/ui\/hero-detail\/luc-anh-showcase-bg\.png'/);
  assert.match(sourceIndex, /detailBackground:'assets\/ui\/hero-detail\/thay-mo-showcase-bg\.png'/);
  assert.match(sourceIndex, /detailBackground:'assets\/ui\/hero-detail\/linh-dong-showcase-bg\.jpg'/);
  assert.match(sourceIndex, /hv-depth-bg/);
  assert.match(sourceCss, /hvShowcaseLight/);
  assert.match(sourceCss, /prefers-reduced-motion:reduce/);
  assert.match(builtIndex, /id="hero-skill-kit-runtime-v1"/);
  assert.match(builtBattle, /HON_VIET_SKILL_KIT_VERSION/);
  assert.match(builtForgeAssets, /id="forge-item-assets-v1"/);
  assert.match(builtForgeAssets, /data-forge-reveal/);
  assert.match(builtForgeAssets, /assets\/items\/materials\/tinh-luc\.png/);
  assert.equal(existsSync(sourceAsset), true);
  assert.equal(existsSync(builtAsset), true);
  assert.equal(existsSync(lucSourceAsset), true);
  assert.equal(existsSync(lucBuiltAsset), true);
  assert.equal(existsSync(thaySourceAsset), true);
  assert.equal(existsSync(thayBuiltAsset), true);
  assert.equal(existsSync(linhSourceAsset), true);
  assert.equal(existsSync(linhBuiltAsset), true);
  assert.ok(statSync(builtAsset).size > 1000);
  assert.ok(statSync(lucBuiltAsset).size > 1000);
  assert.ok(statSync(thayBuiltAsset).size > 1000);
});
