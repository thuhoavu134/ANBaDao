const COMBAT_DOMAIN_SCHEMA = 'hon-viet-combat/v1';

export const COMBAT_RESULT_TYPES = Object.freeze({
  DAMAGE: 'damage',
  HEAL: 'heal',
  BARRIER: 'barrier',
  BUFF_ADD: 'buffAdd',
  BUFF_REMOVE: 'buffRemove',
  BUFF_UPDATE: 'buffUpdate',
  DEATH: 'death',
  RESURRECT: 'resurrect',
  MISS: 'miss',
  NOOP: 'noop'
});

/**
 * Small, deterministic combat-domain adapter inspired by the extracted 3Q
 * PlayCtx/TeamVS/Fighter/ActionResult composition. It deliberately owns no
 * renderer, clock, RNG, network, or payment concerns.
 */
export function createCombatDomain() {
  const schema = 'hon-viet-combat/v1';
  const resultTypes = Object.freeze({
    DAMAGE: 'damage',
    HEAL: 'heal',
    BARRIER: 'barrier',
    BUFF_ADD: 'buffAdd',
    BUFF_REMOVE: 'buffRemove',
    BUFF_UPDATE: 'buffUpdate',
    DEATH: 'death',
    RESURRECT: 'resurrect',
    MISS: 'miss',
    NOOP: 'noop'
  });
  const sessions = new Map();

  function clone(value) {
    if (value === undefined) return undefined;
    return JSON.parse(JSON.stringify(value));
  }

  function textId(value, fallback = '') {
    const raw = value?.id ?? value?.pid ?? value?.sourceId ?? fallback;
    return String(raw ?? fallback);
  }

  function numeric(value, fallback = 0) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function stableCompare(a, b) {
    return String(a).localeCompare(String(b), 'en', { numeric: true });
  }

  function normalizeStatuses(statuses) {
    return (Array.isArray(statuses) ? statuses : [])
      .filter(Boolean)
      .map((status) => ({
        type: String(status.type || 'unknown'),
        stacks: numeric(status.stacks, 1),
        turns: numeric(status.turns, 0),
        power: numeric(status.power, 0),
        sourceId: status.sourceId == null ? null : String(status.sourceId)
      }))
      .sort((a, b) => stableCompare(`${a.type}:${a.sourceId || ''}`, `${b.type}:${b.sourceId || ''}`));
  }

  function snapshotUnits(units) {
    return (Array.isArray(units) ? units : [])
      .filter(Boolean)
      .map((unit, index) => ({
        id: textId(unit, `unit-${index}`),
        sourceId: unit.sourceId == null ? null : String(unit.sourceId),
        name: unit.name == null ? null : String(unit.name),
        team: unit.team == null ? null : unit.team,
        slot: numeric(unit.slot, index),
        hp: Math.max(0, numeric(unit.hp, 0)),
        maxHp: Math.max(1, numeric(unit.maxHp, 1)),
        shield: Math.max(0, numeric(unit.shield, 0)),
        energy: Math.max(0, numeric(unit.energy, 0)),
        dead: Boolean(unit.dead || numeric(unit.hp, 0) <= 0),
        statuses: normalizeStatuses(unit.statuses)
      }))
      .sort((a, b) => stableCompare(a.id, b.id));
  }

  function statusMap(statuses) {
    const map = new Map();
    for (const status of normalizeStatuses(statuses)) {
      const key = `${status.type}:${status.sourceId || ''}`;
      map.set(key, status);
    }
    return map;
  }

  function result(type, payload = {}) {
    return { type, ...payload };
  }

  function deriveResults(beforeUnits, afterUnits, action = {}) {
    const before = new Map(snapshotUnits(beforeUnits).map((unit) => [unit.id, unit]));
    const after = new Map(snapshotUnits(afterUnits).map((unit) => [unit.id, unit]));
    const ids = [...new Set([...before.keys(), ...after.keys()])].sort(stableCompare);
    const results = [];

    for (const id of ids) {
      const previous = before.get(id) || { id, hp: 0, maxHp: 1, shield: 0, dead: true, statuses: [] };
      const current = after.get(id) || previous;
      const hpDelta = numeric(current.hp) - numeric(previous.hp);
      const shieldDelta = numeric(current.shield) - numeric(previous.shield);
      if (hpDelta < 0) results.push(result(resultTypes.DAMAGE, { targetId: id, amount: Math.round(-hpDelta) }));
      if (hpDelta > 0) results.push(result(resultTypes.HEAL, { targetId: id, amount: Math.round(hpDelta) }));
      if (shieldDelta !== 0) results.push(result(resultTypes.BARRIER, { targetId: id, amount: Math.round(shieldDelta) }));

      const beforeStatuses = statusMap(previous.statuses);
      const afterStatuses = statusMap(current.statuses);
      const statusKeys = [...new Set([...beforeStatuses.keys(), ...afterStatuses.keys()])].sort(stableCompare);
      for (const key of statusKeys) {
        const oldStatus = beforeStatuses.get(key);
        const newStatus = afterStatuses.get(key);
        if (!oldStatus && newStatus) results.push(result(resultTypes.BUFF_ADD, { targetId: id, status: newStatus }));
        else if (oldStatus && !newStatus) results.push(result(resultTypes.BUFF_REMOVE, { targetId: id, status: oldStatus }));
        else if (oldStatus && newStatus && JSON.stringify(oldStatus) !== JSON.stringify(newStatus)) {
          results.push(result(resultTypes.BUFF_UPDATE, { targetId: id, before: oldStatus, status: newStatus }));
        }
      }

      const wasAlive = numeric(previous.hp) > 0 && !previous.dead;
      const isAlive = numeric(current.hp) > 0 && !current.dead;
      if (wasAlive && !isAlive) results.push(result(resultTypes.DEATH, { targetId: id }));
      if (!wasAlive && isAlive) results.push(result(resultTypes.RESURRECT, { targetId: id }));
    }

    if (!results.length) {
      results.push(action.targetId != null
        ? result(resultTypes.MISS, { targetId: String(action.targetId) })
        : result(resultTypes.NOOP));
    }
    return results;
  }

  function normalizeFighter(input = {}, index = 0) {
    const fighter = clone(input) || {};
    fighter.id = textId(fighter, `unit-${index}`);
    fighter.attr = { ...(fighter.attr || {}) };
    fighter.buff = { ...(fighter.buff || {}), list: [...(fighter.buff?.list || fighter.statuses || [])] };
    fighter.skill = { ...(fighter.skill || {}) };
    fighter.cd = { ...(fighter.cd || {}), record: { ...(fighter.cd?.record || {}) }, rewriteCfg: { ...(fighter.cd?.rewriteCfg || {}) } };
    fighter.roundVar = { ...(fighter.roundVar || {}) };
    return fighter;
  }

  function resetFighter(input = {}) {
    const fighter = normalizeFighter(input);
    fighter.cd.record = {};
    fighter.buff.list = [];
    fighter.statuses = [];
    fighter.roundVar = {};
    fighter.dead = false;
    return fighter;
  }

  function canAct(fighter = {}) {
    if (fighter.dead || numeric(fighter.hp, 1) <= 0) return false;
    const blocked = new Set(['stun', 'fear', 'silence', 'frozen']);
    const statuses = [...(fighter.statuses || []), ...(fighter.buff?.list || [])];
    return !statuses.some((status) => blocked.has(status?.type));
  }

  function createSession(options = {}) {
    const battleId = textId({ id: options.battleId }, `battle-${sessions.size + 1}`);
    const session = {
      schema,
      battleId,
      seed: options.seed == null ? null : String(options.seed),
      roundMax: Math.max(1, Math.round(numeric(options.roundMax, 15))),
      status: 'running',
      winner: null,
      reason: null,
      counters: { round: 0, move: 0, action: 0, result: 0 },
      rounds: [],
      currentRound: null,
      currentMove: null,
      events: [],
      startedAt: options.startedAt ?? null,
      finishedAt: null
    };
    sessions.set(battleId, session);
    return session;
  }

  function ensureSession(options = {}) {
    const battleId = textId({ id: options.battleId }, 'battle-1');
    const existing = sessions.get(battleId);
    return existing || createSession({ ...options, battleId });
  }

  function getSession(battleId) {
    return sessions.get(String(battleId)) || null;
  }

  function beginRound(session, roundIndex, metadata = {}) {
    if (!session) throw new TypeError('combat session is required');
    const index = Math.max(1, Math.round(numeric(roundIndex, session.counters.round + 1)));
    if (session.currentRound?.index === index) return session.currentRound;
    if (session.currentRound) finishRound(session);
    const round = { id: `${session.battleId}:r${index}`, index, moves: [], metadata: clone(metadata) || null };
    session.currentRound = round;
    session.currentMove = null;
    session.counters.round = Math.max(session.counters.round, index);
    return round;
  }

  function finishRound(session, metadata = {}) {
    if (!session?.currentRound) return null;
    const round = session.currentRound;
    round.closed = true;
    if (Object.keys(metadata).length) round.summary = clone(metadata);
    const stored = clone(round);
    session.rounds.push(stored);
    session.currentRound = null;
    session.currentMove = null;
    return stored;
  }

  function beginMove(session, options = {}) {
    const round = beginRound(session, options.roundIndex, options.roundMetadata);
    const moveIndex = round.moves.length + 1;
    const move = {
      id: `${session.battleId}:r${round.index}:m${moveIndex}`,
      index: moveIndex,
      actorId: options.actorId == null ? null : String(options.actorId),
      skillId: options.skillId == null ? null : String(options.skillId),
      kind: options.kind == null ? null : String(options.kind),
      actions: [],
      metadata: clone(options.metadata) || null
    };
    round.moves.push(move);
    session.currentMove = move;
    session.counters.move += 1;
    return move;
  }

  function recordResult(session, action, entry) {
    const type = String(entry?.type || resultTypes.NOOP);
    const typed = {
      id: `${action.id}:res${action.results.length + 1}`,
      type,
      actorId: action.actorId,
      ...clone(entry)
    };
    action.results.push(typed);
    session.events.push(typed);
    session.counters.result += 1;
    return typed;
  }

  function recordAction(session, options = {}) {
    const move = options.move || beginMove(session, {
      roundIndex: options.roundIndex,
      actorId: options.actorId,
      skillId: options.skillId,
      kind: options.kind || options.action,
      metadata: options.moveMetadata
    });
    const actionIndex = move.actions.length + 1;
    const action = {
      id: `${move.id}:a${actionIndex}`,
      index: actionIndex,
      actorId: options.actorId == null ? move.actorId : String(options.actorId),
      action: options.action == null ? null : String(options.action),
      kind: options.kind == null ? null : String(options.kind),
      targetId: options.targetId == null ? null : String(options.targetId),
      results: [],
      metadata: clone(options.metadata) || null
    };
    move.actions.push(action);
    const derived = Array.isArray(options.results)
      ? options.results
      : deriveResults(options.before, options.after, action);
    for (const entry of derived) recordResult(session, action, entry);
    session.counters.action += 1;
    session.currentMove = move;
    return action;
  }

  function finishMove(session, move = session?.currentMove, metadata = {}) {
    if (!move) return null;
    move.closed = true;
    if (Object.keys(metadata).length) move.summary = clone(metadata);
    if (session?.currentMove === move) session.currentMove = null;
    return move;
  }

  function finishBattle(session, options = {}) {
    if (!session) return null;
    if (session.currentMove) finishMove(session, session.currentMove);
    if (session.currentRound) finishRound(session);
    session.status = 'finished';
    session.winner = options.winner == null ? null : options.winner;
    session.reason = options.reason == null ? null : String(options.reason);
    session.finishedAt = options.finishedAt ?? null;
    return session;
  }

  function hash(value) {
    let h = 2166136261;
    for (const char of String(value)) {
      h ^= char.charCodeAt(0);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function selectTargets(units, options = {}) {
    const mode = String(options.mode || 'front');
    let candidates = (Array.isArray(units) ? units : []).filter(Boolean).filter((unit) => {
      if (options.team != null && unit.team !== options.team) return false;
      if (options.includeDead !== true && (unit.dead || numeric(unit.hp, 1) <= 0)) return false;
      if (typeof options.filter === 'function' && !options.filter(unit)) return false;
      return true;
    });
    const bySlot = (a, b) => numeric(a.slot, 0) - numeric(b.slot, 0) || stableCompare(textId(a), textId(b));
    if (mode === 'lowestHp') candidates.sort((a, b) => numeric(a.hp, 0) / Math.max(1, numeric(a.maxHp, 1)) - numeric(b.hp, 0) / Math.max(1, numeric(b.maxHp, 1)) || bySlot(a, b));
    else if (mode === 'highestAtk') candidates.sort((a, b) => numeric(b.atk, 0) - numeric(a.atk, 0) || bySlot(a, b));
    else if (mode === 'back') candidates.sort((a, b) => bySlot(b, a));
    else if (mode === 'random') candidates.sort((a, b) => hash(`${options.seed ?? ''}:${textId(a)}`) - hash(`${options.seed ?? ''}:${textId(b)}`) || bySlot(a, b));
    else candidates.sort(bySlot);
    if (mode === 'all') return candidates;
    const count = Math.max(1, Math.round(numeric(options.count, 1)));
    return candidates.slice(0, count);
  }

  function createCooldownState(input = {}) {
    return { record: { ...(input.record || {}) }, rewriteCfg: { ...(input.rewriteCfg || {}) } };
  }

  function setCooldown(state, skillId, readyRound) {
    if (!state || skillId == null) return state;
    state.record[String(skillId)] = Math.max(0, Math.round(numeric(readyRound, 0)));
    return state;
  }

  function getCooldown(state, skillId) {
    return Math.max(0, Math.round(numeric(state?.record?.[String(skillId)], 0)));
  }

  function handleSkillUsed(state, skill = {}, round = 0) {
    const id = String(skill.id ?? skill.skillId ?? '');
    const baseCooldown = numeric(state?.rewriteCfg?.[id], numeric(skill.cd, 0));
    const unlockRound = state?.record && Object.prototype.hasOwnProperty.call(state.record, id)
      ? getCooldown(state, id)
      : numeric(skill.unlockRound, 0);
    return setCooldown(state, id, baseCooldown + unlockRound + 1 + Math.max(0, Math.round(numeric(round, 0) - unlockRound)));
  }

  function available(state, skillId, round) {
    return !state?.record || !Object.prototype.hasOwnProperty.call(state.record, String(skillId)) || numeric(round, 0) >= getCooldown(state, skillId);
  }

  function offsetCooldown(state, amount) {
    if (!state?.record) return state;
    const delta = Math.round(numeric(amount, 0));
    for (const id of Object.keys(state.record)) state.record[id] = getCooldown(state, id) - delta;
    return state;
  }

  function streamlineReplay(session) {
    if (!session) return null;
    const rounds = [...(session.rounds || [])];
    if (session.currentRound) rounds.push(clone(session.currentRound));
    return {
      schema,
      battleId: session.battleId,
      seed: session.seed,
      roundMax: session.roundMax,
      status: session.status,
      winner: session.winner,
      reason: session.reason,
      counters: { ...session.counters },
      rounds: rounds.map((round) => ({
        id: round.id,
        index: round.index,
        moves: (round.moves || []).map((move) => ({
          id: move.id,
          index: move.index,
          actorId: move.actorId,
          skillId: move.skillId,
          kind: move.kind,
          actions: (move.actions || []).map((action) => ({
            id: action.id,
            index: action.index,
            actorId: action.actorId,
            action: action.action,
            kind: action.kind,
            targetId: action.targetId,
            results: (action.results || []).map((entry) => ({ ...entry }))
          }))
        }))
      })),
      events: (session.events || []).map((entry) => ({ ...entry }))
    };
  }

  function serializeReplay(session) {
    return JSON.stringify(streamlineReplay(session));
  }

  return {
    schema,
    resultTypes,
    snapshotUnits,
    deriveResults,
    normalizeFighter,
    resetFighter,
    canAct,
    createSession,
    ensureSession,
    getSession,
    beginRound,
    finishRound,
    beginMove,
    recordResult,
    recordAction,
    finishMove,
    finishBattle,
    selectTargets,
    createCooldownState,
    setCooldown,
    getCooldown,
    handleSkillUsed,
    available,
    offsetCooldown,
    streamlineReplay,
    serializeReplay
  };
}
