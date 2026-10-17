import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';
import { patchVersionedBasicDispatch } from '../scripts/versioned-basic-dispatch-v1.mjs';
import { settleLegacyDamage } from '../src/domain/combat/legacy-damage-settlement.mjs';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

function sourceFunction(source, name) {
  const start = source.indexOf(`function ${name}(`);
  assert.ok(start >= 0, `missing runtime function: ${name}`);
  for (let end = source.indexOf('}', start); end >= 0; end = source.indexOf('}', end + 1)) {
    const fn = source.slice(start, end + 1);
    try { new vm.Script(`(${fn})`); return fn; } catch {}
  }
  throw new Error(`unclosed runtime function: ${name}`);
}

function productionFixture() {
  let html = read('battle.html');
  // Recreate the upstream presentation/readiness preconditions without a full
  // asset build. All combat functions below come from the real source owners.
  html = html.replace('|| drawThayMoIdleQa(context, unit)', '|| drawBachDienHero(context,unit,time) || drawThayMoIdleQa(context, unit)');
  html = html.replace('    drawThayMoRangedFx(ctx,time);', '    drawBachDienFx(ctx,time);\n    drawThayMoRangedFx(ctx,time);');
  html = html.replace('} else if (usesThayMoBasicQa) {\n        actor.x=origin.x; actor.y=origin.y; setUnitState(actor,"idle",800);\n      } else if (usesOngPhoGif) {', '} else if (usesOngPhoGif) {');
  html = html.replace('    state.locked = true;\n    state.selectedAction = action;', '    state.locked = true;\n    let __hvActionAssets;\n    __hvActionAssets=await __hvBattleAssets.prepare(actor,action,target,battleId);\n    state.selectedAction = action;');
  html = html.replace('    void advanceTurn();\n  }\n\n  function statusLabel', '    void advanceTurn();\n      if(actor._hvAssetLease===__hvActionAssets)delete actor._hvAssetLease;\n  }\n\n  function statusLabel');

  // Replay the actual adapter emitters. Production damage lives in the renamed
  // adapter, not the public recording wrapper or the old QA-only resolver.
  const adapter = read('scripts/combat-domain-3q-adapter-v1.mjs');
  for (const [owner, next] of [['__hvApplyDamage3qAdapter', '__hvApplyHeal3qAdapter'], ['__hvResolveAction3qAdapter', '__hvFinishBattle3qAdapter']]) {
    const start = adapter.indexOf(`  if (!html.includes('${owner}')) {`);
    const end = adapter.indexOf(`  if (!html.includes('${next}')) {`, start);
    assert.ok(start >= 0 && end > start);
    const env = { html };
    vm.runInNewContext(adapter.slice(start, end), env);
    html = env.html;
  }

  const env = { join, process: { cwd: () => '/fixture' }, console: { log() {} },
    readFileSync: () => html, writeFileSync: (_path, output) => { html = output; } };
  vm.runInNewContext(read('scripts/thay-mo-authored-production-v1.mjs').replace(/^import .*;\n/gm, ''), env);
  const damage = { settleLegacyDamage };
  vm.runInNewContext(sourceFunction(read('scripts/mixed-damage-settlement-v1.mjs'), 'patchMixedDamageSettlement'), damage);
  return patchVersionedBasicDispatch(damage.patchMixedDamageSettlement(html));
}

const html = productionFixture();

