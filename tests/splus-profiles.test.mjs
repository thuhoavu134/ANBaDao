import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SPLUS_PROFILES, SPLUS_SKILL_ICONS, getSplusSkill } from '../src/domain/hero/splus-profiles.mjs';

test('42 authored profiles resolve all 126 skill descriptions with separate HUD/button identities',()=>{
  assert.equal(SPLUS_PROFILES.length,42);assert.equal(SPLUS_SKILL_ICONS.length,126);
  const ids=new Set();
  for(const h of SPLUS_PROFILES){assert.ok(h.voice.lobby&&h.voice.ultimate);assert.ok(h.introduction.length>30);
    for(const slot of ['passive','skill','ultimate']){const s=getSplusSkill(h.id,slot);assert.ok(s&&s.name&&s.shortName&&s.description.length>70);assert.ok(s.target&&s.effects.length);assert.equal(s.heroId,h.id);assert.equal(s.slot,slot);assert.ok(!ids.has(s.id));ids.add(s.id);const icon=SPLUS_SKILL_ICONS.find(i=>i.id===s.iconId);assert.ok(icon&&icon.prompt&&icon.description);assert.notEqual(icon.id,h.hudIconId);}
  }
  assert.equal(getSplusSkill('missing','skill'),null);assert.equal(getSplusSkill(SPLUS_PROFILES[0].id,'constructor'),null);
});
test('full skill names, owner-HP wording and new passive numbers are preserved',()=>{
  const co=getSplusSkill('hero_splus_co_trong','passive');assert.match(co.description,/10 tầng/);assert.match(co.description,/3%/);assert.match(co.description,/15%.*Cơ Trọng/);
  assert.match(getSplusSkill('hero_splus_co_trong','skill').description,/22%.*Cơ Trọng/);
  assert.equal(getSplusSkill('hero_splus_cuong_dong','ultimate').name,'Vạn Cương Bất Hoại: Kim Thần Giáng Thế');
  assert.equal(getSplusSkill('hero_splus_cuong_dong','ultimate').shortName,'Vạn Cương Bất Hoại');
  assert.match(getSplusSkill('hero_splus_tue_y','passive').description,/hồi chiêu 2 hiệp/);
  assert.match(getSplusSkill('hero_splus_to_linh','ultimate').description,/nội tại/);
});
test('skill UI keeps cooldown and rage live, and text lookup drives one popup owner',()=>{
  const code=readFileSync(new URL('../src/ui/splus-skill-details.js',import.meta.url),'utf8');
  assert.match(code,/showModal/);assert.match(code,/close/);assert.match(code,/textContent/);assert.match(code,/getSplusSkill|skills/);
  assert.match(code,/returnFocus|opener/);assert.match(code,/cooldown/);assert.match(code,/energy|rage/);
  assert.doesNotMatch(code,/setInterval|requestAnimationFrame|localStorage/);
});
