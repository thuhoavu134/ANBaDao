import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createCombatDomain } from './combat-domain-3q-core.mjs';
import { createBattleSessionStore } from '../src/domain/combat/battle-session.mjs';
import { createRoundManager } from '../src/domain/combat/round-manager.mjs';
import { COMBAT_RESULT_TYPES, deriveCombatResults } from '../src/domain/combat/combat-result.mjs';


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
}

assertCombatModuleContract();

const root = process.cwd();
const battlePath = join(root, 'dist', 'battle.html');

function readCombatModuleSource(fileName) {
  return readFileSync(join(root, 'src', 'domain', 'combat', fileName), 'utf8')
    .replace(/^import[^\n]*\n/gm, '')
    .replace(/^export\s+/gm, '');
}

function buildBrowserCombatModulesSource() {
  const round = readCombatModuleSource('round-manager.mjs');
  const result = readCombatModuleSource('combat-result.mjs');
  const session = readCombatModuleSource('battle-session.mjs');
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
    'const __hvBattleSession = (()=>{',
    'const finishMove = __hvRoundManager.finishMove;',
    'const finishRound = __hvRoundManager.finishRound;',
    session,
    'return { BATTLE_SESSION_SCHEMA, createBattleSession, finishBattleSession, createBattleSessionStore };',
    '})();',
    'window.__HV_COMBAT_MODULES_V1 = window.__HV_COMBAT_MODULES_V1 || { round: __hvRoundManager, result: __hvCombatResult, session: __hvBattleSession };',
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
    const moduleScript = '<script id="hon-viet-combat-modules-v1">\n' + moduleSource + '\n</script>';
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
      "      if (session) {",
      "        const actionInput = {",
      "          roundIndex: state.round,",
      "          actorId: actor?.id,",
      "          action,",
      "          kind: actionKind(actor, action),",
      "          targetId: target?.id ?? null,",
      "          before,",
      "          after: (modules?.result?.snapshotCombatUnits(units) || core?.snapshotUnits(units) || []),",
      "          metadata: { actorSourceId: actor?.sourceId || actor?.sourceHeroId || null }",
      "        };",
      "        if (modules?.result) modules.result.recordCombatAction(session, actionInput);",
      "        else if (core) core.recordAction(session, actionInput);",
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