function harness({ sourceId = 'thay_mo', team = 'player', versioned = true, combat = null } = {}) {
  const makeUnit = (id, side, slot) => ({ id, sourceId: id, name: id, team: side, slot,
    hp: 1000, maxHp: 1000, energy: 30, atk: 100, shield: 0, x: slot * 10, y: slot * 20,
    baseX: slot * 10, baseY: slot * 20, statuses: [{ type: 'speedDown', turns: 2, power: .12 }], state: 'idle' });
  const other = team === 'player' ? 'enemy' : 'player';
  const actor = Object.assign(makeUnit('caster', team, 0), { sourceId,
    kitVersion: versioned ? 'samkok-v2.1' : null, basicMultiplier: 1.02,
    basicKind: 'debuff', basicName: 'Chuông Chấn Phách', skillMultiplier: 1.1,
    skillKind: 'fear', ultimateMultiplier: 1.32, ultimateKind: 'aoe', ultimateName: 'Trận Ảnh Phong Môn' });
  const enemies = Array.from({ length: 6 }, (_, slot) => makeUnit('foe-' + slot, other, slot));
  const allies = Array.from({ length: 5 }, (_, index) => makeUnit('ally-' + index, team, index + 1));
  const units = [actor, ...allies, ...enemies], hits = [], records = [], sounds = [], pending = [], controls = [], drains = [];
  let now = 1000;
  const snapshot = () => units.map(unit => ({ id: unit.id, hp: unit.hp, energy: unit.energy }));
  const env = { units, state: { round: 1, actionCount: 5, battleId: 'battle', resolvedActionIds: new Set(), intelligence: {} },
    TEAM_PLAYER: 'player', TEAM_ENEMY: 'enemy', REFERENCE_SIMPLE: true, cameraShake: 0,
    Math: Object.assign(Object.create(Math), { random: () => .1 }),
    Core: {
      skillLevelMultiplier: () => 1.1,
      calculateDamageDetailed(a, target, multiplier) {
        hits.push({ id: target.id, multiplier, at: now });
        return { amount: Math.round(a.atk * multiplier), missed: false, critical: false };
      },
      heroTacticalDamageMultiplier: () => 1, objectiveFormationDamageMultiplier: () => 1,
      heroProtectorMitigation: () => 1, clamp: (v, min, max) => Math.max(min, Math.min(max, v)),
      hasStatus: (unit, type) => unit.statuses.some(status => status.type === type),
      heroControllerEnergyDrain(a, kind) { drains.push({ actorId: a.id, kind }); return 8; },
      actionCost: action => action === 'ultimate' ? 60 : action === 'skill' ? 25 : 0
    },
    window: { __HV_COMBAT_MODULES_V1: {
      session: { ensure: () => ({}) },
      result: { snapshotCombatUnits: snapshot, recordCombatAction: (_session, record) => records.push(record) }
    } },
    __hvCombatSessionOptions3qAdapter: () => ({}), __hvCombatRngCursor3qAdapter: () => 0,
    __hvCombatRngCallsSince3qAdapter: () => [],
    getUnit: id => units.find(unit => unit.id === id), living: side => units.filter(unit => unit.team === side && unit.hp > 0),
    preferredTargetFor: () => enemies[1],
    splusCombat: () => combat, performance: { now: () => now },
    intelUnit: () => null, isOngPho: () => false, isDinhLoi: () => false,
    isLucAnh: () => false, isLinhDong: () => false,
    addLog() {}, addFloater() {}, burst() {}, tone() {}, setStatus() {},
    recordControl: (_actor, target, kind) => controls.push({ targetId: target.id, kind, hitCount: hits.length }),
    motionDuration: ms => ms, setUnitState: (unit, state) => { unit.state = state; },
    markDefeated: unit => { unit.state = 'dead'; },
    COMBAT_PRESENTATION_STANDARD: { colors: { damage: 'red', critical: 'gold' } },
    THAY_MO_IDLE_IMAGE() {}, THAY_MO_SKILL1_CAST_IMAGE() {}, THAY_MO_SKILL1_WAVE_IMAGE() {}, THAY_MO_SKILL1_IMPACT_IMAGE() {},
    THAY_MO_ULTIMATE_CAST_IMAGE() {}, THAY_MO_ULTIMATE_VFX_IMAGE() {},
    THAY_MO_SKILL1_COMBO_RELEASE_AT_MS: 20, THAY_MO_SKILL1_FULL_MAIN_IMPACT_AT_MS: 70, THAY_MO_SKILL1_FULL_TOTAL_MS: 100,
    THAY_MO_ULTIMATE_RELEASE_AT_MS: 40, THAY_MO_ULTIMATE_MAIN_IMPACT_AT_MS: 80, THAY_MO_ULTIMATE_TOTAL_MS: 120,
    sleepVisualMilliseconds: ms => new Promise(resolve => pending.push({ ms, resolve })),
    dom: { phaseLabel: {} }, playActionSound: (_actor, action) => sounds.push({ action, at: now })
  };
  const start = html.indexOf('  const THAY_MO_PRODUCTION_IDS');
  const runtime = html.slice(start, html.indexOf('  function drawThayMoIdleQa(', start));
  const functions = ['thayMoSkill1RowTargets', 'actionKind', 'gainEnergy', 'isVersionedSkillKit', 'isVersionedBasic',
    'isVersionedLucAnh', 'isOngPhoCarry', 'settleLegacyDamage', '__hvApplyDamage3qAdapter', 'applyDamage',
    '__hvResolveAction3qAdapter', 'resolveAction', 'addStatus', 'applyHeroControllerDrain',
    'talentRuleFor', 'talentSkillUnlocked', 'talentSkillReady', 'talentSkillIntent', 'armTalentSkill'];
  vm.createContext(env);
  const talentStart = html.indexOf('  const TALENT_SKILL_STANDARD =');
  const talent = html.slice(talentStart, html.indexOf('  const DEFEAT_HIDE_MS', talentStart));
  vm.runInContext(runtime + '\n' + talent + '\n' + functions.map(name => sourceFunction(html, name)).join('\n'), env);

  const debitStart = html.indexOf('    const talentActivation=');
  const debit = html.slice(debitStart, html.indexOf('    state.actionCount += 1;', debitStart));
  const castStart = html.indexOf('    } else if (usesThayMoAuthored) {') + '    } else if (usesThayMoAuthored) {'.length;
  const castEnd = html.indexOf('    } else if (usesThayMoBasicQa) {', castStart);
  const impact = html.match(/^    resolveAction\(actor, action, target, phase1ActionId\);$/m)?.[0];
  assert.ok(castEnd > castStart && impact);
  vm.runInContext(`this.debit=(actor,action)=>{${debit}};
    this.castAtAuthoredImpact=async(actor,action,target)=>{
      const battleId=state.battleId,phase1Trace=null,phase1ActionId='authored-impact';
      ${html.slice(castStart, castEnd)}
      ${impact}
    };`, env);
  return { env, actor, enemies, allies, units, hits, records, sounds, pending, controls, drains,
    resumeWait(allowed = true) { const wait = pending.shift(); assert.ok(wait); now += wait.ms; wait.resolve(allowed); } };
}

