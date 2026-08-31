import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const battle=fs.readFileSync(new URL('../battle.html',import.meta.url),'utf8');

const ids=['ong_hang_pho','thay_mo','lac_yen','cung_thu_tre','co_dao_ganh_hoi','phong_tu','thuy_nuong_roi_nuoc','hong_lien_dao_nuong','thach_quyen','dinh_loi','luc_anh','to_diep'];

test('all 12 official heroes have an automatic talent rule',()=>{
  for(const id of ids)assert.match(battle,new RegExp(`${id}:\\{type:`),id);
});

test('Skill 1 cannot be manually selected and remains animation-backed',()=>{
  assert.match(battle,/data-action="skill" disabled hidden aria-hidden="true"/);
  assert.match(battle,/if\(action==='skill'\)return;/);
  assert.match(battle,/void performAction\(actor,'skill',talent\.target\)/);
});

test('talent activation is star-gated, conditional, free and cooldown-limited',()=>{
  assert.match(battle,/unlockStars:2, cooldownActions:3/);
  assert.match(battle,/talentSkillUnlocked\(actor\)/);
  assert.match(battle,/const cost = talentActivation \? 0 : Core\.actionCost\(action\)/);
  assert.match(battle,/talentCooldownUntil=state\.actionCount\+TALENT_SKILL_STANDARD\.cooldownActions/);
});

test('ordinary AI only chooses Basic or Ultimate unless talent trigger arms Skill 1',()=>{
  assert.match(battle,/for\(const action of \["ultimate","basic"\]\)/);
  assert.match(battle,/const talent=talentSkillIntent\(actor\);if\(talent\)return armTalentSkill/);
});
