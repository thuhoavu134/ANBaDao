import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as scale from '../scripts/battle-formation-scale-v1.mjs';

test('temporary arena IDs use the same canonical hero correction as the renderer', () => {
  for (const id of ['linh_dong', 'linh-dong', 'hero_splus_linh_dong', 'bach_dien']) {
    const unit = { sourceId: 'arena-enemy-0', sourceHeroId: id, id: 'enemy-0' };
    assert.equal(scale.heroVisualScale(unit), scale.heroVisualScale(id));
    assert.equal(scale.battleCharacterHorizontalScaleForViewport(unit, 390, 739), scale.battleCharacterHorizontalScaleForViewport(id, 390, 739));
    assert.equal(scale.battleCharacterVisualOffsetXForViewport(unit, 'enemy', 390, 739), scale.battleCharacterVisualOffsetXForViewport(id, 'enemy', 390, 739));
  }
});

test('approach, attack, ultimate and recovery retain the actor home depth scale', () => {
  assert.equal(typeof scale.battleCharacterDepthScale, 'function');
  for (const baseY of [340, 520, 700]) {
    const unit = { baseY, y: baseY, state: 'idle' };
    const idle = scale.battleCharacterDepthScale(unit);
    for (const [state, y] of [['run', 600], ['attack', 340], ['ultimate', 520], ['idle', baseY]]) {
      assert.equal(scale.battleCharacterDepthScale({ ...unit, state, y }), idle);
    }
  }
});

test('built regular and S+ render paths share scale, offsets and one enemy mirror', () => {
  const battle = fs.readFileSync('battle.html', 'utf8');
  const bridge = fs.readFileSync('src/runtime/splus-battle-bridge.js', 'utf8');
  const patched = scale.applyBattleFormationScale(battle + '\n' + bridge);
  assert.doesNotMatch(patched, /0\.83\s*\+\s*\(unit\.y\s*-\s*290\)\s*\/\s*1500/);
  const drawSplus = patched.slice(patched.indexOf('function drawSplusToken('));
  assert.equal((drawSplus.match(/battleCharacterDepthScale\(unit\)/g) || []).length, 2);
  assert.equal((drawSplus.match(/battleCharacterHorizontalScale\(unit\)/g) || []).length, 2);
  assert.equal((drawSplus.match(/battleCharacterVisualOffsetX\(unit\)/g) || []).length, 2);
  // Authored drawLinhDongHero/drawBachDienHero own their enemy flip.
  assert.doesNotMatch(drawSplus, /if\(unit\.team===TEAM_ENEMY\)context\.scale\(-1,1\)/);

  // Execute the injected helper code, not just the module exports.
  const start = patched.indexOf('const PORTRAIT_FORMATION=');
  const end = patched.indexOf('/* hv-battle-scale-helpers-end */', start);
  assert.ok(start > 0 && end > start);
  const context = { WORLD: scale.BATTLE_WORLD, POSITIONS: scale.DESKTOP_FORMATION,
    dom: { viewport: { getBoundingClientRect: () => ({ width: 390, height: 739 }) } }, innerWidth: 390, innerHeight: 844 };
  vm.createContext(context);
  // Functions between MOBILE_POSITIONS and the next original runtime declaration.
  const block = patched.slice(start, end);
  vm.runInContext(block, context);
  assert.equal(context.battleCharacterScale({ sourceId: 'arena-0', sourceHeroId: 'linh_dong' }), scale.BATTLE_CHARACTER_SCALE.portrait * (310 / 335));
});


 test('body centers include the same compact horizontal translation as the rendered hero',()=>{
  const unit={sourceId:'linh_dong',x:730,y:520,baseY:520,team:'player'};
  assert.equal(scale.battleCharacterBodyForViewport(unit,390,739).centerX,734.25);
  assert.equal(scale.battleCharacterBodyForViewport({...unit,team:'enemy'},390,739).centerX,725.75);
 });
