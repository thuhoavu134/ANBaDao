function clone(value) {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value));
}

function numeric(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function beginRound(session, roundIndex, metadata = {}) {
  if (!session) throw new TypeError('combat session is required');
  const index = Math.max(1, Math.round(numeric(roundIndex, session.counters.round + 1)));
  if (session.currentRound?.index === index) return session.currentRound;
  if (session.currentRound) finishRound(session);
  const round = {
    id: String(session.battleId) + ':r' + String(index),
    index,
    moves: [],
    metadata: clone(metadata) || null
  };
  session.currentRound = round;
  session.currentMove = null;
  session.counters.round = Math.max(session.counters.round, index);
  return round;
}

export function finishRound(session, metadata = {}) {
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

export function beginMove(session, options = {}) {
  const round = beginRound(session, options.roundIndex, options.roundMetadata);
  const moveIndex = round.moves.length + 1;
  const move = {
    id: String(session.battleId) + ':r' + String(round.index) + ':m' + String(moveIndex),
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

export function finishMove(session, move = session?.currentMove, metadata = {}) {
  if (!move) return null;
  move.closed = true;
  if (Object.keys(metadata).length) move.summary = clone(metadata);
  if (session?.currentMove === move) session.currentMove = null;
  return move;
}

export function createRoundManager() {
  return Object.freeze({ beginRound, finishRound, beginMove, finishMove });
}
