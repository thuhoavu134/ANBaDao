import { deriveCombatResults, snapshotCombatUnits } from './combat-result.mjs';

export const COMBAT_OBSERVATION_SCHEMA = 'hon-viet-combat-observation/v1';
export const COMBAT_OBSERVATION_GAPS = Object.freeze({
  FINAL_ACTION_SNAPSHOT: 'resolve-action-final-snapshot',
  PER_IMPACT_BOUNDARY: 'per-impact-boundary-missing',
  RNG_VALUE: 'rng-value-not-captured'
});

export const COMBAT_RNG_SITE_CATALOG = Object.freeze([
  Object.freeze({ site: 'targetSelector.random', domain: 'rule' }),
  Object.freeze({ site: 'applyDamage.hit', domain: 'rule' }),
  Object.freeze({ site: 'applyDamage.variance', domain: 'rule' }),
  Object.freeze({ site: 'applyDamage.crit', domain: 'rule' }),
  Object.freeze({ site: 'burst.angle', domain: 'presentation' }),
  Object.freeze({ site: 'burst.speed', domain: 'presentation' }),
  Object.freeze({ site: 'burst.life', domain: 'presentation' }),
  Object.freeze({ site: 'burst.size', domain: 'presentation' }),
  Object.freeze({ site: 'burst.spin', domain: 'presentation' })
]);

function clone(value) {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value));
}

function text(value, fallback = '') {
  return String(value == null || value === '' ? fallback : value);
}

function numeric(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function gap(code, boundary, message) {
  return { code, boundary, message };
}

function normalizeRngCalls(calls) {
  return (Array.isArray(calls) ? calls : []).map((call, index) => {
    if (typeof call === 'string') return { index, site: call, domain: 'unknown', captured: false, value: null };
    const site = text(call?.site, 'unknown');
    const value = call?.value === undefined ? null : clone(call.value);
    return {
      index,
      site,
      domain: text(call?.domain, 'unknown'),
      captured: Boolean(call?.captured ?? call?.value !== undefined),
      value
    };
  });
}

function normalizeMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return null;
  return clone(metadata);
}

export function rngSitesForAction(kind) {
  const action = text(kind, 'basic').toLowerCase();
  const sites = [];
  if (!['heal', 'healall', 'guardall', 'cleanseguard'].includes(action)) {
    sites.push(...COMBAT_RNG_SITE_CATALOG.filter((entry) => entry.site.startsWith('applyDamage.')));
  }
  sites.push(...COMBAT_RNG_SITE_CATALOG.filter((entry) => entry.domain === 'presentation'));
  return sites.map((entry) => ({ ...entry, captured: false, value: null }));
}

export function createCombatObservation(options = {}) {
  const sessionId = text(options.sessionId ?? options.battleId, 'observation-session');
  return {
    schema: COMBAT_OBSERVATION_SCHEMA,
    fixtureId: text(options.fixtureId, sessionId),
    sessionId,
    seed: options.seed == null ? null : text(options.seed),
    mode: options.mode == null ? null : text(options.mode),
    roundMax: Math.max(1, Math.round(numeric(options.roundMax, 15))),
    status: 'open',
    startedAt: options.startedAt ?? null,
    finishedAt: null,
    counters: { action: 0, result: 0, impact: 0 },
    actions: [],
    gaps: [
      gap(COMBAT_OBSERVATION_GAPS.FINAL_ACTION_SNAPSHOT, 'resolveAction.finally', 'Engine hiện chỉ chụp before/after ở cuối resolveAction.'),
      gap(COMBAT_OBSERVATION_GAPS.PER_IMPACT_BOUNDARY, 'applyDamage/applyHeal/status/energy', 'Chưa có hook before/after riêng cho từng sub-action hoặc impact.'),
      gap(COMBAT_OBSERVATION_GAPS.RNG_VALUE, 'inline Math.random', 'Đã biết call site nhưng chưa thu giá trị RNG luật tách khỏi presentation.')
    ]
  };
}

