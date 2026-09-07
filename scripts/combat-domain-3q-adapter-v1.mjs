import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createCombatDomain } from './combat-domain-3q-core.mjs';
import { createBattleSessionStore } from '../src/domain/combat/battle-session.mjs';
import { createRoundManager } from '../src/domain/combat/round-manager.mjs';
import { COMBAT_RESULT_TYPES, deriveCombatResults } from '../src/domain/combat/combat-result.mjs';
import { canAct, normalizeFighter, resetFighter } from '../src/domain/combat/fighter.mjs';
import { selectTargets } from '../src/domain/combat/target-selector.mjs';
import { available, createCooldownState, handleSkillUsed, offsetCooldown } from '../src/domain/combat/cooldown.mjs';
import {
  COMBAT_OBSERVATION_SCHEMA,
  combatObservationReport,
  createCombatObservation,
  recordCombatObservation,
  rngSitesForAction
} from '../src/domain/combat/action-observation.mjs';

const root = process.cwd();

function assertCombatModuleContract() {
  const store = createBattleSessionStore();
  const session = store.create({ battleId: 'build-contract', seed: 'build-contract', roundMax: 15 });
  const manager = createRoundManager();
  const move = manager.beginMove(session, { roundIndex: 1, actorId: 'build-actor', skillId: 'basic' });
  const before = [
    { id: 'build-actor', team: 1, slot: 0, hp: 100, maxHp: 100, statuses: [] },
    { id: 'build-target', team: 2, slot: 0, hp: 100, maxHp: 100, statuses: [] }
  ];
  const after = [
    { id: 'build-actor', team: 1, slot: 0, hp: 100, maxHp: 100, statuses: [] },
    { id: 'build-target', team: 2, slot: 0, hp: 0, maxHp: 100, dead: true, statuses: [] }
  ];
  const results = deriveCombatResults(before, after, { targetId: 'build-target' });
  if (session.schema !== 'hon-viet-combat/v1') throw new Error('3Q combat module schema drift');
  if (move.id !== 'build-contract:r1:m1') throw new Error('3Q combat round/move contract drift');
  if (results[0]?.type !== COMBAT_RESULT_TYPES.DAMAGE || results.some((entry) => entry.targetId !== 'build-target')) {
    throw new Error('3Q combat result contract drift');
  }
  const browserWindow = {};
  new Function('window', buildBrowserCombatModulesSource())(browserWindow);
  const browserModules = browserWindow.__HV_COMBAT_MODULES_V1;
  if (!browserModules || typeof browserModules.session?.ensure !== 'function' || typeof browserModules.result?.recordCombatAction !== 'function') {
    throw new Error('3Q combat browser bundle contract drift');
  }
  const browserSession = browserModules.session.create({ battleId: 'browser-contract', seed: 'browser-contract' });
  const browserAction = browserModules.result.recordCombatAction(browserSession, {
    roundIndex: 1,
    actorId: 'build-actor',
    action: 'basic',
    kind: 'damage',
    targetId: 'build-target',
    before,
    after
  });
  if (browserAction.results[0]?.type !== COMBAT_RESULT_TYPES.DAMAGE) {
    throw new Error('3Q combat browser result contract drift');
  }
  const observation = createCombatObservation({ fixtureId: 'build-observation', sessionId: 'build-observation', seed: 'build-observation' });
  const observed = recordCombatObservation(observation, {
    round: 1,
    actorId: 'build-actor',
    action: 'basic',
    kind: 'damage',
    targetId: 'build-target',
    before,
    after
  });
  const observationReport = combatObservationReport(observation);
  if (observation.schema !== COMBAT_OBSERVATION_SCHEMA || !observed.ok || !observationReport.gaps.some((entry) => entry.code === 'per-impact-boundary-missing')) {
    throw new Error('L05a combat observation contract drift');
  }
  const fighter = normalizeFighter({ id: 'build-fighter', hp: 100, statuses: [{ type: 'stun', turns: 1 }] });
  if (canAct(fighter) || !canAct(resetFighter(fighter))) throw new Error('3Q fighter module contract drift');
  const targetRoster = [
    { id: 'build-front', team: 2, slot: 0, hp: 100, maxHp: 100 },
    { id: 'build-back', team: 2, slot: 1, hp: 100, maxHp: 100 }
  ];
  if (selectTargets(targetRoster, { mode: 'front', count: 1 })[0]?.id !== 'build-front') throw new Error('3Q target module contract drift');
  const cooldown = createCooldownState({ rewriteCfg: { basic: 1 } });
  handleSkillUsed(cooldown, { id: 'basic', cd: 3, unlockRound: 0 }, 1);
  if (available(cooldown, 'basic', 2) || !available(cooldown, 'basic', 3)) throw new Error('3Q cooldown module contract drift');
  offsetCooldown(cooldown, 1);
}