test('production Thầy Mo Basic damages the three visible targets once at the authored impact', async () => {
  const h = harness(), { env, actor, enemies, allies, hits, records } = h;
  const statuses = structuredClone(h.units.map(unit => unit.statuses));
  env.debit(actor, 'basic');
  assert.equal(actor.energy, 30, 'Basic remains free');
  const cast = env.castAtAuthoredImpact(actor, 'basic', enemies[1]);
  assert.deepEqual([...actor._thayMoAuthoredAction.targetIds], ['foe-0', 'foe-1', 'foe-2']);
  assert.equal(hits.length, 0, 'no HP hit before release');
  h.resumeWait(); await new Promise(resolve => setImmediate(resolve));
  assert.equal(h.sounds.length, 1);
  assert.equal(hits.length, 0, 'release only launches the three lines');
  h.resumeWait(); await cast;
  assert.deepEqual(enemies.map(unit => unit.hp), [888, 888, 888, 1000, 1000, 1000]);
  assert.deepEqual(hits.map(hit => hit.id), ['foe-1', 'foe-0', 'foe-2'], 'primary keeps its first hit, then the other lines land once');
  assert.ok(hits.every(hit => hit.at === 1070 && hit.multiplier === 1.02 * 1.1));
  assert.ok(allies.every(unit => unit.hp === 1000)); assert.equal(actor.hp, 1000);
  assert.equal(actor.energy, 45, 'one action grants +15 rage once');
  assert.deepEqual(h.units.map(unit => unit.statuses), statuses, 'existing statuses are not reapplied by extra action dispatches');
  assert.equal(records.length, 1, 'one public resolve records the complete action');
  assert.deepEqual(records[0].after.filter(unit => unit.id.startsWith('foe-')).map(unit => unit.hp), enemies.map(unit => unit.hp));
});

