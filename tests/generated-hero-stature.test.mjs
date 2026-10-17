import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { patchRosterBattle } from '../scripts/roster-enemies-size-v1.mjs';
import { BATTLE_HERO_BODY_HEIGHT, PROCEDURAL_HERO_BODY } from '../src/render/hero-presentation.mjs';

const fixture = `  function drawGeneratedHero(context, unit, time, progress) { return false; }
  const visibilityOwner = { unchanged: true };
  function drawUnit(context, unit, time) {
    if (unit && typeof honVietDrawHuntUnit === "function") { }
    context.strokeStyle = "#2b2520";
  }`;

// A crouched attack and an extended release deliberately have different visible
// heights. Source-pixel density must stay fixed; fitting each pose to one height
// changes the apparent body proportions during the cast.
const pack = {
  cellW: 100, cellH: 140,
  poses: [{ body: 80, foot: 100 }, { body: 72, foot: 105 },
    { body: 50, foot: 90 }, { body: 100, foot: 125 }]
};

function runtime(referenceHeight = BATTLE_HERO_BODY_HEIGHT, correction = 1) {
  const patched = patchRosterBattle(fixture, { ranger: pack });
  const image = { complete: true, naturalWidth: 400 };
  const sandbox = { BATTLE_HERO_BODY_HEIGHT: referenceHeight, PROCEDURAL_HERO_BODY,
    battleHeroVisualScale: () => correction,
    POSE_ATLASES: { ranger: image }, Core: { clamp: (v, lo, hi) => Math.min(hi, Math.max(lo, v)) } };
  vm.createContext(sandbox);
  vm.runInContext(patched, sandbox);
  return { sandbox, image };
}

function painter(outerScale = 1) {
  const draws = [], stack = [];
  const context = {
    globalAlpha: 1,
    save() { stack.push(this.globalAlpha); },
    restore() { this.globalAlpha = stack.pop(); },
    drawImage(...args) {
      draws.push({ args, alpha: this.globalAlpha, density: args[8] / args[4] * outerScale });
    }
  };
  return { context, draws };
}