assertCombatModuleContract();

const battlePath = join(root, 'dist', 'battle.html');

function readCombatModuleSource(fileName) {
  return readFileSync(join(root, 'src', 'domain', 'combat', fileName), 'utf8')
    .replace(/^import[^\n]*\n/gm, '')
    .replace(/^export\s+/gm, '');
}

function buildBrowserCombatModulesSource() {
  const round = readCombatModuleSource('round-manager.mjs');
  const result = readCombatModuleSource('combat-result.mjs');
  const observer = readCombatModuleSource('action-observation.mjs');
  const session = readCombatModuleSource('battle-session.mjs');
  const fighter = readCombatModuleSource('fighter.mjs');
  const target = readCombatModuleSource('target-selector.mjs');
  const cooldown = readCombatModuleSource('cooldown.mjs');
  return [
    '(()=>{',
    'const __hvRoundManager = (()=>{',
    round,
    'return { beginRound, finishRound, beginMove, finishMove };',
    '})();',
    'const __hvCombatResult = (()=>{',
    'const beginMove = __hvRoundManager.beginMove;',
    result,
    'return { COMBAT_RESULT_TYPES, createCombatResult, snapshotCombatUnits, deriveCombatResults, recordCombatResult, recordCombatAction };',
    '})();',
    'const __hvCombatObserver = (()=>{',
    'const snapshotCombatUnits = __hvCombatResult.snapshotCombatUnits;',
    'const deriveCombatResults = __hvCombatResult.deriveCombatResults;',
    observer,
    'return { COMBAT_OBSERVATION_SCHEMA, COMBAT_OBSERVATION_GAPS, COMBAT_RNG_SITE_CATALOG, rngSitesForAction, createCombatObservation, recordCombatObservation, recordCombatImpact, finishCombatObservation, combatObservationReport };',
    '})();',
    'const __hvBattleSessionModule = (()=>{',
    'const finishMove = __hvRoundManager.finishMove;',
    'const finishRound = __hvRoundManager.finishRound;',
    session,
    'return { BATTLE_SESSION_SCHEMA, createBattleSession, finishBattleSession, createBattleSessionStore };',
    '})();',
    'const __hvBattleSession = { ...__hvBattleSessionModule, ...__hvBattleSessionModule.createBattleSessionStore() };',
    'const __hvFighter = (()=>{',
    fighter,
    'return { normalizeFighter, resetFighter, canAct };',
    '})();',
    'const __hvTarget = (()=>{',
    target,
    'return { selectTargets };',
    '})();',
    'const __hvCooldown = (()=>{',
    cooldown,
    'return { createCooldownState, setCooldown, getCooldown, handleSkillUsed, available, offsetCooldown };',
    '})();',
    'window.__HV_COMBAT_MODULES_V1 = window.__HV_COMBAT_MODULES_V1 || { round: __hvRoundManager, result: __hvCombatResult, observer: __hvCombatObserver, session: __hvBattleSession, fighter: __hvFighter, target: __hvTarget, cooldown: __hvCooldown };',
    '})();'
  ].join('\n');
}

