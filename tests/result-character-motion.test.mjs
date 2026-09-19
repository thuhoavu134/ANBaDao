import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const build = readFileSync(new URL('../scripts/build-static.mjs', import.meta.url), 'utf8');
const patch = readFileSync(new URL('../scripts/result-character-motion-v1.mjs', import.meta.url), 'utf8');
const battle = readFileSync(new URL('../dist/battle.html', import.meta.url), 'utf8');

test('result motion is installed after readiness and before iframe sync', () => {
  const readiness = build.indexOf("await buildBattleReadiness(root);");
  const motion = build.indexOf("await import('./result-character-motion-v1.mjs');");
  const sync = build.indexOf("const embeddedBattle = readFileSync(join(out, 'battle.html'));");
  assert.ok(readiness >= 0 && motion > readiness && sync > motion);
});

test('built result screen has authored Victory Run to Idle and one-shot Defeat Fall', () => {
  assert.ok(battle.includes('HV_RESULT_CHARACTER_MOTION_V1'));
  assert.ok(battle.includes('hvResultRunIn'));
  assert.ok(battle.includes('irv-motion-idle'));
  assert.ok(battle.includes('fallCycles=1'));
  assert.ok(battle.includes('qa.phase="fall-hold"'));
  assert.ok(battle.includes('loop:false,kind:"fall"'));
});

test('result manifest references real authored motion assets and readiness variants', () => {
  const sources = [
    'assets/characters/luc-anh/run-atlas.webp',
    'assets/characters/luc-anh/fall-atlas.webp',
    'assets/characters/linh-dong/run-atlas.webp',
    'assets/characters/linh-dong/fall-atlas.webp',
    'assets/characters/bach-dien/run-atlas.webp',
    'assets/characters/bach-dien/fall-atlas.webp',
    'assets/characters/dinh-loi/run-atlas.png',
    'assets/characters/dinh-loi/fall-atlas.png',
    'assets/battle-runtime/embedded-14.png'
  ];
  for (const source of sources) assert.ok(patch.includes(source), source);
  assert.ok(patch.includes('battle-readiness-assets.json'));
  assert.ok(patch.includes('readyBySource'));
});

test('authored result animator owns its RAF and guards legacy painters', () => {
  assert.ok(patch.includes('__HV_RESULT_MOTION_CAN_DRAW'));
  assert.ok(patch.includes('legacy painter boundary missing'));
  assert.ok(patch.includes('stopRun()'));
  assert.ok(patch.includes('animationStops'));
});
