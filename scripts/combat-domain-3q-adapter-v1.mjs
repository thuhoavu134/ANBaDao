import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createCombatDomain } from './combat-domain-3q-core.mjs';

const root = process.cwd();
const battlePath = join(root, 'dist', 'battle.html');

function patchDist() {
  let html = readFileSync(battlePath, 'utf8');
  const factory = createCombatDomain.toString();

  if (!html.includes('id="hon-viet-combat-domain-v1"')) {
    const script = `<script id="hon-viet-combat-domain-v1">(()=>{const createCombatDomain=${factory};window.__HV_COMBAT_DOMAIN_V1=window.__HV_COMBAT_DOMAIN_V1||createCombatDomain();})();</script>`;
    if (!html.includes('</body>')) throw new Error('3Q combat adapter missing body anchor');
    html = html.replace('</body>', `${script}\n</body>`);
  }

  if (!html.includes('__hvResolveAction3qAdapter')) {
    const resolveMarker = '  function resolveAction(actor, action, target) {';
    if (!html.includes(resolveMarker)) throw new Error('3Q combat adapter missing resolveAction anchor');
    html = html.replace(resolveMarker, '  function __hvResolveAction3qAdapter(actor, action, target) {');
    const reactionMarker = '\n  function reactionTargetsFor(actor,kind,target){';
    if (!html.includes(reactionMarker)) throw new Error('3Q combat adapter missing action boundary');
    const wrapper = `
  function resolveAction(actor, action, target) {
    const domain = window.__HV_COMBAT_DOMAIN_V1;
    const session = domain?.ensureSession({ battleId: state.battleId, seed: EMBED_CONFIG?.battleId || state.battleId, roundMax: 15 });
    const before = domain?.snapshotUnits(units) || [];
    let output;
    try {
      output = __hvResolveAction3qAdapter(actor, action, target);
    } finally {
      if (domain && session) domain.recordAction(session, {
        roundIndex: state.round,
        actorId: actor?.id,
        action,
        kind: actionKind(actor, action),
        targetId: target?.id ?? null,
        before,
        after: domain.snapshotUnits(units),
        metadata: { actorSourceId: actor?.sourceId || actor?.sourceHeroId || null }
      });
    }
    return output;
  }
`;
    html = html.replace(reactionMarker, `${wrapper}${reactionMarker}`);
  }

  if (!html.includes('__hvFinishBattle3qAdapter')) {
    const endMarker = '  function endBattle(winner, objectiveReason=null) {';
    if (!html.includes(endMarker)) throw new Error('3Q combat adapter missing endBattle anchor');
    const endHook = `  function endBattle(winner, objectiveReason=null) {
    const domain = window.__HV_COMBAT_DOMAIN_V1;
    const session = domain?.ensureSession({ battleId: state.battleId, seed: EMBED_CONFIG?.battleId || state.battleId, roundMax: 15 });
    if (domain && session) {
      domain.finishBattle(session, { winner, reason: objectiveReason });
      window.__HV_COMBAT_LAST_REPLAY = domain.serializeReplay(session);
    }
    // __hvFinishBattle3qAdapter
`;
    html = html.replace(endMarker, endHook);
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
