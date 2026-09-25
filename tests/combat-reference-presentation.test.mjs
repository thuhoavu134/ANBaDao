import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  applyCombatReferencePresentation,
  createCombatUltimateFocus,
  isCombatFocusUnitVisible,
} from '../scripts/combat-reference-presentation-v1.mjs';

const battle = fs.readFileSync(new URL('../battle.html', import.meta.url), 'utf8');
const build = fs.readFileSync(new URL('../scripts/build-static.mjs', import.meta.url), 'utf8');
const presentationPatch = fs.readFileSync(new URL('../scripts/combat-reference-presentation-v1.mjs', import.meta.url), 'utf8');

test('reference presentation does not own portrait formation or character scale', () => {
  assert.doesNotMatch(presentationPatch, /MOBILE_POSITIONS/, 'formation belongs only to battle-formation-scale-v1');
  assert.doesNotMatch(presentationPatch, /portrait hero scale|innerWidth < 600 \? 0\.57 : 0\.74/, 'character scale belongs only to battle-formation-scale-v1');

  const patched = applyCombatReferencePresentation(battle);
  const mobileBlock = source => source.match(/  const MOBILE_POSITIONS = Object\.freeze\(\{[\s\S]*?\n  \}\);/)?.[0];
  assert.equal(mobileBlock(patched), mobileBlock(battle), 'reference presentation must preserve the baseline formation block');
  assert.equal(
    (patched.match(/innerWidth < 600 \? 0\.52 : 0\.74/g) || []).length,
    (battle.match(/innerWidth < 600 \? 0\.52 : 0\.74/g) || []).length,
    'reference presentation must preserve baseline portrait scale literals'
  );
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