function approx(actual, expected) {
  assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} != ${expected}`);
}

test('generated heroes keep idle pixel density throughout run, attack, release and ultimate', () => {
  const { sandbox } = runtime();
  for (const team of ['player', 'enemy']) for (const slot of [0, 1, 5]) {
    // The caller owns viewport/depth scale and mirroring; the generated painter
    // normalizes its body only once inside that transform.
    for (const outerScale of [.34 * .98, .74 * 1.08]) {
      for (const [state, progress, columns] of [
        ['idle', 0, [0]], ['run', .3, [1]], ['attack', .2, [2]],
        ['attack', .47, [2, 3]], ['attack', .8, [3]], ['ultimate', .6, [0]]
      ]) {
        const { context, draws } = painter(outerScale);
        assert.equal(sandbox.drawGeneratedHero(context, { archetype: 'ranger', team, slot, state }, 0, progress), true);
        assert.deepEqual(draws.map(d => d.args[1] / pack.cellW), columns);
        for (const { args, density } of draws) {
          const col = args[1] / pack.cellW, pose = pack.poses[col];
          approx(density, BATTLE_HERO_BODY_HEIGHT / pack.poses[0].body * outerScale);
          approx(args[7] / args[3], args[8] / args[4]);
          approx(args[6] + args[8], 0); // every crop keeps its own foot at the actor anchor
          approx(args[5] + args[7] / 2, 0);
          approx(pose.body * density, BATTLE_HERO_BODY_HEIGHT * pose.body / pack.poses[0].body * outerScale);
          assert.equal(args[2], 0); // both teams continue using the same authored roster row
        }
        approx(context.globalAlpha, 1);
      }
    }
  }
});

test('generated stature follows the central battle reference, not an embedded display number', () => {
  const referenceHeight = BATTLE_HERO_BODY_HEIGHT + 37;
  const { sandbox } = runtime(referenceHeight);
  const { context, draws } = painter();
  sandbox.drawGeneratedHero(context, { archetype: 'ranger', state: 'idle' }, 0, 0);
  approx(draws[0].density * pack.poses[0].body, referenceHeight);
});

test('missing generic art remains an explicit fallback with no partial drawing', () => {
  const { sandbox, image } = runtime();
  const { context, draws } = painter();
  image.complete = false;
  assert.equal(sandbox.drawGeneratedHero(context, { archetype: 'ranger', state: 'idle' }, 0, 0), false);
  assert.equal(sandbox.drawGeneratedHero(context, { archetype: 'support', state: 'idle' }, 0, 0), false);
  assert.equal(draws.length, 0);
});

test('a generic fallback cancels the authored body correction once while retaining viewport and depth', () => {
  for (const correction of [.5, 1, 2]) {
    const { sandbox } = runtime(BATTLE_HERO_BODY_HEIGHT, correction);
    for (const viewportDepth of [.34 * .98, .74 * 1.08]) {
      const { context, draws } = painter(viewportDepth * correction);
      sandbox.drawGeneratedHero(context, { sourceId: 'thay_mo', archetype: 'ranger', state: 'attack' }, 0, .47);
      assert.equal(draws.length, 2);
      for (const draw of draws) approx(draw.density, BATTLE_HERO_BODY_HEIGHT / pack.poses[0].body * viewportDepth);
    }
  }
});

function sourceFunction(source, name) {
  const start = source.indexOf(`  function ${name}(`);
  assert.ok(start >= 0);
  for (let end = source.indexOf('}', start); end >= 0; end = source.indexOf('}', end + 1)) {
    const fn = source.slice(start, end + 1);
    try { new vm.Script(`(${fn})`); return fn; } catch {}
  }
  throw new Error(`Unclosed ${name}`);
}

function vectorPainter() {
  let scaleY = 1, offsetY = 0;
  const stack = [], metrics = { skullTop: null, sole: null, scaleY: null };
  let pathY = [];
  const context = {
    globalAlpha: 1,
    save() { stack.push({ scaleY, offsetY, lineWidth: this.lineWidth, strokeStyle: this.strokeStyle }); },
    restore() { const state = stack.pop(); scaleY = state.scaleY; offsetY = state.offsetY; Object.assign(this, state); },
    translate(_x, y) { offsetY += y * scaleY; },
    scale(_x, y) { scaleY *= y; },
    rotate() {}, beginPath() { pathY = []; }, closePath() {}, fill() {}, fillRect() {}, ellipse() {},
    moveTo(_x, y) { pathY.push(y); }, lineTo(_x, y) { pathY.push(y); }, quadraticCurveTo() {},
    stroke() { if (this.lineWidth === 5 && pathY.length === 4) metrics.sole = offsetY + (Math.max(...pathY) + this.lineWidth / 2) * scaleY; },
    arc(_x, y, radius) {
      if (y === -102 && radius === 20) { metrics.skullTop = offsetY + (y - radius) * scaleY; metrics.scaleY = scaleY; }
    }
  };
  return { context, metrics };
}

test('the actual procedural skeleton matches stature and ground after any authored fallback correction', () => {
  let drawUnit = sourceFunction(readFileSync(new URL('../battle.html', import.meta.url), 'utf8'), 'drawUnit');
  // Apply the formation owner's outer-scale precondition to the actual body
  // painter, while retaining its real head and shoe geometry below.
  drawUnit = drawUnit.replace(/    const identityScale = [^;]+;/,
    '    const identityScale = viewportScale * battleHeroVisualScale(unit);');
  const unrelated = `function otherPainter(context) {
    context.strokeStyle = "#2b2520";
    return context.strokeStyle;
  }`;
  const input = fixture.slice(0, fixture.indexOf('  function drawUnit(')) + drawUnit + '\n' + unrelated +
    '\nfunction huntHook(unit) { if (unit && typeof honVietDrawHuntUnit === "function") { } }';
  const patched = patchRosterBattle(input, {});
  for (const correction of [.5, 1, 2]) for (const viewportScale of [.34, .74]) for (const team of ['player', 'enemy']) {
    const unit = { sourceId: 'thay_mo', id: 'fallback', team, hp: 100, x: 700, y: 520,
      state: 'idle', stateStarted: 0, stateDuration: 800, phase: 0, archetype: 'support' };
    const sandbox = { BATTLE_HERO_BODY_HEIGHT, PROCEDURAL_HERO_BODY, viewportScale,
      battleHeroVisualScale: () => correction, POSE_ATLASES: {}, REDUCED_MOTION: true,
      TEAM_PLAYER: 'player', TEAM_ENEMY: 'enemy', innerWidth: 1280, units: [unit],
      state: { currentId: null, mode: 'battle' }, Core: { clamp: (v, lo, hi) => Math.min(hi, Math.max(lo, v)) },
      isOngPho: () => false, isThayMoHitQa: () => false, drawOngPhoGifHero: () => false,
      drawDinhLoiHero: () => false, drawLucAnhHero: () => false, drawLinhDongHero: () => false,
      drawThayMoIdleQa: () => false, drawWeapon() {}, drawUnitHud() {} };
    vm.createContext(sandbox); vm.runInContext(patched, sandbox);
    const { context, metrics } = vectorPainter();
    assert.equal(sandbox.otherPainter(context), '#2b2520');
    sandbox.drawUnit(context, unit, 0);
    const viewportDepth = viewportScale * (.83 + (unit.y - 290) / 1500);
    approx(metrics.sole, unit.y);
    approx(metrics.sole - metrics.skullTop, BATTLE_HERO_BODY_HEIGHT * viewportDepth);
    approx(metrics.scaleY, BATTLE_HERO_BODY_HEIGHT / PROCEDURAL_HERO_BODY.height * viewportDepth);
  }
});
