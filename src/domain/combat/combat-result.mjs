import { beginMove } from './round-manager.mjs';

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

function clone(value) {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value));
}

function numeric(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function textId(value, fallback = '') {
  const raw = value?.id ?? value?.pid ?? value?.sourceId ?? fallback;
  return String(raw ?? fallback);
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
    .sort((a, b) => stableCompare(
      String(a.type) + ':' + String(a.sourceId || ''),
      String(b.type) + ':' + String(b.sourceId || '')
    ));
}

function statusMap(statuses) {
  const map = new Map();
  for (const status of normalizeStatuses(statuses)) {
    const key = String(status.type) + ':' + String(status.sourceId || '');
    map.set(key, status);
  }
  return map;
}

export function createCombatResult(type, payload = {}) {
  return { type, ...payload };
}

export function snapshotCombatUnits(units) {
  return (Array.isArray(units) ? units : [])
    .filter(Boolean)
    .map((unit, index) => ({
      id: textId(unit, 'unit-' + index),
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

export function deriveCombatResults(beforeUnits, afterUnits, action = {}) {
  const before = new Map(snapshotCombatUnits(beforeUnits).map((unit) => [unit.id, unit]));
  const after = new Map(snapshotCombatUnits(afterUnits).map((unit) => [unit.id, unit]));
  const ids = [...new Set([...before.keys(), ...after.keys()])].sort(stableCompare);
  const results = [];

  for (const id of ids) {
    const previous = before.get(id) || { id, hp: 0, maxHp: 1, shield: 0, dead: true, statuses: [] };
    const current = after.get(id) || previous;
    const hpDelta = numeric(current.hp) - numeric(previous.hp);
    const shieldDelta = numeric(current.shield) - numeric(previous.shield);
    if (hpDelta < 0) results.push(createCombatResult(COMBAT_RESULT_TYPES.DAMAGE, { targetId: id, amount: Math.round(-hpDelta) }));
    if (hpDelta > 0) results.push(createCombatResult(COMBAT_RESULT_TYPES.HEAL, { targetId: id, amount: Math.round(hpDelta) }));
    if (shieldDelta !== 0) results.push(createCombatResult(COMBAT_RESULT_TYPES.BARRIER, { targetId: id, amount: Math.round(shieldDelta) }));

    const beforeStatuses = statusMap(previous.statuses);
    const afterStatuses = statusMap(current.statuses);
    const statusKeys = [...new Set([...beforeStatuses.keys(), ...afterStatuses.keys()])].sort(stableCompare);
    for (const key of statusKeys) {
      const oldStatus = beforeStatuses.get(key);
      const newStatus = afterStatuses.get(key);
      if (!oldStatus && newStatus) {
        results.push(createCombatResult(COMBAT_RESULT_TYPES.BUFF_ADD, { targetId: id, status: newStatus }));
      } else if (oldStatus && !newStatus) {
        results.push(createCombatResult(COMBAT_RESULT_TYPES.BUFF_REMOVE, { targetId: id, status: oldStatus }));
      } else if (oldStatus && newStatus && JSON.stringify(oldStatus) !== JSON.stringify(newStatus)) {
        results.push(createCombatResult(COMBAT_RESULT_TYPES.BUFF_UPDATE, { targetId: id, before: oldStatus, status: newStatus }));
      }
    }

    const wasAlive = numeric(previous.hp) > 0 && !previous.dead;
    const isAlive = numeric(current.hp) > 0 && !current.dead;
    if (wasAlive && !isAlive) results.push(createCombatResult(COMBAT_RESULT_TYPES.DEATH, { targetId: id }));
    if (!wasAlive && isAlive) results.push(createCombatResult(COMBAT_RESULT_TYPES.RESURRECT, { targetId: id }));
  }

  if (!results.length) {
    results.push(action.targetId != null
      ? createCombatResult(COMBAT_RESULT_TYPES.MISS, { targetId: String(action.targetId) })
      : createCombatResult(COMBAT_RESULT_TYPES.NOOP));
  }
  return results;
}

export function recordCombatResult(session, action, entry) {
  if (!session || !action) throw new TypeError('session and action are required');
  const typed = {
    id: String(action.id) + ':res' + String(action.results.length + 1),
    type: String(entry?.type || COMBAT_RESULT_TYPES.NOOP),
    actorId: action.actorId,
    ...clone(entry)
  };
  action.results.push(typed);
  session.events.push(typed);
  session.counters.result += 1;
  return typed;
}

export function recordCombatAction(session, options = {}) {
  if (!session) throw new TypeError('combat session is required');
  const move = options.move || beginMove(session, {
    roundIndex: options.roundIndex,
    actorId: options.actorId,
    skillId: options.skillId,
    kind: options.kind || options.action,
    metadata: options.moveMetadata
  });
  const actionIndex = move.actions.length + 1;
  const action = {
    id: String(move.id) + ':a' + String(actionIndex),
    index: actionIndex,
    actorId: options.actorId == null ? move.actorId : String(options.actorId),
    action: options.action == null ? null : String(options.action),
    kind: options.kind == null ? null : String(options.kind),
    targetId: options.targetId == null ? null : String(options.targetId),
    results: [],
    metadata: clone(options.metadata) || null
  };
  if (Array.isArray(options.rngCalls)) action.rngCalls = clone(options.rngCalls);
  if (options.rngCursor != null) action.rngCursor = clone(options.rngCursor);
  move.actions.push(action);
  const derived = Array.isArray(options.results)
    ? options.results
    : deriveCombatResults(options.before, options.after, action);
  for (const entry of derived) recordCombatResult(session, action, entry);
  session.counters.action += 1;
  session.currentMove = move;
  return action;
}
