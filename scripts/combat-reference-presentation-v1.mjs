import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export function createCombatUltimateFocus(actor, targets) {
  if (!actor?.id) return null;
  const targetIds = Array.from(new Set((Array.isArray(targets) ? targets : [])
    .filter((unit) => unit?.id && unit.id !== actor.id)
    .map((unit) => String(unit.id))));
  return { actorId: String(actor.id), targetIds };
}

export function isCombatFocusUnitVisible(focus, unitId) {
  if (!focus) return true;
  const id = String(unitId ?? '');
  return id === String(focus.actorId ?? '') ||
    (Array.isArray(focus.targetIds) && focus.targetIds.some((targetId) => String(targetId) === id));
}

function replaceRequired(source, expression, replacement, label) {
  if (!expression.test(source)) throw new Error(`combat-reference-presentation missing ${label}`);
  return source.replace(expression, replacement);
}

export function applyCombatReferencePresentation(source) {
  if (source.includes('HV_REFERENCE_COMBAT_PRESENTATION_V1')) return source;
  let html = source;

  html = replaceRequired(html,
    /contact: Object\.freeze\(\{ movesToTarget: true, standoff: 96, laneOffset: 8 \}\),/,
    'contact: Object.freeze({ movesToTarget: true, standoff: 96, minimumStandoff: 80, laneOffset: 8 }),',
    'contact profile');
  html = replaceRequired(html,
    /contactCombo: Object\.freeze\(\{ movesToTarget: true, standoff: 88, laneOffset: 5 \}\),/,
    'contactCombo: Object.freeze({ movesToTarget: true, standoff: 88, minimumStandoff: 72, laneOffset: 5 }),',
    'contact combo profile');
  html = replaceRequired(html,
    /const desired = Math\.min\(profile\.standoff, distance \* 0\.18\);/,
    'const desired = Math.min(profile.standoff, Math.max(profile.minimumStandoff, distance * 0.28));',
    'bounded contact approach');
  html = replaceRequired(html,
    /basicMinStandoff:76,\s*basicStandoff:112,\s*basicDistanceRatio:\.22,/,
    'basicMinStandoff:84,\n    basicStandoff:108,\n    basicDistanceRatio:.30,',
    'Đình Lôi reference standoff');
  const helperSource = `\n  // HV_REFERENCE_COMBAT_PRESENTATION_V1\n  ${createCombatUltimateFocus.toString()}\n  ${isCombatFocusUnitVisible.toString()}\n`;
  html = replaceRequired(html,
    /(function presentationTargets\(actor, target, action\) \{[\s\S]*?\n  \})/,
    `$1${helperSource}`,
    'ultimate focus helpers');
  html = replaceRequired(html,
    /(function resetBattleState\(mode = "intro"\) \{\n    state\.battleId \+= 1;\n    state\.mode = mode;)/,
    '$1\n    state.ultimateFocus = null;',
    'battle reset focus cleanup');
  html = replaceRequired(html,
    /(const usesOngPhoUltimate = usesOngPhoGif && action === "ultimate";)/,
    '$1\n    state.ultimateFocus = action === "ultimate"\n      ? createCombatUltimateFocus(actor, presentationTargets(actor, target, action))\n      : null;',
    'ultimate focus activation');
  html = replaceRequired(html,
    /(function drawUnit\(context, unit, time\) \{)/,
    '$1\n    if (!isCombatFocusUnitVisible(state.ultimateFocus, unit.id)) return;',
    'render focus filter');
  html = replaceRequired(html,
    /(    phase1Trace\?\.marker\('recovery',\{actionId:phase1ActionId,position:\{x:actor\.x,y:actor\.y\}\}\);)/,
    '    state.ultimateFocus = null;\n$1',
    'ultimate focus recovery cleanup');
  return html;
}

const outputPath = join(process.cwd(), 'dist', 'battle.html');
if (existsSync(outputPath)) {
  const current = readFileSync(outputPath, 'utf8');
  const patched = applyCombatReferencePresentation(current);
  writeFileSync(outputPath, patched);
  console.log('Reference contact spacing and ultimate target focus applied; formation/scale remain single-owner.');
}
