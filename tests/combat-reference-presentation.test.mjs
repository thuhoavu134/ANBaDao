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

test('portrait formation matches the reference spread and keeps sprites readable', () => {
  const patched = applyCombatReferencePresentation(battle);
  assert.match(patched, /player:\s*\[\s*\{ x: 650, y: 340 \}, \{ x: 650, y: 520 \}, \{ x: 650, y: 700 \},\s*\{ x: 470, y: 340 \}/);
  assert.match(patched, /enemy:\s*\[\s*\{ x: 950, y: 340 \}, \{ x: 950, y: 520 \}, \{ x: 950, y: 700 \},\s*\{ x: 1130, y: 340 \}/);
  assert.match(patched, /innerWidth < 600 \? 0\.57 : 0\.74/);
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
