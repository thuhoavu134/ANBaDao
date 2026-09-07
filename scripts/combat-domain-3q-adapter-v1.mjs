import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createCombatDomain } from './combat-domain-3q-core.mjs';
import { createBattleSessionStore } from '../src/domain/combat/battle-session.mjs';
import { createRoundManager } from '../src/domain/combat/round-manager.mjs';
import { COMBAT_RESULT_TYPES, deriveCombatResults } from '../src/domain/combat/combat-result.mjs';
import { canAct, normalizeFighter, resetFighter } from '../src/domain/combat/fighter.mjs';
import { selectTargets } from '../src/domain/combat/target-selector.mjs';
import { available, createCooldownState, handleSkillUsed, offsetCooldown } from '../src/domain/combat/cooldown.mjs';
import { createCombatSessionRng } from '../src/domain/combat/seeded-rng.mjs';
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
  const sessionRng = createCombatSessionRng(session);
  if (sessionRng?.schema !== 'hon-viet-combat-rng/v1' || sessionRng?.seed !== 'build-contract') throw new Error('3Q combat rng contract drift');
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
  if (!browserModules || typeof browserModules.session?.ensure !== 'function' || typeof browserModules.result?.recordCombatAction !== 'function' || typeof browserModules.rng?.createCombatSessionRng !== 'function') {
    throw new Error('3Q combat browser bundle contract drift');
  }
  const browserSession = browserModules.session.create({ battleId: 'browser-contract', seed: 'browser-contract' });
  const browserRng = browserModules.rng.createCombatSessionRng(browserSession);
  if (browserRng?.schema !== 'hon-viet-combat-rng/v1' || browserRng?.seed !== 'browser-contract') throw new Error('3Q browser rng contract drift');
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
const indexPath = join(root, 'dist', 'index.html');

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
  const rng = readCombatModuleSource('seeded-rng.mjs');
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
    'return { COMBAT_OBSERVATION_SCHEMA, COMBAT_REPLAY_PARITY_SCHEMA, COMBAT_OBSERVATION_GAPS, COMBAT_RNG_SITE_CATALOG, rngSitesForAction, createCombatObservation, recordCombatObservation, recordCombatImpact, finishCombatObservation, combatObservationParityProjection, combatObservationParityDigest, compareCombatObservations, combatObservationReport };',
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
    'const __hvCombatRng = (()=>{',
    rng,
    'return { COMBAT_RNG_SCHEMA, COMBAT_RNG_DOMAINS, createSeededCombatRng, createCombatSessionRng };',
    '})();',
    'window.__HV_COMBAT_MODULES_V1 = window.__HV_COMBAT_MODULES_V1 || { round: __hvRoundManager, result: __hvCombatResult, observer: __hvCombatObserver, session: __hvBattleSession, fighter: __hvFighter, target: __hvTarget, cooldown: __hvCooldown, rng: __hvCombatRng };',
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
      "  const state={enabled:false,observation:null,activeActionId:null,activeRngCursor:null,pendingImpacts:[],scenario:null};",
      "  const clone=value=>value===undefined?undefined:JSON.parse(JSON.stringify(value));",
      "  const reportNode=document.createElement('pre');",
      "  reportNode.id='hvCombatFixtureReport';",
      "  reportNode.hidden=true;",
      "  reportNode.setAttribute('aria-hidden','true');",
      "  document.body.appendChild(reportNode);",
      "  const writeReport=()=>{const report=state.observation?observer.combatObservationReport(state.observation):null;reportNode.setAttribute('data-report',JSON.stringify(report||{}));reportNode.textContent=state.observation?JSON.stringify(state.observation):'';};",
      "  const fixture={",
      "    schema:'hon-viet-combat-observation/v1',",
      "    parityScope:'full-replay-rule-outcome',",
      "    start(options={}){",
      "      if(!observer)return {ok:false,code:'OBSERVER_UNAVAILABLE'};",
      "      state.activeActionId=null;state.activeRngCursor=null;state.pendingImpacts=[];state.scenario=options.scenario==null?null:String(options.scenario);",
      "      state.observation=observer.createCombatObservation(options);",
      "      state.enabled=true;",
      "      writeReport();",
      "      return observer.combatObservationReport(state.observation);",
      "    },",
      "    stop(options={}){",
      "      if(state.observation) observer.finishCombatObservation(state.observation, options);",
      "      state.enabled=false;state.activeActionId=null;state.activeRngCursor=null;state.pendingImpacts=[];",
      "      writeReport();",
      "      return state.observation?observer.combatObservationReport(state.observation):null;",
      "    },",
      "    clear(){state.enabled=false;state.activeActionId=null;state.activeRngCursor=null;state.pendingImpacts=[];state.observation=null;writeReport();return null;},",
      "    isEnabled(){return state.enabled&&Boolean(state.observation);},",
      "    isScenario(name){return String(state.scenario||'')===String(name||'');},",
      "    beginAction(input={}){if(!state.enabled||!state.observation)return null;const round=Math.max(1,Math.round(Number(input.round)||1));const sequence=state.observation.counters.action+1;state.activeActionId=`${state.observation.sessionId}:r${round}:a${sequence}`;state.activeRngCursor=input.rngCursor==null?null:clone(input.rngCursor);state.pendingImpacts=[];return state.activeActionId;},",
      "    currentActionId(){return state.activeActionId;},",
      "    rngCursor(){return state.activeRngCursor;},",
      "    endAction(){state.activeActionId=null;state.activeRngCursor=null;state.pendingImpacts=[];},",
      "    impact(input={}){if(!state.enabled||!state.observation)return null;const actionId=input.actionId||state.activeActionId;if(!actionId)return null;const {actionId:ignored,...impactInput}=input;const action=state.observation.actions.find(candidate=>candidate.actionId===actionId);const subActionIndex=impactInput.subActionIndex==null?(action?.impacts.length??state.pendingImpacts.length):impactInput.subActionIndex;const normalizedImpact={...impactInput,subActionIndex};if(!action){state.pendingImpacts.push({actionId,...normalizedImpact});return {ok:true,pending:true};}const result=observer.recordCombatImpact(state.observation,actionId,normalizedImpact);writeReport();return result;},",
      "    record(input){if(!state.enabled||!state.observation)return null;const actionId=input.actionId||state.activeActionId;const result=observer.recordCombatObservation(state.observation,{...input,actionId});const pending=state.pendingImpacts.splice(0);pending.forEach(({actionId:pendingActionId,...impactInput})=>observer.recordCombatImpact(state.observation,pendingActionId||result.action?.actionId,impactInput));writeReport();return result;},",
      "    snapshot(){return state.observation?clone(state.observation):null;},",
      "    report(){return state.observation?observer.combatObservationReport(state.observation):null;}",
      "  };",
      "  window.__HV_COMBAT_FIXTURE_V1=Object.freeze(fixture);",
      "  const fixtureParam=new URLSearchParams(location.search).get('qaCombatFixture');",
      "  if(fixtureParam==='l05a') fixture.start({fixtureId:'l05a-production-ui',sessionId:'l05a-production-ui',seed:'l05a-production-seed',mode:'campaign',roundMax:15});",
      "  if(fixtureParam==='l05c-round-cap') fixture.start({fixtureId:'l05c-round-cap-production-ui',sessionId:'l05c-round-cap-production-ui',seed:'l05a-production-seed',mode:'campaign',roundMax:15,scenario:'round-cap'});",
      "})();"
    ].join('\n');
    const moduleScript = '<script id="hon-viet-combat-modules-v1">\n' + moduleSource + '\n' + fixtureCaptureSource + '\n</script>';
    if (!html.includes('</body>')) throw new Error('3Q combat module bundle missing body anchor');
    html = html.replace('</body>', moduleScript + '\n</body>');
  }

  if (!html.includes('__hvRuleRandom3qAdapter')) {
    const rngBridgeMarker = '  function applyDamage(actor, target, multiplier, options = {}) {';
    if (!html.includes(rngBridgeMarker)) throw new Error('L05c combat adapter missing RNG bridge anchor');
    const rngBridge = [
      "  function __hvCombatSessionOptions3qAdapter() {",
      "    const configuredSeed = EMBED_CONFIG?.combatSeed ?? EMBED_CONFIG?.seed;",
      "    return { battleId: state.battleId, seed: configuredSeed ?? EMBED_CONFIG?.battleId ?? state.battleId, roundMax: 15 };",
      "  }",
      "  let __hvCombatRngSession3qAdapter = null;",
      "  let __hvCombatRng3qAdapter = null;",
      "  function __hvEnsureCombatRng3qAdapter() {",
      "    const modules = window.__HV_COMBAT_MODULES_V1;",
      "    const sessionApi = modules?.session;",
      "    const rngApi = modules?.rng;",
      "    if (!sessionApi?.ensure || typeof rngApi?.createCombatSessionRng !== 'function') return null;",
      "    const session = sessionApi.ensure(__hvCombatSessionOptions3qAdapter());",
      "    if (!session) return null;",
      "    if (__hvCombatRngSession3qAdapter !== session) {",
      "      __hvCombatRngSession3qAdapter = session;",
      "      __hvCombatRng3qAdapter = rngApi.createCombatSessionRng(session);",
      "    }",
      "    return __hvCombatRng3qAdapter;",
      "  }",
      "  function __hvCombatRngCursor3qAdapter() {",
      "    const rng = __hvEnsureCombatRng3qAdapter();",
      "    return rng ? rng.callCount() : null;",
      "  }",
      "  function __hvCombatRngCallsSince3qAdapter(cursor) {",
      "    const rng = __hvEnsureCombatRng3qAdapter();",
      "    return rng && cursor != null ? rng.callsSince(cursor) : [];",
      "  }",
      "  function __hvRuleRandom3qAdapter(site) {",
      "    const rng = __hvEnsureCombatRng3qAdapter();",
      "    return rng ? rng.nextRule(site) : Math.random();",
      "  }",
      "  function __hvPresentationRandom3qAdapter(site) {",
      "    const rng = __hvEnsureCombatRng3qAdapter();",
      "    return rng ? rng.nextPresentation(site) : Math.random();",
      "  }",
      ""
    ].join("\n");
    html = html.replace(rngBridgeMarker, rngBridge + rngBridgeMarker);
  }

  if (!html.includes('__hvRecordCombatImpact3qAdapter')) {
    const impactMarker = '  function applyDamage(actor, target, multiplier, options = {}) {';
    if (!html.includes(impactMarker)) throw new Error('L05b combat adapter missing applyDamage anchor');
    const impactHelper = [
      "  function __hvRecordCombatImpact3qAdapter(input) {",
      "    if (!window.__HV_COMBAT_FIXTURE_V1?.isEnabled?.()) return;",
      "    window.__HV_COMBAT_FIXTURE_V1.impact(input);",
      "  }",
      ""
    ].join("\n");
    html = html.replace(impactMarker, impactHelper + impactMarker);
  }

  if (!html.includes('__hvApplyDamage3qAdapter')) {
    const marker = '  function applyDamage(actor, target, multiplier, options = {}) {';
    if (!html.includes(marker)) throw new Error('L05b combat adapter missing applyDamage function');
    html = html.replace(marker, '  function __hvApplyDamage3qAdapter(actor, target, multiplier, options = {}) {');
    const wrapper = [
      "  function applyDamage(actor, target, multiplier, options = {}) {",
      "    if (!window.__HV_COMBAT_FIXTURE_V1?.isEnabled?.()) return __hvApplyDamage3qAdapter(actor, target, multiplier, options);",
      "    const rngStart = __hvCombatRngCursor3qAdapter();",
      "    const before = window.__HV_COMBAT_MODULES_V1?.result?.snapshotCombatUnits(units) || [];",
      "    let output;",
      "    try {",
      "      output = __hvApplyDamage3qAdapter(actor, target, multiplier, options);",
      "      return output;",
      "    } finally {",
      "      const after = window.__HV_COMBAT_MODULES_V1?.result?.snapshotCombatUnits(units) || [];",
      "      const rngEnd = __hvCombatRngCursor3qAdapter();",
      "      const rngCalls = __hvCombatRngCallsSince3qAdapter(rngStart);",
      "      const missed = Boolean(target?._lastDamageMissed);",
      "      __hvRecordCombatImpact3qAdapter({",
      "        type: missed ? 'miss' : 'damage',",
      "        amount: Number.isFinite(Number(output)) ? Number(output) : null,",
      "        actorId: actor?.id ?? null,",
      "        targetId: target?.id ?? null,",
      "        before,",
      "        after,",
      "        rngCalls: rngCalls,",
      "        rngCursor: { start: rngStart, end: rngEnd },",
      "        flags: { missed, forceHit: Boolean(options?.forceHit), forceMiss: Boolean(options?.forceMiss), forceCrit: Boolean(options?.forceCrit), execute: Boolean(options?.execute) },",
      "        metadata: { sourceBoundary: 'applyDamage', effectPhase: 'action', shieldRemaining: Number(target?.shield) || 0 }",
      "      });",
      "    }",
      "  }",
      ""
    ].join("\n");
    html = html.replace('  function __hvApplyDamage3qAdapter(actor, target, multiplier, options = {}) {', wrapper + '  function __hvApplyDamage3qAdapter(actor, target, multiplier, options = {}) {');
  }

  if (!html.includes('__hvApplyHeal3qAdapter')) {
    const marker = '  function applyHeal(actor, target, multiplier, group = false) {';
    if (!html.includes(marker)) throw new Error('L05b combat adapter missing applyHeal function');
    html = html.replace(marker, '  function __hvApplyHeal3qAdapter(actor, target, multiplier, group = false) {');
    const wrapper = [
      "  function applyHeal(actor, target, multiplier, group = false) {",
      "    if (!window.__HV_COMBAT_FIXTURE_V1?.isEnabled?.()) return __hvApplyHeal3qAdapter(actor, target, multiplier, group);",
      "    const rngStart = __hvCombatRngCursor3qAdapter();",
      "    const before = window.__HV_COMBAT_MODULES_V1?.result?.snapshotCombatUnits(units) || [];",
      "    let output;",
      "    try {",
      "      output = __hvApplyHeal3qAdapter(actor, target, multiplier, group);",
      "      return output;",
      "    } finally {",
      "      const after = window.__HV_COMBAT_MODULES_V1?.result?.snapshotCombatUnits(units) || [];",
      "      const rngEnd = __hvCombatRngCursor3qAdapter();",
      "      const rngCalls = __hvCombatRngCallsSince3qAdapter(rngStart);",
      "      __hvRecordCombatImpact3qAdapter({",
      "        type: 'heal',",
      "        amount: Number.isFinite(Number(output)) ? Number(output) : null,",
      "        actorId: actor?.id ?? null,",
      "        targetId: target?.id ?? null,",
      "        before,",
      "        after,",
      "        rngCalls: rngCalls,",
      "        rngCursor: { start: rngStart, end: rngEnd },",
      "        flags: { grouped: Boolean(group) },",
      "        metadata: { sourceBoundary: 'applyHeal', effectPhase: 'action' }",
      "      });",
      "    }",
      "  }",
      ""
    ].join("\n");
    html = html.replace('  function __hvApplyHeal3qAdapter(actor, target, multiplier, group = false) {', wrapper + '  function __hvApplyHeal3qAdapter(actor, target, multiplier, group = false) {');
  }

  if (!html.includes('__hvAddStatus3qAdapter')) {
    const marker = '  function addStatus(unit, status) {';
    if (!html.includes(marker)) throw new Error('L05b combat adapter missing addStatus function');
    html = html.replace(marker, '  function __hvAddStatus3qAdapter(unit, status) {');
    const wrapper = [
      "  function addStatus(unit, status) {",
      "    if (!window.__HV_COMBAT_FIXTURE_V1?.isEnabled?.()) return __hvAddStatus3qAdapter(unit, status);",
      "    const rngStart = __hvCombatRngCursor3qAdapter();",
      "    const before = window.__HV_COMBAT_MODULES_V1?.result?.snapshotCombatUnits(units) || [];",
      "    const statusType = status?.type ?? null;",
      "    let output;",
      "    try {",
      "      output = __hvAddStatus3qAdapter(unit, status);",
      "      return output;",
      "    } finally {",
      "      const after = window.__HV_COMBAT_MODULES_V1?.result?.snapshotCombatUnits(units) || [];",
      "      const rngEnd = __hvCombatRngCursor3qAdapter();",
      "      const rngCalls = __hvCombatRngCallsSince3qAdapter(rngStart);",
      "      __hvRecordCombatImpact3qAdapter({",
      "        type: 'status',",
      "        amount: null,",
      "        actorId: status?.sourceId ?? null,",
      "        targetId: unit?.id ?? null,",
      "        before,",
      "        after,",
      "        rngCalls: rngCalls,",
      "        rngCursor: { start: rngStart, end: rngEnd },",
      "        flags: { statusType },",
      "        metadata: { sourceBoundary: 'addStatus', effectPhase: 'action', statusType }",
      "      });",
      "    }",
      "  }",
      ""
    ].join("\n");
    html = html.replace('  function __hvAddStatus3qAdapter(unit, status) {', wrapper + '  function __hvAddStatus3qAdapter(unit, status) {');
  }

  if (!html.includes('__hvGainEnergy3qAdapter')) {
    const marker = '  function gainEnergy(unit, amount){';
    if (!html.includes(marker)) throw new Error('L05b combat adapter missing gainEnergy function');
    html = html.replace(marker, '  function __hvGainEnergy3qAdapter(unit, amount){');
    const wrapper = [
      "  function gainEnergy(unit, amount){",
      "    if (!window.__HV_COMBAT_FIXTURE_V1?.isEnabled?.()) return __hvGainEnergy3qAdapter(unit, amount);",
      "    const rngStart = __hvCombatRngCursor3qAdapter();",
      "    const before = window.__HV_COMBAT_MODULES_V1?.result?.snapshotCombatUnits(units) || [];",
      "    let output;",
      "    try {",
      "      output = __hvGainEnergy3qAdapter(unit, amount);",
      "      return output;",
      "    } finally {",
      "      const after = window.__HV_COMBAT_MODULES_V1?.result?.snapshotCombatUnits(units) || [];",
      "      const rngEnd = __hvCombatRngCursor3qAdapter();",
      "      const rngCalls = __hvCombatRngCallsSince3qAdapter(rngStart);",
      "      const beforeUnit = before.find(candidate => candidate.id === unit?.id);",
      "      const afterUnit = after.find(candidate => candidate.id === unit?.id);",
      "      const delta = Number(afterUnit?.energy || 0) - Number(beforeUnit?.energy || 0);",
      "      if (delta !== 0) __hvRecordCombatImpact3qAdapter({",
      "        type: 'energy',",
      "        amount: delta,",
      "        actorId: null,",
      "        targetId: unit?.id ?? null,",
      "        before,",
      "        after,",
      "        rngCalls: rngCalls,",
      "        rngCursor: { start: rngStart, end: rngEnd },",
      "        flags: { requested: Number(amount) || 0 },",
      "        metadata: { sourceBoundary: 'gainEnergy', effectPhase: 'action' }",
      "      });",
      "    }",
      "  }",
      ""
    ].join("\n");
    html = html.replace('  function __hvGainEnergy3qAdapter(unit, amount){', wrapper + '  function __hvGainEnergy3qAdapter(unit, amount){');
  }

  if (!html.includes('__hvMarkDefeated3qAdapter')) {
    const marker = '  function markDefeated(unit) {';
    if (!html.includes(marker)) throw new Error('L05b combat adapter missing markDefeated function');
    html = html.replace(marker, '  function __hvMarkDefeated3qAdapter(unit) {');
    const wrapper = [
      "  function markDefeated(unit) {",
      "    if (!window.__HV_COMBAT_FIXTURE_V1?.isEnabled?.()) return __hvMarkDefeated3qAdapter(unit);",
      "    const rngStart = __hvCombatRngCursor3qAdapter();",
      "    const before = window.__HV_COMBAT_MODULES_V1?.result?.snapshotCombatUnits(units) || [];",
      "    const wasAlive = Boolean(unit && !unit.defeatedAt);",
      "    let output;",
      "    try {",
      "      output = __hvMarkDefeated3qAdapter(unit);",
      "      return output;",
      "    } finally {",
      "      const after = window.__HV_COMBAT_MODULES_V1?.result?.snapshotCombatUnits(units) || [];",
      "      const rngEnd = __hvCombatRngCursor3qAdapter();",
      "      const rngCalls = __hvCombatRngCallsSince3qAdapter(rngStart);",
      "      if (wasAlive && unit?.hp <= 0) __hvRecordCombatImpact3qAdapter({",
      "        type: 'death',",
      "        amount: null,",
      "        actorId: null,",
      "        targetId: unit?.id ?? null,",
      "        before,",
      "        after,",
      "        rngCalls: rngCalls,",
      "        rngCursor: { start: rngStart, end: rngEnd },",
      "        flags: { defeated: true },",
      "        metadata: { sourceBoundary: 'markDefeated', effectPhase: 'action' }",
      "      });",
      "    }",
      "  }",
      ""
    ].join("\n");
    html = html.replace('  function __hvMarkDefeated3qAdapter(unit) {', wrapper + '  function __hvMarkDefeated3qAdapter(unit) {');
  }

  if (!html.includes('__hvApplyHeroControllerDrain3qAdapter')) {
    const marker = '  function applyHeroControllerDrain(actor,target,kind){';
    if (!html.includes(marker)) throw new Error('L05b combat adapter missing energy drain function');
    html = html.replace(marker, '  function __hvApplyHeroControllerDrain3qAdapter(actor,target,kind){');
    const wrapper = [
      "  function applyHeroControllerDrain(actor,target,kind){",
      "    if (!window.__HV_COMBAT_FIXTURE_V1?.isEnabled?.()) return __hvApplyHeroControllerDrain3qAdapter(actor,target,kind);",
      "    const rngStart = __hvCombatRngCursor3qAdapter();",
      "    const before = window.__HV_COMBAT_MODULES_V1?.result?.snapshotCombatUnits(units) || [];",
      "    let output;",
      "    try {",
      "      output = __hvApplyHeroControllerDrain3qAdapter(actor,target,kind);",
      "      return output;",
      "    } finally {",
      "      const after = window.__HV_COMBAT_MODULES_V1?.result?.snapshotCombatUnits(units) || [];",
      "      const rngEnd = __hvCombatRngCursor3qAdapter();",
      "      const rngCalls = __hvCombatRngCallsSince3qAdapter(rngStart);",
      "      const beforeUnit = before.find(candidate => candidate.id === target?.id);",
      "      const afterUnit = after.find(candidate => candidate.id === target?.id);",
      "      const delta = Number(afterUnit?.energy || 0) - Number(beforeUnit?.energy || 0);",
      "      if (delta !== 0) __hvRecordCombatImpact3qAdapter({",
      "        type: 'energy',",
      "        amount: delta,",
      "        actorId: actor?.id ?? null,",
      "        targetId: target?.id ?? null,",
      "        before,",
      "        after,",
      "        rngCalls: rngCalls,",
      "        rngCursor: { start: rngStart, end: rngEnd },",
      "        flags: { kind },",
      "        metadata: { sourceBoundary: 'applyHeroControllerDrain', effectPhase: 'action' }",
      "      });",
      "    }",
      "  }",
      ""
    ].join("\n");
    html = html.replace('  function __hvApplyHeroControllerDrain3qAdapter(actor,target,kind){', wrapper + '  function __hvApplyHeroControllerDrain3qAdapter(actor,target,kind){');
  }

  if (!html.includes('__hvDebitActionEnergy3qAdapter')) {
    const costMarker = '    actor.energy = Math.max(0, actor.energy - cost);';
    const costOccurrences = html.split(costMarker).length - 1;
    if (costOccurrences !== 1) throw new Error('L05c combat adapter missing action-cost boundary (found ' + costOccurrences + ')');
    const costBoundary = [
      "    function __hvDebitActionEnergy3qAdapter(actor, cost, talentActivation = false) {",
      "      const fixture = window.__HV_COMBAT_FIXTURE_V1;",
      "      if (!fixture?.isEnabled?.()) {",
      "        actor.energy = Math.max(0, actor.energy - cost);",
      "        return actor.energy;",
      "      }",
      "      const rngStart = __hvCombatRngCursor3qAdapter();",
      "      const before = window.__HV_COMBAT_MODULES_V1?.result?.snapshotCombatUnits(units) || [];",
      "      actor.energy = Math.max(0, actor.energy - cost);",
      "      const after = window.__HV_COMBAT_MODULES_V1?.result?.snapshotCombatUnits(units) || [];",
      "      const rngEnd = __hvCombatRngCursor3qAdapter();",
      "      const rngCalls = __hvCombatRngCallsSince3qAdapter(rngStart);",
      "      const beforeUnit = before.find(candidate => candidate.id === actor?.id);",
      "      const afterUnit = after.find(candidate => candidate.id === actor?.id);",
      "      const delta = Number(afterUnit?.energy || 0) - Number(beforeUnit?.energy || 0);",
      "      fixture.impact({",
      "        type: 'energy',",
      "        amount: delta,",
      "        actorId: actor?.id ?? null,",
      "        targetId: actor?.id ?? null,",
      "        before,",
      "        after,",
      "        rngCalls,",
      "        rngCursor: { start: rngStart, end: rngEnd },",
      "        flags: { cost: Number(cost) || 0, talentActivation: Boolean(talentActivation) },",
      "        metadata: { sourceBoundary: 'performAction.action-cost', effectPhase: 'action-cost' }",
      "      });",
      "      return actor.energy;",
      "    }",
      "    __hvDebitActionEnergy3qAdapter(actor, cost, talentActivation);"
    ].join("\n");
    html = html.replace(costMarker, costBoundary);
  }

  if (!html.includes('__hvTickStatuses3qAdapter')) {
    const statusMarker = '    const statusEvents = Core.tickStatuses(actor);';
    const statusOccurrences = html.split(statusMarker).length - 1;
    if (statusOccurrences !== 1) throw new Error('L05c combat adapter missing tick-status boundary (found ' + statusOccurrences + ')');
    const statusBoundary = [
      "    const __hvTickStatuses3qAdapter = (unit) => {",
      "      const fixture = window.__HV_COMBAT_FIXTURE_V1;",
      "      if (!fixture?.isEnabled?.()) return Core.tickStatuses(unit);",
      "      const before = window.__HV_COMBAT_MODULES_V1?.result?.snapshotCombatUnits(units) || [];",
      "      const rngStart = __hvCombatRngCursor3qAdapter();",
      "      let events = [];",
      "      try {",
      "        events = Core.tickStatuses(unit);",
      "        return events;",
      "      } finally {",
      "        const after = window.__HV_COMBAT_MODULES_V1?.result?.snapshotCombatUnits(units) || [];",
      "        const rngEnd = __hvCombatRngCursor3qAdapter();",
      "        const rngCalls = __hvCombatRngCallsSince3qAdapter(rngStart);",
      "        const beforeUnit = before.find(candidate => candidate.id === unit?.id);",
      "        const afterUnit = after.find(candidate => candidate.id === unit?.id);",
      "        (Array.isArray(events) ? events : []).forEach((event, eventIndex) => {",
      "          const eventType = event?.type;",
      "          const statusType = event?.status ?? null;",
      "          const impactType = eventType === 'damage' ? 'dot' : eventType === 'heal' ? 'heal' : 'status';",
      "          const statusBefore = beforeUnit?.statuses?.find(status => status.type === statusType) || null;",
      "          const statusAfter = afterUnit?.statuses?.find(status => status.type === statusType) || null;",
      "          fixture.impact({",
      "            type: impactType,",
      "            amount: eventType === 'damage' || eventType === 'heal' ? Number(event.amount) || 0 : null,",
      "            actorId: statusBefore?.sourceId || statusAfter?.sourceId || null,",
      "            targetId: unit?.id ?? null,",
      "            before,",
      "            after,",
      "            rngCalls,",
      "            rngCursor: { start: rngStart, end: rngEnd },",
      "            flags: { statusType, eventType, dot: eventType === 'damage', control: eventType === 'control', expired: eventType === 'expired' },",
      "            metadata: { sourceBoundary: 'tickStatuses', effectPhase: 'turn-start', statusType, eventIndex }",
      "          });",
      "        });",
      "      }",
      "    };",
      "    const statusEvents = __hvTickStatuses3qAdapter(actor);"
    ].join("\n");
    html = html.replace(statusMarker, statusBoundary);
  }

  if (!html.includes('__hvCheckBattleEnd3qAdapter')) {
    const endCheckMarker = '  function checkBattleEnd() {';
    if (!html.includes(endCheckMarker)) throw new Error('L05c combat adapter missing battle-end boundary');
    html = html.replace(endCheckMarker, '  function __hvCheckBattleEnd3qAdapter() {');
    const endCheckBoundary = [
      "  function checkBattleEnd() {",
      "    const fixture = window.__HV_COMBAT_FIXTURE_V1;",
      "    const objective = state.objective;",
      "    const maxRound = Math.max(1, Math.round(Number(objective?.maxRounds) || 15));",
      "    if (fixture?.isScenario?.('round-cap')) {",
      "      const players = living(TEAM_PLAYER);",
      "      const enemies = living(TEAM_ENEMY);",
      "      if (Number(state.round) <= maxRound && (players.length === 0 || enemies.length === 0)) {",
      "        const reviveTeam = players.length === 0 ? TEAM_PLAYER : TEAM_ENEMY;",
      "        const revive = units.find((unit) => unit.team === reviveTeam && unit.hp <= 0);",
      "        if (revive) {",
      "          revive.hp = Math.max(1, Number(revive.maxHp) || 1);",
      "          revive.defeatedAt = 0; revive.defeatHideDuration = 0; revive.defeatFallDuration = 0;",
      "          setUnitState(revive, 'idle', 800); state.queue = [];",
      "          return false;",
      "        }",
      "      }",
      "      if (Number(state.round) <= maxRound && players.length > 0 && enemies.length > 0) return false;",
      "      if (Number(state.round) <= maxRound) return __hvCheckBattleEnd3qAdapter();",
      "      const playerHp = players.reduce((sum, unit) => sum + Math.max(0, Number(unit.hp) || 0), 0);",
      "      const enemyHp = enemies.reduce((sum, unit) => sum + Math.max(0, Number(unit.hp) || 0), 0);",
      "      const winner = playerHp >= enemyHp ? TEAM_PLAYER : TEAM_ENEMY;",
      "      const reason = playerHp === enemyHp ? 'round-limit-tie' : 'round-limit-hp';",
      "      if (objective) { objective.resolved=true; objective.winner=winner; objective.reason=reason; objective.playerHp=playerHp; objective.enemyHp=enemyHp; }",
      "      state.round = maxRound;",
      "      endBattle(winner, reason);",
      "      return true;",
      "    }",
      "    return __hvCheckBattleEnd3qAdapter();",
      "  }",
      ""
    ].join("\n");
    html = html.replace('  function __hvCheckBattleEnd3qAdapter() {', endCheckBoundary + '  function __hvCheckBattleEnd3qAdapter() {');
  }

  if (!html.includes('__hvPerformAction3qAdapter')) {
    const marker = '  async function performAction(actor, action, target) {';
    if (!html.includes(marker)) throw new Error('L05b combat adapter missing performAction anchor');
    html = html.replace(marker, '  async function __hvPerformAction3qAdapter(actor, action, target) {');
    const wrapper = [
      "  async function performAction(actor, action, target) {",
      "    const fixture = window.__HV_COMBAT_FIXTURE_V1;",
      "    const fixtureActionId = fixture?.isEnabled?.() ? fixture.beginAction({ round: state.round, actorId: actor?.id, action, rngCursor: __hvCombatRngCursor3qAdapter() }) : null;",
      "    try {",
      "      return await __hvPerformAction3qAdapter(actor, action, target);",
      "    } finally {",
      "      if (fixtureActionId) fixture.endAction();",
      "    }",
      "  }",
      ""
    ].join("\n");
    html = html.replace('  async function __hvPerformAction3qAdapter(actor, action, target) {', wrapper + '  async function __hvPerformAction3qAdapter(actor, action, target) {');
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
      "    const sessionOptions = __hvCombatSessionOptions3qAdapter();",
      "    const session = modules?.session?.ensure(sessionOptions) || core?.ensureSession(sessionOptions);",
      "    const rngStart = __hvCombatRngCursor3qAdapter();",
      "    const before = modules?.result?.snapshotCombatUnits(units) || core?.snapshotUnits(units) || [];",
      "    let output;",
      "    try {",
      "      output = __hvResolveAction3qAdapter(actor, action, target);",
      "    } finally {",
      "      const after = modules?.result?.snapshotCombatUnits(units) || core?.snapshotUnits(units) || [];",
      "      const rngEnd = __hvCombatRngCursor3qAdapter();",
      "      const rngCalls = __hvCombatRngCallsSince3qAdapter(rngStart);",
      "      if (session) {",
      "        const actionInput = {",
      "          roundIndex: state.round,",
      "          actorId: actor?.id,",
      "          action,",
      "          kind: actionKind(actor, action),",
      "          targetId: target?.id ?? null,",
      "          actionId: window.__HV_COMBAT_FIXTURE_V1?.currentActionId?.(),",
      "          before,",
      "          after,",
      "          rngCalls,",
      "          rngCursor: { start: rngStart, end: rngEnd },",
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
      "          rngCalls,",
      "          rngCursor: { start: rngStart, end: rngEnd },",
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
      "    const sessionOptions = __hvCombatSessionOptions3qAdapter();",
      "    const session = modules?.session?.ensure(sessionOptions) || core?.ensureSession(sessionOptions);",
      "    if (session) {",
      "      if (modules?.session) modules.session.finishBattleSession(session, { winner, reason: objectiveReason });",
      "      else if (core) core.finishBattle(session, { winner, reason: objectiveReason });",
      "      if (core) window.__HV_COMBAT_LAST_REPLAY = core.serializeReplay(session);",
      "    }",
      "    if (window.__HV_COMBAT_FIXTURE_V1?.isEnabled?.()) window.__HV_COMBAT_FIXTURE_V1.stop({ finishedAt: Date.now(), winner, reason: objectiveReason, round: state.round, roundMax: state.objective?.maxRounds || 15, speed: state.speed, replay: window.__HV_COMBAT_LAST_REPLAY });",
      "    // __hvFinishBattle3qAdapter",
      ""
    ].join("\n");
    html = html.replace(endMarker, endHook);
  }

  const seededRandomSites3qAdapter = [
    ['+ Math.random() * 0.35', '+ __hvPresentationRandom3qAdapter("burst.angle") * 0.35'],
    ['38 + Math.random() * 105', '38 + __hvPresentationRandom3qAdapter("burst.speed") * 105'],
    ['0.55 + Math.random() * 0.45', '0.55 + __hvPresentationRandom3qAdapter("burst.life") * 0.45'],
    ['2 + Math.random() * 4', '2 + __hvPresentationRandom3qAdapter("burst.size") * 4'],
    ['spin: Math.random() * Math.PI', 'spin: __hvPresentationRandom3qAdapter("burst.spin") * Math.PI'],
    ['(options.forceHit || actor?._demoForceHit ? 0 : Math.random())', '(options.forceHit || actor?._demoForceHit ? 0 : __hvRuleRandom3qAdapter("applyDamage.hit"))'],
    ['variance:Math.random()', 'variance:__hvRuleRandom3qAdapter("applyDamage.variance")'],
    ['crit:options.forceCrit?0:Math.random()', 'crit:options.forceCrit?0:__hvRuleRandom3qAdapter("applyDamage.crit")'],
    ['if(Math.random()<chance){addStatus(target,{type:"fear"', 'if(__hvRuleRandom3qAdapter("status.fear")<chance){addStatus(target,{type:"fear"'],
    ['if(Math.random()<chance){addStatus(target,{type:"stun"', 'if(__hvRuleRandom3qAdapter("status.stun")<chance){addStatus(target,{type:"stun"'],
    ['if(Math.random()<chance){addStatus(secondTarget', 'if(__hvRuleRandom3qAdapter("status.comboStun")<chance){addStatus(secondTarget'],
    ['const shakeX = cameraShake > 0.2 && !REDUCED_MOTION ? (Math.random() - 0.5) * cameraShake : 0;', 'const shakeX = cameraShake > 0.2 && !REDUCED_MOTION ? (__hvPresentationRandom3qAdapter("camera.shakeX") - 0.5) * cameraShake : 0;'],
    ['const shakeY = cameraShake > 0.2 && !REDUCED_MOTION ? (Math.random() - 0.5) * cameraShake * 0.5 : 0;', 'const shakeY = cameraShake > 0.2 && !REDUCED_MOTION ? (__hvPresentationRandom3qAdapter("camera.shakeY") - 0.5) * cameraShake * 0.5 : 0;']
  ];
  for (const [from, to] of seededRandomSites3qAdapter) {
    const occurrences = html.split(from).length - 1;
    if (occurrences !== 1) throw new Error('L05c combat RNG site drift: ' + from + ' (found ' + occurrences + ')');
    html = html.replace(from, to);
  }

  if (!html.includes('id="hon-viet-combat-modules-v1"')) {
    throw new Error('3Q combat module bundle injection failed');
  }
  if (!html.includes('__HV_COMBAT_FIXTURE_V1')) {
    throw new Error('L05a combat fixture capture injection failed');
  }
  for (const marker of [
    '__hvRecordCombatImpact3qAdapter',
    '__hvApplyDamage3qAdapter',
    '__hvApplyHeal3qAdapter',
    '__hvAddStatus3qAdapter',
    '__hvGainEnergy3qAdapter',
    '__hvMarkDefeated3qAdapter',
    '__hvPerformAction3qAdapter',
    '__hvDebitActionEnergy3qAdapter',
    '__hvTickStatuses3qAdapter',
    '__hvCheckBattleEnd3qAdapter'
  ]) {
    if (!html.includes(marker)) throw new Error(`L05b combat impact wrapper missing: ${marker}`);
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
  if (!html.includes('__hvCombatSessionOptions3qAdapter') || !html.includes('__hvCombatRngCallsSince3qAdapter') || !html.includes('__hvRuleRandom3qAdapter') || !html.includes('__hvPresentationRandom3qAdapter')) {
    throw new Error('L05c seeded combat RNG bridge injection failed');
  }
  if (!html.includes("sourceBoundary: 'performAction.action-cost'") || !html.includes("sourceBoundary: 'tickStatuses'") || !html.includes("const statusEvents = __hvTickStatuses3qAdapter(actor);")) {
    throw new Error('L05c direct status/energy boundary injection failed');
  }
  if (!html.includes("scenario:'round-cap'") || !html.includes("parityScope:'full-replay-rule-outcome'")) {
    throw new Error('L05c round-cap/replay parity fixture injection failed');
  }
  const remainingMathRandomCalls = html.match(/Math[.]random[(][)]/g) || [];
  if (remainingMathRandomCalls.length !== 2) {
    throw new Error('L05c combat RNG site patch incomplete: ' + remainingMathRandomCalls.length + ' Math.random fallback sites remain');
  }
  writeFileSync(battlePath, html);
  let indexHtml = readFileSync(indexPath, 'utf8');
  const shellMarker = '    frame.src = `battle.html?embedded=1&session=${encodeURIComponent(sessionId)}&v=3173${qaSuffix}`;';
  if (!indexHtml.includes('qaCombatFixture=l05a')) {
    if (!indexHtml.includes(shellMarker)) throw new Error('L05a combat fixture shell anchor missing');
    const shellPatch = [
      '    const fixtureSuffix = pageParams.get("qaCombatFixture") === "l05a" ? "&qaCombatFixture=l05a" : "";',
      '    frame.src = `battle.html?embedded=1&session=${encodeURIComponent(sessionId)}&v=3173${qaSuffix}${fixtureSuffix}`;'
    ].join('\n');
    indexHtml = indexHtml.replace(shellMarker, shellPatch);
    writeFileSync(indexPath, indexHtml);
  }
  if (!indexHtml.includes('qaCombatFixture=l05a')) {
    throw new Error('L05a combat fixture shell injection failed');
  }
  console.log('3Q combat domain adapter v1 wired: round → move → action → typed result replay');
}

patchDist();
