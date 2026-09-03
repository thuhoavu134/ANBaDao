import { finishMove, finishRound } from './round-manager.mjs';

export const BATTLE_SESSION_SCHEMA = 'hon-viet-combat/v1';

function clone(value) {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value));
}

function numeric(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function textId(value, fallback = '') {
  const raw = value?.id ?? value?.battleId ?? value?.sessionId ?? fallback;
  return String(raw ?? fallback);
}

export function createBattleSession(options = {}, fallbackIndex = 1) {
  const battleId = textId({ id: options.battleId ?? options.sessionId }, 'battle-' + String(fallbackIndex));
  return {
    schema: BATTLE_SESSION_SCHEMA,
    battleId,
    sessionId: battleId,
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
}

export function finishBattleSession(session, options = {}) {
  if (!session) return null;
  if (session.status === 'finished') return session;
  if (session.currentMove) finishMove(session, session.currentMove);
  if (session.currentRound) finishRound(session);
  session.status = 'finished';
  session.winner = options.winner == null ? null : options.winner;
  session.reason = options.reason == null ? null : String(options.reason);
  session.finishedAt = options.finishedAt ?? null;
  return session;
}

export function createBattleSessionStore() {
  const sessions = new Map();
  return Object.freeze({
    create(options = {}) {
      const session = createBattleSession(options, sessions.size + 1);
      sessions.set(session.battleId, session);
      return session;
    },
    ensure(options = {}) {
      const battleId = textId({ id: options.battleId ?? options.sessionId }, 'battle-1');
      return sessions.get(battleId) || this.create({ ...options, battleId });
    },
    get(battleId) {
      return sessions.get(String(battleId)) || null;
    },
    has(battleId) {
      return sessions.has(String(battleId));
    },
    clear() {
      sessions.clear();
    }
  });
}