function patchDist() {
  let html = readFileSync(battlePath, 'utf8');
  const factory = createCombatDomain.toString();

  if (!html.includes('id="hon-viet-combat-domain-v1"')) {
    const script = `<script id="hon-viet-combat-domain-v1">(()=>{const createCombatDomain=${factory};window.__HV_COMBAT_DOMAIN_V1=window.__HV_COMBAT_DOMAIN_V1||createCombatDomain();})();</script>`;
    if (!html.includes('</body>')) throw new Error('3Q combat adapter missing body anchor');
    html = html.replace('</body>', `${script}\n</body>`);
  }

  
  if (!html.includes('id="hon-viet-combat-modules-v1"')) {
    const moduleSource = buildBrowserCombatModulesSource();
    const fixtureCaptureSource = [
      "(()=>{",
      "  const observer=window.__HV_COMBAT_MODULES_V1?.observer;",
      "  const state={enabled:false,observation:null};",
      "  const clone=value=>value===undefined?undefined:JSON.parse(JSON.stringify(value));",
      "  const reportNode=document.createElement('pre');",
      "  reportNode.id='hvCombatFixtureReport';",
      "  reportNode.hidden=true;",
      "  reportNode.setAttribute('aria-hidden','true');",
      "  document.body.appendChild(reportNode);",
      "  const writeReport=()=>{const report=state.observation?observer.combatObservationReport(state.observation):null;reportNode.setAttribute('data-report',JSON.stringify(report||{}));reportNode.textContent=state.observation?JSON.stringify(state.observation):'';};",
      "  const fixture={",
      "    schema:'hon-viet-combat-observation/v1',",
      "    start(options={}){",
      "      if(!observer)return {ok:false,code:'OBSERVER_UNAVAILABLE'};",
      "      state.observation=observer.createCombatObservation(options);",
      "      state.enabled=true;",
      "      writeReport();",
      "      return observer.combatObservationReport(state.observation);",
      "    },",
      "    stop(options={}){",
      "      if(state.observation) observer.finishCombatObservation(state.observation, options);",
      "      state.enabled=false;",
      "      writeReport();",
      "      return state.observation?observer.combatObservationReport(state.observation):null;",
      "    },",
      "    clear(){state.enabled=false;state.observation=null;writeReport();return null;},",
      "    isEnabled(){return state.enabled&&Boolean(state.observation);},",
      "    record(input){if(!state.enabled||!state.observation)return null;const result=observer.recordCombatObservation(state.observation,input);writeReport();return result;},",
      "    snapshot(){return state.observation?clone(state.observation):null;},",
      "    report(){return state.observation?observer.combatObservationReport(state.observation):null;}",
      "  };",
      "  window.__HV_COMBAT_FIXTURE_V1=Object.freeze(fixture);",
      "  window.addEventListener('message',(event)=>{",
      "    const message=event?.data;",
      "    if(!message||message.channel!=='hon-viet-combat-fixture-v1'||event.source!==window.parent||event.origin!==window.location.origin)return;",
      "    if(message.type==='start') fixture.start(message.options||{});",
      "    else if(message.type==='stop') fixture.stop(message.options||{});",
      "    else if(message.type==='clear') fixture.clear();",
      "  });",
      "})();"
    ].join('\n');
    const moduleScript = '<script id="hon-viet-combat-modules-v1">\n' + moduleSource + '\n' + fixtureCaptureSource + '\n</script>';
    if (!html.includes('</body>')) throw new Error('3Q combat module bundle missing body anchor');
    html = html.replace('</body>', moduleScript + '\n</body>');
  }

  if (!html.includes('__hvResolveAction3qAdapter')) {
    const resolveMarker = '  function resolveAction(actor, action, target) {';
    if (!html.includes(resolveMarker)) throw new Error('3Q combat adapter missing resolveAction anchor');
    html = html.replace(resolveMarker, '  function __hvResolveAction3qAdapter(actor, action, target) {');
    const reactionMarker = '\n  function reactionTargetsFor(actor,kind,target){';
    if (!html.includes(reactionMarker)) throw new Error('3Q combat adapter missing action boundary');
    const wrapper = [
      "  function resolveAction(actor, action, target) {",
      "    const core = window.__HV_COMBAT_DOMAIN_V1;",
      "    const modules = window.__HV_COMBAT_MODULES_V1;",
      "    const sessionOptions = { battleId: state.battleId, seed: EMBED_CONFIG?.battleId || state.battleId, roundMax: 15 };",
      "    const session = modules?.session?.ensure(sessionOptions) || core?.ensureSession(sessionOptions);",
      "    const before = modules?.result?.snapshotCombatUnits(units) || core?.snapshotUnits(units) || [];",
      "    let output;",
      "    try {",
      "      output = __hvResolveAction3qAdapter(actor, action, target);",
      "    } finally {",
      "      const after = modules?.result?.snapshotCombatUnits(units) || core?.snapshotUnits(units) || [];",
      "      if (session) {",
      "        const actionInput = {",
      "          roundIndex: state.round,",
      "          actorId: actor?.id,",
      "          action,",
      "          kind: actionKind(actor, action),",
      "          targetId: target?.id ?? null,",
      "          before,",
      "          after,",
      "          metadata: { actorSourceId: actor?.sourceId || actor?.sourceHeroId || null }",
      "        };",
      "        if (modules?.result) modules.result.recordCombatAction(session, actionInput);",
      "        else if (core) core.recordAction(session, actionInput);",
      "      }",
      "      if (window.__HV_COMBAT_FIXTURE_V1?.isEnabled?.()) {",
      "        window.__HV_COMBAT_FIXTURE_V1.record({",
      "          round: state.round,",
      "          actorId: actor?.id,",
      "          action,",
      "          kind: actionKind(actor, action),",
      "          targetId: target?.id ?? null,",
      "          before,",
      "          after,",
      "          snapshotBoundary: 'resolveAction.finally',",
      "          rngCalls: modules?.observer?.rngSitesForAction?.(actionKind(actor, action)),",
      "          metadata: { sourceBoundary: 'resolveAction.finally', actorSourceId: actor?.sourceId || actor?.sourceHeroId || null }",
      "        });",
      "      }",
      "    }",
      "    return output;",
      "  }",
      ""
    ].join("\n");
    html = html.replace(reactionMarker, wrapper + reactionMarker);
  }

  if (!html.includes('__hvFinishBattle3qAdapter')) {
    const endMarker = '  function endBattle(winner, objectiveReason=null) {';
    if (!html.includes(endMarker)) throw new Error('3Q combat adapter missing endBattle anchor');
    const endHook = [
      "  function endBattle(winner, objectiveReason=null) {",
      "    const core = window.__HV_COMBAT_DOMAIN_V1;",
      "    const modules = window.__HV_COMBAT_MODULES_V1;",
      "    const sessionOptions = { battleId: state.battleId, seed: EMBED_CONFIG?.battleId || state.battleId, roundMax: 15 };",
      "    const session = modules?.session?.ensure(sessionOptions) || core?.ensureSession(sessionOptions);",
      "    if (session) {",
      "      if (modules?.session) modules.session.finishBattleSession(session, { winner, reason: objectiveReason });",
      "      else if (core) core.finishBattle(session, { winner, reason: objectiveReason });",
      "      if (core) window.__HV_COMBAT_LAST_REPLAY = core.serializeReplay(session);",
      "    }",
      "    // __hvFinishBattle3qAdapter",
      ""
    ].join("\n");
    html = html.replace(endMarker, endHook);
  }

  if (!html.includes('id="hon-viet-combat-modules-v1"')) {
    throw new Error('3Q combat module bundle injection failed');
  }
  if (!html.includes('__HV_COMBAT_FIXTURE_V1')) {
    throw new Error('L05a combat fixture capture injection failed');
  }
  if (!html.includes('window.__HV_COMBAT_DOMAIN_V1=window.__HV_COMBAT_DOMAIN_V1||createCombatDomain()')) {
    throw new Error('3Q combat adapter runtime injection failed');
  }
  if (!html.includes('function __hvResolveAction3qAdapter(actor, action, target)')) {
    throw new Error('3Q combat adapter action wrapper failed');
  }
  if (!html.includes('// __hvFinishBattle3qAdapter')) {
    throw new Error('3Q combat adapter result wrapper failed');
  }
  writeFileSync(battlePath, html);
  console.log('3Q combat domain adapter v1 wired: round → move → action → typed result replay');
}

patchDist();
