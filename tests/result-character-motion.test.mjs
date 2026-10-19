import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const build = readFileSync(new URL('../scripts/build-static.mjs', import.meta.url), 'utf8');
const patch = readFileSync(new URL('../scripts/result-character-motion-v1.mjs', import.meta.url), 'utf8');
const battle = readFileSync(new URL('../dist/battle.html', import.meta.url), 'utf8');

test('result motion is installed after readiness and before the battle payload finalize', () => {
  const readiness = build.indexOf("await buildBattleReadiness(root);");
  const motion = build.indexOf("await import('./result-character-motion-v1.mjs');");
  // bf12673 removed the embedded payload; the last build step is now the
  // BATTLE_HTML_BASE64 emptying, which must still run after the motion patch.
  const sync = build.indexOf("embeddedIndex = embeddedIndex.replace(embeddedExpression");
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

test('default roster gets full-body generic Run Idle and one-shot Fall fallback', () => {
  for (const id of ['dong_quan','lam_vu','moc_an','hoa_ho','van_chi']) assert.ok(patch.includes(id), id);
  for (const asset of [
    'assets/battle-runtime/embedded-05.webp',
    'assets/battle-runtime/embedded-06.webp',
    'assets/battle-runtime/embedded-07.webp',
    'assets/battle-runtime/embedded-08.webp',
    'assets/battle-runtime/embedded-10.webp'
  ]) assert.ok(patch.includes(asset), asset);
  assert.ok(patch.includes('drawGenericPose'));
  assert.ok(patch.includes('animateGeneric'));
  assert.ok(patch.includes('hvResultGenericFall'));
});


test('large authored fall poses reserve copy clearance on desktop', () => {
  assert.ok(patch.includes('data-irv-motion-hero'));
  assert.ok(patch.includes('linh_dong'));
  assert.ok(patch.includes('bach_dien'));
  assert.ok(patch.includes('translateY(-14%) scale(.90)'));
  assert.ok(patch.includes('delete current.dataset.irvMotionHero'));
});


test('Victory Run waits for its atlas before starting the visible entry timer', () => {
  assert.ok(patch.includes('irv-motion-run-active'));
  assert.ok(patch.includes('const runSource=entry?entry.run.src:generic.src'));
  assert.ok(patch.includes('imageFor(runSource,beginRun)'));
  assert.ok(patch.includes('later(finishRunWhenVisible,1770)'));
  assert.ok(patch.includes('MIN_RUN_FRAMES=8'));
  assert.ok(patch.includes('qa.runFrames>=MIN_RUN_FRAMES'));
  assert.ok(patch.includes('later(finishRun,5000)'));
  assert.ok(patch.includes('if(!runStarted)finishRun()'));
  assert.ok(patch.includes('const idleReady='));
  assert.ok(patch.includes('if(!idleReady)'));
  assert.ok(patch.includes('stopRun();current.classList.add("irv-motion-idle")'));
  assert.ok(patch.includes('opacity:0!important;visibility:hidden!important'));
});


test('result heroes stay in the wing focus across victory and mobile defeat', () => {
  // Victory chibi sits BELOW the VICTORY banner/wings (owner report: banner was covering the hero).
  assert.ok(patch.includes('irv-authored-motion.irv-victory .irv-hero-wrap{top:31.5%;height:10.4%;width:auto;aspect-ratio:16/9}'));
  assert.ok(patch.includes('irv-authored-motion.irv-defeat .irv-hero-wrap{top:11.5%}'));
});


