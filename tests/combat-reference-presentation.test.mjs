import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  applyCombatReferencePresentation,
  calculateMobileFormation,
  createCombatUltimateFocus,
  isCombatFocusUnitVisible,
} from '../scripts/combat-reference-presentation-v1.mjs';

const battle = fs.readFileSync(new URL('../battle.html', import.meta.url), 'utf8');
const build = fs.readFileSync(new URL('../scripts/build-static.mjs', import.meta.url), 'utf8');
const linhDongRender = fs.readFileSync(new URL('../scripts/linh-dong-timing-main-v1.mjs', import.meta.url), 'utf8');
const bachDienRender = fs.readFileSync(new URL('../scripts/bach-dien-canvas-runtime-v1.mjs', import.meta.url), 'utf8');

test('portrait formation matches reference edge margins and lane spacing inside the iPhone crop', () => {
  const width = 390;
  const height = 630;
  const formation = calculateMobileFormation({ width, height });
  const scale = Math.max(width / 1600, height / 870);
  const visibleWorldWidth = width / scale;
  const visibleLeft = 800 - visibleWorldWidth / 2;
  const visibleRight = 800 + visibleWorldWidth / 2;
  for (const unit of [...formation.player, ...formation.enemy]) {
    assert.ok(unit.x > visibleLeft && unit.x < visibleRight, `x=${unit.x} should fit ${visibleLeft}..${visibleRight}`);
  }
  assert.notEqual(formation.player[0].x, formation.player[3].x);
  assert.notEqual(formation.enemy[0].x, formation.enemy[3].x);
  assert.deepEqual(formation.player.slice(0, 3).map(({ y }) => y), [340, 528, 688]);
  const outerEdgeInset = Math.max(68, visibleWorldWidth * 0.13);
  assert.ok(Math.abs(formation.player[3].x - visibleLeft - outerEdgeInset) < 0.01);
  assert.ok(Math.abs(visibleRight - formation.enemy[3].x - outerEdgeInset) < 0.01);
  const horizontalColumnGap = formation.player[0].x - formation.player[3].x;
  assert.ok(horizontalColumnGap > 100 && horizontalColumnGap < 110, `column gap=${horizontalColumnGap}`);
  const patched = applyCombatReferencePresentation(battle);
  assert.match(patched, /function mobileFormationForViewport\(\)/);
  assert.match(patched, /mobilePositions \|\| POSITIONS/);
  assert.match(patched, /innerWidth < 600 \? 0\.40 : 0\.74/);

  const upstreamCompactOwner = battle.replace(
    'const position = (innerWidth < 600 ? MOBILE_POSITIONS : POSITIONS)[hero.team][hero.slot];',
    'const battleCompactViewport = innerWidth < 600 || (innerHeight > innerWidth && innerWidth <= 1180);\n      const position = (battleCompactViewport ? MOBILE_POSITIONS : POSITIONS)[hero.team][hero.slot];',
  );
  const compactPatched = applyCombatReferencePresentation(upstreamCompactOwner);
  assert.match(compactPatched, /const mobilePositions = \(innerWidth < 600 \|\| \(innerHeight > innerWidth && innerWidth <= 1180\)\)/);
  assert.match(compactPatched, /const position = \(mobilePositions \|\| POSITIONS\)\[hero\.team\]\[hero\.slot\];/);
});


test('Linh Đồng and Bạch Diện render at the shared hero footprint', () => {
  for (const [name, source] of [
    ['Linh Đồng', linhDongRender],
    ['Bạch Diện', bachDienRender],
  ]) {
    assert.equal(
      source.split('0,0,240,220,{baseline:32').length - 1,
      2,
      name + ' main and fallback poses should use the normalized frame',
    );
  }
});

test('contact movement clamps the approach distance to avoid crowding the target', () => {
  const patched = applyCombatReferencePresentation(battle);
  assert.match(patched, /minimumStandoff: 80/);
  assert.match(patched, /Math\.max\(profile\.minimumStandoff, distance \* 0\.28\)/);
  assert.match(patched, /basicMinStandoff:84,[\s\S]*?basicDistanceRatio:\.30/);
});

test('ultimate focus renders only the caster and resolved target set', () => {
  const focus = createCombatUltimateFocus({ id: 'caster' }, [{ id: 'one' }, { id: 'two' }]);
  assert.deepEqual(focus, { actorId: 'caster', targetIds: ['one', 'two'] });
  assert.equal(isCombatFocusUnitVisible(focus, 'caster'), true);
  assert.equal(isCombatFocusUnitVisible(focus, 'two'), true);
  assert.equal(isCombatFocusUnitVisible(focus, 'unaffected'), false);
  assert.equal(isCombatFocusUnitVisible(null, 'any-unit'), true);
  assert.deepEqual(createCombatUltimateFocus({ id: 'caster' }, [{ id: 'caster' }, null, { id: 'one' }, { id: 'one' }]), {
    actorId: 'caster', targetIds: ['one'],
  });

  const patched = applyCombatReferencePresentation(battle);
  assert.match(patched, /createCombatUltimateFocus\(actor, presentationTargets\(actor, target, action\)\)/);
  assert.match(patched, /if \(!isCombatFocusUnitVisible\(state\.ultimateFocus, unit\.id\)\) return;/);
  assert.match(patched, /state\.ultimateFocus = null;[\s\S]{0,120}phase1Trace\?\.marker\('recovery'/);
  assert.match(patched, /state\.ultimateFocus = null;/);
  assert.ok(build.indexOf("await import('./battle-entry-fail-open-v1.mjs');") < build.indexOf("await import('./combat-reference-presentation-v1.mjs');"));
  assert.ok(build.indexOf("await import('./combat-reference-presentation-v1.mjs');") < build.indexOf("let embeddedIndex = readFileSync"));
});

test('presentation patch is idempotent and leaves combat resolution untouched', () => {
  const once = applyCombatReferencePresentation(battle);
  assert.equal(applyCombatReferencePresentation(once), once);
  const extractResolver = (source) => source.match(/function resolveAction\(actor, action, target\) \{[\s\S]*?\n  function [^(]+\(/)?.[0];
  const originalResolver = extractResolver(battle);
  const patchedResolver = extractResolver(once);
  assert.ok(originalResolver, 'combat resolver exists in baseline');
  assert.equal(patchedResolver, originalResolver);
});
