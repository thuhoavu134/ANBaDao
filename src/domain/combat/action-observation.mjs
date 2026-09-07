import { deriveCombatResults, snapshotCombatUnits } from './combat-result.mjs';

export const COMBAT_OBSERVATION_SCHEMA = 'hon-viet-combat-observation/v1';
export const COMBAT_REPLAY_PARITY_SCHEMA = 'hon-viet-combat-replay-parity/v1';
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

function normalizeCompletion(options = {}) {
  const completion = {};
  for (const key of ['winner', 'reason', 'round', 'roundMax', 'speed']) {
    if (options[key] === undefined) continue;
    completion[key] = key === 'round' || key === 'roundMax' || key === 'speed'
      ? optionalNumeric(options[key])
      : options[key] == null ? null : text(options[key]);
  }
  return Object.keys(completion).length ? completion : null;
}

function parityRngCalls(calls) {
  return normalizeRngCalls(calls)
    .filter((call) => call.domain === 'rule')
    .map((call) => ({
      site: call.site,
      domain: call.domain,
      cursor: call.cursor,
      captured: call.captured,
      value: clone(call.value)
    }));
}

function parityResult(result) {
  if (!result || typeof result !== 'object' || Array.isArray(result)) return clone(result);
  const { id: ignored, ...rest } = result;
  return clone(rest);
}

function parityImpact(impact) {
  return {
    type: impact.type,
    subActionIndex: impact.subActionIndex,
    actorId: impact.actorId,
    targetId: impact.targetId,
    amount: impact.amount,
    flags: clone(impact.flags),
    before: clone(impact.before),
    after: clone(impact.after),
    rngCalls: parityRngCalls(impact.rngCalls),
    metadata: clone(impact.metadata)
  };
}

function parityAction(action) {
  return {
    sequence: action.sequence,
    round: action.round,
    actorId: action.actorId,
    targetId: action.targetId,
    action: action.action,
    kind: action.kind,
    snapshotBoundary: action.snapshotBoundary,
    before: clone(action.before),
    after: clone(action.after),
    finalSnapshot: clone(action.finalSnapshot),
    finalSnapshotBoundary: action.finalSnapshotBoundary,
    results: (action.results || []).map(parityResult),
    rngCalls: parityRngCalls(action.rngCalls),
    impacts: (action.impacts || []).map(parityImpact)
  };
}

