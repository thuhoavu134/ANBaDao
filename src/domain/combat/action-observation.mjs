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
  Object.freeze({ site: 'status.fear', domain: 'rule' }),
  Object.freeze({ site: 'status.stun', domain: 'rule' }),
  Object.freeze({ site: 'status.comboStun', domain: 'rule' }),
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

function optionalNumeric(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function gap(code, boundary, message) {
  return { code, boundary, message };
}

function normalizeRngCalls(calls) {
  return (Array.isArray(calls) ? calls : []).map((call, index) => {
    if (typeof call === 'string') return { index, site: call, domain: 'unknown', cursor: null, captured: false, value: null };
    const sourceIndex = Number(call?.index);
    const normalizedIndex = Number.isFinite(sourceIndex) ? Math.max(0, Math.round(sourceIndex)) : index;
    const site = text(call?.site, 'unknown');
    const value = call?.value === undefined ? null : clone(call.value);
    return {
      index: normalizedIndex,
      site,
      domain: text(call?.domain, 'unknown'),
      cursor: call?.cursor == null ? null : Math.max(0, Math.round(numeric(call.cursor, 0))),
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
  const statusSite = action === 'fear'
    ? 'status.fear'
    : action === 'stun'
      ? 'status.stun'
      : ['contactcombo', 'combo'].includes(action)
        ? 'status.comboStun'
        : null;
  if (statusSite) {
    const entry = COMBAT_RNG_SITE_CATALOG.find((candidate) => candidate.site === statusSite);
    if (entry) sites.push(entry);
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
    rngCursor: input.rngCursor == null ? null : clone(input.rngCursor),
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
    amount: optionalNumeric(input.amount),
    flags: input.flags && typeof input.flags === 'object' && !Array.isArray(input.flags) ? clone(input.flags) : null,
    rngCursor: input.rngCursor == null ? null : clone(input.rngCursor),
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
  const allRngCalls = observation.actions.flatMap((action) => action.rngCalls);
  const ruleActions = observation.actions.filter((action) => {
    const kind = text(action.kind, 'basic').toLowerCase();
    return !['heal', 'healall', 'guardall', 'cleanseguard'].includes(kind);
  });
  const rngGapOpen = ruleActions.some((action) => {
    const expectedRuleSites = rngSitesForAction(action.kind)
      .filter((entry) => entry.domain === 'rule')
      .map((entry) => entry.site);
    const deterministicSites = new Set();
    for (const impact of action.impacts || []) {
      if (impact.flags?.forceHit || impact.flags?.forceMiss) deterministicSites.add('applyDamage.hit');
      if (impact.flags?.forceCrit) deterministicSites.add('applyDamage.crit');
    }
    const ruleCalls = action.rngCalls.filter((call) => call.domain === 'rule');
    return expectedRuleSites.some((site) => (
      !deterministicSites.has(site) &&
      !ruleCalls.some((call) => call.site === site && call.captured && call.value !== null)
    ));
  });
  const rngSites = [...new Set(allRngCalls.map((call) => call.site))].sort();
  const resultTypes = [...new Set(observation.actions.flatMap((action) => action.results.map((result) => result.type)))].sort();
  const gaps = observation.gaps.filter((entry) => entry.code !== COMBAT_OBSERVATION_GAPS.RNG_VALUE || rngGapOpen);
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
    rngCallCount: allRngCalls.length,
    capturedRngCallCount: allRngCalls.filter((call) => call.captured).length,
    capturedRuleRngCallCount: allRngCalls.filter((call) => call.domain === 'rule' && call.captured).length,
    gaps: clone(gaps)
  };
}