test('both teams, both target rows and every Thầy Mo identity retain the original per-target coefficient', () => {
  for (const sourceId of ['thay_mo', 'thay-mo', 'hero_thay_mo']) for (const team of ['player', 'enemy']) for (const row of [0, 3]) for (const versioned of [true, false]) {
    const { env, actor, enemies, hits } = harness({ sourceId, team, versioned });
    env.beginThayMoAuthoredAction(actor, 'basic', enemies[row + 1]);
    env.resolveAction(actor, 'basic', enemies[row + 1]);
    const expected = versioned ? 888 : 900;
    assert.deepEqual(enemies.map((unit, index) => unit.hp), enemies.map((_unit, index) => index >= row && index < row + 3 ? expected : 1000));
    assert.equal(hits.length, 3); assert.equal(actor.energy, 45);
  }
});

test('impact consumes the cast snapshot and excludes duplicate, dead, absent or allied targets', () => {
  const { env, actor, enemies, allies, hits } = harness();
  const action = env.beginThayMoAuthoredAction(actor, 'basic', enemies[1]);
  action.targetIds.push(enemies[1].id, allies[0].id, 'missing');
  enemies[0].hp = 0;
  enemies[1].slot = 4; // Recomputing the row here would hit a different trio.
  env.resolveAction(actor, 'basic', enemies[1]);
  assert.deepEqual(hits.map(hit => hit.id), ['foe-1', 'foe-2']);
  assert.deepEqual(enemies.map(unit => unit.hp), [0, 888, 888, 1000, 1000, 1000]);
  assert.ok(allies.every(unit => unit.hp === 1000)); assert.equal(actor.energy, 45);
});

test('a dead primary does not swallow the other two visible impacts or retarget unseen enemies', () => {
  const { env, actor, enemies, hits } = harness();
  env.beginThayMoAuthoredAction(actor, 'basic', enemies[1]); enemies[1].hp = 0;
  env.resolveAction(actor, 'basic', enemies[1]);
  assert.deepEqual(hits.map(hit => hit.id), ['foe-0', 'foe-2']);
  assert.deepEqual(enemies.map(unit => unit.hp), [888, 0, 888, 1000, 1000, 1000]);
});

test('direct Basic resolution without a presentation snapshot uses the same living visual row', () => {
  const { env, actor, enemies, hits } = harness();
  enemies[3].hp = 0;
  assert.deepEqual([...env.thayMoAuthoredTargetIds(actor, enemies[4], 'skill1')], ['foe-4', 'foe-5']);
  env.resolveAction(actor, 'basic', enemies[4]);
  assert.deepEqual(hits.map(hit => hit.id), ['foe-4', 'foe-5']);
  assert.deepEqual(enemies.map(unit => unit.hp), [1000, 1000, 1000, 0, 888, 888]);
  assert.equal(actor.energy, 45);
});

test('all three Basic contacts use the existing mixed-combat damage settlement once', () => {
  const routed = [], combat = { events: [], damage(actor, target, hit) {
    routed.push({ targetId: target.id, ...hit }); target.hp -= hit.raw; return hit.raw;
  } };
  const { env, actor, enemies } = harness({ combat });
  env.beginThayMoAuthoredAction(actor, 'basic', enemies[1]); env.resolveAction(actor, 'basic', enemies[1]);
  assert.deepEqual(routed.map(hit => hit.targetId), ['foe-1', 'foe-0', 'foe-2']);
  assert.ok(routed.every(hit => hit.raw === 112 && hit.action === 'basic' && hit.legacyImpact === true));
  assert.deepEqual(enemies.map(unit => unit.hp), [888, 888, 888, 1000, 1000, 1000]);
});

