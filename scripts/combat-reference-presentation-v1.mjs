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

export function calculateMobileFormation({ width, height, worldWidth = 1600, worldHeight = 870 }) {
  const safeWidth = Math.max(1, Number(width) || 1);
  const safeHeight = Math.max(1, Number(height) || 1);
  const scale = Math.max(safeWidth / worldWidth, safeHeight / worldHeight);
  const visibleWorldWidth = Math.min(worldWidth, safeWidth / scale);
  // The reference keeps the outer columns near the screen edges and leaves a\n  // wider lane between front and rear heroes. Express the edge inset as a\n  // world-space margin so it remains stable across portrait viewport sizes.\n  const rearOffset = Math.max(0, visibleWorldWidth / 2 - Math.max(68, visibleWorldWidth * 0.13));
  const frontOffset = Math.min(92, rearOffset * 0.55);
  const center = worldWidth / 2;
  const lanes = [340, 528, 688];
  return {
    player: [
      ...lanes.map((y) => ({ x: center - frontOffset, y })),
      ...lanes.map((y) => ({ x: center - rearOffset, y })),
    ],
    enemy: [
      ...lanes.map((y) => ({ x: center + frontOffset, y })),
      ...lanes.map((y) => ({ x: center + rearOffset, y })),
    ],
  };
}

function replaceRequired(source, expression, replacement, label) {
  if (!expression.test(source)) throw new Error(`combat-reference-presentation missing ${label}`);
  return source.replace(expression, replacement);
}

export function applyCombatReferencePresentation(source) {
  if (source.includes('HV_REFERENCE_COMBAT_PRESENTATION_V1')) return source;
  let html = source;

  html = replaceRequired(html,
    /  const MOBILE_POSITIONS = Object\.freeze\(\{[\s\S]*?\n  \}\);/,
    `  // Fit both mobile columns inside the portrait camera's actual world-space crop.\n  const calculateMobileFormation = ${calculateMobileFormation.toString()};\n  function mobileFormationForViewport() {\n    const rect = dom.viewport.getBoundingClientRect();\n    return calculateMobileFormation({ width: rect.width || innerWidth, height: rect.height || innerHeight });\n  }`,
    'portrait formation');
  html = replaceRequired(html,
    /(function createUnits\(\) \{\n    const synergies=currentTeamSynergies\(\);)/,
    '$1\n    const mobilePositions = (innerWidth < 600 || (innerHeight > innerWidth && innerWidth <= 1180)) ? mobileFormationForViewport() : null;',
    'viewport-aware formation selection');
  html = replaceRequired(html,
    /(?:const position = \(innerWidth < 600 \? MOBILE_POSITIONS : POSITIONS\)\[hero\.team\]\[hero\.slot\];|const battleCompactViewport = innerWidth < 600 \|\| \(innerHeight > innerWidth && innerWidth <= 1180\);\s*const position = \(battleCompactViewport \? MOBILE_POSITIONS : POSITIONS\)\[hero\.team\]\[hero\.slot\];)/,
    'const position = (mobilePositions || POSITIONS)[hero.team][hero.slot];',
    'mobile formation lookup');

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
  html = replaceRequired(html,
    /innerWidth < 600 \? 0\.52 : 0\.74/,
    'innerWidth < 600 ? 0.40 : 0.74',
    'portrait hero scale');

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
  console.log('Reference formation, contact spacing and ultimate target focus applied.');
}