function parityFingerprint(value) {
  let hash = 2166136261;
  for (const character of String(value)) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function combatObservationParityProjection(observation) {
  if (!observation || observation.schema !== COMBAT_OBSERVATION_SCHEMA) return null;
  const actions = Array.isArray(observation.actions) ? observation.actions.map(parityAction) : [];
  const normalizedCompletion = observation.completion ? normalizeCompletion(observation.completion) : null;
  const { speed: ignoredSpeed, ...completion } = normalizedCompletion || {};
  return {
    schema: COMBAT_REPLAY_PARITY_SCHEMA,
    seed: observation.seed == null ? null : text(observation.seed),
    roundMax: observation.roundMax,
    status: observation.status,
    completion: normalizedCompletion ? completion : null,
    actions
  };
}

export function combatObservationParityDigest(observation) {
  const projection = combatObservationParityProjection(observation);
  return projection ? JSON.stringify(projection) : null;
}

export function compareCombatObservations(left, right) {
  const leftProjection = combatObservationParityProjection(left);
  const rightProjection = combatObservationParityProjection(right);
  const leftDigest = leftProjection ? JSON.stringify(leftProjection) : null;
  const rightDigest = rightProjection ? JSON.stringify(rightProjection) : null;
  const summary = (projection, digest) => ({
    schema: projection?.schema ?? null,
    seed: projection?.seed ?? null,
    status: projection?.status ?? null,
    actionCount: projection?.actions?.length ?? 0,
    roundCount: [...new Set((projection?.actions || []).map((action) => action.round))].length,
    fingerprint: digest == null ? null : parityFingerprint(digest),
    roundCapReached: Boolean(
      projection?.completion?.round != null &&
      projection?.completion?.roundMax != null &&
      projection.completion.round >= projection.completion.roundMax &&
      String(projection.completion.reason || '').startsWith('round-limit')
    )
  });
  return {
    schema: COMBAT_REPLAY_PARITY_SCHEMA,
    scope: 'full-replay-rule-outcome',
    equal: leftDigest !== null && leftDigest === rightDigest,
    left: summary(leftProjection, leftDigest),
    right: summary(rightProjection, rightDigest)
  };
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
    completion: null,
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
    finalSnapshot: Array.isArray(input.finalSnapshot) ? snapshotCombatUnits(input.finalSnapshot) : null,
    finalSnapshotBoundary: Array.isArray(input.finalSnapshot)
      ? text(input.finalSnapshotBoundary, 'resolveAction.complete')
      : null,
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
  const hasBeforeSnapshot = Array.isArray(input.before);
  const hasAfterSnapshot = Array.isArray(input.after);
  const metadata = normalizeMetadata(input.metadata);
  const sourceBoundary = metadata?.sourceBoundary;
  const boundaryCaptured = Boolean(
    hasBeforeSnapshot &&
    hasAfterSnapshot &&
    sourceBoundary &&
    (input.boundaryCaptured === undefined || input.boundaryCaptured)
  );
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
    boundaryCaptured,
    snapshotBoundary: boundaryCaptured ? text(input.snapshotBoundary, sourceBoundary) : null,
    rngCalls: normalizeRngCalls(input.rngCalls),
    metadata
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
  observation.completion = normalizeCompletion(options);
  return clone(observation);
}

export function combatObservationReport(observation) {
  if (!observation || observation.schema !== COMBAT_OBSERVATION_SCHEMA) return null;
  const allRngCalls = observation.actions.flatMap((action) => action.rngCalls);
  const allImpacts = observation.actions.flatMap((action) => action.impacts || []);
  const maxObservedRound = observation.actions.reduce((max, action) => Math.max(max, numeric(action.round, 0)), 0);
  const roundsBeyondCap = observation.actions.filter((action) => numeric(action.round, 0) > observation.roundMax).length;
  const impactBoundaryCoverage = {};
  for (const impact of allImpacts) {
    const sourceBoundary = impact.metadata?.sourceBoundary;
    if (!sourceBoundary) continue;
    impactBoundaryCoverage[sourceBoundary] = (impactBoundaryCoverage[sourceBoundary] || 0) + 1;
  }
  const impactSnapshotCapturedCount = allImpacts.filter((impact) => impact.boundaryCaptured === true).length;
  const actionsWithBoundary = observation.actions.filter((action) => (
    (action.impacts || []).length > 0 &&
    (action.impacts || []).every((impact) => impact.boundaryCaptured === true)
  )).length;
  const impactBoundaryGapOpen = observation.actions.length === 0 ||
    observation.actions.some((action) => (action.impacts || []).length === 0) ||
    impactSnapshotCapturedCount !== allImpacts.length;
  const impactSnapshotBoundaryTypes = [...new Set(
    allImpacts
      .filter((impact) => impact.boundaryCaptured === true && impact.snapshotBoundary)
      .map((impact) => impact.snapshotBoundary)
  )].sort();
  const multiImpactActionCount = observation.actions.filter((action) => (action.impacts || []).length > 1).length;
  const multiHitActionCount = observation.actions.filter((action) => (
    (action.impacts || []).filter((impact) => ['damage', 'miss'].includes(impact.type)).length >= 2
  )).length;
  const impactTypeCounts = {};
  for (const impact of allImpacts) {
    const type = text(impact.type, 'unknown');
    impactTypeCounts[type] = (impactTypeCounts[type] || 0) + 1;
  }
  const impactTypeCoverage = Object.fromEntries(
    Object.entries(impactTypeCounts).sort(([left], [right]) => left.localeCompare(right))
  );
  const impactCaseCoverage = {
    damage: Boolean(impactTypeCoverage.damage),
    heal: Boolean(impactTypeCoverage.heal),
    dot: Boolean(impactTypeCoverage.dot),
    status: Boolean(impactTypeCoverage.status),
    multiHit: multiHitActionCount > 0
  };
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
  const finalSnapshotActionCount = observation.actions.filter((action) => Array.isArray(action.finalSnapshot)).length;
  const finalSnapshotGapOpen = observation.actions.length === 0 || finalSnapshotActionCount !== observation.actions.length;
  const finalSnapshotBoundaryTypes = [...new Set(
    observation.actions
      .filter((action) => Array.isArray(action.finalSnapshot) && action.finalSnapshotBoundary)
      .map((action) => action.finalSnapshotBoundary)
  )].sort();
  const gaps = observation.gaps.filter((entry) => (
    (entry.code !== COMBAT_OBSERVATION_GAPS.FINAL_ACTION_SNAPSHOT || finalSnapshotGapOpen) &&
    (entry.code !== COMBAT_OBSERVATION_GAPS.PER_IMPACT_BOUNDARY || impactBoundaryGapOpen) &&
    (entry.code !== COMBAT_OBSERVATION_GAPS.RNG_VALUE || rngGapOpen)
  ));
  const completion = observation.completion ? normalizeCompletion(observation.completion) : null;
  const replayDigest = combatObservationParityDigest(observation);
  const roundCapReached = Boolean(
    completion?.round != null &&
    completion?.roundMax != null &&
    completion.round >= completion.roundMax &&
    String(completion.reason || '').startsWith('round-limit') &&
    roundsBeyondCap === 0
  );
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
    directBoundaryCount: Object.values(impactBoundaryCoverage).reduce((total, count) => total + count, 0),
    directBoundaryTypes: Object.keys(impactBoundaryCoverage).sort(),
    impactBoundaryCoverage,
    impactSnapshotCoverage: {
      captured: impactSnapshotCapturedCount,
      expected: allImpacts.length,
      actions: observation.actions.length,
      actionsWithBoundary,
      complete: !impactBoundaryGapOpen
    },
    impactSnapshotBoundaryTypes,
    impactTypeCoverage,
    impactCaseCoverage,
    multiImpactActionCount,
    multiHitActionCount,
    finalSnapshotCoverage: {
      captured: finalSnapshotActionCount,
      expected: observation.actions.length,
      complete: !finalSnapshotGapOpen
    },
    finalSnapshotBoundaryTypes,
    roundMax: observation.roundMax,
    maxObservedRound,
    roundsBeyondCap,
    roundCapReached,
    completion,
    replayParity: {
      schema: COMBAT_REPLAY_PARITY_SCHEMA,
      scope: 'full-replay-rule-outcome',
      fingerprint: replayDigest == null ? null : parityFingerprint(replayDigest),
      actionCount: observation.actions.length,
      roundCount: [...new Set(observation.actions.map((action) => action.round))].length,
      roundCapReached
    },
    rngSites,
    rngCallCount: allRngCalls.length,
    capturedRngCallCount: allRngCalls.filter((call) => call.captured).length,
    capturedRuleRngCallCount: allRngCalls.filter((call) => call.domain === 'rule' && call.captured).length,
    gaps: clone(gaps)
  };
}