test('the real free-talent proc sends damage down all three lines while fear, control and cost stay primary-only', async () => {
  const h = harness({ versioned: false }), { env, actor, enemies, hits, controls, drains, records } = h;
  actor.stars = 2; enemies[1].statuses.push({ type: 'anTran', stacks: 2, turns: 3 });
  const intent = env.talentSkillIntent(actor);
  assert.equal(intent.action, 'skill'); assert.equal(intent.target, enemies[1]);
  env.armTalentSkill(actor, intent);
  assert.equal(actor._talentSkillActive, true);
  assert.equal(actor.talentProcCount, 1); assert.equal(actor.talentCooldownUntil, 8);
  env.debit(actor, intent.action); assert.equal(actor.energy, 30, 'the proc remains free');
  const cast = env.castAtAuthoredImpact(actor, intent.action, intent.target);
  assert.deepEqual([...actor._thayMoAuthoredAction.targetIds], ['foe-0', 'foe-1', 'foe-2']);
  h.resumeWait(); await new Promise(resolve => setImmediate(resolve));
  assert.equal(hits.length, 0);
  h.resumeWait(); await cast;
  assert.deepEqual(enemies.map(unit => unit.hp), [879, 879, 879, 1000, 1000, 1000]);
  assert.deepEqual(hits.map(hit => hit.id), ['foe-1', 'foe-0', 'foe-2']);
  assert.ok(hits.every(hit => hit.multiplier === 1.1 * 1.1 && hit.at === 1070));
  assert.deepEqual(controls, [{ targetId: 'foe-1', kind: 'fear', hitCount: 1 }], 'primary control resolves before auxiliary damage consumes any RNG');
  assert.deepEqual(drains, [{ actorId: actor.id, kind: 'fear' }]);
  assert.deepEqual(enemies.map(unit => unit.statuses.filter(status => status.type === 'fear').length), [0, 1, 0, 0, 0, 0]);
  assert.deepEqual(enemies.map(unit => unit.energy), [37, 29, 37, 30, 30, 30]);
  assert.equal(actor.energy, 30, 'a Skill proc must not also earn Basic rage');
  assert.equal(actor.talentProcCount, 1); assert.equal(records.length, 1); assert.equal(h.sounds.length, 1);
});

test('paid three-line fear uses one debit; unrelated fear, existing AoE and Ultimate never gain auxiliary hits', () => {
  for (const [sourceId, action, kind, expectedHits] of [
    ['thay_mo', 'skill', 'fear', 3], ['lac_yen', 'skill', 'fear', 1],
    ['thay_mo', 'skill', 'aoe', 6], ['thay_mo', 'ultimate', 'fear', 1]
  ]) {
    const { env, actor, enemies, hits, controls } = harness({ sourceId, versioned: false });
    actor.energy = 75;
    if (action === 'ultimate') actor.ultimateKind = kind; else actor.skillKind = kind;
    env.beginThayMoAuthoredAction(actor, action, enemies[1]); env.debit(actor, action);
    env.resolveAction(actor, action, enemies[1]);
    assert.equal(hits.length, expectedHits); assert.equal(controls.length, kind === 'fear' ? 1 : 0);
    assert.equal(actor.energy, action === 'skill' ? 50 : 15);
  }
});

test('cancelled casts, unrelated Basics and the existing Ultimate keep their action semantics', async () => {
  const cancelled = harness();
  const cast = cancelled.env.castAtAuthoredImpact(cancelled.actor, 'basic', cancelled.enemies[1]);
  cancelled.resumeWait(false); await cast; assert.equal(cancelled.hits.length, 0);

  const normal = harness({ sourceId: 'lac_yen' });
  normal.env.resolveAction(normal.actor, 'basic', normal.enemies[1]);
  assert.deepEqual(normal.enemies.map(unit => unit.hp), [1000, 888, 1000, 1000, 1000, 1000]);
  assert.equal(normal.actor.energy, 45);

  const ult = harness(); ult.actor.energy = 75;
  ult.env.beginThayMoAuthoredAction(ult.actor, 'ultimate', ult.enemies[1]);
  ult.env.debit(ult.actor, 'ultimate'); ult.env.resolveAction(ult.actor, 'ultimate', ult.enemies[1]);
  assert.deepEqual(ult.enemies.map(unit => unit.hp), [855, 855, 855, 855, 855, 855]);
  assert.equal(ult.hits.length, 6); assert.equal(ult.actor.energy, 15);
  for (const script of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) {
    if (!script[0].includes('type="module"')) new vm.Script(script[1]);
  }
});