export function recordCombatObservation(observation, input = {}) {
  if (!observation || observation.schema !== COMBAT_OBSERVATION_SCHEMA) {
    return { ok: false, code: 'INVALID_COMBAT_OBSERVATION' };
  }
  if (observation.status !== 'open') return { ok: false, code: 'COMBAT_OBSERVATION_CLOSED' };
  const round = Math.max(1, Math.round(numeric(input.round, observation.counters.action + 1)));
  const sequence = observation.counters.action + 1;
  const before = snapshotCombatUnits(input.before);
  const after = snapshotCombatUnits(input.after);
  const actionId = text(input.actionId, `${observation.sessionId}:r${round}:a${sequence}`);
  const results = Array.isArray(input.results)
    ? clone(input.results)
    : deriveCombatResults(before, after, { targetId: input.targetId });
  const action = {
    sequence,
    round,
    actionId,
    actorId: input.actorId == null ? null : text(input.actorId),
    targetId: input.targetId == null ? null : text(input.targetId),
    action: input.action == null ? null : text(input.action),
    kind: input.kind == null ? null : text(input.kind),
    snapshotBoundary: text(input.snapshotBoundary, 'resolveAction.finally'),
    before,
    after,
    results,
    rngCalls: normalizeRngCalls(input.rngCalls ?? rngSitesForAction(input.kind)),
    impacts: [],
    metadata: normalizeMetadata(input.metadata)
  };
  observation.actions.push(action);
  observation.counters.action += 1;
  observation.counters.result += results.length;
  return { ok: true, action: clone(action) };
}

export function recordCombatImpact(observation, actionId, input = {}) {
  if (!observation || observation.schema !== COMBAT_OBSERVATION_SCHEMA) {
    return { ok: false, code: 'INVALID_COMBAT_OBSERVATION' };
  }
  if (observation.status !== 'open') return { ok: false, code: 'COMBAT_OBSERVATION_CLOSED' };
  const action = observation.actions.find((entry) => entry.actionId === String(actionId));
  if (!action) return { ok: false, code: 'UNKNOWN_COMBAT_ACTION' };
  const impact = {
    index: observation.counters.impact + 1,
    type: text(input.type, 'unknown'),
    subActionIndex: Math.max(0, Math.round(numeric(input.subActionIndex, action.impacts.length))),
    actorId: input.actorId == null ? action.actorId : text(input.actorId),
    targetId: input.targetId == null ? action.targetId : text(input.targetId),
    before: snapshotCombatUnits(input.before),
    after: snapshotCombatUnits(input.after),
    rngCalls: normalizeRngCalls(input.rngCalls),
    metadata: normalizeMetadata(input.metadata)
  };
  action.impacts.push(impact);
  observation.counters.impact += 1;
  return { ok: true, impact: clone(impact) };
}

export function finishCombatObservation(observation, options = {}) {
  if (!observation || observation.schema !== COMBAT_OBSERVATION_SCHEMA) return null;
  if (observation.status === 'finished') return clone(observation);
  observation.status = 'finished';
  observation.finishedAt = options.finishedAt ?? null;
  return clone(observation);
}

export function combatObservationReport(observation) {
  if (!observation || observation.schema !== COMBAT_OBSERVATION_SCHEMA) return null;
  const rngSites = [...new Set(observation.actions.flatMap((action) => action.rngCalls.map((call) => call.site)))].sort();
  const resultTypes = [...new Set(observation.actions.flatMap((action) => action.results.map((result) => result.type)))].sort();
  return {
    schema: observation.schema,
    fixtureId: observation.fixtureId,
    sessionId: observation.sessionId,
    status: observation.status,
    actionCount: observation.counters.action,
    resultCount: observation.counters.result,
    impactCount: observation.counters.impact,
    actionIds: observation.actions.map((action) => action.actionId),
    resultTypes,
    rngSites,
    gaps: clone(observation.gaps)
  };
}
